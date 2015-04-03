/*jslint node: true */
"use strict";
module.exports = function (global, that) {

  function create(marker, options, map) {
    var openOn = options.openOn || 'click';
    var closeOn = options.closeOn || 'click';


    global.google.maps.event.addListener(marker, openOn, function () {

      if (that.infoWindow) {
        that.infoWindow.close();
        that.infoWindow = false;
      }

      if (!marker.infoWindow.instance) {

        if (options.content) {
          options.content = options.content.replace(/\{(\w+)\}/g, function (m, variable) {
            return marker.data[variable] || '';
          });
        }

        marker.infoWindow.instance = new global.google.maps.InfoWindow(options);

      }

      marker.infoWindow.instance.open(map, marker);

      that.infoWindow = marker.infoWindow.instance;
    });

    global.google.maps.event.addListener(marker, closeOn, function () {
      marker.infoWindow.instance.close();
      that.infoWindow = false;
    });
  }

  return {
    create: create
  };
};

