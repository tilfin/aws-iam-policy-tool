'use strict';

const policy = require('../aws/policy');


exports.createOrUpdatePolicy = function(entry, varSet, opts) {
  const overwrite = opts['overwrite'] || false;

  const name = StringUtil.expandVars(entry.name, varSet);
  const doc = StringUtil.expandVars(entry.document, varSet);

  return policy.createPolicy(name, doc)
  .then(data => `${Status.OK} Created ${name}\n`)
  .catch(err => {
    if (err.code === 'EntityAlreadyExists') {
      if (overwrite) {
      	return updatePolicyVersion(name, doc);
      } else {
	    return `${Status.Skip} ${policy.name} already exists.\n`;
	  }
    }
    throw err;
  });
}

function updatePolicyVersion(name, doc) {
  return getPolicyArnPrefix()
  .then(arnPrefix => {
    return policy.getPolicyDefaultVersionByArn(`${arnPrefix}/${name}`)
  })
  .then(currentPolicy => {
    if (doc !== currentPolicy.document) {
      return policy.createPolicyVersion(name, doc);
    } else {
      return `${Status.Skip} ${name} is not changed.\n`;
    }
  })
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
