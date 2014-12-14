var utils = {};

utils.readStdin = function(stream, callback) {
  var str = '';

  if (stream.isTTY) { return callback(null, null); }

  stream.setEncoding('utf8');
  stream.on('data', function(chunk) { str += chunk; });
  stream.on('end', function() { return callback(null, str); });
  stream.resume();
};

module.exports = utils;