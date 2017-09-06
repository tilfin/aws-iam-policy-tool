#!/usr/bin/env node

const program = require('commander');

program
  .arguments('<pattern>')
  .parse(process.argv);

const args = program.args;
if (args.length !== 1) {
  console.error('name pattern required');
  process.exit(1);
}

const pattern = new RegExp(args[0]);

const main = require('../lib/delete_policy');
main(pattern);
