'use strict';

const path = require('path');
const iam = require('./iam');
const FileUtil = require('../utils/file');
const VarsetUtil = require('../utils/varset');

async function createRole(role) {
  const params = Object.assign({}, role)
  params.AssumeRolePolicyDocument = JSON.stringify(params.AssumeRolePolicyDocument, null, 4)
  const data = await iam.createRole(params).promise()
  return data.Role
}

async function getAttachedPoliciesByRole(roleName) {
  const params = { RoleName: roleName }
  const data = await iam.listAttachedRolePolicies(params).promise()
  return data.AttachedPolicies
}

async function getRole(roleName) {
  try {
    const params = { RoleName: roleName }
    const data = await iam.getRole(params).promise()
    const role = data.Role
    role.AssumeRolePolicyDocument = JSON.parse(decodeURIComponent(role.AssumeRolePolicyDocument))
    return role
  } catch(err) {
    if (err.code === 'NoSuchEntity') return null
    throw err
  }
}

async function getInstanceProfile(roleName) {
  try {
    const params = { InstanceProfileName: roleName }
    const data = await iam.getInstanceProfile(params).promise()
    return data.InstanceProfile
  } catch(err) {
    if (err.code === 'NoSuchEntity') return null
    throw err
  }
}

function isEc2Role(role) {
  return role.AssumeRolePolicyDocument.Statement[0].Principal.Service === "ec2.amazonaws.com";
}

async function readRoleFile(filePath, varSet) {
  try {
    const name = path.basename(filePath, '.json')
    const text = await FileUtil.readFile(filePath)
    return {
      name,
      document: VarsetUtil.parseJSON(text, varSet),
    }
  } catch(err) {
    console.error(`Failed to read ${name}`)
    throw err
  }
}

module.exports = {
	createRole,
  getAttachedPoliciesByRole,
  getRole,
  getInstanceProfile,
  isEc2Role,
  readRoleFile,
}
