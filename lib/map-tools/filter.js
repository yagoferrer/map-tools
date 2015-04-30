var utils = require('map-tools/utils');

module.exports = function(global, that, type) {

  var addFilter = require('map-tools/addFilter')(global, that, type);

  var orderLookup = {
    ASC: 'top',
    DESC: 'bottom'
  };

  var tags = [];

  // cf has it's own state, for each dimension
  // before each new filtering we need to clear this state
  function clearAll(dimensionSet){
    var i, dimension;
    for (i in dimensionSet){

      if (dimensionSet.hasOwnProperty(i)) {
        dimension = dimensionSet[i];

        if (that[type].dataChanged === true) {
          dimension.dispose();
          addFilter(i);
        } else {
          dimension.filterAll();
        }

      }
    }
  }

  function filterByTag(query) {

    if (typeof query === "string"){
      if (that[type].tags[query]) {
        return utils.toArray(that[type].tags[query]);
      } else {
        return [];
      }
    } else {

      function fetchByTag(query){
        for (var i in query) {
          var tag = query[i];
          var nextTag = query[parseInt(i)+parseInt(1)];
          var res; // store first set of markers to compare

          try{
            res = getCommonObject(that[type].tags[tag],that[type].tags[nextTag])
          } catch(e){
            // end of the array
          }

        }
        return res;
      }
      function getCommonObject(list1, list2){
        if(list1 === undefined || list2 === undefined){
          return error("one of the marker lists you are trying to compare is undefined");
        }
        var result = {};
        for (var uid in list1){
          var match =  list2[uid];
          if (typeof match !== "undefined"){
            result[uid] = match;
          }
        }
        return result;
      }
       return utils.toArray(fetchByTag(query));

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

      if (dimension === 'tags') {
        return filterByTag(query);
      }
    }

    clearAll(that[type].filter);

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

    var result = that[type].filter[dimension].filter(query)[order](limit);

    that[type].dataChanged = false;

    if (limit === 1) {
      return result[0];
    }

    return result;

  }

  return filter;
};
