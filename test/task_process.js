'use strict'

const wk = require('../lib/wk')

wk.taskProcess('hello', 'echo Hello World')

// wk.run('hello')

wk.taskProcess('message', 'echo Hello ${who} !', { argv: { who: 'John' } })

// wk.run('message')

wk.taskProcess('pwd', 'pwd', { process: { printStdout: false, printStderr: false } })

// wk.run('pwd')