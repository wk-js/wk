const { Task } = require( '../js/task' )
const { Context } = require( '../js/context' )
const { Importer } = require( '../js/importer' )

const c   = new Context('wk')
const api = c.api()

api.load( './tasks/tasks-2' )

api.run('task0', { message: 'Hello World' })
