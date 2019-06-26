import path from 'path'
import { IAM } from 'aws-sdk'
import { iam } from './iam'
import { readFile } from '../utils/file'
import { substitute, parseJSON } from '../utils/varset'

export type DocJson = string

export interface MyPolicyStatement {
  Sid: string
  Effect: string
  Action: any
  Resource: any
}

export type MyPolicyDocument = {
  Version: string
  Statement: MyPolicyStatement[]
}

export type LocalPolicyFile = {
  name: string
  document: MyPolicyDocument
}

export interface GetPolicyVersionResult {
  name: string
  arn: string
  document: string
  versionId: string
  isDefaultVersion?: boolean
  createDate?: Date
}

export async function getPolicyDefaultVersion(policy: any): Promise<GetPolicyVersionResult> {
  const params = {
    PolicyArn: policy.Arn,
    VersionId: policy.DefaultVersionId
  }

  const data = await iam.getPolicyVersion(params).promise()
  const result = data.PolicyVersion!
  return {
    name: policy.PolicyName,
    arn: params.PolicyArn,
    document: result.Document!,
    versionId: result.VersionId!,
    isDefaultVersion: result.IsDefaultVersion,
    createDate: result.CreateDate,
  }
}

export type GetPolicyDefaultWithVersionInfoByArnResult = {
  defaultId: string
  oldestId: string
  count: number
  currentPolicy: GetPolicyVersionResult
}

export async function getPolicyDefaultWithVersionInfoByArn(arn: string): Promise<GetPolicyDefaultWithVersionInfoByArnResult> {
  const versions = await listPolicyVersions(arn)
  if (versions.length === 0) {
    throw new Error('Failed to get policy versions')
  }

  let defaultId: string = ''
  let oldestId: string = ''
  let createDate = new Date('2099-12-31T00:00:00.000Z')

  versions.forEach((ver: IAM.PolicyVersion) => {
    if (ver.IsDefaultVersion) {
      defaultId = ver.VersionId!
    } else {
      const date = ver.CreateDate!
      if (date < createDate) {
        createDate = date
        oldestId = ver.VersionId!
      }
    }
  })

  return {
    defaultId,
    oldestId,
    count: versions.length,
    currentPolicy: await getPolicyDefaultVersion({ Arn: arn, DefaultVersionId: defaultId })
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

export async function createPolicy({ name, document }: LocalPolicyFile, indent: number): Promise<IAM.CreatePolicyResponse> {
  const params = {
    PolicyName: name,
    PolicyDocument: convertDocToJSON(document, indent),
  }

  return iam.createPolicy(params).promise()
}

export async function createPolicyDefaultVersion(arn: string, doc: DocJson, indent: number): Promise<IAM.CreatePolicyVersionResponse> {
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

let _policyArnPrefix: string | null = null;

export async function getPolicyArnPrefix(): Promise<string> {
  if (_policyArnPrefix) {
  	return _policyArnPrefix!
  }

  const params = {
    Scope: 'Local',
    MaxItems: 1,
  }

  const data = await iam.listPolicies(params).promise()
  const policies = data.Policies!
  if (policies.length) {
    _policyArnPrefix = policies[0].Arn!.split('/')[0]
  }
  return _policyArnPrefix!
}

export async function readPolicyFile(filePath: string, varSet: any): Promise<LocalPolicyFile> {
  let name: string = ''
  try {
    name = path.basename(filePath, '.json')
    const text = await readFile(filePath)
    return {
      name: substitute(name, varSet),
      document: parseJSON(text, varSet),
    }
  } catch(err) {
    console.error(`Failed to read ${name}`)
    throw err
  }
}

export function convertDocToJSON(doc: object, indent: number = 4): DocJson {
  return JSON.stringify(doc, null, indent)
}
