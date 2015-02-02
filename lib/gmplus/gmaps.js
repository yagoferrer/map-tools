/*jslint node: true */
"use strict";

var config = require('gmplus/config');

/**
 * Injects Google API Javascript File and adds a callback to load the Google Maps Async.
 * @type {{load: Function}}
 * @private
 *
 * @returns the element appended
 */
function load(args) {
  var version = args.version || config.version;
  var script = global.window.document.createElement('script');
  script.type = 'text/javascript';
  script.src = '//maps.googleapis.com/maps/api/js?v=' + version + '&callback=GMP.maps.' + args.id + '.create';
  return global.window.document.body.appendChild(script);
}

module.exports = {
  load: load
};
