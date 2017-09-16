'use strict'

const when         = require('when')
const guard        = require('when/guard')
const whenParallel = require('when/parallel')

function parallel(tasks, guard_count) {
  const guardTask    = guard.bind(null, guard.n(guard_count))
  const guardedTasks = tasks.map(guardTask)

  return whenParallel(guardedTasks)
}

function map(array, guard_count, mapFn) {
  const guardedMapFn = guard(guard.n(guard_count), mapFn)
  return when.map(array, guardedMapFn)
}

module.exports = { parallel, map }