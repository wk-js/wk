'use strict'

const Context = require('./context')

if (!Context.get('wk')) {
  Context.create('wk')
  Context.select('wk')
}

process.on("unhandledRejection", function(promise, reason){
  throw reason.value
})

module.exports = Context.get('wk')