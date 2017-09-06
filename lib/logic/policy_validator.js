'use strict';

const jsonDiff = require('json-diff');
const policy = require('../aws/policy');
const Status = require('../utils/status_code')(true);


class PolicyValidator {
  constructor(opts) {
    this._opts = opts || {};
    this._invalidCnt = 0;
  }

  validate(name, doc) {
    return policy.getPolicyArnPrefix()
    .then(arnPrefix => {
      return policy.getPolicyDefaultVersionByArn(`${arnPrefix}/${name}`)
    })
    .then(currentPolicy => {
      const df = diff(doc, decodeURIComponent(currentPolicy.document));
      if (!df) {
        return `${Status.OK} ${name}\n`;
      } else {
        this._invalidCnt++;
        return `${Status.NG} ${name} is invalid.\n${df}\n`;
      }
    })
    .catch(err => {
      if (err.code === 'NoSuchEntity') {
        return `${Status.NG} ${name} does not exist.\n`;
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
  return jsonDiff.diffString(olddoc, JSON.parse(newdoc));  
}
