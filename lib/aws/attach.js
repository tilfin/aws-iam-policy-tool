'use strict';

const iam = require('./iam');


function diffAttachedPolicies(roleName, newPolicies) {
  const params = {
    RoleName: roleName,
    MaxItems: 200
  };

  return iam.listAttachedRolePolicies(params).promise()
  .then(data => {
    const unchangedPolicies = [];
    const detachingPolicies = [];

    data.AttachedPolicies.forEach(policy => {
      if (containPolicy(newPolicies, policy)) {
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
      if (!containPolicy(unchangedPolicies, policy)) {
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

function containPolicy(target, expected) {
  for (let item of target) {
    if (item.PolicyArn === expected.PolicyArn) return true;
  }
  return false;
}

module.exports = {
  containPolicy,
  diffAttachedPolicies,
}
