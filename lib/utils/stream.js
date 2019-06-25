'use strict';

const Readable = require('stream').Readable;
const StreamUtils = require('@tilfin/stream-utils')

function filterStream(filterFunc) {
  return StreamUtils.map(function (data, cb) {
    if (filterFunc(data)) this.push(data);
    cb();
  });
}

function promisedStream(prmsFunc) {
  return StreamUtils.map(function (data, cb) {
    prmsFunc(data)
    .then(result => {
      if (result) {
        [].concat(result).forEach(item => this.push(item));
      }
      cb()
    })
    .catch(cb)
  });
}

module.exports = {
  filterStream,
  promisedStream,
}
