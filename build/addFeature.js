/// <reference path="typings/tsd.d.ts"/>
var topojson = require('topojson');
var utils = require('./utils');
var addFilter = require('./addFilter');
var AddFeature = (function () {
    function AddFeature(that) {
        this.that = that;
        var addFilterInstance = new addFilter(that, 'json');
        this.addFilter = function (filters) {
            return addFilterInstance.addFilter(filters);
        };
    }
    /**
     * Adds GeoJSON Feature Options like: style
     * @param features
     * @param options
     * @private
     */
    AddFeature.prototype.addFeatureOptions = function (features, options) {
        var feature, x;
        for (x in features) {
            if (features.hasOwnProperty(x)) {
                feature = features[x];
                var uid = utils.createUid();
                feature.uid = uid;
                feature.data = { uid: uid };
                feature.forEachProperty(function (value, key) {
                    feature.data[key] = value;
                });
                if (options) {
                    if (options.filters) {
                        // Add filters if not defined.
                        if (!this.that.json.filter) {
                            this.addFilter(options.filters);
                        }
                        this.that.json.crossfilter.add([feature]);
                    }
                    if (options.style) {
                        this.that.instance.data.overrideStyle(feature, options.style);
                    }
                }
                this.that.json.all[feature.data.uid] = feature;
            }
        }
    };
    /**
     * Adds a Topo JSON file into a Map
     * @param data The parsed JSON File
     * @param options
     */
    AddFeature.prototype.addTopoJson = function (data, options) {
        var item, geoJson, features, x;
        for (x in options) {
            if (options.hasOwnProperty(x)) {
                item = options[x];
                geoJson = topojson.feature(data, data.objects[item.object]);
                features = this.that.instance.data.addGeoJson(geoJson);
                this.addFeatureOptions(features, item);
                mapTools.maps[this.that.id].json.all[item.object] = features;
            }
        }
        return features;
    };
    AddFeature.prototype.addGeoJson = function (data, options) {
        var features = this.that.instance.data.addGeoJson(data, options);
        this.addFeatureOptions(features, options);
        return features;
    };
    return AddFeature;
})();
module.exports = AddFeature;
