/**
 * import IAM roles from JSON files
 */
const promisedLife = require('promised-lifestream')
const StreamUtils = require('@tilfin/stream-utils')
const { promisedStream } = require('./utils/stream')
const { createWriter } = require('./utils/result_writer')
import { readRoleFile, MyRoleDoc } from './aws/role'
import { listJsonFiles } from './utils/file'
import { RoleRegisterer } from './logic/role_registerer'


export async function main(inDir: string, varSet: any, opts: any = {}) {
  const registerer = new RoleRegisterer(opts)

  try {
    const jsonFiles = await listJsonFiles(inDir)

    return promisedLife([
      StreamUtils.readArray(jsonFiles),
      promisedStream((filePath: string) => readRoleFile(filePath, varSet)),
      promisedStream((entry: MyRoleDoc) => registerer.register(entry)),
      createWriter(opts)
    ])
  } catch(err) {
    console.error(err.stack)
    return false
  }
}
