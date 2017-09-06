#!/usr/bin/env node

const program = require('commander');

program
  .arguments('<dir>')
  .option('-i, --account-id [aws account id]', 'set variable ACCOUNT_ID')
  .option('-e, --env [environment]', 'set variable ENV')
  .option('-f, --overwrite', 'overwrite an role if it exists')
  .option('-j, --json', 'output result as JSON text')
  .option('-p, --plain', 'output result as plain text')
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

const opts = {
  overwrite: program.overwrite,
  json: program.json,
  plain: program.plain
};

const main = require('../lib/import_policy');
main(dir, varSet, opts);
