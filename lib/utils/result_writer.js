'use strict';

const { Writable } = require('stream');


class ConsoleResultWriter extends Writable {
  constructor(opts) {
    super({ objectMode: true });
  	const opts_ = opts || {};
    this._plain = opts_['plain'] || false;
    if (this._plain) {
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
    expandMessage(result, !this._plain)
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
    expandMessage(result, false)
    process.stdout.write(JSON.stringify(result) + '\n');
    cb();
  }
}

function expandMessage(result, bold) {
  const { message, target } = result;
  result.message = message.replace(/\%(\d)/g, function(match, p1) {
    let v;
    if (target instanceof Array) {
      v = target[Number(p1) - 1];
    } else {
      v = target;
    }
    if (bold) v = `\x1b[1m${v}\x1b[0m`;
    return v;
  });
}

module.exports = {
  ConsoleResultWriter,
  JSONResultWriter,
}
