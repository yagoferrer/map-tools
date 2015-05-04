/*jslint node: true */
/// <reference path="../typings/node.d.ts"/>
module.exports = function(global, that) {

  function pos(lat: number, lng: number): void {
    var position;
    if (lat && lng) {
      position = new global.google.maps.LatLng(lat, lng);
    } else {
      position = new global.google.maps.LatLng(that.options.lat, that.options.lng);
    }

    that.instance.setCenter(position);
  }

  return pos;

};
