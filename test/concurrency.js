'use strict'

require('../lib/wk')

task('task0', { async: true, concurrency: 1 }, function(resolve) {
  console.log('task0')
  setTimeout(resolve, 1000)
})

parallel(
  'task0',
  'task0',
  'task0',
  'task0',
  'task0',
  'task0',
  'task0',
  'task0',
  'task0',
  'task0',
  'task0',
  'task0'
)
