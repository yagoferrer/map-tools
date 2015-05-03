var utils = require('map-tools/utils');
var config = require('map-tools/config');

module.exports = function(global, that) {
  'use strict';

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

    var result;

    if (type === '[object Object]') {
      result = reset(findMarker(args), options);
    }

    if (type === '[object Array]') {
      result = resetBulk(args, options);
    }

    that.markers.dataChanged = true;

    return result;
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
