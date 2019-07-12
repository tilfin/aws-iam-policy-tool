/**
 * validate IAM roles from JSON files
 */
const promisedLife = require('promised-lifestream')
const StreamUtils = require('@tilfin/stream-utils')

import { promisedStream } from './utils/stream'
import { readRoleFile, RoleEntry } from "./aws/role"
import { createWriter } from './utils/result_writer'
import { RoleValidator } from './logic/role_validator'
import { listJsonFiles } from './utils/file'


export async function main(inDir: string, varSet: any, opts: any = {}) {
  const validator = new RoleValidator()

  const jsonFiles = await listJsonFiles(inDir)

  await promisedLife([
    StreamUtils.readArray(jsonFiles),
    promisedStream((filePath: string) => readRoleFile(filePath, varSet)),
    promisedStream((file: RoleEntry) => validator.validate(file)),
    createWriter(opts)
  ])

  return validator.isValid()
}
