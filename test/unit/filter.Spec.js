describe('Given the filterFeature Module', function () {

  var that, filterFeature, data;

  beforeEach(function () {
    data = [
      {data: {NAME: 'Gert'}, uid: 1},
      {data: {NAME: 'Peter', age: 23}, uid: 2},
      {data: {NAME: 'Peter', age: 35}, uid: 3},
      {data: {NAME: 'Max'}, uid: 4}
    ];

    var cf = crossfilter(data);


    that = {
      json: {
        all: {},
        filter: {
          NAME: cf.dimension(function(d) {return d.data.NAME;})
        }
      }
    };

    for (var x in data) {
      that.json.all[data[x].uid] = data[x];
    }

    filterFeature = require('map-tools/filter')({}, that, 'json');
  });

  it('should filter exact values when passing an object', function () {
    var result = filterFeature({NAME: 'Peter'});
    expect(result).to.eql([data[2], data[1]]);
  });

  it('should return all elements order by the dimension, when passing the dimension name', function () {
    var result = filterFeature('NAME');
    expect(result).to.eql([data[2], data[1], data[3], data[0]]);
  });


  it('should return all elements order by the dimension, when passing the dimension name and order DESC', function () {
    var result = filterFeature('NAME', {order: 'DESC'});
    expect(result).to.eql([data[0], data[3], data[1], data[2]]);
  });

  it('should limit the results when using limit', function () {
    var result = filterFeature({NAME: 'Peter'}, {limit: 1});
    expect(result).to.eql(data[2]);
  });

});
