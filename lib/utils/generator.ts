function* g() {
  yield 0
}

export const GeneratorConstructor = g.constructor

export function isGenerator( value:any ) {
  return value instanceof GeneratorConstructor
}

export function isGeneratorLike( value:any ) {
  return typeof value === 'object' && 'next' in value && 'throw' in value
}