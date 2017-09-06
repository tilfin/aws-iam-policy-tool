'use strict';

const policy = require('../aws/policy');
const Result = require('../utils/result');


class PolicyRegisterer {
  constructor(opts) {
    const opts_ = opts || {};
    this._overwrite = opts_['overwrite'] || false;
  }

  register(name, doc) {
    return policy.createPolicy(name, doc)
    .then(data => `${Status.OK} Created ${name}\n`)
    .catch(err => {
      if (err.code === 'EntityAlreadyExists') {
        if (this._overwrite) {
        	return this._updatePolicyVersion(name, doc);
        } else {
          return Result.Skip(`${name} already exists.`);
        }
      }
      throw err;
    });
  }

  _updatePolicyVersion(name, doc) {
    return policy.getPolicyArnPrefix()
    .then(arnPrefix => {
      return policy.getPolicyDefaultVersionByArn(`${arnPrefix}/${name}`)
    })
    .then(currentPolicy => {
      if (doc === decodeURIComponent(currentPolicy.document)) {
        return Result.Skip(`${name} not changed`);
      } else {
        return policy.createPolicyDefaultVersion(currentPolicy.arn, doc)
        .then(data => Result.OK(`Updated ${name}`));
      }
    })
  }
}

module.exports = PolicyRegisterer;
