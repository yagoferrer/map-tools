/*jslint node: true */
"use strict";
var utils = require('map-tools/utils');
var config = require('map-tools/config');

module.exports = function (global, that) {

  var findMarker = require('map-tools/findMarker')(global, that);

  function update(args, options) {
    var type = Object.prototype.toString.call(args);
    var preparedOptions = utils.prepareOptions(options, config.customMarkerOptions);

    if (type === '[object Object]') {
      return customUpdate(findMarker(args), preparedOptions);
    }
    if (type === '[object Array]') {
      var marker, results = [], instance, x;
      for (x in args) {
        if (args.hasOwnProperty(x)) {
          marker = args[x];
          instance = customUpdate(findMarker(marker), preparedOptions);
          results.push(instance);
        }
      }
      return results;
    }
  }


  function customUpdate(marker, options) {

    if (options.custom) {
      if (options.custom.move) {
        marker.setAnimation(global.google.maps.Animation[options.custom.move.toUpperCase()]);
      }

      if (options.custom.lat && options.custom.lng) {
        marker.setPosition(new global.google.maps.LatLng(options.custom.lat, options.custom.lng));
      }

      if (options.custom.infoWindow && options.custom.infoWindow.content) {
        marker.infoWindow.content = options.custom.infoWindow.content;
      }
    }

    if (options.defaults) {
      marker.setOptions(options.defaults);
    }

    return marker;
  }

  return {
    update: update,
    customUpdate: customUpdate
  }

};
