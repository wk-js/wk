const { Context } = require( '../js/context' )

const c = new Context('apt-get')
const wk = c.api()

function update() {
  console.log('update')
  return new Promise(function(resolve) {
    setTimeout(() => resolve('update:result'), 1000)
  })
}

function upgrade() {
  console.log('upgrade')
  return new Promise(function(resolve) {
    setTimeout(() => resolve('upgrade:result'), 2000)
  })
}

function install() {
  console.log('install')
  return new Promise(function(resolve) {
    setTimeout(() => resolve('install:result'), 1500)
  })
}

function remove() {
  console.log('remove')
  return new Promise(function(resolve) {
    setTimeout(() => resolve('remove:result'), 500)
  })
}

wk.task( 'update' , update  )
wk.task( 'upgrade', upgrade )
wk.task( 'install', install )
wk.task( 'remove' , remove  )