
wk.task('new', { async: true }, function(resolve) {
  console.log('new')
  setTimeout(resolve, 1000)
})