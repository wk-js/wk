'use strict'

const when = require('when')
const { Parser }
= require('wk-argv-parser')

function resolveTask(str, ignorePrerequisites) {
  const params = Parser.parse(str).params
  const name   = params._[0]

  const tsk = this.getTask(name)
  if (!tsk) return when.reject(new Error(`No task "${str}" found.`))

  const presenter = tsk.presenter(params)

  if (!ignorePrerequisites && tsk.prerequisites.length > 0) {
    return this.wkno.task((resolve, reject) => {
      const p = this[tsk.options.preReqSequence](tsk.prerequisites)

      p.then((values) => {
        return this.wkno.task.apply(null, presenter).call(null, values)
      })

      p.catch(reject)
    })
  }

  return this.wkno.task.apply(null, presenter)
}

function prepareTasks() {
  const names = Array.isArray(arguments[0]) ?
  arguments[0] : Array.prototype.slice.apply(arguments)

  const tasks = {}
  const order = []

  names.forEach((str) => {
    const tsk = resolveTask.call(this, str)
    if (!tsk) return

    const key = `[${tsk.guid}] ${str}`
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