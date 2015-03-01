describe('Given the addFilter Module', function () {

  it('should add a filter to Markers', function () {
    var global = {mapTools: {
      maps: {mymap: {
        markers: {

        }
      }}
    }};
    var that = {id: 'mymap'};
    var addFilter = require('map-tools/addFilter')(global, that);
    addFilter('markers', 'myFilter');
    expect(global.mapTools.maps.mymap.markers.filter.myFilter).to.be.a('object');
    expect(global.mapTools.maps.mymap.markers.filter.myFilter.top()).to.eql([]);

  });

  it('should add multiple filters to Markers', function () {
    var global = {mapTools: {
      maps: {mymap: {
        markers: {}
      }}
    }};
    var that = {id: 'mymap'};
    var addFilter = require('map-tools/addFilter')(global, that);
    addFilter('markers', ['myFilter1', 'myFilter2']);
    expect(global.mapTools.maps.mymap.markers.filter.myFilter1).to.be.a('object');
    expect(global.mapTools.maps.mymap.markers.filter.myFilter2).to.be.a('object');

  });
});
