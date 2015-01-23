'use strict';

describe('Given GMPlus', function () {

  describe('when instantiating without any options', function() {

    it('should return an error in the callback function', function (done) {
      GMP(null, function(err, instance) {
        expect(err.message).to.equals('You must set some options');
        done();
      });
    });
  });

  xdescribe('when instantiating with a valid Id and coordinates', function () {

    it('should create a map', function (done) {

      GMP({
        id: 'myMap',
        lat: 41.3833,
        lng: 2.1833
      }, function(err, instance) {

          expect(err).to.be.false;

      })

    });

  });
});
