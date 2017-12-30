'use strict'

const wk = require('../lib/wk')

wk.task('task0', function() {
  console.log('task0')
})

wk.task('task1', function() {
  console.log('task1')
})

wk.task('task2', function() {
  console.log('task2')
})

wk.task('task3', function() {
  console.log('task3')
})

wk.serie('task0', 'task1', 'task2', 'task3')
