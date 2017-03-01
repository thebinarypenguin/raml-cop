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
    reportIncludeErrors: true,
    reportIncludeWarnings: true,
  };

  const mergedOptions = Object.assign({}, defaultOptions, options || {});

  return Bluebird
    .resolve()
    .then(() => {

      return raml.loadRAML(filename, [], { rejectOnErrors: true });
    })
    .then(() => {

      return { src: filename, message: 'VALID' };
    })
    .catch((err) => {

      const errorsToReport = [];

      // Generic error
      if (!err.parserErrors) {
        err.results = [{ src: filename, message: err.message, isWarning: err.isWarning }];
        throw err;
      }

      // RAML parser error
      err.parserErrors.forEach((e) => {

        let errFilename = path.join(path.dirname(filename), e.path);

        if ((!mergedOptions.reportIncludeErrors && errFilename !== filename) || 
          (!mergedOptions.reportIncludeWarnings && e.isWarning)) {
          return;
        }

        errorsToReport.push({
          src: `${errFilename}:${e.range.start.line}:${e.range.start.column}`,
          message: e.message,
          isWarning: e.isWarning
        });
      });

      // If we have errors to report, throw an error otherwise report success
      if (errorsToReport.length > 0) {
        
        let ve = new Error('Validation Error');
        ve.results = errorsToReport;
        throw ve;
      } else {

        return { src: filename, message: 'VALID' };
      }
    });
};

let errorCount = 0;

const validationOptions = {}; 

// Parse command line arguments
commander
  .version(pkg.version)
  .usage('[options] <file ...>')
  .option('    --no-color', 'disable colored output')
  .option('    --no-includes', 'do not report errors for include files')
  .option('    --no-warnings', 'do not report warnings')
  .parse(process.argv);

// --no-colors option
  // (handled automagically by colors module)

// --no-includes options
if (!commander.includes) {
  validationOptions.reportIncludeErrors = false;
}

// --no-warnings options
if (!commander.warnings) {
  validationOptions.reportIncludeWarnings = false;
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

        // File is valid
        console.log(`[${result.src}] ${colors.green(result.message)}`);
      })
      .catch((err) => {

        // Something went wrong. Display error message for each error
        err.results.forEach((e) => {

          if (e.isWarning) {
            console.log(`[${e.src}] ${colors.yellow(e.message)}`);
          } else {
            console.log(`[${e.src}] ${colors.red(e.message)}`);
          }
          errorCount++;
        });
      });
  })
  .finally(() => {
    
    // If any errors occurred, return a proper error code
    if (errorCount > 0) {
      process.exit(1);
    }
  });
  