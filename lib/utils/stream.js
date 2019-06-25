'use strict';

const Readable = require('stream').Readable;
const StreamUtils = require('@tilfin/stream-utils');

class PromisedReader extends Readable {
  constructor(promisedFunc) {
    super({ objectMode: true });
    this.prmsFunc = promisedFunc;
  }

  _read() {
    if (!this.prmsFunc) return;

    this.prmsFunc()
    .then(result => {
      [].concat(result).forEach(item => this.push(item));
      this.push(null);
    })
    .catch(err => {
      process.nextTick(() => this.emit('error', err));
    })

    this.prmsFunc = null;
  }
}

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
  PromisedReader,
  filterStream,
  promisedStream,
}
