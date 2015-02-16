/*jslint node: true */
"use strict";
var utils = require('gmplus/utils');

module.exports = function (global, that) {

  var gmaps = require('gmplus/gmaps.js')(global);


  /**
   * Creates a new Google Map Instance
   * @param args Arguments to instantiate a Google Maps
   *
   */

  function getElement(args) {

    if (args.el) {
      return global.document.querySelector(args.el);
    }

    if (args.id) {
      return global.document.getElementById(args.id);
    }

  }

  function create(args, cb) {

    cb = cb || function () {};

    var mapOptions = gmaps.mapOptions(args);

    args.id = args.id || args.el.substring(1);
    that.id = args.id;
    that.options = args;
    that.instance = new global.google.maps.Map(getElement(args), mapOptions);

    global.GMP.maps[that.id].instance = that.instance;

    global.google.maps.event.addListenerOnce(that.instance, 'idle', function (){
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

    if (!options.id && !options.el) {
      cb(new Error('You must pass an "id" or a "el" property values'));
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

      var id = options.id || options.el.substring(1);

      global.GMP.maps = global.GMP.maps || {};
      global.GMP.maps[id] = {
        create: function () {
          create(this.arguments, cb);
        },
        arguments: options
      };


      global.GMP.maps[id].markers = global.GMP.maps[id].markers || {};
      that.markers = global.GMP.maps[id].markers;


      if (options.async !== false || options.sync === true) {
        gmaps.load(id, options);
      } else {
        global.GMP.maps[id].create();
      }
    }
  }

  return {
    load: load
  };

};
