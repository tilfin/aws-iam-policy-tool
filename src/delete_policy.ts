/**
 * delete matched IAM polices
 */
const StreamUtils = require('@tilfin/stream-utils')
const promisedLife = require('promised-lifestream')

import prompt from './utils/prompt'
import { IAM } from 'aws-sdk'
import { iam } from './aws/iam'
import { ListPolicyStream } from './aws/list_stream'
import { filterStream, promisedStream } from './utils/stream'
import { OK, NG } from './utils/result'
import { createWriter } from './utils/result_writer'


async function deletePolicy(policy: IAM.Policy) {
  const params: IAM.DeletePolicyRequest = {
    PolicyArn: policy.Arn!
  }

  try {
    await iam.deletePolicy(params).promise()
    OK('Deleted %1', policy.PolicyName!)
  } catch(err) {
    if (err.code === 'DeleteConflict') {
      return NG('Failed to delete %1 attached on some roles', policy.PolicyName!)
    }
    throw err
  }
}


export async function main(nameMatcher: any, opts = {}) {
  try {
    const policies = await promisedLife([
      new ListPolicyStream({
        OnlyAttached: false,
        Scope: 'Local'
      }),
      filterStream((policy: IAM.Policy) => {
        if (policy.PolicyName!.match(nameMatcher)) {
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
      promisedStream((policy: IAM.Policy) => deletePolicy(policy) ),
      createWriter(opts)
    ])
  } catch(err) {
    console.error(err.stack)
    return false
  }
}
