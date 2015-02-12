/*jshint expr: true*/

var path         = require('path');
var fs           = require('fs');
var childProcess = require('child_process');
var chai         = require('chai');

var ramlCop         = path.join(__dirname, '..', 'src', 'raml-cop.js');
var validFile       = path.join(__dirname, 'data', 'valid.raml');
var invalidFile     = path.join(__dirname, 'data', 'invalid.raml');
var emptyFile       = path.join(__dirname, 'data', 'empty.raml');
var nonexistentFile = path.join(__dirname, 'data', 'nonexistent.raml');

var testChildProcess = function(command, stdin, args, callback) {
  var proc   = null;
  var stdout = '';
  var stderr = '';

  if (stdin) {
    // Pipe specified stdin stream to child process
    proc = childProcess.spawn(command, args, { stdio: ['pipe', 'pipe', 'pipe'] });
    stdin.pipe(proc.stdin);
  } else {
    // Use parent's stdin stream for child process
    proc = childProcess.spawn(command, args, { stdio: [process.stdin, 'pipe', 'pipe'] });
  }

  // Buffer stdout and stderr
  proc.stdout.on('data', function (data) { stdout += data; });
  proc.stderr.on('data', function (data) { stderr += data; });

  // Ding! Fries are done.
  proc.on('close', function (code) { callback(null, stdout, stderr, code); });
};

