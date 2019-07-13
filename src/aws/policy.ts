import { IAM } from 'aws-sdk'
import { iam } from './iam'
import {
  ArnType,
  DocJson,
  listPolicyVersions,
  getPolicyVersion,
  getPolicy,
} from './operation'

export interface PolicyStatementNode {
  Sid: string;
  Effect: string;
  Action: any;
  Resource: any;
}

export interface PolicyDocumentNode {
  Version: string;
  Statement: PolicyStatementNode[];
}

export interface PolicyNode {
  PolicyName: string;
  Path: string;
}

export class PolicyEntry {
  arn: ArnType
  policyNode: PolicyNode
  document: PolicyDocumentNode

  constructor(arn: ArnType, policy: PolicyNode, document: PolicyDocumentNode) {
    this.arn = arn
    this.policyNode = policy
    this.document = document
  }

  get policyName(): string {
    return this.policyNode.PolicyName
  }

  asJson(): any {
    return {
      Policy: this.policyNode,
      Document: this.document,
    }
  }

  documentAsJson(): DocJson {
    return this.convertDocToJSON(this.document, 4)
  }

  toCreatePolicyParams(indent: number): IAM.CreatePolicyRequest {
    return {
      PolicyName: this.policyNode.PolicyName,
      Path: this.policyNode.Path,
      PolicyDocument: this.convertDocToJSON(this.document, indent),
    }
  }

  private convertDocToJSON(doc: object, indent: number = 4): DocJson {
    return JSON.stringify(doc, null, indent)
  }
}

export interface PolicyVersionsInfo {
  defaultId: string;
  oldestId: string;
  count: number;
}

export interface GetPolicyDefaultWithVersionInfoResult {
  currentPolicy: PolicyEntry;
}

export class PolicyFetcher {
  private arnPrefix?: string

  constructor(arnPrefix?: string) {
    this.arnPrefix = arnPrefix
  }

  async getPolicyEntry(arn: string, versionId: string) {
    const [policyInfo, docNode] = await Promise.all([
      getPolicy(arn),
      this.getPolicyDocumentVersion(arn, versionId),
    ])
    const policyNode: PolicyNode = {
      PolicyName: policyInfo.PolicyName!,
      Path: policyInfo.Path || '/',
    }
    return new PolicyEntry(arn, policyNode, docNode)
  }

  async getPolicyDefaultWithVersionInfo(entry: PolicyEntry): Promise<GetPolicyDefaultWithVersionInfoResult & PolicyVersionsInfo> {
    const { arn } = entry

    const versions = await listPolicyVersions(arn)
    if (versions.length === 0) {
      throw new Error('Failed to get policy versions')
    }

    const { defaultId, oldestId, count } = this.getPolicyVersionsInfoFrom(versions)

    return {
      defaultId,
      oldestId,
      count,
      currentPolicy: await this.getPolicyEntry(arn, defaultId),
    }
  }

  async getPolicyDocumentVersion(
    policyArn: string,
    verionId: string
  ): Promise<PolicyDocumentNode> {
    const result = await getPolicyVersion(policyArn, verionId)
    return JSON.parse(decodeURIComponent(result.Document!))
  }

  private getPolicyVersionsInfoFrom(
    versions: IAM.PolicyVersion[]
  ): PolicyVersionsInfo {
    let defaultId = ''
    let oldestId = ''
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
    }
  }
}

let _policyArnPrefix: string | null = null

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
