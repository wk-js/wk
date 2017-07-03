#!/usr/bin/env node

'use strict'

const path = require('path')
const fs   = require('fs')

const WKArg      = require('wk-argparser')
const ARGParser  = WKArg.Parser
const ARGCommand = WKArg.Command

const wk = require('./../lib/workflow.js')

const argv = process.argv.slice(2)
const cli  = path.basename(process.argv[1])
argv.unshift(cli)

const parser = new ARGParser
wk.ARGParser = parser

const WKCmd = (new ARGCommand(cli, parser))

.option('plouc', {
  no_key: true,
  index: 1
})

.option('verbose', {
  type: 'boolean',
  defaultValue: false,
  aliases: [ 'v' ],
  description: "Display verbose log"
})

.option('silent', {
  type: 'boolean',
  defaultValue: false,
  aliases: [ 's' ],
  description: "Hide logs"
})

.option('log', {
  type: 'value',
  defaultValue: 'log,error,warn',
  description: "Precise log levels (eg.: --log=log,warn,error)"
})

.option('tasks', {
  type: 'boolean',
  defaultValue: false,
  aliases: [ 'T' ],
  description: 'List available tasks'
})

.option('file', {
  type: 'value',
  defaultValue: 'Wkfile',
  aliases: [ 'F' ],
  description: 'Precise a default file'
})

.option('parallel', {
  type: 'boolean',
  defaultValue: false,
  aliases: [ 'p' ],
  description: 'Execute tasks in parallel'
})

.option('multiple', {
  type: 'boolean',
  defaultValue: false,
  aliases: [ 'm' ],
  description: 'Run multiple tasks'
})

const ContextArgv = ARGParser.getContextArgv(argv)
const TaskArgv    = argv.filter((str) => {
  return ContextArgv.indexOf(str) === -1
})

const ContextObject  = WKCmd.parse(ContextArgv)
const options = ContextObject.params

// Load Wkfile
const Wkfile_path = path.isAbsolute(options.file) ? options.file : path.join(process.cwd(), options.file)
if (fs.existsSync(Wkfile_path)) require(Wkfile_path)

function getTasks(ns, tasks) {

  const tsks = []

  for (const key in ns.tasks) {
    if (ns.tasks[key].visible)
      tsks.push( ns.tasks[key] )
  }

  if (tsks.length > 0) {
    if (ns.path.length === 0) tasks.push(`[default]`)
    else tasks.push( `\n[${ns.path}]` )
    tasks = tasks.concat(tsks)
  }

  for (const k in ns.children) {
    getTasks(ns.children[k], tasks)
  }

  return tasks
}

function listTasks() {
  const pad = require('./../lib/utils/string').pad

  let tasks = getTasks(wk.defaultNamespace, [])

  let length = 0
  for (const i in tasks) {
    if (typeof tasks[i] === 'string') continue
    if (length < tasks[i].path.length) length = tasks[i].path.length
  }

  tasks = tasks.map(function(tsk) {
    if (typeof tsk === 'string') return tsk
    if (!tsk.description) return 'wk ' + `${wk.Print.green(tsk.path)}`

    const path = pad(tsk.path, length + 5, ' ', true)
    return 'wk ' + wk.Print.green(path) + ' ' + wk.Print.grey('# ' + tsk.description)
  })

  console.log(tasks.join('\n'))

}


// --help -h
if (options.help) {
  const pkg = require('./../package.json')
  console.log( `${pkg.name} v${pkg.version} \n`)
  console.log( options.__config.help.description )
  return
}

// -T --tasks
if (options.tasks) {
  return listTasks()
}

// --silent
if (options.silent) {
  wk.Print.silent()
}

// --verbose
else if (options.verbose) {
  wk.Print.verbose()
}

// --log=<levels>
else {
  wk.Print.silent()
  const levels = options.log.split(/,/)
  if (levels.length) {
    for (const level in levels) {
      wk.Print.visibility(levels[level], true)
    }
  }
}

if (TaskArgv.length > 0) {
  const tsk = TaskArgv[0]

  if (wk.Tasks[tsk]) {
    wk.Tasks[tsk].argv.set(parser.parse(TaskArgv).params)
    wk.Tasks[tsk].invoke()
  }

  return
}

// By default list tasks
listTasks()