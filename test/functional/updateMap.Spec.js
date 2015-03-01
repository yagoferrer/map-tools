describe('when calling updateMap()', function () {
  "use strict";
  it('should update any options set', function () {
    var map = new mapTools({sync: true, id: 'mymap', lat: 41.3833, lng: 2.1833, type: 'ROADMAP'});
    map.updateMap({type: 'TERRAIN'});
    expect(map.instance.options.mapTypeId).to.eql('TERRAIN');
  });
});
