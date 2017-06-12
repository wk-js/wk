
const wk = require('../lib/workflow')

wk.Print.silent()

task('hello', { argv: { name: 'John' } }, function() {
  console.log( 'Hello', this.argv.name, '!' )
  return this.argv.name
})

task('salut', { argv: { name: 'Max' } }, function() {
  console.log( 'Salut', this.argv.name, '!' )
  return this.argv.name
})

task('message', function() {
  console.log(this.argv.name+':', this.argv.message)
})

task('thinking', { async: true }, function() {
  console.log(this.argv.name, 'thinking...')
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