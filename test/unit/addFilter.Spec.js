describe('Given the addFilter Module', function () {

  it('should add a filter to Markers', function () {
    var global = {mapTools: {
      maps: {mymap: {
        markers: {}
      }}
    }};
    var that = {id: 'mymap', markers: {}};
    var addFilter = require('map-tools/addFilter')(global, that, 'markers');
    addFilter('myFilter');
    expect(that.markers.filter.myFilter).to.be.a('object');
    expect(that.markers.filter.myFilter.top()).to.eql([]);

  });

  it('should add multiple filters to Markers', function () {
    var global = {mapTools: {
      maps: {mymap: {
        markers: {}
      }}
    }};
    var that = {id: 'mymap', markers: {}};
    var addFilter = require('map-tools/addFilter')(global, that, 'markers');
    addFilter(['myFilter1', 'myFilter2']);
    expect(that.markers.filter.myFilter1).to.be.a('object');
    expect(that.markers.filter.myFilter2).to.be.a('object');

  });
});
