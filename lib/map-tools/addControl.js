/*jslint node: true */
"use strict"

var utils = require('map-tools/utils');
var config = require('map-tools/config');

module.exports = function(global, that) {

	function getPositionKey(pos) {
		return pos.toUpperCase().match(/\S+/g).join('_');
	}

	function hy2cmml(k) {
		return k.replace(/-(.)/g, function(m, g) {
			return g.toUpperCase();
		});
	}

	function HTMLParser(aHTMLString){
		var container = window.document.createElement('div');

		container.innerHTML = aHTMLString;

		return container;
	}

	function addPanel(options) {

		var position,
			panel,
			e,
			rule;

		// default position
		options.position = options.position || 'TOP_LEFT';

		if (options.templateURL) {
			var request = new XMLHttpRequest();
			request.open("GET", options.templateURL, false);
			request.send(null);
			panel = HTMLParser(request.responseText);

		}

		// template options
		if (typeof options.template === 'string') {
			panel = HTMLParser(options.template);
		}

		// positioning options
		if (options.position) {
			// convert to google ControlPosition map position keys
			options.position = getPositionKey(options.position);
			position = google.maps.ControlPosition[options.position];
		}

		// style options
		if (typeof options.style === 'object') {
			for (rule in options.style) {
				var ruleKey = hy2cmml(rule);
				panel.style[ruleKey] = options.style[rule];
			}
		}

		// event handler
		if (options.events) {

			for (e in options.events) {
				var keys = e.match(/\S+/g);


				var	event = keys.splice(-1); //event type
				var selector = keys.join(' '); // selector string
				var	elements = panel.querySelectorAll(selector);

				[].forEach.call(elements, function(elm) {
					google.maps.event.addDomListener( elm, event, options.events[e] );
				});

			}
		}


		that.instance.controls[position].push(panel);
		return panel;
	}

	return addPanel;
};
