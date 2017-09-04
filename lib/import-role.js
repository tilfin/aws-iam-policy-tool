/**
 * import IAM roles from JSON files
 */
'use strict';

const path = require('path');
const iam = require('./aws/iam');
const promisedLife = require('promised-lifestream');
const FileUtil = require('./utils/file');
const StringUtil = require('./utils/string');
const { ArrayReader, promisedStream } = require('./utils/stream');
const Status = require('./utils/status_code')(true);

function onlyPolicyName(policyArn) {
  const a = policyArn.split('/');
  a.shift();
  return a.join('/');
}

function readRoleFile(filePath) {
  return FileUtil.readFilePromise(filePath)
  .then(text => JSON.parse(text) );
}

function createRole(role, varSet) {
  const roleName = StringUtil.expandVars(role.Role.RoleName, varSet);
  const assumeRolePolicyDoc = StringUtil.expandVars(JSON.stringify(role.Role.AssumeRolePolicyDocument, null, 4), varSet);

  const params = {
    RoleName: roleName,
    AssumeRolePolicyDocument: assumeRolePolicyDoc
  };

  return iam.createRole(params).promise()
  .then(data => {
    console.log(`${Status.OK} Created Role: ${roleName}`);
    return role;
  })
  .catch(err => {
    if (err.code === 'EntityAlreadyExists') {
      console.log(Status.Skip, err.message);
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

function getRolePolicies(role, varSet) {
  const roleName = StringUtil.expandVars(role.Role.RoleName, varSet);

  const policyList = role.AttachedPolicies.map(item => {
    return {
      RoleName: roleName,
      PolicyArn: StringUtil.expandVars(item.PolicyArn, varSet)
    }
  });

  return policyList;
}


function isEc2Role(role) {
  return role.Role.AssumeRolePolicyDocument.Statement[0].Principal.Service === "ec2.amazonaws.com";
}


function createRoleAndAttachPolicies(role, varSet) {
  const roleName = StringUtil.expandVars(role.Role.RoleName, varSet);
  return createRole(role, varSet)
  .then(() => {
    if (!isEc2Role(role)) return;

    return createInstanceProfile(roleName)
    .then(result => {
      if (result !== null) {
        return addRoleToInstanceProfile(roleName, roleName);
      }
    });
  })
  .then(() => {
    return getRolePolicies(role, varSet);
  });
}


module.exports = function(inDir, varSet) {
  FileUtil.listJsonFilesPromise(inDir)
  .then(fileList => {
    return promisedLife([
      new ArrayReader(fileList),
      promisedStream(file => readRoleFile(file) ),
      promisedStream(policy => createRoleAndAttachPolicies(policy, varSet) ),
      promisedStream(item => attachRolePolicy(item) ),
      process.stdout
    ])
  })
  .catch(err => {
    console.error(err.stack)
  });
}
