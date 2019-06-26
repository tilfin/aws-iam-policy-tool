/**
 * import IAM roles from JSON files
 */
const promisedLife = require('promised-lifestream')
const StreamUtils = require('@tilfin/stream-utils')

import { promisedStream } from './utils/stream'
import { createWriter } from './utils/result_writer'
import { readRoleFile, LocalRoleFile } from './aws/role'
import { listJsonFiles } from './utils/file'
import { RoleRegisterer } from './logic/role_registerer'


export async function main(inDir: string, varSet: any, opts: any = {}) {
  const registerer = new RoleRegisterer(opts)

  try {
    const jsonFiles = await listJsonFiles(inDir)

    return promisedLife([
      StreamUtils.readArray(jsonFiles),
      promisedStream((filePath: string) => readRoleFile(filePath, varSet)),
      promisedStream((file: LocalRoleFile) => registerer.register(file)),
      createWriter(opts)
    ])
  } catch(err) {
    console.error(err.stack)
    return false
  }
}
