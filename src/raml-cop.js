#!/usr/bin/env node

"use strict";

const Bluebird  = require('bluebird');
const colors    = require('colors');
const commander = require('commander');
const path      = require('path');
const raml      = require('raml-1-parser');
const pkg       = require('../package.json');

/**
 * Validate a file. 
 * Returns a Bluebird promise that resolves with an object 
 * (with 'src' and 'message' properties) or rejects with an error.
 */
const validate = function (filename, options) {

  const defaultOptions = {
    reportIncludes: true,
    reportWarnings: true,
  };

  const mergedOptions = Object.assign({}, defaultOptions, options || {});

  return Bluebird
    .resolve()
    .then(() => {

      // Parse file
      return raml.loadRAML(filename).catch((err) => {
        
        // Generic error
        err.issues = [{ src: filename, message: err.message}];
        throw err;
      });
    })
    .then((ramlContent) => {

      const issuesToReport = [];

      // Check ramlContent for issues
      ramlContent.errors().forEach((issue) => {

        let name = path.join(path.dirname(filename), issue.path);

        if (!mergedOptions.reportIncludes && name !== filename) {
          return;
        }

        if (!mergedOptions.reportWarnings && issue.isWarning) {
          return;
        }

        issuesToReport.push({
          src: `${name}:${issue.range.start.line}:${issue.range.start.column}`,
          message: issue.message,
          isWarning: issue.isWarning,
        });
      });

      // If we have issues to report, throw an error containing those issues
      if (issuesToReport.length > 0) {
        
        let ve = new Error('Validation Error');
        ve.issues = issuesToReport;
        throw ve;
      }

      // Otherwise the file is valid
      return { src: filename, message: 'VALID' };   
    });
};

let issueCount = 0;

const validationOptions = {}; 

// Parse command line arguments
commander
  .version(pkg.version)
  .usage('[options] <file ...>')
  .option('    --no-color', 'disable colored output')
  .option('    --no-includes', 'do not report issues for include files')
  .option('    --no-warnings', 'do not report warnings')
  .parse(process.argv);

// --no-colors option
  // (handled automagically by colors module)

// --no-includes option
if (!commander.includes) {
  validationOptions.reportIncludes = false;
}

// --no-warnings option
if (!commander.warnings) {
  validationOptions.reportWarnings = false;
}

// If there are no files to process, then display the usage message
if (commander.args.length === 0) {
  commander.help();
}

// Process each file sequentially
Bluebird
  .each(commander.args, (file) => {
    
    // Validate the file
    return validate(file, validationOptions)
      .then((result) => {

        // File is valid. Display success message.
        console.log(`[${result.src}] ${colors.green(result.message)}`);
      })
      .catch((err) => {

        // File is invalid. Display message for each issue.
        err.issues.forEach((issue) => {

          if (issue.isWarning) {
            console.log(`[${issue.src}] ${colors.yellow('WARNING')} ${colors.yellow(issue.message)}`);
          } else {
            console.log(`[${issue.src}] ${colors.red('ERROR')} ${colors.red(issue.message)}`);
          }

          issueCount++;
        });
      });
  })
  .finally(() => {
    
    // If any issues occurred, return a proper status code
    if (issueCount > 0) {
      process.exit(1);
    }
  });
  