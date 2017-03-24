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
const AWS = require('aws-sdk');
const iam = new AWS.IAM();
const promisedLife = require('promised-lifestream');
const FileUtil = require('./utils/file');
const StringUtil = require('./utils/string');
const { ArrayReader, promisedStream } = require('./utils/stream');
const Status = require('./utils/status_code')(true);


function readPolicyFilePromise(filePath) {
  return FileUtil.readFilePromise(filePath)
  .then(text => {
    return {
      name: path.basename(filePath, '.json'),
      document: text
    }
  });
}

function createPolicyPromise(policy, varSet) {
  policy.name = StringUtil.expandVars(policy.name, varSet);
  policy.document = StringUtil.expandVars(policy.document, varSet);

  const params = {
    PolicyDocument: policy.document,
    PolicyName: policy.name,
  };

  return iam.createPolicy(params).promise()
  .then(data => `${Status.OK} Created ${policy.name}\n`)
  .catch(err => {
    if (err.code === 'EntityAlreadyExists') {
      return `${Status.Skip} ${policy.name} already exists.\n`;
    }
    throw err;
  });
}


function main(inDir, varSet) {
  FileUtil.listJsonFilesPromise(inDir)
  .then(fileList => {
    return promisedLife([
      new ArrayReader(fileList),
      promisedStream(file => readPolicyFilePromise(file) ),
      promisedStream(policy => createPolicyPromise(policy, varSet) ),
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
