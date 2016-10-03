#!/usr/bin/env node

"use strict";

const async     = require('async');
const Bluebird  = require('bluebird');
const colors    = require('colors');
const commander = require('commander');
const fs        = require('fs');
const raml      = require('raml-1-parser');
const pkg       = require('../package.json');

const readInput = function (name) {

  return new Bluebird((resolve, reject) => {

    let allTheChunks = '';
    let inputStream  = (name === '-') ? process.stdin : fs.createReadStream(name);

    inputStream.setEncoding('utf8');

    inputStream.on('error', (err) => {
      return reject(err);
    });

    inputStream.on('end', () => {
      return resolve(allTheChunks);
    });

    inputStream.on('data', (chunk) => {
      allTheChunks += chunk;
    });

  });
};

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

// If STDIN is present (i.e. not a TTY) and commander.args doesn't contain '-', 
// then prepend '-' to commander.args
if (!process.stdin.isTTY && commander.args.indexOf('-') === -1) {
  commander.args.unshift('-');
}

// If there are no inputs to process, then display the usage message
if (commander.args.length === 0) {
  commander.help();
}

// keep track of error count for return code
let errors = 0;

// Process each input sequentially
async.eachSeries(commander.args, (input, callback) => {
  
  // Iterator function

  readInput(input)
    .then((str) => {
      return raml.parseRAML(str, { rejectOnErrors: true });
    })
    .then(() => {
      outputSuccess(input);
    })
    .catch((err) => {
      errors++;
      outputFailure(input, err);
    })
    .finally(() => {
      callback();
    });

}, () => {

  // End function

  if (errors > 0) {
    process.exit(1);
  }

});
