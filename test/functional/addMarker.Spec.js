describe('when using the addMarker() method', function () {
  "use strict";

  var map;
  beforeEach(function () {
    if (mapTools.maps && mapTools.maps.mymap) {
      delete mapTools.maps.mymap;
    }
    map = new mapTools({async: false, id: 'mymap', lat: 41.3833, lng: 2.1833});
  });

  describe('to add one single Marker', function () {
    it('should add the marker to the Map', function () {
      var result = map.addMarker({
        lat: 42.5000,
        lng: 1.5167,
        title: 'Andorra'
      });

      expect(result.title).to.equal('Andorra');
      expect(Object.keys(mapTools.maps.mymap.markers.all).length).to.equal(1);
    });
  });
  describe('to add Multiple Markers', function () {
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

      var result = map.addMarker(markers);
      expect(result).to.have.length.of(2);
      expect(Object.keys(mapTools.maps.mymap.markers.all).length).to.equal(2);
    });
  });
  describe('with a "callback" property', function () {
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
  describe('with a custom UID set as Map option', function () {
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
  describe('with a custom UID set as Marker data.property', function () {
    it('should add the Marker using the custom UID', function () {
      map.addMarker({
        lat: 42,
        lng: 2,
        title: 'Andorra',
        data: {
          uid: 'A1'
        }
      });

      expect(map.markers.all['A1'].lat).to.eql(42);
      expect(map.markers.all['A1'].lng).to.eql(2);
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


  describe('with an empty Array as first Parameter', function() {
    it('should return an empty Array', function() {
      var result = map.addMarker([])
      expect(result).to.be.a('array');
      expect(result.length).to.eql(0);
    });
  });

});
