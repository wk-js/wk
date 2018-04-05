'use strict';

const when      = require('when')
const Print     = require('./print')
const ARGParser = require('./arg-parser')
const _         = require('./utils/object')

class TaskManager {

  constructor() {
    this.run = this.run.bind(this)
  }

  run(nameOrTask, argv) {
    if (!nameOrTask) return when(null)

    let tsk

    if (typeof nameOrTask === 'string') {
      tsk = this._resolveTask( nameOrTask )
      tsk.argv = _.merge( tsk.argv, argv )
    } else {
      tsk = { task: nameOrTask, argv: argv }
    }

    if (!tsk) {
      return when.promise(function(resolve, reject) {
        const err = new Error(Print.red(`Cannot run '${nameOrTask}' task`))
        reject(err)
      })
    }

    // Execute the task only
    return tsk.task.invoke( tsk.argv )
  }

  serie() {

    const tasks = this._resolve(arguments)

    if (tasks.length === 0) {
      Print.error('No task found')
      return when(false)
    }

    this._verbose(tasks, 'serie')

    return when.reduce(tasks, (function(results, tsk) {
      return this.run(tsk.task, tsk.argv)
    }).bind(this), [])

  }

  parallel() {
    const tasks = this._resolve(arguments)

    if (tasks.length === 0) {
      Print.error('No task found')
      return when(false)
    }

    this._verbose(tasks, 'parallel')

    return when.map(tasks, (function(tsk) {
      return this.run(tsk.task, tsk.argv)
    }).bind(this))

  }

  _resolve(names) {

    if (names.length === 1 && Array.isArray(names[0])) {
      names = names[0]
    }

    const tasks = []

    for (let i = 0, res = null, len = names.length; i < len; i++) {
      if (typeof names[i] === 'object') {
        tasks.push( names[i] )
      } else if (typeof names[i] === 'string') {
        res = this._resolveTask( names[i] )
        if (res) tasks.push( res )
      }
    }

    return tasks

  }

  _resolveTask( taskName ) {
    // Parse task name
    const argv = ARGParser._softParse(taskName.split(' '))
    const name = argv._[0]

    const task = wk.defaultNamespace.resolveTask(name)

    if (task) {
      return {
        task: task,
        argv: _.merge( _.merge({}, task.argv), argv )
      }
    }

    return null
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

  _verbose(tasks, sequence) {

    const names = tasks.map(function(tsk) {
      return Print.magenta(`[${tsk.path}]`)
    })

    Print.debug('Execute tasks' + ` ${names.join(' ')} ` + Print.green(`(${sequence})`) )

  }

}

module.exports = new TaskManager