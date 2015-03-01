describe('when calling addMarker()', function () {
  "use strict";

  it('should add one individual Marker to the Map', function () {
    var map = new mapTools({async: false, id: 'mymap', lat: 41.3833, lng: 2.1833});

    var result = map.addMarker({
      lat: 42.5000,
      lng: 1.5167,
      title: 'Andorra'
    });

    expect(result.title).to.equal('Andorra');

    expect(Object.keys(mapTools.maps.mymap.markers.all).length).to.equal(1);

  });

  it('should add multiple Markers to the Map', function () {
    var map = new mapTools({async: false, el: '#mymap', lat: 41.3833, lng: 2.1833});

    var markers = [{
      lat: 41.3833,
      lng: 2.1833,
      title: 'Barcelona'
    }, {
      lat: 41.4489,
      lng: 2.2461,
      title: 'Badalona',
      move: 'bounce'
    }];

    var result = map.addMarker(markers, {group: 'myGroup'});

    expect(result).to.have.length.of(2);
    expect(Object.keys(mapTools.maps.mymap.markers.all).length).to.equal(2);
  });


  describe('with a the "bubble" option witch "content" has a reference to a "data" variable', function () {


    it('should replace the variable in "content" using the "data" variable', function () {
      var map = new mapTools({async: false, id: 'mymap', lat: 41.3833, lng: 2.1833});
      var marker = {
        lat: 41.3833,
        lng: 2.1833,
        infoWindow: {
          content: '{city}'
        },
        data: {
          city: 'barcelona'
        }
      };
      var result = map.addMarker(marker);
      expect(result.infoWindow.content).to.equal('barcelona');
    });
  });


  describe('with extra options as a second parameter', function () {

    it('should merge the options with the Marker options', function () {

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

      var result = map.addMarker(markers, {myGroupProp: true});

      expect(result[0].myGroupProp).to.be.ok;
      expect(result[1].myGroupProp).to.be.ok;

      expect(mapTools.maps.mymap.markers.all[Object.keys(mapTools.maps.mymap.markers.all)[0]].myGroupProp).to.be.ok;
      expect(mapTools.maps.mymap.markers.all[Object.keys(mapTools.maps.mymap.markers.all)[1]].myGroupProp).to.be.ok;

    });

  });


  describe('with a "group" property but the Group was not added yet', function () {
    it('should add the Marker to the Group anyway', function () {
      var map = new mapTools({async: false, id: 'mymap', lat: 41.3833, lng: 2.1833});
      map.addMarker({
        lat: 42.5000,
        lng: 1.5167,
        title: 'Andorra',
        group: 'myGroup'
      });

      expect(mapTools.maps.mymap.markers.groups.myGroup).to.have.length.of(1);
    });
  });
});
