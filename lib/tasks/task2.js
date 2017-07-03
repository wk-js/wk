'use strict'

const when             = require('when')
const SubTask          = require('./subtask')
const expose           = require('../utils/object').expose
const TaskManager      = require('../task-manager')
const { merge, clone } = require('../utils/object')
const Types            = require('../utils/types')
const EventEmitter     = require('eventemitter3')
const guid             = require('../utils/guid').guid

const WKArg      = require('wk-argparser')
const ARGObject  = WKArg.ARGObject
const ARGCommand = WKArg.Command

const OPTION_KEYS = [
  'description',
  'visible',
  'async',
  'action',
  'argv',
  'prerequisites',
  'preReqSequence',
  'run'
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
      argv: {}
    }, expose(options, OPTION_KEYS))

    this.argv        = new ARGObject(wk.ARGParser)
    this.argv_config = new ARGCommand(this.name, wk.ARGParser)
    this.argv.set( this.options.argv )

    this.namespace = "wk" in global && wk.currentNamespace ? wk.currentNamespace : null
    this.getPath()
    this.link()

    this.run_max  = -1
    this.run_count = 0

    if ( Types.isBoolean(this.options.run)) {
      this.run_max = this.options.run ? -1 : 0
    } else if ( Types.isNumber(this.options.run) ) {
      this.run_max = this.options.run
    }

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

  /**
   *
   * Update task path
   *
   * @memberOf Task
   */
  updatePath() {
    return this.getPath()
  }


  /**
   *
   * Update and returns task path
   * @returns {String}
   *
   * @memberOf Task
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
   * @memberOf Task
   */
  execute(options) {
    if (this.run_max > -1 && this.run_count >= this.run_max) return when(true)

    this.run_count++

    const subtask = this.createSubtask(options)
    return subtask.execute()
                  .then(this.complete)
                  .catch(this.fail)
  }

  /**
   *
   * Execute the task with its prerequisites
   * @returns {Promise}
   *
   * @memberOf Task
   */
  invoke(options) {
    if (Array.isArray(this.prerequisites) && this.prerequisites.length > 0) {
      return this.invokePrerequisites()
                 .then(() => this.execute(options))
                 .catch(this.fail)
    } else {
      return this.execute(options)
    }
  }

  /**
   *
   * Invoke prerequisites
   * @returns {Promise}
   *
   * @memberOf Task
   */
  invokePrerequisites() {
    if (this.preReqSequence === 'parallel') {
      return TaskManager.parallel.apply(TaskManager, this.prerequisites)
    }
    return TaskManager.serie.apply(TaskManager, this.prerequisites)
  }

  /**
   *
   * Fail task operation
   * @param {any} value
   *
   * @memberOf Task
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
   * @memberOf Task
   */
  complete(value) {
    this.events.emit('complete', value)
    return value
  }

  /**
   *
   * Register the task to its namespace and be visible
   *
   * @memberOf Task
   */
  link() {
    this.namespace.registerTask( this )
  }


  /**
   *
   * Unregister the task to its namespace and be hidden
   *
   * @memberOf Task
   */
  unlink() {
    this.namespace.unregisterTask( this )
  }

}

module.exports = Task