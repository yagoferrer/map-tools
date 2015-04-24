"use strict";

module.exports = function(global, that) {

  function find(marker) {
    if (marker.data && marker.data.uid) {
      return marker;
    }

    if (marker.uid && global.mapTools.maps[that.id].markers.all[marker.uid]) {
      return global.mapTools.maps[that.id].markers.all[marker.uid];
    }
  }

  return find;
};
