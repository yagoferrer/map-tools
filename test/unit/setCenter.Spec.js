describe('Given the setCenter Class', function () {


  var setCenter, spy;

  beforeEach(function () {

    var global = {
      google: {
        maps: {
          LatLng: function(a,b) { return {lat: a, lng: b}}
        }
      }
    };


    spy = sinon.spy();


    var that = {
        instance: {
          setCenter: spy
        },
      options: {
        lat: 1,
        lng: 2
      },
    };

    setCenter = require('map-tools/setCenter')(global, that);

  });

  it('should center the Map given coordinates', function () {

    setCenter(40.416854, -3.703419);
    expect(spy).to.have.been.calledWith({ lat: 40.416854, lng: -3.703419 });


  });


  it('should center the Map using initial coordinates', function() {

    setCenter();
    expect(spy).to.have.been.calledWith({ lat: 1, lng: 2 });

  });


});
