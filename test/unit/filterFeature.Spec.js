describe('Given the filterFeature Module', function () {

  var that, filterFeature, data;

  beforeEach(function () {
    data = [{NAME: 'Gert'}, {NAME: 'Peter', age: 23}, {NAME: 'Peter', age: 35}, {NAME: 'Max'}]
    var cf = crossfilter(data);

    that = {
      json: {
        filter: {
          NAME: cf.dimension(function(d) {return d.NAME;})
        }
      }
    };

    filterFeature = require('map-tools/filterFeature')({}, that);
  });

  it('should filter exact values', function () {

    var result = filterFeature({NAME: 'Peter'});

    console.log('result...', result);

    expect(result[0].age).to.eql(data[2].age);
  });




});
