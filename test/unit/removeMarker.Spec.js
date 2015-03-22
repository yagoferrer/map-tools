describe('Given the removeMarker Module', function () {

  var removeMarker;

  beforeEach(function () {

    var global = {};
    var that = {};

    removeMarker = require('map-tools/removeMarker')(global, that);
  });

  it('should remove a Marker from the Map', function () {

    var markerObj = function() {
      this.setMap =  function(arg){
        this.map = arg;
      };
      this.map = 'myMap';
      this.data = {uid: 1};
      return this;
    };

    var marker = new markerObj();
    removeMarker(marker);
    expect(marker.map).to.equal(null);
  });

});
