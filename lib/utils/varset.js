'use strict';

function substitute(srcStr, varSet) {
  return srcStr.replace(/\$?([A-Z][A-Z0-9_]+|\$\{([^\}]+)\})/g, function(match, p1, p2) {
    const name = p2 || p1;
    return varSet[name] || p1;
  });
}

function parseJSON(json, varSet) {
  return JSON.parse(json, function(_, v) {
    if (typeof v === 'string') {
      return substitute(v, varSet);
    }
    return v;
  });
}

module.exports = {
  substitute,
  parseJSON
}
