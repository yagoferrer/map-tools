/*jslint node: true */
"use strict";
var utils = require('map-tools/utils');

module.exports = function (global, that) {
  var infoWindow = require('map-tools/infoWindow')(global, that);
  var addFilter = require('map-tools/addFilter')(global, that);

  function addMarker(marker, options) {
    var i, j, k;
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
          if (!options.filters) { // Filters is a special property that we don't need to add to the Marker.
            marker[i] = options[i];
          }
        }
      }
    }

    // Adds additional options from the Group and overwrites any Marker options already set.
    if (group && that.markers && that.markers.groupOptions && that.markers.groupOptions[group]) {

      for (j in that.markers.groupOptions[group]) {
        if (that.markers.groupOptions[group].hasOwnProperty(j)) {
          marker[j] = that.markers.groupOptions[group][j];
        }
      }
    }

    marker.data = marker.data || {};

    if (marker.data && !marker.data.uid) {
      marker.data.uid = utils.createUid();
    }

    if (options && options.filters) {
      // Only add filters if not defined.
      if (!global.mapTools.maps[that.id].markers.filter) {
        addFilter('markers', options.filters);
      }
      that.markers.crossfilter.add([marker.data]);
    }

    var instance = new global.google.maps.Marker(marker);

    if (marker.move) {
      instance.setAnimation(global.google.maps.Animation[marker.move.toUpperCase()]);
    }

    if (marker.infoWindow) {
      infoWindow.addEvents(instance, marker.infoWindow, that.instance);
    }

    // Add Events
    if (marker.on) {
      for (k in marker.on) {
        if (marker.on.hasOwnProperty(k)) {
          global.google.maps.event.addListener(instance, k, marker.on[k]);
        }
      }
    }


    // Adds Marker Reference to specific Group
    if (group) {
      that.markers.groups = global.mapTools.maps[that.id].markers.groups || {};
      that.markers.groups[group] = global.mapTools.maps[that.id].markers.groups[group] || [];
      that.markers.groups[group].push(instance);
    }


    // Adds Marker Reference of each Marker to "markers"
    that.markers.all = global.mapTools.maps[that.id].markers.all || {};
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
