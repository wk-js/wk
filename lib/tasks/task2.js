'use strict'

const when        = require('when')
const SubTask     = require('./subtask')
const expose      = require('../utils/object').expose
const TaskManager = require('../task-manager')

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
    this.execute = this.execute.bind(this)
    this.invoke  = this.invoke .bind(this)

    this.name    = name
    this.options = expose(options, OPTION_KEYS)

    this.run_max  = -1
    this.run_count = 0

    if (typeof this.options.run === 'boolean') {
      this.run_max = this.options.run ? -1 : 0
    } else if (typeof this.options.run === 'number') {
      this.run_max = this.options.run
    }

    this.prerequisites  = Array.isArray(this.options.prerequisites) ? this.options.prerequisites : []
    this.preReqSequence = this.options.preReqSequence  ? this.options.preReqSequence : 'serie'

    this.getPath()

    // Do a test on self dependencies for this task
    if (Array.isArray(this.prerequisites) && this.prerequisites.indexOf(this.name) !== -1  && this.prerequisites.indexOf(this) !== -1) {
      throw new Error("Cannot use prereq " + this.name + " as a dependency of itself");
    }
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

    this.path = this.name

    if (nsPath && nsPath.length !== 0) this.path = nsPath + ':' + this.name

    return this.path
  }

  createSubTask() {
    return new SubTask(this, this.options)
  }

  execute() {
    if (this.run_max > -1 && this.run_count >= this.run_max) return when(true)

    this.run_count++

    const subtask = this.createSubTask()
    return subtask.execute()
  }

  invoke() {
    if (Array.isArray(this.prerequisites) && this.prerequisites.length > 0) {
      return this.invokePrerequisites()
                 .then(this.execute)
                 .catch(this.fail)
    } else {
      return this.execute()
    }
  }

  invokePrerequisites() {
    if (this.preReqSequence === 'parallel') {
      return TaskManager.parallel.apply(TaskManager, this.prerequisites)
    }
    return TaskManager.serie.apply(TaskManager, this.prerequisites)
  }

  fail() {

  }

  complete() {

  }

}

module.exports = Task