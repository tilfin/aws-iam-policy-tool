'use strict';

const jsonDiff = require('json-diff');
const policy = require('../aws/policy');
const StringUtil = require('../utils/string');
const Status = require('../utils/status_code')(true);


class PolicyValidator {
  constructor() {
    this._invalidCnt = 0;
  }

  validate(entry, varSet, opts) {
    const opts_ = opts || {};
    const overwrite = opts_['overwrite'] || false;
  
    const name = StringUtil.expandVars(entry.name, varSet);
    const doc = StringUtil.expandVars(entry.document, varSet);
  
    return policy.getPolicyArnPrefix()
    .then(arnPrefix => {
      return policy.getPolicyDefaultVersionByArn(`${arnPrefix}/${name}`)
    })
    .then(currentPolicy => {
      const df = diff(doc, decodeURIComponent(currentPolicy.document));
      if (!df) {
        return `${Status.OK} ${name} is valid.\n`;
      } else {
        this._invalidCnt++;
        return `${Status.NG} ${name} is invalid.\n${df}\n`;
      }
    })
    .catch(err => {
      if (err.code === 'NoSuchEntity') {
        return `${Status.NG} ${name} does not exist\n`;
      }
      throw err;
    })
  }

  isValid() {
    return this._invalidCnt === 0;
  }
}

module.exports = PolicyValidator;

function diff(olddoc, newdoc) {
  return jsonDiff.diffString(JSON.parse(olddoc), JSON.parse(newdoc));  
}
