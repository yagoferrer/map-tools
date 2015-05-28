/// <reference path="typings/tsd.d.ts"/>

import utils = require('./utils');

class AddFilter {

  constructor(public that, public type) {}

  public addFilter(filters) {

    this.that[this.type].crossfilter = this.that[this.type].crossfilter || this.that.crossfilter([]);
    this.that[this.type].filter = this.that[this.type].filter || {};

    var dimension, item;

    if (typeof filters === 'string') {
      filters = [filters];
    }

    for (dimension in filters) {
      if (filters.hasOwnProperty(dimension)) {
        item = filters[dimension];
        if (typeof item === 'string') {
          this.that[this.type].filter[item] = this.that[this.type].crossfilter.dimension(utils.defaultDimension(item));
        } else {
          this.that[this.type].filter[Object.keys(item)[0]] = this.that[this.type].crossfilter.dimension(item[Object.keys(item)[0]]);
        }
      }
    }
}

}

export = AddFilter;
