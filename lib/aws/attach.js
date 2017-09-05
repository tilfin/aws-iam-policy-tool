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
        unchangedPolicies.push({
          RoleName: roleName,
          PolicyArn: policy.PolicyArn,
        });
      } else {
        detachingPolicies.push({
          RoleName: roleName,
          PolicyArn: policy.PolicyArn,
        });
      }
    });

    const attachingPolicies = [];
    newPolicies.forEach(policy => {
      if (!containPolicyArn(unchangedPolicies, policy)) {
        attachingPolicies.push({
          RoleName: roleName,
          PolicyArn: policy.PolicyArn,
        });
      }
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
