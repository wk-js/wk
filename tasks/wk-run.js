const commandTask = wk.extra('command-task2')

commandTask('run', function() {

  this.config = {
    parallel: {
      type: 'boolean',
      default: false,
      aliases: [ 'p' ],
      description: 'Execute tasks in "parallel"'
    }
  }

}, function() {

  const scope  = this
  const config = this.config

  task('default', function() {

    const params = scope.getParameters()

    const tasks = params.__._.slice(0)
    tasks.shift()

    if (params.help || !tasks || tasks.length === 0) {
      console.log( config.help.description )
      return this.complete()
    }

    if (this.argv.parallel) {
      parallel(tasks).catch(this.fail).then(this.complete)
    } else {
      serie(tasks).catch(this.fail).then(this.complete)
    }

  })

})

console.log('lol')