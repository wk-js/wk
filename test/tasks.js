// Generator task
function* task0( wk, argv ) {
  const result = yield wk
  .run(`task1`, { mainTaskId: argv.mainTaskId })
  .pipe('task2', { mainTaskId: argv.mainTaskId })
  .promise

  console.log( 'Execute task0', argv.mainTaskId, result )
  return 'task0'
}

// Synchronous task
function task1( wk, argv ) {
  console.log( 'Execute task1', argv.mainTaskId, argv.result )
  return 'task1'
}

// Asynchronous task
function task2( wk, argv ) {
  console.log( 'Execute task2', argv.mainTaskId, argv.result )
  return new Promise((resolve) => {
    setTimeout(() => resolve('task2'), 2000)
  })
}

// Synchronous task with result from generator
function task3( wk, argv ) {
  console.log( 'Execute task3', argv.mainTaskId, argv.result )
  return 'task3'
}

module.exports = function( wk ) {
  wk.task( 'task0', task0, { description: 'task0 description' } )
  wk.task( 'task1', task1, { description: 'task1 description' } )
  wk.task( 'task2', task2, { description: 'task2 description' } )
  wk.task( 'task3', task3, { description: 'task3 description' } )

  wk.task( 'task', ( wk, argv ) => {
    console.log( 'Execute task ', argv.mainTaskId, argv.result )
    return wk
    .run( 'task0', { mainTaskId: argv.mainTaskId } )
    .pipe( 'task3', { mainTaskId: argv.mainTaskId } )
    .promise
  })
}