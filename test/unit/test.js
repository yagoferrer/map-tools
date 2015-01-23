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


  });
});
