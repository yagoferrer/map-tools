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
});
