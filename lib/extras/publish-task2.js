'use strict'

const fs        = require('fs')
const path      = require('path')
const semver    = require('semver')
const prompt    = require('../utils/prompt')
const Print     = require('../print').new()
const ExtraTask = require('../tasks/extra-task2')
const ARGParser = require('../arg-parser')

Print.silent()
Print.visibility('log', true)

function getPackage() {
  return JSON.parse(fs.readFileSync(path.resolve('package.json')))
}

function getCurrentVersion() {
  return getPackage().version
}

class PublishTask extends ExtraTask {

  init() {
    this.remote        = 'origin'
    this.currentBranch = 'develop'

    this.ARGParser = ARGParser.new()

    this.config = {
      release: {
        type: 'value',
        default: 'patch',
        no_key: true,
        index: 1,
        description: 'Precise a release type (pre|prerelease|patch|minor|major)'
      },

      identifer: {
        type: 'value',
        default: 'beta',
        no_key: true,
        index: 2,
        description: 'Precise an identifer (Default: "beta")'
      }
    }

    wk.ARGParser._createHelp( this.config )
  }

  configure() {

    const remote = this.remote
    const nm     = this.getPath.bind(this)
    const config = this.config

    desc('Deploy a new version. Parameters <release> <identifier?>')
    task('default', [
      nm('bump'),
      nm('push')
    ])

    task('help', function() {
      console.log( config.help.description )
    })

    task('arguments', { visible: false }, function() {
      return ARGParser.parse(wk.COMMAND_ARGV, config, 'valid')
    })


    /**
     * Check if the git stage is clean
     */
    taskProcess('stage_clean', 'git status --porcelain --untracked-files=no', function(err, stdout) {
      if (stdout.length !== 0) return this.fail(`Stage is not clean`)

      this.complete()
    }, { async: true, visible: false, process: { printStdout: false, printStderr: false } })



    /**
     * Generate the next version
     */
    task('next_version', { visible: false }, function() {
      const args = wk.Tasks[nm('arguments')].value

      const identifier = args.identifer
      const release    = args.release

      const nextVersion = semver.inc(getCurrentVersion(), release, identifier)
      if (!nextVersion) return this.fail('Version invalid')

      return nextVersion
    })



    /**
     * Ask a confirmation to the user
     */
    task('confirm_version', { visible: false, async: true }, function() {
      const nextVersion = wk.Tasks[nm('next_version')].value

      prompt(`Continue? `, ( answer ) => {
        if (answer[0] === 'y') {
          this.complete( nextVersion )
        } else {
          this.fail( 'Bump aborted' )
        }
      })
    })



    /**
     * Bump version
     */
    task('bump_version', { visible: false }, function() {
      const nextVersion = wk.Tasks[nm('next_version')].value

      if (!nextVersion) return this.fail('Invalid version :' + nextVersion)

      const pkg   = getPackage()
      pkg.version = nextVersion

      const pth = path.join('package.json')
      fs.writeFileSync(pth, JSON.stringify(pkg, true, 2) + '\n')
    })



    /**
     * Commit and tag the new version
     */
    task('commit', { async: true, visible: false }, function() {
      const version = wk.Tasks[nm('next_version')].value

      const cmds = [
        `git commit -a -m "Bump ${version}"`,
        `git tag -a v${version} -m "Release ${version}"`
      ]

      const opts = {}
      if (process.platform == 'win32') {
        opts.windowsVerbatimArguments = true
      }

      wk.exec(cmds).catch(this.fail).then(() => {
        Print.log(`Version ${version} bumped !`)
        this.complete()
      })
    })



    task('version_released', { visible: false, async: true }, function() {
      const version = typeof wk.Tasks[nm('next_version')].value === 'string' ? wk.Tasks[nm('next_version')].value : getCurrentVersion()

      wk.exec({
        command: `git ls-remote ${remote}`,
        printStdout: false
      }).catch(this.fail).then((res) => {
        if (res.stdout.match(new RegExp(`refs/tags/v${version}`))) {
          return this.fail(`Version v${version} already released!`)
        }

        Print.log(`Next version: "${version}"`)
        this.complete( version )
      })

    })



    /**
     * Bump vesion
     *
     */
    task('bump', [
      nm('arguments'),
      nm('stage_clean'),
      nm('next_version'),
      nm('version_released'),
      nm('confirm_version'),
      nm('bump_version'),
      nm('commit')
    ])



    /**
     * Push the current tag version
     */
    task('push', [ nm('version_released') ], { async: true }, function() {
      const version = wk.Tasks[nm('version_released')].value

      wk.exec(`git push ${remote} --tag v${version}`)
        .catch(this.fail)
        .then(this.complete)
    })

  }

}

module.exports = ExtraTask.new( PublishTask )