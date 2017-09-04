'use strict';

const iam = require('./iam');


function getPolicy(arn) {
  const params = { PolicyArn: arn };
  return iam.getPolicy(params).promise();
}

function getPolicyDefaultVersion(policy) {
  const params = {
    PolicyArn: policy.Arn,
    VersionId: policy.DefaultVersionId
  };

  return iam.getPolicyVersion(params).promise()
  .then(data => {
    return {
      arn: params.PolicyArn,
      document: data.Document,
      versionId: data.VersionId,
      isDefaultVersion: data.IsDefaultVersion,
      createDate: data.CreateDate,
    }
  });
}

function getPolicyDefaultVersionByArn(arn) {
  return getPolicy(arn)
  .then(policy => getPolicyDefaultVersion(policy));
}

function createPolicy(name, document) {
  const params = {
    PolicyDocument: document,
    PolicyName: name
  };

  return iam.createPolicy(params).promise();
}

function createPolicyVersion(name, document) {
  const params = {
    PolicyDocument: document,
    PolicyName: name,
    SetAsDefault: true
  };

  return iam.createPolicyVersion(params).promise();
}

module.exports = {
  getPolicy,
  getPolicyDefaultVersion,
  getPolicyDefaultVersionByArn,
  createPolicy,
  createPolicyVersion
}
