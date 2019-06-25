/**
 * validate IAM roles from JSON files
 */
'use strict';

const promisedLife = require('promised-lifestream');
const FileUtil = require('./utils/file')
const StreamUtils = require('@tilfin/stream-utils')
const { promisedStream } = require('./utils/stream')
const { createWriter } = require('./utils/result_writer');
const iamRole = require('./aws/role');
const RoleValidator = require('./logic/role_validator');


module.exports = async function(inDir, varSet, opts = {}) {
  const validator = new RoleValidator()

  const jsonFiles = await FileUtil.listJsonFiles(inDir)

  await promisedLife([
    StreamUtils.readArray(jsonFiles),
    promisedStream(file => iamRole.readRoleFile(file, varSet) ),
    promisedStream(entry => validator.validate(entry.name, entry.document) ),
    createWriter(opts)
  ])

  return validator.isValid()
}
