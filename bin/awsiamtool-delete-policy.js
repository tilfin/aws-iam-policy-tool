#!/usr/bin/env node

const program = require('commander');

program
  .arguments('<pattern>')
  .option('-j, --json', 'output result as JSON text')
  .option('-p, --plain', 'output result as plain text')
  .parse(process.argv);

const args = program.args;
if (args.length !== 1) {
  console.error('name pattern required');
  process.exit(1);
}

const pattern = new RegExp(args[0]);

const opts = {
  json: program.json,
  plain: program.plain || program.json,
};

const { main } = require('../lib/delete_policy');
main(pattern, opts);
