/**
 * import IAM polices from JSON files
 */
'use strict';

const promisedLife = require('promised-lifestream');
const FileUtil = require('./utils/file');
const { ArrayReader, promisedStream } = require('./utils/stream');
const iamRole = require('./aws/role');
const RoleValidator = require('./logic/role_validator');

module.exports = function(inDir, varSet) {
  const validator = new RoleValidator();

  return FileUtil.listJsonFilesPromise(inDir)
  .then(fileList => {
    return promisedLife([
      new ArrayReader(fileList),
      promisedStream(file => iamRole.readRoleFile(file, varSet) ),
      promisedStream(entry => validator.validate(entry) ),
      process.stdout
    ])
  })
  .then(() => validator.isValid());
}
