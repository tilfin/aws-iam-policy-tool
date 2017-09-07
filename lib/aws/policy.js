'use strict';

const path = require('path');
const iam = require('./iam');
const FileUtil = require('../utils/file');
const VarsetUtil = require('../utils/varset');

function getPolicyDefaultVersion(policy) {
  const params = {
    PolicyArn: policy.Arn,
    VersionId: policy.DefaultVersionId
  };

  return iam.getPolicyVersion(params).promise()
  .then(data => {
    const result = data.PolicyVersion;
    return {
      name: policy.PolicyName,
      arn: params.PolicyArn,
      document: result.Document,
      versionId: result.VersionId,
      isDefaultVersion: result.IsDefaultVersion,
      createDate: result.CreateDate,
    }
  });
}

function getPolicyDefaultWithVersionInfoByArn(arn) {
  return listPolicyVersions(arn)
  .then(versions => {
    if (versions.length === 0) return null;

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
    });
    return { defaultId, oldestId, count: versions.length };
  })
  .then(result => {
    const policy = { Arn: arn, DefaultVersionId: result.defaultId };
    return Promise.all([getPolicyDefaultVersion(policy), result]);
  })
  .catch(err => {
    if (err.code === 'NoSuchEntity') return null;
    throw err;
  });
}

function listPolicyVersions(arn) {
  const params = {
    PolicyArn: arn,
    MaxItems: 10,
  };

  return iam.listPolicyVersions(params).promise()
  .then(data => data.Versions);
}

function createPolicy(name, document) {
  const params = {
    PolicyName: name,
    PolicyDocument: JSON.stringify(document),
  };

  return iam.createPolicy(params).promise();
}

function createPolicyDefaultVersion(arn, document) {
  const params = {
    PolicyArn: arn,
    PolicyDocument: JSON.stringify(document),
    SetAsDefault: true,
  };

  return iam.createPolicyVersion(params).promise();
}

function deletePolicyVersion(arn, versionId) {
  const params = {
    PolicyArn: arn,
    VersionId: versionId,
  };

  return iam.deletePolicyVersion(params).promise();
}

let _policyArnPrefix = null;

function getPolicyArnPrefix() {
  if (_policyArnPrefix) {
  	return Promise.resolve(_policyArnPrefix);
  }

  const params = {
    Scope: 'Local',
    MaxItems: 1,
  };

  return iam.listPolicies(params).promise()
  .then(data => {
  	_policyArnPrefix = data.Policies[0].Arn.split('/')[0];
  	return _policyArnPrefix;
  });
}

function readPolicyFile(filePath, varSet) {
  return FileUtil.readFile(filePath)
  .then(text => {
    const name = path.basename(filePath, '.json');
    return {
      name: VarsetUtil.substitute(name, varSet),
      document: VarsetUtil.parseJSON(text, varSet),
    }
  });
}

module.exports = {
  getPolicyDefaultVersion,
  getPolicyDefaultWithVersionInfoByArn,
  listPolicyVersions,
  createPolicy,
  createPolicyDefaultVersion,
  deletePolicyVersion,
  getPolicyArnPrefix,
  readPolicyFile,
}
