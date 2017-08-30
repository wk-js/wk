'use strict'

const when        = require('when')
const SubProcess  = require('./subprocess')

class ProcessManager {

  constructor() {
    this._onBeforeExit = this._onBeforeExit.bind(this)
    this.execute       = this.execute.bind(this)
    this.serie         = this.serie.bind(this)
    this.parallel      = this.parallel.bind(this)

    this.processes = {}

    this.activate()
  }

  activate() {
    process.on('beforeExit', this._onBeforeExit)
    process.on('SIGINT', this._onBeforeExit)
    // process.on('uncaughtException', this._onBeforeExit)
  }

  desactivate() {
    process.removeListener('beforeExit', this._onBeforeExit)
  }

  execute( strOrArr, opts ) {

    opts = opts || {}

    if (Array.isArray(strOrArr)) {
      const arr = strOrArr
      if (arr.length === 1) {
        return this.run( this._resolve(arr)[0] )
      }

      if (opts.sequence === 'parallel') {
        return this.parallel.apply(this, arr)
      }
      return this.serie.apply(this, arr)
    }

    if (typeof strOrArr === 'object' && !Array.isArray(strOrArr)) {
      const ps = this._resolve([strOrArr])[0]
      return this.run( ps )
    } else if (typeof strOrArr === 'string') {
      const ps = this._resolve([ Object.assign(opts, { command: strOrArr }) ])[0]
      return this.run( ps )
    }

  }

  create(cmd, opts) {
    return new SubProcess(cmd, opts)
  }

  serie() {
    const processes = this._resolve(arguments)
    const results   = []

    const addResult = function(result) {
      results.push(result)
      return results
    }

    return when.reduce(processes, (res, ps) => {
      return this.run(ps).then(addResult)
    }, results)
  }

  parallel() {
    const processes = this._resolve(arguments)

    return when.map(processes, (ps) => {
      return this.run(ps)
    })
  }

  run(ps) {
    this.processes[ps.name] = ps

    ps.events.on('exit', (p) => {
      delete this.processes[p.name]
    })

    ps.execute()

    return ps.promise
  }

  _onBeforeExit() {
    for (var k in this.processes) {
      this.processes[k].kill()
    }

    // setTimeout(() => {
    //   if (Object.keys(this.processes).length > 0) {
    //     this._onBeforeExit()
    //   } else {
    //     process.exit()
    //   }
    // }, 10)
  }

  _resolve(cmds) {

    if (cmds.length === 1 && Array.isArray(cmds[0])) {
      cmds = cmds[0]
    }

    const processes = []

    let cmd, ps
    for (let i = 0, len = cmds.length; i < len; i++) {

      cmd = cmds[i]

      if (Array.isArray(cmd)) {
        ps = new SubProcess(cmd[0], cmd[1])
      } else if (typeof cmd === 'object' && !Array.isArray(cmd)) {
        const cmmnd   = cmd.command
        const options = cmd
        delete options.command
        ps = new SubProcess(cmmnd, options)
      } else if (typeof cmd === 'string') {
        ps = new SubProcess(cmd)
      }

      if (ps) processes.push( ps )

      ps = null
    }

    return processes
  }

}

module.exports = new ProcessManager