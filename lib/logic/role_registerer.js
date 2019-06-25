'use strict'

const iam = require('../aws/iam')
const iamRole = require('../aws/role')
const attach = require('../aws/attach')
const Result = require('../utils/result')


class RoleRegisterer {
  constructor(opts = {}) {
    this._overwrite = opts['overwrite'] || false
  }

  async register(name, document) {
    try {
      const results = []
      await this._createRoleOrWithInstanceProfile(document, results)
      const rolePolicies = await this._getRolePolicies(document)
      const attachResults = await Promise.all([].concat(
        rolePolicies.attaching.map(entry => this._attachRolePolicy(entry)),
        rolePolicies.detaching.map(entry => this._detachRolePolicy(entry)),
        rolePolicies.unchanged.map(entry => {
          const policyName = onlyPolicyName(entry.PolicyArn)
          return Result.Skip('Policy: %1 is already attached on Role: %2', [policyName, entry.RoleName])
        })
      ))
      return results.concat(attachResults)
    } catch(err) {
      return Result.NG('Failed to create Role: %1 invalid JSON format', name)
    }
  }

  async _createRoleOrWithInstanceProfile(document, results) {
    const roleName = document.Role.RoleName
    const createdRole = await this._createRole(document, results)
    if (createdRole && iamRole.isEc2Role(document.Role)) {
      const result = await this._createInstanceProfile(roleName, results)
      if (result !== null) {
        await this._addRoleToInstanceProfile(roleName, roleName, results)
      }
    }
    return createdRole
  }

  async _createRole(entry, results) {
    const roleName = entry.Role.RoleName

    if (entry.Role.Path.startsWith('/aws-service-role/')) {
      results.push(Result.Skip('Role: %1 is AWS Service linked.', roleName))
      return null
    }

    try {
      const role = await iamRole.createRole(entry.Role)
      results.push(Result.OK('Created Role: %1', roleName))
      return entry.Role
    } catch(err) {
      if (err.code === 'EntityAlreadyExists') {
        results.push(Result.Skip('Role: %1 already exists.', roleName))
        return null
      } else if (err.code === 'MalformedPolicyDocument') {
        return Result.NG('Failed to create Role: %1 invalid JSON format', roleName)
      }
      results.push(Result.NG('Failed to create Role: %1', roleName))
      throw err
    }
  }

  async _createInstanceProfile(roleName, results) {
    const params = {
      InstanceProfileName: roleName
    }

    try {
      const data = await iam.createInstanceProfile(params).promise()
      results.push(Result.OK('Created InstanceProfile: %1', roleName))
      return data.InstanceProfile
    } catch(err) {
      if (err.code === 'EntityAlreadyExists') {
        results.push(Result.Skip('InstanceProfile: %1 already exists.', roleName))
        return null
      }
      results.push(Result.NG('Failed to create InstanceProfile: %1', roleName))
      throw err
    }
  }

  async _addRoleToInstanceProfile(profileName, roleName, results) {
    const params = {
      InstanceProfileName: profileName,
      RoleName: roleName
    }

    try {
      iam.addRoleToInstanceProfile(params).promise()
      results.push(Result.OK('Added InstanceProfile: %1 to Role: %2', [profileName, roleName]))
    } catch(err) {
      /*if (err.code === 'LimitExceeded') {
        console.log(Status.Skip, err.message)
        return
      }*/
      throw err
    }
  }

  async _getRolePolicies(role) {
    const roleName = role.Role.RoleName
    const policyList = role.AttachedPolicies.map(item => {
      return {
        RoleName: roleName,
        PolicyArn: item.PolicyArn,
      }
    })

    return attach.diffAttachedPolicies(roleName, policyList)
  }

  async _attachRolePolicy(params) {
    const policyName = onlyPolicyName(params.PolicyArn)

    try {
      await iam.attachRolePolicy(params).promise()
      return Result.OK('Attached %1 on %2', [policyName, params.RoleName])
    } catch(err) {
      if (err.code === 'NoSuchEntity') {
        return Result.NG('Could not attach Policy: %1 that does not exist on %2.', [policyName, params.RoleName])
      }
      throw err
    }
  }

  async _detachRolePolicy(params) {
    const policyName = onlyPolicyName(params.PolicyArn)

    await iam.detachRolePolicy(params).promise()
    Result.OK('Detached %1 on %2', [policyName, params.RoleName])
  }
}

module.exports = RoleRegisterer;

function onlyPolicyName(policyArn) {
  return policyArn.substr(policyArn.indexOf('/') + 1)
}
