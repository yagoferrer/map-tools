/*jslint node: true */
"use strict";
var topojson = require('topojson');
var utils = require('map-tools/utils');

module.exports = function (global, that) {

  var addFilter = require('map-tools/addFilter')(global, that, 'json');

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

        var data = feature.k;
        feature.k.uid = utils.createUid();

        Object.defineProperty(feature, 'data', {
          value: data,
          enumerable: true,
          writable: false,
          configurable: false
        });

        if (options) {
          if (options.filters) {

            // Add filters if not defined.
            if (!global.mapTools.maps[that.id].json.filter) {
              addFilter(options.filters);
            }


            feature.uid = 1;
            global.mapTools.maps[that.id].json.all['1'] = feature.data;
            feature.data.data = {}

            global.mapTools.maps[that.id].json.crossfilter.add([feature.data]);
          }

          if (options.style) {
            that.instance.data.overrideStyle(feature, options.style);
          }
        }
        global.mapTools.maps[that.id].json.all[feature.data.uid] = feature;
      }
    }
  }


  /**
   * Adds a Topo JSON file into a Map
   * @param data The parsed JSON File
   * @param options
   */
  function addTopoJson(data, options) {
    var item, geoJson, features,  x;
    for (x in options) {
      if (options.hasOwnProperty(x)) {
        item = options[x];
        geoJson = topojson.feature(data, data.objects[item.object]);
        features = that.instance.data.addGeoJson(geoJson);
        addFeatureOptions(features, item);
        global.mapTools.maps[that.id].json.groups[item.object] = features;
      }
    }
    return features;
  }

  function addGeoJson(data, options) {
    var features = that.instance.data.addGeoJson(data, options);
    addFeatureOptions(features, options);
    return features;
  }

  return {
    addGeoJson: addGeoJson,
    addTopoJson: addTopoJson
  };
};
