describe('Given the Map Module', function () {

  describe('when calling load()', function () {

    var map;

    beforeEach(function () {
      map = require('gmplus/gmaps')(window);
    });

    it('should load a Google Maps Instance', function () {
      var result = map.load({id: 'myMap'});
      expect(result).to.eql({ type: 'text/javascript', src: '//maps.googleapis.com/maps/api/js?v=3.exp&callback=GMP.maps.myMap.create' });
    });

  });

});
