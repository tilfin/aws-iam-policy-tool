#!/usr/bin/env node

const program = require('commander');

program
  .arguments('<dir>')
  .option('-i, --account-id [aws account id]', 'set variable ACCOUNT_ID')
  .option('-e, --env [environment]', 'set variable ENV')
  .parse(process.argv);

const args = program.args;
if (!args.length) {
  console.error('policy directory required');
  process.exit(1);
}

const dir = args[0];
const varSet = {
  ACCOUNT_ID: program.accountId || process.env.ACCOUNT_ID || 'ACCOUNT_ID',
  ENV: program.env || process.env.ENV || 'ENV',
};

const main = require('../lib/validate_role');
main(dir, varSet)
.then(success => {
  if (!success) {
    console.error('Detected invalid role');
    process.exitCode = 1;
  }
})
.catch(err => {
  console.error(err.stack)
  process.exitCode = 2;
});
