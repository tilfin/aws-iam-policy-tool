import { MyRole, getAttachedPoliciesByRole, MyRoleDocument } from "../aws/role"
import { containPolicy } from "../aws/attach"

const jsonDiff = require('json-diff')
import { isEc2Role, getInstanceProfile, getRole } from '../aws/role'
import { OK, NG, Result } from '../utils/result'
import { IAM } from "aws-sdk"


export class InvalidRoleError extends Error {
	public target: any;
	public diff: any;

  constructor(msg: string, target: string, diff?: any) {
    super(msg)
    this.target = target
    this.diff = diff || null
  }
}

export class RoleValidator {
	private _color: boolean;
	private _invalidCnt: number;

  constructor(opts: any = {}) {
    this._color = !(opts['plain'] || false)
    this._invalidCnt = 0
  }

  async validate(name: string, document: MyRoleDocument): Promise<Result[] | null> {
    try {
      const role = document.Role
      const roleName = role.RoleName

      await this._validateRoleOrRoleWithInstanceProfile(role)

      let results: Result[] | null = await this._validateAttachedPolicies(roleName, document.AttachedPolicies)
      if (results) return results

      return [OK(roleName)]
    } catch(err) {
      if (err instanceof InvalidRoleError) {
        this._invalidCnt++
        return [NG(err.message, err.target, err.diff)]
      }
      return [NG('Role: %1 is invalid JSON format.', name)]
    }
  }

  async _validateRoleOrRoleWithInstanceProfile(definedRole: MyRole) {
    const roleName = definedRole.RoleName;

    if (isEc2Role(definedRole)) {
      const profile = await getInstanceProfile(roleName)
      if (!profile) {
        throw new InvalidRoleError('%1 instance profile does not exist.', roleName)
      }

      const currentRole = profile.Roles[0]
      currentRole.AssumeRolePolicyDocument = JSON.parse(decodeURIComponent(currentRole.AssumeRolePolicyDocument!))
      this._deleteIgnoreFields(currentRole)

      const current = JSON.stringify(currentRole)
      const defined = JSON.stringify(definedRole)
      const df = jsonDiff.diffString(JSON.parse(current), JSON.parse(defined), { color: this._color })
      if (df) {
        throw new InvalidRoleError('%1 is invalid.', roleName, df)
      }
    } else {
      const currentRole = await getRole(roleName)
      if (!currentRole) {
        throw new InvalidRoleError('%1 does not exist.', roleName)
      }
      this._deleteIgnoreFields(currentRole)

      const current = JSON.stringify(currentRole)
      const defined = JSON.stringify(definedRole)
      const df = jsonDiff.diffString(JSON.parse(current), JSON.parse(defined), { color: this._color })
      if (df) {
        throw new InvalidRoleError('%1 is invalid.', roleName, df)
      }
    }
  }

  async _validateAttachedPolicies(roleName: string, attachedPolicies: IAM.AttachedPolicy[]): Promise<Result[] | null> {
    const currentPolicies = await getAttachedPoliciesByRole(roleName)
    const results: Result[] = []
    const definedPolicies = attachedPolicies

    definedPolicies.forEach((definedPolicy: IAM.AttachedPolicy) => {
      if (!containPolicy(currentPolicies, definedPolicy)) {
        results.push(NG('Role: %1 does not have Policy: %2.',
                                [roleName, definedPolicy.PolicyName]))
      }
    })

    currentPolicies.forEach((currentPolicy: IAM.AttachedPolicy) => {
      if (!containPolicy(definedPolicies, currentPolicy)) {
        results.push(NG('Role: %1 have Policy: %2 not required.',
                                [roleName, currentPolicy.PolicyName]))
      }
    })

    if (results.length) {
      this._invalidCnt++
      return results
    } else {
      return null
    }
  }

  isValid() {
    return this._invalidCnt === 0
  }

  _deleteIgnoreFields(role: any) {
    delete role.Arn
    delete role.RoleId
    delete role.CreateDate
    delete role.MaxSessionDuration
    delete role.Tags
  }
}
