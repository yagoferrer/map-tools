/*jslint node: true */
"use strict";
var utils = require('gmplus/utils');

module.exports = function (global, that) {
  var bubble = require('gmplus/bubble')(global);

  function addMarker(marker, options) {
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
    if (group && global.GMP.maps[that.id].markers.groupOptions && global.GMP.maps[that.id].markers.groupOptions[group]) {

      for (var j in global.GMP.maps[that.id].markers.groupOptions[group]) {
        marker[j] = global.GMP.maps[that.id].markers.groupOptions[group][j];
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

    global.GMP.maps[that.id].markers = global.GMP.maps[that.id].markers || {};

    // Adds Marker Reference to specific Group
    if (group) {
      global.GMP.maps[that.id].markers.groups = global.GMP.maps[that.id].markers.groups || {};
      global.GMP.maps[that.id].markers.groups[group] = global.GMP.maps[that.id].markers.groups[group] || [];
      global.GMP.maps[that.id].markers.groups[group].push(instance);
    }


    // Adds Marker Reference of each Marker to "markers"
    global.GMP.maps[that.id].markers.all = global.GMP.maps[that.id].markers.all || {};
    global.GMP.maps[that.id].markers.all[marker.data.uid] = instance;


    return instance;
  }


  /**
   * Adds Markers to the Map
   * @param args Array or Markers
   * @param options things like groups etc
   * @returns {Array} all the instances of the markers.
   */
  function addMarkers(args, options) {
    if (args.length && args.length >= 1) {
      var markers = [];
      var marker;
      for (var i in args) {
        marker = addMarker(args[i], options);
        markers.push(marker);

      }

      return markers;
    }

    return addMarker(args, options);
  };

  return addMarkers;

};