describe('STDIO', function() {

  describe('When called with STDIN', function() {

    describe('Valid STDIN', function() {
      var results = {};

      before(function(done) {
        var validStream = fs.createReadStream(validFile);

        testChildProcess(ramlCop, validStream, [], function(err, stdout, stderr, code) {
          if (err) { done(err); }
          results.stdout = stdout;
          results.stderr = stderr;
          results.code = code;
          done();
        });
      });

      it('Should output "valid"', function() {
        chai.expect(results.stdout).to.match(/^\[STDIN\] .*VALID/);
      });

      it('Should exit with code 0', function() {
        chai.expect(results.code).to.eql(0);
      });
    });

    describe('Invalid STDIN', function() {
      var results = {};

      before(function(done) {
        var invalidStream = fs.createReadStream(invalidFile);

        testChildProcess(ramlCop, invalidStream, [], function(err, stdout, stderr, code) {
          if (err) { done(err); }
          results.stdout = stdout;
          results.stderr = stderr;
          results.code = code;
          done();
        });
      });

      it('Should output parse error message', function() {
        chai.expect(results.stdout).to.match(/^\[STDIN:[\d]+:[\d]+\] .*ERROR/);
      });

      it('Should exit with code 1', function() {
        chai.expect(results.code).to.eql(1);
      });
    });

    describe('Empty STDIN', function() {
      var results = {};

      before(function(done) {
        var emptyStream = fs.createReadStream(emptyFile);

        testChildProcess(ramlCop, emptyStream, [], function(err, stdout, stderr, code) {
          if (err) { done(err); }
          results.stdout = stdout;
          results.stderr = stderr;
          results.code = code;
          done();
        });
      });

      it('Should output parse error message', function() {
        chai.expect(results.stdout).to.match(/^\[STDIN:[\d]+:[\d]+\] .*ERROR/);
      });

      it('Should exit with code 1', function() {
        chai.expect(results.code).to.eql(1);
      });
    });
  });

  describe('When called with arguments', function() {

    describe('Valid File', function() {
      var results = {};

      before(function(done) {
        testChildProcess(ramlCop, null, [validFile], function(err, stdout, stderr, code) {
          if (err) { done(err); }
          results.stdout = stdout;
          results.stderr = stderr;
          results.code = code;
          done();
        });
      });

      it('Should output "valid"', function() {
        chai.expect(results.stdout).to.match(new RegExp('^\\['+validFile+'\\] .*VALID'));
      });

      it('Should exit with code 0', function() {
        chai.expect(results.code).to.eql(0);
      });
    });

    describe('Invalid File', function() {
      var results = {};

      before(function(done) {
        testChildProcess(ramlCop, null, [invalidFile], function(err, stdout, stderr, code) {
          if (err) { done(err); }
          results.stdout = stdout;
          results.stderr = stderr;
          results.code = code;
          done();
        });
      });

      it('Should output parse error message', function() {
        chai.expect(results.stdout).to.match(new RegExp('^\\['+invalidFile+':\\d+:\\d+\\] .*ERROR'));
      });

      it('Should exit with code 1', function() {
        chai.expect(results.code).to.eql(1);
      });
    });

    describe('Empty File', function() {
      var results = {};

      before(function(done) {
        testChildProcess(ramlCop, null, [emptyFile], function(err, stdout, stderr, code) {
          if (err) { done(err); }
          results.stdout = stdout;
          results.stderr = stderr;
          results.code = code;
          done();
        });
      });

      it('Should output parse error message', function() {
        chai.expect(results.stdout).to.match(new RegExp('^\\['+emptyFile+':\\d+:\\d+\\] .*ERROR'));
      });

      it('Should exit with code 1', function() {
        chai.expect(results.code).to.eql(1);
      });
    });

    describe('Nonexistent File', function() {
      var results = {};

      before(function(done) {
        testChildProcess(ramlCop, null, [nonexistentFile], function(err, stdout, stderr, code) {
          if (err) { done(err); }
          results.stdout = stdout;
          results.stderr = stderr;
          results.code = code;
          done();
        });
      });

      it('Should output generic error message', function() {
          chai.expect(results.stdout).to.match(new RegExp('^\\['+nonexistentFile+'\\] .*ERROR'));
      });

      it('Should exit with code 1', function() {
        chai.expect(results.code).to.eql(1);
      });
    });

    describe('Multiple Files', function() {
      var files = [validFile, invalidFile, emptyFile, nonexistentFile];

      it('Should output the results in the same order', function(done) {
        testChildProcess(ramlCop, null, files, function(err, stdout, stderr) {
          if (err) { done(err); }

          var validIndex       = stdout.search(path.basename(validFile));
          var invalidIndex     = stdout.search(path.basename(invalidFile));
          var emptyIndex       = stdout.search(path.basename(emptyFile));
          var nonexistentIndex = stdout.search(path.basename(nonexistentFile));

          chai.expect(validIndex).to.be.above(-1);
          chai.expect(invalidIndex).to.be.above(-1);
          chai.expect(emptyIndex).to.be.above(-1);
          chai.expect(nonexistentIndex).to.be.above(-1);

          chai.expect(validIndex).to.be.below(invalidIndex);
          chai.expect(invalidIndex).to.be.below(emptyIndex);
          chai.expect(emptyIndex).to.be.below(nonexistentIndex);

          done();
        });
      });
    });
  });

  describe('When called with both STDIN and arguments', function() {

    describe('STDIN placeholder (-) present', function() {
      var validStream = fs.createReadStream(validFile);
      var pattern = /\[STDIN\]/;

      it('Should process STDIN', function(done) {
        testChildProcess(ramlCop, validStream, [invalidFile, '-'], function(err, stdout, stderr) {
          if (err) { done(err); }
          chai.expect(stdout).to.match(pattern);
          done();
        });
      });
    });

    describe('STDIN placeholder (-) absent', function() {
      var validStream = fs.createReadStream(validFile);
      var pattern = /\[STDIN\]/;

      it('Should ignore STDIN', function(done) {
        testChildProcess(ramlCop, validStream, [invalidFile], function(err, stdout, stderr) {
          if (err) { done(err); }
          chai.expect(stdout).to.not.match(pattern);
          done();
        });
      });
    });
  });

  describe('When called with neither STDIN nor arguments', function() {
    var results = {};

    before(function(done) {
      testChildProcess(ramlCop, null, [], function(err, stdout, stderr, code) {
        if (err) { done(err); }
        results.stdout = stdout;
        results.stderr = stderr;
        results.code = code;
        done();
      });
    });

    it('Should output usage message', function() {
      chai.expect(results.stdout).to.match(/Usage: /);
    });

    it('Should exit with code 0', function() {
      chai.expect(results.code).to.eql(0);
    });
  });

  describe('When called with the --json option', function() {

    describe('Single Valid File', function() {

      it('Should output a JSON object', function(done) {
        testChildProcess(ramlCop, null, ['--json', validFile], function(err, stdout, stderr) {
          if (err) { done(err); }
          chai.expect(JSON.parse(stdout)).to.be.an('object');
          done();
        });
      });
    });

    describe('Multiple Valid Files', function() {

      it('Should output a JSON array', function(done) {
        testChildProcess(ramlCop, null, ['--json', validFile, validFile], function(err, stdout, stderr) {
          if (err) { done(err); }
          chai.expect(JSON.parse(stdout)).to.be.an('array');
          done();
        });
      });
    });
  });
});