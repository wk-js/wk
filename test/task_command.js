'use strict'

const wk = require('../lib/workflow')

wk.task('hello', { argv: { who: 'Marc' }, command: true }, function(params) {
  console.log(`${params.who}:`, params.message)
})

wk.Tasks['hello'].argvCommand

.string('who', 'John')
.index('who', 1)

.string('message', 'Hello World')

wk.Tasks['hello'].invoke()