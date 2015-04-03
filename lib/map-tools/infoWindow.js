/*jslint node: true */
"use strict";
module.exports = function (global, that) {



  function infoWindow(marker, options)
  {
    if (!marker.infoWindow.instance) {
      if (options.content) {
        options.content = options.content.replace(/\{(\w+)\}/g, function (m, variable) {
          return marker.data[variable] || '';
        });
      }

       marker.infoWindow.instance = new global.google.maps.InfoWindow(options);
    }

    that.infoWindow = marker.infoWindow.instance;
  }

  function open(marker, options, map) {
    if (that.infoWindow && isOpen(that.infoWindow)) {
      that.infoWindow.close();
    }
    infoWindow(marker, options);
    marker.infoWindow.instance.open(map, marker)
  }
  function isOpen(infoWindow){
    var map = infoWindow.getMap();
    return (map !== null && typeof map !== "undefined");
  }

  function create(marker, options, map) {
    var openOn = options.openOn || 'click';
    var closeOn = options.closeOn || 'click';

    // Toggle Effect when using the same method to Open and Close.
    if (openOn === closeOn) {
      global.google.maps.event.addListener(marker, openOn, function () {

        if (!marker.infoWindow.instance || !isOpen(marker.infoWindow.instance)) {

          open(marker, options, map);

        } else {
          marker.infoWindow.instance.close();
        }
      });

    } else {
      global.google.maps.event.addListener(marker, openOn, function () {
        open(marker, options, map);
      });

      global.google.maps.event.addListener(marker, closeOn, function () {
        marker.infoWindow.instance.close();
      });
    }
  }

  return {
    create: create
  };
};

