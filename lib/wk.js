'use strict'

const Context = require('./context')

process.on("unhandledRejection", function(promise, reason){
  throw reason.value
})

module.exports = new Context