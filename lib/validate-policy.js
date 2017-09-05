/**
 * import IAM polices from JSON files
 */
'use strict';

const path = require('path');
const promisedLife = require('promised-lifestream');
const FileUtil = require('./utils/file');
const { ArrayReader, promisedStream } = require('./utils/stream');
const Status = require('./utils/status_code')(true);
const PolicyValidator = require('./logic/policy_validator');

function readPolicyFile(filePath) {
  return FileUtil.readFilePromise(filePath)
  .then(text => {
    return {
      name: path.basename(filePath, '.json'),
      document: text
    }
  });
}

module.exports = function(inDir, varSet, opts) {
  const validator = new PolicyValidator();

  return FileUtil.listJsonFilesPromise(inDir)
  .then(fileList => {
    return promisedLife([
      new ArrayReader(fileList),
      promisedStream(file => readPolicyFile(file) ),
      promisedStream(entry => validator.validate(entry, varSet, opts) ),
      process.stdout
    ])
  })
  .then(() => validator.isValid());
}
