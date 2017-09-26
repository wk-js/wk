'use strict'

const { scope } = require('lol/utils/function')

const EXPORTS = {
  set(api_key, obj, context) {
    const API = require(`./${api_key}`)

    for (const key in API) {
      if (typeof API[key] == 'function') {
        obj[key] = scope(API[key], context || obj)
      }
    }
  }
}

module.exports = EXPORTS