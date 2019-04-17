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

  constructor(public name?:string) {
    bind( this, 'task', 'namespace', 'infos' )

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
        infos:     this.infos,

        getContextApi: Context.getContextApi,
        createContext: Context.createContext
      },
      this.importer.api(),
      this.taskRunner.api()
    )
  }

  task(...args:(string|Function|TaskOptions)[]) {
    const parameters = Array.prototype.slice.call(args)

    let name: string | undefined
    let action: Function | undefined
    let options: TaskOptions | undefined

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

    if (!name) {
      name = action.name
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

  infos( info:string, value?:any ) {

    switch( info ) {

      case "name": {
        return this.name
      }

      case "tasks": {
        return Object.keys( this.Tasks )
      }

      case "description": {
        if (this.Tasks[value as string]) {
          return this.Tasks[value as string].options.description
        }
        return ''
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

  static createContext( name:string ) {
    if (Context.contexts[name]) {
      return Context.contexts[name]
    }

    return new Context( name )
  }

}