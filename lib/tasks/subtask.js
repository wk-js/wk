'use strict'

const when       = require('when')
const { guid }   = require('lol/utils/guid')
const { expose } = require('lol/utils/object')

function NOOP() {}

const OPTION_KEYS = [
  'action',
  'async',
  'command',
  'preReqValues'
]

class SubTask {

  constructor(task, options, invocator) {
    this.complete = this.complete.bind(this)
    this.fail     = this.fail.bind(this)

    this.task = task
    this.options = expose(options, OPTION_KEYS)

    this.promise = null
    this.resolve = NOOP
    this.reject  = NOOP

    this.status  = SubTask.STATUS.PENDING
    this.value   = null

    this.guid = guid()

    this.invocator = invocator

    this.argv        = task.argv.clone()
    this.argvCommand = task.argvCommand.clone()

    Object.assign(this.argv.soft_params, options.argv)

    this._generatePromise()
  }

  get fullname() {
    return this.task._name + '_' + this.guid
  }

  get name() {
    return this.task._name + '_' + this.guid.slice(0, 4)
  }

  get is_done() {
    return SubTask.STATUS.IS_DONE(this.status)
  }

  get path() {
    return this.task.getPath()
  }

  execute() {
    if (!SubTask.STATUS.IS_PENDING(this.status)) {
      return this.promise
    }

    this.status = SubTask.STATUS.PROCESS
    this._execute()

    return this.promise
  }

  fail( value ) {
    if (this.status !== SubTask.STATUS.PROCESS) return

    this.status = SubTask.STATUS.FAIL
    this.value  = value

    let err
    if (value) {
      if (value instanceof Error) err = value
      else if ( typeof value === 'string' ) err = new Error( value )
      else err = new Error( value.toString() )
    } else {
      err = new Error
    }

    this.reject( err )
    this.resolve = null
    this.reject  = null
  }

  complete( value ) {
    if (this.status !== SubTask.STATUS.PROCESS) return

    this.status = SubTask.STATUS.COMPLETE
    this.value  = value

    this.resolve( value )
    this.resolve = null
    this.reject  = null
  }

  _execute() {
    const canExecute = typeof this.options.action === 'function' && SubTask.STATUS.IS_PROCESSING(this.status)

    if (canExecute) {
      wk.Print.debug('Execute ' + wk.Print.magenta(`[${this.task.path}]`))

      if (this.options.command) {
        this.argv.config = this.argvCommand.config
        this.argv.validate()
      }

      try {
        this.value = this.options.action.call(this, this.argv.params, this.options.preReqValues)
      } catch(e) {
        this.fail(e)
      }

      if (!this.options.async) this.complete( this.value )

      return
    }

    // if cannot be executed and status processed, complete task
    if (this.status === SubTask.STATUS.PROCESS) this.complete()
  }

  _generatePromise() {
    this.promise = when.promise((resolve, reject) => {
      this.resolve = resolve
      this.reject  = reject

      this.status  = SubTask.STATUS.PENDING
      this.value   = null
    })

    this.promise.catch((value) => {
      wk.Print.error(`Task execution aborted (${this.path})`)
      wk.Print.error( value instanceof Error ? value.stack : value )
    })
  }

}

SubTask.STATUS = {
  PENDING: 'pending',
  PROCESS: 'process',
  FAIL: 'fail',
  COMPLETE: 'complete',

  IS_PENDING(value) {
    return value === this.PENDING
  },

  IS_PROCESSING(value) {
    return value === this.PROCESS
  },

  IS_DONE(value) {
    return value === this.FAIL || value === this.COMPLETE
  }
}

module.exports = SubTask