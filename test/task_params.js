
const wk = require('../lib/wk')

wk.Print.silent()

wk.task('hello', { argv: { name: 'John' } }, function(resolve) {
  console.log( 'Hello', this.argv.name, '!' )
  resolve()
})

wk.task('salut', { argv: { name: 'Max' } }, function(resolve) {
  console.log( 'Salut', this.argv.name, '!' )
  resolve()
})

wk.task('message', function(resolve) {
  console.log(this.argv.name+':', this.argv.message)
  setTimeout(resolve, 2000)
})

wk.task('thinking', function(resolve) {
  console.log(this.argv.name, 'thinking...')
  setTimeout(resolve, 2000)
})

wk.serie(
  'hello',
  'salut',
  'thinking --name Max',
  'message  --name Max  --message "How are you ?"',
  'thinking --name John',
  'message  --name John --message "Je vais bien et toi ?"'
)