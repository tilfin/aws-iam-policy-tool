#!/usr/bin/env node

const fs = require('fs');
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
const pattern = new RegExp(args[1]);

const main = require('../lib/export-role');

try { fs.mkdirSync(outdir); } catch(err) {}
main(outdir, pattern);
