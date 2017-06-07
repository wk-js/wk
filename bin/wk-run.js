#!/usr/bin/env node

const wk = require('../lib/workflow')

const config = {
  parallel: {
    type: 'boolean',
    default: false,
    aliases: [ 'p' ],
    description: 'Execute tasks in "parallel"'
  }
}

wk.ARGParser._createHelp(config)

const params = wk.ARGParser.parse(process.argv.slice(0), config)

const tasks = params.__._.slice(0)
tasks.shift()

if (params.help || !tasks || tasks.length === 0) {
  console.log( config.help.description )
  return
}

let cmd

if (params.parallel) {
  cmd = wk.exec({
    command: `wk -p -m ${tasks.join(' ')}`,
    interactive: true
  })
} else {
  cmd = wk.exec({
    command: `wk -m ${tasks.join(' ')}`,
    interactive: true
  })
}

cmd.catch((err)=> {
  console.log(err)
})