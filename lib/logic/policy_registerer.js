'use strict';

const policy = require('../aws/policy');
const Result = require('../utils/result');


class PolicyRegisterer {
  constructor(opts) {
    const opts_ = opts || {};
    this._color = !(opts_['plain'] || false);
    this._overwrite = opts_['overwrite'] || false;
  }

  register(name, doc) {
    return policy.createPolicy(name, doc)
    .then(data => Result.OK('Created %1', name))
    .catch(err => {
      if (err.code === 'EntityAlreadyExists') {
        if (this._overwrite) {
          return this._updatePolicyVersion(name, doc);
        } else {
          return Result.Skip('%1 already exists.', name);
        }
      } else if (err.code === 'MalformedPolicyDocument') {
        return Result.NG('%1 is invalid Policy JSON format.', name);
      }
      throw err;
    });
  }

  _updatePolicyVersion(name, doc) {
    const docJSON = policy.convertDocToJSON(doc);

    return policy.getPolicyArnPrefix()
    .then(arnPrefix => {
      return policy.getPolicyDefaultWithVersionInfoByArn(`${arnPrefix}/${name}`)
    })
    .then(([currentPolicy, versionInfo]) => {
      if (docJSON === decodeURIComponent(currentPolicy.document)) {
        return Result.Skip('%1 not changed', name);
      } else {
        if (versionInfo.count === 5) {
          const deleteVerId = versionInfo.oldestId;
          return policy.deletePolicyVersion(currentPolicy.arn, deleteVerId)
          .then(() => {
            return policy.createPolicyDefaultVersion(currentPolicy.arn, docJSON);
          })
          .then(data => Result.OK(`Updated %1 and deleted the oldest ${deleteVerId}`, name));
        } else {
          return policy.createPolicyDefaultVersion(currentPolicy.arn, docJSON)
          .then(data => Result.OK('Updated %1', name));
        }
      }
    })
  }
}

module.exports = PolicyRegisterer;
