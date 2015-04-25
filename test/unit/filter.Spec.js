describe('Given the filterFeature Module', function () {

  var that, filterFeature, data;

  beforeEach(function () {
    data = [
      {data: {NAME: 'Gert', age: 21}, uid: 1},
      {data: {NAME: 'Peter', age: 23}, uid: 2},
      {data: {NAME: 'Peter', age: 35}, uid: 3},
      {data: {NAME: 'Max', age: 44}, uid: 4}
    ];
    var cf = crossfilter(data);
    that = {
      json: {
        all: {},
        filter: {
          NAME: cf.dimension(function(d) {return d.data.NAME;}),
          age: cf.dimension(function(d) {return d.data.age;})
        }
      }
    };
    for (var x in data) {
      that.json.all[data[x].uid] = data[x];
    }
    filterFeature = require('map-tools/filter')({}, that, 'json');
  });

  describe('when no arguments are passed', function() {
    it('should return the entire collection', function() {
      var result = filterFeature();
      expect(result).to.eql(data)
    });
  });

  describe('when limit 1 is set with no order', function() {
    it('should return the highest value', function() {
      var result = filterFeature('age', {limit: 1});
      expect(result.uid).to.eql(4);
    });
  });

  describe('when limit 1 is set with DESC order', function(){

    it('should return the lowest number', function() {

      var result = filterFeature('age', {limit: 1, order: 'DESC'});
      expect(result.uid).to.eql(1);
    });

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
