
module.exports = function (global, that) {
  'use strict';
  
  var gmaps = require('map-tools/gmaps.js')(global);

  function updateMap(args) {
    var mapOptions = gmaps.mapOptions(args);
    return that.instance.setOptions(mapOptions);
  }

  return updateMap;
};
