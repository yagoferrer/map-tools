"use strict";
module.exports = function(global, that) {

  var findMarker = require('map-tools/findMarker')(global, that);

  function removeMarker(args) {

    var type = Object.prototype.toString.call(args);

    if (type === '[object Object]') {
      return remove(findMarker(args));
    }

    if (type === '[object Array]') {
      var marker, x;
      for (x in args) {
        if (args.hasOwnProperty(x)) {
          marker = args[x];
          remove(findMarker(marker));
        }
      }
    }
  }

  function remove(marker) {
    marker.setMap(null);
    delete global.mapTools.maps[that.id].markers.all[marker.data.uid];
  }

  return removeMarker;

};
