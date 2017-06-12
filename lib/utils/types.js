module.exports = {
  isBoolean(value) {
    return typeof value === 'boolean'
  },

  isString(value) {
    return typeof value === 'string'
  },

  isNumber(value) {
    return !isNaN(value)
  },

  isArray(value) {
    return Array.isArray(value)
  },

  isObject(value) {
    return typeof value === 'object' && !Array.isArray(value) && value !== null
  },

  isUndefined(value) {
    return typeof value === 'undefined'
  },

  isNull(value) {
    return value === null
  }
}