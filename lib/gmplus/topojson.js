/*jslint node: true */
"use strict";
var topojson = require('topojson');

module.exports = function (global, that) {

  /**
   * Adds GeoJSON Feature Options like: style
   * @param features
   * @param options
   * @private
   */
  function addFeatureOptions(features, options) {
    var feature, x;
    for (x in features) {
      if (features.hasOwnProperty(x)) {
        feature = features[x];
        if (options.style) {
          that.instance.data.overrideStyle(feature, options.style);
        }
      }
    }
  }

  /**
   * Loads a Topo JSON file into a Map
   * @param data The parsed JSON File
   * @param options
   */
  function loadTopoJson(data, options) {
    var item, geoJson, features,  x;
    for (x in options) {
      if (options.hasOwnProperty(x)) {
        item = options[x];
        geoJson = topojson.feature(data, data.objects[item.object]);
        features = that.instance.data.addGeoJson(geoJson);
        addFeatureOptions(features, item);
        global.GMP.maps[that.id].json = global.GMP.maps[that.id].json || {};
        global.GMP.maps[that.id].json[item.object] = features;
      }
    }
    return features;
  }

  return loadTopoJson;
};
