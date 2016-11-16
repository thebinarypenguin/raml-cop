#!/usr/bin/env node

"use strict";

const Bluebird  = require('bluebird');
const colors    = require('colors');
const commander = require('commander');
const raml      = require('raml-1-parser');
const pkg       = require('../package.json');

const outputSuccess = function (name) {
  let src = (name === '-') ? 'STDIN' : name;
  let msg = colors.green('VALID');

  console.log(`[${src}] ${msg}`);
};

const outputFailure = function (name, err) {
  
  if (err.parserErrors) {

    err.parserErrors.forEach((e) => {
      let src = (name === '-') ? 'STDIN' : name;
      let line = e.range.start.line;
      let column = e.range.start.column;
      let msg = colors.red(e.message);

      console.log(`[${src}:${line}:${column}] ${msg}`);
    });

  } else {

    let src = (name === '-') ? 'STDIN' : name;
    let msg = colors.red(err.message);

    console.log(`[${src}] ${msg}`);
  }
};

// Parse command line arguments
commander
  .version(pkg.version)
  .usage('[options] <file ...>')
  .option('    --no-color', 'disable colored output')
  .parse(process.argv);

// If there are no inputs to process, then display the usage message
if (commander.args.length === 0) {
  commander.help();
}

// keep track of error count for return code
let errors = 0;

// Process each input sequentially
Bluebird
  .resolve(commander.args)
  .each((input) => {

    return Bluebird
      .resolve(raml.loadRAML(input, [], { rejectOnErrors: true }))
      .then(() => {
        outputSuccess(input);
      })
      .catch((err) => {
        errors++;
        outputFailure(input, err);
      });
  })
  .finally(() => {
    if (errors > 0) {
      process.exit(1);
    }
  });
