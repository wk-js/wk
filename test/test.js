
const wk = require('../lib/workflow')

wk.Print.verbose()

task('hello', { argv: { name: 'John' } }, function(params) {
  console.log( 'Hello', params.name, '!' )
  return params.name
})

task('salut', { argv: { name: 'Max' } }, function(params) {
  console.log( 'Salut', params.name, '!' )
  return params.name
})

task('message', function(params) {
  console.log(params.name+':', params.message)
})

task('thinking', { async: true }, function(params) {
  console.log(params.name, 'thinking...')
  setTimeout(() => {
    this.complete()
  }, 1000)
})

serie(
  'hello',
  'salut',
  'thinking --name Max',
  'message --name Max --message "How are you ?"',
  'thinking --name John',
  'message --name John --message "Je vais bien et toi ?"'
)