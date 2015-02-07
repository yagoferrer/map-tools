"use strict";
module.exports = function (global, that) {

  var gmaps = require('gmplus/gmaps.js')(global);

  function updateMap(args) {
    var mapOptions = gmaps.mapOptions(args);
    return that.instance.setOptions(mapOptions);
  }

  return updateMap;
};
