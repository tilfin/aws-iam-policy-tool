'use strict';

const path = require('path');
const iam = require('./iam');
const FileUtil = require('../utils/file');
const VarsetUtil = require('../utils/varset');

async function getPolicyDefaultVersion(policy) {
  const params = {
    PolicyArn: policy.Arn,
    VersionId: policy.DefaultVersionId
  }

  const data = await iam.getPolicyVersion(params).promise()
  const result = data.PolicyVersion
  return {
    name: policy.PolicyName,
    arn: params.PolicyArn,
    document: result.Document,
    versionId: result.VersionId,
    isDefaultVersion: result.IsDefaultVersion,
    createDate: result.CreateDate,
  }
}

async function getPolicyDefaultWithVersionInfoByArn(arn) {
  const versions = await listPolicyVersions(arn)
  if (versions.length === 0) return null

  let defaultId, oldestId;
  let createDate = new Date('2099-12-31T00:00:00.000Z');
  versions.forEach(ver => {
    if (ver.IsDefaultVersion) {
      defaultId = ver.VersionId;
    } else {
      const date = new Date(ver.CreateDate);
      if (date < createDate) {
        createDate = date;
        oldestId = ver.VersionId;
      }
    }
  })
  const result = { defaultId, oldestId, count: versions.length }
  const policy = { Arn: arn, DefaultVersionId: result.defaultId }
  return Promise.all([getPolicyDefaultVersion(policy), result])
}

async function listPolicyVersions(arn) {
  const params = {
    PolicyArn: arn,
    MaxItems: 10,
  }

  const data = await iam.listPolicyVersions(params).promise()
  return data.Versions
}

async function createPolicy(name, doc, indent) {
  const params = {
    PolicyName: name,
    PolicyDocument: convertDocToJSON(doc, indent),
  }

  return iam.createPolicy(params).promise()
}

async function createPolicyDefaultVersion(arn, doc, indent) {
  const params = {
    PolicyArn: arn,
    PolicyDocument: convertDocToJSON(doc, indent),
    SetAsDefault: true,
  }

  return iam.createPolicyVersion(params).promise()
}

async function deletePolicyVersion(arn, versionId) {
  const params = {
    PolicyArn: arn,
    VersionId: versionId,
  }

  return iam.deletePolicyVersion(params).promise()
}

let _policyArnPrefix = null;

async function getPolicyArnPrefix() {
  if (_policyArnPrefix) {
  	return Promise.resolve(_policyArnPrefix)
  }

  const params = {
    Scope: 'Local',
    MaxItems: 1,
  }

  const data = await iam.listPolicies(params).promise()
  _policyArnPrefix = data.Policies[0].Arn.split('/')[0]
  return _policyArnPrefix
}

async function readPolicyFile(filePath, varSet) {
  try {
    const name = path.basename(filePath, '.json')
    const text = await FileUtil.readFile(filePath)
    return {
      name: VarsetUtil.substitute(name, varSet),
      document: VarsetUtil.parseJSON(text, varSet),
    }
  } catch(err) {
    console.error(`Failed to read ${name}`)
    throw err
  }
}

function convertDocToJSON(doc, indent) {
  if (typeof doc === 'string') return doc;
  return JSON.stringify(doc, null, indent || 4);
}

module.exports = {
  convertDocToJSON,
  getPolicyDefaultVersion,
  getPolicyDefaultWithVersionInfoByArn,
  listPolicyVersions,
  createPolicy,
  createPolicyDefaultVersion,
  deletePolicyVersion,
  getPolicyArnPrefix,
  readPolicyFile,
}
