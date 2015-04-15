/*jslint node: true */
"use strict";

var utils = require('map-tools/utils');
var config = require('map-tools/config');

module.exports = function (global, that) {

  var timer = false;

  function infoWindow(marker, options)
  {
    if (!marker.infoWindow.instance) {
      if (options.content) {
        options.content = options.content.replace(/\{(\w+)\}/g, function (m, variable) {
          return marker.data[variable] || '';
        });

        marker.infoWindow.content = options.content;
      }

       marker.infoWindow.instance = new global.google.maps.InfoWindow(options);
    }

    that.infoWindow = marker.infoWindow.instance;
  }

  function open(marker, options, map) {
    close();
    infoWindow(marker, options);
    marker.infoWindow.instance.open(map, marker);
  }
  function isOpen(infoWindow){
    var map = infoWindow.getMap();
    return (map !== null && typeof map !== "undefined");
  }

  function close() {

    clearTimeout(timer);
    if (that.infoWindow && isOpen(that.infoWindow)) {
      that.infoWindow.close();
    }
  }

  function addEvents(marker, options, map) {

    var args = utils.prepareOptions(options, config.customInfoWindowOptions);
    var openOn = (args.custom && args.custom.open && args.custom.open.on) ?  args.custom.open.on : 'click';
    var closeOn = (args.custom && args.custom.close && args.custom.close.on) ? args.custom.close.on : 'click';


    // Toggle Effect when using the same method to Open and Close.
    if (openOn === closeOn) {
      global.google.maps.event.addListener(marker, openOn, function () {
        if (!marker.infoWindow.instance || !isOpen(marker.infoWindow.instance)) {
          open(marker, args.defaults, map);
        } else {
          close();
        }
      });

    } else {

      global.google.maps.event.addListener(marker, openOn, function () {
        open(marker, args.defaults, map);
      });


      global.google.maps.event.addListener(marker, closeOn, function () {
        if (args.custom.close.duration) {
          timer = setTimeout(function(){
            close();
          }, args.custom.close.duration);
        } else {
          close();
        }
      });
    }
  }

  return {
    addEvents: addEvents
  };
};

