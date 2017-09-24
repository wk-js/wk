'use strict'

const { scope } = require('lol/utils/function')

const EXPORTS = {
  set(api_key, context) {
    const API = require(`./${api_key}`)

    for (const key in API) {
      if (typeof API[key] == 'function') {
        context[key] = scope(API[key], context)
      }
    }
  }
}

module.exports = EXPORTS