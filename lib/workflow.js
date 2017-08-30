'use strict'

/**
 * Workflow implementation from jake.js
 * https://github.com/jakejs/jake/blob/master/lib/jake.js
 */

const wk       = {}
module.exports = wk
global.wk      = wk

const Namespace         = require('./namespace')
const Importer          = new (require('./importer'))
const TaskManager       = require('./task-manager')
const SubProcessManager = require('./subprocess-manager')
const ExtraTask         = require('./tasks/extra-task')
const API               = require('./api')
const FileList          = require('filelist')

// Print
const { Print, Levels, Plugins } = require('wk-print')
wk.Print = new Print
wk.Print.level('debug', Levels.debug)
wk.Print.level('warn', Levels.warn)
wk.Print.level('error', Levels.error)
wk.Print.plugin('tag', Plugins.tag)
wk.Print.plugin('date', Plugins.date)
wk.Print.plugin('style', Plugins.style)
wk.Print.visibility('log'  , true)
wk.Print.visibility('debug', false)
wk.Print.visibility('error', true)
wk.Print.visibility('warn' , false)

// Object
wk.ExtraTask = ExtraTask
wk.FileList  = FileList

// wk.require, wk.require.extra, wk.require.paths
wk.require = Importer.getAPI()

// Functions
wk.load       = wk.require
wk.extra      = wk.require.extra
wk.run        = TaskManager.run
wk.exec       = SubProcessManager.execute
wk.createExec = SubProcessManager.create

// Utils
wk.utils          = {}
wk.utils.prompt   = require('./utils/prompt')
wk.utils.template = require('./utils/template')

// Defaults
wk.defaultNamespace   = new Namespace('default', null)
wk.currentNamespace   = wk.defaultNamespace
wk.currentDescription = null
wk.Tasks              = {}

// Set API
Object.assign(wk, API)