'use strict'

require('../lib/wk')

wk.context.create('context1')
wk.context.create('context2')

task('task0', { async: true }, function(resolve) {
  console.log('task0')

  wk.context.execute('context1', () => {
    return wk.run('task1')
  })
  .then(() => {
    console.log('done')
    resolve()
  })
})

wk.context.execute('context1', function() {
  task('task1', function() {
    console.log('task1')
    return 'task1'
  })


  wk.context.open('context2')       // Open 'context2' context
  console.log('context?', wk.name)
  wk.context.close()                // Close 'context2' context
  console.log('context?', wk.name)
  wk.context.close()                //  Close 'context1' context
  console.log('context?', wk.name)

  // Context is wk because close twice
  task('task2', function() {
    console.log('task2')
    return 'task2'
  })
})


console.log(wk.name)
console.log(Object.keys(wk.getTasks()))