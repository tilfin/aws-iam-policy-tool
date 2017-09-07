/**
 * import IAM polices from JSON files
 */
'use strict';

const promisedLife = require('promised-lifestream');
const FileUtil = require('./utils/file');
const { PromisedReader, promisedStream } = require('./utils/stream');
const { createWriter } = require('./utils/result_writer');
const iamPolicy = require('./aws/policy');
const PolicyRegisterer = require('./logic/policy_registerer');


module.exports = function(inDir, varSet, opts) {
  opts = opts || {};
  const registerer = new PolicyRegisterer(opts);
 
  return promisedLife([
    new PromisedReader(() => {
      return FileUtil.listJsonFiles(inDir)
    }),
    promisedStream(file => iamPolicy.readPolicyFile(file, varSet) ),
    promisedStream(entry => registerer.register(entry.name, entry.document) ),
    createWriter(opts)
  ])
  .catch(err => {
    console.error(err.stack);
    return false;
  });
}
