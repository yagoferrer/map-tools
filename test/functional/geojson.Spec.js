describe('When calling addGeoJson()', function () {
  "use strict";

  var map;
  beforeEach(function () {
    if (mapTools.maps && mapTools.maps.mymap) {
      delete mapTools.maps.mymap;
    }
    map = new mapTools({async: false, id: 'mymap', lat: 41.3833, lng: 2.1833});
  });

  it('should add GeoJSON', function () {
    var result = map.addGeoJson({});
    expect(result[0].ag.D).to.eql(53);
  });

});
