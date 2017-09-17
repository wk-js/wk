'use strict'

const wk = require('../lib/wk')

const tasks = {

  "task1": function(resolve) {
    resolve({ name: 'John' })
  },

  "task2": function(resolve) {
    this.result.message = 'Salut'
    resolve(this.result)
  },

  "task3": function(resolve) {
    this.result.day = 'monday'
    resolve(this.result)
  },

  "task4": function(resolve) {
    console.log(this.result)
    resolve(this)
  }

}

wk.nano.serie(tasks)
