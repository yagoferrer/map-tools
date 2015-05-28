/// <reference path="typings/tsd.d.ts"/>

interface featureOption {
  filters?: {};
  style: {};
}

interface TopoJsonOption {
  filters:string[];
  object:string;
  style: {
    fillOpacity?: number;
    strokeColor: string;
    strokeWeight: number;
  }
}

interface Feature {
  geometry: {};
  id: string;
  properties: {};
  type: string;
}

interface GeoJsonData {
  features: Feature[];
  metadata: {};
  type: string;
}

var topojson = require('topojson');
import utils = require('./utils');
import addFilter = require('./addFilter');

class AddFeature {

  addFilter;

  constructor(public that) {

    var addFilterInstance = new addFilter(that, 'json');
    this.addFilter = function(filters) {
      return addFilterInstance.addFilter(filters);
    }
  }

  /**
   * Adds GeoJSON Feature Options like: style
   * @param features
   * @param options
   * @private
   */
  addFeatureOptions(features:{}[], options?:featureOption):void {

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
  }


  /**
   * Adds a Topo JSON file into a Map
   * @param data The parsed JSON File
   * @param options
   */

  public addTopoJson(data, options:TopoJsonOption[]):{}[] {
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
  }

  public addGeoJson(data:GeoJsonData, options) {
    var features = this.that.instance.data.addGeoJson(data, options);
    this.addFeatureOptions(features, options);
    return features;
  }

}

export = AddFeature;
