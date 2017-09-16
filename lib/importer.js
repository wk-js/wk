'use strict'

const fs   = require('fs')
const path = require('path')
const API  = require('./api')

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
  load(p, createNamespace) {

    if (createNamespace) {
      this.loadNamespace(p)
      return
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
    }
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

  getAPI() {
    const scope = this

    function r() {
      scope.load.apply(scope, arguments)
    }

    Object.defineProperty(r, 'paths', {
      get() {
        return scope.searchPaths
      },

      set(value) {
        return scope.searchPaths = value
      }
    })

    return r
  }

  _file(p) {
    const file = require(p)

    if ((typeof file).match(/function|object/) && !Array.isArray(file)) {
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

module.exports = new Importer