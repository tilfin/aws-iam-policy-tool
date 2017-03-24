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
exports.ArrayReader = ArrayReader;

exports.promisedStream = function(func) {
  return through2.obj(function (data, _, callback) {
    func(data).then(result => {
      if (result) {
        [].concat(result).forEach(item => {
          this.push(item)
        });
      }
      callback();
    })
    .catch(err => { callback(err) });
  });
}
