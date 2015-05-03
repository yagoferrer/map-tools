/*jslint node: true */
var config = require('map-tools/config');

module.exports = function(global, that) {
  'use strict';

  var template = require('map-tools/template')(global, that);

	function getPositionKey(pos) {
		return pos.toUpperCase().match(/\S+/g).join('_');
	}

	function hy2cmml(k) {
		return k.replace(/-(.)/g, function(m, g) {
			return g.toUpperCase();
		});
	}

	function HTMLParser(aHTMLString){
		var container = global.document.createElement('div');
		container.innerHTML = aHTMLString;
		return container;
	}

	function addPanel(options, cb) {

    cb = cb || function () {};

		var position,
			panel,
			e,
			rule;

		// default position
		options.position = options.position || config.panelPosition;


		if (options.templateURL) {

      template('panel', options.templateURL, function(err, response) {

        if (!err) {
          panel = new HTMLParser(response);
          return onSuccess();
        } else {
          cb(err);
          return false;
        }
      });

		} else {

      if (typeof options.template === 'string') {
        panel = new HTMLParser(options.template);
      } else {
        panel = options.template;
      }

      return onSuccess();
    }

    function onSuccess() {

      // positioning options
      if (options.position) {
        // convert to google ControlPosition map position keys
        options.position = getPositionKey(options.position);
        position = global.google.maps.ControlPosition[options.position];
      }

      // style options
      if (typeof options.style === 'object') {
        for (rule in options.style) {
          if (options.style.hasOwnProperty(rule)) {
            var ruleKey = hy2cmml(rule);
            panel.style[ruleKey] = options.style[rule];
          }
        }
      }

      // event handler
      if (options.events) {

        for (e in options.events) {

          if (options.events.hasOwnProperty(e)) {
            var keys = e.match(/\S+/g);
            var event = keys.splice(-1); //event type
            var selector = keys.join(' '); // selector string
            var elements = panel.querySelectorAll(selector);

            [].forEach.call(elements, function (elm) {
              global.google.maps.event.addDomListener(elm, event, options.events[e]);
            });
          }
        }
      }

      that.instance.controls[position].push(panel);
      that.panels = that.panels || {};
      that.panels[position] = panel;
      cb(false, panel);

    }
	}

	return addPanel;
};
