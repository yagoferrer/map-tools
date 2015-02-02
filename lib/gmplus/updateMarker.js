/*jslint node: true */
"use strict";
var utils = require('gmplus/utils');
var config = require('gmplus/config');

module.exports = function (global, that) {

  var findAndUpdateMarker = require('gmplus/findUpdateMarker')(global, that);

  function updateMarker(args, options) {
    var type = Object.prototype.toString.call(args);
    var _options = utils.prepareOptions(options, config.customMarkerOptions);

    if (type === '[object Object]') {
      return findAndUpdateMarker(args, _options);
    } else if (type === '[object Array]') {
      var marker;
      var results = [], instance;
      for (var x in args) {
        marker = args[x];
        instance = findAndUpdateMarker(marker, _options);
        results.push(instance);
      }
      return results;
    }
  }

  return updateMarker;

};
