describe('when calling addControl()', function () {
	"use strict";

	it('should add a single panel on the specified position', function () {
		var map = new GMP({async: false, id: 'mymap', lat: 41.3833, lng: 2.1833});

		var result = map.addControl({
			template: '<div>' +
			'<button id="clickMe" class="test-button">ctrl 1</button></div>',
			position: 'top center'
		});

		expect(Object.keys(GMP.maps.mymap.instance.controls[2]).length).to.equal(1);

	});

	it('should add a single panel with the specified style options', function () {
		var map = new GMP({async: false, id: 'mymap', lat: 41.3833, lng: 2.1833});

		var panel = map.addControl({
			template: '<div><button id="clickMe">ctrl 1</button></div>',
			style: {
				'background-color': '#fff',
				'margin-bottom': '22px'
			}

		});

		expect(panel.style).to.eql({backgroundColor: '#fff', marginBottom: '22px'})

	});

	it('should add a single panel with the specified events options', function () {
		var map = new GMP({async: false, id: 'mymap', lat: 41.3833, lng: 2.1833});
		var spy = sinon.spy();

		var panel = map.addControl({
			template: '<div><button id="clickMe">ctrl 1</button></div>',
			events: {
				'#clickMe click' : spy
			}});

		expect(spy).to.have.been.called;

	});

  it('should load an external template URL when provided', function() {
    global.XMLHttpRequest = function() {
      return {
        open: function(){},
        send: function(){},
        responseText: '<div><button id="clickMe" class="test-button">ctrl 1</button></div>'
      }
    }

    var map = new GMP({async: false, id: 'mymap', lat: 41.3833, lng: 2.1833});

    map.addControl({
      templateURL: 'control-template.html',
      position: 'top center'
    });

    expect(Object.keys(GMP.maps.mymap.instance.controls[2]).length).to.equal(1);
  });

});
