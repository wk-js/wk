'use strict'

const Context = require('../lib/context')

if (!Context.get('wk')) {
  Context.create('wk')
  Context.select('wk')
}

module.exports = Context.get('wk')