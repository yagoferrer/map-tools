/// <reference path="typings/tsd.d.ts"/>
export class RemoveMarker {
  'use strict';

  findMarker;

  constructor(public that) {

    var findMarker = require('./findMarkerById')(that);

    this.findMarker = function(marker) {
      return findMarker.find(marker)
    };
  }

  private removeBulk(args) {
    var marker, x;
    for (x in args) {
      if (args.hasOwnProperty(x)) {
        marker = args[x];
        this.remove(this.findMarker(marker));
      }
    }
  }

  public removeMarker(args) {

    if (typeof args === 'undefined') {
      this.removeBulk(this.that.markers.all);
    }

    var type = Object.prototype.toString.call(args);

    if (type === '[object Object]') {
      return this.remove(this.findMarker(args));
    }

    if (type === '[object Array]') {

      this.removeBulk(args);
    }
  }

  private remove(marker) {
    marker.setMap(null);
    delete mapTools.maps[this.that.id].markers.all[marker.data.uid];
  }

}
