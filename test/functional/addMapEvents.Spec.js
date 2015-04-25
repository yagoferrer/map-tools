describe('When initializing the Map with Events', function() {

  beforeEach(function () {
    if (mapTools.maps && mapTools.maps.mymap) {
      delete mapTools.maps.mymap;
    }
  });

  it('should listen for Map events', function() {

    var spy1 = sinon.spy();

    var map = new mapTools({
      id: 'mymap',
      lat: 41.3833,
      lng: 2.1833,
      async: false,
      on: {
        marker_visibility_changed: spy1
      }
    });

    expect(spy1).to.have.been.called;
  })

});
