'use strict';

const iam = require('./iam');


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
    PolicyDocument: document,
    PolicyName: name
  };

  return iam.createPolicy(params).promise();
}

function createPolicyDefaultVersion(arn, document) {
  const params = {
    PolicyArn: arn,
    PolicyDocument: document,
    SetAsDefault: true
  };

  return iam.createPolicyVersion(params).promise();
}

module.exports = {
  getPolicy,
  getPolicyDefaultVersion,
  getPolicyDefaultVersionByArn,
  createPolicy,
  createPolicyDefaultVersion,
}
