'use strict';

var defaults = require('gmplus/defaults');

/**
 * Injects Google API Javascript File and adds a callback to load the Google Maps Async.
 * @type {{load: Function}}
 * @private
 *
 * @returns the element appended
 */
function load (args) {
  var version = args.version || defaults.version;
  var script = global.window.document.createElement('script');
  script.type = 'text/javascript';
  script.src = '//maps.googleapis.com/maps/api/js?v=' + version +
  '&callback=GMP.maps.' + args.id + '.create';
  var result = global.window.document.body.appendChild(script);
  return result;
}

module.exports = {
  load: load
}
