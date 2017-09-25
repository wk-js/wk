'use strict'

const SubProcessManager = require('../subprocess/subprocess-manager')
const Task = require('../task')
const { template } = require('lol/utils/string')

function NOOP() {}

module.exports = {

  exec() {
    SubProcessManager.execute.apply(arguments)
  },

  createExec() {
    SubProcessManager.create.apply(arguments)
  },

  taskProcess() {
    const name    = arguments[0]
    let command   = undefined,
    prerequisites = [],
    options       = {},
    callback      = NOOP

    for (const i in arguments) {
      if (typeof arguments[i] == 'string' && typeof name == 'string')
        command = arguments[i]

      if (Array.isArray(arguments[i]))
        prerequisites = arguments[i]

      if (!Array.isArray(arguments[i]) && typeof arguments[i] == 'object')
        options = arguments[i]

      if (typeof arguments[i] == 'function')
        callback = arguments[i]
    }

    if (!command) return

    options = options || {}
    const processOptions = options.process || {}

    const action = function() {
      const args = arguments

      // Replace variables
      command = template(command, this.params)

      const psExec = SubProcessManager.create(command, processOptions)
      psExec.name  = this.name

      psExec.events.on('exit', (res) => {
        this.value = res
        if (callback) {
          callback.apply(this, args)
        } else if (options.async) {
          this.complete()
        }
      })

      psExec.execute()

    }

    const tsk = new Task(name, prerequisites, options, action)
    tsk.namespace = this.currentNamespace
    tsk.link()

    return tsk
  }

}