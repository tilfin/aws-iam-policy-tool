import path from 'path'
import { readFile } from '../utils/file'
import { substitute, parseJSON } from '../utils/varset'
import { PolicyEntry, PolicyDocumentNode, PolicyNode } from './policy'
import { ArnType } from './operation'
import { RoleEntry, RoleDocument } from './role'

export async function readRoleFile(
  filePath: string,
  varSet: any
): Promise<RoleEntry> {
  let name = ''
  try {
    name = path.basename(filePath, '.json')
    const text = await readFile(filePath)
    return new RoleEntry(name, parseJSON(text, varSet) as RoleDocument)
  } catch (err) {
    console.error(`Failed to read ${name}`)
    throw err
  }
}

export async function readPolicyFile(
  filePath: string,
  varSet: any,
  arnPrefix: ArnType
): Promise<PolicyEntry> {
  let name = ''
  try {
    name = path.basename(filePath, '.json')
    name = substitute(name, varSet)

    const text = await readFile(filePath)
    const rawJson: any = parseJSON(text, varSet)

    let arn: ArnType
    let policyInfo: PolicyNode
    let docNode: PolicyDocumentNode
    if (rawJson.Document) {
      // V2
      const { Policy: policy } = rawJson
      arn = arnPrefix + policy.Path + policy.PolicyName
      policyInfo = {
        PolicyName: policy.PolicyName,
        Path: policy.Path,
      }
      docNode = rawJson.Document
    } else {
      // V1
      arn = arnPrefix + '/' + substitute(name, varSet)
      policyInfo = {
        PolicyName: substitute(name, varSet),
        Path: '/',
      }
      docNode = rawJson
    }

    return new PolicyEntry(arn, policyInfo, docNode)
  } catch (err) {
    console.error(`Failed to read ${name}`)
    throw err
  }
}
