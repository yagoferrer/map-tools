var utils = require('map-tools/utils');

module.exports = function(global, that, type) {

  var addFilter = require('map-tools/addFilter')(global, that, type);

  var orderLookup = {
    ASC: 'top',
    DESC: 'bottom'
  };

  function filter(args, options) {

    // Return All items if no arguments are supplied
    if (typeof args === 'undefined' && typeof options === 'undefined') {
      return utils.toArray(that[type].all);
    };


    var dimension, order, limit, query;

    if (typeof args === 'string') {
      dimension = args;
    } else {
      dimension = Object.keys(args)[0];
      query = args[dimension];
    }

    // Add Crossfilter Dimension if it does not exist.
    if (!that[type].filter[dimension]) {
      addFilter(dimension);
    }

      order = (options && options.order && orderLookup[options.order]) ?
        orderLookup[options.order]
        : orderLookup[Object.keys(orderLookup)[0]];

      limit = (options && options.limit) ? options.limit : Infinity;


      if (typeof query === 'undefined') {
        query = null;
      }

      var finds = that[type].filter[dimension].filter(query)[order](limit);

      //console.log(type, dimension, query, order, limit, finds);

      var result = [], x;

      for (x in finds) {
          result.push(that[type].all[finds[x].uid]);
      }

      if (limit === 1) {
        return result[0];
      }


      return result;

  }

  return filter;
}
