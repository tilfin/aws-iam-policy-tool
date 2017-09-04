/**
 * import IAM polices from JSON files
 */
'use strict';

const path = require('path');
const promisedLife = require('promised-lifestream');
const FileUtil = require('./utils/file');
const { ArrayReader, promisedStream } = require('./utils/stream');
const Status = require('./utils/status_code')(true);
const createOrUpdatePolicy = require('./logic/create_or_update_policy');

function readPolicyFile(filePath) {
  return FileUtil.readFilePromise(filePath)
  .then(text => {
    return {
      name: path.basename(filePath, '.json'),
      document: text
    }
  });
}

module.exports = function(inDir, varSet) {
  FileUtil.listJsonFilesPromise(inDir)
  .then(fileList => {
    return promisedLife([
      new ArrayReader(fileList),
      promisedStream(file => readPolicyFile(file) ),
      promisedStream(entry => createOrUpdatePolicy(entry, varSet) ),
      process.stdout
    ])
  })
  .catch(err => {
    console.error(err.stack)
  });
}
