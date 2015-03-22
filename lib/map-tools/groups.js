/*jslint node: true */
"use strict";
var utils = require('map-tools/utils');
var config = require('map-tools/config');

module.exports = function (global, that) {
  var updateMarker = require('map-tools/updateMarker')(global, that);

  /**
   * Adds a New Group
   * @param name Name of the Group
   * @param options That Apply to all the Group
   */
  function addGroup(name, options) {
    global.mapTools.maps[that.id].markers = global.mapTools.maps[that.id].markers || {};
    global.mapTools.maps[that.id].markers.groups = global.mapTools.maps[that.id].markers.groups || [];
    global.mapTools.maps[that.id].markers.groupOptions = global.mapTools.maps[that.id].markers.groupOptions || {};
    global.mapTools.maps[that.id].markers.groupOptions[name] = options;
  }

  /**
   * Updates all the Markers of a Group to have specific Properties
   * @param name
   * @param options
   */
  function updateGroup(name, options) {
    var result = [], instance, item;
    var preparedOptions =  utils.prepareOptions(options, config.customMarkerOptions);
    if (global.mapTools.maps[that.id].markers.groups && global.mapTools.maps[that.id].markers.groups[name]) {
      for (item in global.mapTools.maps[that.id].markers.groups[name]) {
        if (global.mapTools.maps[that.id].markers.groups[name].hasOwnProperty(item)) {
          instance = updateMarker.customUpdate(global.mapTools.maps[that.id].markers.groups[name][item], preparedOptions);
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
