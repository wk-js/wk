'use strict'

/**
 * Workflow implementation from jake.js
 * https://github.com/jakejs/jake/blob/master/lib/jake.js
 */

const wk       = {}
module.exports = wk
global.wk      = wk

const Namespace      = require('./namespace')
const Print          = require('./print')
const Importer       = require('./importer')
const TaskManager    = require('./task-manager')
const ProcessManager = require('./process-manager')
const ARGParser      = require('./arg-parser')
const ExtraTask      = require('./tasks/extra-task')
const API            = require('./api')
const FileList       = require('filelist')

// Object
wk.ExtraTask          = ExtraTask
wk.Print              = Print
wk.FileList           = FileList
wk.ARGParser          = ARGParser

// wk.require
wk.require = Importer.getAPI()

// Deprecated
wk.load = function() {
  const Print = wk.Print.new()
  Print.warn(`wk.load() is deprecated. Use wk.require() instead.`)
  wk.require.apply(wk, arguments)
}

wk.extra = function() {
  const Print = wk.Print.new()
  Print.warn(`wk.extra() is deprecated. Use wk.require.extra() instead.`)
  wk.require.extra.apply(wk.require, arguments)
}

// Functions
wk.run         = TaskManager.run
wk.exec        = ProcessManager.execute
wk.createExec  = ProcessManager.create

// Utils
wk.utils          = {}
wk.utils.prompt   = require('./utils/prompt')
wk.utils.template = require('./utils/template')

// Defaults
wk.defaultNamespace   = new Namespace('default', null)
wk.currentNamespace   = wk.defaultNamespace
wk.currentDescription = null
wk.Tasks              = {}


// Check no global property overrided
const API_KEYS = Object.keys(API)

for (const i in API_KEYS) {
  if (global.hasOwnProperty(API_KEYS[i])) {
   throw new Error(`The api method ${API_KEYS[i]} override a global property`)
  }
}

// Export API to global
Object.assign(global, API)