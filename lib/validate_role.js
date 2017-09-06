/**
 * validate IAM roles from JSON files
 */
'use strict';

const promisedLife = require('promised-lifestream');
const FileUtil = require('./utils/file');
const { ArrayReader, promisedStream } = require('./utils/stream');
const { ConsoleResultWriter, JSONResultWriter } = require('./utils/result_writer');
const iamRole = require('./aws/role');
const RoleValidator = require('./logic/role_validator');

module.exports = function(inDir, varSet, opts) {
  const validator = new RoleValidator();
  const writer = opts.json ? new JSONResultWriter()
                           : new ConsoleResultWriter({ plain: opts.plain });

  return FileUtil.listJsonFilesPromise(inDir)
  .then(fileList => {
    return promisedLife([
      new ArrayReader(fileList),
      promisedStream(file => iamRole.readRoleFile(file, varSet) ),
      promisedStream(entry => validator.validate(entry) ),
      writer
    ])
  })
  .then(() => validator.isValid());
}
