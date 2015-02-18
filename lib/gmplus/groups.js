/*jslint node: true */
"use strict";
var utils = require('map-tools/utils');
var config = require('map-tools/config');

module.exports = function (global, that) {
  var findAndUpdateMarker = require('map-tools/findUpdateMarker')(global, that);

  /**
   * Adds a New Group
   * @param name Name of the Group
   * @param options That Apply to all the Group
   */
  function addGroup(name, options) {
    global.GMP.maps[that.id].markers = global.GMP.maps[that.id].markers || {};
    global.GMP.maps[that.id].markers.groups = global.GMP.maps[that.id].markers.groups || [];
    global.GMP.maps[that.id].markers.groupOptions = global.GMP.maps[that.id].markers.groupOptions || {};
    global.GMP.maps[that.id].markers.groupOptions[name] = options;
  }

  /**
   * Updates all the Markers of a Group to have specific Properties
   * @param name
   * @param options
   */
  function updateGroup(name, options) {
    var result = [], instance, item;
    var preparedOptions =  utils.prepareOptions(options, config.customMarkerOptions);
    if (global.GMP.maps[that.id].markers.groups && global.GMP.maps[that.id].markers.groups[name]) {
      for (item in global.GMP.maps[that.id].markers.groups[name]) {
        if (global.GMP.maps[that.id].markers.groups[name].hasOwnProperty(item)) {
          instance = findAndUpdateMarker(global.GMP.maps[that.id].markers.groups[name][item], preparedOptions);
          result.push(instance);
        }
      }
    }
    return result;
  }

  return {
    addGroup: addGroup,
    updateGroup: updateGroup
  };

};
