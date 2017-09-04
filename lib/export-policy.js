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
const iamPolicy = require('./aws/policy');


function writePolicyFile(parentDir, name, doc) {
  const fileName = path.join(parentDir, name + '.json');
  const jsonStr = decodeURIComponent(doc);

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
        iamPolicy.getPolicyDefaultVersion(policy)
        .then(result => {
          this.push(result);
          callback();
        })
        .catch(err => { callback(err) });
      } else {
        callback();
      }
    }),
    promisedStream(item => {
      return writePolicyFile(outDir, item.name, item.document)
    }),
    process.stdout
  ])
  .catch(err => {
    console.error(err.stack)
  });
}
