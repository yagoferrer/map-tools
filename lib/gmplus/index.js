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

    this.addMarker = require('gmplus/addMarker')(global, that);
    this.loadTopoJson = require('gmplus/topojson')(global, that);
    this.addGeoJson = require('gmplus/geojson')(global, that);
    this.updateMarker = require('gmplus/updateMarker')(global, that);
    this.addGroup = require('gmplus/groups')(global, that).addGroup;
    this.updateGroup = require('gmplus/groups')(global, that).updateGroup;
    this.updateMap = require('gmplus/updateMap')(global, that);

    var map = require('gmplus/addMap')(global, that);

    global.onload = map.load(options, cb); // Wait until the DOM is ready before attempting to load the Map

    return this;
  }

  // a GMP Instance
  GMP.prototype.instance = false;

  // Animations
  GMP.prototype.bounce = 1;
  GMP.prototype.drop = 2;

  return GMP;
};
