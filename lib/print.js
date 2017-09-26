'use strict'

const { Print, Levels, Plugins } = require('wk-print')

module.exports = function() {
  const print = new Print

  print.level('debug', Levels.debug)
  print.level('warn', Levels.warn)
  print.level('error', Levels.error)
  print.plugin('tag', Plugins.tag)
  print.plugin('date', Plugins.date)
  print.plugin('style', Plugins.style)
  print.visibility('log'  , true)
  print.visibility('debug', false)
  print.visibility('error', true)
  print.visibility('warn' , false)

  const timers = {}

  print.time = function(key) {
    if (key) timers[key] = Date.now()
  }

  print.timeEnd = function(key) {
    if ( timers[key] ) {
      const r = (Date.now() - timers[key]) + 'ms'
      delete timers[key]
      return r
    }
  }

  return print
}