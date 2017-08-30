#!/usr/bin/env node

'use strict'

// Set API to global
const wk       = require('./../lib/workflow.js')
const API      = require('./../lib/api.js')
const API_KEYS = Object.keys(API)

for (const i in API_KEYS) {
  if (global.hasOwnProperty(API_KEYS[i])) {
   throw new Error(`The api method ${API_KEYS[i]} override a global property`)
  }
}

Object.assign(global, API)

// Setup
const path = require('path')
const { Parser } = require('wk-argv-parser')

const argv = process.argv.slice(2)
const cli  = path.basename(process.argv[1])
argv.unshift(cli)

const WKCmd  = Parser

.command(cli)

// --verbose, -v
.describe('verbose', 'Display every logs')
.boolean('verbose', false)
.alias('verbose', [ 'v' ])

// --silent, -s
.describe('silent', 'Hide every logs')
.boolean('silent', false)
.alias('silent', [ 's' ])

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

// --help -h
if (options.help) {
  const pkg = require('./../package.json')
  console.log( `${pkg.name} v${pkg.version} \n`)
  console.log( ContextResult.result.config.help.description )
  return
}

// --file, -F
require(options.file)

/**
 * Fetch tasks from namespace
 *
 * @param {Namespace} ns
 * @param {Array} tasks
 * @returns
 */
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

/**
 * List all visible tasks
 *
 */
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
  wk.run(TaskArgv.join(' '))
  return
}

// By default list tasks
listTasks()