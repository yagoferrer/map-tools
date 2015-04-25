"use strict";

// Need it for testing
var chai = require('chai');
var sinonChai = require('sinon-chai');
chai.use(sinonChai);
global.expect = chai.expect;
global.sinon = require('sinon');

// Dependencies
global.crossfilter = require('crossfilter');

var window = require('../test/mocks/window');
window.google = require('../test/mocks/google-maps');

window.mapTools = global.mapTools = require('map-tools/index')(window);
global.window = window;
