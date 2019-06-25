/**
 * import IAM polices from JSON files
 */
'use strict';

const promisedLife = require('promised-lifestream');
const FileUtil = require('./utils/file')
const StreamUtils = require('@tilfin/stream-utils')
const { promisedStream } = require('./utils/stream')
const { createWriter } = require('./utils/result_writer');
const iamPolicy = require('./aws/policy');
const PolicyRegisterer = require('./logic/policy_registerer');


module.exports = async function(inDir, varSet, opts = {}) {
  const registerer = new PolicyRegisterer(opts)

  try {
    const jsonFiles = await FileUtil.listJsonFiles(inDir)

    return promisedLife([
      StreamUtils.readArray(jsonFiles),
      promisedStream(file => iamPolicy.readPolicyFile(file, varSet) ),
      promisedStream(entry => registerer.register(entry.name, entry.document) ),
      createWriter(opts)
    ])
  } catch(err) {
    console.error(err.stack)
    return false
  }
}
