/**
 * import IAM polices from JSON files
 */
'use strict';

const promisedLife = require('promised-lifestream');
const FileUtil = require('./utils/file');
const { ArrayReader, promisedStream } = require('./utils/stream');
const PolicyRegisterer = require('./logic/policy_registerer');
const iamPolicy = require('./aws/policy');
const { ConsoleResultWriter, JSONResultWriter } = require('./utils/result_writer');

module.exports = function(inDir, varSet, opts) {
  opts = opts || {};
  const registerer = new PolicyRegisterer(opts);
  const writer = opts.json ? new JSONResultWriter()
                           : new ConsoleResultWriter({ plain: opts.plain });

  return FileUtil.listJsonFilesPromise(inDir)
  .then(fileList => {
    return promisedLife([
      new ArrayReader(fileList),
      promisedStream(file => iamPolicy.readPolicyFile(file, varSet) ),
      promisedStream(entry => registerer.register(entry.name, entry.document) ),
      writer
    ])
  })
  .catch(err => {
    console.error(err.stack);
    return false;
  });
}
