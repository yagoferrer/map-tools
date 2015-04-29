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

        map.addMarker({
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

  describe('when finding a Marker by multiple tags', function() {

    it('should return Markers that belong to both tags', function() {

      map.addMarker([{
        lat: 42,
        lng: 1,
        title: 'Barcelona',
        tags: ['tag1', 'tag2', 'tag3']
      },

        {
          lat: 42,
          lng: 2,
          title: 'Andorra',
          tags: ['tag1', 'tag2']
        },

        {
          lat: 42,
          lng: 2,
          title: 'Zaragoza',
          tags: ['tag1', 'tag2', 'tag3']
        },

        {
          lat: 42,
          lng: 3,
          title: 'Sevilla',
          tags: ['tag2']
        }
      ]);
/*
      var result1 = map.findMarker({tags: ['tag1', 'tag2']});



      expect(result1[0].title).to.eql('Barcelona');
      expect(result1[1].title).to.eql('Andorra');
      expect(result1[2].title).to.eql('Zaragoza');
      expect(result1.length).to.eql(3);

*/
      var result2 = map.findMarker({tags: ['tag2', 'tag3']});

      //console.log(result2);

      expect(result2[0].title).to.eql('Barcelona');
      expect(result2[1].title).to.eql('Zaragoza');
      expect(result2.length).to.eql(2);



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


    describe('with an Array of tags', function () {
      it('should apply the new tags and remove the old ones', function () {

        var marker = map.addMarker({
          lat: 42,
          lng: 1,
          title: 'Andorra',
          tags: ['tag1', 'tag2']
        });

        var tags = mapTools.maps.mymap.markers.tags;

        expect(tags.tag1[Object.keys(tags.tag1)[0]]).to.eql(marker);
        expect(tags.tag2[Object.keys(tags.tag2)[0]]).to.eql(marker);

        map.updateMarker(marker, {tags: ['tag3', 'tag4']});

        expect(tags.tag3[Object.keys(tags.tag3)[0]]).to.eql(marker);
        expect(tags.tag4[Object.keys(tags.tag4)[0]]).to.eql(marker);

        expect(tags.tag1).to.eql({});
        expect(tags.tag2).to.eql({});

        var markers = map.findMarker({tags: 'tag3'});

        expect(markers[0]).to.eql(marker);
      });

    });


    describe('when calling updateMarker() with tags', function () {

      it('should find the Marker and update one tag for another', function() {
        map.addMarker({
          lat: 42,
          lng: 1,
          title: 'Andorra',
          tags: 'myTag'
        });

        map.updateMarker({tags: 'myTag'}, {tags: 'myTag2'});
      });


    });

  });
});
