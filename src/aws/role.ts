import path from 'path'
import { IAM } from 'aws-sdk'
import { readFile } from '../utils/file'
import { parseJSON } from '../utils/varset'
import { getRole } from './operation';

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

  static async findRole(roleName: string): Promise<RoleNode> {
    const role = await getRole(roleName)
    return this.fromIAMRole(role!)
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
