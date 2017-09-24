'use strict'

const wk = require('../lib/wk')

wk.task('greet', function(resolve) {
  resolve(Math.round(Math.random()) ? 'Salut' : 'Hello')
})

wk.task('name', {
  command: function() {
    this
    .string('name')
    .required('name', 'Name is needed')
  }
}, function(resolve, reject) {
  console.log(this.getParams(), this.command)

  if (this.command.errors) {
    reject(new Error(this.command.errors))
    return
  }

  const params = this.getParams()
  resolve(params.name)
})

wk.namespace('messages', function() {
  wk.task('hello', [ 'name', 'greet' ], function(resolve) {
    console.log(`${this.result[1]} ${this.result[0]} !`)
    resolve()
  })
})

function command() {
  this

  .string('name')
  .required('name', 'Name is needed')
}

wk.task('cmd', { command }, function(resolve, reject) {
  const p = this.getParams()

  if (this.command.errors) {
    reject(new Error(this.command.errors))
  }

  wk.serie(
    `name --name ${p.name}`,
    `greet`
  )
  .then((a) => {
    console.log(`${a[1]} ${a[0]} !`)
  })
  .catch(reject)
})

// wk.task('start', [ 'messages:hello --test test' ])

wk.require('./test2')

wk.run('new')
wk.run('new')
wk.run('new')
wk.run('new')
wk.run('new')
wk.run('new')
wk.run('new')
wk.run('new')
wk.run('new')
wk.run('new')
wk.run('new')
wk.run('new')

// console.log(require.main)
// console.log(module)


// console.log(wk)

// wk.getTask('new').execute()
// wk.getTask('new').execute()
// wk.getTask('new').execute()
// wk.getTask('new').execute()
// wk.getTask('new').execute()
// wk.getTask('new').execute()
// wk.getTask('new').execute()
// wk.getTask('new').execute()

// console.log(module.require.toString())
// console.log(module)