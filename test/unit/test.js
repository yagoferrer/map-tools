'use strict';

describe('Given GMPlus', function () {

  describe('when instantiating', function() {


    it('should return an error if you don\'t pass a options parameter', function (done) {
      GMP(null, function (err) {
        expect(err.message).to.equals('You must pass a valid first parameter: options');
        done();
      });
    });


    it('should return an error if you don\'t pass a valid "id" or "class" property value', function (done) {
      GMP({}, function(err) {
        expect(err.message).to.equals('You must pass an "id" or a "class" property values');
        done();
      });
    });


    it('should return an error if you don\'t pass a valid "lat" or "lng" values', function (done) {
      GMP({id:'myMap'}, function(err) {
        expect(err.message).to.equals('You must pass valid "lat" (latitude) and "lng" (longitude) values');
        done();
      });
    });

    it('should return a Map instance when you pass: "id", "lat" and "lng"', function (done) {
      GMP({async: false, id: 'myMap', lat: '41.3833', lng: '2.1833'}, function(err, instance) {
        expect(instance.gm_bindings_).to.be.a('object');
        done();

      });
    });

  });
});
