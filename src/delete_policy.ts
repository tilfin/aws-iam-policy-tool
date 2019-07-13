/**
 * delete matched IAM polices
 */
const StreamUtils = require('@tilfin/stream-utils')
const promisedLife = require('promised-lifestream')

import prompt from './utils/prompt'
import { IAM } from 'aws-sdk'
import { ListPolicyStream } from './aws/list_stream'
import { filterStream, promisedStream } from './utils/stream'
import { createWriter } from './utils/result_writer'
import { PolicyCleaner } from './logic/policy_cleaner'

export async function main(nameMatcher: any, opts: any = {}) {
  const needConfirm = !opts.noconfirm

  try {
    const policies = await promisedLife(
      [
        new ListPolicyStream({
          OnlyAttached: false,
          Scope: 'Local',
        }),
        filterStream((policy: IAM.Policy) => {
          if (policy.PolicyName!.match(nameMatcher)) {
            if (needConfirm) console.info(policy.Arn)
            return true
          }
          return false
        }),
      ],
      { needResult: true }
    )

    if (policies.length === 0) {
      console.info('Not found policies')
      return
    }

    if (needConfirm) {
      const answer = await prompt(
        'Do you really delete above policies? yes|no> '
      )
      if (answer !== 'yes') {
        console.info('Abort.')
        return
      }
    }

    const policyCleaner = new PolicyCleaner()

    return promisedLife([
      StreamUtils.readArray(policies),
      promisedStream((policy: IAM.Policy) => policyCleaner.delete(policy)),
      createWriter(opts),
    ])
  } catch (err) {
    console.error(err.stack)
    return false
  }
}
