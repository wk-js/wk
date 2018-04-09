import { Context } from "./context";
import { Task } from "./task";
import { merge, clone } from "lol/utils/object";
import { Parser } from 'wk-argv-parser';
import { bind } from "lol/utils/function";
import { reduce, resolve } from "when";
import { map } from './utils/concurrent';

interface TaskRunnerObject {
  task: Task,
  argv?: any
}

export class TaskRunner {

  public concurrency:number = 10

  constructor(public context:Context) {
    bind(this, 'run', 'serie', 'parallel')
  }

  api() {
    return {
      run:      this.run,
      serie:    this.serie,
      parallel: this.parallel
    }
  }

  promiseApi(promise: When.Promise<any>) {
    return Object.assign(this.api(), {
      promise: promise,
      pipe: this.pipe( promise )
    })
  }

  run(nameOrTask:string | Task, argv?: any) {
    let t

    if (nameOrTask instanceof Task) {
      t = { task: nameOrTask, argv: argv }
    } else if (typeof nameOrTask === 'string') {
      t = this._resolveTask( nameOrTask )
    }

    if (!t) {
      throw new Error( `Task "${nameOrTask}" does not exists.` )
    }

    t.argv = merge( {}, t.argv, argv )

    const promise = t.task.execute( argv )
    return this.promiseApi( promise )
  }

  pipe( promise:When.Promise<any> ) {
    return ( nameOrTask:string, argv?:any ) => {
      const p = promise.then((result:any) => {
        return this
        .run(nameOrTask, { result: result })
        .promise
      })

      return this.promiseApi( p )
    }
  }

  serie(...names:(string | Task)[]) {
    const tasks = this._resolve( names )

    const results:any[] = []

    return reduce<any[]>(tasks, (r:any[], t:TaskRunnerObject) => {
      return this.run(t.task, t.argv).promise.then((value:any) => {
        r.push( value )
        return r
      })
    }, results)
  }

  parallel(...names:(string | Task)[]) {
    const tasks = this._resolve( names )

    return map<any>(tasks, this.concurrency,(t:TaskRunnerObject) => {
      return this.run( t.task, t.argv ).promise
    })
  }

  private _resolve(names:(string | Task)[]) {
    const tasks: TaskRunnerObject[] = []

    for (let i = 0, res = null, len = names.length; i < len; i++) {
      res = this._resolveTask(names[i])
      if (res) tasks.push( res )
    }

    return tasks
  }

  private _resolveTask( nameOrTask:string | Task ) {
    if (nameOrTask instanceof Task) {
      return {
        task: nameOrTask,
        argv: {}
      } as TaskRunnerObject
    }

    const argv = Parser.parse(nameOrTask).params
    nameOrTask = argv._[0]

    const tsk = this.context.defaultNamespace.resolveTask(nameOrTask as string)

    if (tsk) {
      return {
        task: tsk,
        argv: argv
      } as TaskRunnerObject
    }

    return null
  }

}