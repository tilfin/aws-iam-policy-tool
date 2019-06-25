/**
 * validate IAM polices from JSON files
 */
const promisedLife = require('promised-lifestream')
const StreamUtils = require('@tilfin/stream-utils')

import { listJsonFiles } from './utils/file'
import { promisedStream } from './utils/stream'
import { createWriter } from './utils/result_writer'
import { readPolicyFile, MyPolicyDoc } from './aws/policy'
import { PolicyValidator } from './logic/policy_validator'


export default async function(inDir: string, varSet: any, opts: any = {}) {
  const validator = new PolicyValidator(opts)

  const jsonFiles = await listJsonFiles(inDir)

  await promisedLife([
    StreamUtils.readArray(jsonFiles),
    promisedStream((file: string) => readPolicyFile(file, varSet) ),
    promisedStream((entry: MyPolicyDoc) => validator.validate(entry) ),
    createWriter(opts)
  ])

  return validator.isValid()
}
