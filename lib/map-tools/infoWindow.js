/*jslint node: true */
"use strict";

var utils = require('map-tools/utils');
var config = require('map-tools/config');

module.exports = function (global, that) {

  var timer = false;

  function infoWindow(map, marker, args)
  {

      if (marker.infoWindow.content) {

        if (marker.infoWindow.content.indexOf('{') > - 1) {
          marker.infoWindow.content = args.content.replace(/\{(\w+)\}/g, function (m, variable) {
            return marker.data[variable] || '';
          });
        }



      }

      var options = utils.clone(args);
      options.content = marker.infoWindow.content;

      that.infoWindow = new global.google.maps.InfoWindow(options);
      that.infoWindow.open(map, marker);

  };

  function open(marker, options, map) {
    close();
    infoWindow(map, marker, options);
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
        if (!that.infoWindow || !isOpen(that.infoWindow)) {
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
  }
}

