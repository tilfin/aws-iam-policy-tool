/**
 * export-role.js
 *
 * export IAM roles to JSON files
 *
 * Usage) node export-role.js <outdir> <role name matcher regexp>
 *
 * Example: node export-role.js out/polcies "^myservice\-"
 */
'use strict';

const path = require('path');
const through2 = require('through2');
const AWS = require('aws-sdk');
const iam = new AWS.IAM();
const FileUtil = require('./utils/file');
const promisedLife = require('promised-lifestream');
const ListRoleStream = require('./aws/list_stream').ListRoleStream;
const promisedStream = require('./utils/stream').promisedStream;
const Status = require('./utils/status_code')(true);


function listRolePoliciesPromise(role) {
  const params = { RoleName: role.RoleName };
  return iam.listAttachedRolePolicies(params).promise()
  .then(data => {
    return {
      Role: role,
      AttachedPolicies: data.AttachedPolicies
    }
  });
}


function writeRoleFilePromise(parentDir, item) {
  const role = item.Role;
  const result = {
    Role: {
      RoleName: role.RoleName,
      Path: role.Path,
      AssumeRolePolicyDocument: JSON.parse(decodeURIComponent(role.AssumeRolePolicyDocument))
    },
    AttachedPolicies: item.AttachedPolicies
  }

  const fileName = path.join(parentDir, role.RoleName + '.json');
  const jsonStr = JSON.stringify(result, null, 4);

  return FileUtil.writeFilePromise(fileName, jsonStr)
  .then(() => `${Status.OK} Wrote ${fileName}\n`)
  .catch(err => `${Status.NG} Failed to write ${fileName}\n`);
}


function main(outDir, nameMatcher) {
  promisedLife([
    new ListRoleStream(),
    through2.obj(function (role, _, callback) {
      if (role.RoleName.match(nameMatcher)) {
        listRolePoliciesPromise(role)
        .then(result => {
          this.push(result);
          callback();
        })
        .catch(err => { callback(err) });
      } else {
        callback();
      }
    }),
    promisedStream(item => writeRoleFilePromise(outDir, item) ),
    process.stdout
  ])
  .catch(err => {
    console.log(err.stack)
  });
}


if (process.argv.length !== 4) {
  console.log('Usage) node export-role.js <outdir> <role name matcher regexp>');
  process.exit(1);
} else {
  main(process.argv[2], new RegExp(process.argv[3]));
}
