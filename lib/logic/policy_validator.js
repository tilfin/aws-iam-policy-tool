'use strict';

const jsonDiff = require('json-diff');
const policy = require('../aws/policy');
const Result = require('../utils/result');


class PolicyValidator {
  constructor(opts) {
    const opts_ = opts || {};
    this._color = !(opts_['plain'] || false);
    this._invalidCnt = 0;
  }

  validate(name, doc) {
    return policy.getPolicyArnPrefix()
    .then(arnPrefix => {
      return policy.getPolicyDefaultWithVersionInfoByArn(`${arnPrefix}/${name}`)
    })
    .then(([currentPolicy, _]) => {
      if (!currentPolicy) {
        this._invalidCnt++;
        return Result.NG('%1 does not exist.', name);
      }

      const currentDoc = JSON.parse(decodeURIComponent(currentPolicy.document));
      const df = jsonDiff.diffString(currentDoc, doc, { color: this._color });
      if (df) {
        this._invalidCnt++;
        return Result.NG('%1 is invalid.', name, df);
      } else {
        return Result.OK(name);
      }
    })
    .catch(err => {
      if (err.code === 'NoSuchEntity') {
        return Result.NG('%1 does not exist.', name);
      }
      throw err;
    })
  }

  isValid() {
    return this._invalidCnt === 0;
  }
}

module.exports = PolicyValidator;
