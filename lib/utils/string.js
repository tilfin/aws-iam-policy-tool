'use strict';

exports.expandVars = function expandVars(rawStr, varSet) {
  return rawStr.replace(/\$?([A-Z][A-Z0-9_]+|\$\{([^\}]+)\})/g, function(match, p1, p2) {
    const name = p2 || p1;
    return varSet[name] || p1;
  });
}
