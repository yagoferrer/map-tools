/*jslint node: true */
"use strict";
var utils = require('map-tools/utils');
var crossfilter = require('crossfilter');

module.exports = function (global, that) {
  var infoWindow = require('map-tools/infoWindow')(global, that);
  var addFilter = require('map-tools/addFilter')(global, that, 'markers');

  function addMarker(marker, options) {

    var i, j;
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

    marker.data = marker.data || {};

    marker.data._self = marker;

    // Adds additional options from the Group and overwrites any Marker options already set.
    if (group && that.markers && that.markers.groupOptions && that.markers.groupOptions[group]) {

      for (j in that.markers.groupOptions[group]) {
        if (that.markers.groupOptions[group].hasOwnProperty(j)) {
          marker[j] = that.markers.groupOptions[group][j];
        }
      }
    }


    if (that.uid && marker[that.uid]) {
      marker.data.uid = marker[that.uid];
      marker.uid = marker.data.uid;
    }

    if (marker.data.uid && !marker.uid) {
      marker.uid = marker.data.uid;
    }


    if (!marker.uid) {
      marker.data.uid = utils.createUid();
      marker.uid = marker.data.uid;
    }


    if (options && options.filters) {
      // Only add filters if not defined.
      if (!global.mapTools.maps[that.id].markers.filter) {
        addFilter(options.filters);
      }
    }

    var instance = new global.google.maps.Marker(marker);

    that.markers.crossfilter = that.markers.crossfilter || crossfilter([]);
    that.markers.filter = that.markers.filter || {};
    that.markers.crossfilter.add([instance]);


    if (marker.move) {
      instance.setAnimation(global.google.maps.Animation[marker.move.toUpperCase()]);
    }

    if (marker.infoWindow) {
      infoWindow.addEvents(instance, marker.infoWindow, that.instance);
    }

    if (marker.on) {
      addEvents(marker, instance);
    }

    if (group) {
      addToGroup(group, instance);
    }

    if (marker.callback) {
      marker.callback(instance);
    }

    // Adds Marker Reference of each Marker to "markers.all"
    that.markers.all = global.mapTools.maps[that.id].markers.all || {};
    that.markers.all[marker.uid] = instance;

    return instance;
  }

  // Add Events
  function addEvents(marker, instance) {
    var i;
    for (i in marker.on) {
      if (marker.on.hasOwnProperty(i)) {
        global.google.maps.event.addListener(instance, i, marker.on[i]);
      }
    }
  }

  // Adds Marker Reference to specific Group
  function addToGroup(group, instance) {
    that.markers.groups = global.mapTools.maps[that.id].markers.groups || {};
    that.markers.groups[group] = global.mapTools.maps[that.id].markers.groups[group] || [];
    that.markers.groups[group].push(instance);
  }


  /**
   * Adds Markers to the Map
   * @param args Array or Markers
   * @param options things like groups etc
   * @returns {Array} all the instances of the markers.
   */
  function addMarkers(args, options) {
    if (utils.isArray(args)) {
      if (args.length >= 1) {
        var marker, markers = [];
        for (var i in args) {
          if (args.hasOwnProperty(i)) {
            marker = addMarker(args[i], options);
            markers.push(marker);
          }
        }

        return markers;
      }

      return [];
    }

    return addMarker(args, options);
  }

  return addMarkers;

};
