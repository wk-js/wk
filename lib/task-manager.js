'use strict';

const when      = require('when')
const Print     = require('./print')
const ARGParser = require('./arg-parser')
const _         = require('./utils/object')

const pipeline = require('when/pipeline')

class TaskManager {

  constructor() {
    this.run = this.run.bind(this)
  }

  run(nameOrTask, options) {
    if (!nameOrTask) return

    let tsk = nameOrTask

    if (typeof tsk === 'string') {
      tsk = wk.currentNamespace.resolveTask(nameOrTask)
    }

    if (!tsk) {
      return when.promise(function(resolve, reject) {
        const err = new Error(Print.red(`Cannot run '${nameOrTask}' task`))
        reject(err)
      })
    }

    // Execute the task only
    return tsk.invoke(options)

  }

  serie() {

    const tasks = this._resolve(arguments)

    if (tasks.length === 0) {
      Print.error('No task found')
      return when(false)
    }

    this._verbose(tasks, 'serie')

    return when.reduce(tasks, (function(results, res) {
      return when.promise((resolve, reject) => {
        this.run(res.task, res.options).then((value) => {
          results.push( value )
          resolve(results)
        }).catch(reject)
      })
    }).bind(this), [])

  }

  parallel() {
    const tasks = this._resolve(arguments)

    if (tasks.length === 0) {
      Print.error('No task found')
      return when(false)
    }

    this._verbose(tasks, 'parallel')

    return when.map(tasks, (function(res) {
      return this.run(res.task, res.options)
    }).bind(this))

  }

  _resolve(names) {

    if (names.length === 1 && Array.isArray(names[0])) {
      names = names[0]
    }

    const tasks = []

    for (let i = 0, res = null, len = names.length; i < len; i++) {
      if (typeof names[i] === 'object') {
        tasks.push({ task: names[i], argv: names[i].options.argv })
      } else if (typeof names[i] === 'string') {

        // Parse task name
        const argv = ARGParser._softParse(ARGParser.split(names[i]))
        const name = argv._[0]

        res = wk.defaultNamespace.resolveTask(name)

        if (res) tasks.push({
          task: res,
          options: { argv: argv }
        })
      }
    }

    return tasks

  }


  _visible(paths) {
    if (!Array.isArray(paths)) return []

    let tsk = null
    return paths.filter(function(path) {
      tsk = wk.defaultNamespace.resolveTask(path)
      if (!tsk) {
        Print.warn(`Task [${path}] does not exist`)
        return false
      }

      if (!tsk.visible) {
        Print.warn(`[${tsk.path}] can't be executed by the user.`)
      }

      return tsk.visible
    })
  }

  _verbose(results, sequence) {

    const names = results.map(function(res) {
      return Print.magenta(`[${res.task.path}]`)
    })

    Print.debug('Execute tasks' + ` ${names.join(' ')} ` + Print.green(`(${sequence})`) )

  }

}

module.exports = new TaskManager