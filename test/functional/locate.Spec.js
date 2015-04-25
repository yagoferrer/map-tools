describe('Given the Locate() Method', function(){

  var map;

  beforeEach(function () {

    map = new mapTools({id:'mymap', sync: true, lat:41, lng: 1});

  });

  it('Should return an object with the current location', function() {

    var result = map.locate();

    expect(result.lat).to.eql(41);
    expect(result.lng).to.eql(1);

  });
});
