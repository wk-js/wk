'use strict'

const wk = require('../lib/wk')

wk.task('message', [ `who --random ${Math.round(Math.random())}`, 'where', 'when' ], { async: false }, function(resolve) {
  const p = this.argv
  console.log(`${p.who} is going to ${p.where} at ${p.when}`)
  resolve()
})

wk.task('who', function(resolve) {
  setTimeout(() => {
    console.log(this.invocator.argv)
    this.invocator.argv.who = this.argv.random ? 'John' : 'Max'
    resolve(this.invocator.argv.who)
  }, 1000)
})

wk.task('where', { async: false }, function() {
  console.log(this.invocator.argv)
  this.invocator.argv.where = this.preReqResults[0] == 'John' ?
  'London' : 'Paris'
})

wk.task('when', { async: false }, function() {
  console.log(this.invocator.argv)
  this.invocator.argv.when = '10am'
})

wk.task('start', [ 'message' ])

wk.Tasks['start']  .invoke()
// console.log(Object.keys(wk.Tasks))
// wk.Tasks['message'].invoke()