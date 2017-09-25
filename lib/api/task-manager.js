'use strict'

const when = require('when')
const { Parser }
= require('wk-argv-parser')

function resolveTask(str, ignorePrerequisites) {
  const params = Parser.parse(str).params
  const name   = params._[0]
  const tsk    = this.getTask(name)

  if (!tsk) return false
  return getNanoTask( tsk, params, ignorePrerequisites )
}

function getNanoTask(tsk, params, ignorePrerequisites) {
  if (!ignorePrerequisites && tsk.prerequisites.length > 0) {
    return tsk.invokeTask( params )
  }

  return tsk.executeTask( params )
}

function prepareTasks() {
  const names = Array.isArray(arguments[0]) ?
  arguments[0] : Array.prototype.slice.apply(arguments)

  const tasks = {}
  const order = []

  const str_name_params = names.map((str) => {
    const params = Parser.parse(str).params
    const name   = params._[0]
    return { str, name, params }
  })

  const tmpTasks = this.getTasks({
    tasks: str_name_params.map((o) => o.name)
  })

  str_name_params.forEach((o) => {
    if (!tmpTasks[o.name]) return

    const key = `${o.str}`

    if (tasks.hasOwnProperty(key)) {
      order.push( key )
      return
    }

    const tsk = getNanoTask(tmpTasks[o.name], o.params)

    order.push( key )
    tasks[key] = tsk
  })

  return { tasks, order }
}

module.exports = {

  serie() {
    const { tasks, order } = prepareTasks.apply(this, arguments)
    return this.wkno.serie(tasks, order, {})
  },

  parallel() {
    const { tasks, order } = prepareTasks.apply(this, arguments)
    return this.wkno.parallel(tasks, order, {})
  },

  run(str, ignorePrerequisites) {
    const tsk = resolveTask.call(this, str, ignorePrerequisites)
    if (!tsk) return when.reject(new Error(`No task "${str}" found.`))
    return tsk.call()
  }

}