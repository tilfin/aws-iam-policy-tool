/**
 * import IAM roles from JSON files
 */
'use strict';

const promisedLife = require('promised-lifestream');
const FileUtil = require('./utils/file');
const { ArrayReader, promisedStream } = require('./utils/stream');
const { ConsoleResultWriter, JSONResultWriter } = require('./utils/result_writer');
const iamRole = require('./aws/role');
const RoleRegisterer = require('./logic/role_registerer');


module.exports = function(inDir, varSet, opts) {
  opts = opts || {};
  const writer = opts.json ? new JSONResultWriter()
                           : new ConsoleResultWriter({ plain: opts.plain });
  const registerer = new RoleRegisterer(opts);

  return FileUtil.listJsonFilesPromise(inDir)
  .then(fileList => {
    return promisedLife([
      new ArrayReader(fileList),
      promisedStream(file => iamRole.readRoleFile(file, varSet) ),
      promisedStream(role => registerer.register(role) ),
      writer
    ])
  })
  .catch(err => {
    console.error(err.stack);
    return false;
  });
}
