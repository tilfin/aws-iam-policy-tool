'use strict';

const iam = require('./iam');


exports.diffAttachedPolicies = function (roleName, newPolicies) {
  const params = {
    RoleName: roleName,
    MaxItems: 200
  };

  return iam.listAttachedRolePolicies(params).promise()
  .then(data => {
    const unchangedPolicies = [];
    const detachingPolicies = [];

    data.AttachedPolicies.forEach(policy => {
      if (containPolicyArn(newPolicies, policy)) {
        unchangedPolicies.push(policy);
      } else {
        detachingPolicies.push(policy);
      }
    });

    const attachingPolicies = newPolicies.filter(policy => {
      return !containPolicyArn(unchangedPolicies, policy)
    });

    return {
      attaching: attachingPolicies,
      detaching: detachingPolicies,
      unchanged: unchangedPolicies
    };
  });
}

function containPolicyArn(target, src) {
  for (let item of target) {
    if (item.PolicyArn === src.PolicyArn) return true;
  }
  return false;
}
