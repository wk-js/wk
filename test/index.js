const { Context } = require( '../js/context' )

const c  = new Context( 'wk' )
const wk = c.api()

wk.load( './tasks' )

wk.run( 'task' )