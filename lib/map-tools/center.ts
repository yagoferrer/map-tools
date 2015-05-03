/*jslint node: true */
/// <reference path="../typings/node.d.ts"/>

class Center {

  constructor(global, that) {
    function pos(lat: number, lng: number) {
      var position;
      if (lat && lng) {
        position = new global.google.maps.LatLng(lat, lng);
      } else {
        position = new global.google.maps.LatLng(that.options.lat, that.options.lng);
      }

      that.instance.setCenter(position);
    }
    return pos;
  }
}

module.exports = Center;
