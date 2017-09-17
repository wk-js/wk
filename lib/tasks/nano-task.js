'use strict'

const when    = require('when')
const { map } = require('../utils/concurrent.js')

function createNanoTask(action, context) {
  return function NanoTask(result) {
    return when.promise(function(resolve, reject) {
      context = context || {}
      context.result = result
      action.call(context, resolve, reject)
    })
  }
}

function prepare(tasks, order) {
  if (!Array.isArray(order)) {
    order = Object.keys(tasks)
  }

  return order.map(function(name) {
    if (tasks[name].name == 'NanoTask') {
      return tasks[name]
    }
    return createNanoTask(tasks[name])
  })
}

function serie(tasks, order) {
  const tsks = prepare(tasks, order)

  const results = []

  return when.reduce(tsks, (result, tsk) => {
    return tsk(result).then(function(val) {
      results.push( val )
      return val
    })
  }, results).then(() => {
    return results
  })
}

function parallel(tasks, order) {
  const tsks = prepare(tasks, order)

  return map(tsks, 3, (tsk) => {
    return tsk()
  })
}

module.exports = {
  createNanoTask: createNanoTask,
  serie: serie,
  parallel: parallel
}