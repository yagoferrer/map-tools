/*jslint node: true */
"use strict";
var utils = require('map-tools/utils');
var config = require('map-tools/config');

module.exports = function (global, that) {

  var findMarker = require('map-tools/findMarkerById')(global, that);



  function update(args, options) {

    var visibilityFlag = false;

    var type = Object.prototype.toString.call(args);
    var preparedOptions = utils.prepareOptions(options, config.customMarkerOptions);


    if (preparedOptions.defaults && preparedOptions.defaults.hasOwnProperty('visible') && that.events.indexOf('marker_visibility_changed') > -1) {
      visibilityFlag = true;
    }


    var result;

    if (type === '[object Object]') {
      result = customUpdate(findMarker(args), preparedOptions);
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
      result = results;
    }


    if (visibilityFlag) {
      countVisible();
    }

    return result;

  }

  function countVisible() {

    var x, count = 0;

    for (x in that.markers.all) {
      if (that.markers.all[x].visible) {
        count++;
      }
    }

    global.google.maps.event.trigger(that.instance, 'marker_visibility_changed', count);

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
