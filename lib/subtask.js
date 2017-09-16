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

    this.guid   = guid()
    this.status = SubTask.STATUS.PENDING
    this.value  = null

    this.fullname = task._name + '_' + this.guid
    this.name     = task._name + '_' + this.guid.slice(0, 4)
    this.path     = task.getPath()

    this.argv    = task.argv.clone()
    this.command = task.command.clone()

    this.invocator = invocator

    this.options = expose(options, OPTION_KEYS)

    this.promise  = null
    this._resolve = NOOP
    this._reject  = NOOP
    this._time    = { start: 0, end: 0, duration: 0 }

    Object.assign(this.argv.soft_params, options.argv)

    this._generatePromise()
  }

  get is_done() {
    return SubTask.STATUS.IS_DONE(this.status)
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

    this._reject( err )
    this._resolve = null
    this._reject  = null

    this.done()
  }

  complete( value ) {
    if (this.status !== SubTask.STATUS.PROCESS) return

    this.status = SubTask.STATUS.COMPLETE
    this.value  = value

    this._resolve( value )
    this._resolve = null
    this._reject  = null

    this.done()
  }

  done() {
    wk.Print.debug(wk.Print.magenta(`[${this.path}]`) + ` executed in ${wk.Print.timeEnd(this.guid)}`)
  }

  _execute() {
    wk.Print.time(this.guid)

    const canExecute = typeof this.options.action === 'function' && SubTask.STATUS.IS_PROCESSING(this.status)

    if (canExecute) {
      wk.Print.debug('Execute ' + wk.Print.magenta(`[${this.path}]`))

      if (this.options.command) {
        this.options.command.call( this.command )
        const res = this.command.parse( this.argv.toString() )
        this.argv = res.result

        if (res.errors) {
          return this.fail( res.errors.map(function(error) {
            return `${error.message} [parameters: ${error.missings.join(', ')}]`
          }).join(' ') )
        }
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
      this._resolve = resolve
      this._reject  = reject

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