'use strict'

const wk = require('../lib/workflow')

wk.task('message', [ `who --random ${Math.round(Math.random())}`, 'where', 'when' ], function(params) {
  const p = this.invocator ? this.invocator.argv : params
  console.log(`${p.who} is going to ${p.where} at ${p.when}`)
})

wk.task('who', { async: true }, function(params) {
  setTimeout(() => {
    console.log(this.invocator.argv)
    this.invocator.argv.who = params.random ? 'John' : 'Max'
    this.complete(this.invocator.argv.who)
  }, 1000)
})

wk.task('where', function(params, preReqValues) {
  console.log(this.invocator.argv)
  this.invocator.argv.where = preReqValues[0] == 'John' ?
  'London' : 'Paris'
})

wk.task('when', function() {
  console.log(this.invocator.argv)
  this.invocator.argv.when = '10am'
})

wk.task('start', [ 'message' ])

// wk.Tasks['start']  .invoke()
wk.Tasks['message'].invoke()