describe('Given the Utils Module', function () {

  var config;
  beforeEach(function() {

    config = require('config');
  });

  it('should have configuration parameters', function () {
    expect(config.version).to.be.a('string');
    expect(config.url).to.be.a('string');
    expect(config.zoom).to.be.a('number');
    expect(config.customMapOptions).to.be.a('array');
    expect(config.customMarkerOptions).to.be.a('array');
    expect(config.panelPosition).to.be.a('string');
    expect(config.customInfoWindowOptions).to.be.a('array');
    expect(config.customEvents).to.be.a('array');
  });

});
