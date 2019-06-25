/**
 * import IAM roles from JSON files
 */
'use strict';

const promisedLife = require('promised-lifestream');
const FileUtil = require('./utils/file');
const { PromisedReader, promisedStream } = require('./utils/stream');
const { createWriter } = require('./utils/result_writer');
const iamRole = require('./aws/role');
const RoleRegisterer = require('./logic/role_registerer');


module.exports = async function(inDir, varSet, opts = {}) {
  const registerer = new RoleRegisterer(opts);

  return promisedLife([
    new PromisedReader(() => {
      return FileUtil.listJsonFiles(inDir)
    }),
    promisedStream(file => iamRole.readRoleFile(file, varSet) ),
    promisedStream(entry => registerer.register(entry.name, entry.document) ),
    createWriter(opts)
  ])
  .catch(err => {
    console.error(err.stack);
    return false
  })
}
