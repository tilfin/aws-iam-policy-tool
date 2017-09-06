/**
 * delete matched IAM polices
 */
'use strict';

const prompt = require('./utils/prompt');
const through2 = require('through2');
const iam = require('./aws/iam');
const promisedLife = require('promised-lifestream');
const ListPolicyStream = require('./aws/list_stream').ListPolicyStream;
const { ArrayReader, promisedStream } = require('./utils/stream');
const Result = require('./utils/result');
const { ConsoleResultWriter, JSONResultWriter } = require('./utils/result_writer');



function deletePolicyPromise(policyArn) {
  const params = { PolicyArn: policyArn };
  return iam.deletePolicy(params).promise()
  .then(() => Result.OK('Deleted %1', policyArn))
  .catch(err => {
    if (err.code === 'DeleteConflict') {
      return Result.NG('Failed to delete %1 attached on some roles', policyArn);
    }
    throw err;
  });
}


module.exports = function(nameMatcher, opts) {
  const writer = opts.json ? new JSONResultWriter()
                           : new ConsoleResultWriter({ plain: opts.plain });

  return promisedLife([
    new ListPolicyStream({
      OnlyAttached: false,
      Scope: 'Local'
    }),
    through2.obj(function (policy, _, callback) {
      if (policy.PolicyName.match(nameMatcher)) {
        console.info(policy.Arn);
        this.push(policy.Arn);
      }
      callback();
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
      new ArrayReader(policies),
      promisedStream(policy => deletePolicyPromise(policy) ),
      writer
    ]);
  })
  .catch(err => {
    console.error(err.stack)
    return false;
  });
}
