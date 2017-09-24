'use strict'

const fs    = require('fs')
const path  = require('path')
const API   = require('./api')
const stack = require('./utils/stack')

class Importer {

  /**
   * Creates an instance of Importer.
   *
   *
   * @memberOf Importer
   */
  constructor() {
    // Binds
    this.load = this.load.bind(this)

    // Defaults
    this.pkg = null

    this.searchPaths = [
      process.cwd()
    ]
  }

  /**
   * Check if the path exists
   *
   * @param {String} p
   * @returns
   *
   * @memberOf Importer
   */
  exists( p ) {
    try {
      fs.accessSync( path.resolve(p), fs.constants.R_OK )
      return true
    } catch(e) {}

    return false
  }

  /**
   * Import file
   *
   * @param {String} p
   * @param {Boolean} createNamespace
   *
   * @memberOf Importer
   */
  // load(p, createNamespace, context) {
  load(p, createNamespace) {

    // if (context) {
    //   this.loadInContext(p, createNamespace, context)
    //   return
    // }

    if (createNamespace) {
      this.loadNamespace(p)
      return
    }

    if (!path.isAbsolute(p) && path.basename(p) != p) {
      const calls = stack()
      for (let k = 0, klen = calls.length; k < klen; k++) {
        if (calls[k].getFunctionName() == '$require' && calls[k+1]) {
          p = path.resolve(path.dirname(calls[k+1].getFileName()), p)
          break;
        }
      }
    }

    const filePaths = []

    var pp

    for (let j = 0, jlen = this.searchPaths.length; j < jlen; j++) {

      pp = path.isAbsolute(p) ? p : path.join(this.searchPaths[j], p)
      pp = path.resolve(pp)

      const ext = path.extname(pp)

      filePaths.push( pp )

      if (ext !== '.js') filePaths.push(pp+'.js')
    }

    let file      = null
    let directory = null

    for (let i = 0; i < filePaths.length; i++) {
      if (!this.exists(filePaths[i])) {
        continue
      }

      try {
        if (fs.statSync(filePaths[i]).isFile()) {
          file = filePaths[i]
          break
        }

        if (fs.statSync(filePaths[i]).isDirectory()) {
          directory = filePaths[i]
          break
        }
      } catch(e) {}
    }

    if (file) {
      this._file(file)
      return
    }

    // Is a directory
    if (this.exists(directory)) {
      this._directory(directory)
      return
    }

    // wk.Print.error(`${p} not found`)
  }

  /**
   * Load a file and create a namespace with the basename
   *
   * @param {String} p
   *
   * @memberOf Importer
   */
  loadNamespace(p) {
    let name = path.basename(p)
    name     = name.split('.').shift()

    const scope = this
    namespace(name, function() {
      scope.load( p )
    })
  }


  /**
   * Load tasks in given context
   *
   * @param {String} p
   * @param {Boolean} createNamespace
   * @param {String|Object} context
   * @memberof Importer
   */
  loadInContext( p, createNamespace, context ) {
    let ctx
    if (typeof context == 'string') {
      ctx = wk.context(context)
    } else {
      ctx = context
    }

    ctx.open()
    this.load( p, createNamespace )
    ctx.close()
  }

  getAPI() {
    const scope = this

    function $require() {
      scope.load.apply(scope, arguments)
    }

    Object.defineProperty($require, 'paths', {
      get() {
        return scope.searchPaths
      },

      set(value) {
        return scope.searchPaths = value
      }
    })

    return $require
  }

  _file(p) {
    const file = require(p)

    if (
      typeof file == 'function'
      || typeof file == 'object' && file.hasOwnProperty('action')
    ) {
      const name = path.basename(p, path.extname(p))
      API.task(name, file)
    }
  }

  _directory(p) {
    const files = fs.readdirSync(p).filter(function(file) {
      return file.match(/\Wkfile|.(js|wk)$/)
    })

    for (const i in files) {
      this._file(`${p}/${files[i]}`)
    }
  }

}

module.exports = Importer