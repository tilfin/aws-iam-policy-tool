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


async function deletePolicy(policy) {
  const params = {
    PolicyArn: policy.Arn
  }

  try {
    await iam.deletePolicy(params).promise()
    Result.OK('Deleted %1', policy.PolicyName)
  } catch(err) {
    if (err.code === 'DeleteConflict') {
      return Result.NG('Failed to delete %1 attached on some roles', policy.PolicyName)
    }
    throw err
  }
}


module.exports = async function(nameMatcher, opts = {}) {
  try {
    const policies = await promisedLife([
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

    if (policies.length === 0) {
      console.info('Not found policies')
      return
    }

    const answer = await prompt('Do you really delete above policies? yes|no> ')
    if (answer !== 'yes') {
      console.info('Abort.')
      return
    }

    return promisedLife([
      StreamUtils.readArray(policies),
      promisedStream(policy => deletePolicy(policy) ),
      createWriter(opts)
    ]);
  } catch(err) {
    console.error(err.stack)
    return false
  }
}
