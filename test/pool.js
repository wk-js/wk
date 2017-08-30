'use strict'

const wk = require('../lib/workflow')

wk.task('msg', { async: true, pool: 3 }, function() {
  console.log('Start', this.name)
  setTimeout(() => {
    console.log('Done', this.name)
    this.complete()
  }, 2000)
})

wk.Tasks['msg'].invoke()
wk.Tasks['msg'].invoke()
wk.Tasks['msg'].invoke()
wk.Tasks['msg'].invoke()
wk.Tasks['msg'].invoke()
wk.Tasks['msg'].invoke()
wk.Tasks['msg'].invoke()