'use strict'

function unique(arr) {

  var tmp = []

  for (var i = 0, ilen = arr.length; i < ilen; i++) {
    if (tmp.indexOf(arr[i]) === -1) {
      tmp.push(arr[i])
    }
  }

  return tmp

}

module.exports = {
  unique: unique
}