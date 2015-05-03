module.exports = function(global, that) {
  'use strict';

  var findMarker = require('map-tools/findMarkerById')(global, that);

  function removeBulk(args) {
    var marker, x;
    for (x in args) {
      if (args.hasOwnProperty(x)) {
        marker = args[x];
        remove(findMarker(marker));
      }
    }
  }

  function removeMarker(args) {

    if (typeof args === 'undefined') {
      removeBulk(that.markers.all);
    }

    var type = Object.prototype.toString.call(args);

    if (type === '[object Object]') {
      return remove(findMarker(args));
    }

    if (type === '[object Array]') {
      removeBulk(args);
    }
  }

  function remove(marker) {
    marker.setMap(null);
    delete global.mapTools.maps[that.id].markers.all[marker.data.uid];
  }

  return removeMarker;

};
