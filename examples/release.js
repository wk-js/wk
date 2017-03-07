'use strict'

const fs          = require('fs')
const path        = require('path')
const releaseTask = wk.extra('release-task')

function getPackagePath() {
  return path.resolve('package.json')
}

function getPackage() {
  return JSON.parse(fs.readFileSync(getPackagePath()))
}

function getCurrentVersion() {
  return getPackage().build
}

function pad( str, padding, max, append ) {
  if (append) {
    return str.length === max ? str : pad(str + padding, padding, max, append)
  }

  return str.length === max ? str : pad(padding + str, padding, max)
}

function getNextVersion() {

  const currentVersion = getCurrentVersion() || ''

  const current = currentVersion.split('.')
  const version = current[0] || 0
  let patch     = parseInt(current[1] || 0)

  const date  = new Date
  const year  = pad(date.getFullYear().toString(), "0", 4)
  const month = pad((date.getMonth() + 1).toString(), "0", 2)
  const day   = pad(date.getDate().toString(), "0", 2)

  const nextVersion = year+month+day

  if (version !== nextVersion) {
    patch = 0
  } else {
    if (isNaN(patch)) patch = 0
    else patch++
  }

  return nextVersion + '.' + patch
}


/**
 * Publish task
 */
releaseTask('release', {

  // Override settings
  before() {
    this.remote = 'origin'
    this.config = {}
  },

  // Override publish tasks
  after() {
    const nm = this.getPath.bind(this)

    wk.Tasks[nm('default')].description = 'Release a new version'

    task('help', { visible: false })

    task('next_version', { visible: false }, function() {
      return getNextVersion()
    })

    task('bump_version', { visible: false }, function() {
      const nextVersion = wk.Tasks[nm('next_version')].value

      if (!nextVersion) return this.fail('Invalid version :' + nextVersion)

      const pkg = getPackage()
      pkg.build = nextVersion

      const pth = path.join('package.json')
      fs.writeFileSync(pth, JSON.stringify(pkg, true, 2) + '\n')
    })
  }

})