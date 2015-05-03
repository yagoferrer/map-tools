var utils = require('map-tools/utils');

module.exports = function(global, that, type) {
  'use strict';

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
    // if the search query is an array with only one item then just use that string
    if(utils.isArray(query) && query.length === 1){
      query = query[0];
    }
    if (typeof query === "string"){
      if (that[type].tags[query]) {
        return utils.toArray(that[type].tags[query]);
      } else {
        return [];
      }
    } else {
      var markers =  fetchByTag(query);
      if(typeof markers === "object"){
        markers = utils.toArray(markers);
      }
      return markers;
    }
  }

  function fetchByTag(query){
    var markers; // store first set of markers to compare

    for (var i=0; i<query.length-1; i++) {
      var tag = query[i];
      var nextTag = query[parseInt(i)+parseInt(1)];
      // null check kicks in when we get to the end of the for loop
      markers = utils.getCommonObject(that[type].tags[tag],that[type].tags[nextTag])
    }
    return markers;
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
