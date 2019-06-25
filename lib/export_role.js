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


async function listRolePolicies(role) {
  const params = { RoleName: role.RoleName }
  const data = await iam.listAttachedRolePolicies(params).promise()
  return {
    Role: role,
    AttachedPolicies: data.AttachedPolicies
  }
}


async function writeRoleFile(parentDir, item) {
  const role = item.Role
  const result = {
    Role: {
      RoleName: role.RoleName,
      Path: role.Path,
      AssumeRolePolicyDocument: JSON.parse(decodeURIComponent(role.AssumeRolePolicyDocument))
    },
    AttachedPolicies: item.AttachedPolicies
  }

  const fileName = `${role.RoleName}.json`;
  try {
    await FileUtil.writeJSONFile(parentDir, fileName, result)
    return Result.OK('Wrote %1', fileName)
  } catch(err) {
    return Result.NG('Failed to write %1', fileName)
  }
}


module.exports = async function(outDir, nameMatcher, opts = {}) {
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
    return false
  })
}
