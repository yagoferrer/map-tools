describe('when calling updateGroup()', function () {

  it('should invoke the setter of the Marker option with the new value', function () {
    var map = new GMP({async: false, id: 'myMap', lat: 41.3833, lng: 2.1833});
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
    expect(GMP.maps.myMap.markers.groups.myGroup[0].visible).to.be.false;
  });

});
