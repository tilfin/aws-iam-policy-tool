'use strict';

const Readable = require('stream').Readable;
const through2 = require('through2');

class ArrayReader extends Readable {
  constructor(array) {
    super({ objectMode: true });
    this.items = array;
  }

  _read() {
    this.items.forEach(item => this.push(item));
    this.push(null);
  }
}

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
  return through2.obj(function (data, _, cb) {
    if (filterFunc(data)) this.push(data);
    cb();
  });
}

function promisedStream(prmsFunc) {
  return through2.obj(function (data, _, cb) {
    prmsFunc(data).then(result => {
      if (result) {
        [].concat(result).forEach(item => this.push(item));
      }
      cb();
    })
    .catch(cb);
  });
}

module.exports = {
  ArrayReader,
  PromisedReader,
  filterStream,
  promisedStream,
}
