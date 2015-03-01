describe('Given the Map Module', function () {
  "use strict";

  describe('when calling load()', function () {

    var map;

    beforeEach(function () {
      map = require('map-tools/gmaps')(window);
    });

    it('should load a Google Maps Instance', function () {
      var result = map.load('mymap', {id: 'mymap'});

      expect(result.type).to.equal('text/javascript');
      expect(result.src).to.equal('//maps.googleapis.com/maps/api/js?v=3.18&callback=mapTools.maps.mymap.create');
    });

  });

});
