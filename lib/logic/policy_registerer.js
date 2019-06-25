'use strict';

const policy = require('../aws/policy');
const Result = require('../utils/result');


class PolicyRegisterer {
  constructor(opts = {}) {
    this._color = !(opts['plain'] || false)
    this._overwrite = opts['overwrite'] || false
  }

  async register(name, doc) {
    try {
      await policy.createPolicy(name, doc)
      return Result.OK('Created %1', name)
    } catch(err) {
      if (err.code === 'EntityAlreadyExists') {
        if (this._overwrite) {
          return this._updatePolicyVersion(name, doc)
        } else {
          return Result.Skip('%1 already exists.', name)
        }
      } else if (err.code === 'MalformedPolicyDocument') {
        return Result.NG('%1 is invalid Policy JSON format.', name)
      }
      throw err
    }
  }

  async _updatePolicyVersion(name, doc) {
    const docJSON = policy.convertDocToJSON(doc)

    const arnPrefix = await policy.getPolicyArnPrefix()
    const [currentPolicy, versionInfo] = await policy.getPolicyDefaultWithVersionInfoByArn(`${arnPrefix}/${name}`)

    if (docJSON === decodeURIComponent(currentPolicy.document)) {
      return Result.Skip('%1 not changed', name);
    } else {
      if (versionInfo.count === 5) {
        const deleteVerId = versionInfo.oldestId;
        await policy.deletePolicyVersion(currentPolicy.arn, deleteVerId)
        await policy.createPolicyDefaultVersion(currentPolicy.arn, docJSON)
        return Result.OK(`Updated %1 and deleted the oldest ${deleteVerId}`, name)
      } else {
        await policy.createPolicyDefaultVersion(currentPolicy.arn, docJSON)
        return Result.OK('Updated %1', name)
      }
    }
  }
}

module.exports = PolicyRegisterer;
