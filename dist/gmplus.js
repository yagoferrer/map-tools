/* GMPlus.js 0.1.0 MIT License. 2015 Yago Ferrer <yago.ferrer@gmail.com> */
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

    cb = cb || function(){};

    var mapOptions = clone(args); // To clone Array content

    mapOptions.zoom = args.zoom || defaults.zoom;
    mapOptions.center = new global.google.maps.LatLng(args.lat, args.lng);

    // These are custom properties from GMP API that need to be unset.
    mapOptions.id = undefined;
    mapOptions.lat = undefined;
    mapOptions.lng = undefined;

    that.id = args.id;
    that.options = args;
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

  // Animations
  GMP.prototype.bounce = 1;
  GMP.prototype.drop = 2;

  /**
   * Adds Markers to the Map
   * @param args Array or Markers
   * @param options things like groups etc
   * @returns {Array} all the instances of the markers.
   */
  GMP.prototype.addMarker = function(args, options) {
    if (Object.prototype.toString.call(args) === '[object Array]') {
      var markers = [];
      var marker;
      for (var i in args) {
        marker = _addMarker(args[i], options);
        markers.push(marker);

      }

      return markers;
    }

    if (typeof args === 'object') {
      return _addMarker(args, options);
    }
  };



  GMP.prototype.updateMarker = function(args, options) {
    var s = _createSetters(options);
    if (Object.prototype.toString.call(args) === '[object Array]') {
      var uid, marker;
      for (var item in args) {
        uid = args[item].uid;
        if (global.GMP.maps[that.id].markers[uid]) {
          _updateMarker(global.GMP.maps[that.id].markers[uid], s);
        }
      }
    }
  }

  function _updateMarker(marker, s) {
    if (s.count === 1) { // Looping only when necessary
      _updateMarkerValues(marker,s.setterKey, s.setters[s.setterKey]);
    } else {
      for (var setterKey in s.setters) {
        _updateMarkerValues(marker, setterKey, s.setters[s.setterKey]);
      }
    }
  }

  function _updateMarkerValues(marker, key, value)
  {
    if (key == 'setMove') {
      marker.setAnimation(value);
    } else {
      marker[key](value);
    }
  }

  function _bubble(marker, options) {

    var event = options.event || 'click';

    var infowindow = new google.maps.InfoWindow(options);

    google.maps.event.addListener(marker, event, function() {
      infowindow.open(that.instance, marker);
    });
  }

  function _createUid() {
    return 'xxxxxxxxxxxx4xxxyxxxxxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      var r, v;
      r = Math.random() * 16 | 0;
      v = c === 'x' ? r : r & 0x3 | 0x8;
      return v.toString(16);
    });
  };

  function _addMarker(marker, options)
  {
    marker.map = that.instance;
    marker.position = new google.maps.LatLng(marker.lat, marker.lng);

    var group = marker.group || false;

    if (options && options.group) {
      group = options.group || group;
    }

    // Adds options set via 2nd parameter. Overwrites any Marker options already set.
    if (options) {
      for (var i in options) {
          marker[i] = options[i];
      }
    }

    // Adds additional options from the Group and overwrites any Marker options already set.
    if (group && global.GMP.maps[that.id].groupOptions && global.GMP.maps[that.id].groupOptions[group]) {

      for (var i in global.GMP.maps[that.id].groupOptions[group]) {
        marker[i] = global.GMP.maps[that.id].groupOptions[group][i];
      }
    }

    marker.data = marker.data || {};

    if (marker.data) {
      marker.data.uid = _createUid();
    }

    if (that.options.crossfilter) {
      that.options.crossfilter.add([marker.data]);
    }

    var instance = new global.google.maps.Marker(marker);

    if (marker.move) {
      instance.setAnimation(marker.move);
    }

    if (marker.bubble) {
      _bubble(instance, marker.bubble);
    }


    // Adds Marker Reference to specific Group
    if (group) {
      global.GMP.maps[that.id].groups = global.GMP.maps[that.id].groups || {};
      global.GMP.maps[that.id].groups[group] = global.GMP.maps[that.id].groups[group] || [];
      global.GMP.maps[that.id].groups[group].push(instance);
    }


    // Adds Marker Reference of each Marker to "markers"
    global.GMP.maps[that.id].markers = global.GMP.maps[that.id].markers || {};
    global.GMP.maps[that.id].markers[marker.data.uid] = instance;


    return instance;
  }


  /**
   * Adds a New Group
   * @param name Name of the Group
   * @param options That Apply to all the Group
   */
  GMP.prototype.addGroup = function(name, options) {
    global.GMP.maps[that.id].groups = global.GMP.maps[that.id].groups || [];
    global.GMP.maps[that.id].groupOptions = global.GMP.maps[that.id].groupOptions || {};
    global.GMP.maps[that.id].groupOptions[name] = options;
  }

  /**
   * Transforms flat keys to Setters. For example visible becomes: setVisible.
   * @param options
   * @returns {{count: number, setterKey: *, setters: {}}}
   * @private
   */
  function _createSetters(options)
  {
    var setters = {};
    var count = 0;
    var setterKey;


    for (var key in options) {
      setterKey = 'set' + key[0].toUpperCase() + key.slice(1);
      setters[setterKey] = options[key];
      count++;
    }

    var result = {
      count: count,
      setterKey: setterKey,
      setters: setters
    };

    return result;
  }

  /**
   * Updates all the Markers of a Group to have specific Properties
   * @param name
   * @param options
   */
  GMP.prototype.updateGroup = function(name, options) {
    var s = _createSetters(options);
    if (global.GMP.maps[that.id].groups && global.GMP.maps[that.id].groups[name]) {
      for (var item in global.GMP.maps[that.id].groups[name]) {
        _updateMarker(global.GMP.maps[that.id].groups[name][item], s);
      }
    }
  }

  global.GMP = GMP;

})(this, window);
