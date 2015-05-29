/// <reference path="template.ts"/>
/// <reference path="config.ts"/>
/// <reference path="typings/tsd.d.ts"/>
var config = require('./config');
var template = require('./template');
var AddPanel = (function () {
    function AddPanel(that) {
        this.that = that;
        var templateInstance = new template(that);
        this.template = function (type, url, cb) {
            return templateInstance.load(type, url, cb);
        };
    }
    AddPanel.prototype.getPositionKey = function (pos) {
        return pos.toUpperCase().match(/\S+/g).join('_');
    };
    AddPanel.prototype.hy2cmml = function (k) {
        return k.replace(/-(.)/g, function (m, g) {
            return g.toUpperCase();
        });
    };
    AddPanel.prototype.HTMLParser = function (aHTMLString) {
        var container = window.document.createElement('div');
        container.innerHTML = aHTMLString;
        return container;
    };
    AddPanel.prototype.onSuccess = function (options, position, panel, cb) {
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
    };
    AddPanel.prototype.addPanel = function (options, cb) {
        var _this = this;
        cb = cb || function () {
        };
        var position, panel;
        // default position
        options.position = options.position || config.panelPosition;
        if (options.templateURL) {
            this.template('panel', options.templateURL, function (err, response) {
                if (!err) {
                    panel = _this.HTMLParser(response);
                    return _this.onSuccess(options, position, panel, cb);
                }
                else {
                    cb(err);
                    return false;
                }
            });
        }
        else {
            if (typeof options.template === 'string') {
                panel = this.HTMLParser(options.template);
            }
            else {
                panel = options.template;
            }
            this.onSuccess(options, position, panel, cb);
        }
    };
    return AddPanel;
})();
module.exports = AddPanel;
