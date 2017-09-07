/**
 * validate IAM roles from JSON files
 */
'use strict';

const promisedLife = require('promised-lifestream');
const FileUtil = require('./utils/file');
const { PromisedReader, promisedStream } = require('./utils/stream');
const { createWriter } = require('./utils/result_writer');
const iamRole = require('./aws/role');
const RoleValidator = require('./logic/role_validator');


module.exports = function(inDir, varSet, opts) {
  opts = opts || {};
  const validator = new RoleValidator();

  return promisedLife([
    new PromisedReader(() => {
      return FileUtil.listJsonFiles(inDir)
    }),
    promisedStream(file => iamRole.readRoleFile(file, varSet) ),
    promisedStream(entry => validator.validate(entry) ),
    createWriter(opts)
  ])
  .then(() => validator.isValid());
}
