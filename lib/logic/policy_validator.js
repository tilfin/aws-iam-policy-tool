'use strict';

const jsonDiff = require('json-diff');
const policy = require('../aws/policy');
const Result = require('../utils/result');


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
      if (!currentPolicy) {
        this._invalidCnt++;
        return Result.NG(`${name} does not exist.`);
      }

      const currentDoc = JSON.parse(decodeURIComponent(currentPolicy.document));
      const df = jsonDiff.diffString(currentDoc, doc);
      if (!df) {
        return Result.OK(name);
      } else {
        this._invalidCnt++;
        return Result.NG(`${name} is invalid.`, df);
      }
    });
  }

  isValid() {
    return this._invalidCnt === 0;
  }
}

module.exports = PolicyValidator;
