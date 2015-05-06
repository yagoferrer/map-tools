/*jslint node: true */
/// <reference path="../typings/node.d.ts"/>
var topojson = require('topojson');
var utils = require('map-tools/utils');
module.exports = function (global, that) {
    'use strict';
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
                var uid = utils.createUid();
                feature.uid = uid;
                var data = feature.k;
                feature.k.uid = uid;
                Object.defineProperty(feature, 'data', {
                    value: data,
                    enumerable: true,
                    writable: false,
                    configurable: false
                });
                if (options) {
                    if (options.filters) {
                        // Add filters if not defined.
                        if (!that.json.filter) {
                            addFilter(options.filters);
                        }
                        that.json.crossfilter.add([feature]);
                    }
                    if (options.style) {
                        that.instance.data.overrideStyle(feature, options.style);
                    }
                }
                that.json.all[feature.data.uid] = feature;
            }
        }
    }
    /**
     * Adds a Topo JSON file into a Map
     * @param data The parsed JSON File
     * @param options
     */
    function addTopoJson(data, options) {
        var item, geoJson, features, x;
        for (x in options) {
            if (options.hasOwnProperty(x)) {
                item = options[x];
                geoJson = topojson.feature(data, data.objects[item.object]);
                features = that.instance.data.addGeoJson(geoJson);
                addFeatureOptions(features, item);
                global.mapTools.maps[that.id].json.all[item.object] = features;
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
//# sourceMappingURL=addFeature.js.map
