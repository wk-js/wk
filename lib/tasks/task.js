'use strict'

const { merge, clone, expose }
= require('lol/utils/object')
const { Result, Command }
= require('wk-argv-parser')

const SubTask      = require('./subtask')
const EventEmitter = require('eventemitter3')

const TASK_BINDING = [
  'execute',
  'invoke',
  'fail',
  'complete'
]

const TASK_OPTIONS = [
  'description',
  'visible',
  'async',
  'action',
  'argv',
  'prerequisites',
  'preReqSequence',
  'command',
  'pool'
]

class Task {

  constructor(name, options) {
    TASK_BINDING.forEach((key) => {
      this[key] = this[key].bind(this)
    })

    this._name         = name
    this.description   = options.description
    this.visible       = options.visible
    this.prerequisites = Array.isArray(options.prerequisites) ? options.prerequisites : []

    // Set options
    this.options   = merge({
      description: '',
      visible: true,
      argv: { _: [ this.name ] },
      async: true,
      action: function() {},
      command: null,
      prerequisites: null,
      preReqSequence: 'serie',
      preReqResults: [],
      pool: -1,
    }, expose(options, TASK_OPTIONS))


    // Set argv
    this.argv = new Result
    this.argv.set( this.options.argv )
    if (this.options.argv._.indexOf(this.name) == -1) {
      this.options.argv._.unshift( this.name )
    }

    // Configure command
    this.command = new Command( this.name )
    if (this.options.command) {
      this.options.command.call( this.command )
    }

    // Configure namespace
    this.namespace = "wk" in global && wk.currentNamespace ? wk.currentNamespace : null
    this.link()

    // Event emitter
    this.events = new EventEmitter

    // Pool
    this._pool    = []
    this._running = []

    // Do a test on self dependencies for this task
    if (Array.isArray(this.prerequisites) && this.prerequisites.indexOf(this.name) !== -1  && this.prerequisites.indexOf(this) !== -1) {
      throw new Error("Cannot use prereq " + this.name + " as a dependency of itself");
    }
  }


  /**
   * Set the name of task
   * @param {String} value
   */
  set name(value) {
    this._name = value
    this.command.key = value
  }


  /**
   * Get the shorten name of task
   * @returns {String}
   */
  get name() {
    return this._name
  }


  /**
   *
   * Update and returns task path
   * @returns {String}
   *
   * @memberof Task
   */
  getPath() {
    let nsPath = ''

    if (this.namespace) nsPath = this.namespace.getPath()

    let pth = this._name

    if (nsPath && nsPath.length !== 0) pth = nsPath + ':' + this._name

    return pth
  }


  /**
   * Create a subtask
   *
   * @param {Object} options
   * @returns {SubTask}
   *
   * @memberof Task
   */
  createSubtask(options) {
    return new SubTask(this, merge(clone(this.options), options || {}))
  }


  /**
   *
   * Execute the task without its prerequisites
   * @returns {Promise}
   *
   * @memberof Task
   */
  execute(subtask, options) {
    subtask = subtask || this.createSubtask(options)

    this._pool.push( subtask )
    this._next()

    return subtask.promise
  }


  /**
   *
   * Execute the task with its prerequisites
   * @returns {Promise}
   *
   * @memberof Task
   */
  invoke(subtask, options) {
    options = options || {}
    options.prerequisites = true
    return this.execute( subtask, options )
  }


  /**
   *
   * Invoke prerequisites
   * @returns {Promise}
   *
   * @memberof Task
   */
  invokePrerequisites(subtask) {
    subtask = subtask || this.createSubtask()
    const presenter = subtask.presenter()

    const TM    = require('../task-manager')
    const tasks = TM._resolve(this.prerequisites)

    TM._verbose(tasks, 'parallel')

    for (let i = 0, ilen = tasks.length; i < ilen; i++) {
      tasks[i].options.invocator = presenter
    }

    return TM[`_${this.options.preReqSequence}`]( tasks )
  }


  /**
   *
   * Fail task operation
   * @param {any} value
   *
   * @memberof Task
   */
  fail(err) {
    this.events.emit('fail', err)
    return err
  }


  /**
   *
   * Complete task operation
   * @param {any} value
   *
   * @memberof Task
   */
  complete(value) {
    this.events.emit('complete', value)
    return value
  }


  /**
   *
   * Register the task to its namespace and be visible
   *
   * @memberof Task
   */
  link() {
    this.namespace.registerTask( this )
  }


  /**
   *
   * Unregister the task to its namespace and be hidden
   *
   * @memberof Task
   */
  unlink() {
    this.namespace.unregisterTask( this )
  }


  /**
   * Execute subtasks in pool
   *
   * @memberof Task
   */
  _next() {
    if (this.options.pool > -1 && this._running.length >= this.options.pool) return

    const subtask = this._pool.shift()
    if (!subtask) return

    this._running.push( subtask.name )

    subtask.promise.catch(() => {
      this.fail()

      this._running.splice(this._running.indexOf(subtask.name), 1)
      this._next()
    })

    subtask.promise.then(() => {
      this.complete()

      this._running.splice(this._running.indexOf(subtask.name), 1)
      this._next()
    })

    subtask.execute()

    if (!subtask.options.prerequisites) return
    if (Array.isArray(this.prerequisites) && this.prerequisites.length === 0) {
      subtask._execute()
      return
    }

    const pp = this.invokePrerequisites(subtask)
    pp.catch(subtask.fail)
    pp.then((preReqResults) => {
      subtask.options.preReqResults = subtask.options.preReqResults || []
      subtask.options.preReqResults = subtask.options.preReqResults.concat(preReqResults)
      subtask._execute()
    })

  }

}

module.exports = Task