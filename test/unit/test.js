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

    it('should return a Map instance when you pass: "id", "lat" and "lng"', function (done) {
      var map = new GMP({async: false, id: 'myMap', lat: 41.3833, lng: 2.1833}, function (err, instance) {
        expect(instance.gm_bindings_).to.be.a('object');
        done();
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

      expect(Object.keys(GMP.maps.myMap.markers).length).to.equal(1);

    });

    it('should add multiple Markers to the Map', function () {
      var map = new GMP({async: false, id: 'myMap', lat: 41.3833, lng: 2.1833});

      var markers = [{
        lat: 41.3833,
        lng: 2.1833,
        title: 'Barcelona'
      },{
        lat: 41.4489,
        lng: 2.2461,
        title: 'Badalona'
      }];

      var result = map.addMarker(markers, {group: 'myGroup'});

      expect(result).to.have.length.of(2);
      expect(Object.keys(GMP.maps.myMap.markers).length).to.equal(2);
    });


    describe('with extra options as a second parameter', function () {

      it('should merge the options with the Marker options', function () {

        var map = new GMP({async: false, id: 'myMap', lat: 41.3833, lng: 2.1833});

        var markers = [{
          lat: 41.3833,
          lng: 2.1833,
          title: 'Barcelona'
        },{
          lat: 41.4489,
          lng: 2.2461,
          title: 'Badalona'
        }];

        var result = map.addMarker(markers, {myGroupProp: true});

        expect(result[0].myGroupProp).to.be.ok;
        expect(result[1].myGroupProp).to.be.ok;

        expect(GMP.maps.myMap.markers[Object.keys(GMP.maps.myMap.markers)[0]].myGroupProp).to.be.ok;
        expect(GMP.maps.myMap.markers[Object.keys(GMP.maps.myMap.markers)[1]].myGroupProp).to.be.ok;

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

        expect(GMP.maps.myMap.groups.myGroup).to.have.length.of(1);
      });
    });
  });


  describe('when calling addGroup()', function () {

    it('should save the "Group Options"', function () {
      var map = new GMP({async: false, id: 'myMap', lat: 41.3833, lng: 2.1833});
      map.addGroup('myGroup', {myGroupProp: true});
      expect(GMP.maps.myMap.groupOptions.myGroup).to.eql({myGroupProp: true});
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
      expect(GMP.maps.myMap.groups.myGroup[0].myGroupProp).to.be.true;
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

        expect(GMP.maps.myMap.groups.myGroup[0].myGroupProp).to.equal('3');

      });

    });

  });

  describe('when calling updateGroup()', function () {

    it('should invoke the setter of the Marker option with the new value', function() {

      var map = new GMP({async: false, id: 'myMap', lat: 41.3833, lng: 2.1833});

      map.addGroup('myGroup', {visible : true});

      var marker = {
        lat: 41.3833,
        lng: 2.1833,
        title: 'Barcelona',
        group: 'myGroup'
      };

      var result = map.addMarker(marker);

      expect(result.visible).to.be.true;

      map.updateGroup('myGroup', {visible: false});

      expect(GMP.maps.myMap.groups.myGroup[0].visible).to.be.false;

    });

  });


  describe('when calling updateMarker()', function () {
    it('should invoke the Marker options setter for each property passed', function () {
      var map = new GMP({async: false, id: 'myMap', lat: 41.3833, lng: 2.1833});
      var marker = {
        lat: 41.3833,
        lng: 2.1833,
        title: 'Barcelona',
        visible: false
      };
      var result = map.addMarker(marker);
      var uid = result.data.uid;
      expect(GMP.maps.myMap.markers[uid].visible).to.be.false;
      map.updateMarker([{uid: uid}], {visible: true});
      expect(GMP.maps.myMap.markers[uid].visible).to.be.true;
    });
  });
});
