/*jslint node: true */
"use strict";
module.exports = function (global, that) {
  function addGeoJson(data, options) {
    var result = that.instance.data.addGeoJson(data, options);
    return result;

  }
  return addGeoJson;
};
