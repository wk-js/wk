'use strict'

function NOOP() {}

class ExtraTask {

  constructor(name, beforeFnOrObject, afterFn) {
    this.hooks = {
      before: NOOP,
      after: afterFn || NOOP
    }

    if (typeof beforeFnOrObject === 'function') {
      this.hooks.before = beforeFnOrObject
    } else if (typeof beforeFnOrObject === 'object') {
      Object.assign(this.hooks, beforeFnOrObject)
    }

    this.hooks.before = this.hooks.before.bind(this)
    this.hooks.after  = this.hooks.after.bind(this)

    this.name      = name
    this.className = 'ExtraTask'

    this.identifier = this.className.toLowerCase().replace('task', '')

    this.namespace = namespace(this.name, NOOP)
  }

  init(){}

  getPath( name ) {
    const pth = this.namespace.getPath()
    if (name) {
      if (pth.length === 0) return name
      return this.path = pth + ':' + name
    }
    return pth
  }

  _configure() {
    this.init()

    namespace(this.name, () => {
      this.hooks.before()
      this.configure()
      this.hooks.after()
    })

  }

}

ExtraTask.new = function( ClassConstructor ) {
  return (function() {
    const args = [...arguments]
    args.unshift( null )

    const o = new (Function.prototype.bind.apply(ClassConstructor, args))
    o.className = ClassConstructor.name
    o._configure()
    return o

  }).bind(ClassConstructor)
}

module.exports = ExtraTask