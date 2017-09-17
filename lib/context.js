'use strict'

const { scope } = require('lol/utils/function')

const Namespace         = require('./namespace')
const Importer          = require('./importer')
const API               = require('./api')
const TaskManager       = require('./task-manager')
const SubProcessManager = require('./subprocess-manager')

function presenter( context ) {
  return {
    open: scope(() => {
      Context.select( context.name )
    }),

    close: scope(() => {
      if (context.parent) Context.select( context.parent )
    })
  }
}

function api(obj) {
  obj = obj || {}

  Object.keys(API).forEach(function(key) {
    if (typeof API[key] == 'object') {
      obj[key] = {}
      return Object.keys(API[key]).forEach(function(k) {
        obj[key][k] = scope(API[key][k], API[key])
      })
    }

    obj[key] = scope(API[key], API)
  })

  return obj
}

class Context {

  constructor(name, parent) {
    this.context = scope(this.context, this)

    this.name   = name
    this.parent = parent

    this.Tasks = {}

    this.defaultNamespace   = new Namespace('default', null)
    this.currentNamespace   = this.defaultNamespace
    this.currentDescription = null
    this.concurrency        = 10

    this.require    = Importer.getAPI()
    this.run        = scope(TaskManager.run, TaskManager)
    this.exec       = scope(SubProcessManager.execute, SubProcessManager)
    this.createExec = scope(SubProcessManager.create, SubProcessManager)

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

    api(this)

  }

  api() {
    return api.apply(null, arguments)
  }

  context(name, closure) {
    if (!Context.get(`${this.name}:${name}`)) {
      Context.create(`${this.name}:${name}`, this.name)
    }

    const context  = Context.get(`${this.name}:${name}`)

    if (closure) {
      Context.select( `${this.name}:${name}` )
      closure.call(context)
      Context.select( this.name )
    }

    return presenter( context )
  }

}

Context._contexts = {}

Context.create = function(name, parent) {
  return Context._contexts[name] = new Context(name, parent)
}

Context.get = function(name) {
  return Context._contexts[name]
}

Context.select = function(name) {
  if (Context._contexts[name]) {
    return global.wk = Context._contexts[name]
  }

  return null
}

Context.remove = function(name) {
  delete Context._contexts[name]
}

module.exports = Context