var crossfilter = require('crossfilter');

module.exports = function(global, that) {

  function defaultDimension(item) {
    return function(d) {return d[item];};
  }

  function addFilter(type, filters) {

    global.GMP.maps[that.id][type].crossfilter = global.GMP.maps[that.id][type].crossfilter || crossfilter([]);
    global.GMP.maps[that.id][type].filter = global.GMP.maps[that.id][type].filter || {};
    var dimension, item;

    if (typeof filters === 'string') {
      filters = [filters];
    }

    for (dimension in filters) {
      item = filters[dimension];
      if (typeof item === 'string') {
        global.GMP.maps[that.id][type].filter[item] = global.GMP.maps[that.id][type].crossfilter.dimension(defaultDimension(item));
      } else {
        global.GMP.maps[that.id][type].filter[Object.keys(item)[0]] = global.GMP.maps[that.id][type].crossfilter.dimension(item[Object.keys(item)[0]]);
      }
    }
  }

  return addFilter;

};
