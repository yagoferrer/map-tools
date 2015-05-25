describe('When initializing the Map with Events', function() {

  beforeEach(function () {
    if (mapTools.maps && mapTools.maps.mymap) {
      delete mapTools.maps.mymap;
    }
  });

  it('should trigger marker_visibility_event when changing Markers visibility', function() {

    var spy = sinon.spy();
    google.maps.event.trigger = spy;

    var map = new mapTools({
      id: 'mymap',
      lat: 41.3833,
      lng: 2.1833,
      async: false,
      on: {
        marker_visibility_changed: function() {}
      }
    });

    var marker1 = map.addMarker({lat: 41, lng: 1, visible: true});
    var marker2 = map.addMarker({lat: 41, lng: 2, visible: true});
    map.updateMarker(marker1, {visible: false});
    expect(spy).to.have.been.called;
  })

});
