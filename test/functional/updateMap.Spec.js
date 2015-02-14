describe('when calling updateMap()', function () {
  it('should update any options set', function () {
    var map = new GMP({sync: true, id: 'myMap', lat: 41.3833, lng: 2.1833, type: 'ROADMAP'});
    map.updateMap({type: 'TERRAIN'});
    expect(map.instance.options.mapTypeId).to.eql('TERRAIN');
  });
});
