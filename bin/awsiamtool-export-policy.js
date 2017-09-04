#!/usr/bin/env node

const program = require('commander');

program
  .arguments('<outdir> <pattern>')
  .parse(process.argv);

const args = program.args;
if (args.length !== 2) {
  console.error('output directory and name pattern required');
  process.exit(1);
}

const outdir = args[0];
const pattern = args[1];

const main = require('../lib/export-policy');
main(outdir, pattern);
