/// <reference path="typings/tsd.d.ts"/>
class ResetMarker {
  'use strict';

  findMarker;
  updateMarker;

  private utils = require('./utils');
  private config = require('./config');

  constructor(public that) {

    var findMarker = require('./findMarkerById')(that);
    this.findMarker = function(marker) {
      return findMarker.find(marker);
    };

    this.updateMarker = require('./updateMarker')(that);

  }

  private resetBulk(markers, options) {
    var x;
    for (x in markers) {
      if (markers.hasOwnProperty(x)) {
        this.reset(markers[x], options);
      }
    }
  }


  public resetMarker(args, options) {
    var type = Object.prototype.toString.call(args);

    var result;

    if (type === '[object Object]') {
      result = this.reset(this.findMarker(args), options);
    }

    if (type === '[object Array]') {
      result = this.resetBulk(args, options);
    }

    this.that.markers.dataChanged = true;

    return result;
  }

  private formatOptions(marker, options) {
    var key, op = {};
    var type = Object.prototype.toString.call(options);

    if (type === '[object String]') {
      op[options] = marker.data._self[options];
    }

    if (type === '[object Array]') {
      for (key in options) {
        if (options.hasOwnProperty(key)) {
          op[options[key]] = marker.data._self[options[key]];
        }
      }
    }

    return op;
  }

  private reset(marker, options) {
    var preparedOptions = this.utils.prepareOptions(this.formatOptions(marker, options), this.config.customMarkerOptions);
    this.updateMarker.customUpdate(marker, preparedOptions);
    return marker;
  }

}

export = ResetMarker;
