/*jslint node: true */
"use strict";
var utils = require('map-tools/utils');
var config = require('map-tools/config');

module.exports = function (global, that) {

  var findAndUpdateMarker = require('map-tools/findUpdateMarker')(global, that);

  function updateMarker(args, options) {
    var type = Object.prototype.toString.call(args);
    var preparedOptions = utils.prepareOptions(options, config.customMarkerOptions);

    if (type === '[object Object]') {
      return findAndUpdateMarker(args, preparedOptions);
    }
    if (type === '[object Array]') {
      var marker, results = [], instance, x;
      for (x in args) {
        if (args.hasOwnProperty(x)) {
          marker = args[x];
          instance = findAndUpdateMarker(marker, preparedOptions);
          results.push(instance);
        }
      }
      return results;
    }
  }

  return updateMarker;

};
