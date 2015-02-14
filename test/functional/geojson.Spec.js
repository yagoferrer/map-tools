describe('When calling addGeoJson()', function () {
  "use strict";

  it('should add GeoJSON', function () {

    var map = new GMP({sync: true, id: 'mymap', type: 'ROADMAP', lat: 41.3833, lng: 2.1833});

    var result = map.addGeoJson({});

    expect(result[0].ag.D).to.eql(53);

  });

});
