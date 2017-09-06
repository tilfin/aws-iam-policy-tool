/**
 * import IAM roles from JSON files
 */
'use strict';

const path = require('path');
const iam = require('./aws/iam');
const promisedLife = require('promised-lifestream');
const FileUtil = require('./utils/file');
const { ArrayReader, promisedStream } = require('./utils/stream');
const { ConsoleResultWriter, JSONResultWriter } = require('./utils/result_writer');
const Status = require('./utils/status_code')(true);
const attach = require('./aws/attach');
const iamRole = require('./aws/role');


function onlyPolicyName(policyArn) {
  const a = policyArn.split('/');
  a.shift();
  return a.join('/');
}

function createRole(entry) {
  const roleName = entry.Role.RoleName;
  const arpdoc = entry.Role.AssumeRolePolicyDocument;

  return iamRole.createRole(roleName, arpdoc)
  .then(role => {
    console.log(`${Status.OK} Created Role: ${role.RoleName}`);
    return entry.Role;
  })
  .catch(err => {
    if (err.code === 'EntityAlreadyExists') {
      console.log(`${Status.Skip} Role: ${roleName} already exists.`);
      return null;
    }
    console.log(`${Status.NG} Failed to create Role: ${roleName}`);
    throw err;
  });
}

function createInstanceProfile(roleName) {
  const params = {
    InstanceProfileName: roleName
  };

  return iam.createInstanceProfile(params).promise()
  .then(data => {
    console.log(`${Status.OK} Created InstanceProfile: ${roleName}`);
    return data.InstanceProfile;
  })
  .catch(err => {
    if (err.code === 'EntityAlreadyExists') {
      console.log(Status.Skip, err.message);
      return null;
    }
    console.log(`${Status.NG} Failed to create InstanceProfile: ${roleName}`);
    throw err;
  });
}

function addRoleToInstanceProfile(profileName, roleName) {
  const params = {
    InstanceProfileName: profileName,
    RoleName: roleName
  };

  return iam.addRoleToInstanceProfile(params).promise()
  .then(data => {
    console.log(`${Status.OK} Added InstanceProfile: ${profileName} to RoleName: ${roleName}`);
  })
  .catch(err => {
    if (err.code === 'LimitExceeded') {
      console.log(Status.Skip, err.message);
      return;
    }
    throw err;
  });
}

function attachRolePolicy(params) {
  const policyName = onlyPolicyName(params.PolicyArn);

  return iam.attachRolePolicy(params).promise()
  .then(data => `${Status.OK} Attached ${policyName} on ${params.RoleName}\n`)
  .catch(err => {
    if (err.code === 'NoSuchEntity') {
      return `${Status.NG} Policy ${policyName} does not exist\n`;
    }
    throw err;
  });
}

function detachRolePolicy(params) {
  const policyName = onlyPolicyName(params.PolicyArn);

  return iam.detachRolePolicy(params).promise()
  .then(data => `${Status.OK} Detached ${policyName} on ${params.RoleName}\n`);
}

function getRolePolicies(role) {
  const roleName = role.Role.RoleName;
  const policyList = role.AttachedPolicies.map(item => {
    return {
      RoleName: roleName,
      PolicyArn: item.PolicyArn,
    };
  });

  return attach.diffAttachedPolicies(roleName, policyList);
}

function createRoleAndAttachPolicies(role) {
  const roleName = role.Role.RoleName;

  return createRole(role)
  .then(createdRole => {
    if (!createdRole) return; // already exists
    if (!iamRole.isEc2Role(createdRole)) return;

    return createInstanceProfile(roleName)
    .then(result => {
      if (result !== null) {
        return addRoleToInstanceProfile(roleName, roleName);
      }
    });
  })
  .then(() => getRolePolicies(role))
  .then(result => {
    return Promise.all([].concat(
      result.attaching.map(entry => attachRolePolicy(entry)),
      result.detaching.map(entry => detachRolePolicy(entry)),
      result.unchanged.map(entry => {
        const policyName = onlyPolicyName(entry.PolicyArn);
        return `${Status.Skip} Policy: ${policyName} is already attached on Role: ${entry.RoleName}\n`;
      })
    ));
  });
}


module.exports = function(inDir, varSet, opts) {
  const writer = opts.json ? new JSONResultWriter()
                           : new ConsoleResultWriter({ plain: opts.plain });

  return FileUtil.listJsonFilesPromise(inDir)
  .then(fileList => {
    return promisedLife([
      new ArrayReader(fileList),
      promisedStream(file => iamRole.readRoleFile(file, varSet) ),
      promisedStream(policy => createRoleAndAttachPolicies(policy, varSet) ),
      writer
    ])
  })
  .catch(err => {
    console.error(err.stack);
    return false;
  });
}
