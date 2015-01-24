/* global window, document */
(function (global) {
  "use strict";
  var defaults = {
    version: '3.exp',
    zoom: 8
  };


  /**
   * Injects Google API Javascript File and adds a callback to load the Google Maps Async.
   * @type {{load: Function}}
   * @private
   *
   * @returns the element appended
   */
  var _googleMapsApi = {
    load: function (args) {
      var version = args.version || defaults.version;
      var script = document.createElement('script');
      script.type = 'text/javascript';
      script.src = '//maps.googleapis.com/maps/api/js?v=' + version +
      '&callback=GMP.maps.' + args.id + '.create';
      return global.document.body.appendChild(script);
    }
  };

  /**
   * Helper to Clone an Object
   * @param o Object to Clone
   * @returns {Array}
   */
  function clone(o) {
    var out, v, key;
    out = Array.isArray(o) ? [] : {};
    for (key in o) {
      v = o[key];
      out[key] = (typeof v === "object") ? clone(v) : v;
    }
    return out;
  }


  /**
   * Creates a new Google Map Instance
   * @param args Arguments to instantiate a Google Maps
   *
   */
  function newMap(args, cb) {
    var mapOptions = clone(args); // To clone Array content

    mapOptions.zoom = args.zoom || defaults.zoom;
    mapOptions.center = new global.google.maps.LatLng(args.lat, args.lng);

    // These are custom properties from GMP API that need to be unset.
    mapOptions.id = undefined;
    mapOptions.lat = undefined;
    mapOptions.lng = undefined;

    that.id = args.id;
    that.instance = new global.google.maps.Map(document.getElementById(args.id), mapOptions);
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
    if (!options || options && typeof options !== 'object') {
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

  var that;

  /**
   * Creates a new GMaps Plus instance
   * @param options
   * @constructor
   */
  function GMP(options, cb) {

    that = this;

    if (validOptions(options, cb)) {
      global.GMP.maps = global.GMP.maps || {};
      global.GMP.maps[options.id] = {
        create: function () {
          newMap(this.arguments, cb);
        },
        arguments: options
      };


      if (options.async !== false) {
        _googleMapsApi.load(options);
      } else {
        global.GMP.maps[options.id].create();
      }
    }

    return this;
  }

  // a GMP Instance
  GMP.prototype.instance = false;

  /**
   * Adds Markers to the Map
   * @param args Array or Markers
   * @param options things like groups etc
   * @returns {Array} all the instances of the markers.
   */
  GMP.prototype.addMarker = function(args, options) {

    var marker;
    var markers = [];

    for (var i in args) {

      marker = args[i];


      marker.map = this.instance;
      marker.position = new google.maps.LatLng(marker.lat, marker.lng);

      marker.lat = undefined;
      marker.lng = undefined;

      global.GMP.maps[this.id].groups = global.GMP.maps[this.id].groups || {};

      var instance = new global.google.maps.Marker(marker);
      markers.push(marker);

      if (options.group) {
        global.GMP.maps[this.id].groups[options.group] = global.GMP.maps[this.id].groups[options.group] || [];
        global.GMP.maps[this.id].groups[options.group].push(instance);

      }
    }

    return markers;

  };

  global.GMP = GMP;

})(this, window);
