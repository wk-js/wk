'use strict'

require('../lib/wk')

task('task0', function() {
  console.log('task0')
})

task('task1', function() {
  console.log('task1')
})

task('task2', function() {
  console.log('task2')
})

task('task3', function() {
  console.log('task3')
})

serie('task0', 'task1', 'task2', 'task3')
