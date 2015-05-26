describe('Given the addFilter Module', function () {

  var addFilter, that;

  beforeEach(function() {

    that = {
      id: 'mymap',
      markers: {
        filter: {},
        crossfilter: crossfilter([])
      }
    };

    addFilter = require('addFilter');
    addFilter = new addFilter(that, 'markers');
  });

  it('should add a filter to Markers', function () {

    addFilter.addFilter('myFilter');
    expect(that.markers.filter.myFilter).to.be.a('object');
    expect(that.markers.filter.myFilter.top()).to.eql([]);

  });

  it('should add multiple filters to Markers', function () {

    addFilter.addFilter(['myFilter1', 'myFilter2']);
    expect(that.markers.filter.myFilter1).to.be.a('object');
    expect(that.markers.filter.myFilter2).to.be.a('object');

  });
});
