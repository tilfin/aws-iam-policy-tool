/**
 * delete matched IAM polices
 */
'use strict';

const readline = require('readline');
const through2 = require('through2');
const iam = require('./aws/iam');
const promisedLife = require('promised-lifestream');
const ListPolicyStream = require('./aws/list_stream').ListPolicyStream;
const { ArrayReader, promisedStream } = require('./utils/stream');
const Status = require('./utils/status_code')(true);


function deletePolicyPromise(policyArn) {
  const params = { PolicyArn: policyArn };
  return iam.deletePolicy(params).promise()
  .then(() => `${Status.OK} Deleted ${policyArn}\n`)
  .catch(err => `${Status.NG} Failed to delete ${policyArn}\n`);
}


module.exports = function(nameMatcher) {
  promisedLife([
    new ListPolicyStream({
      OnlyAttached: false,
      Scope: 'Local'
    }),
    through2.obj(function (policy, _, callback) {
      if (policy.PolicyName.match(nameMatcher)) {
        console.log(policy.Arn);
        this.push(policy.Arn);
      }
      callback();
    })
  ], { needResult: true })
  .then(policies => {
    if (policies.length === 0) return [];

    return new Promise((resolve, reject) => {
      const rl = readline.createInterface(process.stdin, process.stdout);
      rl.setPrompt('Do you really delete above policies? yes|no> ');
      rl.prompt();
      rl.on('line', (line) => {
        if (line.trim() === 'yes') {
          resolve(policies);
        } else {
          reject('Abort.');
        }
        rl.close();
      });
    });
  })
  .then(policies => {
    if (policies.length === 0) {
      console.log('Not found policies');
      return;
    }

    return promisedLife([
      new ArrayReader(policies),
      promisedStream(policy => deletePolicyPromise(policy) ),
      process.stdout
    ]);
  })
  .catch(err => {
    console.error(err.stack)
  });
}
