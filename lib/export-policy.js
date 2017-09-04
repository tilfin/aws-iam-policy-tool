/**
 * export-policy.js
 *
 * export IAM polices to JSON files
 *
 * Usage) node export-policy.js <outdir> <policy name matcher regexp>
 *
 * Example: node export-policy.js out/polcies "\-environment$"
 */
'use strict';

const path = require('path');
const through2 = require('through2');
const AWS = require('aws-sdk');
const iam = new AWS.IAM();
const FileUtil = require('./utils/file');
const promisedLife = require('promised-lifestream');
const ListPolicyStream = require('./aws/list_stream').ListPolicyStream;
const promisedStream = require('./utils/stream').promisedStream;
const Status = require('./utils/status_code')(true);
const policy = require('./aws/policy');


function writePolicyFile(parentDir, policy, result) {
  const fileName = path.join(parentDir, policy.PolicyName + '.json');
  const jsonStr = decodeURIComponent(result.PolicyVersion.Document);

  return FileUtil.writeFilePromise(fileName, jsonStr)
  .then(() => `${Status.OK} Wrote ${fileName}\n`)
  .catch(err => `${Status.NG} Failed to write ${fileName}\n`);
}


function main(outDir, nameMatcher) {
  promisedLife([
    new ListPolicyStream({
      OnlyAttached: false,
      Scope: 'Local'
    }),
    through2.obj(function (policy, _, callback) {
      if (policy.PolicyName.match(nameMatcher)) {
        policy.getPolicyDefaultVersion(policy)
        .then(result => {
          this.push(result);
          callback();
        })
        .catch(err => { callback(err) });
      } else {
        callback();
      }
    }),
    promisedStream(item => writePolicyFile(outDir, item.policy, item.result) ),
    process.stdout
  ])
  .catch(err => {
    console.log(err.stack)
  });
}


if (process.argv.length !== 4) {
  console.log('Usage) node export-policy.js <outdir> <policy name matcher regexp>');
  process.exit(1);
} else {
  main(process.argv[2], new RegExp(process.argv[3]));
}
