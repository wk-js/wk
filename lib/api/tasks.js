'use strict'

const { expose } = require('lol/utils/object')

function getTasks(ns) {
  const tsks = {}

  for (const key in ns.tasks) {
    tsks[ns.tasks[key].getPath()] = ns.tasks[key]
  }

  for (const k in ns.children) {
    Object.assign(tsks, getTasks(ns.children[k]))
  }

  return tsks
}

module.exports = {

  getTasks(optionKey) {
    const tasks = getTasks(this.rootNamespace)
    if (!optionKey) return tasks

    const names = Object.keys(tasks).filter((key) => {
      return tasks[key].options[optionKey]
    })

    return expose(tasks, names)
  },

  getTask(key) {
    return getTasks(this.rootNamespace)[key]
  }

}