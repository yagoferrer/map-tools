describe('when calling removeMarker()', function () {
  "use strict";
  it('should remove the Marker from the Map', function () {
    var map = new mapTools({async: false, id: 'mymap', lat: 41.3833, lng: 2.1833});

    var options = {
      lat: 41.3833,
      lng: 2.1833,
      title: 'Barcelona',
      visible: false,
      infoWindow: {
        content: 'Barcelona!'
      }
    };

    var instance = map.addMarker(options);
    map.removeMarker(instance);
    expect(instance.map).to.equal(null);
  });

});
