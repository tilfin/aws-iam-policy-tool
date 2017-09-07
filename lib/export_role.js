/**
 * export IAM roles to JSON files
 */
'use strict';

const path = require('path');
const iam = require('./aws/iam');
const FileUtil = require('./utils/file');
const promisedLife = require('promised-lifestream');
const ListRoleStream = require('./aws/list_stream').ListRoleStream;
const { filterStream, promisedStream } = require('./utils/stream');
const { createWriter } = require('./utils/result_writer');
const Result = require('./utils/result');


function listRolePolicies(role) {
  const params = { RoleName: role.RoleName };
  return iam.listAttachedRolePolicies(params).promise()
  .then(data => {
    return {
      Role: role,
      AttachedPolicies: data.AttachedPolicies
    }
  });
}


function writeRoleFile(parentDir, item) {
  const role = item.Role;
  const result = {
    Role: {
      RoleName: role.RoleName,
      Path: role.Path,
      AssumeRolePolicyDocument: JSON.parse(decodeURIComponent(role.AssumeRolePolicyDocument))
    },
    AttachedPolicies: item.AttachedPolicies
  }

  const fileName = `${role.RoleName}.json`;
  return FileUtil.writeJSONFile(parentDir, fileName, result)
  .then(() => Result.OK('Wrote %1', fileName))
  .catch(err => Result.NG('Failed to write %1', fileName));
}


module.exports = function(outDir, nameMatcher, opts) {
  opts = opts || {};

  return promisedLife([
    new ListRoleStream(),
    filterStream(role => {
      return (!nameMatcher || role.RoleName.match(nameMatcher));
    }),
    promisedStream(role => listRolePolicies(role) ),
    promisedStream(item => writeRoleFile(outDir, item) ),
    createWriter(opts)
  ])
  .catch(err => {
    console.error(err.stack);
    return false;
  });
}
