'use strict'

const wk = require('../lib/wk')
wk.api(global)

wk.require.paths.push( process.cwd() + '/tasks' )

wk.require('bump', true)
wk.require('package', true)

console.log(Object.keys(wk.Tasks))