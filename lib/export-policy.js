/**
 * export IAM polices to JSON files
 */
'use strict';

const path = require('path');
const through2 = require('through2');
const iam = require('./aws/iam');
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


module.exports = function(outDir, nameMatcher) {
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
    console.error(err.stack)
  });
}
