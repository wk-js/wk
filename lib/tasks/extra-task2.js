'use strict'

function NOOP() {}

class ExtraTask {

  constructor(name, beforeFnOrObject, afterFn) {
    this.getPath = this.getPath.bind(this)

    this.hooks = {
      beforeConfigure: NOOP,
      afterConfigure: afterFn || NOOP
    }

    if (typeof beforeFnOrObject === 'function') {
      this.hooks.beforeConfigure = beforeFnOrObject
    } else if (typeof beforeFnOrObject === 'object') {
      Object.assign(this.hooks, beforeFnOrObject)
    }

    this.hooks.beforeConfigure = this.hooks.beforeConfigure.bind(this)
    this.hooks.afterConfigure  = this.hooks.afterConfigure.bind(this)

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
      this.hooks.beforeConfigure()
      this.configure()
      this.hooks.afterConfigure()
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