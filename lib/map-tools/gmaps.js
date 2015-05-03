/*jslint node: true */
var config = require('map-tools/config');
var utils = require('map-tools/utils');

module.exports = function (global) {
  'use strict';

  /**
   * Injects Google API Javascript File and adds a callback to load the Google Maps Async.
   * @type {{load: Function}}
   * @private
   *
   * @returns the element appended
   */
  function load(id, args) {
    var version = args.version || config.version;
    var script = global.document.createElement('script');
    script.type = 'text/javascript';
    script.src = config.url + '?v=' + version + '&callback=mapTools.maps.' + id + '.create';
    return global.document.body.appendChild(script);
  }

  function mapOptions(args) {
    // To clone Arguments excluding customMapOptions
    var result = utils.clone(args, config.customMapOptions);
    result.zoom = args.zoom || config.zoom;
    if (args.lat && args.lng) {
      result.center = new global.google.maps.LatLng(args.lat, args.lng);
    }
    if (args.type) {
      result.mapTypeId = global.google.maps.MapTypeId[args.type] || false;
    }

    return result;
  }

  return {
    load: load,
    mapOptions: mapOptions
  };
};
