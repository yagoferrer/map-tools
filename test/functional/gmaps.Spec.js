describe('Given map-tools.js', function () {
  "use strict";

  describe('when instantiating', function () {


    it('should return an error if you don\'t pass a options parameter', function (done) {
      var map = new mapTools(null, function (err) {
        expect(err.message).to.equals('You must pass a valid first parameter: options');
        done();
      });
    });


    it('should return an error if you don\'t pass a valid "id" or "el" property value', function (done) {
      var map = new mapTools({}, function (err) {
        expect(err.message).to.equals('You must pass an "id" or a "el" property values');
        done();
      });
    });


    it('should return an error if you don\'t pass a valid "lat" or "lng" values', function (done) {
      var map = new mapTools({id: 'mymap'}, function (err) {
        expect(err.message).to.equals('You must pass valid "lat" (latitude) and "lng" (longitude) values');
        done();
      });
    });

    it('should return a Map instance when you pass: "id", "lat" and "lng" and async:false', function (done) {
      var map = new mapTools({async: false, id: 'mymap', lat: 41.3833, lng: 2.1833}, function (err, instance) {
        expect(instance.gm_bindings_).to.be.a('object');
        done();
      });
    });

    it('should append a  Map instance when you pass: "id", "lat" and "lng" and async:true', function (done) {
      var map = new mapTools({id: 'mymap', lat: 41.3833, lng: 2.1833}, function (err, instance) {
        expect(instance.gm_bindings_).to.be.a('object');
        done();
      });
    });

    describe('with crossfilter', function () {


      it('should add the marker data to the filters', function () {
        var spy = sinon.spy();
        var map = new mapTools({sync: true, id: 'mymap', type: 'ROADMAP', lat: 41.3833, lng: 2.1833});

        var result = map.addMarker({
          lat: 42.5000,
          lng: 1.5167,
          title: 'Andorra'
        }, {
          filters: [{add: spy}]
        });

        expect(result.title).to.equal('Andorra');
        expect(Object.keys(mapTools.maps.mymap.markers.all).length).to.equal(1);
        expect(spy).to.have.been.called;
      });
    });
  });

});
