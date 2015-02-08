describe('when calling updateMarker()', function () {
  it('should invoke the Marker options setter for each property passed', function () {
    var map = new GMP({async: false, id: 'myMap', lat: 41.3833, lng: 2.1833});

    var options = {
      lat: 41.3833,
      lng: 2.1833,
      title: 'Barcelona',
      visible: false,
      bubble: {
        content: 'Barcelona!'
      }
    };

    var result = map.addMarker(options);
    var uid = result.data.uid;
    expect(GMP.maps.myMap.markers.all[uid].visible).to.be.false;

    map.updateMarker({uid: uid}, {visible: true, move: map.bounce, lat: 100, lng: 30, bubble: {content: 'click me'}});

    expect(GMP.maps.myMap.markers.all[uid].visible).to.be.true;
    expect(GMP.maps.myMap.markers.all[uid].position.lat()).to.eql(100);
    expect(GMP.maps.myMap.markers.all[uid].position.lng()).to.eql(30);
    expect(GMP.maps.myMap.markers.all[uid].bubble.instance.content).to.eql('click me');
  });

  it('should invoke multiple Markers options setters for each property passed', function () {
    var map = new GMP({async: false, id: 'myMap', lat: 41.3833, lng: 2.1833});

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
        group: 'myGroup',
        visible: false
      }
    ];

    var result = map.addMarker(markers);
    var uid = result[0].data.uid;
    expect(GMP.maps.myMap.markers.all[uid].visible).to.be.false;
    map.updateMarker([{uid: uid}], {visible: true, move: map.bounce});
    expect(GMP.maps.myMap.markers.all[uid].visible).to.be.true;
  });
});
