import { Writable } from 'stream'

export class ConsoleResultWriter extends Writable {
  public _plain: any
  public _statusStrMap: any

  constructor(opts: any = {}) {
    super({ objectMode: true })
    const opts_ = opts || {}
    this._plain = opts_['plain'] || false
    if (this._plain) {
      this._statusStrMap = {
        OK: ' [OK] ',
        NG: ' [NG] ',
        Skip: '[Skip]',
      }
    } else {
      this._statusStrMap = {
        OK: ' \x1b[32mOK\x1b[0m ',
        NG: ' \x1b[31mNG\x1b[0m ',
        Skip: '\x1b[36mSkip\x1b[0m',
      }
    }
  }

  _write(result: any, _: any, cb: any) {
    const st = this._statusStrMap[result.status]
    expandMessage(result, !this._plain)
    let str = `${st} ${result.message}`
    if (result.diff) str += `\n${result.diff}`
    process.stdout.write(`${str}\n`)
    cb()
  }
}

export class JSONResultWriter extends Writable {
  constructor(opts?: any) {
    super({ objectMode: true })
  }

  _write(result: any, _: any, cb: any) {
    expandMessage(result, false)
    process.stdout.write(JSON.stringify(result) + '\n')
    cb()
  }
}

function expandMessage(result: any, bold: boolean) {
  const { message, target } = result
  result.message = message.replace(/\%(\d)/g, function(match: any, p1: any) {
    let v
    if (target instanceof Array) {
      v = target[Number(p1) - 1]
    } else {
      v = target
    }
    if (bold) v = `\x1b[1m${v}\x1b[0m`
    return v
  })
}

export function createWriter(opts: any = {}) {
  if (opts.writer) return opts.writer
  return opts.json
    ? new JSONResultWriter()
    : new ConsoleResultWriter({ plain: opts.plain })
}
