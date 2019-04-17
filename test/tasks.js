// Generator task
function* task0( wk, argv ) {
  const result = yield wk
  .run(`task1`)
  .pipe('task2')
  .promise

  console.log( 'Execute task0', result )
  return 'task0'
}

// Synchronous task
function task1( wk, argv ) {
  console.log( 'Execute task1', argv.result )
  return 'task1'
}

// Asynchronous task
function task2( wk, argv ) {
  console.log( 'Execute task2', argv.result )
  return new Promise((resolve) => {
    setTimeout(() => resolve('task2'), 2000)
  })
}

// Synchronous task with result from generator
function task3( wk, argv ) {
  console.log( 'Execute task3', argv.result )
  return 'task3'
}

function task( wk, argv ) {
  console.log( 'Execute task ', argv.result )
  return wk
  .run( 'task0' )
  .pipe( 'task3' )
  .promise
}

module.exports = function( wk ) {
  wk.task( task0 )
  wk.task( task1 )
  wk.task( task2 )
  wk.task( task3 )
  wk.task( task )
}