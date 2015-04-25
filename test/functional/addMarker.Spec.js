describe('when using the addMarker() method', function () {
  "use strict";

  var map;
  beforeEach(function () {
    if (mapTools.maps && mapTools.maps.mymap) {
      delete mapTools.maps.mymap;
    }
    map = new mapTools({async: false, id: 'mymap', lat: 41.3833, lng: 2.1833});
  });

  it('should add one individual Marker to the Map', function () {
    var result = map.addMarker({
      lat: 42.5000,
      lng: 1.5167,
      title: 'Andorra'
    });

    expect(result.title).to.equal('Andorra');
    expect(Object.keys(mapTools.maps.mymap.markers.all).length).to.equal(1);
  });

  describe('With a "callback" property', function () {
    it('should call the "callback" function if provided with an instance of the Marker', function (done) {
      map.addMarker({
        lat: 42.5000,
        lng: 1.5167,
        title: 'Andorra',
        callback: function(instance) {
          expect(instance.lat).to.eql(42.5000);
          expect(instance.lng).to.eql(1.5167);
          done();
        }
      });
    });
  });


  describe('With a custom UID set as Map option', function () {
    it('should add the Marker using the custom UID', function () {

      delete mapTools.maps.mymap;

      map = new mapTools({async: false, id: 'mymap', lat: 41, lng: 1, uid: 'custom_uid'});

      map.addMarker({
        lat: 42,
        lng: 2,
        title: 'Andorra',
        custom_uid: 'A1'
      });

      expect(map.markers.all['A1'].lat).to.eql(42);
      expect(map.markers.all['A1'].lng).to.eql(2);

    });
  });




  it('should add multiple Markers to the Map', function () {
    var markers = [{
      lat: 41.3833,
      lng: 2.1833,
      title: 'Barcelona',
      on: {
        click: function() {}
      }
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


  describe('with a the "infoWindow" option witch "content" has a reference to a "data" variable', function () {

    it('should replace the variable in "content" using the "data" variable', function () {
      var marker = {
        lat: 41.3833,
        lng: 2.1833,
        infoWindow: {
          content: '{city}',
          open: {on: 'mousever'},
          close: {on: 'mouseout'}
        },
        data: {
          city: 'barcelona'
        }
      };
      map.addMarker(marker);

      expect(map.infoWindow.content).to.equal('barcelona');
    });
  });


  describe('with extra options as a second parameter', function () {

    it('should merge the options with the Marker options', function () {
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
      map.addMarker({
        lat: 42.5000,
        lng: 1.5167,
        title: 'Andorra',
        group: 'myGroup'
      });

      expect(mapTools.maps.mymap.markers.groups.myGroup).to.have.length.of(1);
    });
  });

  describe('with an empty Array as first Parameter', function() {
    it('should return an empty Array', function() {
      var result = map.addMarker([])
      expect(result).to.be.a('array');
      expect(result.length).to.eql(0);
    });
  });

});
