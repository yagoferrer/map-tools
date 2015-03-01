describe('when calling updateGroup()', function () {
  "use strict";

  it('should invoke the setter of the Marker option with the new value', function () {
    var map = new mapTools({async: false, id: 'mymap', lat: 41.3833, lng: 2.1833});
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
