/*jslint node: true */
"use strict";
var utils = require('map-tools/utils');
var config = require('map-tools/config');

module.exports = function (global, that) {


  function update(args, options) {
    var type = Object.prototype.toString.call(args);
    var preparedOptions = utils.prepareOptions(options, config.customMarkerOptions);

    if (type === '[object Object]') {
      return customUpdate(find(args), preparedOptions);
    }
    if (type === '[object Array]') {
      var marker, results = [], instance, x;
      for (x in args) {
        if (args.hasOwnProperty(x)) {
          marker = args[x];
          instance = customUpdate(find(marker), preparedOptions);
          results.push(instance);
        }
      }
      return results;
    }
  }


  function find(marker) {
    if (marker.data && marker.data.uid) {
      return marker;
    }

    if (marker.uid && global.mapTools.maps[that.id].markers.all[marker.uid]) {
      return global.mapTools.maps[that.id].markers.all[marker.uid];
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
        marker.infoWindow.instance.setContent(options.custom.infoWindow.content);
      }
    }

    if (options.defaults) {
      marker.setOptions(options.defaults);
    }

    return marker;
  }

  return {
    update: update,
    customUpdate: customUpdate,
    find: find
  }

};
