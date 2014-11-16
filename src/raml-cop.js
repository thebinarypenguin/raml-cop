#!/usr/bin/env node

"use strict";

var async     = require('async');
var commander = require('commander');
var colors    = require('colors');
var raml      = require('raml-parser');
var pkg       = require('../package.json');

// If the --json flag is specified, parsed data is collected and only output if every file is valid
var collectedData = [];
var allValid      = true;

// Handle successful parsing of RAML file
var parseSuccess = function(file, data, callback) {
  if (commander.json) {
    if (commander.args.length === 1) {
      collectedData = data;
    } else {
      collectedData.push(data);
    }
  } else {
    console.log('[' + file + '] '+'valid'.green);
  }

  callback();
};

// Handle failed parsing of RAML file
var parseFailure = function(file, err, callback) {
  allValid = false;

  if (err.problem_mark) {
    console.error('[' + err.problem_mark.name + ':' + err.problem_mark.line + ':' +
      err.problem_mark.column + '] ' + err.message.red);
  } else {
    console.error('[' + file + '] '+err.message.red);
  }

  callback();
};

// Define command line options
commander
  .version(pkg.version)
  .usage('[options] <file ...>')
  .option('-j, --json', 'output JSON')
  .parse(process.argv);

// If no files specified, display usage message and exit
if (!commander.args.length) {
  commander.help();
}

// Parse each file in sequence.
async.eachSeries(commander.args, function(file, callback) {
  raml.loadFile(file).then(function(data) {
    parseSuccess(file, data, callback);
  }, function(err) {
    parseFailure(file, err, callback);
  });
}, function(err) {
  // err is not used and should always be undefined.
  // Any parse errors are handled completely by parseFailure()

  // If the --json flag is specified and all files are valid, output the parsed data as JSON
  if (commander.json && allValid) {
    console.log(JSON.stringify(collectedData, null, '  '));
  }
});
