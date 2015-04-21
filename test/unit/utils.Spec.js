
describe('Given the Utils Class', function () {
  describe('when calling clone()', function () {
    it('should clone an object', function() {
      var obj = {
        property1: 'value1'
      };

      var utils = require('map-tools/utils');
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

        var utils = require('map-tools/utils');
        var output = utils.clone(obj, ['property2', 'property3']);
        expect(output).to.eql({property1: 'value1'});
      });

    });

  });


  describe('when calling isArray', function () {

    var utils;

    beforeEach(function() {
      utils = require('map-tools/utils');
    });

    it('should return True when the input is an Array', function() {
      var result = utils.isArray([]);
      expect(result).to.eql(true);
    });


    it('should return False when the input is not an Array', function() {
      var utils = require('map-tools/utils');
      var result = utils.isArray('string');
      expect(result).to.eql(false);
    });


  });
});
