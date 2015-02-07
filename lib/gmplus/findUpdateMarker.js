/*jslint node: true */
"use strict";
module.exports = function (global, that) {

  function updateMarker(marker, options) {
    var setter;

    if (options.custom) {
      if (options.custom.move) {
        marker.setAnimation(options.custom.move);
      }

      if (options.custom.lat && options.custom.lng) {
        marker.setPosition(new global.google.maps.LatLng(options.custom.lat, options.custom.lng));
      }

      if (options.custom.bubble && options.custom.bubble.content) {
        marker.bubble.instance.setContent(options.custom.bubble.content);
      }
    }

    if (options.setters) {
      for (setter in options.setters) {
        if (options.setters.hasOwnProperty(setter)) {
          marker[setter](options.setters[setter]);
        }
      }
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

    if (marker.uid && global.GMP.maps[that.id].markers[marker.uid]) {
      return updateMarker(global.GMP.maps[that.id].markers[marker.uid], options);
    }
  }


  return findAndUpdateMarker;
};
