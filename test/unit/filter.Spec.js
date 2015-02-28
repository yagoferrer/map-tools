describe('Given the filterFeature Module', function () {

  var that, filterFeature, data;

  beforeEach(function () {
    data = [{NAME: 'Gert'}, {NAME: 'Peter', age: 23}, {NAME: 'Peter', age: 35}, {NAME: 'Max'}];

    var cf = crossfilter(data);

    that = {
      json: {
        filter: {
          NAME: cf.dimension(function(d) {return d.NAME;})
        }
      }
    };

    filterFeature = require('map-tools/filter')({}, that, 'json');
  });

  it('should filter exact values', function () {
    var result = filterFeature({NAME: 'Peter'});
    expect(result).to.eql([data[2], data[1]]);
  });

  it('should limit the results when using limit', function () {
    var result = filterFeature({NAME: 'Peter'}, {limit: 1});
    expect(result).to.eql(data[2]);
  });

});
