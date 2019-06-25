import path from 'path'
import { iam } from './iam'
import { IAM } from 'aws-sdk';
const FileUtil = require('../utils/file');
const VarsetUtil = require('../utils/varset');

export interface MyStatement {
  Effect: string
  Principal: {
    Federated: string
    Service: string
  }
  Action: any
  Condition: any
}

export type MyRole = {
  RoleName: string
  Path: string
  AssumeRolePolicyDocument: {
    Version: string
    Statement: MyStatement[]
  }
}

export type MyRoleDocument = {
  Role: MyRole
  AttachedPolicies: IAM.AttachedPolicy[]
}

export type MyRoleDoc = {
  name: string
  document: MyRoleDocument
}

export type RoleData = {
  name: string
  document: any
}

export async function createRole(role: any): Promise<IAM.Role> {
  const params = Object.assign({}, role)
  params.AssumeRolePolicyDocument = JSON.stringify(params.AssumeRolePolicyDocument, null, 4)
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
    const role = data.Role
    role.AssumeRolePolicyDocument = JSON.parse(decodeURIComponent(role.AssumeRolePolicyDocument!))
    return role
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

export function isEc2Role(role: MyRole) {
  return role.AssumeRolePolicyDocument.Statement[0]!.Principal.Service === "ec2.amazonaws.com";
}

export async function readRoleFile(filePath: string, varSet: any): Promise<MyRoleDoc> {
  let name: string = ''
  try {
    name = path.basename(filePath, '.json')
    const text = await FileUtil.readFile(filePath)
    return {
      name,
      document: VarsetUtil.parseJSON(text, varSet) as MyRoleDocument,
    }
  } catch(err) {
    console.error(`Failed to read ${name}`)
    throw err
  }
}
