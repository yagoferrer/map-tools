describe('when calling loadTopoJson()', function () {

  it('should convert TopoJSON to GeoJSON and load the file into the Map', function () {

    var map = new GMP({async: false, id: 'myMap', lat: 41.3833, lng: 2.1833});

    var topojson = {
      objects: {
        'states': {}
      }
    };

    var options = [{object: 'states'}];

    var result = map.loadTopoJson(topojson, options);

    expect(result).to.eql([{ag: {D: 53}}, {ag: {D: 30}}]);

  });


  describe('with styles', function () {

    it('should apply the styles to each Feature', function () {

      var map = new GMP({async: false, id: 'myMap', lat: 41.3833, lng: 2.1833});



      var topojson = {
        objects: {
          'states': {}
        }
      };

      var options = [
        {
          object: 'states',
          style: {
            strokeWeight: 2,
            fillOpacity: 0
          }
        }
      ];


      var result = map.loadTopoJson(topojson, options);

      expect(result[0].style).to.eql(options[0].style)


    });

  });

});
