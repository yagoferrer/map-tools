/*jslint node: true */
"use strict";
var utils = require('gmplus/utils');
var config = require('gmplus/config');
var gmaps = require('gmplus/gmaps.js');

module.exports = function (global, that) {

  /**
   * Creates a new Google Map Instance
   * @param args Arguments to instantiate a Google Maps
   *
   */
  function create(args, cb) {

    cb = cb || function () {};

    var mapOptions = utils.clone(args); // To clone Array content

    mapOptions.zoom = args.zoom || config.zoom;
    mapOptions.center = new global.google.maps.LatLng(args.lat, args.lng);

    // These are custom properties from GMP API that need to be unset.
    mapOptions.id = undefined;
    mapOptions.lat = undefined;
    mapOptions.lng = undefined;

    that.id = args.id;
    that.options = args;
    that.instance = new global.google.maps.Map(global.document.getElementById(args.id), mapOptions);
    global.GMP.maps[args.id].instance = that.instance;

    global.google.maps.event.addListenerOnce(that.instance, 'idle', function(){
      cb(false, that.instance);
    });
  }

  /**
   * Validates GMP Options
   * @param options to validate
   * @param cb Only used when something goes wrong
   * @returns {boolean} true/false
   */
  function validOptions(options, cb) {
    if (!options || (options && typeof options !== 'object')) {
      cb(new Error('You must pass a valid first parameter: options'));
      return false;
    }

    if (!options.id && !options.class) {
      cb(new Error('You must pass an "id" or a "class" property values'));
      return false;
    }

    if (!options.lat || !options.lng) {
      cb(new Error('You must pass valid "lat" (latitude) and "lng" (longitude) values'));
      return false;
    }

    return true;
  }

  function load(options, cb) {
    if (validOptions(options, cb)) {
      global.GMP.maps = global.GMP.maps || {};
      global.GMP.maps[options.id] = {
        create: function () {
          create(this.arguments, cb);
        },
        arguments: options
      };

      if (options.async !== false || options.sync === true) {
        gmaps.load(options);
      } else {
        global.GMP.maps[options.id].create();
      }
    }
  }

  return {
    load: load
  };

};
