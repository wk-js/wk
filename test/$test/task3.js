function task3( wk ) {
  console.log('task3')

  const APTGET = wk.getContextApi('apt-get')
  console.log( APTGET.infos('tasks') )

  return APTGET.serie('update', 'upgrade', 'install', 'remove')
}

module.exports = function( wk ) {
  wk.task('default', task3)
}