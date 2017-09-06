#!/usr/bin/env node

const fs = require('fs');
const program = require('commander');

program
  .arguments('<outdir> <pattern>')
  .option('-j, --json', 'output result as JSON text')
  .option('-p, --plain', 'output result as plain text')
  .parse(process.argv);

const args = program.args;
if (args.length < 1) {
  console.error('output directory required');
  process.exit(1);
}

const outdir = args[0];
const pattern = args.length > 1 ? new RegExp(args[1]) : null;

const main = require('../lib/export_role');

try { fs.mkdirSync(outdir); } catch(err) {}
main(outdir, pattern, { json: program.json, plain: program.plain });
