'use strict'

const { FileList } = require('filelist')
const { template } = require('lol/utils/string')
const ExtraTask = require('../tasks/extra-task2')
const path      = require('path')
const when      = require('when')
const fs        = require('fs-extra')
const { pkg_path } = require('../config/paths')


const COMMANDS = {
  zip:   "zip -r ${path}.zip ${path}",
  gzip:  "tar -c ${path} | gzip -9 -> ${path}.tar.gz",
  bzip2: "tar -cjf ${path}.tar.bz2 ${path}",
}

class PackageTask extends ExtraTask {

  init() {
    this.filelist = new FileList
    this.tmp_path = pkg_path
    this.targets  = [ 'gzip' ]
  }

  getPackagePath() {
    return path.join( this.tmp_path, this.name )
  }

  configure() {
    const nm    = this.getPath.bind(this)
    const scope = this

    desc('Create a package. Targets: ' + scope.targets.join(', '))
    task('default', [
      nm('clean'),
      nm('copy'),
      nm('archive'),
      nm('clean')
    ], { preReqSequence: 'serie' })

    task('clean', { async: true, visible: false, always_run: true }, function() {
      const p = scope.getPackagePath()

      fs.remove( p, (err) => {
        if (err) this.fail( err )
        else this.complete()
      })
    })

    task('copy', { async: true, visible: false }, function() {
      const p = scope.getPackagePath()

      scope.filelist.resolve()

      when.reduce(scope.filelist.toArray(), function( res, file ) {
        return when.promise(function( resolve ) {
          fs.copy( file, path.join( p, file ), resolve )
        })
      }, [])
      .then(this.complete)
      .catch(this.fail)

    })


    task('archive', { async: true, visible: false }, function() {
      const targets = scope.targets.map(function( target ) {
        if (!COMMANDS[target]) return null

        return {
          command: template( COMMANDS[target], { path: scope.name } ),
          cwd: scope.tmp_path,
          printStdout: false
        }
      }).filter(( cmd ) => { return !!cmd })

      wk.exec(targets).catch(this.fail).done(this.complete)

    })

  }

}

module.exports = ExtraTask.new( PackageTask )