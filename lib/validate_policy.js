/**
 * validate IAM polices from JSON files
 */
'use strict';

const promisedLife = require('promised-lifestream');
const FileUtil = require('./utils/file');
const { PromisedReader, promisedStream } = require('./utils/stream');
const { createWriter } = require('./utils/result_writer');
const iamPolicy = require('./aws/policy');
const PolicyValidator = require('./logic/policy_validator');


module.exports = async function(inDir, varSet, opts = {}) {
  const validator = new PolicyValidator(opts);

  return promisedLife([
    new PromisedReader(() => {
      return FileUtil.listJsonFiles(inDir)
    }),
    promisedStream(file => iamPolicy.readPolicyFile(file, varSet) ),
    promisedStream(entry => validator.validate(entry.name, entry.document) ),
    createWriter(opts)
  ])
  .then(() => validator.isValid());
}
