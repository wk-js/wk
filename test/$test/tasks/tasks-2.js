const { promise } = require( "when" );

function task0( wk, argv ) {
  console.log('Hello from Task0')

  console.log( 'task0', wk.data() )
  console.log( wk.mainTaskId )

  // wk.run( 'lol:task1', { mainTaskId: wk.mainTaskId, message: 'Hello to Task1' } )
  // wk.run( 'lol:task1', { message: 'Hello to Task1' } )
  // wk.run( 'lol:task1', { mainTaskId: wk.mainTaskId, message: 'Hello to Task1' } )
  // wk.run( 'lol:task1', { message: 'Hello to Task1' } )
  // wk.run( 'lol:task1', { mainTaskId: wk.mainTaskId, message: 'Hello to Task1' } )
  // wk.run( 'lol:task1', { message: 'Hello to Task1' } )
  // wk.run( 'lol:task1', { mainTaskId: wk.mainTaskId, message: 'Hello to Task1' } )

  return wk.run( 'task3' ).then(function(a) {
    console.log( a )
  })
}

function task1( wk, argv ) {
  console.log( argv.message )

  console.log('task1', wk.data())
  wk.data( 'Pourquoi tu fais ça ?' )
  console.log( wk.mainTaskId )

  return promise(function(resolve) {
    setTimeout(resolve, 500)
  })
}

module.exports = function( wk ) {

  wk.run('task0').then(() => wk.run('task1'))

  wk.task('task0', task0, {
    prerequisities: {
      tasks: [ 'lol:task1' ],
      sequence: 'serie'
    }
  })

  wk.task('lol:task1', task1, {
    concurrency: 1,
    argv: {
      message: 'lol'
    }
  })

  wk.load( '../task3', true )
  wk.require('../task4')
}