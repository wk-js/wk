'use strict'

const { expose } = require('lol/utils/object')

function getTasks(ns, names) {
  const tsks = {}

  for (const key in ns.tasks) {
    if (names && names.indexOf(ns.tasks[key].getPath()) == -1) {
      continue
    }

    tsks[ns.tasks[key].getPath()] = ns.tasks[key]
  }

  for (const k in ns.children) {
    Object.assign(tsks, getTasks(ns.children[k], names))
  }

  return tsks
}

module.exports = {

  getTasks(options) {
    options = options || {}

    const tasks = getTasks(this.rootNamespace, options.tasks)
    if (!options.optionsKey) return tasks

    const names = Object.keys(tasks).filter((key) => {
      return tasks[key].options[options.optionsKey]
    })

    return expose(tasks, names)
  },

  getTask(key) {
    return getTasks(this.rootNamespace)[key]
  }

}