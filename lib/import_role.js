/**
 * import IAM roles from JSON files
 */
'use strict';

const promisedLife = require('promised-lifestream');
const FileUtil = require('./utils/file')
const StreamUtils = require('@tilfin/stream-utils')
const { promisedStream } = require('./utils/stream');
const { createWriter } = require('./utils/result_writer');
const iamRole = require('./aws/role');
const RoleRegisterer = require('./logic/role_registerer');


module.exports = async function(inDir, varSet, opts = {}) {
  const registerer = new RoleRegisterer(opts);

  try {
    const jsonFiles = await FileUtil.listJsonFiles(inDir)

    return promisedLife([
      StreamUtils.readArray(jsonFiles),
      promisedStream(file => iamRole.readRoleFile(file, varSet) ),
      promisedStream(entry => registerer.register(entry.name, entry.document) ),
      createWriter(opts)
    ])
  } catch(err) {
    console.error(err.stack)
    return false
  }
}
