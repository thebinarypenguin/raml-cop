RAML Cop
========

[![Build Status](https://travis-ci.org/thebinarypenguin/raml-cop.svg?branch=master)](https://travis-ci.org/thebinarypenguin/raml-cop)

A command line tool for validating [RAML](http://raml.org/) files.

## Details

* Uses [raml-org/raml-js-parser](https://github.com/raml-org/raml-js-parser) to do the parsing
* Accepts input via stdin and/or command line arguments
* Can output the parsed RAML as JSON using the `-j` or `--json` option
* Can be used as a linter in [Sublime Text](http://www.sublimetext.com/) via the
[SublimeLinter](https://packagecontrol.io/packages/SublimeLinter) and
[Sublime​Linter-contrib-raml-cop](https://packagecontrol.io/packages/SublimeLinter-contrib-raml-cop) plugins

## Installation

`npm install -g raml-cop`

