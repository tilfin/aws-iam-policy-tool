'use strict';

const path = require('path');
const iam = require('./iam');
const FileUtil = require('../utils/file');
const VarsetUtil = require('../utils/varset');

function createRole(role) {
  const params = Object.assign({}, role);
  params.AssumeRolePolicyDocument = JSON.stringify(params.AssumeRolePolicyDocument, null, 4);
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
  const name = path.basename(filePath, '.json');
  return FileUtil.readFile(filePath)
  .then(text => {
    return {
      name,
      document: VarsetUtil.parseJSON(text, varSet),
    }
  })
  .catch(err => {
    console.error(`Failed to read ${name}`);
    throw err;
  });
}

module.exports = {
	createRole,
  getAttachedPoliciesByRole,
  getRole,
  getInstanceProfile,
  isEc2Role,
  readRoleFile,
}
