/**
 * validate IAM polices from JSON files
 */
'use strict';

const promisedLife = require('promised-lifestream');
const FileUtil = require('./utils/file')
const StreamUtils = require('@tilfin/stream-utils')
const { promisedStream } = require('./utils/stream')
const { createWriter } = require('./utils/result_writer');
const iamPolicy = require('./aws/policy');
const PolicyValidator = require('./logic/policy_validator');


module.exports = async function(inDir, varSet, opts = {}) {
  const validator = new PolicyValidator(opts)

  const jsonFiles = await FileUtil.listJsonFiles(inDir)

  await promisedLife([
    StreamUtils.readArray(jsonFiles),
    promisedStream(file => iamPolicy.readPolicyFile(file, varSet) ),
    promisedStream(entry => validator.validate(entry.name, entry.document) ),
    createWriter(opts)
  ])

  return validator.isValid()
}
