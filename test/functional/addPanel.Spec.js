describe('when calling addPanel()', function () {
  "use strict";

  var map;
  beforeEach(function () {
    if (mapTools.maps && mapTools.maps.mymap) {
      delete mapTools.maps.mymap;
    }
    map = new mapTools({async: false, id: 'mymap', lat: 41.3833, lng: 2.1833});
  });

  it('should add a single panel on the specified position', function () {

    map.addPanel({
      template: '<div>' +
      '<button id="clickMe" class="test-button">ctrl 1</button></div>',
      position: 'top center'
    });

    expect(Object.keys(mapTools.maps.mymap.instance.controls[2]).length).to.equal(1);

  });

  it('should add a single panel with the specified style options', function (done) {

    map.addPanel({
      template: '<div><button id="clickMe">ctrl 1</button></div>',
      style: {
        'background-color': '#fff',
        'margin-bottom': '22px'
      }

    }, function(err, panel) {
      expect(panel.style).to.eql({backgroundColor: '#fff', marginBottom: '22px'})
      done();
    });



  });

  it('should add a single panel with the specified events options', function () {

    var spy = sinon.spy();

    var panel = map.addPanel({
      template: '<div><button id="clickMe">ctrl 1</button></div>',
      events: {
        '#clickMe click' : spy
      }});

    expect(spy).to.have.been.called;

  });

   /*
  it('should load an external template URL when provided', function(done) {
    XMLHttpRequest = function() {
      this.readyState = 4;
      this.status = 200;
      this.onload = function() {}
      this.open = function() {}
      this.responseText =  '<div><button id="clickMe" class="test-button">ctrl 1</button></div>';
      this.send = function(){
        this.onload();
      }

      return this;
    };

    map.addPanel({
      templateURL: 'control-template.html',
      position: 'top center'
    }, function() {

      expect(Object.keys(mapTools.maps.mymap.instance.controls[2]).length).to.equal(1);
      done()
    });
  });
  */
});
