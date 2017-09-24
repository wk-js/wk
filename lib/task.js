'use strict'

const { expose, clone, merge }
= require('lol/utils/object')
const { $readOnly }
= require('lol/utils/object.define')
const { Result, Command }
= require('wk-argv-parser')
const when  = require('when')
const guard = require('when/guard')

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
      description: null,
      taskName: name,
      preReqSequence: 'serie'
    }, expose(options, [ 'visible', 'description', 'taskName', 'preReqSequence' ]))

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

  execute(params) {
    const presenter = this.presenter(params)
    return wk.wkno.task.apply(null, presenter)
    // return wk.run(this.name)
  }

  invoke(params) {
    if (this.prerequisites.length > 0) {
      return wk.wkno.task((resolve, reject) => {
        const p = this[this.options.preReqSequence](this.prerequisites)

        p.then((values) => {
          const presenter = this.presenter(params)
          return wk.wkno.task.apply(null, presenter).call(null, values)
        })

        p.catch(reject)
      })
    }

    return this.execute()
    // return wk.run(this.name, false)
  }

  presenter(params) {
    let argv = this.argv.clone()

    const context = {
      name: this.name,
      path: this.getPath(),
      getParams: () => {
        return merge(clone(argv.params), params || {})
      }
    }

    if (this.command) {
      argv.soft_params = merge(clone(argv.soft_params), params || {})
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
    $readOnly(context, 'argv')

    const options = {
      taskName: context.path,
      visible: this.options.visible,
      description: this.options.description
    }

    return [ this.action, context, options ]
  }

}

module.exports = Task