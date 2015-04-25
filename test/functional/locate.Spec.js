describe('Given the Locate() Method', function(){

  var map;
  beforeEach(function () {
    if (mapTools.maps && mapTools.maps.mymap) {
      delete mapTools.maps.mymap;
    }
    map = new mapTools({async: false, id: 'mymap', lat: 41.3833, lng: 2.1833});
  });

  it('Should return an object with the current location', function() {
    var result = map.locate();
    expect(result.lat).to.eql(41);
    expect(result.lng).to.eql(1);
  });
});
