'use strict';

const iam = require('../aws/iam');
const iamRole = require('../aws/role');
const attach = require('../aws/attach');
const Result = require('../utils/result');


class RoleRegisterer {
  constructor(opts) {
    const opts_ = opts || {};
    this._overwrite = opts_['overwrite'] || false;
  }

  register(name, document) {
    try {
      const results = [];
      const roleName = document.Role.RoleName;

      return this._createRole(document, results)
      .then(createdRole => {
        if (!createdRole) return; // already exists
        if (!iamRole.isEc2Role(document.Role)) return;

        return this._createInstanceProfile(roleName, results)
        .then(result => {
          if (result !== null) {
            return this._addRoleToInstanceProfile(roleName, roleName, results);
          }
        });
      })
      .then(() => this._getRolePolicies(document))
      .then(result => {
        return Promise.all([].concat(
          result.attaching.map(entry => this._attachRolePolicy(entry)),
          result.detaching.map(entry => this._detachRolePolicy(entry)),
          result.unchanged.map(entry => {
            const policyName = onlyPolicyName(entry.PolicyArn);
            return Result.Skip('Policy: %1 is already attached on Role: %2', [policyName, entry.RoleName]);
          })
        ));
      })
      .then(attachResults => {
        return results.concat(attachResults);
      });
    } catch(err) {
      const r = Result.NG('Failed to create Role: %1 invalid JSON format', name);
      return Promise.resolve(r);
    }
  }

  _createRole(entry, results) {
    const roleName = entry.Role.RoleName;

    return iamRole.createRole(entry.Role)
    .then(role => {
      results.push(Result.OK('Created Role: %1', roleName));
      return entry.Role;
    })
    .catch(err => {
      if (err.code === 'EntityAlreadyExists') {
        results.push(Result.Skip('Role: %1 already exists.', roleName));
        return null;
      } else if (err.code === 'MalformedPolicyDocument') {
        return Result.NG('Failed to create Role: %1 invalid JSON format', name);
      }
      results.push(Result.NG('Failed to create Role: %1', roleName));
      throw err;
    });
  }

  _createInstanceProfile(roleName, results) {
    const params = {
      InstanceProfileName: roleName
    };

    return iam.createInstanceProfile(params).promise()
    .then(data => {
      results.push(Result.OK('Created InstanceProfile: %1', roleName));
      return data.InstanceProfile;
    })
    .catch(err => {
      if (err.code === 'EntityAlreadyExists') {
        results.push(Result.Skip('InstanceProfile: %1 already exists.', roleName));
        return null;
      }
      results.push(Result.NG('Failed to create InstanceProfile: %1', roleName));
      throw err;
    });
  }

  _addRoleToInstanceProfile(profileName, roleName, results) {
    const params = {
      InstanceProfileName: profileName,
      RoleName: roleName
    };

    return iam.addRoleToInstanceProfile(params).promise()
    .then(data => {
      results.push(Result.OK('Added InstanceProfile: %1 to Role: %2', [profileName, roleName]));
    })
    /*.catch(err => {
      if (err.code === 'LimitExceeded') {
        console.log(Status.Skip, err.message);
        return;
      }
      throw err;
    })*/;
  }

  _getRolePolicies(role) {
    const roleName = role.Role.RoleName;
    const policyList = role.AttachedPolicies.map(item => {
      return {
        RoleName: roleName,
        PolicyArn: item.PolicyArn,
      };
    });

    return attach.diffAttachedPolicies(roleName, policyList);
  }

  _attachRolePolicy(params) {
    const policyName = onlyPolicyName(params.PolicyArn);

    return iam.attachRolePolicy(params).promise()
    .then(data => Result.OK('Attached %1 on %2', [policyName, params.RoleName]))
    .catch(err => {
      if (err.code === 'NoSuchEntity') {
        return Result.NG('Could not attach Policy: %1 that does not exist on %2.', [policyName, params.RoleName]);
      }
      throw err;
    });
  }

  _detachRolePolicy(params) {
    const policyName = onlyPolicyName(params.PolicyArn);

    return iam.detachRolePolicy(params).promise()
    .then(data => Result.OK('Detached %1 on %2', [policyName, params.RoleName]));
  }
}

module.exports = RoleRegisterer;

function onlyPolicyName(policyArn) {
  return policyArn.substr(policyArn.indexOf('/') + 1);
}
