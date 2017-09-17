'use strict'

const wok = require('../lib/wk')

global.wk        = wok
global.task      = wok.task
global.namespace = wok.namespace
global.desc      = wok.desc
global.serie     = wok.serie
global.parallel  = wok.parallel

// Add task to active context
task('task1', function(resolve) {
  console.log('task1: context', wk.name)
  resolve(`task1`)
})

task('task2', function(resolve) {
  console.log('task2: context', wk.name)
  resolve(`task2`)
})

task('start', function(resolve, reject) {
  wk.run('task1')
  .then(() => wk.run('task3', null, 'context1'))
  .then(() => wk.run('task4', null, 'context1'))
  .then(() => wk.run('task2'))
  .catch(reject)
  .then(resolve)
})

// Add tasks to context1
wk.context('context1', function() {
  task('task3', function(resolve) {
    console.log('task3: context', wk.name)
    resolve(`task3`)
  })

  task('task4', function(resolve) {
    console.log('task4: context', wk.name)
    resolve(`task4`)
  })
})

console.log(Object.keys(wk.Tasks))
// => [ 'task1', 'task2', 'start' ]

wk.context('context1', function() {
  console.log(Object.keys(this.Tasks))
  // => [ 'task3', 'task4' ]
})

wk.Tasks['start'].invoke()
// => task1: context wk
// => task3: context wk:context1
// => task4: context wk:context1
// => task2: context wk
