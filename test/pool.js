'use strict'

const wk = require('../lib/wk')

wk.task('msg', { concurrency: 3 }, function(resolve) {
  console.log('Start', this.name)
  setTimeout(() => {
    console.log('Done', this.name)
    resolve()
  }, 2000)
})

wk.Tasks['msg'].invoke()
wk.Tasks['msg'].invoke()
wk.Tasks['msg'].invoke()
wk.Tasks['msg'].invoke()
wk.Tasks['msg'].invoke()
wk.Tasks['msg'].invoke()
wk.Tasks['msg'].invoke()