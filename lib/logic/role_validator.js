'use strict';

const jsonDiff = require('json-diff');
const iamRole = require('../aws/role');
const attach = require('../aws/attach');
const Result = require('../utils/result');


class InvalidRoleError extends Error {
  constructor(msg, target, diff) {
    super(msg);
    this.target = target;
    this.diff = diff || null;
  }
}

class RoleValidator {
  constructor(opts) {
    const opts_ = opts || {};
    this._color = !(opts_['plain'] || false);
    this._invalidCnt = 0;   
  }

  validate(name, document) {
    try {
      const role = document.Role;
      const roleName = document.Role.RoleName;

      return this._validateRoleOrRoleWithInstanceProfile(role)
      .then(result => {
        if (result) return result;
        return this._validateAttachedPolicies(roleName, document.AttachedPolicies);
      })
      .then(result => {
        if (result) return result;
        return Result.OK(roleName);
      })
      .catch(err => {
        if (err instanceof InvalidRoleError) {
          this._invalidCnt++;
          return Result.NG(err.message, err.target, err.diff);
        }
        throw err;
      });
    } catch(err) {
      return Promise.resolve(Result.NG('Role: %1 is invalid JSON format.', name));
    }
  }

  _validateRoleOrRoleWithInstanceProfile(definedRole) {
    const roleName = definedRole.RoleName;

    if (iamRole.isEc2Role(definedRole)) {
      return iamRole.getInstanceProfile(roleName)
      .then(profile => {
        if (!profile) {
          throw new InvalidRoleError('%1 instance profile does not exist.', roleName);
        }

        const currentRole = profile.Roles[0];
        currentRole.AssumeRolePolicyDocument = JSON.parse(decodeURIComponent(currentRole.AssumeRolePolicyDocument));
        delete currentRole.Arn;
        delete currentRole.RoleId;
        delete currentRole.CreateDate;

        const current = JSON.stringify(currentRole);
        const defined = JSON.stringify(definedRole);
        const df = jsonDiff.diffString(JSON.parse(current), JSON.parse(defined), { color: this._color });
        if (df) {
          throw new InvalidRoleError('%1 is invalid.', roleName, df);
        }
      });
    } else {
      return iamRole.getRole(roleName)
      .then(currentRole => {
        if (!currentRole) {
          throw new InvalidRoleError('%1 does not exist.', roleName);
        }

        delete currentRole.Arn;
        delete currentRole.RoleId;
        delete currentRole.CreateDate;
        const current = JSON.stringify(currentRole);
        const defined = JSON.stringify(definedRole);
        const df = jsonDiff.diffString(JSON.parse(current), JSON.parse(defined), { color: this._color });
        if (df) {
          throw new InvalidRoleError('%1 is invalid.', roleName, df);
        }
      })
    }
  }

  _validateAttachedPolicies(roleName, attachedPolicies) {
    return iamRole.getAttachedPoliciesByRole(roleName)
    .then(currentPolicies => {
      const results = [];
      const definedPolicies = attachedPolicies;

      definedPolicies.forEach(definedPolicy => {
        if (!attach.containPolicy(currentPolicies, definedPolicy)) {
          results.push(Result.NG('Role: %1 does not have Policy: %2.',
                                 [roleName, definedPolicy.PolicyName]));
        }
      });

      currentPolicies.forEach(currentPolicy => {
        if (!attach.containPolicy(definedPolicies, currentPolicy)) {
          results.push(Result.NG('Role: %1 have Policy: %2 not required.',
                                 [roleName, currentPolicy.PolicyName]));
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
