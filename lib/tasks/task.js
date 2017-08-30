'use strict'

const SubTask          = require('./subtask')
const expose           = require('../utils/object').expose
const { merge, clone } = require('../utils/object')
const Types            = require('../utils/types')
const EventEmitter     = require('eventemitter3')
const guid             = require('../utils/guid').guid

const WKArgvParser = require('wk-argv-parser')
const ArgvResult   = WKArgvParser.Result
const ArgvCommand  = WKArgvParser.Command

const OPTION_KEYS = [
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
    this.execute  = this.execute .bind(this)
    this.invoke   = this.invoke  .bind(this)
    this.fail     = this.fail    .bind(this)
    this.complete = this.complete.bind(this)

    this._name     = name
    this.guid      = guid()
    this.options   = Object.assign({
      async: false,
      action: function() {},
      argv: {},
      command: false,
      pool: -1,
      taskValues: []
    }, expose(options, OPTION_KEYS))

    this.argv = new ArgvResult
    this.argv.set( this.options.argv )
    this.argvCommand = new ArgvCommand(this.name)

    this.namespace = "wk" in global && wk.currentNamespace ? wk.currentNamespace : null
    this.getPath()
    this.link()

    this._pool    = []
    this._running = []

    this.prerequisites  = Types.isArray(this.options.prerequisites)   ? this.options.prerequisites  : []
    this.preReqSequence = Types.isString(this.options.preReqSequence) ? this.options.preReqSequence : 'serie'

    Object.assign(this, {
      description: '',
      visible: true,
    }, expose(this.options, [ 'description', 'visible' ]))

    this.events = new EventEmitter

    // Do a test on self dependencies for this task
    if (Array.isArray(this.prerequisites) && this.prerequisites.indexOf(this.name) !== -1  && this.prerequisites.indexOf(this) !== -1) {
      throw new Error("Cannot use prereq " + this.name + " as a dependency of itself");
    }
  }

  /**
   * Get the full name of task
   * @returns {String}
   */
  get fullname() {
    return this._name + '_' + this.guid
  }


  /**
   * Set the name of task
   * @param {String} value
   */
  set name(value) {
    this._name = value
    this.argvCommand.key = value
  }


  /**
   * Get the shorten name of task
   * @returns {String}
   */
  get name() {
    return this._name + '_' + this.guid.slice(0, 4)
  }

  get path() {
    return this.getPath()
  }

  get value() {
    return this.values[this.values.length-1]
  }

  /**
   *
   * Update task path
   *
   * @memberof Task
   */
  updatePath() {
    return this.getPath()
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
  execute(options) {
    const subtask = this.createSubtask(options)

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
  invoke(options) {
    if (Array.isArray(this.prerequisites) && this.prerequisites.length > 0) {
      const p = this.invokePrerequisites()
      p.catch(this.fail)
      p.then(() => this.execute(options))
      return p
    } else {
      return this.execute(options)
    }
  }


  /**
   *
   * Invoke prerequisites
   * @returns {Promise}
   *
   * @memberof Task
   */
  invokePrerequisites() {
    if (this.preReqSequence === 'parallel') {
      return wk.parallel.apply(null, this.prerequisites)
    }
    return wk.serie.apply(null, this.prerequisites)
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

    const p = subtask.execute()
    p.catch(this.fail)
    p.then(this.complete)
    p.then(() => {
      this._running.splice(this._running.indexOf(subtask.name), 1)
      this._next()
    })
  }

}

module.exports = Task