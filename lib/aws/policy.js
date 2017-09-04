'use strict';

const iam = require('./iam');


function getPolicy(arn) {
  const params = { PolicyArn: arn };
  return iam.getPolicy(params).promise();
}
exports.getPolicy = getPolicy;

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
exports.getPolicyDefaultVersion = getPolicyDefaultVersion;

exports.getPolicyDefaultVersionByArn = function(arn) {
  return getPolicy(arn)
  .then(policy => getPolicyDefaultVersion(policy));
}

exports.createPolicy = function(name, document) {
  const params = {
    PolicyDocument: document,
    PolicyName: name
  };

  return iam.createPolicy(params).promise();
}

exports.createPolicyVersion = function(name, document) {
  const params = {
    PolicyDocument: document,
    PolicyName: name,
    SetAsDefault: true
  };

  return iam.createPolicyVersion(params).promise()
  .then(data => `${Status.OK} Updated ${policy.name}\n`);
}
