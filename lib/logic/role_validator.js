'use strict';

const jsonDiff = require('json-diff');
const iamRole = require('../aws/role');
const attach = require('../aws/attach');
const Result = require('../utils/result');


class InvalidRoleError extends Error {
  constructor(msg, diff) {
    super(msg);
    this.diff = diff;
  }
}

class RoleValidator {
  constructor() {
    this._invalidCnt = 0;
  }

  validate(entry) {
    return this._validateRoleOrRoleWithInstaceProfile(entry.Role)
    .then(result => {
      if (result) return result;
      return this._validateAttachedPolicies(entry);
    })
    .then(result => {
      if (result) return result;
      return Result.OK(entry.Role.RoleName);
    })
    .catch(err => {
      if (err instanceof InvalidRoleError) {
        this._invalidCnt++;
        return Result.NG(err.message);
      }
      throw err;
    });
  }

  _validateRoleOrRoleWithInstaceProfile(definedRole) {
    const roleName = definedRole.RoleName;

    if (iamRole.isEc2Role(definedRole)) {
      return iamRole.getInstanceProfile(roleName)
      .then(profile => {
        if (!profile) {
          throw new InvalidRoleError(`${roleName} instance profile does not exist.`);
        }

        const currentRole = profile.Roles[0];
        delete currentRole.Arn;
        delete currentRole.RoleId;
        delete currentRole.CreateDate;
        currentRole.AssumeRolePolicyDocument = JSON.parse(decodeURIComponent(currentRole.AssumeRolePolicyDocument));

        const current = JSON.stringify(currentRole);
        const defined = JSON.stringify(definedRole);
        const df = diff(current, defined);
        if (df) {
          throw new InvalidRoleError(`${roleName} is invalid.`, df);
        }
      });
    } else {
      return iamRole.getRole(roleName)
      .then(currentRole => {
        if (!currentRole) {
          throw new InvalidRoleError(`${roleName} does not exist.`);
        }

        delete currentRole.Arn;
        delete currentRole.RoleId;
        delete currentRole.CreateDate;
        const current = JSON.stringify(currentRole);
        const defined = JSON.stringify(definedRole);
        const df = diff(current, defined);
        if (df) {
          throw new InvalidRoleError(`${roleName} is invalid.`, df);
        }
      })
    }
  }

  _validateAttachedPolicies(entry) {
    const roleName = entry.Role.RoleName;
    return iamRole.getAttachedPoliciesByRole(roleName)
    .then(currentPolicies => {
      const results = [];
      const definedPolicies = entry.AttachedPolicies;

      definedPolicies.forEach(definedPolicy => {
        if (!attach.containPolicy(currentPolicies, definedPolicy)) {
          results.push(Result.NG(`Role: ${roleName} does not have Policy: ${definedPolicy.PolicyName}.`));
        }
      });

      currentPolicies.forEach(currentPolicy => {
        if (!attach.containPolicy(definedPolicies, currentPolicy)) {
          results.push(Result.NG(`Role: ${roleName} have Policy: ${currentPolicy.PolicyName} not required.`));
        }
      });

      if (results.length) {
        this._invalidCnt++;
        return results;
      }
    });
  }

  isValid() {
    return this._invalidCnt === 0;
  }
}

module.exports = RoleValidator;

function diff(olddoc, newdoc) {
  return jsonDiff.diffString(JSON.parse(olddoc), JSON.parse(newdoc));  
}
