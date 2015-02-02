/*jslint node: true */
"use strict";
var utils = require('gmplus/utils');
var config = require('gmplus/config');

module.exports = function (global, that) {
  var findAndUpdateMarker = require('gmplus/findUpdateMarker')(global, that);

  /**
   * Adds a New Group
   * @param name Name of the Group
   * @param options That Apply to all the Group
   */
  function addGroup(name, options) {
    GMP.maps[that.id].groups = GMP.maps[that.id].groups || [];
    GMP.maps[that.id].groupOptions = GMP.maps[that.id].groupOptions || {};
    GMP.maps[that.id].groupOptions[name] = options;
  }

  /**
   * Updates all the Markers of a Group to have specific Properties
   * @param name
   * @param options
   */
  function updateGroup(name, options) {
    var result = [], instance;
    var _options =  utils.prepareOptions(options, config.customMarkerOptions);
    if (GMP.maps[that.id].groups && GMP.maps[that.id].groups[name]) {
      for (var item in GMP.maps[that.id].groups[name]) {
        instance = findAndUpdateMarker(GMP.maps[that.id].groups[name][item], _options);
        result.push(instance);
      }
    }
    return result;
  };

  return {
    addGroup: addGroup,
    updateGroup: updateGroup
  };

};
