describe('Given the setCenter Class', function () {

  var center, spy, that;

  beforeEach(function () {

    spy = sinon.spy();

    var center = require('center');

    that = {
      instance: {
        setCenter: spy
      },
      options: {
        lat: 1,
        lng: 2
      },

      center: new center().pos
    };

  });

  it('should center the Map given coordinates', function () {
    that.center(40.416854, -3.703419);


    expect(spy.args[0][0].lat()).to.equal(40.416854);
    expect(spy.args[0][0].lng()).to.equal(-3.703419);
  });


  it('should center the Map using initial coordinates', function() {
    that.center();
    expect(spy.args[0][0].lat()).to.equal(1);
    expect(spy.args[0][0].lng()).to.equal(2);
  });


});
