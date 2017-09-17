'use strict'

const wok = require('../lib/wk')

global.wk        = wok
global.task      = wok.task
global.namespace = wok.namespace
global.desc      = wok.desc
global.serie     = wok.serie
global.parallel  = wok.parallel

function tasks() {
  task('task1', function(resolve) {
    console.log('task1', wk.name)
    resolve(`task1: context ${wk.name}}`)
  })

  task('task2', function(resolve) {
    console.log('task2', wk.name)
    resolve(`task2: context ${wk.name}}`)
  })
}

// Add task to active context
tasks()

// Add task to context1
wk.context('context1', tasks)

// Add start task
task('start', function(resolve, reject) {
  wk.run('task1')
  .then(() => wk.run('task1', null, 'context1'))
  .then(() => wk.run('task2', null, 'context1'))
  .then(() => wk.run('task2'))
  .catch(reject)
  .then(resolve)
})

console.log(Object.keys(wk.Tasks))

wk.context('context1', function() {
  console.log(Object.keys(this.Tasks))
})

wk.Tasks['start'].invoke()