'use strict'

const jsonDiff = require('json-diff')
const iamRole = require('../aws/role')
const attach = require('../aws/attach')
const Result = require('../utils/result')


class InvalidRoleError extends Error {
  constructor(msg, target, diff) {
    super(msg)
    this.target = target
    this.diff = diff || null
  }
}

class RoleValidator {
  constructor(opts = {}) {
    this._color = !(opts['plain'] || false)
    this._invalidCnt = 0
  }

  async validate(name, document) {
    try {
      const role = document.Role
      const roleName = role.RoleName

      let result = await this._validateRoleOrRoleWithInstanceProfile(role)
      if (result) return result

      result = await this._validateAttachedPolicies(roleName, document.AttachedPolicies)
      if (result) return result

      return Result.OK(roleName)
    } catch(err) {
      if (err instanceof InvalidRoleError) {
        this._invalidCnt++
        return Result.NG(err.message, err.target, err.diff)
      }
      return Result.NG('Role: %1 is invalid JSON format.', name)
    }
  }

  async _validateRoleOrRoleWithInstanceProfile(definedRole) {
    const roleName = definedRole.RoleName;

    if (iamRole.isEc2Role(definedRole)) {
      const profile = await iamRole.getInstanceProfile(roleName)
      if (!profile) {
        throw new InvalidRoleError('%1 instance profile does not exist.', roleName)
      }

      const currentRole = profile.Roles[0]
      currentRole.AssumeRolePolicyDocument = JSON.parse(decodeURIComponent(currentRole.AssumeRolePolicyDocument))
      delete currentRole.Arn
      delete currentRole.RoleId
      delete currentRole.CreateDate

      const current = JSON.stringify(currentRole);
      const defined = JSON.stringify(definedRole);
      const df = jsonDiff.diffString(JSON.parse(current), JSON.parse(defined), { color: this._color })
      if (df) {
        throw new InvalidRoleError('%1 is invalid.', roleName, df)
      }
    } else {
      const currentRole = await iamRole.getRole(roleName)
      if (!currentRole) {
        throw new InvalidRoleError('%1 does not exist.', roleName)
      }

      delete currentRole.Arn
      delete currentRole.RoleId
      delete currentRole.CreateDate
      const current = JSON.stringify(currentRole)
      const defined = JSON.stringify(definedRole)
      const df = jsonDiff.diffString(JSON.parse(current), JSON.parse(defined), { color: this._color });
      if (df) {
        throw new InvalidRoleError('%1 is invalid.', roleName, df)
      }
    }
  }

  async _validateAttachedPolicies(roleName, attachedPolicies) {
    const currentPolicies = await iamRole.getAttachedPoliciesByRole(roleName)
    const results = []
    const definedPolicies = attachedPolicies

    definedPolicies.forEach(definedPolicy => {
      if (!attach.containPolicy(currentPolicies, definedPolicy)) {
        results.push(Result.NG('Role: %1 does not have Policy: %2.',
                                [roleName, definedPolicy.PolicyName]))
      }
    })

    currentPolicies.forEach(currentPolicy => {
      if (!attach.containPolicy(definedPolicies, currentPolicy)) {
        results.push(Result.NG('Role: %1 have Policy: %2 not required.',
                                [roleName, currentPolicy.PolicyName]))
      }
    })

    if (results.length) {
      this._invalidCnt++
      return results
    }
  }

  isValid() {
    return this._invalidCnt === 0
  }
}

module.exports = RoleValidator;
