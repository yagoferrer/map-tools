/*jslint node: true */
"use strict";
var topojson = require('topojson');
var utils = require('gmplus/utils');
var crossfilter = require('crossfilter');

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
        feature.data = {};
        //feature.data = feature.k;
        feature.forEachProperty(function(value, property) {
          feature.data[property] = value;
        });

        feature.data.uid = utils.createUid();

        if (options && options.style) {
          that.instance.data.overrideStyle(feature, options.style);
        }
        global.GMP.maps[that.id].json.all[feature.data.uid] = feature;
        global.GMP.maps[that.id].json.crossfilter.add(feature.data);
      }
    }
  }

  function init() {
    global.GMP.maps[that.id].json = global.GMP.maps[that.id].json || {};
    global.GMP.maps[that.id].json.all = global.GMP.maps[that.id].json.all || {};
    global.GMP.maps[that.id].json.groups = global.GMP.maps[that.id].json.groups || {};
    global.GMP.maps[that.id].json.crossfilter = global.GMP.maps[that.id].json.crossfilter || crossfilter([]);
  }

  /**
   * Adds a Topo JSON file into a Map
   * @param data The parsed JSON File
   * @param options
   */
  function addTopoJson(data, options) {
    init();
    var item, geoJson, features,  x;
    for (x in options) {
      if (options.hasOwnProperty(x)) {
        item = options[x];
        geoJson = topojson.feature(data, data.objects[item.object]);
        features = that.instance.data.addGeoJson(geoJson);
        addFeatureOptions(features, item);
        global.GMP.maps[that.id].json.groups[item.object] = features;
      }
    }
    return features;
  }

  function addGeoJson(data, options) {
    init();
    var features = that.instance.data.addGeoJson(data, options);
    addFeatureOptions(features, options);
    return features;
  }

  return {
    addGeoJson: addGeoJson,
    addTopoJson: addTopoJson
  };
};
