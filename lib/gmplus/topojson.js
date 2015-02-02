var topojson = require('topojson');

module.exports = function(global, that) {


  /**
   * Adds GeoJSON Feature Options like: style
   * @param features
   * @param options
   * @private
   */
  function _addFeatureOptions(features, options) {
    var feature;
    for (var x in features) {
      feature = features[x];
      if (options.style) {
        that.instance.data.overrideStyle(feature, options.style);
      }
    }
  }

  /**
   * Loads a Topo JSON file into a Map
   * @param data The parsed JSON File
   * @param options
   */
  function loadTopoJson(data, options)
  {
    var item, geoJson, features;
    for (var x in options) {
      item = options[x];
      geoJson = topojson.feature(data, data.objects[item.object]);
      features = that.instance.data.addGeoJson(geoJson);
      _addFeatureOptions(features, item);
    }

    return features;
  };

  return loadTopoJson;
}
