
const wk = require('../lib/workflow')

wk.Print.silent()

wk.task('hello', { argv: { name: 'John' } }, function(params) {
  console.log( 'Hello', params.name, '!' )
  return params.name
})

wk.task('salut', { argv: { name: 'Max' } }, function(params) {
  console.log( 'Salut', params.name, '!' )
  return params.name
})

wk.task('message', { async: true }, function(params) {
  console.log(params.name+':', params.message)
  setTimeout(this.complete, 2000)
})

wk.task('thinking', { async: true }, function(params) {
  console.log(params.name, 'thinking...')
  setTimeout(() => {
    this.complete()
  }, 2000)
})

wk.serie(
  'hello',
  'salut',
  'thinking --name Max',
  'message --name Max --message "How are you ?"',
  'thinking --name John',
  'message --name John --message "Je vais bien et toi ?"'
)

// wk.task('msg', { async: true, pool: 3 }, function() {
//   console.log('Start', this.name)
//   setTimeout(() => {
//     console.log('Done', this.name)
//     this.complete()
//   }, 2000)
// })

// wk.Tasks['msg'].invoke()
// wk.Tasks['msg'].invoke()
// wk.Tasks['msg'].invoke()
// wk.Tasks['msg'].invoke()
// wk.Tasks['msg'].invoke()
// wk.Tasks['msg'].invoke()
// wk.Tasks['msg'].invoke()