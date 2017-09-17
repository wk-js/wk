#!/usr/bin/env node
'use strict'

const wk = require('../lib/wk')

// Setup global
global.wk = wk
wk.api(global)

// Setup command
const path = require('path')
const { Parser } = require('wk-argv-parser')

const argv = process.argv.slice(2)
const cli  = path.basename(process.argv[1])
argv.unshift(cli)

const WKCmd = Parser

.command(cli)

// --verbose, -v
.describe('verbose', 'Display every logs')
.boolean('verbose', false)
.alias('verbose', [ 'v' ])

// --silent, -s
.describe('silent', 'Hide every logs')
.boolean('silent', false)
.alias('silent', [ 's' ])

// --no-color
.describe('no-color', 'Remove colors')
.boolean('no-color', false)

// --log=log,error,warn
.describe('log', 'Precise log levels (eg.: --log=log,warn,error)')
.string('log', 'log,error,warn')

// --tasks, -T
.describe('tasks', 'List available tasks')
.boolean('tasks', false)
.alias('tasks', [ 'T' ])

// --file, -F
.describe('file', 'Precise a default file')
.string('file', process.cwd() + '/Wkfile')
.alias('file', [ 'F' ])
.validate('file', function(pth) {
  const fs = require('fs')
  try {
    fs.accessSync(pth, fs.constants.R_OK)
    return true
  } catch(e) {
    return false
  }
})

// --parallel
.describe('parallel', 'Execute tasks in parallel')
.boolean('parallel', false)
.alias('parallel', [ 'p' ])

.required('file', 'Need a Wkfile')

.help()

const ContextArgv = Parser.getContextARGV(argv, WKCmd.config)
const TaskArgv    = argv.filter((str) => {
  return ContextArgv.indexOf(str) === -1
})

const ContextResult = WKCmd.parse(ContextArgv)

if (ContextResult.errors) {
  wk.Print.error(ContextResult.errors.map(function(error) {
    return `${error.message} (missings: ${error.missings})`
  }).join('\n'))
  process.exit(1)
  return
}

const options = ContextResult.result.params

/**
 * Fetch tasks from namespace
 *
 * @param {Namespace} ns
 * @param {Array} tasks
 * @returns
 */
function getTasks(ns) {

  let tsks = []

  for (const key in ns.tasks) {
    if (ns.tasks[key].visible) tsks.push( ns.tasks[key] )
  }

  if (tsks.length > 0) {
    if (ns.getPath().length === 0) tsks.unshift(`[default]`)
    else tsks.unshift( `\n[${ns.getPath()}]` )
  }

  for (const k in ns.children) {
    tsks = tsks.concat(getTasks(ns.children[k]))
  }

  return tsks
}

/**
 * List all visible tasks
 *
 */
function listTasks() {
  const { pad } = require('lol/utils/string')

  let tasks = getTasks(wk.defaultNamespace)

  let length = 0
  for (const i in tasks) {
    if (typeof tasks[i] === 'string') continue
    if (length < tasks[i].getPath().length) length = tasks[i].getPath().length
  }

  tasks = tasks.map(function(tsk) {
    if (typeof tsk === 'string') return tsk
    if (!tsk.description) return 'wk ' + `${wk.Print.green(tsk.getPath())}`

    const path = pad(tsk.getPath(), length + 5, ' ', false)
    return 'wk ' + wk.Print.green(path) + ' ' + wk.Print.grey('# ' + tsk.description)
  })

  console.log(tasks.join('\n'))

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

if (options['no-color']) {
  wk.Print.use_color = false
}

// --file, -F
require(
  path.isAbsolute(options.file) ?
  options.file : path.join(process.cwd(), options.file)
)

// --help -h
if (options.help) {
  const pkg = require('./../package.json')
  console.log( `${pkg.name} v${pkg.version} \n`)
  console.log( ContextResult.result.config.help.description )
  return
}

// -T --tasks
if (options.tasks) {
  return listTasks()
}

if (TaskArgv.length > 0) {
  let tasks = []

  for (let i = 0, ilen = TaskArgv.length; i < ilen; i++) {
    const argv = Parser.parse(TaskArgv[i]).params

    if (wk.Tasks[argv._[0]]) {
      tasks.push( TaskArgv[i] )
    } else {
      tasks = TaskArgv.join(' ')
      break
    }
  }

  if (tasks.length == 1) {
    wk.run(tasks[0])
    return
  }

  if (options.parallel) wk.parallel(tasks)
  else wk.serie(tasks)
  return
}

// By default list tasks
listTasks()