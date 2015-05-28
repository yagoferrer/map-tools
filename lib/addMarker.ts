/// <reference path="typings/tsd.d.ts"/>

import utils = require('./utils');
import addFilter = require('./addFilter');
import infoWindow = require('./infoWindow');

class AddMarker {
  'use strict';

  private addFilter;
  private infoWindow: any = {};

  private add;


  constructor(public that) {

    var addFilterInstance = new addFilter(that, 'markers');
    this.addFilter = function(filters) {
      return addFilterInstance.addFilter(filters);
    };

    var infoWindowInstance = new infoWindow(that);

    this.infoWindow.addEvents = function(marker, options, map) {
      infoWindowInstance.addEvents(marker, options, map);
    }

  }


  addExtraOptions(marker, options) {
    var i;
    for (i in options) {
      if (options.hasOwnProperty(i)) {
        if (!options.filters) { // Filters is a special property that we don't need to add to the Marker.
          marker[i] = options[i];
        }
      }
    }
  }

  addOptions(marker, instance) {
    if (marker.move) {
      instance.setAnimation(google.maps.Animation[marker.move.toUpperCase()]);
    }

    if (marker.infoWindow) {
      this.infoWindow.addEvents(instance, marker.infoWindow, this.that.instance);
    }

    if (marker.on) {
      this.addEvents(marker, instance);
    }


    if (marker.callback) {
      marker.callback(instance);
    }
  }

  private _addMarker(marker, options): {} {
    marker.map = this.that.instance;
    marker.position = new google.maps.LatLng(marker.lat, marker.lng);


    // Adds options set via 2nd parameter. Overwrites any Marker options already set.
    if (options) {
      this.addExtraOptions(marker, options);
    }


    marker.data = marker.data || {};
    marker.data._self = marker; // This helps me to do later resetMarker()

    this.setUid(marker);

    // Because we are not allowing duplicates
    if (this.that.markers.all[marker.uid]) {
      return false;
    }


    if (options && options.filters) {
      // Only add filters if not defined.
      if (!mapTools.maps[this.that.id].markers.filter) {
        this.addFilter(options.filters);
      }
    }

    var instance = new google.maps.Marker(marker);

    this.that.markers.crossfilter = this.that.markers.crossfilter || this.that.crossfilter([]);
    this.that.markers.filter = this.that.markers.filter || {};
    this.that.markers.crossfilter.add([instance]);


    this.addOptions(marker, instance);

    // Adds Marker Reference of each Marker to "markers.all"
    this.that.markers.all = mapTools.maps[this.that.id].markers.all || {};
    this.that.markers.all[marker.uid] = instance;

    if (marker.tags) {
      this.addMarkerByTag(marker, instance);
    }


    return instance;
  }

  public setUid(marker) {

    if (this.that.uid && marker[this.that.uid]) {
      marker.data.uid = marker[this.that.uid];
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

  addMarkerByTag(marker, instance) {

    if (utils.isArray(marker.tags)) {
      var i, tag;
      for (i in marker.tags) {
        if (marker.tags.hasOwnProperty(i)) {
          tag = marker.tags[i];
          this.that.markers.tags[tag] = this.that.markers.tags[tag] || {};
          this.that.markers.tags[tag][instance.data.uid] = instance;
        }
      }
    } else {
      this.that.markers.tags[marker.tags] = this.that.markers.tags[marker.tags] || {};
      this.that.markers.tags[marker.tags][instance.data.uid] = instance;
    }

  }

  addEvents(marker, instance) {
    var i;
    for (i in marker.on) {
      if (marker.on.hasOwnProperty(i)) {
        google.maps.event.addListener(instance, i, marker.on[i]);
      }
    }
  }

  /**
   * Adds Markers to the Map
   * @param args Array or Markers
   * @param options things like groups etc
   * @returns {Array} all the instances of the markers.
   */
  public addMarker(args, options) {
    if (utils.isArray(args)) {
      if (args.length >= 1) {
        var marker, markers = [];
        for (var i in args) {
          if (args.hasOwnProperty(i)) {
            marker = this._addMarker(args[i], options);
            markers.push(marker);
          }
        }

        this.that.markers.dataChanged = true;
        return markers;
      }

      return [];
    }

    this.that.markers.dataChanged = true;
    return this._addMarker(args, options);
  }

}

export = AddMarker;
