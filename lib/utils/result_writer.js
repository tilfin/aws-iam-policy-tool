'use strict';

const { Writable } = require('stream');


class ConsoleResultWriter extends Writable {
  constructor(opts) {
    super({ objectMode: true });
  	const opts_ = opts || {};

    if (opts_['plain']) {
      this._statusStrMap = {
        OK: ' [OK] ',
        NG: ' [NG] ',
        Skip: '[Skip]',
      };
    } else {
      this._statusStrMap = {
        OK: " \x1b[32mOK\x1b[0m ",
        NG: " \x1b[31mNG\x1b[0m ",
        Skip: "\x1b[36mSkip\x1b[0m",
      };
    }
  }

  _write(result, _, cb) {
  	const st = this._statusStrMap[result.status];
    let str = `${st} ${result.message}`;
    if (result.diff) str += `\n${result.diff}`;
    process.stdout.write(`${str}\n`);
    cb();
  }
}

class JSONResultWriter extends Writable {
  constructor(opts) {
    super({ objectMode: true });
  	const opts_ = opts || {};
  }

  _write(result, _, cb) {
    process.stdout.write(JSON.stringify(result) + '\n');
    cb();
  }
}


module.exports = {
  ConsoleResultWriter,
  JSONResultWriter,
}
