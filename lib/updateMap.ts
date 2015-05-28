/// <reference path="maps.ts"/>

import maps = require('./maps');

class UpdateMap {
  'use strict';

  constructor(public that) {}

  public updateMap(args) {
    var mapOptions = maps.mapOptions(args);
    return this.that.instance.setOptions(mapOptions);
  }

}

export = UpdateMap;
