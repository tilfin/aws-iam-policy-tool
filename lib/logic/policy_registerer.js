'use strict';

const policy = require('../aws/policy');
const Status = require('../utils/status_code')(true);


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
  	    return `${Status.Skip} ${name} already exists.\n`;
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
        return `${Status.Skip} ${name} not changed\n`;
      } else {
        return policy.createPolicyDefaultVersion(currentPolicy.arn, doc)
        .then(data => `${Status.OK} Updated ${name}\n`);
      }
    })
  }
}

module.exports = PolicyRegisterer;
