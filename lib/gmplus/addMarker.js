/*jslint node: true */
"use strict";
var utils = require('gmplus/utils');

module.exports = function (global, that) {
  var bubble = require('gmplus/bubble')(global);

  function _addMarker(marker, options) {
    var i;
    marker.map = that.instance;
    marker.position = new global.google.maps.LatLng(marker.lat, marker.lng);

    var group = marker.group || false;

    if (options && options.group) {
      group = options.group || group;
    }

    // Adds options set via 2nd parameter. Overwrites any Marker options already set.
    if (options) {
      for (i in options) {
        if (options.hasOwnProperty(i)) {
          marker[i] = options[i];
        }
      }
    }

    // Adds additional options from the Group and overwrites any Marker options already set.
    if (group && GMP.maps[that.id].groupOptions && GMP.maps[that.id].groupOptions[group]) {

      for (var j in GMP.maps[that.id].groupOptions[group]) {
        marker[j] = GMP.maps[that.id].groupOptions[group][j];
      }
    }

    marker.data = marker.data || {};

    if (marker.data) {
      marker.data.uid = utils.createUid();
    }

    if (that.options.crossfilter) {
      that.options.crossfilter.add([marker.data]);
    }

    var instance = new global.google.maps.Marker(marker);

    if (marker.move) {
      instance.setAnimation(marker.move);
    }

    if (marker.bubble) {
      bubble.create(instance, marker.bubble, that.instance);
    }


    // Adds Marker Reference to specific Group
    if (group) {
      GMP.maps[that.id].groups = GMP.maps[that.id].groups || {};
      GMP.maps[that.id].groups[group] = GMP.maps[that.id].groups[group] || [];
      GMP.maps[that.id].groups[group].push(instance);
    }


    // Adds Marker Reference of each Marker to "markers"
    GMP.maps[that.id].markers = GMP.maps[that.id].markers || {};
    GMP.maps[that.id].markers[marker.data.uid] = instance;


    return instance;
  }


  /**
   * Adds Markers to the Map
   * @param args Array or Markers
   * @param options things like groups etc
   * @returns {Array} all the instances of the markers.
   */
  function addMarker(args, options) {
    if (args.length && args.length >= 1) {
      var markers = [];
      var marker;
      for (var i in args) {
        marker = _addMarker(args[i], options);
        markers.push(marker);

      }

      return markers;
    }

    return _addMarker(args, options);
  };

  return addMarker;

};
