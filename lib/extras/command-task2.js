'use strict'

const ARGParser = require('../arg-parser')
const ExtraTask = require('../tasks/extra-task2')

class CommandTask extends ExtraTask {

  init() {
    this.getParameters = this.getParameters.bind(this)

    this.config = {}
  }

  getParameters() {
    const args = ARGParser.toArray(wk.Tasks[this.getPath()].argv)
    return ARGParser.parse(args, this.config, 'valid')
  }

  configure() {

    ARGParser._createHelp(this.config)

    task('default', function() {
      console.log('Override default task')
    })

  }

}

module.exports = ExtraTask.new( CommandTask )