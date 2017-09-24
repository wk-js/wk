
wk.task('new', function(resolve) {
  console.log('new')
  setTimeout(resolve, 5000)
})