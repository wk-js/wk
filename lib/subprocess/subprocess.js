'use strict'

const MemoryStream = require('../utils/memory-stream')
const spawn        = require('child_process').spawn
const guid         = require('lol/utils/guid').guid
const EventEmitter = require('eventemitter3')
const when         = require('when')
const { expose }   = require('lol/utils/object')

class Subprocess {

  constructor(cmd, opts) {
    this.execute   = this.execute.bind(this)
    this.error      = this.error.bind(this)
    this.exit       = this.exit.bind(this)
    this._onSIGINT = this._onSIGINT.bind(this)

    this.name       = guid()
    this.cmd        = cmd
    this.execObject = {}
    this.code       = null
    this.ps         = null
    this.opts       = {}

    this.events = new EventEmitter

    this.setOptions(opts || {})

    this._generatePromise()
  }

  get name() {
    return this._name
  }

  set name(v) {
    this._name = v
  }

  getCommand() {
    // Thanks mde tip
    // https://github.com/jakejs/jake/blob/master/lib/utils/index.js#L187
    let cmd  = '/bin/sh'
    let args = [ '-c', this.cmd ]
    if (process.platform === 'win32') {
      // cmd  = 'cmd'
      // args = [ '/c', this.cmd ]
      cmd  = 'bash'
      args = [ '-c', this.cmd ]
    }

    return { cli: cmd, args: args }
  }

  setOptions(opts) {

    const DEFAULT = {
      use_color: true,
      rejectOnError: false,
      interactive: false,
      printStdout: true,
      printStderr: true
    }

    opts = Object.assign({
      encoding: 'utf-8'
    }, DEFAULT, opts)

    Object.assign(this, expose(opts, Object.keys(DEFAULT)))
    Object.assign(this.opts, opts)
  }

  execute() {
    if (this.status !== Subprocess.STATUS.PENDING) return

    this.status = Subprocess.STATUS.PROCESSING

    this._configure()

    const opts    = this.opts
    const GUID    = this.name
    const command = this.getCommand()

    const ps = spawn(command.cli, command.args, opts)
    ps.GUID = GUID
    this.ps = ps
    this.events.emit('start', command.cli + ' ' + command.args.join(' '))
    this._addListeners()

    return ps

  }

  error( value ) {

    let err
    if (value) {
      if (value instanceof Error) err = value
      else if ( typeof value === 'string' ) err = new Error( value )
      else err = new Error( value.toString() )
    } else {
      err = new Error()
    }

    this.exit(null, null, err)

  }

  exit(code, signal, err) {
    if (this.status !== Subprocess.STATUS.PROCESSING) return
    this.status = Subprocess.STATUS.DONE

    this.code = code

    const response = {
      id: this.name,
      code: code,
      stdout: '',
      stderr: '',
      err: err
    }

    function finish(result) {
      if ((err || this.code !== 0) && this.rejectOnError) {
        wk.Print.error('Unexpected exit with code:', this.code)
        this.reject(result)
      } else {
        this.resolve(result)
      }

      this.events.emit('exit', result)
    }

    if (this.ps.stdout || this.ps.stderr) {
      // Wait stream finished
      this.streamPromise.then(() => {
        response.stdout = this.stdoutStream.getData(this.opts.encoding)
        response.stderr = this.stderrStream.getData(this.opts.encoding)
        finish.call(this, response)
      })

      return
    }

    finish.call(this, response)
  }


  kill() {
    if (this.ps) this.ps.kill()
  }

  _generatePromise() {
    this.promise = when.promise((resolve, reject) => {
      this.status  = Subprocess.STATUS.PENDING
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

    ps.on('error', this.error)
    ps.on('exit', this.exit)

    // process.on('SIGINT', this._onSIGINT)

    if (ps.stdout) {
      ps.stdout.pipe(this.stdoutStream)
      ps.stdout.on('data', (data) => {
        this.events.emit('stdout', data)
        if (this.printStdout) {
          process.stdout.write(data)
          // wk.Print.log(data.toString('utf-8'))
        }
      })
    }

    if (ps.stderr) {
      ps.stderr.pipe(this.stderrStream)
      ps.stderr.on('data', (data) => {
        this.events.emit('stderr', data)
        if (this.printStderr) {
          process.stderr.write(data)
          // wk.Print.warn(data.toString('utf-8'))
        }
      })
    }
  }

  _removeListeners() {
    const ps = this.ps

    ps.removeListener('error', this.error)
    ps.removeListener('exit', this.exit)

    process.removeListener('SIGINT', this._onSIGINT)

    if (ps.stdout) {
      if (this.printStdout) {
        ps.stdout.removeListener('data', (data) => {
          console.log(data.toString('utf-8'))
        })
      }
    }

    if (ps.stderr) {
      if (this.printStderr) {
        ps.stderr.removeListener('data', (data) => {
          console.log(data.toString('utf-8'))
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

  _onSIGINT() {
    process.removeListener('SIGINT', this._onSIGINT)
    this.kill()
  }

}

Subprocess.STATUS = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  FAIL: 'fail',
  DONE: 'done'
}

module.exports = Subprocess