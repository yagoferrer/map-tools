window.google = {
  maps: {
    event: {
      addListenerOnce: function(instance, event, cb)
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
      return {};
    },
    Marker: function(marker) {

      marker.setAnimation = function() {
        return 'animation set';
      };

      marker.setVisible = function(value) {
        marker.visible = value;
      }

      return marker;

    },
    MarkerImage: function() {
      return {};
    },
    Map: function() {
      return {gm_bindings_: {}};
    },
    Point: function() {
      return {};
    },
    Size: function() {
      return {};
    }
  }
};
