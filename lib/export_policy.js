/**
 * export IAM polices to JSON files
 */
'use strict';

const path = require('path');
const through2 = require('through2');
const FileUtil = require('./utils/file');
const promisedLife = require('promised-lifestream');
const ListPolicyStream = require('./aws/list_stream').ListPolicyStream;
const promisedStream = require('./utils/stream').promisedStream;
const Result = require('./utils/result');
const { ConsoleResultWriter, JSONResultWriter } = require('./utils/result_writer');
const iamPolicy = require('./aws/policy');


function writePolicyFile(parentDir, name, doc) {
  const fileName = path.join(parentDir, name + '.json');
  const jsonStr = decodeURIComponent(doc);

  return FileUtil.writeFilePromise(fileName, jsonStr)
  .then(() => Result.OK('Wrote %1', fileName))
  .catch(err => Result.NG('Failed to write %1', fileName));
}


module.exports = function(outDir, nameMatcher, opts) {
  opts = opts || {};
  const writer = opts.json ? new JSONResultWriter()
                           : new ConsoleResultWriter({ plain: opts.plain });

  return promisedLife([
    new ListPolicyStream({
      OnlyAttached: false,
      Scope: 'Local'
    }),
    through2.obj(function (policy, _, callback) {
      if (!nameMatcher || policy.PolicyName.match(nameMatcher)) {
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
    writer
  ])
  .catch(err => {
    console.error(err.stack);
    return false;
  });
}
