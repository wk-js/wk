'use strict'

const Task        = require('./tasks/task')
const NanoTask    = require('./tasks/nano-task')
const Namespace   = require('./namespace')
const TaskManager = require('./task-manager')

module.exports = {

  task() {
    let name, prerequisites, options, action

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

    options               = options || {}
    options.name          = name
    options.description   = options.description || wk.currentDescription
    options.prerequisites = options.prerequisites || prerequisites
    options.action        = options.action || action

    const task = new Task(options.name, options)
    return task
  },


  /**
   * Register a command as a task
   *
   * @param {String} name
   * @param {String} cmd
   * @param {Array} prerequisites
   * @param {Object} options
   * @param {Function} callback
   * @returns {Task} tsk
   */
  taskProcess() {

    let cmd, prerequisites, options, callback
    const name = arguments[0]

    for (const i in arguments) {
      if (typeof arguments[i] === 'string' && arguments[i] !== name)
        cmd = arguments[i]

      if (Array.isArray(arguments[i]))
        prerequisites = arguments[i]

      if (!Array.isArray(arguments[i]) && typeof arguments[i] === 'object')
        options = arguments[i]

      if (typeof arguments[i] === 'function')
        callback = arguments[i]
    }

    if (!cmd) return

    options = options || {}
    const processOptions = options.process || {}

    const action = function(a,b,c,d) {

      // Replace variables
      if (this.argv) {
        for (const key in this.argv) {
          const reg   = new RegExp("\\$\\{"+key+"\\}", 'g')
          if (cmd.match( reg )) {
            cmd = cmd.replace( reg, this.argv[key] )
          }
        }
      }

      const psExec = wk.createExec(cmd, processOptions)
      this.psExec  = psExec
      psExec.name  = this.name

      psExec.events.on('exit', (res) => {
        this.value = res
        if (callback) {
          callback.call(this, a, b, c, d)
        } else if (options.async) {
          this.complete()
        }
      })

      psExec.execute()

    }

    return task(name, prerequisites, options, action)
  },


  /**
   * Set the current description for the next task initialization
   *
   * @param {String} desc
   */
  desc(desc) {
    wk.currentDescription = desc
  },


  /**
   * Get or create a namespace
   *
   * @param {String} name
   * @param {Function} closure
   */
  namespace(name, closure) {
    const current = wk.currentNamespace
    let ns        = current.children[name]
    if (!ns) ns   = new Namespace(name, current)
    current.children[name] = ns
    wk.currentNamespace = ns
    closure.call(ns)

    // If the namespace as a default task
    // the path to the namespace will execute the default task
    if (ns.tasks.default) {
      const tsk = ns.tasks.default
      tsk.unlink()
      tsk.namespace    = ns.parent
      tsk._name        = ns.name
      tsk.description  = tsk.description || null
      tsk.link()
    }

    wk.currentNamespace   = current
    wk.currentDescription = null

    return ns
  },


  /**
   * Run tasks in serie
   *
   * @param {...String} arguments
   * @returns {Promise}
   */
  serie() {
    return TaskManager.serie(...arguments)
  },


  /**
   * Run tasks in parallel
   *
   * @param {...String} arguments
   * @returns {Promise}
   */
  parallel() {
    return TaskManager.parallel(...arguments)
  },

  nano: {
    task(action, context) {
      return NanoTask.createNanoTask(action, context)
    },

    serie(tasks, order) {
      return NanoTask.serie(tasks, order)
    },

    parallel(tasks, order) {
      return NanoTask.parallel(tasks, order)
    }
  }

}