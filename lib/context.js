'use strict'

const wkno      = require('wkno')
const API       = require('./api')
const Namespace = require('./namespace')
const Importer  = require('./importer')
const Print     = require('./print')

class Context {

  constructor() {
    this.wkno = wkno

    this.rootNamespace      = new Namespace('root', null)
    this.currentNamespace   = this.rootNamespace
    this.currentDescription = null

    const importer = new Importer
    this.require   = importer.getAPI()

    this.Print = Print()

    API.set('common', this)
    API.set('task-manager', this)
    API.set('tasks', this)
    API.set('subprocess', this)
  }

}

module.exports = Context