/**
 * export IAM roles to JSON files
 */

import { iam } from './aws/iam'
import { IAM } from 'aws-sdk';
import { MyRoleDocument } from './aws/role';
const FileUtil = require('./utils/file');
const promisedLife = require('promised-lifestream');
const { ListRoleStream } = require('./aws/list_stream')
const { filterStream, promisedStream } = require('./utils/stream');
const { createWriter } = require('./utils/result_writer');
const Result = require('./utils/result')

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
  const role = item.Role
  const result: MyRoleDocument = {
    Role: {
      RoleName: role.RoleName,
      Path: role.Path,
      AssumeRolePolicyDocument: JSON.parse(decodeURIComponent(role.AssumeRolePolicyDocument!))
    },
    AttachedPolicies: item.AttachedPolicies
  }

  const fileName = `${role.RoleName}.json`;
  try {
    await FileUtil.writeJSONFile(parentDir, fileName, result)
    return Result.OK('Wrote %1', fileName)
  } catch(err) {
    return Result.NG('Failed to write %1', fileName)
  }
}


export default async function(outDir: string, nameMatcher: any, opts = {}) {
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
