'use strict'

const wkno      = require('wkno')
const API       = require('./api')
const Namespace = require('./namespace')
const Importer  = require('./importer')
const Print     = require('./print')

function Context(name) {
  this.name   = name
  this.parent = null
  this.wkno   = wkno

  this.rootNamespace   = new Namespace('root', null)
  this.currentNamespace   = this.rootNamespace
  this.currentDescription = null

  const importer = new Importer
  this.require   = importer.getAPI()

  this.Print = Print()

  API.set('common', this)
  API.set('task-manager', this)
  API.set('tasks', this)
  API.set('subprocess', this)

  this.context = {}
  API.set('context', this.context, this)
}

Context._contexts = {}

Context.create = function(name) {
  return Context._contexts[name] = new Context(name)
}

Context.get = function(name) {
  return Context._contexts[name]
}

Context.select = function(name) {
  if (Context.get(name)) {
    Object.assign(global, Context.expose(name))
    return Context.get(name)
  }

  return null
}

Context.current = function() {
  return global.wk ? Context.get(global.wk.name) : null
}

Context.remove = function(name) {
  delete Context._contexts[name]
}

Context.expose = function(name) {
  const context = Context.get(name)

  const api = {
    wk: context
  }

  API.set('common', api, context)

  api.serie    = api.wk.serie
  api.parallel = api.wk.parallel

  return api
}

module.exports = Context