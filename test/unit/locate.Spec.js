describe('Given the Locate Module', function () {


  var locate;

  beforeEach(function() {

    locate = require('locate');
    locate.prototype.instance = {
      getCenter: function() {
        return {
          lat: function() {return 41;},
          lng: function() {return 2;}
        };
      }
    };

  });

  describe('when calling locate', function () {
    it('should give you the center location', function () {
        var result = new locate().locate();
        expect(result).to.eql({ lat: 41, lng: 2 });

    });

  });

});
