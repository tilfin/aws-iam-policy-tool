/**
 * validate IAM polices from JSON files
 */
const promisedLife = require('promised-lifestream')
const StreamUtils = require('@tilfin/stream-utils')

import { listJsonFiles } from './utils/file'
import { promisedStream } from './utils/stream'
import { createWriter } from './utils/result_writer'
import { PolicyEntry } from './aws/policy'
import { PolicyValidator } from './logic/policy_validator'
import { readPolicyFile } from './aws/file_reader'

export async function main(inDir: string, varSet: any, opts: any = {}) {
  const validator = new PolicyValidator(opts)
  const arnPrefix = await validator.prepare()

  const jsonFiles = await listJsonFiles(inDir)

  await promisedLife([
    StreamUtils.readArray(jsonFiles),
    promisedStream((filePath: string) =>
      readPolicyFile(filePath, varSet, arnPrefix)
    ),
    promisedStream((file: PolicyEntry) => validator.validate(file)),
    createWriter(opts),
  ])

  return validator.isValid()
}
