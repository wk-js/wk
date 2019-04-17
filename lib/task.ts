import { merge, clone } from 'lol/utils/object';
import { Namespace } from './namespace';
import { Context } from './context';
import { promise, isPromiseLike } from 'when';
import { createHash } from 'crypto';
import { isGeneratorLike, isGenerator } from './utils/generator';

export interface TaskOptions {
  argv: any,
  visible: boolean,    // TODO: Handle visibility from CLI execution
  description: string, // TODO: Show description to CLI
  name: string,
  concurrency: number
}

export class Task {

  static _id = 0

  public options: TaskOptions = {
    argv: {},
    visible: false,
    name: '_noname',
    concurrency: -1,
    description: ''
  }

  public namespace: Namespace

  private _pool:any[] = []
  private _running = 0

  constructor(context: Context, private action:Function, name?:string, options?:TaskOptions) {
    if (!name) {
      Task._id++
      name = this.options.name + Task._id
    }

    this.options.name = name

    if (options) {
      this.options = merge( this.options, options )
    }

    this.namespace = Namespace.findOrCreateNamespace( name, context )

    this.link()
  }

  get context() {
    return this.namespace.context
  }

  clone() {
    const task   = new Task( this.context, this.action, this.options.name )
    task.options = clone( this.options )
    return task
  }

  execute( argv?:any, hooks:boolean = false ) {
    return promise<any>((resolve, reject) => {
      this._pool.push({ resolve, reject, argv, hooks })
      this._next()
    })

    .then((value:any) => {
      this._running--
      this._next()

      return value
    })
  }

  getPath() {
    return this.namespace.getPath( this.options.name )
  }

  /**
   *
   * Register the task to its namespace and be visible
   *
   * @memberof Task
   */
  link() {
    this.namespace.registerTask( this )
  }


  /**
   *
   * Unregister the task to its namespace and be hidden
   *
   * @memberof Task
   */
  unlink() {
    this.namespace.unregisterTask( this )
  }

  private _prepare( argv?:any ) {
    // Set ARGV
    argv = merge( {}, this.options.argv, argv || {} )

    // Set task path
    const path = this.getPath()

    if (Array.isArray(argv._) && argv._[0] !== path) {
      argv._.unshift( path )
    } else {
      argv._ = [ path ]
    }

    return { argv }
  }

  private _execute( argv?:any ) {
    const params = this._prepare( argv )

    let value = this.action( this.context.api(), params.argv )

    // Generator case
    if ( isGenerator(this.action) && isGeneratorLike( value ) ) {
      const generator = value

      value = new Promise((resolve) => {
        let next

        const iterate = ( v?:any ) : any => {
          next = generator.next( v )

          if (next.done) {
            return resolve( next.value )
          }

          if (isPromiseLike(next.value)) {
            return next.value.then(iterate)
          }

          return iterate(next.value)
        }

        iterate()

      })

      value.then(() => this._clean( params ))
    }

    // Promise case
    else if ( isPromiseLike(value) ) {
      value.then(() => this._clean( params ))
    }

    // Synchronous case
    else {
      this._clean( params )
    }

    return value
  }

  private _next() {
    if (this.options.concurrency > -1 && this._running >= this.options.concurrency) return;

    const task = this._pool.shift()
    if (!task) return

    this._running++

    const value = this._execute( task.argv )
    task.resolve(value)
  }

  _clean( params:any ) {
    // delete this.context.stores[params.id]
  }

}