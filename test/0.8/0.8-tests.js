/* global describe, it, before */

"use strict";

const chai         = require('chai');
const childProcess = require('child_process');
const path         = require('path');


// Test harness
const testChildProcess = function (command, args, callback) {

  let collectedStdout = '';
  let collectedStderr = '';

  let proc = childProcess.spawn(command, args);

  proc.stdout.on('data', function (data) { collectedStdout += data; });
  proc.stderr.on('data', function (data) { collectedStderr += data; });

  proc.on('close', function (code) {
    callback(null, { stdout: collectedStdout, stderr: collectedStderr, code: code });
  });
};

describe('RAML 0.8 Tests', function () {

  this.timeout(7000);

  describe('Invalid file with one error', function () {

    const ramlCop = path.join(__dirname, '..', '..', 'src', 'raml-cop.js');
    const file    = path.join(__dirname, 'data', 'invalid-one-error.raml');
    
    let results = {};
      
    before(function (done) {

      testChildProcess(ramlCop, [file], (err, data) => {
        if (err) { return done(err); }

        results = data;
        done();
      });
    });

    it ('STDOUT should contain filename, line number, column number, and message', function() {
      chai.expect(results.stdout).to.contain(file);
      chai.expect(results.stdout).to.match(/^\[.+:[0-9]+:[0-9]+\] .+/);
    });

    it ('STDERR should be empty', function() {
      chai.expect(results.stderr).to.be.empty;
    });

    it('Should exit with code 1', function() {
      chai.expect(results.code).to.eql(1);
    });
  });

  describe('Invalid file with two errors', function () {

    const ramlCop = path.join(__dirname, '..', '..', 'src', 'raml-cop.js');
    const file    = path.join(__dirname, 'data', 'invalid-two-errors.raml');
    
    let results = {};
      
    before(function (done) {

      testChildProcess(ramlCop, [file], (err, data) => {
        if (err) { return done(err); }

        results = data;
        done();
      });
    });

    it ('STDOUT should contain filename, line number, column number, and message for each error', function() {
      chai.expect(results.stdout).to.contain(file);
      chai.expect(results.stdout).to.match(/^\[.+:[0-9]+:[0-9]+\] .+\r?\n\[.+:[0-9]+:[0-9]+\] .+/);
    });

    it ('STDERR should be empty', function() {
      chai.expect(results.stderr).to.be.empty;
    });

    it('Should exit with code 1', function() {
      chai.expect(results.code).to.eql(1);
    });
  });

  describe('Valid file (no includes)', function () {

    const ramlCop = path.join(__dirname, '..', '..', 'src', 'raml-cop.js');
    const file    = path.join(__dirname, 'data', 'basic-valid.raml');
    
    let results = {};
      
    before(function (done) {

      testChildProcess(ramlCop, [file], (err, data) => {
        if (err) { return done(err); }

        results = data;
        done();
      });
    });

    it ('STDOUT should contain filename and "VALID"', function() {
      chai.expect(results.stdout).to.contain(file);
      chai.expect(results.stdout).to.match(/^\[.+\] VALID/);
    });

    it ('STDERR should be empty', function() {
      chai.expect(results.stderr).to.be.empty;
    });

    it('Should exit with code 0', function() {
      chai.expect(results.code).to.eql(0);
    });
  });

  describe('Invalid file (no includes)', function () {

    const ramlCop = path.join(__dirname, '..', '..', 'src', 'raml-cop.js');
    const file    = path.join(__dirname, 'data', 'basic-invalid.raml');
    
    let results = {};
      
    before(function (done) {

      testChildProcess(ramlCop, [file], (err, data) => {
        if (err) { return done(err); }

        results = data;
        done();
      });
    });

    it ('STDOUT should contain filename, line number, column number, and message', function() {
      chai.expect(results.stdout).to.contain(file);
      chai.expect(results.stdout).to.match(/^\[.+:[0-9]+:[0-9]+\] .+/);
    });

    it ('STDERR should be empty', function() {
      chai.expect(results.stderr).to.be.empty;
    });

    it('Should exit with code 1', function() {
      chai.expect(results.code).to.eql(1);
    });
  });

  describe('Valid file with invalid include file (default)', function () {

    const ramlCop     = path.join(__dirname, '..', '..', 'src', 'raml-cop.js');
    const file        = path.join(__dirname, 'data', 'valid-with-invalid-include.raml');
    const includeFile = path.join(__dirname, 'data', 'includes', 'invalid-include.yaml');
    
    let results = {};
      
    before(function (done) {

      testChildProcess(ramlCop, [file], (err, data) => {
        if (err) { return done(err); }

        results = data;
        done();
      });
    });

    it ('STDOUT should contain include filename, line number, column number, and message', function() {
      chai.expect(results.stdout).to.contain(includeFile);
      chai.expect(results.stdout).to.match(/^\[.+:[0-9]+:[0-9]+\] .+/);
    });

    it ('STDERR should be empty', function() {
      chai.expect(results.stderr).to.be.empty;
    });

    it('Should exit with code 1', function() {
      chai.expect(results.code).to.eql(1);
    });
  });

  describe('Valid file with invalid included file (--no-includes)', function () {

    const ramlCop     = path.join(__dirname, '..', '..', 'src', 'raml-cop.js');
    const file        = path.join(__dirname, 'data', 'valid-with-invalid-include.raml');
    const includeFile = path.join(__dirname, 'data', 'includes', 'invalid-include.yaml');
    
    let results = {};
      
    before(function (done) {

      testChildProcess(ramlCop, ['--no-includes', file], (err, data) => {
        if (err) { return done(err); }

        results = data;
        done();
      });
    });

    it ('STDOUT should contain filename and "VALID"', function() {
      chai.expect(results.stdout).to.contain(file);
      chai.expect(results.stdout).to.match(/^\[.+\] VALID/);
    });

    it ('STDOUT should not contain include filename', function() {
      chai.expect(results.stdout).to.not.contain(includeFile);
    });

    it ('STDERR should be empty', function() {
      chai.expect(results.stderr).to.be.empty;
    });

    it('Should exit with code 0', function() {
      chai.expect(results.code).to.eql(0);
    });
  });

  describe('Empty file', function () {

    const ramlCop = path.join(__dirname, '..', '..', 'src', 'raml-cop.js');
    const file    = path.join(__dirname, 'data', 'empty.raml');
    
    let results = {};
      
    before(function (done) {

      testChildProcess(ramlCop, [file], (err, data) => {
        if (err) { return done(err); }

        results = data;
        done();
      });
    });

    it ('STDOUT should filename and message', function() {
      chai.expect(results.stdout).to.contain(file);
      chai.expect(results.stdout).to.match(/^\[.+\] .+/);
    });

    it ('STDERR should be empty', function() {
      chai.expect(results.stderr).to.be.empty;
    });

    it('Should exit with code 1', function() {
      chai.expect(results.code).to.eql(1);
    });
  });

  describe('Non-Existent file', function () {

    const ramlCop = path.join(__dirname, '..', '..', 'src', 'raml-cop.js');
    const file    = path.join(__dirname, 'data', 'non-existent.raml');
    
    let results = {};
      
    before(function (done) {

      testChildProcess(ramlCop, [file], (err, data) => {
        if (err) { return done(err); }

        results = data;
        done();
      });
    });

    it ('STDOUT should filename and message', function() {
      chai.expect(results.stdout).to.contain(file);
      chai.expect(results.stdout).to.match(/^\[.+\] .+/);
    });

    it ('STDERR should be empty', function() {
      chai.expect(results.stderr).to.be.empty;
    });

    it('Should exit with code 1', function() {
      chai.expect(results.code).to.eql(1);
    });
  });

  describe('No files', function () {

    const ramlCop = path.join(__dirname, '..', '..', 'src', 'raml-cop.js');
    
    let results = {};
      
    before(function (done) {

      testChildProcess(ramlCop, [], (err, data) => {
        if (err) { return done(err); }

        results = data;
        done();
      });
    });

    it ('STDOUT should help text', function() {
      chai.expect(results.stdout).to.contain('Usage: raml-cop');
    });

    it ('STDERR should be empty', function() {
      chai.expect(results.stderr).to.be.empty;
    });

    it('Should exit with code 0', function() {
      chai.expect(results.code).to.eql(0);
    });
  });

  describe('Multiple files', function () {

    const ramlCop = path.join(__dirname, '..', '..', 'src', 'raml-cop.js');
    const files   = [
      path.join(__dirname, 'data', 'basic-valid.raml'),
      path.join(__dirname, 'data', 'basic-invalid.raml'),
      path.join(__dirname, 'data', 'empty.raml'),
    ];

    
    let stdoutLines = [];
      
    before(function (done) {

      testChildProcess(ramlCop, files, (err, data) => {
        if (err) { return done(err); }

        stdoutLines = data.stdout.split(/\r?\n/);
        done();
      });
    });

    it ('Should process files in the order in which they appear', function() {
      chai.expect(stdoutLines[0]).to.contain(files[0]);
      chai.expect(stdoutLines[1]).to.contain(files[1]);
      chai.expect(stdoutLines[2]).to.contain(files[2]);
    });
  });

  describe('Invalid file with one warning (default)', function () {

    const ramlCop = path.join(__dirname, '..', '..', 'src', 'raml-cop.js');
    const file    = path.join(__dirname, 'data', 'invalid-one-warning.raml');
    
    let results = {};
      
    before(function (done) {

      testChildProcess(ramlCop, [file], (err, data) => {
        if (err) { return done(err); }

        results = data;
        done();
      });
    });

    it ('STDOUT should contain filename, line number, column number, and message for both the warning', function() {
      chai.expect(results.stdout).to.contain(file);
      chai.expect(results.stdout).to.match(/^\[.+:[0-9]+:[0-9]+\] .+/);
    });

    it ('STDERR should be empty', function() {
      chai.expect(results.stderr).to.be.empty;
    });

    it('Should exit with code 1', function() {
      chai.expect(results.code).to.eql(1);
    });
  });

  describe('Invalid file with one warning (--no-warnings)', function () {

    const ramlCop = path.join(__dirname, '..', '..', 'src', 'raml-cop.js');
    const file    = path.join(__dirname, 'data', 'invalid-one-warning.raml');
    
    let results = {};
      
    before(function (done) {

      testChildProcess(ramlCop, ['--no-warnings', file], (err, data) => {
        if (err) { return done(err); }

        results = data;
        done();
      });
    });

    it ('STDOUT should contain filename and "VALID"', function() {
      chai.expect(results.stdout).to.contain(file);
      chai.expect(results.stdout).to.match(/^\[.+\] VALID/);
    });

    it ('STDERR should be empty', function() {
      chai.expect(results.stderr).to.be.empty;
    });

    it('Should exit with code 0', function() {
      chai.expect(results.code).to.eql(0);
    });
  });

  describe('Invalid file with one error and one warning (default)', function () {

    const ramlCop = path.join(__dirname, '..', '..', 'src', 'raml-cop.js');
    const file    = path.join(__dirname, 'data', 'invalid-one-error-one-warning.raml');
    
    let results = {};
      
    before(function (done) {

      testChildProcess(ramlCop, [file], (err, data) => {
        if (err) { return done(err); }

        results = data;
        done();
      });
    });

    it ('STDOUT should contain filename, line number, column number, and message for both error and warning', function() {
      chai.expect(results.stdout).to.contain(file);
      chai.expect(results.stdout).to.match(/^\[.+:[0-9]+:[0-9]+\] .+\r?\n\[.+:[0-9]+:[0-9]+\] .+/);
    });

    it ('STDERR should be empty', function() {
      chai.expect(results.stderr).to.be.empty;
    });

    it('Should exit with code 1', function() {
      chai.expect(results.code).to.eql(1);
    });
  });

  describe('Invalid file with one error and one warning (--no-warnings)', function () {

    const ramlCop = path.join(__dirname, '..', '..', 'src', 'raml-cop.js');
    const file    = path.join(__dirname, 'data', 'invalid-one-error-one-warning.raml');
    
    let results = {};
      
    before(function (done) {

      testChildProcess(ramlCop, ['--no-warnings', file], (err, data) => {
        if (err) { return done(err); }

        results = data;
        done();
      });
    });

    it ('STDOUT should contain filename, line number, column number, and message only for error', function() {
      chai.expect(results.stdout).to.contain(file);
      chai.expect(results.stdout).to.match(/^\[.+:[0-9]+:[0-9]+\] .+/);
    });

    it ('STDERR should be empty', function() {
      chai.expect(results.stderr).to.be.empty;
    });

    it('Should exit with code 1', function() {
      chai.expect(results.code).to.eql(1);
    });
  });
});
