/**
 * delete-policy.js
 *
 * delete matched IAM polices
 *
 * Usage) node delete-policy.js <policy name matcher regexp>
 *
 * Example: node delete-policy.js "^mybrand\-"
 */
'use strict';

const readline = require('readline');
const through2 = require('through2');
const AWS = require('aws-sdk');
const iam = new AWS.IAM();
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


function main(nameMatcher) {
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
    console.log(err.stack)
  });
}


if (process.argv.length !== 3) {
  console.log('Usage) node delete-policy.js <policy name matcher regexp>');
  process.exit(1);
} else {
  main(new RegExp(process.argv[2]));
}
