import { iam } from './iam'
import {
  AttachedPolicy,
  CreatePolicyCommand,
  CreatePolicyCommandInput,
  CreatePolicyCommandOutput,
  CreatePolicyVersionCommand,
  CreatePolicyVersionCommandOutput,
  CreateRoleCommand,
  CreateRoleCommandInput,
  DeletePolicyVersionCommand,
  GetInstanceProfileCommand,
  GetPolicyCommand,
  GetPolicyVersionCommand,
  GetRoleCommand,
  ListAttachedRolePoliciesCommand,
  ListPolicyVersionsCommand,
  Policy,
  PolicyVersion,
  Role,
} from '@aws-sdk/client-iam'
import { asError } from '../utils/error'

export type ArnType = string
export type DocJson = string

export async function createRole(
  params: CreateRoleCommandInput
): Promise<Role> {
  const data = await iam.send(new CreateRoleCommand(params))
  return data.Role!
}

export async function getAttachedPoliciesByRole(
  roleName: string
): Promise<AttachedPolicy[]> {
  const params = {
    RoleName: roleName,
    MaxItems: 200,
  }
  const data = await iam.send(new ListAttachedRolePoliciesCommand(params))
  return data.AttachedPolicies!
}

export async function getRole(roleName: string): Promise<Role | null> {
  try {
    const params = { RoleName: roleName }
    const data = await iam.send(new GetRoleCommand(params))
    return data.Role || null
  } catch (err) {
    const error = asError(err)
    if (error.code === 'NoSuchEntity') return null
    throw err
  }
}

export async function getInstanceProfile(roleName: string) {
  try {
    const params = { InstanceProfileName: roleName }
    const data = await iam.send(new GetInstanceProfileCommand(params))
    return data.InstanceProfile
  } catch (err) {
    const error = asError(err)
    if (error.code === 'NoSuchEntity') return null
    throw err
  }
}

export async function listPolicyVersions(
  arn: string
): Promise<PolicyVersion[]> {
  const params = {
    PolicyArn: arn,
    MaxItems: 10,
  }

  const data = await iam.send(new ListPolicyVersionsCommand(params))
  return data.Versions || []
}

export async function getPolicy(arn: string): Promise<Policy> {
  const params = { PolicyArn: arn }
  const data = await iam.send(new GetPolicyCommand(params))
  return data.Policy!
}

export async function getPolicyVersion(
  arn: string,
  verionId: string
): Promise<PolicyVersion> {
  const params = {
    PolicyArn: arn,
    VersionId: verionId,
  }

  const data = await iam.send(new GetPolicyVersionCommand(params))
  return data.PolicyVersion!
}

export async function createPolicy(
  params: CreatePolicyCommandInput
): Promise<CreatePolicyCommandOutput> {
  return iam.send(new CreatePolicyCommand(params))
}

export async function createPolicyDefaultVersion(
  arn: string,
  doc: DocJson
): Promise<CreatePolicyVersionCommandOutput> {
  const params = {
    PolicyArn: arn,
    PolicyDocument: doc,
    SetAsDefault: true,
  }

  return iam.send(new CreatePolicyVersionCommand(params))
}

export async function deletePolicyVersion(arn: string, versionId: string) {
  const params = {
    PolicyArn: arn,
    VersionId: versionId,
  }

  return iam.send(new DeletePolicyVersionCommand(params))
}
