/*jslint node: true */
"use strict";
module.exports = function (global) {

  function create(marker, options, map) {
    var openOn = options.openOn || 'click';
    var closeOn = options.closeOn || 'click';

    if (options.content) {
      options.content = options.content.replace(/\{(\w+)\}/g, function (m, variable) {
        return marker.data[variable] || '';
      });
    }

    marker.infoWindow.instance = new global.google.maps.InfoWindow(options);

    global.google.maps.event.addListener(marker, openOn, function () {
      marker.infoWindow.instance.open(map, marker);
    });

    global.google.maps.event.addListener(marker, closeOn, function () {
      marker.infoWindow.instance.close();
    });
  }

  return {
    create: create
  };
};

