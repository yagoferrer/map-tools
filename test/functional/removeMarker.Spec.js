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


  it('should remove multiple Markers from the Map', function() {

    var map = new mapTools({async: false, id: 'mymap', lat: 41.3833, lng: 2.1833});

    var markers = [{
      lat: 41.3833,
      lng: 2.1833,
      title: 'Barcelona'
    }, {
      lat: 41.4489,
      lng: 2.2461,
      title: 'Badalona'
    }];

    var result = map.addMarker(markers);

    map.removeMarker(result);

    expect(result[0].map).to.equal(null);
    expect(result[1].map).to.equal(null);

  });


  it('should remove all the Markers from the Map', function() {

    var map = new mapTools({async: false, id: 'mymap', lat: 41.3833, lng: 2.1833});

    var markers = [{
      lat: 41.3833,
      lng: 2.1833,
      title: 'Barcelona'
    }, {
      lat: 41.4489,
      lng: 2.2461,
      title: 'Badalona'
    }];

    var result = map.addMarker(markers);

    map.removeMarker();

    expect(result[0].map).to.equal(null);
    expect(result[1].map).to.equal(null);

  });

});
