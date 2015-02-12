#!/usr/bin/env node

"use strict";

var async     = require('async');
var commander = require('commander');
var raml      = require('raml-parser');
var utils     = require('./lib/utils.js');
var reporter  = require('./lib/reporter.js');
var pkg       = require('../package.json');


// Read STDIN into a string
utils.readStdin(process.stdin, function(err, stdin) {
  if (err) { throw err; }

  var errorCount = 0;

  // Parse command line options and arguments
  commander
    .version(pkg.version)
    .usage('[options] <file ...>')
    .option('-j, --json', 'output JSON')
    .option('    --no-color', 'disable colored output')
    .parse(process.argv);

  // If called with --json flag, set reporter to json mode
  if (commander.json) {
    reporter.setMode('json');
  }

  // If no STDIN and no arguments, display usage message
  if (stdin === null && commander.args.length === 0) {
    commander.help();
  }

  // If STDIN and no arguments, add a '-' argument
  if (stdin !== null && commander.args.length === 0) {
    commander.args.push('-');
  }

  // Parse each argument in sequence.
  async.eachSeries(commander.args, function(arg, callback) {
    if (arg === '-' && stdin !== null) {

      // Parse STDIN
      raml.load(stdin).then(function(data) {
        reporter.success('STDIN', data);
      }, function(err) {
        reporter.error('STDIN', err);
        errorCount++;
      }).finally(callback);
    } else {

      // Parse file
      raml.loadFile(arg).then(function(data) {
        reporter.success(arg, data);
      }, function(err) {
        reporter.error(arg, err);
        errorCount++;
      }).finally(callback);
    }
  }, function(err) {
    if (err) { throw err; }

    // Clean up
    reporter.flush();

    if (errorCount > 0) {
      process.exit(1);
    }
  });
});
