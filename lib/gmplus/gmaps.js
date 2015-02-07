/*jslint node: true */
"use strict";

var config = require('gmplus/config');
var utils = require('gmplus/utils');

module.exports = function (global) {

  /**
   * Injects Google API Javascript File and adds a callback to load the Google Maps Async.
   * @type {{load: Function}}
   * @private
   *
   * @returns the element appended
   */
  function load(args) {
    var version = args.version || config.version;
    var script = global.document.createElement('script');
    script.type = 'text/javascript';
    script.src = '//maps.googleapis.com/maps/api/js?v=' + version + '&callback=GMP.maps.' + args.id + '.create';
    return global.document.body.appendChild(script);
  }

  function mapOptions(args) {
    // To clone Arguments excluding customMapOptions
    var mapOptions = utils.clone(args, config.customMapOptions);
    mapOptions.zoom = args.zoom || config.zoom;
    if (args.lat && args.lng) {
      mapOptions.center = new global.google.maps.LatLng(args.lat, args.lng);
    }
    if (args.type) {
      mapOptions.mapTypeId = global.google.maps.MapTypeId[args.type] || false;
    }

    return mapOptions;
  }

  return {
    load: load,
    mapOptions: mapOptions
  };
};
