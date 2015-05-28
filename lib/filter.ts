/// <reference path="typings/tsd.d.ts"/>


import addFilter = require('./addFilter');

class Filter {
  'use strict';

  addFilter;

  orderLookup = {
    ASC: 'top',
    DESC: 'bottom'
  };

  private utils = require('./utils');

  constructor(public that, public type) {

    var addFilterInstance = new addFilter(that, type);

    this.addFilter = function(filters) {
      return addFilterInstance.addFilter(filters);
    };

  }

  // cf has it's own state, for each dimension
  // before each new filtering we need to clear this state
  clearAll(dimensionSet){
    var i, dimension;
    for (i in dimensionSet){

      if (dimensionSet.hasOwnProperty(i)) {
        dimension = dimensionSet[i];

        if (this.that[this.type].dataChanged === true) {
          dimension.dispose();
          this.addFilter(i);
        } else {
          dimension.filterAll();
        }

      }
    }
  }

  filterByTag(query) {
    // if the search query is an array with only one item then just use that string
    if(this.utils.isArray(query) && query.length === 1){
      query = query[0];
    }
    if (typeof query === "string"){
      if (this.that[this.type].tags[query]) {
        return this.utils.toArray(this.that[this.type].tags[query]);
      } else {
        return [];
      }
    } else {
      var markers =  this.fetchByTag(query);
      if(typeof markers === "object"){
        markers = this.utils.toArray(markers);
      }
      return markers;
    }
  }

  fetchByTag(query){
    var markers; // store first set of markers to compare

    var i: number;

    for (i=0; i<query.length-1; i++) {
      var tag = query[i];
      var nextTag = query[i+1];
      // null check kicks in when we get to the end of the for loop
      markers = this.utils.getCommonObject(this.that[this.type].tags[tag],this.that[this.type].tags[nextTag])
    }
    return markers;
  }

  public filter(args, options?) {

    // Return All items if no arguments are supplied
    if (typeof args === 'undefined' && typeof options === 'undefined') {
      return this.utils.toArray(this.that[this.type].all);
    }


    var dimension, order, limit, query;

    if (typeof args === 'string') {
      dimension = args;
    } else {
      dimension = Object.keys(args)[0];
      query = args[dimension];

      if (dimension === 'tags') {
        return this.filterByTag(query);
      }
    }

    this.clearAll(this.that[this.type].filter);

    // Add Crossfilter Dimension if it does not exist.
    if (!this.that[this.type].filter[dimension]) {
      this.addFilter(dimension);
    }

    order = (options && options.order && this.orderLookup[options.order]) ?
      this.orderLookup[options.order]
      : this.orderLookup[Object.keys(this.orderLookup)[0]];

    limit = (options && options.limit) ? options.limit : Infinity;


    if (typeof query === 'undefined') {
      query = null;
    }

    var result = this.that[this.type].filter[dimension].filter(query)[order](limit);

    this.that[this.type].dataChanged = false;

    if (limit === 1) {
      return result[0];
    }

    return result;

  }

}

export = Filter;
