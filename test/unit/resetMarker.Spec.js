describe('Given the resetMarker() Module', function () {

  var resetMarker, g;

  beforeEach(function () {

    g = {
      mapTools: {
        maps: {
          mymap: {
            markers: {
              all: {}
            }
          }
        }
      }
    };

    g.google = window.google;
     var that = {id: 'mymap'};
     resetMarker = require('map-tools/resetMarker')(g, that);
  });


  it('should reset a specific Marker property', function() {

    var spy = sinon.spy();

    var marker = {
      data: {
        uid: 'marker',
        _self: {icon: 'x.png'}
    },
      setOptions: spy
    };

    g.mapTools.maps.mymap.markers.all.marker = marker;
    resetMarker(marker, 'icon');
    expect(spy).to.have.been.calledWith({ icon: 'x.png' });

  });

  it('should reset a list of Marker properties', function() {

    var spy1 = sinon.spy();
    var spy2 = sinon.spy();
    var spy3 = sinon.spy();
    var spy4 = sinon.spy();

    var marker1 = {
      data: {
        uid: 'marker1',
        _self: {icon: 'x.png', lat: 41, lng: 2}
      },
      setOptions: spy1,
      setPosition: spy2
    };

    var marker2 = {
      data: {
        uid: 'marker2',
        _self: {icon: 'x.png', lat: 41, lng: 3}
      },
      setOptions: spy3,
      setPosition: spy4
    };

    g.mapTools.maps.mymap.markers.all.marker1 = marker1;
    g.mapTools.maps.mymap.markers.all.marker2 = marker2;

    resetMarker([marker1, marker2], ['icon', 'lat', 'lng']);
    expect(spy1).to.have.been.calledWith({ icon: 'x.png' });
    expect(spy2).to.have.been.called;
    expect(spy3).to.have.been.calledWith({ icon: 'x.png' });
    expect(spy4).to.have.been.called;

  });

});
