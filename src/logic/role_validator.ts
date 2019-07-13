const jsonDiff = require('json-diff')

import { RoleNode, RoleEntry } from '../aws/role'
import { containPolicy } from '../aws/attach'
import { OK, NG, Result } from '../utils/result'
import { IAM } from 'aws-sdk'
import {
  getAttachedPoliciesByRole,
  getInstanceProfile,
} from '../aws/operation'

export class InvalidRoleError extends Error {
  public target: any
  public diff: any

  constructor(msg: string, target: string, diff?: any) {
    super(msg)
    this.target = target
    this.diff = diff || null
  }
}

export class RoleValidator {
  private _color: boolean
  private _invalidCnt: number

  constructor(opts: any = {}) {
    this._color = !(opts['plain'] || false)
    this._invalidCnt = 0
  }

  async validate(roleEntry: RoleEntry): Promise<Result[] | null> {
    try {
      const role = roleEntry.Role
      const roleName = role.RoleName

      await this._validateRoleOrRoleWithInstanceProfile(roleEntry.Role)

      let results: Result[] | null = await this._validateAttachedPolicies(
        roleName,
        roleEntry.AttachedPolicies
      )
      if (results) return results

      return [OK(roleName)]
    } catch (err) {
      if (err instanceof InvalidRoleError) {
        this._invalidCnt++
        return [NG(err.message, err.target, err.diff)]
      }
      return [NG('Role: %1 is invalid JSON format.', name)]
    }
  }

  async _validateRoleOrRoleWithInstanceProfile(definedRole: RoleNode) {
    const roleName = definedRole.RoleName

    let currentRole: RoleNode
    if (definedRole.isEc2Role) {
      const profile = await getInstanceProfile(roleName)
      if (!profile) {
        throw new InvalidRoleError(
          '%1 instance profile does not exist.',
          roleName
        )
      }

      const { RoleName, Path, AssumeRolePolicyDocument } = profile.Roles[0]
      currentRole = new RoleNode(
        RoleName,
        Path,
        AssumeRolePolicyDocument
          ? JSON.parse(decodeURIComponent(AssumeRolePolicyDocument!))
          : undefined
      )
    } else {
      const gotRole = await RoleNode.findRole(roleName)
      if (!gotRole) {
        throw new InvalidRoleError('%1 does not exist.', roleName)
      }
      currentRole = gotRole!
    }

    const current = this._convertForDiff(currentRole)
    const defined = this._convertForDiff(definedRole)
    const df = jsonDiff.diffString(current, defined, { color: this._color })
    if (df) {
      throw new InvalidRoleError('%1 is invalid.', roleName, df)
    }
  }

  async _validateAttachedPolicies(
    roleName: string,
    attachedPolicies: IAM.AttachedPolicy[]
  ): Promise<Result[] | null> {
    const currentPolicies = await getAttachedPoliciesByRole(roleName)
    const results: Result[] = []
    const definedPolicies = attachedPolicies

    definedPolicies.forEach((definedPolicy: IAM.AttachedPolicy) => {
      if (!containPolicy(currentPolicies, definedPolicy)) {
        results.push(
          NG('Role: %1 does not have Policy: %2.', [
            roleName,
            definedPolicy.PolicyName,
          ])
        )
      }
    })

    currentPolicies.forEach((currentPolicy: IAM.AttachedPolicy) => {
      if (!containPolicy(definedPolicies, currentPolicy)) {
        results.push(
          NG('Role: %1 have Policy: %2 not required.', [
            roleName,
            currentPolicy.PolicyName,
          ])
        )
      }
    })

    if (results.length) {
      this._invalidCnt++
      return results
    }
    return null
  }

  isValid(): boolean {
    return this._invalidCnt === 0
  }

  _convertForDiff(role: any) {
    const data = JSON.parse(JSON.stringify(role))
    delete data.Arn
    delete data.RoleId
    delete data.CreateDate
    delete data.MaxSessionDuration
    delete data.Tags
    return data
  }
}
