/// <reference path="template.ts"/>
/// <reference path="config.ts"/>
/// <reference path="typings/tsd.d.ts"/>

import config = require('./config');
import template = require('./template');


class AddPanel {
  'use strict';

  template;

  constructor(public that) {

    var templateInstance = new template(that);

    this.template = function(type, url, cb) {
      return templateInstance.load(type, url, cb)
    };

  }


  getPositionKey(pos) {
    return pos.toUpperCase().match(/\S+/g).join('_');
  }

  hy2cmml(k) {
    return k.replace(/-(.)/g, function(m, g) {
      return g.toUpperCase();
    });
  }

  HTMLParser(aHTMLString){
    var container = window.document.createElement('div');
    container.innerHTML = aHTMLString;
    return container;
  }

  onSuccess(options, position, panel, cb) {

    var e, rule;

    // positioning options
    if (options.position) {
      // convert to google ControlPosition map position keys
      options.position = this.getPositionKey(options.position);
      position = google.maps.ControlPosition[options.position];
    }

    // style options
    if (typeof options.style === 'object') {
      for (rule in options.style) {
        if (options.style.hasOwnProperty(rule)) {
          var ruleKey = this.hy2cmml(rule);
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
            google.maps.event.addDomListener(elm, event, options.events[e]);
          });
        }
      }
    }

    this.that.instance.controls[position].push(panel);
    this.that.panels = this.that.panels || {};
    this.that.panels[position] = panel;
    cb(false, panel);

  }

  public addPanel(options, cb) {

    cb = cb || function () {};

    var position,
      panel;

    // default position
    options.position = options.position || config.panelPosition;


    if (options.templateURL) {

      this.template('panel', options.templateURL, (err, response): any =>  {

        if (!err) {
          panel = this.HTMLParser(response);
          return this.onSuccess(options, position, panel, cb);
        } else {
          cb(err);
          return false;
        }
      });

    } else {

      if (typeof options.template === 'string') {
        panel = this.HTMLParser(options.template);
      } else {
        panel = options.template;
      }

      this.onSuccess(options, position, panel, cb);
    }

  }
}

export = AddPanel;
