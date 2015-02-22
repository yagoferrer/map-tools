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

		// default position
		options.position = options.position || 'TOP_LEFT';
		var position;

		if (typeof options.template === 'string') {
			var panel = HTMLParser(options.template);
		}

		if (options.position) {
			// convert to google ControlPosition map position keys
			options.position = options.position.toUpperCase().match(/\S+/g).join('_');
			position = google.maps.ControlPosition[options.position];
		}

		that.instance.controls[position].push(panel);
	}

	return addPanel;
};
