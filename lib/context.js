'use strict'

const Namespace         = require('./namespace')
const Importer          = require('./importer')
const API               = require('./api')
const TaskManager       = require('./task-manager')
const SubProcessManager = require('./subprocess-manager')

class Context {

  constructor() {
    this.Tasks = {}

    this.defaultNamespace   = new Namespace('default', null)
    this.currentNamespace   = this.defaultNamespace
    this.currentDescription = null
    this.concurrency        = 10

    this.require    = Importer.getAPI()
    this.run        = TaskManager.run
    this.exec       = SubProcessManager.execute
    this.createExec = SubProcessManager.create

    // Print
    const { Print, Levels, Plugins } = require('wk-print')
    this.Print = new Print

    this.Print.level('debug', Levels.debug)
    this.Print.level('warn', Levels.warn)
    this.Print.level('error', Levels.error)
    this.Print.plugin('tag', Plugins.tag)
    this.Print.plugin('date', Plugins.date)
    this.Print.plugin('style', Plugins.style)
    this.Print.visibility('log'  , true)
    this.Print.visibility('debug', false)
    this.Print.visibility('error', true)
    this.Print.visibility('warn' , false)

    const timers = {}

    this.Print.time = function(key) {
      if (key) timers[key] = Date.now()
    }

    this.Print.timeEnd = function(key) {
      if ( timers[key] ) {
        const r = (Date.now() - timers[key]) + 'ms'
        delete timers[key]
        return r
      }
    }

    Object.assign(this, API)
  }

}

Context._contexts = {}

Context.create = function(name) {
  Context._contexts[name] = new Context
}

Context.get = function(name) {
  return Context._contexts[name]
}

Context.select = function(name) {
  if (Context._contexts[name]) {
    global.wk = Context._contexts[name]
  }
}

Context.remove = function(name) {
  delete Context._contexts[name]
}

module.exports = Context