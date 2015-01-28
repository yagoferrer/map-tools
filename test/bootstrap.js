'use strict';

var chai = require('chai');
global.expect = chai.expect;

var window = require('../test/mocks/window');
window.google = require('../test/mocks/google-maps');
var GMP = require('../lib/gmplus/map')(window);

window.GMP = GMP;
global.GMP = window.GMP;


