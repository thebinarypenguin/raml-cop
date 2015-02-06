var colors = require('colors');

/*
 * NOTE: the colors module is smart enough to deactivate itself when it
 * senses the script has been run with the --no-color option
 */

var reporter = function() {

  var mode          = 'normal';
  var errorCount    = 0;
  var collectedData = [];

  return {
    getErrorCount: function() {
      return errorCount;
    },
    setMode: function(val) {
      switch (val.toLowerCase()) {
        case 'normal': mode = 'normal'; break;
        case 'json': mode = 'json'; break;
        default: break;
      }
    },

    success: function(name, data) {
      var src, message = '';

      if (mode === 'json') {
        collectedData.push(data);
      } else {
        src     = '[' + name + '] ';
        message = 'VALID';

        console.log(src + message.green);
      }
    },

    error: function(name, err) {
      var src, message = '';

      errorCount++;

      if (err.problem_mark) {
        src     = '[' + name + ':' + err.problem_mark.line + ':' + err.problem_mark.column + '] ';
        message = 'ERROR ' + err.message;

        console.log(src + message.red);
      } else {
        src     = '[' + name + '] ';
        message = 'ERROR ' + err.message;

        console.log(src + message.red);
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
