/**
 * export IAM roles to JSON files
 */
const promisedLife = require('promised-lifestream')

import { iam } from './aws/iam'
import { IAM } from 'aws-sdk'
import { RoleDocument } from './aws/role'
import { ListRoleStream } from './aws/list_stream'
import { filterStream, promisedStream } from './utils/stream'
import { createWriter } from './utils/result_writer'
import { OK, NG } from './utils/result'
import { writeJSONFile } from './utils/file'

type ListRolePoliciesResult = {
  Role: IAM.Role
  AttachedPolicies: IAM.AttachedPolicy[]
}


async function listRolePolicies(role: IAM.Role): Promise<ListRolePoliciesResult> {
  const params = { RoleName: role.RoleName }
  const data = await iam.listAttachedRolePolicies(params).promise()
  return {
    Role: role,
    AttachedPolicies: data.AttachedPolicies!
  }
}


async function writeRoleFile(parentDir: string, item: ListRolePoliciesResult) {
  const role: any = Object.assign({}, item.Role)
  if (role.AssumeRolePolicyDocument) {
    role.AssumeRolePolicyDocument = JSON.parse(decodeURIComponent(role.AssumeRolePolicyDocument))
  }

  const result: RoleDocument = {
    Role: role,
    AttachedPolicies: item.AttachedPolicies,
  }

  const fileName = `${role.RoleName}.json`
  try {
    await writeJSONFile(parentDir, fileName, result)
    return OK('Wrote %1', fileName)
  } catch(err) {
    return NG('Failed to write %1', fileName)
  }
}


export async function main(outDir: string, nameMatcher: any, opts = {}) {
  return promisedLife([
    new ListRoleStream(),
    filterStream((role: IAM.Role) => {
      return (!nameMatcher || role.RoleName.match(nameMatcher));
    }),
    promisedStream((role: IAM.Role) => listRolePolicies(role) ),
    promisedStream((item: ListRolePoliciesResult) => writeRoleFile(outDir, item) ),
    createWriter(opts)
  ])
  .catch((err: Error) => {
    console.error(err.stack)
    return false
  })
}
