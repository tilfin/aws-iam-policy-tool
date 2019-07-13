/**
 * export IAM polices to JSON files
 */
const promisedLife = require('promised-lifestream')

import { IAM } from 'aws-sdk'
import { filterStream, promisedStream } from './utils/stream'
import { createWriter } from './utils/result_writer'
import { writeJSONFile } from './utils/file'
import { ListPolicyStream } from './aws/list_stream'
import { OK, NG, Result } from './utils/result'
import { PolicyEntry, PolicyFetcher } from './aws/policy'

async function writePolicyFile(
  parentDir: string,
  entry: PolicyEntry
): Promise<Result> {
  const content = entry.document
  const fileName = `${entry.policyName}.json`

  try {
    await writeJSONFile(parentDir, fileName, content)
    return OK('Wrote %1', fileName)
  } catch (err) {
    return NG('Failed to write %1', fileName)
  }
}

export async function main(outDir: string, nameMatcher: any, opts: any = {}) {
  const policyFetcher = new PolicyFetcher()

  try {
    return await promisedLife([
      new ListPolicyStream({
        OnlyAttached: false,
        Scope: 'Local',
      }),
      filterStream((policy: IAM.Policy) => {
        return !nameMatcher || policy.PolicyName!.match(nameMatcher)
      }),
      promisedStream((policy: IAM.Policy) =>
        policyFetcher.getPolicyVersion(policy.Arn!, policy.DefaultVersionId!)
      ),
      promisedStream((entry: PolicyEntry) => writePolicyFile(outDir, entry)),
      createWriter(opts),
    ])
  } catch (err) {
    console.error(err.stack)
    return false
  }
}
