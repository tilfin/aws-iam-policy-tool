/**
 * validate IAM roles from JSON files
 */

import { readRoleFile } from "./aws/role"

const promisedLife = require('promised-lifestream');
const FileUtil = require('./utils/file')
const StreamUtils = require('@tilfin/stream-utils')
const { promisedStream } = require('./utils/stream')
const { createWriter } = require('./utils/result_writer');
const RoleValidator = require('./logic/role_validator');


export async function main(inDir: string, varSet: any, opts: any = {}) {
  const validator = new RoleValidator()

  const jsonFiles = await FileUtil.listJsonFiles(inDir)

  await promisedLife([
    StreamUtils.readArray(jsonFiles),
    promisedStream((file: string) => readRoleFile(file, varSet) ),
    promisedStream((entry: any) => validator.validate(entry.name, entry.document) ),
    createWriter(opts)
  ])

  return validator.isValid()
}
