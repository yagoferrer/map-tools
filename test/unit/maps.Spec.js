describe('Given the Maps module', function () {

  var maps;

  beforeEach(function () {
    maps = require('maps');
  });

  describe('when calling maps.load()', function () {
    it('should you load a map', function() {
      var response = maps.load('myId', {});
      expect(response.src).to.equal('//maps.googleapis.com/maps/api/js?v=3.18&callback=mapTools.maps.myId.create');
      expect(response.type).to.equal('text/javascript');
    });
  });


  describe('when calling mapOptions()', function () {

    it('should return a Map Options Object', function () {

      var args = {
        "id": "mymap",
        "lat": 41.3833,
        "lng": 2.1833,
        "type": "ROADMAP",
        "on": {}
      };

      var response = maps.mapOptions(args);

      expect(response.zoom).to.equal(8);
      expect(response.center.latitude).to.equal(args.lat);
      expect(response.center.longitude).to.equal(args.lng);
      expect(response.mapTypeId).to.equal(args.type);

    });

  });



});
