/**
 * export IAM polices to JSON files
 */
'use strict';

const path = require('path');
const FileUtil = require('./utils/file');
const promisedLife = require('promised-lifestream');
const ListPolicyStream = require('./aws/list_stream').ListPolicyStream;
const { filterStream, promisedStream } = require('./utils/stream');
const { createWriter } = require('./utils/result_writer');
const Result = require('./utils/result');
const iamPolicy = require('./aws/policy');


async function writePolicyFile(parentDir, name, doc) {
  const content = JSON.parse(decodeURIComponent(doc))
  const fileName = `${name}.json`

  try {
    await FileUtil.writeJSONFile(parentDir, fileName, content)
    return Result.OK('Wrote %1', fileName)
  } catch(err) {
    return Result.NG('Failed to write %1', fileName)
  }
}


module.exports = async function(outDir, nameMatcher, opts = {}) {
  return promisedLife([
    new ListPolicyStream({
      OnlyAttached: false,
      Scope: 'Local'
    }),
    filterStream(policy => {
      return (!nameMatcher || policy.PolicyName.match(nameMatcher));
    }),
    promisedStream(policy => iamPolicy.getPolicyDefaultVersion(policy) ),
    promisedStream(item => writePolicyFile(outDir, item.name, item.document) ),
    createWriter(opts)
  ])
  .catch(err => {
    console.error(err.stack);
    return false
  })
}
