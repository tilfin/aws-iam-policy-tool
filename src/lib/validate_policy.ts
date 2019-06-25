/**
 * validate IAM polices from JSON files
 */
const promisedLife = require('promised-lifestream')
const StreamUtils = require('@tilfin/stream-utils')

import { listJsonFiles } from './utils/file'
import { promisedStream } from './utils/stream'
import { createWriter } from './utils/result_writer'
import { readPolicyFile, LocalPolicyFile } from './aws/policy'
import { PolicyValidator } from './logic/policy_validator'


export async function main(inDir: string, varSet: any, opts: any = {}) {
  const validator = new PolicyValidator(opts)

  const jsonFiles = await listJsonFiles(inDir)

  await promisedLife([
    StreamUtils.readArray(jsonFiles),
    promisedStream((filePath: string) => readPolicyFile(filePath, varSet)),
    promisedStream((file: LocalPolicyFile) => validator.validate(file)),
    createWriter(opts)
  ])

  return validator.isValid()
}
