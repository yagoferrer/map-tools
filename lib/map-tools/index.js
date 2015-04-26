/*jslint node: true */
"use strict";
module.exports = function (global) {

  /**
   * Creates a new GMaps Plus instance
   * @param options
   * @constructor
   */
  function mapTools(options, cb) {
    var that = this;

    this.addMarker = require('map-tools/addMarker')(global, that);
    this.removeMarker = require('map-tools/removeMarker')(global, that);
    this.resetMarker = require('map-tools/resetMarker')(global, that);
    this.addTopoJson = require('map-tools/addFeature')(global, that).addTopoJson;
    this.addGeoJson = require('map-tools/addFeature')(global, that).addGeoJson;
    this.updateFeature = require('map-tools/updateFeature')(global, that);
    this.addPanel = require('map-tools/addPanel')(global, that);
    this.updateMarker = require('map-tools/updateMarker')(global, that).update;
    this.findFeature = require('map-tools/filter')(global, that, 'json');
    this.findMarker = require('map-tools/filter')(global, that, 'markers');
    this.updateMap = require('map-tools/updateMap')(global, that);
    this.center = require('map-tools/center')(global, that);
    this.zoom = zoom;
    this.locate = locate;
    var map = require('map-tools/addMap')(global, that);
    global.onload = map.load(options, cb); // Wait until the DOM is ready before attempting to load the Map
    return this;
  }

  function zoom(zoom) {
    if (typeof zoom === 'undefined') {
      return this.instance.getZoom();
    } else {
      this.instance.setZoom(zoom);
    }
  }

  function locate() {
    var center = this.instance.getCenter();
    return {lat: center.lat(), lng: center.lng()};
  }

  // a mapTools Instance
  mapTools.prototype.instance = false;

  return mapTools;
};
