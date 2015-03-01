'use strict';

var chai = require('chai');
var sinonChai = require('sinon-chai');
chai.use(sinonChai);
global.expect = chai.expect;

global.sinon = require('sinon');

var window = require('../test/mocks/window');
window.google = require('../test/mocks/google-maps');

var mapTools = require('map-tools/index')(window);
window.mapTools = mapTools;
global.mapTools = window.mapTools;


// To test independent modules.
global.window = window;
global.google = window.google;

global.crossfilter = require('crossfilter');
