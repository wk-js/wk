'use strict'

const fs           = require('fs')
const MemoryStream = require('./utils/memory-stream')
const spawn        = require('child_process').spawn
const guid         = require('./utils/guid').guid
const sanitize     = require('sanitize-filename')
const EventEmitter = require('events').EventEmitter
const pid_path     = require('./config/paths').pids_path
const path         = require('path')
const when         = require('when')
const Print        = require('./print')

const NOOP = function() {}

class ProcessExec extends EventEmitter {

  constructor(cmd, opts) {
    super()
    this.execute   = this.execute.bind(this)
    this._onSIGINT = this._onSIGINT.bind(this)

    this.cmd        = cmd
    this.execObject = {}
    this.code       = null
    this.ps         = null
    this.opts       = {}

    this.setOptions(opts || {})

    this._generatePromise()
  }

  get name() {
    return sanitize(this._name, { replacement: '_' })
  }

  set name(v) {
    this._name = v
  }

  setOptions(opts) {

    this._merge(opts, {
      name: guid(),
      use_color: true,
      breakOnError: false,
      interactive: false,
      printStdout: true,
      printStderr: true
    })

    opts = Object.assign({
      encoding: 'utf8'
    }, opts)

    this.opts = Object.assign(this.opts, opts)
  }

  execute() {
    if (this.status !== ProcessExec.STATUS.PENDING) return

    this.status = ProcessExec.STATUS.PROCESSING

    this._configure()

    const opts = this.opts
    const GUID = this.name

    // Thanks mde tip
    // https://github.com/jakejs/jake/blob/master/lib/utils/index.js#L187
    let cmd  = '/bin/sh'
    let args = [ '-c', this.cmd ]
    if (process.platform === 'win32') {
      cmd  = 'cmd'
      args = [ '/c', this.cmd ]
    }

    const ps = spawn(cmd, args, opts)
    ps.GUID = GUID
    this.ps = ps
    // this._createFile()
    this.emit('start')
    this._addListeners()

    return ps

  }

  end( code ) {
    if (this.status !== ProcessExec.STATUS.PROCESSING) return
    this.status = ProcessExec.STATUS.DONE

    this.code = code
    // this._deleteFile()

    if (code !== 0) Print.warn('Unexpected exit with code :', code)


    let stdout = null
    let stderr = null
    const res  = this.resolve

    if (this.ps.stdout || this.ps.stderr) {
      // Wait stream finished
      this.streamPromise.then(() => {
        stdout = this.stdoutStream.getData(this.opts.encoding)
        stderr = this.stderrStream.getData(this.opts.encoding)

        res({code: code, stdout: stdout, stderr: stderr})
        this.emit('end', this, code, stdout, stderr)
      })
    } else {
     res({ code: this.code, stdout: null, stderr: null })
     this.emit('end', this, code, stdout, stderr)
    }

    this._removeListeners()
    this.resolve = null
    this.reject  = null
  }

  fail( value ) {
    if (this.status !== ProcessExec.STATUS.PROCESSING) return

    this.status = ProcessExec.STATUS.FAIL

    let err
    if (value) {
      if (value instanceof Error) err = value
      else if ( typeof value === 'string' ) err = new Error( value )
      else err = new Error( value.toString() )
    } else {
      err = new Error()
    }

    if (this.breakOnError) fail( err )

    this.reject( err )
    this.resolve = null
    this.reject  = null
    // this.ps      = null

    this.emit('error', err)
  }

  kill() {
    if (this.ps) this.ps.kill()
  }

  _merge(opts, dfts) {
    const merge = {}

    for (const key in dfts) {
      if (opts.hasOwnProperty(key)) {
        merge[key] = opts[key]
        delete opts[key]
      } else {
        merge[key] = dfts[key]
      }
    }

    Object.assign( this, merge )
  }

  _generatePromise() {
    this.promise = when.promise((resolve, reject) => {
      this.status  = ProcessExec.STATUS.PENDING
      this.resolve = resolve
      this.reject  = reject

      this.stdoutStream = new MemoryStream(this.name+'_stdout')
      this.stderrStream = new MemoryStream(this.name+'_stderr')

      this.streamPromise = when.all([
        when.promise((resolve) => { this.stdoutStream.on('finish', resolve) }),
        when.promise((resolve) => { this.stderrStream.on('finish', resolve) })
      ])
    })
  }

  _addListeners() {
    const ps = this.ps

    ps.on('error', (data) => {
      this.fail( data )
    })

    ps.on('exit', (code) => {
      this.end( code )
    })

    process.on('SIGINT', this._onSIGINT)

    if (ps.stdout) {
      ps.stdout.pipe(this.stdoutStream)
      ps.stdout.on('data', (data) => {
        this.emit('stdout', data)
        if (this.printStdout) {
          Print.log(data.toString('utf-8'))
        }
      })
    }

    if (ps.stderr) {
      ps.stderr.pipe(this.stderrStream)
      ps.stderr.on('data', (data) => {
        this.emit('stderr', data)
        if (this.printStderr) {
          Print.warn(data.toString('utf-8'))
        }
      })
    }
  }

  _removeListeners() {
    const ps = this.ps

    ps.removeListener('error', (data) => {
      this.fail( data )
    })

    ps.removeListener('exit', (code) => {
      this.end( code )
    })

    process.removeListener('SIGINT', this._onSIGINT)

    if (ps.stdout) {
      if (this.printStdout) {
        ps.stdout.removeListener('data', (data) => {
          Print.log(data.toString('utf-8'))
        })
      }
    }

    if (ps.stderr) {
      if (this.printStderr) {
        ps.stderr.removeListener('data', (data) => {
          Print.error(data.toString('utf-8'))
        })
      }
    }

  }

  _configure() {
    this.opts.env = this.opts.env || {}
    this.opts.env = Object.assign(this.opts.env, process.env)

    if (this.use_color) {
      this.opts.env.FORCE_COLOR = true
    }

    if (this.interactive) {
      this.opts.stdio = 'inherit'
    }
  }

  _createFile() {
    const pth = path.join( pid_path, `${this.name}.pid` )
    const stream = fs.createWriteStream(pth)
    stream.write(this.cmd)
    stream.write('\n')
    stream.write(this.ps.pid.toString())
    stream.end()
  }

  _deleteFile() {
    const pth = path.join( pid_path, `${this.name}.pid` )
    if (fs.existsSync(pth)) fs.unlinkSync(pth)
  }

  _onSIGINT() {
    process.removeListener('SIGINT', this._onSIGINT)
    this.kill()
  }

}

ProcessExec.STATUS = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  FAIL: 'fail',
  DONE: 'done'
}

module.exports = ProcessExec