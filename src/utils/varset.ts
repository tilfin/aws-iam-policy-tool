export function substitute(srcStr: string, varSet: any) {
  return srcStr.replace(/\$?([A-Z][A-Z0-9_]+|\$\{([^\}]+)\})/g, function(match, p1, p2) {
    const name = p2 || p1
    if (name.startsWith('AWS')) {
      return p1
    }
    return varSet[name] || p1
  })
}

export function parseJSON(json: string, varSet: any): any {
  return JSON.parse(json, function(_, v) {
    if (typeof v === 'string') {
      return substitute(v, varSet)
    }
    return v
  })
}
