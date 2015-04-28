describe('Given the findMarker()', function () {

  var map;

  beforeEach(function () {
    if (mapTools.maps && mapTools.maps.mymap) {
      delete mapTools.maps.mymap;
    }

    map = new mapTools({async: false, id: 'mymap', lat: 41.3833, lng: 2.1833});
  });

  describe('When finding a Marker by a property and then updating the data', function () {


    it('should still find the Marker with the data updates', function () {

      var marker = map.addMarker({lat: 41, lng: 1, visible: false, uid: 'f1'});
      var result1 = map.findMarker({visible: false});
      expect(result1[0].uid).to.eql('f1');

      // Data changes!
      map.updateMarker(marker, {visible: true});

      // When running the same query: it should not find the Marker.
      var result2 = map.findMarker({visible: false});

      expect(result2.length).to.eql(0);

      var result3 = map.findMarker({visible: true});
      expect(result3[0].uid).to.eql('f1');
    });

  });

});
