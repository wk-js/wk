#!/usr/bin/env node

import { Parser } from 'wk-argv-parser';
import { Context } from "../context";
import { pad } from "lol/utils/string";

const c = new Context( 'wk' )
const wk = c.api()


const command = Parser
.command( 'wk' )

.boolean('tasks', false)
.alias('tasks', ['T'])

.string('file')

.help()

const params = command.parse( process.argv.slice(2) ).result.params

// Help
if (params.help) {
  const packageJSON = require( process.cwd() + '/package.json' )
  console.log( `wk v${packageJSON.version}` + command.get('help').description )
}

// Load files
else if (!!params.file) {
  if (Array.isArray(params.file)) {
    params.file.forEach((file:string) => wk.load( file ))
  } else if (typeof params.file === 'string') {
    wk.load( params.file as string )
  }
}

// List tasks
else if (params.tasks) {
  (function() {
    let length = 0
    const tasks = (wk.infos( 'tasks' ) as string[])
    .map((name:string) => {
      const task = c.defaultNamespace.resolveTask( name )
      if (task) {
        length = Math.max(length, name.length)

        return {
          name: name,
          description: task.options.description
        }
      }
    })
    .filter(task => !!task)
    .map((task:any) => {
      return pad(task.name, length + 5, ' ', false) + '# ' + task.description
    })

    console.log( tasks.join('\n') )
  })()
}

// Execute tasks
else {
  wk.serie(...params._.map(function(task:string) {
    let argv = process.argv.slice(2)
    argv = argv.slice(argv.indexOf(task))
    return argv.join(' ')
  }))
}

