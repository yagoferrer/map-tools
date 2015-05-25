describe('Given the infoWindow property option', function () {

  var map;
  beforeEach(function () {
    if (mapTools.maps && mapTools.maps.mymap) {
      delete mapTools.maps.mymap;
    }
    map = new mapTools({async: false, id: 'mymap', lat: 41.3833, lng: 2.1833});
  });


  describe('with "content" has a reference to a "data" variable', function () {

    it('should replace the variable in "content" using the "data" variable', function () {
      var marker = {
        lat: 41.3833,
        lng: 2.1833,
        infoWindow: {
          content: '{city}',
          open: {on: 'mousever'},
          close: {on: 'mouseout'}
        },
        data: {
          city: 'barcelona'
        }
      };
      map.addMarker(marker);

      expect(map.infoWindow.content).to.equal('barcelona');
    });

  });

  describe('with the same open() and close() mouse events', function () {
    it('should close the infoWindow', function() {
      var options = {
        lat: 41.3833,
        lng: 2.1833,
        infoWindow: {
          open: {on: 'click'},
          close: {on: 'click'}
        }
      };

      var spy = sinon.spy();

      map.infoWindow = {
        getMap: function() {
          return 'map'
        },
        close: spy
      };

      map.addMarker(options);

      expect(spy).to.have.been.called;


    });
  });

  describe('with a close() duration', function () {

    it('should close the current infoWindow', function () {
      var options = {
        lat: 41.3833,
        lng: 2.1833,
        infoWindow: {
          open: {on: 'mousever'},
          close: {on: 'mouseout', duration: 1}
        }
      };

      var spy = sinon.spy();

      map.infoWindow = {
        getMap: function() {
          return 'map'
        },
        close: spy
      };

      map.addMarker(options);

      expect(spy).to.have.been.called;
    });

  });



});
