var colors = require('colors/safe');

/*
 * NOTE: the colors module is smart enough to deactivate itself when it
 * senses the script has been run with the --no-color option
 */

var reporter = function() {

  var mode          = 'normal';
  var errorCount    = 0;
  var collectedData = [];

  return {
    setMode: function(val) {
      switch (val.toLowerCase()) {
        case 'normal': mode = 'normal'; break;
        case 'json': mode = 'json'; break;
        default: break;
      }
    },

    success: function(name, data) {
      if (mode === 'json') {
        collectedData.push(data);
      } else {
        console.log('[' + name + '] ' + colors.green('valid'));
      }
    },

    error: function(name, err) {
      if (mode === 'json') { errorCount++; }

      if (err.problem_mark) {
        console.log('[' + name + ':' + err.problem_mark.line + ':' + err.problem_mark.column + '] ' + colors.red(err.message));
      } else {
        console.log('[' + name + '] ' + colors.red(err.message));
      }
    },

    flush: function() {
      if (mode === 'json' && collectedData.length > 0 && errorCount === 0) {

        if (collectedData.length === 1) {
          console.log(JSON.stringify(collectedData[0], null, '  '));
        } else {
          console.log(JSON.stringify(collectedData, null, '  '));
        }

        errorCount = 0;
        collectedData = [];
      }
    }
  };
};

module.exports = reporter();
