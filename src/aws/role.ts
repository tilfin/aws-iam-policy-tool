import path from 'path'
import { iam } from './iam'
import { IAM } from 'aws-sdk'
import { readFile } from '../utils/file'
import { parseJSON } from '../utils/varset'

export interface StatementNode {
  Effect: string
  Principal: {
    Federated: string
    Service: string
  }
  Action: any
  Condition: any
}

export interface AssumeRolePolicyDocumentNode {
  Version: string
  Statement: StatementNode[]
}

export interface IRoleNode {
  RoleName: string
  Path: string
  AssumeRolePolicyDocument?: AssumeRolePolicyDocumentNode
}

export class RoleNode implements IRoleNode {
  RoleName: string
  Path: string
  AssumeRolePolicyDocument?: AssumeRolePolicyDocumentNode

  constructor(RoleName: string, Path: string, AssumeRolePolicyDocument?: AssumeRolePolicyDocumentNode) {
    this.RoleName = RoleName;
    this.Path = Path;
    this.AssumeRolePolicyDocument = AssumeRolePolicyDocument;
  }

  get isEc2Role(): boolean {
    if (this.AssumeRolePolicyDocument) {
      return this.AssumeRolePolicyDocument.Statement[0]!.Principal.Service === "ec2.amazonaws.com"
    } else {
      return false
    }
  }

  toCreateRoleParams(): IAM.CreateRoleRequest {
    return {
      RoleName: this.RoleName,
      Path: this.Path,
      AssumeRolePolicyDocument: JSON.stringify(this.AssumeRolePolicyDocument, null, 4)
    }
  }

  static fromIAMRole(role: IAM.Role) {
    return new RoleNode(
      role.RoleName,
      role.Path,
      role.AssumeRolePolicyDocument ? JSON.parse(decodeURIComponent(role.AssumeRolePolicyDocument!)) : undefined
    )
  }
}

export type RoleDocument = {
  Role: RoleNode
  AttachedPolicies: IAM.AttachedPolicy[]
}

export class RoleEntry {
  name: string;
  Role: RoleNode;
  AttachedPolicies: IAM.AttachedPolicy[];

  constructor(name: string, document: RoleDocument) {
    this.name = name;
    const { RoleName, Path, AssumeRolePolicyDocument } = document.Role;
    this.Role = new RoleNode(RoleName, Path, AssumeRolePolicyDocument);
    this.AttachedPolicies = document.AttachedPolicies;
  }
}

export async function createRole(role: RoleNode): Promise<IAM.Role> {
  const data = await iam.createRole(role.toCreateRoleParams()).promise()
  return data.Role
}

export async function getAttachedPoliciesByRole(roleName: string): Promise<IAM.AttachedPolicy[]> {
  const params = { RoleName: roleName }
  const data = await iam.listAttachedRolePolicies(params).promise()
  return data.AttachedPolicies!
}

export async function getRole(roleName: string): Promise<RoleNode | null> {
  try {
    const params = { RoleName: roleName }
    const data = await iam.getRole(params).promise()
    return RoleNode.fromIAMRole(data.Role)
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

export async function readRoleFile(filePath: string, varSet: any): Promise<RoleEntry> {
  let name: string = ''
  try {
    name = path.basename(filePath, '.json')
    const text = await readFile(filePath)
    return new RoleEntry(name, parseJSON(text, varSet) as RoleDocument)
  } catch(err) {
    console.error(`Failed to read ${name}`)
    throw err
  }
}
