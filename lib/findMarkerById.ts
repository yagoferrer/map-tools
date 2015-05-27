/// <reference path="typings/tsd.d.ts"/>

class FindMarkerById {
  'use strict';

  constructor(public that) {}

  public find(marker) {
    if (marker.data && marker.data.uid) {
      return marker;
    }

    if (marker.uid && mapTools.maps[this.that.id].markers.all[marker.uid]) {
      return mapTools.maps[this.that.id].markers.all[marker.uid];
    }
  }
}

export = FindMarkerById;
