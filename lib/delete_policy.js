/**
 * delete matched IAM polices
 */
'use strict';

const prompt = require('./utils/prompt');
const iam = require('./aws/iam');
const StreamUtils = require('@tilfin/stream-utils');
const promisedLife = require('promised-lifestream');
const ListPolicyStream = require('./aws/list_stream').ListPolicyStream;
const { filterStream, promisedStream } = require('./utils/stream');
const Result = require('./utils/result');
const { createWriter } = require('./utils/result_writer');


function deletePolicy(policy) {
  const params = {
    PolicyArn: policy.Arn
  };

  return iam.deletePolicy(params).promise()
  .then(() => Result.OK('Deleted %1', policy.PolicyName))
  .catch(err => {
    if (err.code === 'DeleteConflict') {
      return Result.NG('Failed to delete %1 attached on some roles', policy.PolicyName);
    }
    throw err;
  });
}


module.exports = function(nameMatcher, opts) {
  opts = opts || {};

  return promisedLife([
    new ListPolicyStream({
      OnlyAttached: false,
      Scope: 'Local'
    }),
    filterStream(policy => {
      if (policy.PolicyName.match(nameMatcher)) {
        console.info(policy.Arn);
        return true;
      }
      return false;
    })
  ], { needResult: true })
  .then(policies => {
    if (policies.length === 0) {
      console.info('Not found policies');
      return;
    }

    return prompt('Do you really delete above policies? yes|no> ')
    .then(answer => {
      if (answer === 'yes') {
        return policies;
      } else {
        console.info('Abort.');
      }
    });
  })
  .then(policies => {
    if (!policies) return false;

    return promisedLife([
      StreamUtils.readArray(policies),
      promisedStream(policy => deletePolicy(policy) ),
      createWriter(opts)
    ]);
  })
  .catch(err => {
    console.error(err.stack)
    return false;
  });
}
