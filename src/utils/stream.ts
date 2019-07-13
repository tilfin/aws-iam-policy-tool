const StreamUtils = require('@tilfin/stream-utils')

export function filterStream(filterFunc: any) {
  return StreamUtils.map(function(data: any, cb: any) {
    if (filterFunc(data)) this.push(data)
    cb()
  })
}

export function promisedStream(prmsFunc: any) {
  return StreamUtils.map(async function(data: any, ctx: any) {
    const result = await prmsFunc(data)
    if (result) {
      [].concat(result).forEach(item => ctx.push(item))
    }
  })
}
