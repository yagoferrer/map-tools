/*jslint node: true */
"use strict";
module.exports = function (global) {

  /**
   * Creates a new GMaps Plus instance
   * @param options
   * @constructor
   */
  function GMP(options, cb) {
    var that = this;

    this.addMarker = require('map-tools/addMarker')(global, that);
    this.addTopoJson = require('map-tools/addFeature')(global, that).addTopoJson;
    this.addGeoJson = require('map-tools/addFeature')(global, that).addGeoJson;
    this.updateFeature = require('map-tools/updateFeature')(global, that);
    this.addControl = require('map-tools/addControl')(global, that);
    this.updateMarker = require('map-tools/updateMarker')(global, that);
    this.addGroup = require('map-tools/groups')(global, that).addGroup;
    this.updateGroup = require('map-tools/groups')(global, that).updateGroup;
    this.updateMap = require('map-tools/updateMap')(global, that);

    var map = require('map-tools/addMap')(global, that);

    global.onload = map.load(options, cb); // Wait until the DOM is ready before attempting to load the Map

    return this;
  }

  // a GMP Instance
  GMP.prototype.instance = false;

  return GMP;
};
