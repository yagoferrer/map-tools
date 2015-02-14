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
    if (group && that.markers && that.markers.groupOptions && that.markers.groupOptions[group]) {

      for (var j in that.markers.groupOptions[group]) {
        marker[j] = that.markers.groupOptions[group][j];
      }
    }

    marker.data = marker.data || {};

    if (marker.data) {
      marker.data.uid = utils.createUid();
    }

    if (that.options.filters) {
      that.markers.crossfilter.add([marker.data]);
    }

    var instance = new global.google.maps.Marker(marker);

    if (marker.move) {
      instance.setAnimation(global.google.maps.Animation[marker.move.toUpperCase()]);
    }

    if (marker.bubble) {
      bubble.create(instance, marker.bubble, that.instance);
    }


    // Adds Marker Reference to specific Group
    if (group) {
      that.markers.groups = global.GMP.maps[that.id].markers.groups || {};
      that.markers.groups[group] = global.GMP.maps[that.id].markers.groups[group] || [];
      that.markers.groups[group].push(instance);
    }


    // Adds Marker Reference of each Marker to "markers"
    that.markers.all = global.GMP.maps[that.id].markers.all || {};
    that.markers.all[marker.data.uid] = instance;


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
