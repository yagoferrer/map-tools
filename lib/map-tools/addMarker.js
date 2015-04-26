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


    addOptions(marker, instance);

    // Adds Marker Reference of each Marker to "markers.all"
    that.markers.all = global.mapTools.maps[that.id].markers.all || {};
    that.markers.all[marker.uid] = instance;

    if (marker.tag) {
      addMarkerByTag(marker, instance);
    }


    return instance;
  }

  function addMarkerByTag(marker, instance) {
    that.markers.tags[marker.tag] = that.markers.tags[marker.tag] || {};
    that.markers.tags[marker.tag][instance.data.uid] = instance;
  }

  function addOptions(marker, instance) {
    if (marker.move) {
      instance.setAnimation(global.google.maps.Animation[marker.move.toUpperCase()]);
    }

    if (marker.infoWindow) {
      infoWindow.addEvents(instance, marker.infoWindow, that.instance);
    }

    if (marker.on) {
      addEvents(marker, instance);
    }


    if (marker.callback) {
      marker.callback(instance);
    }
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
