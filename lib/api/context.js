'use strict'

const Context = require('../context')

module.exports = {

  create(key) {
    Context.create(key)
  },

  open(key) {
    if (!Context.get(key)) {
      this.Print.error(`Context "${key}" does not exist.`)
      return
    }

    this.context.select(key)
  },

  close() {
    Context.select(this.parent || 'wk')
    this.parent = null
  },

  select(key) {
    key = key || this.name
    const current  = Context.select(key)
    current.parent = this.name != key ? this.name : null
  },

  execute(key, closure) {
    this.context.open(key)
    const val = closure()
    this.context.close(key)
    return val
  }

}