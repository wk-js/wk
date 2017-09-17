'use strict';

const { merge, clone } = require('lol/utils/object')
const { Parser } = require('wk-argv-parser')
const { map } = require('./utils/concurrent')
const when = require('when')
const Task = require('./tasks/task')

class TaskManager {

  constructor() {
    this.run      = this.run.bind(this)
    this.serie    = this.serie.bind(this)
    this.parallel = this.parallel.bind(this)
  }

  run(nameOrTask, options) {

    let tsk = nameOrTask

    if (typeof tsk === 'string') {
      const res = this._resolveTask(nameOrTask)

      if (res) {
        tsk     = res.task
        options = res.options
      }
    }

    if (!tsk) {
      return when.promise(function(resolve, reject) {
        const err = new Error(wk.Print.red(`Cannot run '${nameOrTask}' task`))
        reject(err)
      })
    }

    // Execute the task only
    return tsk.invoke(null, options)

  }

  serie() {

    const tasks = this._resolve(arguments)

    if (tasks.length === 0) {
      wk.Print.error('No task found')
      return when(false)
    }

    return this._serie(tasks)

  }

  parallel() {

    const tasks = this._resolve(arguments)

    if (tasks.length === 0) {
      wk.Print.error('No task found')
      return when(false)
    }

    return this._parallel(tasks)

  }

  _serie(tasks) {

    this._verbose(tasks, 'serie')

    const results = []

    return when.reduce(tasks, (r, res) => {
      res.options.result = r
      res.options.preReqResults = results
      return this.run(res.task, res.options).then((value) => {
        results.push( value )
        return value
      })
    }, undefined).then(() => results)

  }

  _parallel(tasks) {

    this._verbose(tasks, 'parallel')

    return map(tasks, wk.concurrency, (res) => {
      return this.run(res.task, res.options)
    })

  }

  _resolve(names) {

    if (names.length === 1 && Array.isArray(names[0])) {
      names = names[0]
    }

    const tasks = []

    for (let i = 0, res = null, len = names.length; i < len; i++) {
      res = this._resolveTask(names[i])
      if (res) tasks.push( res )
    }

    return tasks

  }

  _resolveTask(name) {

    if (name instanceof Task) {
      return {
        task: name,
        options: clone(name.options)
      }
    } else if (typeof name === 'string') {
      const argv = Parser.parse(name).params
      name       = argv._[0]

      const tsk = wk.defaultNamespace.resolveTask(name)

      if (tsk) return {
        task: tsk,
        options: merge(clone(tsk.options), { argv: argv })
      }
    }

    return null

  }

  _verbose(results, sequence) {

    const names = results.map(function(res) {
      return wk.Print.magenta(`[${res.task.getPath()}]`)
    })

    wk.Print.debug('Execute tasks' + ` ${names.join(' ')} ` + wk.Print.green(`(${sequence})`) )

  }

}

module.exports = new TaskManager