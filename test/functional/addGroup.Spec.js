describe('when calling addGroup()', function () {
  "use strict";

  it('should save the "Group Options"', function () {
    var map = new mapTools({async: false, id: 'mymap', lat: 41.3833, lng: 2.1833});
    map.addGroup('myGroup', {myGroupProp: true});
    expect(mapTools.maps.mymap.markers.groupOptions.myGroup).to.eql({myGroupProp: true});
  });


  it('should merge the options set for that Group when adding a  Marker', function () {
    var map = new mapTools({async: false, id: 'mymap', lat: 41.3833, lng: 2.1833});
    map.addGroup('myGroup', {myGroupProp: true});
    var markers = {
      lat: 41.3833,
      lng: 2.1833,
      title: 'Barcelona'
    };
    map.addMarker(markers, {group: 'myGroup'});
    expect(mapTools.maps.mymap.markers.groups.myGroup[0].myGroupProp).to.be.true;
  });


  describe('with the same option in the Marker, the 2nd parameter and the Group', function () {

    it('should take preference whatever is set in the Group', function () {
      var map = new mapTools({async: false, id: 'mymap', lat: 41.3833, lng: 2.1833});
      map.addGroup('myGroup', {myGroupProp: '3'});

      var markers = {
        lat: 41.3833,
        lng: 2.1833,
        title: 'Barcelona',
        myGroupProp: '1'
      };
      map.addMarker(markers, {myGroupProp: '2', group: 'myGroup'});
      expect(mapTools.maps.mymap.markers.groups.myGroup[0].myGroupProp).to.equal('3');
    });

  });

});
