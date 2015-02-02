var gmaps = require('gmplus/gmaps.js');

module.exports = function(global) {
  'use strict';
  var that;
  var updateMarker;

  /**
   * Creates a new GMaps Plus instance
   * @param options
   * @constructor
   */
  function GMP(options, cb) {
    that = this;

    this.addMarker = require('gmplus/addMarker')(global, that);
    this.loadTopoJson = require('gmplus/topojson')(global, that);
    this.updateMarker = require('gmplus/updateMarker')(global, that);

    var groups = require('gmplus/groups')(global, that);
    this.addGroup = groups.addGroup;
    this.updateGroup = groups.updateGroup;


    var map = require('gmplus/map')(global, that);

    if (map.validOptions(options, cb)) {
      global.GMP.maps = GMP.maps || {};
      global.GMP.maps[options.id] = {
        create: function () {
          map.create(this.arguments, cb);
        },
        arguments: options
      };

      if (options.async !== false || options.sync === true) {
        gmaps.load(options);
      } else {
        global.GMP.maps[options.id].create();
      }
    }

    return this;
  }

  // a GMP Instance
  GMP.prototype.instance = false;


  // Animations
  GMP.prototype.bounce = 1;
  GMP.prototype.drop = 2;

  return GMP;

};
