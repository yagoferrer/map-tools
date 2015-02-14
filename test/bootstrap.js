'use strict';

var chai = require('chai');
var sinonChai = require('sinon-chai');
chai.use(sinonChai);
global.expect = chai.expect;

global.sinon = require('sinon');

var window = require('../test/mocks/window');
window.google = require('../test/mocks/google-maps');

var GMP = require('gmplus/index')(window);
window.GMP = GMP;
global.GMP = window.GMP;


// To test independent modules.
global.window = window;


