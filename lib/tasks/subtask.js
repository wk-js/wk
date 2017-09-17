'use strict'

const { guid }   = require('lol/utils/guid')
const { expose } = require('lol/utils/object')

const when = require('when')

function NOOP() {}

const ACTION_EXPOSURE = [
  'name',
  'path',
  'argv'
]

const ACTION_OPTION_EXPOSURE = [
  'async',
  'invocator',
  'result',
  'preReqResults'
]

function presenter( subtask ) {
  const p = expose(subtask, ACTION_EXPOSURE)
  p.argv = subtask.argv.params
  Object.assign(p, expose( subtask.options, ACTION_OPTION_EXPOSURE ))
  return p
}

function generatePromise( subtask ) {
  subtask.promise = when.promise((resolve, reject) => {
    subtask._resolve = resolve
    subtask._reject  = reject

    subtask.status  = SubTask.STATUS.PENDING
    subtask.value   = null
  })

  subtask.promise.catch((value) => {
    wk.Print.error(`Task execution aborted (${subtask.path})`)
    wk.Print.error( value instanceof Error ? value.stack : value )
  })
}

function bind( subtask, key ) {
  const fn = subtask[key]
  subtask[key] = function $bind(){
    fn.apply(subtask, arguments)
  }
}

class SubTask {

  constructor(task, options) {
    bind(this, 'complete')
    bind(this, 'fail')
    bind(this, 'execute')

    this.guid   = guid()
    this.status = SubTask.STATUS.PENDING
    this.value  = null

    this.name = task._name
    this.path = task.getPath()

    this.argv = task.argv.clone()
    this.argv.set( options.argv )

    this.command = task.command

    this.options = options
    this.options.command = !!options.command

    this.promise  = null
    this._resolve = NOOP
    this._reject  = NOOP

    generatePromise( this )
  }

  execute() {
    if (!SubTask.STATUS.IS_PENDING(this.status)) {
      return this.promise
    }

    this.status = SubTask.STATUS.PROCESS
    this._prepare()
    if (!this.options.prerequisites) this._execute()

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

    this._done()
  }

  complete( value ) {
    if (this.status !== SubTask.STATUS.PROCESS) return

    this.status = SubTask.STATUS.COMPLETE
    this.value  = value

    this._resolve( value )
    this._resolve = null
    this._reject  = null

    this._done()
  }

  _done() {
    wk.Print.debug(wk.Print.magenta(`[${this.path}]`) + ` executed in ${wk.Print.timeEnd(this.guid)}`)
  }

  _prepare() {
    if (this.options.command) {
      const res = this.command.parse( this.argv.toString() )
      this.argv = res.result

      if (res.errors) {
        return this.fail( res.errors.map(function(error) {
          return `${error.message} [parameters: ${error.missings.join(', ')}]`
        }).join(' ') )
      }
    }
  }

  _execute() {
    const canExecute = typeof this.options.action === 'function' && SubTask.STATUS.IS_PROCESSING(this.status)

    if (canExecute) {
      wk.Print.debug('Execute ' + wk.Print.magenta(`[${this.path}]`))

      try {
        wk.Print.time(this.guid)
        this._prepare()
        this.value = this.options.action.call(
          presenter(this),
          this.complete,
          this.fail
        )
      } catch(e) {
        this.fail(e)
      }

      if (!this.options.async) this.complete( this.value )

      return
    }

    // if cannot be executed and status processed, complete task
    if (this.status === SubTask.STATUS.PROCESS) this.complete()
  }

  presenter() {
    return presenter(this)
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

