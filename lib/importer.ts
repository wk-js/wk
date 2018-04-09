import { Context } from "./context";
import { bind } from "lol/utils/function";
import { dirname, join, relative, normalize, basename } from "path";
import { isFile } from './utils/fs';
import { readFileSync } from "fs";
import { requireContent } from "./utils/require-content";

export class Importer {

  public paths: string[] = []
  public extensions: string[] = [ '', '.js' ]

  constructor(public context:Context) {
    bind( this, 'resolve', 'require', 'load' )

    if ( process.mainModule ) {
      this.paths.push( dirname(process.mainModule.filename) )
    }

    this.paths.push( process.cwd() )
  }

  api() {
    return {
      resolve: this.resolve,
      require: this.require,
      load:    this.load
    }
  }

  resolve( filename:string ) {
    let path: string | null = null

    for (let i = 0, ilen = this.paths.length; i < ilen; i++) {
      for (let j = 0, jlen = this.extensions.length; j < jlen; j++) {
        path = join( this.paths[i], filename + this.extensions[j] )
        if (isFile( path )) {
          return path
        }
      }
    }

    throw new Error(`Cannot find module '${filename}'`)
  }

  require( filename:string ) {
    const path:string = this.resolve( filename )
    const content     = readFileSync(
      relative(process.cwd(), path),
      'utf-8'
    )

    const contentExports = requireContent( content, path )

    if (this.paths.indexOf( dirname(path) ) === -1) {
      this.paths.unshift( dirname(path) )
    }

    return contentExports
  }

  load( filename:string, asNamespace:boolean = false ) {
    const contentExports = this.require( filename )

    if (typeof contentExports !== 'function') {
      throw new Error(`Cannot load '${filename}. module.exports is not a Function.'`)
    }

    const api = this.context.api()

    if (asNamespace) {
      let ns_name = basename( filename ).split('.').shift()

      if (ns_name && ns_name.length > 0) {
        this.context.namespace(ns_name, () => {
          contentExports( api )
        })
      }

      return
    }

    contentExports( api )
  }

}