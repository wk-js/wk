'use strict'

const wkno      = require('wkno')
const API       = require('./api')
const Namespace = require('./namespace')
const Importer  = require('./importer')

class Context {

  constructor(name) {
    this.name = name
    this.wkno = wkno

    this.rootNamespace   = new Namespace('root', null)
    this.currentNamespace   = this.rootNamespace
    this.currentDescription = null

    const importer = new Importer
    this.require   = importer.getAPI()

    API.set('common', this)
    API.set('task-manager', this)
    API.set('tasks', this)
    API.set('subprocess', this)
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