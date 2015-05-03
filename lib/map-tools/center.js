/*jslint node: true */
module.exports = function (global, that) {
  'use strict';

  function center(lat, lng) {
    var position;
    if (lat && lng) {
      position = new global.google.maps.LatLng(lat, lng);
    } else {
      position = new global.google.maps.LatLng(that.options.lat, that.options.lng);
    }

    that.instance.setCenter(position);
  }

  return center;
};
