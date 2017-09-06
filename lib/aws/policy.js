'use strict';

const path = require('path');
const iam = require('./iam');
const FileUtil = require('../utils/file');
const VarsetUtil = require('../utils/varset');

function getPolicy(arn) {
  const params = { PolicyArn: arn };
  return iam.getPolicy(params).promise()
  .then(result => result.Policy);
}

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

function getPolicyDefaultVersionByArn(arn) {
  return getPolicy(arn)
  .then(policy => getPolicyDefaultVersion(policy));
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
  return FileUtil.readFilePromise(filePath)
  .then(text => {
    const name = path.basename(filePath, '.json');
    return {
      name: VarsetUtil.substitute(name, varSet),
      document: VarsetUtil.parseJSON(text, varSet),
    }
  });
}

module.exports = {
  getPolicy,
  getPolicyDefaultVersion,
  getPolicyDefaultVersionByArn,
  createPolicy,
  createPolicyDefaultVersion,
  getPolicyArnPrefix,
  readPolicyFile,
}
