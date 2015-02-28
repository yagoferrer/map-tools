'use strict';
module.exports = function(global, that) {


  var orderLookup = {
    ASC: 'top',
    DESC: 'bottom'
  };

  function filterFeature(args, options) {

    var order, limit;
    var dimension = Object.keys(args)[0];
    var query = args[dimension];

    if (that.json.filter[dimension]) {

      order = (options && options.order && orderLookup[options.order]) ?
        orderLookup[options.order]
        : orderLookup[Object.keys(orderLookup)[0]];

      limit = (options && options.limit) ? options.limit : Infinity;

      var result = that.json.filter[dimension].filter(query)[order](limit);

      if (limit == 1) {
        return result[0];
      }

      return result;
    }

    return false;

  }

  return filterFeature;
}
