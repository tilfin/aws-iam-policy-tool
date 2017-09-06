'use strict';

const path = require('path');
const iam = require('./iam');
const FileUtil = require('../utils/file');
const VarsetUtil = require('../utils/varset');

function createRole(roleName, assumeRolePolicyDoc) {
  const params = {
    RoleName: roleName,
    AssumeRolePolicyDocument: JSON.stringify(assumeRolePolicyDoc, null, 4),
  };

  return iam.createRole(params).promise()
  .then(data => data.Role);
}

function getAttachedPoliciesByRole(RoleName) {
  const params = { RoleName: RoleName };

  return iam.listAttachedRolePolicies(params).promise()
  .then(data => data.AttachedPolicies);
}

function getRole(roleName) {
  const params = {
    RoleName: roleName
  };

  return iam.getRole(params).promise()
  .then(data => {
    const role = data.Role;
    role.AssumeRolePolicyDocument = JSON.parse(decodeURIComponent(role.AssumeRolePolicyDocument));
    return role;
  })
  .catch(err => {
    if (err.code === 'NoSuchEntity') return null;
    throw err;
  });
}

function getInstanceProfile(roleName) {
  const params = { InstanceProfileName: roleName };
  
  return iam.getInstanceProfile(params).promise()
  .then(data => data.InstanceProfile)
  .catch(err => {
    if (err.code === 'NoSuchEntity') return null;
    throw err;
  });
}

function isEc2Role(role) {
  return role.AssumeRolePolicyDocument.Statement[0].Principal.Service === "ec2.amazonaws.com";
}

function readRoleFile(filePath, varSet) {
  return FileUtil.readFilePromise(filePath)
  .then(text => VarsetUtil.parseJSON(text, varSet) );
}

module.exports = {
	createRole,
  getAttachedPoliciesByRole,
  getRole,
  getInstanceProfile,
  isEc2Role,
  readRoleFile,
}
