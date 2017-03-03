'use strict'

function NOOP() {}

class ExtraTask {

  constructor(name, setupFn) {
    this.name      = name
    this.setupFn   = setupFn.bind(this)
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
      this.setupFn()
      this.configure()
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