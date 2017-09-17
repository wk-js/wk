'use strict'

const fs     = require('fs')
const path   = require('path')
const semver = require('semver')
const name   = path.basename(__filename, path.extname(__filename))

function ns(task) {
  return `${name}:${task}`
}

function getPackage() {
  return JSON.parse(fs.readFileSync(path.resolve('package.json')))
}

function getCurrentVersion() {
  return getPackage().version
}

function prompt( message, cb ) {
  process.stdin.resume()
  process.stdin.setEncoding('utf8')
  process.stdout.write(message)
  process.stdin.once("data", function (data) {
    if ( cb ) cb( data.toString().trim() )
    process.stdin.pause()
  })
}

function bump_tasks(subtask) {
  return {
    "stage_clean": function(resolve, reject) {
      const { argv } = subtask.invocator || subtask

      wk.exec('git status --porcelain --untracked-files=no', { printStdout: false })
      .then((result) => {
        if (!argv['ignore-stage'] && result.stdout.length !== 0) {
          reject(`Stage is not clean`)
          return
        }
        resolve()
      })
    },

    "next_version": function(resolve, reject) {
      const { argv }   = subtask.invocator || subtask
      const identifier = argv['identifier']
      let release      = argv['release']

      if (argv['prerelease']) release = 'prerelease'

      const nextVersion = semver.inc(getCurrentVersion(), release, identifier)
      console.log(`Next version: "${nextVersion}"`)

      prompt(`Continue? `, ( answer ) => {
        if (answer[0] === 'y') {
          resolve( nextVersion )
        } else {
          reject( 'Bump aborted' )
        }
      })
    },

    "bump_version": function(resolve, reject) {
      const nextVersion = this.result

      if (!nextVersion)
        return reject('Invalid version :' + nextVersion)

      const pkg   = getPackage()
      pkg.version = nextVersion

      const pth = path.join('package.json')
      fs.writeFileSync(pth, JSON.stringify(pkg, true, 2) + '\n')

      resolve( nextVersion )
    },

    "commit": function(resolve, reject) {
      const nextVersion = this.result

      const cmds = [
        `git commit -a -m "Bump ${nextVersion}"`,
        `git tag -a v${nextVersion} -m "Release ${nextVersion}"`
      ]

      const opts = {}
      if (process.platform == 'win32') {
        opts.windowsVerbatimArguments = true
      }

      wk.exec(cmds).catch(reject).then(() => {
        console.log(`Version ${nextVersion} bumped !`)
        resolve()
      })
    }
  }
}

function push_tasks(subtask) {
  return {

    "version_released": function(resolve, reject) {

      wk.exec('git ls-remote', { printStdout: false, printStderr: false })
      .then((result) => {
        const version = getCurrentVersion()

        if (result.stdout.match(new RegExp(`\srefs\/tags\/v${version}(\s|$)`))) {
          return reject(`Version v${version} already released!`)
        }

        resolve( version )
      })

    },

    "push": function(resolve, reject) {
      const { argv } = subtask.invocator || subtask
      const version  = getPackage().version

      wk.exec(`git push ${argv.remote} --tag v${version}`)
        .catch(reject)
        .then(resolve)
    }

  }
}

function command() {
  this
  .string('remote', 'origin')

  .enum('release', [ 'major', 'minor', 'patch', 'premajor', 'preminor', 'prepatch', 'prerelease' ], 'patch')
  .index('release', 1)

  .string('identifier', null)
  .index('identifier', 2)

  .boolean('prerelease')
  .alias('prerelease', ['pre'])

  .boolean('ignore-stage', false)

  .help()
}


task('bump', { command }, function(resolve, reject) {
  wk.nano
  .serie(bump_tasks(this))
  .catch(reject)
  .then(resolve)
})

task('push', { command }, function(resolve, reject) {
  if (this.invocator) {
    this.argv = this.invocator.argv
  }

  wk.nano
  .serie(push_tasks(this))
  .catch(reject)
  .then(resolve)
})

task('default', { command }, [ ns('bump'), ns('push') ])