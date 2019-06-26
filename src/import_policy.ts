/**
 * import IAM polices from JSON files
 */
const promisedLife = require('promised-lifestream')
const StreamUtils = require('@tilfin/stream-utils')

import { promisedStream } from './utils/stream'
import { createWriter } from './utils/result_writer'
import { readPolicyFile, LocalPolicyFile } from './aws/policy'
import { PolicyRegisterer } from './logic/policy_registerer'
import { listJsonFiles } from './utils/file'


export async function main(inDir: string, varSet: any, opts: any = {}) {
  const registerer = new PolicyRegisterer(opts)

  try {
    const jsonFiles = await listJsonFiles(inDir)

    return promisedLife([
      StreamUtils.readArray(jsonFiles),
      promisedStream((filePath: string) => readPolicyFile(filePath, varSet)),
      promisedStream((file: LocalPolicyFile) => registerer.register(file)),
      createWriter(opts)
    ])
  } catch(err) {
    console.error(err.stack)
    return false
  }
}
