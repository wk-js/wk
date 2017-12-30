'use strict'

const wk = require('../lib/wk')

wk.task('greet', function() {
  return Math.round(Math.random()) ? 'Salut' : 'Hello'
})

wk.task('name', {
  command: function() {
    this
    .string('name')
    .required('name', 'Name is needed')
  }
}, function() {
  if (this.command.errors) {
    throw new Error(this.command.errors)
  }

  return this.params.name
})

wk.namespace('messages', function() {
  wk.task('hello', [ 'name', 'greet' ], function() {
    console.log(`${this.result[1]} ${this.result[0]} !`)
  })
})

function command() {
  this

  .string('name')
  .required('name', 'Name required')
}

wk.task('cmd', { command, async: true }, function(resolve, reject) {
  if (this.command.errors) {
    return reject(new Error(this.command.errors))
  }

  wk.serie(
    `name --name ${this.params.name}`,
    `greet`
  )
  .then((a) => {
    console.log(`${a[1]} ${a[0]} !`)
  })
  .catch(reject)
})

// run('cmd --name lol')
// run('messages:hello')

// console.log(require.main)
// console.log(module)


// console.log(wk)

// getTask('new').execute()
// getTask('new').execute()
// getTask('new').execute()
// getTask('new').execute()
// getTask('new').execute()
// getTask('new').execute()
// getTask('new').execute()
// getTask('new').execute()

// console.log(module.require.toString())
// console.log(module)