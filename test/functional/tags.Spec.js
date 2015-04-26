describe('Given the Tag Feature', function () {

  var map;
  beforeEach(function () {
    if (mapTools.maps && mapTools.maps.mymap) {
      delete mapTools.maps.mymap;
    }
    map = new mapTools({async: false, id: 'mymap', lat: 41.3833, lng: 2.1833});
  });
  describe('When adding a Marker with a specific Tag', function () {

    it('should add a Marker to markers.tags<tag>', function () {
      var marker = map.addMarker({
        lat: 42,
        lng: 1,
        title: 'Andorra',
        tags: 'myTag'
      });

      expect(mapTools.maps.mymap.markers.tags.myTag[marker.uid]).to.eql(marker);
    });

  });

  describe('When adding a Marker with multiple tags', function () {

    it('should add a Marker to markers.tags<tag>', function () {
      var marker = map.addMarker({
        lat: 42,
        lng: 1,
        title: 'Andorra',
        tags: ['tag1', 'tag2']
      });

      expect(mapTools.maps.mymap.markers.tags.tag1[marker.uid]).to.eql(marker);
      expect(mapTools.maps.mymap.markers.tags.tag2[marker.uid]).to.eql(marker);
    });

  });

  describe('when finding a Marker by Tag', function () {

    it('should find the Marker by specific Tag', function () {
      var marker = map.addMarker({
        lat: 42,
        lng: 1,
        title: 'Andorra',
        tags: 'myTag'
      });

      var markers = map.findMarker({tags: 'myTag'});
      expect(markers[0]).to.eql(marker);
    });

    describe('if the Tag does not exist', function () {

      it('should return an empty Array', function () {

        var marker = map.addMarker({
          lat: 42,
          lng: 1,
          title: 'Andorra',
          tags: 'myTag2'
        });

        var markers = map.findMarker({tags: 'myTag'});
        expect(markers).to.eql([]);

      });

    });

  });


  describe('when updating the tag of a Marker', function () {

    it('should find the Marker in by the other Tag just set', function() {

      var marker = map.addMarker({
        lat: 42,
        lng: 1,
        title: 'Andorra',
        tags: 'myTag'
      });

      map.updateMarker(marker, {tags: 'myTag2'});

      var markers = map.findMarker({tags: 'myTag2'});
      expect(markers[0]).to.eql(marker);

    });

  });
});
