import { dirname } from "path";

const Module = module.constructor as any

export function requireContent(code:string, filename:string, context?:any) {

  const paths = Module._nodeModulePaths(dirname(filename))

  const parent = module
  const mod    = new Module(filename, parent)
  mod.filename = filename
  mod.exports  = context
  mod.loaded   = true
  mod.paths    = paths
  mod._compile( code, filename )

  const xports = mod.exports
  parent.children && parent.children.splice(parent.children.indexOf(mod), 1)

  return xports

}