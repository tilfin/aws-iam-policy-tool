/**
 * import IAM polices from JSON files
 */
'use strict';

const path = require('path');
const promisedLife = require('promised-lifestream');
const FileUtil = require('./utils/file');
const { ArrayReader, promisedStream } = require('./utils/stream');
const PolicyRegisterer = require('./logic/policy_registerer');
const iamPolicy = require('./aws/policy');

module.exports = function(inDir, varSet, opts) {
  const registerer = new PolicyRegisterer(opts);

  return FileUtil.listJsonFilesPromise(inDir)
  .then(fileList => {
    return promisedLife([
      new ArrayReader(fileList),
      promisedStream(file => iamPolicy.readPolicyFile(file, varSet) ),
      promisedStream(entry => registerer.register(entry.name, entry.document) ),
      process.stdout
    ])
  })
  .catch(err => {
    console.error(err.stack);
    return false;
  });
}
