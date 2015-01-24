'use strict';

describe('Given GMPlus', function () {

  describe('when instantiating', function() {


    it('should return an error if you don\'t pass a options parameter', function (done) {
      var map = new GMP(null, function (err) {
        expect(err.message).to.equals('You must pass a valid first parameter: options');
        done();
      });
    });


    it('should return an error if you don\'t pass a valid "id" or "class" property value', function (done) {
      var map = new GMP({}, function(err) {
        expect(err.message).to.equals('You must pass an "id" or a "class" property values');
        done();
      });
    });


    it('should return an error if you don\'t pass a valid "lat" or "lng" values', function (done) {
      var map = new GMP({id:'myMap'}, function(err) {
        expect(err.message).to.equals('You must pass valid "lat" (latitude) and "lng" (longitude) values');
        done();
      });
    });

    it('should return a Map instance when you pass: "id", "lat" and "lng"', function (done) {
      var map = new GMP({async: false, id: 'myMap', lat: 41.3833, lng: 2.1833}, function(err, instance) {
        expect(instance.gm_bindings_).to.be.a('object');
        done();
      });
    });
  });



  describe('when calling addMarker', function () {


    it('should add one individual Marker to the Map', function() {


      var map = new GMP({async: false, id: 'myMap', lat: 41.3833, lng: 2.1833}, function(){});

      var result = map.addMarker({
        lat: 42.5000,
        lng: 1.5167,
        title: 'Andorra'
      });

      expect(result.name).to.equal('marker');
      expect(GMP.maps.myMap.groups.all).to.have.length.of(1);

    });

    it('should add multiple Markers to the Map', function() {
      var map = new GMP({async: false, id: 'myMap', lat: 41.3833, lng: 2.1833}, function(){});

      var result = map.addMarker([{
          lat: 41.3833,
          lng: 2.1833,
          title: 'barcelona'
        },
          {
            lat: 41.4489,
            lng: 2.2461,
            title: 'badalona'
          }],
        {group: 'myGroup'});

      expect(result).to.have.length.of(2);
      expect(GMP.maps.myMap.groups.myGroup).to.have.length.of(2);
    });

  });
});
