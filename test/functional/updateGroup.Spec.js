describe('when calling updateGroup()', function () {
  "use strict";

  var map;
  beforeEach(function () {
    if (mapTools.maps && mapTools.maps.mymap) {
      delete mapTools.maps.mymap;
    }
    map = new mapTools({async: false, id: 'mymap', lat: 41.3833, lng: 2.1833});
  });

  it('should invoke the setter of the Marker option with the new value', function () {
    map.addGroup('myGroup', {visible: true});

    var marker = {
      lat: 41.3833,
      lng: 2.1833,
      title: 'Barcelona',
      group: 'myGroup'
    };

    var result = map.addMarker(marker);
    expect(result.visible).to.be.true;
    map.updateGroup('myGroup', {visible: false});
    expect(mapTools.maps.mymap.markers.groups.myGroup[0].visible).to.be.false;
  });

});
