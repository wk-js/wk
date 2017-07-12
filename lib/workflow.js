'use strict'

/**
 * Workflow implementation from jake.js
 * https://github.com/jakejs/jake/blob/master/lib/jake.js
 */

const wk       = {}
module.exports = wk
global.wk      = wk

const Namespace      = require('./namespace')
const PrintLib       = require('wk-print')
const Importer       = require('./importer')
const TaskManager    = require('./task-manager')
const ProcessManager = require('./process-manager')
const ExtraTask      = require('./tasks/extra-task')
const API            = require('./api')
const FileList       = require('filelist')

// Print
wk.Print = PrintLib.new()
wk.Print.level('debug', PrintLib.Levels.debug)
wk.Print.level('warn', PrintLib.Levels.warn)
wk.Print.level('error', PrintLib.Levels.error)
wk.Print.plugin('tag', PrintLib.Plugins.tag)
wk.Print.plugin('date', PrintLib.Plugins.date)
wk.Print.plugin('style', PrintLib.Plugins.style)
wk.Print.visibility('log'  , true)
wk.Print.visibility('debug', false)
wk.Print.visibility('error', true)
wk.Print.visibility('warn' , false)

// Object
wk.ExtraTask = ExtraTask
wk.FileList  = FileList
wk.ARGParser = require('wk-argparser').new()

// wk.require
wk.require = Importer.getAPI()

// Functions
wk.load       = wk.require
wk.extra      = wk.require.extra
wk.run        = TaskManager.run
wk.exec       = ProcessManager.execute
wk.createExec = ProcessManager.create

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