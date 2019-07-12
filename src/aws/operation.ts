import { iam } from './iam'
import { IAM } from 'aws-sdk'

export type ArnType = string
export type DocJson = string

export async function createRole(params: IAM.CreateRoleRequest): Promise<IAM.Role> {
  const data = await iam.createRole(params).promise()
  return data.Role
}

export async function getAttachedPoliciesByRole(roleName: string): Promise<IAM.AttachedPolicy[]> {
  const params = { RoleName: roleName }
  const data = await iam.listAttachedRolePolicies(params).promise()
  return data.AttachedPolicies!
}

export async function getRole(roleName: string): Promise<IAM.Role | null> {
  try {
    const params = { RoleName: roleName }
    const data = await iam.getRole(params).promise()
    return data.Role
  } catch(err) {
    if (err.code === 'NoSuchEntity') return null
    throw err
  }
}

export async function getInstanceProfile(roleName: string) {
  try {
    const params = { InstanceProfileName: roleName }
    const data = await iam.getInstanceProfile(params).promise()
    return data.InstanceProfile
  } catch(err) {
    if (err.code === 'NoSuchEntity') return null
    throw err
  }
}

export async function listPolicyVersions(arn: string): Promise<IAM.PolicyVersion[]> {
  const params = {
    PolicyArn: arn,
    MaxItems: 10,
  }

  const data = await iam.listPolicyVersions(params).promise()
  return data.Versions || []
}

export async function getPolicyVersion(arn: string, verionId: string): Promise<IAM.PolicyVersion> {
  const params = {
    PolicyArn: arn,
    VersionId: verionId
  }

  const data = await iam.getPolicyVersion(params).promise()
  return data.PolicyVersion!
}

export async function createPolicy(params: IAM.CreatePolicyRequest): Promise<IAM.CreatePolicyResponse> {
  return iam.createPolicy(params).promise()
}

export async function createPolicyDefaultVersion(arn: string, doc: DocJson): Promise<IAM.CreatePolicyVersionResponse> {
  const params = {
    PolicyArn: arn,
    PolicyDocument: doc,
    SetAsDefault: true,
  }

  return iam.createPolicyVersion(params).promise()
}

export async function deletePolicyVersion(arn: string, versionId: string) {
  const params = {
    PolicyArn: arn,
    VersionId: versionId,
  }

  return iam.deletePolicyVersion(params).promise()
}
