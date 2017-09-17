'use strict'

const wk = require('../lib/wk')

wk.task('hello', {
  async: false,
  argv: { who: 'Marc' },
  command: function() {
    this

    .string('who', 'John')
    .index('who', 1)

    .string('message', 'Hello World')
  }
}, function() {
  console.log(`${this.argv.who}:`, this.argv.message)
})

wk.Tasks['hello'].invoke()