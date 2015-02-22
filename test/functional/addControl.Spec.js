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
		console.log(panel);
		expect(panel).to.eql({style: {backgroundColor: '#fff', marginBottom: '22px'},innerHTML: '<div><button id="clickMe">ctrl 1</button></div>' })

	});

});
