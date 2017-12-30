'use strict'

const Task      = require('../task')
const Namespace = require('../namespace')
const { guid } = require('lol/utils/guid')

function NOOP() {}

module.exports = {

  task() {
    let name      = guid(),
    prerequisites = [],
    options       = {},
    action        = NOOP

    for (const i in arguments) {
      if (typeof arguments[i] === 'string')
        name = arguments[i]

      if (typeof arguments[i] === 'function')
        action  = arguments[i]

      if (Array.isArray(arguments[i]))
        prerequisites = arguments[i]

      if (!Array.isArray(arguments[i]) && typeof arguments[i] === 'object')
        options = arguments[i]
    }

    options.description = options.description || this.currentDescription
    options.context = this

    const tsk = new Task(name, prerequisites, options, action)
    tsk.namespace = this.currentNamespace
    tsk.link()

    return tsk
  },

  namespace(name, closure) {
    const current = this.currentNamespace
    let ns        = current.children[name]
    if (!ns) ns   = new Namespace(name, current)
    current.children[name] = ns
    this.currentNamespace  = ns
    closure.call(ns)

    // If the namespace as a default task
    // the path to the namespace will execute the default task
    if (ns.tasks.default) {
      const tsk = ns.tasks.default
      tsk.unlink()
      tsk.namespace = ns.parent
      tsk.options.taskName    = ns.name
      tsk.options.description = tsk.description || null
      tsk.link()
    }

    this.currentNamespace   = current
    this.currentDescription = null

    return ns
  },

  /**
   * Set the current description for the next task initialization
   *
   * @param {String} desc
   */
  desc(desc) {
    this.currentDescription = desc
  }

}