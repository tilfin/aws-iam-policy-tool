/**
 * validate IAM polices from JSON files
 */
'use strict';

const path = require('path');
const promisedLife = require('promised-lifestream');
const FileUtil = require('./utils/file');
const VarsetUtil = require('./utils/varset');
const { ArrayReader, promisedStream } = require('./utils/stream');
const { ConsoleResultWriter, JSONResultWriter } = require('./utils/result_writer');
const policy = require('./aws/policy');
const PolicyValidator = require('./logic/policy_validator');


module.exports = function(inDir, varSet, opts) {
  const validator = new PolicyValidator(opts);
  const writer = opts.json ? new JSONResultWriter()
                           : new ConsoleResultWriter({ plain: opts.plain });

  return FileUtil.listJsonFilesPromise(inDir)
  .then(fileList => {
    return promisedLife([
      new ArrayReader(fileList),
      promisedStream(file => policy.readPolicyFile(file, varSet) ),
      promisedStream(entry => validator.validate(entry.name, entry.document) ),
      writer
    ])
  })
  .then(() => validator.isValid());
}
