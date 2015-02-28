
module.exports = function(global, that, type) {

  var orderLookup = {
    ASC: 'top',
    DESC: 'bottom'
  };

  function filter(args, options) {

    var order, limit;
    var dimension = Object.keys(args)[0];
    var query = args[dimension];

    if (that[type].filter[dimension]) {

      order = (options && options.order && orderLookup[options.order]) ?
        orderLookup[options.order]
        : orderLookup[Object.keys(orderLookup)[0]];

      limit = (options && options.limit) ? options.limit : Infinity;

      var result = that[type].filter[dimension].filter(query)[order](limit);

      if (limit == 1) {
        return result[0];
      }

      return result;
    }

    return false;

  }

  return filter;
}
