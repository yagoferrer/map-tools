describe('when calling updateMarker()', function () {
  "use strict";

  var map;
  beforeEach(function () {
    if (mapTools.maps && mapTools.maps.mymap) {
      delete mapTools.maps.mymap;
    }
    map = new mapTools({async: false, id: 'mymap', lat: 41.3833, lng: 2.1833});
  });


  it('should invoke the Marker options setter for each property passed', function () {
    var options = {
      lat: 41.3833,
      lng: 2.1833,
      title: 'Barcelona',
      visible: false,
      infoWindow: {
        content: 'Barcelona!'
      }
    };

    var result = map.addMarker(options);
    var uid = result.data.uid;
    expect(mapTools.maps.mymap.markers.all[uid].visible).to.be.false;

    map.updateMarker({uid: uid}, {visible: true, move: 'bounce', lat: 100, lng: 30, infoWindow: {content: 'click me'}});

    expect(mapTools.maps.mymap.markers.all[uid].visible).to.be.true;
    expect(mapTools.maps.mymap.markers.all[uid].position.lat()).to.eql(100);
    expect(mapTools.maps.mymap.markers.all[uid].position.lng()).to.eql(30);
    expect(mapTools.maps.mymap.markers.all[uid].infoWindow.content).to.eql('click me');
  });

  it('should invoke multiple Markers options setters for each property passed', function () {
    var markers = [{
      lat: 41.3833,
      lng: 2.1833,
      title: 'Barcelona',
      visible: false
    },
      {
        lat: 42.5000,
        lng: 1.5167,
        title: 'Andorra',
        visible: false
      }
    ];

    var result = map.addMarker(markers);
    var uid = result[0].data.uid;
    expect(mapTools.maps.mymap.markers.all[uid].visible).to.be.false;
    map.updateMarker([{uid: uid}], {visible: true, move: 'bounce'});
    expect(mapTools.maps.mymap.markers.all[uid].visible).to.be.true;
  });
});
