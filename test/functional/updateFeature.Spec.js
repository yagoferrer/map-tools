describe('When calling the updateFeature()', function() {
  "use strict"

  it('should update the feature properties based on the options', function() {
    var map = new mapTools({async: false, id: 'mymap', lat: 41.3833, lng: 2.1833});

    var topojson = {
      objects: {
        'states': {}
      }
    };

    var options = [{object: 'states'}];

    var result = map.addTopoJson(topojson, options);

    map.updateFeature(result[0], {style: {visible: true, fillColor:'#ffffff'}});

    expect(result[0].style.visible).to.equal(true);

    expect(result[0].style.fillColor).to.equal('#ffffff');

  });

});
