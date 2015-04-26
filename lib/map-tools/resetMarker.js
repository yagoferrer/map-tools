"use strict";

var utils = require('map-tools/utils');
var config = require('map-tools/config');

module.exports = function(global, that) {

  var findMarker = require('map-tools/findMarkerById')(global, that);

  var updateMarker = require('map-tools/updateMarker')(global, that);


  function resetBulk(markers, options) {
    var x;
    for (x in markers) {
      if (markers.hasOwnProperty(x)) {
        reset(markers[x], options);
      }
    }
  }


  function resetMarker(args, options) {
    var type = Object.prototype.toString.call(args);

    if (type === '[object Object]') {
      return reset(findMarker(args), options);
    }

    if (type === '[object Array]') {
      return resetBulk(args, options);
    }
  }

  function formatOptions(marker, options) {
    var key, op = {};
    var type = Object.prototype.toString.call(options);

    if (type === '[object String]') {
      op[options] = marker.data._self[options];
    }

    if (type === '[object Array]') {
      for (key in options) {
        if (options.hasOwnProperty(key)) {
          op[options[key]] = marker.data._self[options[key]];
        }
      }
    }

    return op;
  }


  function reset(marker, options) {
    var preparedOptions = utils.prepareOptions(formatOptions(marker, options), config.customMarkerOptions);
    updateMarker.customUpdate(marker, preparedOptions);
    return marker;
  }


  return resetMarker;

};
