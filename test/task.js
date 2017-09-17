'use strict'

const wk = require('../lib/wk')

wk.task('task1', [ 'task2' ], {
  command() {
    return this
    .string('name', 'John')
    .string('message', 'Hello')
  }
}, function(resolve) {
  console.log(`${this.argv.message} ${this.argv.name}`)
  resolve('task1')
})

wk.task('task2', [ 'task3' ], function(resolve) {
  console.log(this)
  this.invocator.argv.name = 'Max'
  resolve('task2')
})

wk.task('task3', function(resolve) {
  console.log(this)
  this.invocator.invocator.argv.message = 'Salut'
  resolve('task3')
})

wk.serie('task1 --hello world')