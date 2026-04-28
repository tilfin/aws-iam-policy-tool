/**
 * export IAM polices to JSON files
 */
import { pipeline } from 'stream/promises';
import { Policy } from '@aws-sdk/client-iam'
import { filterStream, promisedStream } from './utils/stream'
import { createWriter } from './utils/result_writer'
import { writeJSONFile } from './utils/file'
import { ListPolicyStream } from './aws/list_stream'
import { OK, NG, Result } from './utils/result'
import { PolicyEntry, PolicyFetcher } from './aws/policy'
import { asError } from './utils/error'

async function writePolicyFile(
  parentDir: string,
  entry: PolicyEntry
): Promise<Result> {
  const fileName = `${entry.policyName}.json`

  try {
    await writeJSONFile(parentDir, fileName, entry.asJson())
    return OK('Wrote %1', fileName)
  } catch (err) {
    return NG('Failed to write %1', fileName)
  }
}

export async function main(outDir: string, nameMatcher: any, opts: any = {}) {
  const policyFetcher = new PolicyFetcher()

  try {
    return await pipeline([
      new ListPolicyStream({
        OnlyAttached: false,
        Scope: 'Local',
      }),
      filterStream((policy: Policy) => {
        return !nameMatcher || policy.PolicyName!.match(nameMatcher)
      }),
      promisedStream((policy: Policy) =>
        policyFetcher.getPolicyEntry(policy.Arn!, policy.DefaultVersionId!)
      ),
      promisedStream((entry: PolicyEntry) => writePolicyFile(outDir, entry)),
      createWriter(opts),
    ])
  } catch (err) {
    const error = asError(err)
    console.error(error.stack || error.message || err)
    return false
  }
}
