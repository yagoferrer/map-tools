"use strict";
module.exports = function(global, that) {

  var findMarker = require('map-tools/findMarker')(global, that);

  function removeMarker(args) {

    var type = Object.prototype.toString.call(args);

    if (type === '[object Object]') {
      return findMarker(args).setMap(null);
    }

    if (type === '[object Array]') {
      var marker, x;
      for (x in args) {
        if (args.hasOwnProperty(x)) {
          marker = args[x];
          findMarker(marker).setMap(null);
        }
      }
    }
  }

  return removeMarker;

};
