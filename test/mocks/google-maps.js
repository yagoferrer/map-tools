module.exports = {
  maps: {
    event: {
      addListenerOnce: function(instance, event, cb)
      {
        cb()
      },
      addListener: function(instance, event, cb)
      {
        cb()
      }
    },
    LatLng: function(lat, lng) {
      return {
        latitude: parseFloat(lat),
        longitude: parseFloat(lng),

        lat: function() { return this.latitude; },
        lng: function() { return this.longitude; }
      };
    },
    LatLngBounds: function(ne, sw) {
      return {
        getSouthWest: function() { return sw; },
        getNorthEast: function() { return ne; }
      };
    },
    OverlayView: function() {
      return {};
    },
    InfoWindow: function() {
      return {open: function(){}, setContent: function(x){this.content = x}};
    },
    Marker: function(marker) {

      marker.setAnimation = function() {
        return 'animation set';
      };

      marker.setPosition = function(value) {
        marker.position = value;
      };

      marker.setOptions = function(options) {
        for (var option in options) {
          marker[option] = options[option];
        }
      }

      return marker;

    },
    MarkerImage: function() {
      return {};
    },
    Map: function() {
      return {gm_bindings_: {}, data: {
        addGeoJson: function(json) {
          return [{ag: {D: 53}}, {ag: {D: 30}}]
        },
        overrideStyle: function(feature, style) {
          return feature.style = style;
        }
      }};
    },
    Point: function() {
      return {};
    },
    Size: function() {
      return {};
    },
    MapTypeId: {
      ROADMAP: 1
    }
  }
};
