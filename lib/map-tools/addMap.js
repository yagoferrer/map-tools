/*jslint node: true */
var config = require('map-tools/config');

module.exports = function (global, that) {
  'use strict';

  var gmaps = require('map-tools/gmaps.js')(global);


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
    that.events = [];

    // Add Events
    if (args.on) {
      var i;
      for (i in args.on) {
        if (args.on.hasOwnProperty(i)) {

          if (config.customEvents.indexOf(i) > - 1) {
            that.events.push(i);
          }

          global.google.maps.event.addListener(that.instance, i, args.on[i]);

        }
      }
    }


    that.infoWindow = false;
    that.templates = {
      infoWindow: {},
      panel: {}
    };

    that.uid = args.uid;

    global.mapTools.maps[that.id].instance = that.instance;

    global.google.maps.event.addListenerOnce(that.instance, 'idle', function (){
      cb(false, that);
    });
  }
  /**
   * Validates mapTools Options
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

      global.mapTools.maps = global.mapTools.maps || {};

      if (global.mapTools.maps[id]) {
        var msg = 'There is already another Map using the same id: ' + id;

        cb(new Error(msg));
        return false;

      }
      global.mapTools.maps[id] = {
        create: function () {
          create(this.arguments, cb);
        },
        arguments: options
      };

      // Set Global Structure
      global.mapTools.maps[id].markers = global.mapTools.maps[id].markers || {all: {}, tags: {}, dataChanged: false};
      global.mapTools.maps[id].json = global.mapTools.maps[id].json || {all: {}, dataChanged: false};

      that.markers = global.mapTools.maps[id].markers;
      that.json = global.mapTools.maps[id].json;



      if (options.async !== false || options.sync === true) {
        gmaps.load(id, options);
      } else {
        global.mapTools.maps[id].create();
      }
    }
  }

  return {
    load: load
  };

};
