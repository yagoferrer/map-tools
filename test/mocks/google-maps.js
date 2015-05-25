module.exports = {
  maps: {
    Animation: {
      BOUNCE: 1,
      DROP: 2
    },
    event: {
      addListenerOnce: function(instance, event, cb)
      {
        cb()
      },
      addListener: function(instance, event, cb)
      {
        cb()
      },
      addDomListener: function(instance, event, cb)
      {
        cb()
      },
      trigger: function(instance, event, value) {

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
    InfoWindow: function(options) {
      return {
        open: function(){},
        close: function(){},
        setContent: function(x){
          this.content = x},
        getMap: function(){},
        content: options.content
      };
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
      };

      marker.setMap = function(map) {
        marker.map = map;
      }

      return marker;
    },
    MarkerImage: function() {
      return {};
    },
    Map: function() {

      return {
        zoom: 8,
        gm_bindings_: {},
        data: {
          addGeoJson: function(json) {
            return [{ag: {D: 53}, forEachProperty: function(){}, k: {}}, {ag: {D: 30}, forEachProperty: function(){}, k: {}}]
          },
          overrideStyle: function(feature, style) {
            return feature.style = style;
          }
        },
        setOptions: function(options) {
          this.options = options;
        },
        getCenter: function() {

          var that = this;

          return {
            lat: function() {

              return 41;

            },
            lng: function() {

              return 1;
            }
          }
        },
        controls:{
          '1': [], //TOP_LEFT
          '2': [], //TOP_CENTER
          '3': [], //TOP_RIGHT
          '4': [],
          '5': [],
          '6': [],
          '7': [],
          '8': [],
          '9': [],
          '10': [],
          '11': [],
          '12': []
        },
        getZoom: function() {
          return this.zoom;
        },
        setZoom: function(zoom) {
          this.zoom = zoom;
        }

      };
    },
    Point: function() {
      return {};
    },
    Size: function() {
      return {};
    },
    MapTypeId: {
      ROADMAP: 'ROADMAP',
      TERRAIN: 'TERRAIN'
    },
    ControlPosition: {
      BOTTOM: 11,
      BOTTOM_CENTER: 11,
      BOTTOM_LEFT: 10,
      BOTTOM_RIGHT: 12,
      CENTER: 13,
      LEFT: 5,
      LEFT_BOTTOM: 6,
      LEFT_CENTER: 4,
      LEFT_TOP: 5,
      RIGHT: 7,
      RIGHT_BOTTOM: 9,
      RIGHT_CENTER: 8,
      RIGHT_TOP: 7,
      TOP: 2,
      TOP_CENTER: 2,
      TOP_LEFT: 1,
      TOP_RIGHT: 3
    }
  }
};
