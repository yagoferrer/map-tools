'use strict';

var utils = require('gmplus/utils');
var defaults = require('gmplus/defaults');
var gmaps = require('gmplus/gmaps.js');
var topojson = require('topojson');

'use strict';
module.exports = function(global) {




  /**
   * Creates a new Google Map Instance
   * @param args Arguments to instantiate a Google Maps
   *
   */
  function newMap(args, cb) {

    cb = cb || function(){};

    var mapOptions = utils.clone(args); // To clone Array content

    mapOptions.zoom = args.zoom || defaults.zoom;
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
      global.GMP.maps = GMP.maps || {};
      global.GMP.maps[options.id] = {
        create: function () {
          newMap(this.arguments, cb);
        },
        arguments: options
      };


      if (options.async !== false) {
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


  var customMarkerOptions = ['lat', 'lng', 'move', 'bubble'];


  function _prepareOptions(options, custom)
  {
    var result = {};

    for (var option in options) {
      if (custom.indexOf(option) > -1) {
        result.custom = result.custom || {};
        result.custom[option] = options[option];
      } else {
        result.setters = result.setters || {};
        result.setters['set' + option[0].toUpperCase() + option.slice(1)] = options[option];
      }
    }

    return result;
  }

  /**
   * Transforms flat keys to Setters. For example visible becomes: setVisible.
   * @param options
   * @returns {{count: number, setterKey: *, setters: {}}}
   * @private
   */
  function _findAndUpdateMarker(marker, options)
  {

    if (marker.data && marker.data.uid) {
      return _updateMarker(marker, options);
    } else if (marker.uid && GMP.maps[that.id].markers[marker.uid]) {
      return _updateMarker(GMP.maps[that.id].markers[marker.uid], options);
    }

  }

  function _updateMarker(marker, options) {
    if (options.custom) {
      if (options.custom.move) {
        marker.setAnimation(options.custom.move);
      }

      if (options.custom.lat && options.custom.lng) {
        marker.setPosition(new global.google.maps.LatLng(options.custom.lat, options.custom.lng));
      }

      if (options.custom.bubble && options.custom.bubble.content) {
        marker.bubble.instance.setContent(options.custom.bubble.content);
      }

    }

    if (options.setters) {
      for (var setter in options.setters) {
        marker[setter](options.setters[setter]);
      }
    }
    return marker;
  }


  GMP.prototype.updateMarker = function(args, options) {
    var type = Object.prototype.toString.call(args);
    var _options = _prepareOptions(options, customMarkerOptions);

    if (type === '[object Object]') {
      return _findAndUpdateMarker(args, _options);
    } else if (type === '[object Array]') {
      var marker;
      var results = [], instance;
      for (var x in args) {
        marker = args[x];
        instance = _findAndUpdateMarker(marker, _options);
        results.push(instance);
      }
      return results;
    }

  };



  function _bubble(marker, options) {

    var event = options.event || 'click';

    options.content = options.content.replace(/\{(\w+)\}/g, function(m, variable) {
      return (marker.data[variable]) ? marker.data[variable] : '';
    });

    marker.bubble.instance = new global.google.maps.InfoWindow(options);

    global.google.maps.event.addListener(marker, event, function() {
      marker.bubble.instance.open(that.instance, marker);
    });
  }


  function _addMarker(marker, options)
  {
    marker.map = that.instance;
    marker.position = new global.google.maps.LatLng(marker.lat, marker.lng);

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
    if (group && GMP.maps[that.id].groupOptions && GMP.maps[that.id].groupOptions[group]) {

      for (var j in GMP.maps[that.id].groupOptions[group]) {
        marker[j] = GMP.maps[that.id].groupOptions[group][j];
      }
    }

    marker.data = marker.data || {};

    if (marker.data) {
      marker.data.uid = utils.createUid();
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
      GMP.maps[that.id].groups = GMP.maps[that.id].groups || {};
      GMP.maps[that.id].groups[group] = GMP.maps[that.id].groups[group] || [];
      GMP.maps[that.id].groups[group].push(instance);
    }


    // Adds Marker Reference of each Marker to "markers"
    GMP.maps[that.id].markers = GMP.maps[that.id].markers || {};
    GMP.maps[that.id].markers[marker.data.uid] = instance;


    return instance;
  }


  /**
   * Adds a New Group
   * @param name Name of the Group
   * @param options That Apply to all the Group
   */
  GMP.prototype.addGroup = function(name, options) {
    GMP.maps[that.id].groups = GMP.maps[that.id].groups || [];
    GMP.maps[that.id].groupOptions = GMP.maps[that.id].groupOptions || {};
    GMP.maps[that.id].groupOptions[name] = options;
  };


  /**
   * Updates all the Markers of a Group to have specific Properties
   * @param name
   * @param options
   */
  GMP.prototype.updateGroup = function(name, options) {
    var result = [], instance;
    var _options =  _prepareOptions(options, customMarkerOptions);
    if (GMP.maps[that.id].groups && GMP.maps[that.id].groups[name]) {
      for (var item in GMP.maps[that.id].groups[name]) {
        instance = _findAndUpdateMarker(GMP.maps[that.id].groups[name][item], _options);
        result.push(instance);
      }
    }
    return result;
  };

  //region TopoJSON
  /**
   * Loads a Topo JSON file into a Map
   * @param data The parsed JSON File
   * @param options
   */
  GMP.prototype.loadTopoJson = function(data, options)
  {
    var item, geoJson, features;
    for (var x in options) {
        item = options[x];
        geoJson = topojson.feature(data, data.objects[item.object]);
        features = that.instance.data.addGeoJson(geoJson);
        _addFeatureOptions(features, item);
    }

    return features;
  };

  /**
   * Adds GeoJSON Feature Options like: style
   * @param features
   * @param options
   * @private
   */
  function _addFeatureOptions(features, options) {
    var feature;
    for (var x in features) {
      feature = features[x];
      if (options.style) {
        that.instance.data.overrideStyle(feature, options.style);
      }
    }
  }
  //endregion

  return GMP;

};
