
describe('Given the Utils Class', function () {

  var utils;

  beforeEach(function () {
    utils = require('utils');
  });


  describe('when calling clone()', function () {
    it('should clone an object', function() {
      var obj = {
        property1: 'value1'
      };

      var output = utils.clone(obj);
      expect(output).to.eql(obj);
      obj.property1 = 'value2';
      expect(output.property1).to.eql('value1');
    });

    describe('with a an array of keys as second parameter', function () {

      it('should not clone the exception keys', function() {
        var obj = {
          property1: 'value1',
          property2: 'value2',
          property3: 'value3'
        };


        var output = utils.clone(obj, ['property2', 'property3']);
        expect(output).to.eql({property1: 'value1'});
      });

    });

  });


  describe('when calling isArray', function () {

    it('should return True when the input is an Array', function() {

      var result1 = utils.isArray([]);
      expect(result1).to.eql(true);

    });


    it('should return False when the input is not an Array', function() {
      var result = utils.isArray('string');
      expect(result).to.eql(false);
    });

  });


  describe('when calling defaultDimension()', function () {
    describe('if the property exists in the root level', function () {
      it('should return the value of the property', function () {
        var result = utils.defaultDimension('visible')({data:{}, visible: true});
        expect(result).to.eql(true);
      });

    });
    describe('if the property exists under "data"', function () {
      it('should return the value of the data.property', function () {
        var result = utils.defaultDimension('visible')({data:{visible: true}});
        expect(result).to.eql(true);
      });
    });

    describe('if the property does not exist anywhere', function () {

      it('should return null', function () {
        var result = utils.defaultDimension('visible')({data:{}});
        expect(result).to.eql(null);
      });

    });
  });
});
