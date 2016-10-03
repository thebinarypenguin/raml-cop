/* global describe, it, before */

"use strict";

const chai         = require('chai');
const childProcess = require('child_process');
const fs           = require('fs');
const path         = require('path');

// File paths
const ramlCop     = path.join(__dirname, '..', '..', 'src', 'raml-cop.js');
const valid       = path.join(__dirname, 'data', 'valid.raml');
const oneError    = path.join(__dirname, 'data', 'one-error.raml');
const twoErrors   = path.join(__dirname, 'data', 'two-errors.raml');
const empty       = path.join(__dirname, 'data', 'empty.raml');
const nonExistent = path.join(__dirname, 'data', 'non-existent.raml');

// Test harness
const testChildProcess = function (command, args, stdin, callback) {

  let proc   = {};
  let stdout = '';
  let stderr = '';

  if (stdin) {
    proc = childProcess.spawn(command, args, { stdio: ['pipe', 'pipe', 'pipe'] });
    stdin.pipe(proc.stdin);
  } else {
    proc = childProcess.spawn(command, args, { stdio: [process.stdin, 'pipe', 'pipe'] });
  }

  proc.stdout.on('data', function (data) { stdout += data; });
  proc.stderr.on('data', function (data) { stderr += data; });

  proc.on('close', function (code) {
    callback(null, { stdout: stdout, stderr: stderr, code: code });
  });
};

describe('1.0 Tests', function() {

  describe('Validation', function () {

    this.timeout(5000);

    describe('Valid input', function () {

      let results = {};
      
      before(function (done) {

        testChildProcess(ramlCop, [valid], null, function (err, data) {
          if (err) { done(err); }

          results = data;
          done();
        });
      });

      it ('STDOUT should contain filename', function() {
        chai.expect(results.stdout).to.contain(valid);
      });

      it ('STDOUT should match regex', function() {
        chai.expect(results.stdout).to.match(/^\[.+\] VALID/);
      });    

      it ('STDERR should be empty', function() {
        chai.expect(results.stderr).to.be.empty;
      });

      it('Should exit with code 0', function() {
        chai.expect(results.code).to.eql(0);
      });
    });

    describe('Invalid input (1 error)', function () {

      let results = {};
      
      before(function (done) {

        testChildProcess(ramlCop, [oneError], null, function (err, data) {
          if (err) { done(err); }

          results = data;
          done();
        });
      });

      it ('STDOUT should contain filename', function() {
        chai.expect(results.stdout).to.contain(oneError);
      });

      it ('STDOUT should match regex', function() {
        chai.expect(results.stdout).to.match(/^\[.+:[0-9]+:[0-9]+\] .+/);
      });  

      it ('STDERR should be empty', function() {
        chai.expect(results.stderr).to.be.empty;
      });

      it('Should exit with code 1', function() {
        chai.expect(results.code).to.eql(1);
      });
    });

    describe('Invalid input (2 errors)', function () {

      let results = {};
      
      before(function (done) {

        testChildProcess(ramlCop, [twoErrors], null, function (err, data) {
          if (err) { done(err); }

          results = data;
          done();
        });
      });

      it ('STDOUT should contain filename', function() {
        chai.expect(results.stdout).to.contain(twoErrors);
      });

      it ('STDOUT should match regex', function() {
        chai.expect(results.stdout).to.match(/^\[.+:[0-9]+:[0-9]+\] .+\r?\n\[.+:[0-9]+:[0-9]+\] .+/);
      });  

      it ('STDERR should be empty', function() {
        chai.expect(results.stderr).to.be.empty;
      });

      it('Should exit with code 1', function() {
        chai.expect(results.code).to.eql(1);
      });
    });

    describe('Invalid input (empty)', function () {

      let results = {};
      
      before(function (done) {

        testChildProcess(ramlCop, [empty], null, function (err, data) {
          if (err) { done(err); }

          results = data;
          done();
        });
      });

      it ('STDOUT should contain filename', function() {
        chai.expect(results.stdout).to.contain(empty);
      });  

      it ('STDERR should be empty', function() {
        chai.expect(results.stderr).to.be.empty;
      });

      it('Should exit with code 1', function() {
        chai.expect(results.code).to.eql(1);
      });
    });

    describe('Invalid input (non-existent file)', function () {

      let results = {};
      
      before(function (done) {

        testChildProcess(ramlCop, [nonExistent], null, function (err, data) {
          if (err) { done(err); }

          results = data;
          done();
        });
      });

      it ('STDOUT should contain filename', function() {
        chai.expect(results.stdout).to.contain(nonExistent);
      });  

      it ('STDERR should be empty', function() {
        chai.expect(results.stderr).to.be.empty;
      });

      it('Should exit with code 1', function() {
        chai.expect(results.code).to.eql(1);
      });
    });

    describe('No input', function () {

      let results = {};
      
      before(function (done) {

        testChildProcess(ramlCop, [], null, function (err, data) {
          if (err) { done(err); }

          results = data;
          done();
        });
      });

      it ('STDOUT should contain help text', function() {
        chai.expect(results.stdout).to.contain('Usage: raml-cop');
      });  

      it ('STDERR should be empty', function() {
        chai.expect(results.stderr).to.be.empty;
      });

      it('Should exit with code 0', function() {
        chai.expect(results.code).to.eql(0);
      });
    });
  });

  describe('Multiple Inputs', function () {

    this.timeout(5000);

    describe('Multiple arguments', function () {

      let stdoutLines = null;
      
      before(function (done) {

        testChildProcess(ramlCop, [valid, oneError, empty], null, function (err, data) {
          if (err) { done(err); }

          stdoutLines = data.stdout.split(/\r?\n/);
          done();
        });
      });

      it('Each argument is processed in the order in which it appears', function () {
        chai.expect(stdoutLines[0]).to.contain(valid);
        chai.expect(stdoutLines[1]).to.contain(oneError);
        chai.expect(stdoutLines[2]).to.contain(empty);
      });
    });

    describe('STDIN and multiple arguments', function () {

      let stdoutLines = null;
      
      before(function (done) {

        testChildProcess(ramlCop, [oneError, empty], fs.createReadStream(valid), function (err, data) {
          if (err) { done(err); }

          stdoutLines = data.stdout.split(/\r?\n/);
          done();
        });
      });

      it('STDIN is processed first then each argument is processed in the order in which it appears', function () {
        chai.expect(stdoutLines[0]).to.contain('STDIN');
        chai.expect(stdoutLines[1]).to.contain(oneError);
        chai.expect(stdoutLines[2]).to.contain(empty);
      });
    });
  });

});