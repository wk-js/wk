'use strict'

const { expose, merge, immutable }
= require('lol/utils/object')
const { $readOnly }
= require('lol/utils/object.define')
const { Result, Command }
= require('wk-argv-parser')

const EXPOSE_OPTIONS = [
  'visible',
  'description',
  'taskName',
  'preReqSequence',
  'async'
]

class Task {

  constructor(name, prerequisites, options, action) {
    this.namespace     = null
    this.prerequisites = prerequisites
    this.action        = action

    // Options
    options        = options || {}
    options.argv   = options.argv || {}
    options.argv._ = options.argv._ || [ name ]

    this.options = Object.assign({
      visible: true,
      async: false,
      description: null,
      taskName: name,
      preReqSequence: 'serie'
    }, expose(options, EXPOSE_OPTIONS))

    // Set argv
    this.argv = new Result
    if (options.argv._.indexOf(this.name) == -1) {
      options.argv._.unshift( this.name )
    }
    this.argv.set( options.argv )

    // Configure command
    if (options.command) {
      this.command = new Command( this.name )
      options.command.call( this.command )
    }
  }

  get name() {
    return this.options.taskName
  }

  /**
   *
   * Update and returns task path
   * @returns {String}
   *
   * @memberof Task
   */
  getPath() {
    let nsPath = ''

    if (this.namespace) nsPath = this.namespace.getPath()

    let pth = this.name

    if (nsPath && nsPath.length !== 0) pth = nsPath + ':' + this.name

    return pth
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

  executeTask(params) {
    const presenter = this.presenter(params)
    return wk.wkno.task.apply(null, presenter)
  }

  execute(params) {
    return this.executeTask(params).call()
  }

  invokeTask(params) {
    if (this.prerequisites.length > 0) {
      return wk.wkno.task((resolve, reject) => {
        const p = wk[this.options.preReqSequence](this.prerequisites)

        p.then((values) => {
          const presenter = this.presenter(params)
          return wk.wkno.task.apply(null, presenter).call(null, values)
        })

        p.catch(reject)
      })
    }

    return this.executeTask()
  }

  invoke(params) {
    return this.invokeTask(params).call()
  }

  presenter(params) {
    let argv = this.argv.clone()
    argv.soft_params = merge(argv.soft_params, params || {})

    const context = {
      name: this.name,
      path: this.getPath()
    }

    if (this.command) {
      const res = this.command.parse( argv.toString() )
      argv = res.result

      context.command = {}

      if (this.command.config.help) {
        context.command.help = `${this.name} ${this.command.config.help.description}`
      }

      if (res.errors) {
        context.command.errors = res.errors.map(function(error) {
          return `${error.message} [parameters: ${error.missings.join(', ')}]`
        }).join(' ')
      }
    }

    $readOnly(context, 'name')
    $readOnly(context, 'path')
    $readOnly(context, 'command')
    context.params = immutable( argv.params )

    const options = {
      taskName: context.path,
      description: this.options.description,
      visible: this.options.visible,
      async: this.options.async
    }

    return [ this.action, context, options ]
  }

}

module.exports = Task