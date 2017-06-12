
const wk = require('../lib/workflow')

task('message', { argv: { name: 'John' } }, function() {
  console.log( 'Hello', this.argv.name, '!' )
  return this.argv.name
})

task('plouf', { argv: { name: 'Max' } }, function() {
  console.log( 'Salut', this.argv.name, '!' )
  return this.argv.name
})

// const TaskManager = require('../lib/task-manager')
// const Task = require('../lib/tasks/task2')

// var task0 = new Task('message', {
//   argv: { name: 'John' },
//   action: function() {
    // console.log( 'Hello', this.argv.name, '!' )
    // return this.argv.name
//   }
// })

// var task1 = new Task('plouf', {
//   argv: { name: 'Max', arr: [ 'lol' ] },
//   action: function() {
//     console.log( 'Salut', this.argv.name, '!', this.argv )
//     return this.argv.name
//   }
// })

// TaskManager.serie(task0, task1).then(function(res) {
//   console.log('-------------------')
//   console.log('Results', res)
// })

// // task1.execute({ argv: { name: 'Pierre' } })
// // task1.execute({ argv: { arr: [ 'plouf' ] } })