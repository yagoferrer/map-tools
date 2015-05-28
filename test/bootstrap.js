"use strict";

// Need it for testing

var chai = require('chai');
var sinonChai = require('sinon-chai');
chai.use(sinonChai);
global.expect = chai.expect;
global.sinon = require('sinon');


global.window = require('../test/mocks/window');
global.google = require('../test/mocks/google-maps');
global.mapTools = require('mapTools');

global.crossfilter = require('crossfilter');

