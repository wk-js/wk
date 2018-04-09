import { Namespace } from './namespace'
import { Task, TaskOptions } from './task';
import { TaskRunner } from './task-runner';
import { bind } from 'lol/utils/function';
import { merge } from 'lol/utils/object';
import { Importer } from './importer';
import { createHash } from 'crypto';

export class Context {

  static contexts: { [key:string]: Context } = {}

  public Tasks: Record<string, Task> = {}

  public defaultNamespace: Namespace
  public taskRunner: TaskRunner

  public currentNamespace: Namespace

  public importer: Importer

  public stores: { [key:string]: any } = {}

  constructor(public name?:string) {
    bind( this, 'task', 'namespace', 'store', 'infos' )

    if (!this.name) {
      this.name = createHash('md5').update(Date.now()+'').digest('hex')
    }

    Context.contexts[this.name] = this

    this.defaultNamespace = new Namespace( 'default', this )
    this.currentNamespace = this.defaultNamespace

    this.taskRunner = new TaskRunner( this )

    this.importer = new Importer( this )
  }

  api() {
    return Object.assign(
      {
        namespace: this.namespace,
        task:      this.task,
        store:     this.store,
        infos:     this.infos,

        getContextApi: Context.getContextApi
      },
      this.importer.api(),
      this.taskRunner.api()
    )
  }

  store( store_key:string, value?:any ) {
    if (typeof value !== 'undefined') {
      this.stores[store_key] = value
    }

    return this.stores[store_key]
  }

  task(...args:(string|Function|TaskOptions)[]) {
    const parameters = Array.prototype.slice.call(args)

    let name: string = 'no_name'
    let action: Function|undefined = undefined
    let options: TaskOptions|undefined = undefined

    parameters.forEach((param: string | Function | TaskOptions) => {
      if (typeof param === 'string') {
        name = param
      } else if (typeof param === 'function') {
        action = param
      } else if (typeof param === 'object') {
        options = param
      }
    })

    if (!action) {
      throw new Error( 'Cannot create a task without action.' )
    }

    // create task
    return new Task( this, action, name, options )
  }

  namespace( name:string, closure:Function ) {
    const previous = this.currentNamespace
    const ns = Namespace.findOrCreateNamespace( name, this )
    this.currentNamespace = ns
    closure.call(ns)

    // If the namespace as a default task
    // the path to the namespace will execute the default task
    if (ns.tasks.default) {
      const tsk = ns.tasks.default
      tsk.unlink()
      tsk.namespace    = ns.parent || ns.root
      tsk.options.name = ns.name
      tsk.link()
    }

    this.currentNamespace = previous

    return ns
  }

  infos( info:string ) {

    switch( info ) {

      case "name": {
        return this.name
      }

      case "tasks": {
        return Object.keys( this.Tasks )
      }

    }

  }

  static getContext( name:string ) {
    if (Context.contexts[name]) {
      return Context.contexts[name]
    }

    throw new Error(`Context with name "${name}" does not exist`)
  }

  static getContextApi( name:string ) {
    return Context.getContext( name ).api()
  }

}