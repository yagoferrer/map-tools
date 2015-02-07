'use strict';

describe('Given gmplus.js', function () {

  describe('when instantiating', function () {


    it('should return an error if you don\'t pass a options parameter', function (done) {
      var map = new GMP(null, function (err) {
        expect(err.message).to.equals('You must pass a valid first parameter: options');
        done();
      });
    });


    it('should return an error if you don\'t pass a valid "id" or "class" property value', function (done) {
      var map = new GMP({}, function (err) {
        expect(err.message).to.equals('You must pass an "id" or a "class" property values');
        done();
      });
    });


    it('should return an error if you don\'t pass a valid "lat" or "lng" values', function (done) {
      var map = new GMP({id: 'myMap'}, function (err) {
        expect(err.message).to.equals('You must pass valid "lat" (latitude) and "lng" (longitude) values');
        done();
      });
    });

    it('should return a Map instance when you pass: "id", "lat" and "lng" and async:false', function (done) {
      var map = new GMP({async: false, id: 'myMap', lat: 41.3833, lng: 2.1833}, function (err, instance) {
        expect(instance.gm_bindings_).to.be.a('object');
        done();
      });
    });

    it('should append a  Map instance when you pass: "id", "lat" and "lng" and async:true', function (done) {
      var map = new GMP({id: 'myMap', lat: 41.3833, lng: 2.1833}, function (err, instance) {
        expect(instance.gm_bindings_).to.be.a('object');
        done();
      });
    });

    describe('with crossfilter', function () {


      it('should add the marker data to the crossfilter', function () {
        var spy = sinon.spy();
        var map = new GMP({sync: true, id: 'myMap', type: 'ROADMAP', lat: 41.3833, lng: 2.1833, crossfilter: {add: spy}});

        var result = map.addMarker({
          lat: 42.5000,
          lng: 1.5167,
          title: 'Andorra'
        });

        expect(result.title).to.equal('Andorra');
        expect(Object.keys(GMP.maps.myMap.markers.all).length).to.equal(1);
        expect(spy).to.have.been.called;
      });
    });

  });


  describe('when calling addMarker()', function () {

    it('should add one individual Marker to the Map', function () {
      var map = new GMP({async: false, id: 'myMap', lat: 41.3833, lng: 2.1833});

      var result = map.addMarker({
        lat: 42.5000,
        lng: 1.5167,
        title: 'Andorra'
      });

      expect(result.title).to.equal('Andorra');

      expect(Object.keys(GMP.maps.myMap.markers.all).length).to.equal(1);

    });

    it('should add multiple Markers to the Map', function () {
      var map = new GMP({async: false, id: 'myMap', lat: 41.3833, lng: 2.1833});

      var markers = [{
        lat: 41.3833,
        lng: 2.1833,
        title: 'Barcelona'
      }, {
        lat: 41.4489,
        lng: 2.2461,
        title: 'Badalona',
        move: map.bounce
      }];

      var result = map.addMarker(markers, {group: 'myGroup'});

      expect(result).to.have.length.of(2);
      expect(Object.keys(GMP.maps.myMap.markers.all).length).to.equal(2);
    });


    describe('with a the "bubble" option witch "content" has a reference to a "data" variable', function () {


      it('should replace the variable in "content" using the "data" variable', function () {
        var map = new GMP({async: false, id: 'myMap', lat: 41.3833, lng: 2.1833});
        var marker = {
          lat: 41.3833,
          lng: 2.1833,
          bubble: {
            content: '{city}'
          },
          data: {
            city: 'barcelona'
          }
        };
        var result = map.addMarker(marker);
        expect(result.bubble.content).to.equal('barcelona');
      });
    });


    describe('with extra options as a second parameter', function () {

      it('should merge the options with the Marker options', function () {

        var map = new GMP({async: false, id: 'myMap', lat: 41.3833, lng: 2.1833});

        var markers = [{
          lat: 41.3833,
          lng: 2.1833,
          title: 'Barcelona'
        }, {
          lat: 41.4489,
          lng: 2.2461,
          title: 'Badalona'
        }];

        var result = map.addMarker(markers, {myGroupProp: true});

        expect(result[0].myGroupProp).to.be.ok;
        expect(result[1].myGroupProp).to.be.ok;

        expect(GMP.maps.myMap.markers.all[Object.keys(GMP.maps.myMap.markers.all)[0]].myGroupProp).to.be.ok;
        expect(GMP.maps.myMap.markers.all[Object.keys(GMP.maps.myMap.markers.all)[1]].myGroupProp).to.be.ok;

      });

    });


    describe('with a "group" property but the Group was not added yet', function () {
      it('should add the Marker to the Group anyway', function () {
        var map = new GMP({async: false, id: 'myMap', lat: 41.3833, lng: 2.1833});
        map.addMarker({
          lat: 42.5000,
          lng: 1.5167,
          title: 'Andorra',
          group: 'myGroup'
        });

        expect(GMP.maps.myMap.markers.groups.myGroup).to.have.length.of(1);
      });
    });
  });


  describe('when calling addGroup()', function () {

    it('should save the "Group Options"', function () {
      var map = new GMP({async: false, id: 'myMap', lat: 41.3833, lng: 2.1833});
      map.addGroup('myGroup', {myGroupProp: true});
      expect(GMP.maps.myMap.markers.groupOptions.myGroup).to.eql({myGroupProp: true});
    });


    it('should merge the options set for that Group when adding a  Marker', function () {
      var map = new GMP({async: false, id: 'myMap', lat: 41.3833, lng: 2.1833});
      map.addGroup('myGroup', {myGroupProp: true});
      var markers = {
        lat: 41.3833,
        lng: 2.1833,
        title: 'Barcelona'
      };
      map.addMarker(markers, {group: 'myGroup'});
      expect(GMP.maps.myMap.markers.groups.myGroup[0].myGroupProp).to.be.true;
    });


    describe('with the same option in the Marker, the 2nd parameter and the Group', function () {

      it('should take preference whatever is set in the Group', function () {
        var map = new GMP({async: false, id: 'myMap', lat: 41.3833, lng: 2.1833});
        map.addGroup('myGroup', {myGroupProp: '3'});

        var markers = {
          lat: 41.3833,
          lng: 2.1833,
          title: 'Barcelona',
          myGroupProp: '1'
        };
        map.addMarker(markers, {myGroupProp: '2', group: 'myGroup'});
        expect(GMP.maps.myMap.markers.groups.myGroup[0].myGroupProp).to.equal('3');
      });

    });

  });

  describe('when calling updateGroup()', function () {

    it('should invoke the setter of the Marker option with the new value', function () {
      var map = new GMP({async: false, id: 'myMap', lat: 41.3833, lng: 2.1833});
      map.addGroup('myGroup', {visible: true});

      var marker = {
        lat: 41.3833,
        lng: 2.1833,
        title: 'Barcelona',
        group: 'myGroup'
      };

      var result = map.addMarker(marker);
      expect(result.visible).to.be.true;
      map.updateGroup('myGroup', {visible: false});
      expect(GMP.maps.myMap.markers.groups.myGroup[0].visible).to.be.false;
    });

  });


  describe('when calling updateMarker()', function () {
    it('should invoke the Marker options setter for each property passed', function () {
      var map = new GMP({async: false, id: 'myMap', lat: 41.3833, lng: 2.1833});

      var options = {
        lat: 41.3833,
        lng: 2.1833,
        title: 'Barcelona',
        visible: false,
        bubble: {
          content: 'Barcelona!'
        }
      };

      var result = map.addMarker(options);
      var uid = result.data.uid;
      expect(GMP.maps.myMap.markers.all[uid].visible).to.be.false;

      map.updateMarker({uid: uid}, {visible: true, move: map.bounce, lat: 100, lng: 30, bubble: {content: 'click me'}});

      expect(GMP.maps.myMap.markers.all[uid].visible).to.be.true;
      expect(GMP.maps.myMap.markers.all[uid].position.lat()).to.eql(100);
      expect(GMP.maps.myMap.markers.all[uid].position.lng()).to.eql(30);
      expect(GMP.maps.myMap.markers.all[uid].bubble.instance.content).to.eql('click me');
    });

    it('should invoke multiple Markers options setters for each property passed', function () {
      var map = new GMP({async: false, id: 'myMap', lat: 41.3833, lng: 2.1833});

      var markers = [{
        lat: 41.3833,
        lng: 2.1833,
        title: 'Barcelona',
        visible: false
      },
        {
          lat: 42.5000,
          lng: 1.5167,
          title: 'Andorra',
          group: 'myGroup',
          visible: false
        }
      ];

      var result = map.addMarker(markers);
      var uid = result[0].data.uid;
      expect(GMP.maps.myMap.markers.all[uid].visible).to.be.false;
      map.updateMarker([{uid: uid}], {visible: true, move: map.bounce});
      expect(GMP.maps.myMap.markers.all[uid].visible).to.be.true;
    });
  });


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

});
