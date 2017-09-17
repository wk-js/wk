'use strict'

const { template } = require('lol/utils/string')
const path     = require('path')
const when     = require('when')
const FileList = require('filelist').FileList
const fs       = require('fs-extra')


const COMMANDS = {
  zip:   "zip -r ${path}.zip ${path}",
  gzip:  "tar -c ${path} | gzip -9 -> ${path}.tar.gz",
  bzip2: "tar -cjf ${path}.tar.bz2 ${path}",
}

function getPackagePath( subtask ) {
  return path.join( subtask.argv.pkg_path, subtask.argv.name )
}

function tasks(subtask) {

  let FL

  return {
    "clean": function(resolve, reject) {
      const p = getPackagePath( subtask )

      fs.remove( p, (err) => {
        if (err) reject( err )
        else resolve()
      })
    },

    "filelist": function(resolve) {
      FL = new FileList

      if (subtask.argv.include) {
        subtask.argv.include.forEach((inc) => {
          FL.include(inc)
        })
      }

      if (subtask.argv.exclude) {
        subtask.argv.exclude.forEach((exc) => {
          FL.exclude(exc)
        })
      }

      resolve(FL.toArray())
    },

    "copy": function(resolve, reject) {
      const p = getPackagePath( subtask )

      when.reduce(this.result, function( res, file ) {
        return when.promise(function( res ) {
          fs.copy( file, path.join( p, file ), fs.constants.COPYFILE_EXCL, res )
        })
      }, [])
      .catch(reject)
      .then(resolve)
    },


    "archive": function(resolve, reject) {
      const targets = subtask.argv.targets.map(function( target ) {
        if (!COMMANDS[target]) return null
        return {
          command: template( COMMANDS[target], { path: subtask.argv.name } ),
          cwd: subtask.argv.pkg_path,
          printStdout: false
        }
      }).filter(( cmd ) => { return !!cmd })

      wk.exec(targets).catch(reject).then(resolve)
    }
  }

}

function command() {
  this
  .string('name')
  .string('pkg_path', path.join(process.cwd(), 'pkg'))
  .array('targets', 'gzip,zip,bzip2')
  .array('include')
  .array('exclude')
}

task('default', { command }, function(resolve, reject) {
  wk.nano
  .serie(tasks(this), [ 'clean', 'filelist', 'copy', 'archive', 'clean' ])
  .catch(reject)
  .then(resolve)
})