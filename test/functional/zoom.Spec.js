"use strict";
describe('Given the Zoom API', function () {
  var map;
  beforeEach(function () {
    map = new mapTools({async: false, id: 'mymap', lat: 41.3833, lng: 2.1833});
  });
  describe('When calling Zoom', function () {
    it('should  return the current Zoom level', function () {
      expect(map.zoom()).to.equal(8);
    });

    describe('when passing a value', function () {
      it('should set a zoom level', function () {
        map.zoom(16);
        expect(map.zoom()).to.equal(16);
      });
    });
  });
});
