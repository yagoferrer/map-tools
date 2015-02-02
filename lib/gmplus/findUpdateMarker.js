module.exports = function(global, that) {
  /**
   * Transforms flat keys to Setters. For example visible becomes: setVisible.
   * @param options
   * @returns {{count: number, setterKey: *, setters: {}}}
   * @private
   */
  function findAndUpdateMarker(marker, options)
  {

    if (marker.data && marker.data.uid) {
      return _updateMarker(marker, options);
    } else if (marker.uid && GMP.maps[that.id].markers[marker.uid]) {
      return _updateMarker(GMP.maps[that.id].markers[marker.uid], options);
    }

  }

  function _updateMarker(marker, options) {
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
      for (var setter in options.setters) {
        marker[setter](options.setters[setter]);
      }
    }
    return marker;
  }

  return findAndUpdateMarker;
}
