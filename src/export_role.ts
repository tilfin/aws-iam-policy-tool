/**
 * export IAM roles to JSON files
 */
import { pipeline } from 'stream/promises';
import { iam } from './aws/iam'
import {
  AttachedPolicy,
  ListAttachedRolePoliciesCommand,
  Role,
} from '@aws-sdk/client-iam'
import { RoleDocument } from './aws/role'
import { ListRoleStream } from './aws/list_stream'
import { filterStream, promisedStream } from './utils/stream'
import { createWriter } from './utils/result_writer'
import { OK, NG } from './utils/result'
import { writeJSONFile } from './utils/file'

interface ListRolePoliciesResult {
  Role: Role;
  AttachedPolicies: AttachedPolicy[];
}

async function listRolePolicies(
  role: Role
): Promise<ListRolePoliciesResult> {
  const params = { RoleName: role.RoleName }
  const data = await iam.send(new ListAttachedRolePoliciesCommand(params))
  return {
    Role: role,
    AttachedPolicies: data.AttachedPolicies!,
  }
}

async function writeRoleFile(parentDir: string, item: ListRolePoliciesResult) {
  const role: any = Object.assign({}, item.Role)
  if (role.AssumeRolePolicyDocument) {
    role.AssumeRolePolicyDocument = JSON.parse(
      decodeURIComponent(role.AssumeRolePolicyDocument)
    )
  }

  const result: RoleDocument = {
    Role: role,
    AttachedPolicies: item.AttachedPolicies,
  }

  const fileName = `${role.RoleName}.json`
  try {
    await writeJSONFile(parentDir, fileName, result)
    return OK('Wrote %1', fileName)
  } catch (err) {
    return NG('Failed to write %1', fileName)
  }
}

export async function main(outDir: string, nameMatcher: any, opts = {}) {
  return await pipeline([
    new ListRoleStream(),
    filterStream((role: Role) => {
      return !nameMatcher || role.RoleName!.match(nameMatcher)
    }),
    promisedStream((role: Role) => listRolePolicies(role)),
    promisedStream((item: ListRolePoliciesResult) =>
      writeRoleFile(outDir, item)
    ),
    createWriter(opts),
  ]).catch((err: Error) => {
    console.error(err.stack)
    return false
  })
}
