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

  run(nameOrTask, options, context) {

    if (context) {
      let ctx
      if (typeof context == 'string') {
        ctx = wk.context(context)
      } else {
        ctx = context
      }

      ctx.open()
      const promise = wk.run(nameOrTask, options)
      promise.done(ctx.close)
      return promise
    }

    let tsk

    if (nameOrTask instanceof Task) {
      tsk = nameOrTask
    } else if (typeof nameOrTask == 'string') {
      const res = this._resolveTask(nameOrTask)

      if (res) {
        tsk     = res.task
        options = merge(res.options, options || {})
      }
    }

    if (!tsk) {
      return when.promise(function(resolve, reject) {
        const err = new Error(wk.Print.red(`Cannot run '${nameOrTask}' task`))
        reject(err)
      })
    }

    // Execute the task only
    return tsk.invoke(options)

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

    wk.Print.debug(`${wk.Print.green(`${sequence}`)} ${names.join(' ')}` )

  }

}

module.exports = new TaskManager