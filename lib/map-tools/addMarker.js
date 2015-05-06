/*jslint node: true */
var utils = require('map-tools/utils');
var crossfilter = require('crossfilter');

module.exports = function (global, that) {
  'use strict';
  var infoWindow = require('map-tools/infoWindow')(global, that);
  var addFilter = require('map-tools/addFilter')(global, that, 'markers');

  function addExtraOptions(marker, options) {
    var i;
    for (i in options) {
      if (options.hasOwnProperty(i)) {
        if (!options.filters) { // Filters is a special property that we don't need to add to the Marker.
          marker[i] = options[i];
        }
      }
    }
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

  function addMarker(marker, options) {
    marker.map = that.instance;
    marker.position = new global.google.maps.LatLng(marker.lat, marker.lng);


    // Adds options set via 2nd parameter. Overwrites any Marker options already set.
    if (options) {
      addExtraOptions(marker, options);
    }


    marker.data = marker.data || {};
    marker.data._self = marker; // This helps me to do later resetMarker()

    setUid(marker);

    // Because we are not allowing duplicates
    if (that.markers.all[marker.uid]) {
      return false;
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

    if (marker.tags) {
      addMarkerByTag(marker, instance);
    }


    return instance;
  }

  function setUid(marker) {

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
  }

  function addMarkerByTag(marker, instance) {

    if (utils.isArray(marker.tags)) {
      var i, tag;
      for (i in marker.tags) {
        if (marker.tags.hasOwnProperty(i)) {
          tag = marker.tags[i];
          that.markers.tags[tag] = that.markers.tags[tag] || {};
          that.markers.tags[tag][instance.data.uid] = instance;
        }
      }
    } else {
      that.markers.tags[marker.tags] = that.markers.tags[marker.tags] || {};
      that.markers.tags[marker.tags][instance.data.uid] = instance;
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

        that.markers.dataChanged = true;
        return markers;
      }

      return [];
    }

    that.markers.dataChanged = true;
    return addMarker(args, options);
  }

  return addMarkers;

};
