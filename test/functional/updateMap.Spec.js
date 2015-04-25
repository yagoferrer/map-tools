describe('when calling updateMap()', function () {
  "use strict";

  var map;
  beforeEach(function () {
    if (mapTools.maps && mapTools.maps.mymap) {
      delete mapTools.maps.mymap;
    }
    map = new mapTools({async: false, id: 'mymap', lat: 41.3833, lng: 2.1833});
  });

  it('should update any options set', function () {
    map.updateMap({type: 'TERRAIN'});
    expect(map.instance.options.mapTypeId).to.eql('TERRAIN');
  });
});
