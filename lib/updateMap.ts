/// <reference path="maps.ts"/>

class UpdateMap {
  'use strict';

  constructor(public that) {}

  public updateMap(args) {
    var mapOptions = Maps.mapOptions(args);
    return this.that.instance.setOptions(mapOptions);
  }

};
