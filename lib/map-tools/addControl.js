/*jslint node: true */
"use strict"

var utils = require('map-tools/utils');
var config = require('map-tools/config');

module.exports = function(global, that) {

	/*
	* {
	 templateURL: "mytemplate.html", //template; "<div>MapCtrl</div>"
	 logic:"mycontroller.js",
	 css: 'style.css'
	 events: {
	 '.mydiv click': function(e) {}

	 }
	 */

	function HTMLParser(aHTMLString){
		var parser = new DOMParser();
		var document = parser.parseFromString('', 'text/html');
		var container = document.createElement('div');
		//@todo temp style
		container.style.backgroundColor = '#fff';
		container.style.border = '2px solid #fff';
		container.style.borderRadius = '3px';
		container.style.boxShadow = '0 2px 6px rgba(0,0,0,.3)';
		container.style.cursor = 'pointer';
		container.style.marginBottom = '22px';
		container.style.textAlign = 'center';
		container.title = 'Click to recenter the map';
		container.innerHTML = aHTMLString;


		return container;

	}

	function addPanel(options) {

		var position,
			panel,
			e,
			i;

		// default position
		options.position = options.position || 'TOP_LEFT';

		if (typeof options.template === 'string') {
			panel = HTMLParser(options.template);
		}

		// positioning
		if (options.position) {
			// convert to google ControlPosition map position keys
			options.position = options.position.toUpperCase().match(/\S+/g).join('_');
			position = google.maps.ControlPosition[options.position];
		}

		// event handler
		if (options.events) {

			for (e in options.events) {
				var keys = e.match(/\S+/g);
				var selector = keys[0]; // elm selector
				var	event = keys[1]; //event type
				var	elements = panel.querySelectorAll(selector);

				[].forEach.call(elements, function(elm) {
					google.maps.event.addDomListener( elm, event, options.events[e] );
				});

			}
		}

		that.instance.controls[position].push(panel);
	}

	return addPanel;
};
