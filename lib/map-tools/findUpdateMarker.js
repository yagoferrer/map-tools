/*jslint node: true */
"use strict";
module.exports = function (global, that) {

  function updateMarker(marker, options) {

    if (options.custom) {
      if (options.custom.move) {
        marker.setAnimation(global.google.maps.Animation[options.custom.move.toUpperCase()]);
      }

      if (options.custom.lat && options.custom.lng) {
        marker.setPosition(new global.google.maps.LatLng(options.custom.lat, options.custom.lng));
      }

      if (options.custom.infoWindow && options.custom.infoWindow.content) {
        marker.infoWindow.instance.setContent(options.custom.infoWindow.content);
      }
    }

    if (options.defaults) {
      marker.setOptions(options.defaults);
    }

    return marker;
  }
  /**
   * Transforms flat keys to Setters. For example visible becomes: setVisible.
   * @param options
   * @returns {{count: number, setterKey: *, setters: {}}}
   * @private
   */
  function findAndUpdateMarker(marker, options) {
    if (marker.data && marker.data.uid) {
      return updateMarker(marker, options);
    }

    if (marker.uid && global.GMP.maps[that.id].markers.all[marker.uid]) {
      return updateMarker(global.GMP.maps[that.id].markers.all[marker.uid], options);
    }
  }


  return findAndUpdateMarker;
};
