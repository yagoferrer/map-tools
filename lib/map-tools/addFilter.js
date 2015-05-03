var crossfilter = require('crossfilter');

var utils = require('map-tools/utils');

module.exports = function(global, that, type) {
  'use strict';


  function addFilter(filters) {

    that[type].crossfilter = that[type].crossfilter || crossfilter([]);
    that[type].filter = that[type].filter || {};

    var dimension, item;

    if (typeof filters === 'string') {
      filters = [filters];
    }

    for (dimension in filters) {
      if (filters.hasOwnProperty(dimension)) {
        item = filters[dimension];
        if (typeof item === 'string') {
          that[type].filter[item] = that[type].crossfilter.dimension(utils.defaultDimension(item));
        } else {
          that[type].filter[Object.keys(item)[0]] = that[type].crossfilter.dimension(item[Object.keys(item)[0]]);
        }
      }
    }
  }

  return addFilter;

};
