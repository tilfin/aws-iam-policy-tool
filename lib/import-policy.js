/**
 * import-policy.js
 *
 * import IAM polices from JSON files
 *
 * Usage) node import-policy.js <indir>
 *
 * Example: node import-policy.js iam/polcies
 */
'use strict';

const path = require('path');
const promisedLife = require('promised-lifestream');
const FileUtil = require('./utils/file');
const StringUtil = require('./utils/string');
const { ArrayReader, promisedStream } = require('./utils/stream');
const Status = require('./utils/status_code')(true);
const policy = require('./logic/policy');

function readPolicyFile(filePath) {
  return FileUtil.readFilePromise(filePath)
  .then(text => {
    return {
      name: path.basename(filePath, '.json'),
      document: text
    }
  });
}

function main(inDir, varSet) {
  FileUtil.listJsonFilesPromise(inDir)
  .then(fileList => {
    return promisedLife([
      new ArrayReader(fileList),
      promisedStream(file => readPolicyFile(file) ),
      promisedStream(entry => policy.createOrUpdatePolicy(entry, varSet) ),
      process.stdout
    ])
  })
  .catch(err => {
    console.log(err.stack)
  });
}


if (process.argv.length !== 3) {
  console.log('Usage) node import-policy.js <indir>');
  process.exit(1);
} else {
  var envs = {
    ACCOUNT_NO: process.env.ACCOUNT_NO
  }
  main(process.argv[2], envs);
}
