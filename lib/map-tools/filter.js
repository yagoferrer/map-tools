var utils = require('map-tools/utils');

module.exports = function(global, that, type) {

  var addFilter = require('map-tools/addFilter')(global, that, type);

  var orderLookup = {
    ASC: 'top',
    DESC: 'bottom'
  };

  // cf has it's own state, for each dimension
  // before each new filtering we need to clear this state
  function clearAll(dimensionSet){
    var i, dimension;
    for (i in dimensionSet){

      if (dimensionSet.hasOwnProperty(i)) {
        dimension = dimensionSet[i];

        dimension.filterAll();
      }
    }
  }

  function filterByTag(query) {

    if (that[type].tags[query]) {
      return utils.toArray(that[type].tags[query]);
    } else {
      return [];
    }
  }


  function filter(args, options) {

    // Return All items if no arguments are supplied
    if (typeof args === 'undefined' && typeof options === 'undefined') {
      return utils.toArray(that[type].all);
    }


    var dimension, order, limit, query;

    if (typeof args === 'string') {
      dimension = args;
    } else {
      dimension = Object.keys(args)[0];
      query = args[dimension];

      if (dimension === 'tag') {
        return filterByTag(query);
      }

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

      clearAll(that[type].filter);

      var result = that[type].filter[dimension].filter(query)[order](limit);



      if (limit === 1) {
        return result[0];
      }


      return result;

  }

  return filter;
};
