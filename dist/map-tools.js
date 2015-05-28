/* map-tools.js 2.0.0 MIT License. 2015 Yago Ferrer <yago.ferrer@gmail.com> */
(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.mapTools = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/// <reference path="typings/tsd.d.ts"/>
var topojson = require('topojson');
var utils = require('./utils');
var addFilter = require('./addFilter');
var AddFeature = (function () {
    function AddFeature(that) {
        this.that = that;
        var addFilterInstance = new addFilter(that, 'json');
        this.addFilter = function (filters) {
            return addFilterInstance.addFilter(filters);
        };
    }
    /**
     * Adds GeoJSON Feature Options like: style
     * @param features
     * @param options
     * @private
     */
    AddFeature.prototype.addFeatureOptions = function (features, options) {
        var feature, x;
        for (x in features) {
            if (features.hasOwnProperty(x)) {
                feature = features[x];
                var uid = utils.createUid();
                feature.uid = uid;
                var data = feature.k;
                feature.k.uid = uid;
                Object.defineProperty(feature, 'data', {
                    value: data,
                    enumerable: true,
                    writable: false,
                    configurable: false
                });
                if (options) {
                    if (options.filters) {
                        // Add filters if not defined.
                        if (!this.that.json.filter) {
                            this.addFilter(options.filters);
                        }
                        this.that.json.crossfilter.add([feature]);
                    }
                    if (options.style) {
                        this.that.instance.data.overrideStyle(feature, options.style);
                    }
                }
                this.that.json.all[feature.data.uid] = feature;
            }
        }
    };
    /**
     * Adds a Topo JSON file into a Map
     * @param data The parsed JSON File
     * @param options
     */
    AddFeature.prototype.addTopoJson = function (data, options) {
        var item, geoJson, features, x;
        for (x in options) {
            if (options.hasOwnProperty(x)) {
                item = options[x];
                geoJson = topojson.feature(data, data.objects[item.object]);
                features = this.that.instance.data.addGeoJson(geoJson);
                this.addFeatureOptions(features, item);
                mapTools.maps[this.that.id].json.all[item.object] = features;
            }
        }
        return features;
    };
    AddFeature.prototype.addGeoJson = function (data, options) {
        var features = this.that.instance.data.addGeoJson(data, options);
        this.addFeatureOptions(features, options);
        return features;
    };
    return AddFeature;
})();
module.exports = AddFeature;

},{"./addFilter":2,"./utils":20,"topojson":23}],2:[function(require,module,exports){
/// <reference path="typings/tsd.d.ts"/>
var utils = require('./utils');
var AddFilter = (function () {
    function AddFilter(that, type) {
        this.that = that;
        this.type = type;
    }
    AddFilter.prototype.addFilter = function (filters) {
        this.that[this.type].crossfilter = this.that[this.type].crossfilter || this.that.crossfilter([]);
        this.that[this.type].filter = this.that[this.type].filter || {};
        var dimension, item;
        if (typeof filters === 'string') {
            filters = [filters];
        }
        for (dimension in filters) {
            if (filters.hasOwnProperty(dimension)) {
                item = filters[dimension];
                if (typeof item === 'string') {
                    this.that[this.type].filter[item] = this.that[this.type].crossfilter.dimension(utils.defaultDimension(item));
                }
                else {
                    this.that[this.type].filter[Object.keys(item)[0]] = this.that[this.type].crossfilter.dimension(item[Object.keys(item)[0]]);
                }
            }
        }
    };
    return AddFilter;
})();
module.exports = AddFilter;

},{"./utils":20}],3:[function(require,module,exports){
/// <reference path="typings/tsd.d.ts"/>
var maps = require('./maps');
var config = require('./config');
var AddMap = (function () {
    function AddMap(that) {
        this.that = that;
    }
    AddMap.prototype.getElement = function (args) {
        if (args.el) {
            return window.document.querySelector(args.el);
        }
        if (args.id) {
            return window.document.getElementById(args.id);
        }
    };
    AddMap.prototype.create = function (args, cb) {
        var _this = this;
        cb = cb || function () {
        };
        var mapOptions = maps.mapOptions(args);
        args.id = args.id || args.el.substring(1);
        this.that.id = args.id;
        this.that.options = args;
        this.that.instance = new google.maps.Map(this.getElement(args), mapOptions);
        this.that.events = [];
        // Add Events
        if (args.on) {
            var i;
            for (i in args.on) {
                if (args.on.hasOwnProperty(i)) {
                    if (config.customEvents.indexOf(i) > -1) {
                        this.that.events.push(i);
                    }
                    google.maps.event.addListener(this.that.instance, i, args.on[i]);
                }
            }
        }
        this.that.infoWindow = false;
        this.that.templates = {
            infoWindow: {},
            panel: {}
        };
        this.that.uid = args.uid;
        mapTools.maps[this.that.id].instance = this.that.instance;
        google.maps.event.addListenerOnce(this.that.instance, 'idle', function () {
            cb(false, _this.that);
        });
    };
    AddMap.prototype.validOptions = function (options, cb) {
        if (!options || (options && typeof options !== 'object')) {
            cb(new Error('You must pass a valid first parameter: options'));
            return false;
        }
        if (!options.id && !options.el) {
            cb(new Error('You must pass an "id" or a "el" property values'));
            return false;
        }
        if (!options.lat || !options.lng) {
            cb(new Error('You must pass valid "lat" (latitude) and "lng" (longitude) values'));
            return false;
        }
        return true;
    };
    AddMap.prototype.load = function (options, cb) {
        if (this.validOptions(options, cb)) {
            var id = options.id || options.el.substring(1);
            mapTools.maps = mapTools.maps || {};
            if (mapTools.maps[id]) {
                var msg = 'There is already another Map using the same id: ' + id;
                cb(new Error(msg));
                return false;
            }
            var that = this;
            mapTools.maps[id] = {
                create: function () {
                    that.create(this.arguments, cb);
                },
                arguments: options
            };
            // Set Global Structure
            mapTools.maps[id].markers = mapTools.maps[id].markers || { all: {}, tags: {}, dataChanged: false };
            mapTools.maps[id].json = mapTools.maps[id].json || { all: {}, dataChanged: false };
            this.that.markers = mapTools.maps[id].markers;
            this.that.json = mapTools.maps[id].json;
            if (options.async !== false || options.sync === true) {
                maps.load(id, options);
            }
            else {
                mapTools.maps[id].create();
            }
        }
    };
    return AddMap;
})();
module.exports = AddMap;

},{"./config":7,"./maps":13}],4:[function(require,module,exports){
/// <reference path="typings/tsd.d.ts"/>
var utils = require('./utils');
var addFilter = require('./addFilter');
var infoWindow = require('./infoWindow');
var AddMarker = (function () {
    function AddMarker(that) {
        this.that = that;
        this.infoWindow = {};
        var addFilterInstance = new addFilter(that, 'markers');
        this.addFilter = function (filters) {
            return addFilterInstance.addFilter(filters);
        };
        var infoWindowInstance = new infoWindow(that);
        this.infoWindow.addEvents = function (marker, options, map) {
            infoWindowInstance.addEvents(marker, options, map);
        };
    }
    AddMarker.prototype.addExtraOptions = function (marker, options) {
        var i;
        for (i in options) {
            if (options.hasOwnProperty(i)) {
                if (!options.filters) {
                    marker[i] = options[i];
                }
            }
        }
    };
    AddMarker.prototype.addOptions = function (marker, instance) {
        if (marker.move) {
            instance.setAnimation(google.maps.Animation[marker.move.toUpperCase()]);
        }
        if (marker.infoWindow) {
            this.infoWindow.addEvents(instance, marker.infoWindow, this.that.instance);
        }
        if (marker.on) {
            this.addEvents(marker, instance);
        }
        if (marker.callback) {
            marker.callback(instance);
        }
    };
    AddMarker.prototype._addMarker = function (marker, options) {
        marker.map = this.that.instance;
        marker.position = new google.maps.LatLng(marker.lat, marker.lng);
        // Adds options set via 2nd parameter. Overwrites any Marker options already set.
        if (options) {
            this.addExtraOptions(marker, options);
        }
        marker.data = marker.data || {};
        marker.data._self = marker; // This helps me to do later resetMarker()
        this.setUid(marker);
        // Because we are not allowing duplicates
        if (this.that.markers.all[marker.uid]) {
            return false;
        }
        if (options && options.filters) {
            // Only add filters if not defined.
            if (!mapTools.maps[this.that.id].markers.filter) {
                this.addFilter(options.filters);
            }
        }
        var instance = new google.maps.Marker(marker);
        this.that.markers.crossfilter = this.that.markers.crossfilter || this.that.crossfilter([]);
        this.that.markers.filter = this.that.markers.filter || {};
        this.that.markers.crossfilter.add([instance]);
        this.addOptions(marker, instance);
        // Adds Marker Reference of each Marker to "markers.all"
        this.that.markers.all = mapTools.maps[this.that.id].markers.all || {};
        this.that.markers.all[marker.uid] = instance;
        if (marker.tags) {
            this.addMarkerByTag(marker, instance);
        }
        return instance;
    };
    AddMarker.prototype.setUid = function (marker) {
        if (this.that.uid && marker[this.that.uid]) {
            marker.data.uid = marker[this.that.uid];
            marker.uid = marker.data.uid;
        }
        if (marker.data.uid && !marker.uid) {
            marker.uid = marker.data.uid;
        }
        if (!marker.uid) {
            marker.data.uid = utils.createUid();
            marker.uid = marker.data.uid;
        }
    };
    AddMarker.prototype.addMarkerByTag = function (marker, instance) {
        if (utils.isArray(marker.tags)) {
            var i, tag;
            for (i in marker.tags) {
                if (marker.tags.hasOwnProperty(i)) {
                    tag = marker.tags[i];
                    this.that.markers.tags[tag] = this.that.markers.tags[tag] || {};
                    this.that.markers.tags[tag][instance.data.uid] = instance;
                }
            }
        }
        else {
            this.that.markers.tags[marker.tags] = this.that.markers.tags[marker.tags] || {};
            this.that.markers.tags[marker.tags][instance.data.uid] = instance;
        }
    };
    AddMarker.prototype.addEvents = function (marker, instance) {
        var i;
        for (i in marker.on) {
            if (marker.on.hasOwnProperty(i)) {
                google.maps.event.addListener(instance, i, marker.on[i]);
            }
        }
    };
    /**
     * Adds Markers to the Map
     * @param args Array or Markers
     * @param options things like groups etc
     * @returns {Array} all the instances of the markers.
     */
    AddMarker.prototype.addMarker = function (args, options) {
        if (utils.isArray(args)) {
            if (args.length >= 1) {
                var marker, markers = [];
                for (var i in args) {
                    if (args.hasOwnProperty(i)) {
                        marker = this._addMarker(args[i], options);
                        markers.push(marker);
                    }
                }
                this.that.markers.dataChanged = true;
                return markers;
            }
            return [];
        }
        this.that.markers.dataChanged = true;
        return this._addMarker(args, options);
    };
    return AddMarker;
})();
module.exports = AddMarker;

},{"./addFilter":2,"./infoWindow":10,"./utils":20}],5:[function(require,module,exports){
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

},{"./config":7,"./template":16}],6:[function(require,module,exports){
/// <reference path="typings/tsd.d.ts"/>
var Center = (function () {
    function Center() {
    }
    Center.prototype.pos = function (lat, lng) {
        var position;
        if (lat && lng) {
            position = new google.maps.LatLng(lat, lng);
        }
        else {
            position = new google.maps.LatLng(this.options.lat, this.options.lng);
        }
        this.instance.setCenter(position);
    };
    return Center;
})();
module.exports = Center;

},{}],7:[function(require,module,exports){
/// <reference path="typings/tsd.d.ts"/>
var Config = (function () {
    function Config() {
    }
    Config.version = '3.18'; // Released: May 15, 201
    Config.url = '//maps.googleapis.com/maps/api/js';
    Config.zoom = 8;
    Config.customMapOptions = ['id', 'lat', 'lng', 'type', 'uid'];
    Config.customMarkerOptions = ['lat', 'lng', 'move', 'infoWindow', 'on', 'callback', 'tags'];
    Config.panelPosition = 'TOP_LEFT';
    Config.customInfoWindowOptions = ['open', 'close'];
    Config.customEvents = ['marker_visibility_changed'];
    return Config;
})();
module.exports = Config;

},{}],8:[function(require,module,exports){
/// <reference path="typings/tsd.d.ts"/>
var addFilter = require('./addFilter');
var Filter = (function () {
    function Filter(that, type) {
        this.that = that;
        this.type = type;
        this.orderLookup = {
            ASC: 'top',
            DESC: 'bottom'
        };
        this.utils = require('./utils');
        var addFilterInstance = new addFilter(that, type);
        this.addFilter = function (filters) {
            return addFilterInstance.addFilter(filters);
        };
    }
    // cf has it's own state, for each dimension
    // before each new filtering we need to clear this state
    Filter.prototype.clearAll = function (dimensionSet) {
        var i, dimension;
        for (i in dimensionSet) {
            if (dimensionSet.hasOwnProperty(i)) {
                dimension = dimensionSet[i];
                if (this.that[this.type].dataChanged === true) {
                    dimension.dispose();
                    this.addFilter(i);
                }
                else {
                    dimension.filterAll();
                }
            }
        }
    };
    Filter.prototype.filterByTag = function (query) {
        // if the search query is an array with only one item then just use that string
        if (this.utils.isArray(query) && query.length === 1) {
            query = query[0];
        }
        if (typeof query === "string") {
            if (this.that[this.type].tags[query]) {
                return this.utils.toArray(this.that[this.type].tags[query]);
            }
            else {
                return [];
            }
        }
        else {
            var markers = this.fetchByTag(query);
            if (typeof markers === "object") {
                markers = this.utils.toArray(markers);
            }
            return markers;
        }
    };
    Filter.prototype.fetchByTag = function (query) {
        var markers; // store first set of markers to compare
        var i;
        for (i = 0; i < query.length - 1; i++) {
            var tag = query[i];
            var nextTag = query[i + 1];
            // null check kicks in when we get to the end of the for loop
            markers = this.utils.getCommonObject(this.that[this.type].tags[tag], this.that[this.type].tags[nextTag]);
        }
        return markers;
    };
    Filter.prototype.filter = function (args, options) {
        // Return All items if no arguments are supplied
        if (typeof args === 'undefined' && typeof options === 'undefined') {
            return this.utils.toArray(this.that[this.type].all);
        }
        var dimension, order, limit, query;
        if (typeof args === 'string') {
            dimension = args;
        }
        else {
            dimension = Object.keys(args)[0];
            query = args[dimension];
            if (dimension === 'tags') {
                return this.filterByTag(query);
            }
        }
        this.clearAll(this.that[this.type].filter);
        // Add Crossfilter Dimension if it does not exist.
        if (!this.that[this.type].filter[dimension]) {
            this.addFilter(dimension);
        }
        order = (options && options.order && this.orderLookup[options.order]) ? this.orderLookup[options.order] : this.orderLookup[Object.keys(this.orderLookup)[0]];
        limit = (options && options.limit) ? options.limit : Infinity;
        if (typeof query === 'undefined') {
            query = null;
        }
        var result = this.that[this.type].filter[dimension].filter(query)[order](limit);
        this.that[this.type].dataChanged = false;
        if (limit === 1) {
            return result[0];
        }
        return result;
    };
    return Filter;
})();
module.exports = Filter;

},{"./addFilter":2,"./utils":20}],9:[function(require,module,exports){
/// <reference path="typings/tsd.d.ts"/>
var FindMarkerById = (function () {
    function FindMarkerById(that) {
        this.that = that;
    }
    FindMarkerById.prototype.find = function (marker) {
        if (marker.data && marker.data.uid) {
            return marker;
        }
        if (marker.uid && mapTools.maps[this.that.id].markers.all[marker.uid]) {
            return mapTools.maps[this.that.id].markers.all[marker.uid];
        }
    };
    return FindMarkerById;
})();
module.exports = FindMarkerById;

},{}],10:[function(require,module,exports){
/// <reference path="typings/tsd.d.ts"/>
var InfoWindow = (function () {
    function InfoWindow(that) {
        this.that = that;
        this.utils = require('./utils');
        this.config = require('./config');
    }
    InfoWindow.prototype.infoWindow = function (map, marker, args) {
        var content = false;
        if (marker.infoWindow.content) {
            if (marker.infoWindow.content.indexOf('{') > -1) {
                content = args.content.replace(/\{(\w+)\}/g, function (m, variable) {
                    return marker.data[variable] || '';
                });
            }
            content = content || marker.infoWindow.content;
        }
        var options = this.utils.clone(args);
        options.content = content;
        this.that.infoWindow = new google.maps.InfoWindow(options);
        this.that.infoWindow.open(map, marker);
    };
    InfoWindow.prototype.open = function (map, marker, options) {
        this.close();
        this.infoWindow(map, marker, options);
    };
    InfoWindow.prototype.isOpen = function (infoWindow) {
        var map = infoWindow.getMap();
        return (map !== null && typeof map !== "undefined");
    };
    InfoWindow.prototype.close = function () {
        clearTimeout(this.timer);
        if (this.that.infoWindow && this.isOpen(this.that.infoWindow)) {
            this.that.infoWindow.close();
        }
    };
    InfoWindow.prototype.addEvents = function (marker, options, map) {
        var _this = this;
        var args = this.utils.prepareOptions(options, this.config.customInfoWindowOptions);
        var openOn = (args.custom && args.custom.open && args.custom.open.on) ? args.custom.open.on : 'click';
        var closeOn = (args.custom && args.custom.close && args.custom.close.on) ? args.custom.close.on : 'click';
        // Toggle Effect when using the same method to Open and Close.
        if (openOn === closeOn) {
            google.maps.event.addListener(marker, openOn, function () {
                if (!_this.that.infoWindow || !_this.isOpen(_this.that.infoWindow)) {
                    _this.open(map, marker, args.defaults);
                }
                else {
                    _this.close();
                }
            });
        }
        else {
            google.maps.event.addListener(marker, openOn, function () {
                _this.open(map, marker, args.defaults);
            });
            google.maps.event.addListener(marker, closeOn, function () {
                if (args.custom.close.duration) {
                    _this.timer = setTimeout(function () {
                        _this.close();
                    }, args.custom.close.duration);
                }
                else {
                    _this.close();
                }
            });
        }
    };
    return InfoWindow;
})();
module.exports = InfoWindow;

},{"./config":7,"./utils":20}],11:[function(require,module,exports){
var Locate = (function () {
    function Locate() {
    }
    Locate.prototype.locate = function () {
        var center = this.instance.getCenter();
        return { lat: center.lat(), lng: center.lng() };
    };
    return Locate;
})();
module.exports = Locate;

},{}],12:[function(require,module,exports){
/// <reference path="typings/tsd.d.ts"/>
var addMarker = require('./addMarker');
var addFeature = require('./addFeature');
var addPanel = require('./addPanel');
var center = require('./center');
var locate = require('./locate');
var updateMarker = require('./updateMarker');
var updateMap = require('./updateMap');
var updateFeature = require('./updateFeature');
var addMap = require('./addMap');
var removeMarker = require('./removeMarker');
var resetMarker = require('./resetMarker');
var filter = require('./filter');
var mapTools = (function () {
    function mapTools(options, cb) {
        this.crossfilter = require('crossfilter');
        var addMarkerInstance = new addMarker(this);
        this.addMarker = function (marker, options) {
            return addMarkerInstance.addMarker(marker, options);
        };
        var addFeatureInstance = new addFeature(this);
        this.addTopoJson = function (data, options) {
            return addFeatureInstance.addTopoJson(data, options);
        };
        this.addGeoJson = function (data, options) {
            return addFeatureInstance.addGeoJson(data, options);
        };
        var addPanelInstance = new addPanel(this);
        this.addPanel = function (options, cb) {
            return addPanelInstance.addPanel(options, cb);
        };
        this.center = new center().pos;
        this.locate = new locate().locate;
        var updateMarkerInstance = new updateMarker(this);
        this.updateMarker = function (args, options) {
            return updateMarkerInstance.update(args, options);
        };
        var updateMapInstance = new updateMap(this);
        this.updateMap = function (args) {
            updateMapInstance.updateMap(args);
        };
        var updateFeatureInstance = new updateFeature(this);
        this.updateFeature = function (args, options) {
            return updateFeatureInstance.update(args, options);
        };
        var removeMarkerInstance = new removeMarker(this);
        this.removeMarker = function (args) {
            return removeMarkerInstance.removeMarker(args);
        };
        var resetMarkerInstance = new resetMarker(this);
        this.resetMarker = function (args, options) {
            return resetMarkerInstance.resetMarker(args, options);
        };
        var findMarker = new filter(this, 'markers');
        this.findMarker = function (args, options) {
            return findMarker.filter(args, options);
        };
        // Unit Tests?
        var findFeature = new filter(this, 'json');
        this.findFeature = function (args, options) {
            return findFeature.filter(args, options);
        };
        var map = new addMap(this);
        map.load(options, cb);
    }
    mapTools.prototype.zoom = function (zoom) {
        if (typeof zoom === 'undefined') {
            return this.instance.getZoom();
        }
        else {
            this.instance.setZoom(zoom);
        }
    };
    return mapTools;
})();
module.exports = mapTools;

},{"./addFeature":1,"./addMap":3,"./addMarker":4,"./addPanel":5,"./center":6,"./filter":8,"./locate":11,"./removeMarker":14,"./resetMarker":15,"./updateFeature":17,"./updateMap":18,"./updateMarker":19,"crossfilter":22}],13:[function(require,module,exports){
/// <reference path="typings/tsd.d.ts"/>
var utils = require('./utils');
var config = require('./config');
var Maps = (function () {
    function Maps() {
    }
    /**
     * Injects Google API Javascript File and adds a callback to load the Google Maps Async.
     * @type {{load: Function}}
     * @private
     *
     * @returns the element appended
     */
    Maps.load = function (id, args) {
        var version = args.version || config.version;
        var script = window.document.createElement('script');
        script.type = 'text/javascript';
        script.src = config.url + '?v=' + version + '&callback=mapTools.maps.' + id + '.create';
        return window.document.body.appendChild(script);
    };
    Maps.mapOptions = function (args) {
        // To clone Arguments excluding customMapOptions
        var result = utils.clone(args, config.customMapOptions);
        result.zoom = args.zoom || config.zoom;
        if (args.lat && args.lng) {
            result.center = new google.maps.LatLng(args.lat, args.lng);
        }
        if (args.type) {
            result.mapTypeId = google.maps.MapTypeId[args.type] || false;
        }
        return result;
    };
    return Maps;
})();
module.exports = Maps;

},{"./config":7,"./utils":20}],14:[function(require,module,exports){
/// <reference path="typings/tsd.d.ts"/>
var findMarker = require('./findMarkerById');
var RemoveMarker = (function () {
    function RemoveMarker(that) {
        this.that = that;
        var findMarkerInstance = new findMarker(that);
        this.findMarker = function (marker) {
            return findMarkerInstance.find(marker);
        };
    }
    RemoveMarker.prototype.removeBulk = function (args) {
        var marker, x;
        for (x in args) {
            if (args.hasOwnProperty(x)) {
                marker = args[x];
                this.remove(this.findMarker(marker));
            }
        }
    };
    RemoveMarker.prototype.removeMarker = function (args) {
        if (typeof args === 'undefined') {
            this.removeBulk(this.that.markers.all);
        }
        var type = Object.prototype.toString.call(args);
        if (type === '[object Object]') {
            return this.remove(this.findMarker(args));
        }
        if (type === '[object Array]') {
            this.removeBulk(args);
        }
    };
    RemoveMarker.prototype.remove = function (marker) {
        marker.setMap(null);
        delete mapTools.maps[this.that.id].markers.all[marker.data.uid];
    };
    return RemoveMarker;
})();
module.exports = RemoveMarker;

},{"./findMarkerById":9}],15:[function(require,module,exports){
/// <reference path="typings/tsd.d.ts"/>
var utils = require('./utils');
var config = require('./config');
var findMarker = require('./findMarkerById');
var updateMarker = require('./updateMarker');
var ResetMarker = (function () {
    function ResetMarker(that) {
        this.that = that;
        var findMarkerInstance = new findMarker(that);
        this.findMarker = function (marker) {
            return findMarkerInstance.find(marker);
        };
        this.updateMarker = new updateMarker(that);
    }
    ResetMarker.prototype.resetBulk = function (markers, options) {
        var x;
        for (x in markers) {
            if (markers.hasOwnProperty(x)) {
                this.reset(markers[x], options);
            }
        }
    };
    ResetMarker.prototype.resetMarker = function (args, options) {
        var type = Object.prototype.toString.call(args);
        var result;
        if (type === '[object Object]') {
            result = this.reset(this.findMarker(args), options);
        }
        if (type === '[object Array]') {
            result = this.resetBulk(args, options);
        }
        this.that.markers.dataChanged = true;
        return result;
    };
    ResetMarker.prototype.formatOptions = function (marker, options) {
        var key, op = {};
        var type = Object.prototype.toString.call(options);
        if (type === '[object String]') {
            op[options] = marker.data._self[options];
        }
        if (type === '[object Array]') {
            for (key in options) {
                if (options.hasOwnProperty(key)) {
                    op[options[key]] = marker.data._self[options[key]];
                }
            }
        }
        return op;
    };
    ResetMarker.prototype.reset = function (marker, options) {
        var preparedOptions = utils.prepareOptions(this.formatOptions(marker, options), config.customMarkerOptions);
        this.updateMarker.customUpdate(marker, preparedOptions);
        return marker;
    };
    return ResetMarker;
})();
module.exports = ResetMarker;

},{"./config":7,"./findMarkerById":9,"./updateMarker":19,"./utils":20}],16:[function(require,module,exports){
var Template = (function () {
    function Template(that) {
        this.that = that;
    }
    Template.prototype.load = function (type, url, cb) {
        var _this = this;
        if (this.that.templates[type][url]) {
            return this.that.templates[type][url];
        }
        var xhr = new XMLHttpRequest();
        xhr.open("GET", url);
        xhr.onload = function () {
            if (xhr.readyState === 4) {
                if (xhr.status === 200) {
                    _this.that.templates[type][url] = xhr.responseText;
                    cb(false, xhr.responseText);
                }
                else {
                    cb(new Error(xhr.statusText));
                }
            }
        };
        xhr.send(null);
    };
    return Template;
})();
module.exports = Template;

},{}],17:[function(require,module,exports){
/// <reference path="typings/tsd.d.ts"/>
var UpdateFeature = (function () {
    function UpdateFeature(that) {
        this.that = that;
    }
    UpdateFeature.prototype.updateStyle = function (f, style) {
        if (typeof style === 'function') {
            var styleOptions = style.call(f);
            return this.that.instance.data.overrideStyle(f, styleOptions);
        }
        this.that.instance.data.overrideStyle(f, style);
    };
    UpdateFeature.prototype.findAndUpdate = function (args, options) {
        if (args.data && args.data.uid) {
            return this.updateFeature(args, options);
        }
        if (args.uid && mapTools.maps[this.that.id].json && mapTools.maps[this.that.id].json.all[args.uid]) {
            return this.updateFeature(mapTools.maps[this.that.id].json.all[args.uid], options);
        }
    };
    UpdateFeature.prototype.update = function (args, options) {
        var type = Object.prototype.toString.call(args);
        if (type === '[object Array]') {
            var feature, x;
            for (x in args) {
                if (args.hasOwnProperty(x)) {
                    feature = args[x];
                    this.findAndUpdate(feature, options);
                }
            }
        }
        if (type === '[object Object]') {
            this.findAndUpdate(args, options);
        }
    };
    UpdateFeature.prototype.updateFeature = function (feature, options) {
        if (options.style) {
            this.updateStyle(feature, options.style);
        }
    };
    return UpdateFeature;
})();
module.exports = UpdateFeature;

},{}],18:[function(require,module,exports){
/// <reference path="maps.ts"/>
var maps = require('./maps');
var UpdateMap = (function () {
    function UpdateMap(that) {
        this.that = that;
    }
    UpdateMap.prototype.updateMap = function (args) {
        var mapOptions = maps.mapOptions(args);
        return this.that.instance.setOptions(mapOptions);
    };
    return UpdateMap;
})();
module.exports = UpdateMap;

},{"./maps":13}],19:[function(require,module,exports){
/// <reference path="typings/tsd.d.ts"/>
var utils = require('./utils');
var config = require('./config');
var findMarker = require('./findMarkerById');
var filter = require('./filter');
var UpdateMarker = (function () {
    function UpdateMarker(that) {
        this.that = that;
        var findMarkerInstance = new findMarker(that);
        this.findMarker = function (marker) {
            return findMarkerInstance.find(marker);
        };
    }
    UpdateMarker.prototype.removeTags = function (marker) {
        if (utils.isArray(marker.tags)) {
            var i, tag;
            for (i in marker.tags) {
                if (marker.tags.hasOwnProperty(i)) {
                    tag = marker.tags[i];
                    delete this.that.markers.tags[tag][marker.data.uid];
                }
            }
        }
        else {
            delete this.that.markers.tags[marker.tags][marker.data.uid];
        }
    };
    UpdateMarker.prototype.addTags = function (marker, options) {
        if (utils.isArray(options.custom.tags)) {
            var i, tag;
            for (i in options.custom.tags) {
                tag = options.custom.tags[i];
                this.that.markers.tags[tag] = this.that.markers.tags[tag] || {};
                this.that.markers.tags[tag][marker.data.uid] = marker;
            }
        }
        else {
            this.that.markers.tags[options.custom.tags] = this.that.markers.tags[options.custom.tags] || {};
            this.that.markers.tags[options.custom.tags][marker.data.uid] = marker;
        }
        marker.tags = options.custom.tags;
    };
    UpdateMarker.prototype.updateTag = function (marker, options) {
        this.removeTags(marker);
        this.addTags(marker, options);
    };
    UpdateMarker.prototype.customUpdate = function (marker, options) {
        if (options.custom) {
            if (options.custom.move) {
                marker.setAnimation(google.maps.Animation[options.custom.move.toUpperCase()]);
            }
            if (options.custom.lat && options.custom.lng) {
                marker.setPosition(new google.maps.LatLng(options.custom.lat, options.custom.lng));
            }
            if (options.custom.infoWindow && options.custom.infoWindow.content) {
                marker.infoWindow.content = options.custom.infoWindow.content;
            }
            if (options.custom.tags) {
                this.updateTag(marker, options);
            }
        }
        if (options.defaults) {
            marker.setOptions(options.defaults);
        }
        return marker;
    };
    UpdateMarker.prototype.bulkUpdate = function (args, options) {
        var marker, results = [], instance, x;
        for (x in args) {
            if (args.hasOwnProperty(x)) {
                marker = args[x];
                instance = this.customUpdate(this.findMarker(marker), options);
                results.push(instance);
            }
        }
        return results;
    };
    UpdateMarker.prototype.countVisible = function () {
        var x, count = 0;
        for (x in this.that.markers.all) {
            if (this.that.markers.all[x].visible) {
                count++;
            }
        }
        google.maps.event.trigger(this.that.instance, 'marker_visibility_changed', count);
    };
    UpdateMarker.prototype.update = function (args, options) {
        var visibilityFlag = false;
        var preparedOptions = utils.prepareOptions(options, config.customMarkerOptions);
        if (preparedOptions.defaults && preparedOptions.defaults.hasOwnProperty('visible') && this.that.events.indexOf('marker_visibility_changed') > -1) {
            visibilityFlag = true;
        }
        var result;
        var type = Object.prototype.toString.call(args);
        if (type === '[object Object]') {
            if (Object.keys(args).length === 1 && args.tags) {
                var filterInstance = new filter(this.that, 'markers');
                result = this.bulkUpdate(filterInstance.filter(args), preparedOptions);
            }
            else {
                result = this.customUpdate(this.findMarker(args), preparedOptions);
            }
        }
        if (type === '[object Array]') {
            result = this.bulkUpdate(args, preparedOptions);
        }
        if (visibilityFlag) {
            this.countVisible();
        }
        this.that.markers.dataChanged = true;
        return result;
    };
    return UpdateMarker;
})();
module.exports = UpdateMarker;

},{"./config":7,"./filter":8,"./findMarkerById":9,"./utils":20}],20:[function(require,module,exports){
var Utils = (function () {
    function Utils() {
    }
    Utils.clone = function (o, exceptionKeys) {
        var out, v, key;
        out = Array.isArray(o) ? [] : {};
        for (key in o) {
            if (o.hasOwnProperty(key)) {
                if (!exceptionKeys || (exceptionKeys && exceptionKeys.indexOf(key) === -1)) {
                    v = o[key];
                    out[key] = (typeof v === 'object') ? this.clone(v) : v;
                }
            }
        }
        return out;
    };
    Utils.createUid = function () {
        return 'xxxxxxxxxxxx4xxxyxxxxxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            var r, v;
            r = Math.random() * 16 | 0;
            v = c === 'x' ? r : r & 0x3 | 0x8;
            return v.toString(16);
        });
    };
    Utils.prepareOptions = function (options, custom) {
        var result = { custom: {}, defaults: {} }, option;
        for (option in options) {
            if (options.hasOwnProperty(option)) {
                if (custom.indexOf(option) > -1) {
                    result.custom = result.custom || {};
                    result.custom[option] = options[option];
                }
                else {
                    result.defaults = result.defaults || {};
                    result.defaults[option] = options[option];
                }
            }
        }
        return result;
    };
    Utils.isArray = function (arg) {
        return Object.prototype.toString.call(arg) === '[object Array]';
    };
    Utils.toArray = function (obj) {
        return Object.keys(obj).map(function (key) {
            return obj[key];
        });
    };
    Utils.defaultDimension = function (item) {
        return function (d) {
            if (typeof d.data[item] === 'undefined' && typeof d[item] !== 'undefined') {
                return d[item];
            }
            if (typeof d.data[item] === 'undefined' && typeof d[item] === 'undefined') {
                return null;
            }
            return d.data[item];
        };
    };
    // compares two lists and returns the common items
    Utils.getCommonObject = function (list1, list2) {
        var result = {};
        for (var uid in list1) {
            if (list1.hasOwnProperty(uid)) {
                var match = list2[uid];
                if (typeof match !== 'undefined') {
                    result[uid] = match;
                }
            }
        }
        return result;
    };
    return Utils;
})();
module.exports = Utils;

},{}],21:[function(require,module,exports){
(function(exports){
crossfilter.version = "1.3.11";
function crossfilter_identity(d) {
  return d;
}
crossfilter.permute = permute;

function permute(array, index) {
  for (var i = 0, n = index.length, copy = new Array(n); i < n; ++i) {
    copy[i] = array[index[i]];
  }
  return copy;
}
var bisect = crossfilter.bisect = bisect_by(crossfilter_identity);

bisect.by = bisect_by;

function bisect_by(f) {

  // Locate the insertion point for x in a to maintain sorted order. The
  // arguments lo and hi may be used to specify a subset of the array which
  // should be considered; by default the entire array is used. If x is already
  // present in a, the insertion point will be before (to the left of) any
  // existing entries. The return value is suitable for use as the first
  // argument to `array.splice` assuming that a is already sorted.
  //
  // The returned insertion point i partitions the array a into two halves so
  // that all v < x for v in a[lo:i] for the left side and all v >= x for v in
  // a[i:hi] for the right side.
  function bisectLeft(a, x, lo, hi) {
    while (lo < hi) {
      var mid = lo + hi >>> 1;
      if (f(a[mid]) < x) lo = mid + 1;
      else hi = mid;
    }
    return lo;
  }

  // Similar to bisectLeft, but returns an insertion point which comes after (to
  // the right of) any existing entries of x in a.
  //
  // The returned insertion point i partitions the array into two halves so that
  // all v <= x for v in a[lo:i] for the left side and all v > x for v in
  // a[i:hi] for the right side.
  function bisectRight(a, x, lo, hi) {
    while (lo < hi) {
      var mid = lo + hi >>> 1;
      if (x < f(a[mid])) hi = mid;
      else lo = mid + 1;
    }
    return lo;
  }

  bisectRight.right = bisectRight;
  bisectRight.left = bisectLeft;
  return bisectRight;
}
var heap = crossfilter.heap = heap_by(crossfilter_identity);

heap.by = heap_by;

function heap_by(f) {

  // Builds a binary heap within the specified array a[lo:hi]. The heap has the
  // property such that the parent a[lo+i] is always less than or equal to its
  // two children: a[lo+2*i+1] and a[lo+2*i+2].
  function heap(a, lo, hi) {
    var n = hi - lo,
        i = (n >>> 1) + 1;
    while (--i > 0) sift(a, i, n, lo);
    return a;
  }

  // Sorts the specified array a[lo:hi] in descending order, assuming it is
  // already a heap.
  function sort(a, lo, hi) {
    var n = hi - lo,
        t;
    while (--n > 0) t = a[lo], a[lo] = a[lo + n], a[lo + n] = t, sift(a, 1, n, lo);
    return a;
  }

  // Sifts the element a[lo+i-1] down the heap, where the heap is the contiguous
  // slice of array a[lo:lo+n]. This method can also be used to update the heap
  // incrementally, without incurring the full cost of reconstructing the heap.
  function sift(a, i, n, lo) {
    var d = a[--lo + i],
        x = f(d),
        child;
    while ((child = i << 1) <= n) {
      if (child < n && f(a[lo + child]) > f(a[lo + child + 1])) child++;
      if (x <= f(a[lo + child])) break;
      a[lo + i] = a[lo + child];
      i = child;
    }
    a[lo + i] = d;
  }

  heap.sort = sort;
  return heap;
}
var heapselect = crossfilter.heapselect = heapselect_by(crossfilter_identity);

heapselect.by = heapselect_by;

function heapselect_by(f) {
  var heap = heap_by(f);

  // Returns a new array containing the top k elements in the array a[lo:hi].
  // The returned array is not sorted, but maintains the heap property. If k is
  // greater than hi - lo, then fewer than k elements will be returned. The
  // order of elements in a is unchanged by this operation.
  function heapselect(a, lo, hi, k) {
    var queue = new Array(k = Math.min(hi - lo, k)),
        min,
        i,
        x,
        d;

    for (i = 0; i < k; ++i) queue[i] = a[lo++];
    heap(queue, 0, k);

    if (lo < hi) {
      min = f(queue[0]);
      do {
        if (x = f(d = a[lo]) > min) {
          queue[0] = d;
          min = f(heap(queue, 0, k)[0]);
        }
      } while (++lo < hi);
    }

    return queue;
  }

  return heapselect;
}
var insertionsort = crossfilter.insertionsort = insertionsort_by(crossfilter_identity);

insertionsort.by = insertionsort_by;

function insertionsort_by(f) {

  function insertionsort(a, lo, hi) {
    for (var i = lo + 1; i < hi; ++i) {
      for (var j = i, t = a[i], x = f(t); j > lo && f(a[j - 1]) > x; --j) {
        a[j] = a[j - 1];
      }
      a[j] = t;
    }
    return a;
  }

  return insertionsort;
}
// Algorithm designed by Vladimir Yaroslavskiy.
// Implementation based on the Dart project; see lib/dart/LICENSE for details.

var quicksort = crossfilter.quicksort = quicksort_by(crossfilter_identity);

quicksort.by = quicksort_by;

function quicksort_by(f) {
  var insertionsort = insertionsort_by(f);

  function sort(a, lo, hi) {
    return (hi - lo < quicksort_sizeThreshold
        ? insertionsort
        : quicksort)(a, lo, hi);
  }

  function quicksort(a, lo, hi) {
    // Compute the two pivots by looking at 5 elements.
    var sixth = (hi - lo) / 6 | 0,
        i1 = lo + sixth,
        i5 = hi - 1 - sixth,
        i3 = lo + hi - 1 >> 1,  // The midpoint.
        i2 = i3 - sixth,
        i4 = i3 + sixth;

    var e1 = a[i1], x1 = f(e1),
        e2 = a[i2], x2 = f(e2),
        e3 = a[i3], x3 = f(e3),
        e4 = a[i4], x4 = f(e4),
        e5 = a[i5], x5 = f(e5);

    var t;

    // Sort the selected 5 elements using a sorting network.
    if (x1 > x2) t = e1, e1 = e2, e2 = t, t = x1, x1 = x2, x2 = t;
    if (x4 > x5) t = e4, e4 = e5, e5 = t, t = x4, x4 = x5, x5 = t;
    if (x1 > x3) t = e1, e1 = e3, e3 = t, t = x1, x1 = x3, x3 = t;
    if (x2 > x3) t = e2, e2 = e3, e3 = t, t = x2, x2 = x3, x3 = t;
    if (x1 > x4) t = e1, e1 = e4, e4 = t, t = x1, x1 = x4, x4 = t;
    if (x3 > x4) t = e3, e3 = e4, e4 = t, t = x3, x3 = x4, x4 = t;
    if (x2 > x5) t = e2, e2 = e5, e5 = t, t = x2, x2 = x5, x5 = t;
    if (x2 > x3) t = e2, e2 = e3, e3 = t, t = x2, x2 = x3, x3 = t;
    if (x4 > x5) t = e4, e4 = e5, e5 = t, t = x4, x4 = x5, x5 = t;

    var pivot1 = e2, pivotValue1 = x2,
        pivot2 = e4, pivotValue2 = x4;

    // e2 and e4 have been saved in the pivot variables. They will be written
    // back, once the partitioning is finished.
    a[i1] = e1;
    a[i2] = a[lo];
    a[i3] = e3;
    a[i4] = a[hi - 1];
    a[i5] = e5;

    var less = lo + 1,   // First element in the middle partition.
        great = hi - 2;  // Last element in the middle partition.

    // Note that for value comparison, <, <=, >= and > coerce to a primitive via
    // Object.prototype.valueOf; == and === do not, so in order to be consistent
    // with natural order (such as for Date objects), we must do two compares.
    var pivotsEqual = pivotValue1 <= pivotValue2 && pivotValue1 >= pivotValue2;
    if (pivotsEqual) {

      // Degenerated case where the partitioning becomes a dutch national flag
      // problem.
      //
      // [ |  < pivot  | == pivot | unpartitioned | > pivot  | ]
      //  ^             ^          ^             ^            ^
      // left         less         k           great         right
      //
      // a[left] and a[right] are undefined and are filled after the
      // partitioning.
      //
      // Invariants:
      //   1) for x in ]left, less[ : x < pivot.
      //   2) for x in [less, k[ : x == pivot.
      //   3) for x in ]great, right[ : x > pivot.
      for (var k = less; k <= great; ++k) {
        var ek = a[k], xk = f(ek);
        if (xk < pivotValue1) {
          if (k !== less) {
            a[k] = a[less];
            a[less] = ek;
          }
          ++less;
        } else if (xk > pivotValue1) {

          // Find the first element <= pivot in the range [k - 1, great] and
          // put [:ek:] there. We know that such an element must exist:
          // When k == less, then el3 (which is equal to pivot) lies in the
          // interval. Otherwise a[k - 1] == pivot and the search stops at k-1.
          // Note that in the latter case invariant 2 will be violated for a
          // short amount of time. The invariant will be restored when the
          // pivots are put into their final positions.
          while (true) {
            var greatValue = f(a[great]);
            if (greatValue > pivotValue1) {
              great--;
              // This is the only location in the while-loop where a new
              // iteration is started.
              continue;
            } else if (greatValue < pivotValue1) {
              // Triple exchange.
              a[k] = a[less];
              a[less++] = a[great];
              a[great--] = ek;
              break;
            } else {
              a[k] = a[great];
              a[great--] = ek;
              // Note: if great < k then we will exit the outer loop and fix
              // invariant 2 (which we just violated).
              break;
            }
          }
        }
      }
    } else {

      // We partition the list into three parts:
      //  1. < pivot1
      //  2. >= pivot1 && <= pivot2
      //  3. > pivot2
      //
      // During the loop we have:
      // [ | < pivot1 | >= pivot1 && <= pivot2 | unpartitioned  | > pivot2  | ]
      //  ^            ^                        ^              ^             ^
      // left         less                     k              great        right
      //
      // a[left] and a[right] are undefined and are filled after the
      // partitioning.
      //
      // Invariants:
      //   1. for x in ]left, less[ : x < pivot1
      //   2. for x in [less, k[ : pivot1 <= x && x <= pivot2
      //   3. for x in ]great, right[ : x > pivot2
      for (var k = less; k <= great; k++) {
        var ek = a[k], xk = f(ek);
        if (xk < pivotValue1) {
          if (k !== less) {
            a[k] = a[less];
            a[less] = ek;
          }
          ++less;
        } else {
          if (xk > pivotValue2) {
            while (true) {
              var greatValue = f(a[great]);
              if (greatValue > pivotValue2) {
                great--;
                if (great < k) break;
                // This is the only location inside the loop where a new
                // iteration is started.
                continue;
              } else {
                // a[great] <= pivot2.
                if (greatValue < pivotValue1) {
                  // Triple exchange.
                  a[k] = a[less];
                  a[less++] = a[great];
                  a[great--] = ek;
                } else {
                  // a[great] >= pivot1.
                  a[k] = a[great];
                  a[great--] = ek;
                }
                break;
              }
            }
          }
        }
      }
    }

    // Move pivots into their final positions.
    // We shrunk the list from both sides (a[left] and a[right] have
    // meaningless values in them) and now we move elements from the first
    // and third partition into these locations so that we can store the
    // pivots.
    a[lo] = a[less - 1];
    a[less - 1] = pivot1;
    a[hi - 1] = a[great + 1];
    a[great + 1] = pivot2;

    // The list is now partitioned into three partitions:
    // [ < pivot1   | >= pivot1 && <= pivot2   |  > pivot2   ]
    //  ^            ^                        ^             ^
    // left         less                     great        right

    // Recursive descent. (Don't include the pivot values.)
    sort(a, lo, less - 1);
    sort(a, great + 2, hi);

    if (pivotsEqual) {
      // All elements in the second partition are equal to the pivot. No
      // need to sort them.
      return a;
    }

    // In theory it should be enough to call _doSort recursively on the second
    // partition.
    // The Android source however removes the pivot elements from the recursive
    // call if the second partition is too large (more than 2/3 of the list).
    if (less < i1 && great > i5) {
      var lessValue, greatValue;
      while ((lessValue = f(a[less])) <= pivotValue1 && lessValue >= pivotValue1) ++less;
      while ((greatValue = f(a[great])) <= pivotValue2 && greatValue >= pivotValue2) --great;

      // Copy paste of the previous 3-way partitioning with adaptions.
      //
      // We partition the list into three parts:
      //  1. == pivot1
      //  2. > pivot1 && < pivot2
      //  3. == pivot2
      //
      // During the loop we have:
      // [ == pivot1 | > pivot1 && < pivot2 | unpartitioned  | == pivot2 ]
      //              ^                      ^              ^
      //            less                     k              great
      //
      // Invariants:
      //   1. for x in [ *, less[ : x == pivot1
      //   2. for x in [less, k[ : pivot1 < x && x < pivot2
      //   3. for x in ]great, * ] : x == pivot2
      for (var k = less; k <= great; k++) {
        var ek = a[k], xk = f(ek);
        if (xk <= pivotValue1 && xk >= pivotValue1) {
          if (k !== less) {
            a[k] = a[less];
            a[less] = ek;
          }
          less++;
        } else {
          if (xk <= pivotValue2 && xk >= pivotValue2) {
            while (true) {
              var greatValue = f(a[great]);
              if (greatValue <= pivotValue2 && greatValue >= pivotValue2) {
                great--;
                if (great < k) break;
                // This is the only location inside the loop where a new
                // iteration is started.
                continue;
              } else {
                // a[great] < pivot2.
                if (greatValue < pivotValue1) {
                  // Triple exchange.
                  a[k] = a[less];
                  a[less++] = a[great];
                  a[great--] = ek;
                } else {
                  // a[great] == pivot1.
                  a[k] = a[great];
                  a[great--] = ek;
                }
                break;
              }
            }
          }
        }
      }
    }

    // The second partition has now been cleared of pivot elements and looks
    // as follows:
    // [  *  |  > pivot1 && < pivot2  | * ]
    //        ^                      ^
    //       less                  great
    // Sort the second partition using recursive descent.

    // The second partition looks as follows:
    // [  *  |  >= pivot1 && <= pivot2  | * ]
    //        ^                        ^
    //       less                    great
    // Simply sort it by recursive descent.

    return sort(a, less, great + 1);
  }

  return sort;
}

var quicksort_sizeThreshold = 32;
var crossfilter_array8 = crossfilter_arrayUntyped,
    crossfilter_array16 = crossfilter_arrayUntyped,
    crossfilter_array32 = crossfilter_arrayUntyped,
    crossfilter_arrayLengthen = crossfilter_arrayLengthenUntyped,
    crossfilter_arrayWiden = crossfilter_arrayWidenUntyped;

if (typeof Uint8Array !== "undefined") {
  crossfilter_array8 = function(n) { return new Uint8Array(n); };
  crossfilter_array16 = function(n) { return new Uint16Array(n); };
  crossfilter_array32 = function(n) { return new Uint32Array(n); };

  crossfilter_arrayLengthen = function(array, length) {
    if (array.length >= length) return array;
    var copy = new array.constructor(length);
    copy.set(array);
    return copy;
  };

  crossfilter_arrayWiden = function(array, width) {
    var copy;
    switch (width) {
      case 16: copy = crossfilter_array16(array.length); break;
      case 32: copy = crossfilter_array32(array.length); break;
      default: throw new Error("invalid array width!");
    }
    copy.set(array);
    return copy;
  };
}

function crossfilter_arrayUntyped(n) {
  var array = new Array(n), i = -1;
  while (++i < n) array[i] = 0;
  return array;
}

function crossfilter_arrayLengthenUntyped(array, length) {
  var n = array.length;
  while (n < length) array[n++] = 0;
  return array;
}

function crossfilter_arrayWidenUntyped(array, width) {
  if (width > 32) throw new Error("invalid array width!");
  return array;
}
function crossfilter_filterExact(bisect, value) {
  return function(values) {
    var n = values.length;
    return [bisect.left(values, value, 0, n), bisect.right(values, value, 0, n)];
  };
}

function crossfilter_filterRange(bisect, range) {
  var min = range[0],
      max = range[1];
  return function(values) {
    var n = values.length;
    return [bisect.left(values, min, 0, n), bisect.left(values, max, 0, n)];
  };
}

function crossfilter_filterAll(values) {
  return [0, values.length];
}
function crossfilter_null() {
  return null;
}
function crossfilter_zero() {
  return 0;
}
function crossfilter_reduceIncrement(p) {
  return p + 1;
}

function crossfilter_reduceDecrement(p) {
  return p - 1;
}

function crossfilter_reduceAdd(f) {
  return function(p, v) {
    return p + +f(v);
  };
}

function crossfilter_reduceSubtract(f) {
  return function(p, v) {
    return p - f(v);
  };
}
exports.crossfilter = crossfilter;

function crossfilter() {
  var crossfilter = {
    add: add,
    remove: removeData,
    dimension: dimension,
    groupAll: groupAll,
    size: size
  };

  var data = [], // the records
      n = 0, // the number of records; data.length
      m = 0, // a bit mask representing which dimensions are in use
      M = 8, // number of dimensions that can fit in `filters`
      filters = crossfilter_array8(0), // M bits per record; 1 is filtered out
      filterListeners = [], // when the filters change
      dataListeners = [], // when data is added
      removeDataListeners = []; // when data is removed

  // Adds the specified new records to this crossfilter.
  function add(newData) {
    var n0 = n,
        n1 = newData.length;

    // If there's actually new data to add…
    // Merge the new data into the existing data.
    // Lengthen the filter bitset to handle the new records.
    // Notify listeners (dimensions and groups) that new data is available.
    if (n1) {
      data = data.concat(newData);
      filters = crossfilter_arrayLengthen(filters, n += n1);
      dataListeners.forEach(function(l) { l(newData, n0, n1); });
    }

    return crossfilter;
  }

  // Removes all records that match the current filters.
  function removeData() {
    var newIndex = crossfilter_index(n, n),
        removed = [];
    for (var i = 0, j = 0; i < n; ++i) {
      if (filters[i]) newIndex[i] = j++;
      else removed.push(i);
    }

    // Remove all matching records from groups.
    filterListeners.forEach(function(l) { l(0, [], removed); });

    // Update indexes.
    removeDataListeners.forEach(function(l) { l(newIndex); });

    // Remove old filters and data by overwriting.
    for (var i = 0, j = 0, k; i < n; ++i) {
      if (k = filters[i]) {
        if (i !== j) filters[j] = k, data[j] = data[i];
        ++j;
      }
    }
    data.length = j;
    while (n > j) filters[--n] = 0;
  }

  // Adds a new dimension with the specified value accessor function.
  function dimension(value) {
    var dimension = {
      filter: filter,
      filterExact: filterExact,
      filterRange: filterRange,
      filterFunction: filterFunction,
      filterAll: filterAll,
      top: top,
      bottom: bottom,
      group: group,
      groupAll: groupAll,
      dispose: dispose,
      remove: dispose // for backwards-compatibility
    };

    var one = ~m & -~m, // lowest unset bit as mask, e.g., 00001000
        zero = ~one, // inverted one, e.g., 11110111
        values, // sorted, cached array
        index, // value rank ↦ object id
        newValues, // temporary array storing newly-added values
        newIndex, // temporary array storing newly-added index
        sort = quicksort_by(function(i) { return newValues[i]; }),
        refilter = crossfilter_filterAll, // for recomputing filter
        refilterFunction, // the custom filter function in use
        indexListeners = [], // when data is added
        dimensionGroups = [],
        lo0 = 0,
        hi0 = 0;

    // Updating a dimension is a two-stage process. First, we must update the
    // associated filters for the newly-added records. Once all dimensions have
    // updated their filters, the groups are notified to update.
    dataListeners.unshift(preAdd);
    dataListeners.push(postAdd);

    removeDataListeners.push(removeData);

    // Incorporate any existing data into this dimension, and make sure that the
    // filter bitset is wide enough to handle the new dimension.
    m |= one;
    if (M >= 32 ? !one : m & (1 << M) - 1) {
      filters = crossfilter_arrayWiden(filters, M <<= 1);
    }
    preAdd(data, 0, n);
    postAdd(data, 0, n);

    // Incorporates the specified new records into this dimension.
    // This function is responsible for updating filters, values, and index.
    function preAdd(newData, n0, n1) {

      // Permute new values into natural order using a sorted index.
      newValues = newData.map(value);
      newIndex = sort(crossfilter_range(n1), 0, n1);
      newValues = permute(newValues, newIndex);

      // Bisect newValues to determine which new records are selected.
      var bounds = refilter(newValues), lo1 = bounds[0], hi1 = bounds[1], i;
      if (refilterFunction) {
        for (i = 0; i < n1; ++i) {
          if (!refilterFunction(newValues[i], i)) filters[newIndex[i] + n0] |= one;
        }
      } else {
        for (i = 0; i < lo1; ++i) filters[newIndex[i] + n0] |= one;
        for (i = hi1; i < n1; ++i) filters[newIndex[i] + n0] |= one;
      }

      // If this dimension previously had no data, then we don't need to do the
      // more expensive merge operation; use the new values and index as-is.
      if (!n0) {
        values = newValues;
        index = newIndex;
        lo0 = lo1;
        hi0 = hi1;
        return;
      }

      var oldValues = values,
          oldIndex = index,
          i0 = 0,
          i1 = 0;

      // Otherwise, create new arrays into which to merge new and old.
      values = new Array(n);
      index = crossfilter_index(n, n);

      // Merge the old and new sorted values, and old and new index.
      for (i = 0; i0 < n0 && i1 < n1; ++i) {
        if (oldValues[i0] < newValues[i1]) {
          values[i] = oldValues[i0];
          index[i] = oldIndex[i0++];
        } else {
          values[i] = newValues[i1];
          index[i] = newIndex[i1++] + n0;
        }
      }

      // Add any remaining old values.
      for (; i0 < n0; ++i0, ++i) {
        values[i] = oldValues[i0];
        index[i] = oldIndex[i0];
      }

      // Add any remaining new values.
      for (; i1 < n1; ++i1, ++i) {
        values[i] = newValues[i1];
        index[i] = newIndex[i1] + n0;
      }

      // Bisect again to recompute lo0 and hi0.
      bounds = refilter(values), lo0 = bounds[0], hi0 = bounds[1];
    }

    // When all filters have updated, notify index listeners of the new values.
    function postAdd(newData, n0, n1) {
      indexListeners.forEach(function(l) { l(newValues, newIndex, n0, n1); });
      newValues = newIndex = null;
    }

    function removeData(reIndex) {
      for (var i = 0, j = 0, k; i < n; ++i) {
        if (filters[k = index[i]]) {
          if (i !== j) values[j] = values[i];
          index[j] = reIndex[k];
          ++j;
        }
      }
      values.length = j;
      while (j < n) index[j++] = 0;

      // Bisect again to recompute lo0 and hi0.
      var bounds = refilter(values);
      lo0 = bounds[0], hi0 = bounds[1];
    }

    // Updates the selected values based on the specified bounds [lo, hi].
    // This implementation is used by all the public filter methods.
    function filterIndexBounds(bounds) {
      var lo1 = bounds[0],
          hi1 = bounds[1];

      if (refilterFunction) {
        refilterFunction = null;
        filterIndexFunction(function(d, i) { return lo1 <= i && i < hi1; });
        lo0 = lo1;
        hi0 = hi1;
        return dimension;
      }

      var i,
          j,
          k,
          added = [],
          removed = [];

      // Fast incremental update based on previous lo index.
      if (lo1 < lo0) {
        for (i = lo1, j = Math.min(lo0, hi1); i < j; ++i) {
          filters[k = index[i]] ^= one;
          added.push(k);
        }
      } else if (lo1 > lo0) {
        for (i = lo0, j = Math.min(lo1, hi0); i < j; ++i) {
          filters[k = index[i]] ^= one;
          removed.push(k);
        }
      }

      // Fast incremental update based on previous hi index.
      if (hi1 > hi0) {
        for (i = Math.max(lo1, hi0), j = hi1; i < j; ++i) {
          filters[k = index[i]] ^= one;
          added.push(k);
        }
      } else if (hi1 < hi0) {
        for (i = Math.max(lo0, hi1), j = hi0; i < j; ++i) {
          filters[k = index[i]] ^= one;
          removed.push(k);
        }
      }

      lo0 = lo1;
      hi0 = hi1;
      filterListeners.forEach(function(l) { l(one, added, removed); });
      return dimension;
    }

    // Filters this dimension using the specified range, value, or null.
    // If the range is null, this is equivalent to filterAll.
    // If the range is an array, this is equivalent to filterRange.
    // Otherwise, this is equivalent to filterExact.
    function filter(range) {
      return range == null
          ? filterAll() : Array.isArray(range)
          ? filterRange(range) : typeof range === "function"
          ? filterFunction(range)
          : filterExact(range);
    }

    // Filters this dimension to select the exact value.
    function filterExact(value) {
      return filterIndexBounds((refilter = crossfilter_filterExact(bisect, value))(values));
    }

    // Filters this dimension to select the specified range [lo, hi].
    // The lower bound is inclusive, and the upper bound is exclusive.
    function filterRange(range) {
      return filterIndexBounds((refilter = crossfilter_filterRange(bisect, range))(values));
    }

    // Clears any filters on this dimension.
    function filterAll() {
      return filterIndexBounds((refilter = crossfilter_filterAll)(values));
    }

    // Filters this dimension using an arbitrary function.
    function filterFunction(f) {
      refilter = crossfilter_filterAll;

      filterIndexFunction(refilterFunction = f);

      lo0 = 0;
      hi0 = n;

      return dimension;
    }

    function filterIndexFunction(f) {
      var i,
          k,
          x,
          added = [],
          removed = [];

      for (i = 0; i < n; ++i) {
        if (!(filters[k = index[i]] & one) ^ !!(x = f(values[i], i))) {
          if (x) filters[k] &= zero, added.push(k);
          else filters[k] |= one, removed.push(k);
        }
      }
      filterListeners.forEach(function(l) { l(one, added, removed); });
    }

    // Returns the top K selected records based on this dimension's order.
    // Note: observes this dimension's filter, unlike group and groupAll.
    function top(k) {
      var array = [],
          i = hi0,
          j;

      while (--i >= lo0 && k > 0) {
        if (!filters[j = index[i]]) {
          array.push(data[j]);
          --k;
        }
      }

      return array;
    }

    // Returns the bottom K selected records based on this dimension's order.
    // Note: observes this dimension's filter, unlike group and groupAll.
    function bottom(k) {
      var array = [],
          i = lo0,
          j;

      while (i < hi0 && k > 0) {
        if (!filters[j = index[i]]) {
          array.push(data[j]);
          --k;
        }
        i++;
      }

      return array;
    }

    // Adds a new group to this dimension, using the specified key function.
    function group(key) {
      var group = {
        top: top,
        all: all,
        reduce: reduce,
        reduceCount: reduceCount,
        reduceSum: reduceSum,
        order: order,
        orderNatural: orderNatural,
        size: size,
        dispose: dispose,
        remove: dispose // for backwards-compatibility
      };

      // Ensure that this group will be removed when the dimension is removed.
      dimensionGroups.push(group);

      var groups, // array of {key, value}
          groupIndex, // object id ↦ group id
          groupWidth = 8,
          groupCapacity = crossfilter_capacity(groupWidth),
          k = 0, // cardinality
          select,
          heap,
          reduceAdd,
          reduceRemove,
          reduceInitial,
          update = crossfilter_null,
          reset = crossfilter_null,
          resetNeeded = true,
          groupAll = key === crossfilter_null;

      if (arguments.length < 1) key = crossfilter_identity;

      // The group listens to the crossfilter for when any dimension changes, so
      // that it can update the associated reduce values. It must also listen to
      // the parent dimension for when data is added, and compute new keys.
      filterListeners.push(update);
      indexListeners.push(add);
      removeDataListeners.push(removeData);

      // Incorporate any existing data into the grouping.
      add(values, index, 0, n);

      // Incorporates the specified new values into this group.
      // This function is responsible for updating groups and groupIndex.
      function add(newValues, newIndex, n0, n1) {
        var oldGroups = groups,
            reIndex = crossfilter_index(k, groupCapacity),
            add = reduceAdd,
            initial = reduceInitial,
            k0 = k, // old cardinality
            i0 = 0, // index of old group
            i1 = 0, // index of new record
            j, // object id
            g0, // old group
            x0, // old key
            x1, // new key
            g, // group to add
            x; // key of group to add

        // If a reset is needed, we don't need to update the reduce values.
        if (resetNeeded) add = initial = crossfilter_null;

        // Reset the new groups (k is a lower bound).
        // Also, make sure that groupIndex exists and is long enough.
        groups = new Array(k), k = 0;
        groupIndex = k0 > 1 ? crossfilter_arrayLengthen(groupIndex, n) : crossfilter_index(n, groupCapacity);

        // Get the first old key (x0 of g0), if it exists.
        if (k0) x0 = (g0 = oldGroups[0]).key;

        // Find the first new key (x1), skipping NaN keys.
        while (i1 < n1 && !((x1 = key(newValues[i1])) >= x1)) ++i1;

        // While new keys remain…
        while (i1 < n1) {

          // Determine the lesser of the two current keys; new and old.
          // If there are no old keys remaining, then always add the new key.
          if (g0 && x0 <= x1) {
            g = g0, x = x0;

            // Record the new index of the old group.
            reIndex[i0] = k;

            // Retrieve the next old key.
            if (g0 = oldGroups[++i0]) x0 = g0.key;
          } else {
            g = {key: x1, value: initial()}, x = x1;
          }

          // Add the lesser group.
          groups[k] = g;

          // Add any selected records belonging to the added group, while
          // advancing the new key and populating the associated group index.
          while (!(x1 > x)) {
            groupIndex[j = newIndex[i1] + n0] = k;
            if (!(filters[j] & zero)) g.value = add(g.value, data[j]);
            if (++i1 >= n1) break;
            x1 = key(newValues[i1]);
          }

          groupIncrement();
        }

        // Add any remaining old groups that were greater than all new keys.
        // No incremental reduce is needed; these groups have no new records.
        // Also record the new index of the old group.
        while (i0 < k0) {
          groups[reIndex[i0] = k] = oldGroups[i0++];
          groupIncrement();
        }

        // If we added any new groups before any old groups,
        // update the group index of all the old records.
        if (k > i0) for (i0 = 0; i0 < n0; ++i0) {
          groupIndex[i0] = reIndex[groupIndex[i0]];
        }

        // Modify the update and reset behavior based on the cardinality.
        // If the cardinality is less than or equal to one, then the groupIndex
        // is not needed. If the cardinality is zero, then there are no records
        // and therefore no groups to update or reset. Note that we also must
        // change the registered listener to point to the new method.
        j = filterListeners.indexOf(update);
        if (k > 1) {
          update = updateMany;
          reset = resetMany;
        } else {
          if (!k && groupAll) {
            k = 1;
            groups = [{key: null, value: initial()}];
          }
          if (k === 1) {
            update = updateOne;
            reset = resetOne;
          } else {
            update = crossfilter_null;
            reset = crossfilter_null;
          }
          groupIndex = null;
        }
        filterListeners[j] = update;

        // Count the number of added groups,
        // and widen the group index as needed.
        function groupIncrement() {
          if (++k === groupCapacity) {
            reIndex = crossfilter_arrayWiden(reIndex, groupWidth <<= 1);
            groupIndex = crossfilter_arrayWiden(groupIndex, groupWidth);
            groupCapacity = crossfilter_capacity(groupWidth);
          }
        }
      }

      function removeData() {
        if (k > 1) {
          var oldK = k,
              oldGroups = groups,
              seenGroups = crossfilter_index(oldK, oldK);

          // Filter out non-matches by copying matching group index entries to
          // the beginning of the array.
          for (var i = 0, j = 0; i < n; ++i) {
            if (filters[i]) {
              seenGroups[groupIndex[j] = groupIndex[i]] = 1;
              ++j;
            }
          }

          // Reassemble groups including only those groups that were referred
          // to by matching group index entries.  Note the new group index in
          // seenGroups.
          groups = [], k = 0;
          for (i = 0; i < oldK; ++i) {
            if (seenGroups[i]) {
              seenGroups[i] = k++;
              groups.push(oldGroups[i]);
            }
          }

          if (k > 1) {
            // Reindex the group index using seenGroups to find the new index.
            for (var i = 0; i < j; ++i) groupIndex[i] = seenGroups[groupIndex[i]];
          } else {
            groupIndex = null;
          }
          filterListeners[filterListeners.indexOf(update)] = k > 1
              ? (reset = resetMany, update = updateMany)
              : k === 1 ? (reset = resetOne, update = updateOne)
              : reset = update = crossfilter_null;
        } else if (k === 1) {
          if (groupAll) return;
          for (var i = 0; i < n; ++i) if (filters[i]) return;
          groups = [], k = 0;
          filterListeners[filterListeners.indexOf(update)] =
          update = reset = crossfilter_null;
        }
      }

      // Reduces the specified selected or deselected records.
      // This function is only used when the cardinality is greater than 1.
      function updateMany(filterOne, added, removed) {
        if (filterOne === one || resetNeeded) return;

        var i,
            k,
            n,
            g;

        // Add the added values.
        for (i = 0, n = added.length; i < n; ++i) {
          if (!(filters[k = added[i]] & zero)) {
            g = groups[groupIndex[k]];
            g.value = reduceAdd(g.value, data[k]);
          }
        }

        // Remove the removed values.
        for (i = 0, n = removed.length; i < n; ++i) {
          if ((filters[k = removed[i]] & zero) === filterOne) {
            g = groups[groupIndex[k]];
            g.value = reduceRemove(g.value, data[k]);
          }
        }
      }

      // Reduces the specified selected or deselected records.
      // This function is only used when the cardinality is 1.
      function updateOne(filterOne, added, removed) {
        if (filterOne === one || resetNeeded) return;

        var i,
            k,
            n,
            g = groups[0];

        // Add the added values.
        for (i = 0, n = added.length; i < n; ++i) {
          if (!(filters[k = added[i]] & zero)) {
            g.value = reduceAdd(g.value, data[k]);
          }
        }

        // Remove the removed values.
        for (i = 0, n = removed.length; i < n; ++i) {
          if ((filters[k = removed[i]] & zero) === filterOne) {
            g.value = reduceRemove(g.value, data[k]);
          }
        }
      }

      // Recomputes the group reduce values from scratch.
      // This function is only used when the cardinality is greater than 1.
      function resetMany() {
        var i,
            g;

        // Reset all group values.
        for (i = 0; i < k; ++i) {
          groups[i].value = reduceInitial();
        }

        // Add any selected records.
        for (i = 0; i < n; ++i) {
          if (!(filters[i] & zero)) {
            g = groups[groupIndex[i]];
            g.value = reduceAdd(g.value, data[i]);
          }
        }
      }

      // Recomputes the group reduce values from scratch.
      // This function is only used when the cardinality is 1.
      function resetOne() {
        var i,
            g = groups[0];

        // Reset the singleton group values.
        g.value = reduceInitial();

        // Add any selected records.
        for (i = 0; i < n; ++i) {
          if (!(filters[i] & zero)) {
            g.value = reduceAdd(g.value, data[i]);
          }
        }
      }

      // Returns the array of group values, in the dimension's natural order.
      function all() {
        if (resetNeeded) reset(), resetNeeded = false;
        return groups;
      }

      // Returns a new array containing the top K group values, in reduce order.
      function top(k) {
        var top = select(all(), 0, groups.length, k);
        return heap.sort(top, 0, top.length);
      }

      // Sets the reduce behavior for this group to use the specified functions.
      // This method lazily recomputes the reduce values, waiting until needed.
      function reduce(add, remove, initial) {
        reduceAdd = add;
        reduceRemove = remove;
        reduceInitial = initial;
        resetNeeded = true;
        return group;
      }

      // A convenience method for reducing by count.
      function reduceCount() {
        return reduce(crossfilter_reduceIncrement, crossfilter_reduceDecrement, crossfilter_zero);
      }

      // A convenience method for reducing by sum(value).
      function reduceSum(value) {
        return reduce(crossfilter_reduceAdd(value), crossfilter_reduceSubtract(value), crossfilter_zero);
      }

      // Sets the reduce order, using the specified accessor.
      function order(value) {
        select = heapselect_by(valueOf);
        heap = heap_by(valueOf);
        function valueOf(d) { return value(d.value); }
        return group;
      }

      // A convenience method for natural ordering by reduce value.
      function orderNatural() {
        return order(crossfilter_identity);
      }

      // Returns the cardinality of this group, irrespective of any filters.
      function size() {
        return k;
      }

      // Removes this group and associated event listeners.
      function dispose() {
        var i = filterListeners.indexOf(update);
        if (i >= 0) filterListeners.splice(i, 1);
        i = indexListeners.indexOf(add);
        if (i >= 0) indexListeners.splice(i, 1);
        i = removeDataListeners.indexOf(removeData);
        if (i >= 0) removeDataListeners.splice(i, 1);
        return group;
      }

      return reduceCount().orderNatural();
    }

    // A convenience function for generating a singleton group.
    function groupAll() {
      var g = group(crossfilter_null), all = g.all;
      delete g.all;
      delete g.top;
      delete g.order;
      delete g.orderNatural;
      delete g.size;
      g.value = function() { return all()[0].value; };
      return g;
    }

    // Removes this dimension and associated groups and event listeners.
    function dispose() {
      dimensionGroups.forEach(function(group) { group.dispose(); });
      var i = dataListeners.indexOf(preAdd);
      if (i >= 0) dataListeners.splice(i, 1);
      i = dataListeners.indexOf(postAdd);
      if (i >= 0) dataListeners.splice(i, 1);
      i = removeDataListeners.indexOf(removeData);
      if (i >= 0) removeDataListeners.splice(i, 1);
      m &= zero;
      return filterAll();
    }

    return dimension;
  }

  // A convenience method for groupAll on a dummy dimension.
  // This implementation can be optimized since it always has cardinality 1.
  function groupAll() {
    var group = {
      reduce: reduce,
      reduceCount: reduceCount,
      reduceSum: reduceSum,
      value: value,
      dispose: dispose,
      remove: dispose // for backwards-compatibility
    };

    var reduceValue,
        reduceAdd,
        reduceRemove,
        reduceInitial,
        resetNeeded = true;

    // The group listens to the crossfilter for when any dimension changes, so
    // that it can update the reduce value. It must also listen to the parent
    // dimension for when data is added.
    filterListeners.push(update);
    dataListeners.push(add);

    // For consistency; actually a no-op since resetNeeded is true.
    add(data, 0, n);

    // Incorporates the specified new values into this group.
    function add(newData, n0) {
      var i;

      if (resetNeeded) return;

      // Add the added values.
      for (i = n0; i < n; ++i) {
        if (!filters[i]) {
          reduceValue = reduceAdd(reduceValue, data[i]);
        }
      }
    }

    // Reduces the specified selected or deselected records.
    function update(filterOne, added, removed) {
      var i,
          k,
          n;

      if (resetNeeded) return;

      // Add the added values.
      for (i = 0, n = added.length; i < n; ++i) {
        if (!filters[k = added[i]]) {
          reduceValue = reduceAdd(reduceValue, data[k]);
        }
      }

      // Remove the removed values.
      for (i = 0, n = removed.length; i < n; ++i) {
        if (filters[k = removed[i]] === filterOne) {
          reduceValue = reduceRemove(reduceValue, data[k]);
        }
      }
    }

    // Recomputes the group reduce value from scratch.
    function reset() {
      var i;

      reduceValue = reduceInitial();

      for (i = 0; i < n; ++i) {
        if (!filters[i]) {
          reduceValue = reduceAdd(reduceValue, data[i]);
        }
      }
    }

    // Sets the reduce behavior for this group to use the specified functions.
    // This method lazily recomputes the reduce value, waiting until needed.
    function reduce(add, remove, initial) {
      reduceAdd = add;
      reduceRemove = remove;
      reduceInitial = initial;
      resetNeeded = true;
      return group;
    }

    // A convenience method for reducing by count.
    function reduceCount() {
      return reduce(crossfilter_reduceIncrement, crossfilter_reduceDecrement, crossfilter_zero);
    }

    // A convenience method for reducing by sum(value).
    function reduceSum(value) {
      return reduce(crossfilter_reduceAdd(value), crossfilter_reduceSubtract(value), crossfilter_zero);
    }

    // Returns the computed reduce value.
    function value() {
      if (resetNeeded) reset(), resetNeeded = false;
      return reduceValue;
    }

    // Removes this group and associated event listeners.
    function dispose() {
      var i = filterListeners.indexOf(update);
      if (i >= 0) filterListeners.splice(i);
      i = dataListeners.indexOf(add);
      if (i >= 0) dataListeners.splice(i);
      return group;
    }

    return reduceCount();
  }

  // Returns the number of records in this crossfilter, irrespective of any filters.
  function size() {
    return n;
  }

  return arguments.length
      ? add(arguments[0])
      : crossfilter;
}

// Returns an array of size n, big enough to store ids up to m.
function crossfilter_index(n, m) {
  return (m < 0x101
      ? crossfilter_array8 : m < 0x10001
      ? crossfilter_array16
      : crossfilter_array32)(n);
}

// Constructs a new array of size n, with sequential values from 0 to n - 1.
function crossfilter_range(n) {
  var range = crossfilter_index(n, n);
  for (var i = -1; ++i < n;) range[i] = i;
  return range;
}

function crossfilter_capacity(w) {
  return w === 8
      ? 0x100 : w === 16
      ? 0x10000
      : 0x100000000;
}
})(typeof exports !== 'undefined' && exports || this);

},{}],22:[function(require,module,exports){
module.exports = require("./crossfilter").crossfilter;

},{"./crossfilter":21}],23:[function(require,module,exports){
!function() {
  var topojson = {
    version: "1.6.19",
    mesh: function(topology) { return object(topology, meshArcs.apply(this, arguments)); },
    meshArcs: meshArcs,
    merge: function(topology) { return object(topology, mergeArcs.apply(this, arguments)); },
    mergeArcs: mergeArcs,
    feature: featureOrCollection,
    neighbors: neighbors,
    presimplify: presimplify
  };

  function stitchArcs(topology, arcs) {
    var stitchedArcs = {},
        fragmentByStart = {},
        fragmentByEnd = {},
        fragments = [],
        emptyIndex = -1;

    // Stitch empty arcs first, since they may be subsumed by other arcs.
    arcs.forEach(function(i, j) {
      var arc = topology.arcs[i < 0 ? ~i : i], t;
      if (arc.length < 3 && !arc[1][0] && !arc[1][1]) {
        t = arcs[++emptyIndex], arcs[emptyIndex] = i, arcs[j] = t;
      }
    });

    arcs.forEach(function(i) {
      var e = ends(i),
          start = e[0],
          end = e[1],
          f, g;

      if (f = fragmentByEnd[start]) {
        delete fragmentByEnd[f.end];
        f.push(i);
        f.end = end;
        if (g = fragmentByStart[end]) {
          delete fragmentByStart[g.start];
          var fg = g === f ? f : f.concat(g);
          fragmentByStart[fg.start = f.start] = fragmentByEnd[fg.end = g.end] = fg;
        } else {
          fragmentByStart[f.start] = fragmentByEnd[f.end] = f;
        }
      } else if (f = fragmentByStart[end]) {
        delete fragmentByStart[f.start];
        f.unshift(i);
        f.start = start;
        if (g = fragmentByEnd[start]) {
          delete fragmentByEnd[g.end];
          var gf = g === f ? f : g.concat(f);
          fragmentByStart[gf.start = g.start] = fragmentByEnd[gf.end = f.end] = gf;
        } else {
          fragmentByStart[f.start] = fragmentByEnd[f.end] = f;
        }
      } else {
        f = [i];
        fragmentByStart[f.start = start] = fragmentByEnd[f.end = end] = f;
      }
    });

    function ends(i) {
      var arc = topology.arcs[i < 0 ? ~i : i], p0 = arc[0], p1;
      if (topology.transform) p1 = [0, 0], arc.forEach(function(dp) { p1[0] += dp[0], p1[1] += dp[1]; });
      else p1 = arc[arc.length - 1];
      return i < 0 ? [p1, p0] : [p0, p1];
    }

    function flush(fragmentByEnd, fragmentByStart) {
      for (var k in fragmentByEnd) {
        var f = fragmentByEnd[k];
        delete fragmentByStart[f.start];
        delete f.start;
        delete f.end;
        f.forEach(function(i) { stitchedArcs[i < 0 ? ~i : i] = 1; });
        fragments.push(f);
      }
    }

    flush(fragmentByEnd, fragmentByStart);
    flush(fragmentByStart, fragmentByEnd);
    arcs.forEach(function(i) { if (!stitchedArcs[i < 0 ? ~i : i]) fragments.push([i]); });

    return fragments;
  }

  function meshArcs(topology, o, filter) {
    var arcs = [];

    if (arguments.length > 1) {
      var geomsByArc = [],
          geom;

      function arc(i) {
        var j = i < 0 ? ~i : i;
        (geomsByArc[j] || (geomsByArc[j] = [])).push({i: i, g: geom});
      }

      function line(arcs) {
        arcs.forEach(arc);
      }

      function polygon(arcs) {
        arcs.forEach(line);
      }

      function geometry(o) {
        if (o.type === "GeometryCollection") o.geometries.forEach(geometry);
        else if (o.type in geometryType) geom = o, geometryType[o.type](o.arcs);
      }

      var geometryType = {
        LineString: line,
        MultiLineString: polygon,
        Polygon: polygon,
        MultiPolygon: function(arcs) { arcs.forEach(polygon); }
      };

      geometry(o);

      geomsByArc.forEach(arguments.length < 3
          ? function(geoms) { arcs.push(geoms[0].i); }
          : function(geoms) { if (filter(geoms[0].g, geoms[geoms.length - 1].g)) arcs.push(geoms[0].i); });
    } else {
      for (var i = 0, n = topology.arcs.length; i < n; ++i) arcs.push(i);
    }

    return {type: "MultiLineString", arcs: stitchArcs(topology, arcs)};
  }

  function mergeArcs(topology, objects) {
    var polygonsByArc = {},
        polygons = [],
        components = [];

    objects.forEach(function(o) {
      if (o.type === "Polygon") register(o.arcs);
      else if (o.type === "MultiPolygon") o.arcs.forEach(register);
    });

    function register(polygon) {
      polygon.forEach(function(ring) {
        ring.forEach(function(arc) {
          (polygonsByArc[arc = arc < 0 ? ~arc : arc] || (polygonsByArc[arc] = [])).push(polygon);
        });
      });
      polygons.push(polygon);
    }

    function exterior(ring) {
      return cartesianRingArea(object(topology, {type: "Polygon", arcs: [ring]}).coordinates[0]) > 0; // TODO allow spherical?
    }

    polygons.forEach(function(polygon) {
      if (!polygon._) {
        var component = [],
            neighbors = [polygon];
        polygon._ = 1;
        components.push(component);
        while (polygon = neighbors.pop()) {
          component.push(polygon);
          polygon.forEach(function(ring) {
            ring.forEach(function(arc) {
              polygonsByArc[arc < 0 ? ~arc : arc].forEach(function(polygon) {
                if (!polygon._) {
                  polygon._ = 1;
                  neighbors.push(polygon);
                }
              });
            });
          });
        }
      }
    });

    polygons.forEach(function(polygon) {
      delete polygon._;
    });

    return {
      type: "MultiPolygon",
      arcs: components.map(function(polygons) {
        var arcs = [];

        // Extract the exterior (unique) arcs.
        polygons.forEach(function(polygon) {
          polygon.forEach(function(ring) {
            ring.forEach(function(arc) {
              if (polygonsByArc[arc < 0 ? ~arc : arc].length < 2) {
                arcs.push(arc);
              }
            });
          });
        });

        // Stitch the arcs into one or more rings.
        arcs = stitchArcs(topology, arcs);

        // If more than one ring is returned,
        // at most one of these rings can be the exterior;
        // this exterior ring has the same winding order
        // as any exterior ring in the original polygons.
        if ((n = arcs.length) > 1) {
          var sgn = exterior(polygons[0][0]);
          for (var i = 0, t; i < n; ++i) {
            if (sgn === exterior(arcs[i])) {
              t = arcs[0], arcs[0] = arcs[i], arcs[i] = t;
              break;
            }
          }
        }

        return arcs;
      })
    };
  }

  function featureOrCollection(topology, o) {
    return o.type === "GeometryCollection" ? {
      type: "FeatureCollection",
      features: o.geometries.map(function(o) { return feature(topology, o); })
    } : feature(topology, o);
  }

  function feature(topology, o) {
    var f = {
      type: "Feature",
      id: o.id,
      properties: o.properties || {},
      geometry: object(topology, o)
    };
    if (o.id == null) delete f.id;
    return f;
  }

  function object(topology, o) {
    var absolute = transformAbsolute(topology.transform),
        arcs = topology.arcs;

    function arc(i, points) {
      if (points.length) points.pop();
      for (var a = arcs[i < 0 ? ~i : i], k = 0, n = a.length, p; k < n; ++k) {
        points.push(p = a[k].slice());
        absolute(p, k);
      }
      if (i < 0) reverse(points, n);
    }

    function point(p) {
      p = p.slice();
      absolute(p, 0);
      return p;
    }

    function line(arcs) {
      var points = [];
      for (var i = 0, n = arcs.length; i < n; ++i) arc(arcs[i], points);
      if (points.length < 2) points.push(points[0].slice());
      return points;
    }

    function ring(arcs) {
      var points = line(arcs);
      while (points.length < 4) points.push(points[0].slice());
      return points;
    }

    function polygon(arcs) {
      return arcs.map(ring);
    }

    function geometry(o) {
      var t = o.type;
      return t === "GeometryCollection" ? {type: t, geometries: o.geometries.map(geometry)}
          : t in geometryType ? {type: t, coordinates: geometryType[t](o)}
          : null;
    }

    var geometryType = {
      Point: function(o) { return point(o.coordinates); },
      MultiPoint: function(o) { return o.coordinates.map(point); },
      LineString: function(o) { return line(o.arcs); },
      MultiLineString: function(o) { return o.arcs.map(line); },
      Polygon: function(o) { return polygon(o.arcs); },
      MultiPolygon: function(o) { return o.arcs.map(polygon); }
    };

    return geometry(o);
  }

  function reverse(array, n) {
    var t, j = array.length, i = j - n; while (i < --j) t = array[i], array[i++] = array[j], array[j] = t;
  }

  function bisect(a, x) {
    var lo = 0, hi = a.length;
    while (lo < hi) {
      var mid = lo + hi >>> 1;
      if (a[mid] < x) lo = mid + 1;
      else hi = mid;
    }
    return lo;
  }

  function neighbors(objects) {
    var indexesByArc = {}, // arc index -> array of object indexes
        neighbors = objects.map(function() { return []; });

    function line(arcs, i) {
      arcs.forEach(function(a) {
        if (a < 0) a = ~a;
        var o = indexesByArc[a];
        if (o) o.push(i);
        else indexesByArc[a] = [i];
      });
    }

    function polygon(arcs, i) {
      arcs.forEach(function(arc) { line(arc, i); });
    }

    function geometry(o, i) {
      if (o.type === "GeometryCollection") o.geometries.forEach(function(o) { geometry(o, i); });
      else if (o.type in geometryType) geometryType[o.type](o.arcs, i);
    }

    var geometryType = {
      LineString: line,
      MultiLineString: polygon,
      Polygon: polygon,
      MultiPolygon: function(arcs, i) { arcs.forEach(function(arc) { polygon(arc, i); }); }
    };

    objects.forEach(geometry);

    for (var i in indexesByArc) {
      for (var indexes = indexesByArc[i], m = indexes.length, j = 0; j < m; ++j) {
        for (var k = j + 1; k < m; ++k) {
          var ij = indexes[j], ik = indexes[k], n;
          if ((n = neighbors[ij])[i = bisect(n, ik)] !== ik) n.splice(i, 0, ik);
          if ((n = neighbors[ik])[i = bisect(n, ij)] !== ij) n.splice(i, 0, ij);
        }
      }
    }

    return neighbors;
  }

  function presimplify(topology, triangleArea) {
    var absolute = transformAbsolute(topology.transform),
        relative = transformRelative(topology.transform),
        heap = minAreaHeap();

    if (!triangleArea) triangleArea = cartesianTriangleArea;

    topology.arcs.forEach(function(arc) {
      var triangles = [],
          maxArea = 0,
          triangle;

      // To store each point’s effective area, we create a new array rather than
      // extending the passed-in point to workaround a Chrome/V8 bug (getting
      // stuck in smi mode). For midpoints, the initial effective area of
      // Infinity will be computed in the next step.
      for (var i = 0, n = arc.length, p; i < n; ++i) {
        p = arc[i];
        absolute(arc[i] = [p[0], p[1], Infinity], i);
      }

      for (var i = 1, n = arc.length - 1; i < n; ++i) {
        triangle = arc.slice(i - 1, i + 2);
        triangle[1][2] = triangleArea(triangle);
        triangles.push(triangle);
        heap.push(triangle);
      }

      for (var i = 0, n = triangles.length; i < n; ++i) {
        triangle = triangles[i];
        triangle.previous = triangles[i - 1];
        triangle.next = triangles[i + 1];
      }

      while (triangle = heap.pop()) {
        var previous = triangle.previous,
            next = triangle.next;

        // If the area of the current point is less than that of the previous point
        // to be eliminated, use the latter's area instead. This ensures that the
        // current point cannot be eliminated without eliminating previously-
        // eliminated points.
        if (triangle[1][2] < maxArea) triangle[1][2] = maxArea;
        else maxArea = triangle[1][2];

        if (previous) {
          previous.next = next;
          previous[2] = triangle[2];
          update(previous);
        }

        if (next) {
          next.previous = previous;
          next[0] = triangle[0];
          update(next);
        }
      }

      arc.forEach(relative);
    });

    function update(triangle) {
      heap.remove(triangle);
      triangle[1][2] = triangleArea(triangle);
      heap.push(triangle);
    }

    return topology;
  };

  function cartesianRingArea(ring) {
    var i = -1,
        n = ring.length,
        a,
        b = ring[n - 1],
        area = 0;

    while (++i < n) {
      a = b;
      b = ring[i];
      area += a[0] * b[1] - a[1] * b[0];
    }

    return area * .5;
  }

  function cartesianTriangleArea(triangle) {
    var a = triangle[0], b = triangle[1], c = triangle[2];
    return Math.abs((a[0] - c[0]) * (b[1] - a[1]) - (a[0] - b[0]) * (c[1] - a[1]));
  }

  function compareArea(a, b) {
    return a[1][2] - b[1][2];
  }

  function minAreaHeap() {
    var heap = {},
        array = [],
        size = 0;

    heap.push = function(object) {
      up(array[object._ = size] = object, size++);
      return size;
    };

    heap.pop = function() {
      if (size <= 0) return;
      var removed = array[0], object;
      if (--size > 0) object = array[size], down(array[object._ = 0] = object, 0);
      return removed;
    };

    heap.remove = function(removed) {
      var i = removed._, object;
      if (array[i] !== removed) return; // invalid request
      if (i !== --size) object = array[size], (compareArea(object, removed) < 0 ? up : down)(array[object._ = i] = object, i);
      return i;
    };

    function up(object, i) {
      while (i > 0) {
        var j = ((i + 1) >> 1) - 1,
            parent = array[j];
        if (compareArea(object, parent) >= 0) break;
        array[parent._ = i] = parent;
        array[object._ = i = j] = object;
      }
    }

    function down(object, i) {
      while (true) {
        var r = (i + 1) << 1,
            l = r - 1,
            j = i,
            child = array[j];
        if (l < size && compareArea(array[l], child) < 0) child = array[j = l];
        if (r < size && compareArea(array[r], child) < 0) child = array[j = r];
        if (j === i) break;
        array[child._ = i] = child;
        array[object._ = i = j] = object;
      }
    }

    return heap;
  }

  function transformAbsolute(transform) {
    if (!transform) return noop;
    var x0,
        y0,
        kx = transform.scale[0],
        ky = transform.scale[1],
        dx = transform.translate[0],
        dy = transform.translate[1];
    return function(point, i) {
      if (!i) x0 = y0 = 0;
      point[0] = (x0 += point[0]) * kx + dx;
      point[1] = (y0 += point[1]) * ky + dy;
    };
  }

  function transformRelative(transform) {
    if (!transform) return noop;
    var x0,
        y0,
        kx = transform.scale[0],
        ky = transform.scale[1],
        dx = transform.translate[0],
        dy = transform.translate[1];
    return function(point, i) {
      if (!i) x0 = y0 = 0;
      var x1 = (point[0] - dx) / kx | 0,
          y1 = (point[1] - dy) / ky | 0;
      point[0] = x1 - x0;
      point[1] = y1 - y0;
      x0 = x1;
      y0 = y1;
    };
  }

  function noop() {}

  if (typeof define === "function" && define.amd) define(topojson);
  else if (typeof module === "object" && module.exports) module.exports = topojson;
  else this.topojson = topojson;
}();

},{}]},{},[12])(12)
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJidWlsZC9hZGRGZWF0dXJlLmpzIiwiYnVpbGQvYWRkRmlsdGVyLmpzIiwiYnVpbGQvYWRkTWFwLmpzIiwiYnVpbGQvYWRkTWFya2VyLmpzIiwiYnVpbGQvYWRkUGFuZWwuanMiLCJidWlsZC9jZW50ZXIuanMiLCJidWlsZC9jb25maWcuanMiLCJidWlsZC9maWx0ZXIuanMiLCJidWlsZC9maW5kTWFya2VyQnlJZC5qcyIsImJ1aWxkL2luZm9XaW5kb3cuanMiLCJidWlsZC9sb2NhdGUuanMiLCJidWlsZC9tYXBUb29scy5qcyIsImJ1aWxkL21hcHMuanMiLCJidWlsZC9yZW1vdmVNYXJrZXIuanMiLCJidWlsZC9yZXNldE1hcmtlci5qcyIsImJ1aWxkL3RlbXBsYXRlLmpzIiwiYnVpbGQvdXBkYXRlRmVhdHVyZS5qcyIsImJ1aWxkL3VwZGF0ZU1hcC5qcyIsImJ1aWxkL3VwZGF0ZU1hcmtlci5qcyIsImJ1aWxkL3V0aWxzLmpzIiwibm9kZV9tb2R1bGVzL2Nyb3NzZmlsdGVyL2Nyb3NzZmlsdGVyLmpzIiwibm9kZV9tb2R1bGVzL2Nyb3NzZmlsdGVyL2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL3RvcG9qc29uL3RvcG9qc29uLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM0VBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQy9GQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxSUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5RkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNmQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDckdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2RUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNWQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzVFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbkNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDekRBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbkhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6M0NBO0FBQ0E7O0FDREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiLy8vIDxyZWZlcmVuY2UgcGF0aD1cInR5cGluZ3MvdHNkLmQudHNcIi8+XG52YXIgdG9wb2pzb24gPSByZXF1aXJlKCd0b3BvanNvbicpO1xudmFyIHV0aWxzID0gcmVxdWlyZSgnLi91dGlscycpO1xudmFyIGFkZEZpbHRlciA9IHJlcXVpcmUoJy4vYWRkRmlsdGVyJyk7XG52YXIgQWRkRmVhdHVyZSA9IChmdW5jdGlvbiAoKSB7XG4gICAgZnVuY3Rpb24gQWRkRmVhdHVyZSh0aGF0KSB7XG4gICAgICAgIHRoaXMudGhhdCA9IHRoYXQ7XG4gICAgICAgIHZhciBhZGRGaWx0ZXJJbnN0YW5jZSA9IG5ldyBhZGRGaWx0ZXIodGhhdCwgJ2pzb24nKTtcbiAgICAgICAgdGhpcy5hZGRGaWx0ZXIgPSBmdW5jdGlvbiAoZmlsdGVycykge1xuICAgICAgICAgICAgcmV0dXJuIGFkZEZpbHRlckluc3RhbmNlLmFkZEZpbHRlcihmaWx0ZXJzKTtcbiAgICAgICAgfTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogQWRkcyBHZW9KU09OIEZlYXR1cmUgT3B0aW9ucyBsaWtlOiBzdHlsZVxuICAgICAqIEBwYXJhbSBmZWF0dXJlc1xuICAgICAqIEBwYXJhbSBvcHRpb25zXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBBZGRGZWF0dXJlLnByb3RvdHlwZS5hZGRGZWF0dXJlT3B0aW9ucyA9IGZ1bmN0aW9uIChmZWF0dXJlcywgb3B0aW9ucykge1xuICAgICAgICB2YXIgZmVhdHVyZSwgeDtcbiAgICAgICAgZm9yICh4IGluIGZlYXR1cmVzKSB7XG4gICAgICAgICAgICBpZiAoZmVhdHVyZXMuaGFzT3duUHJvcGVydHkoeCkpIHtcbiAgICAgICAgICAgICAgICBmZWF0dXJlID0gZmVhdHVyZXNbeF07XG4gICAgICAgICAgICAgICAgdmFyIHVpZCA9IHV0aWxzLmNyZWF0ZVVpZCgpO1xuICAgICAgICAgICAgICAgIGZlYXR1cmUudWlkID0gdWlkO1xuICAgICAgICAgICAgICAgIHZhciBkYXRhID0gZmVhdHVyZS5rO1xuICAgICAgICAgICAgICAgIGZlYXR1cmUuay51aWQgPSB1aWQ7XG4gICAgICAgICAgICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KGZlYXR1cmUsICdkYXRhJywge1xuICAgICAgICAgICAgICAgICAgICB2YWx1ZTogZGF0YSxcbiAgICAgICAgICAgICAgICAgICAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAgd3JpdGFibGU6IGZhbHNlLFxuICAgICAgICAgICAgICAgICAgICBjb25maWd1cmFibGU6IGZhbHNlXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgaWYgKG9wdGlvbnMpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKG9wdGlvbnMuZmlsdGVycykge1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gQWRkIGZpbHRlcnMgaWYgbm90IGRlZmluZWQuXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoIXRoaXMudGhhdC5qc29uLmZpbHRlcikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuYWRkRmlsdGVyKG9wdGlvbnMuZmlsdGVycyk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnRoYXQuanNvbi5jcm9zc2ZpbHRlci5hZGQoW2ZlYXR1cmVdKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBpZiAob3B0aW9ucy5zdHlsZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy50aGF0Lmluc3RhbmNlLmRhdGEub3ZlcnJpZGVTdHlsZShmZWF0dXJlLCBvcHRpb25zLnN0eWxlKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB0aGlzLnRoYXQuanNvbi5hbGxbZmVhdHVyZS5kYXRhLnVpZF0gPSBmZWF0dXJlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfTtcbiAgICAvKipcbiAgICAgKiBBZGRzIGEgVG9wbyBKU09OIGZpbGUgaW50byBhIE1hcFxuICAgICAqIEBwYXJhbSBkYXRhIFRoZSBwYXJzZWQgSlNPTiBGaWxlXG4gICAgICogQHBhcmFtIG9wdGlvbnNcbiAgICAgKi9cbiAgICBBZGRGZWF0dXJlLnByb3RvdHlwZS5hZGRUb3BvSnNvbiA9IGZ1bmN0aW9uIChkYXRhLCBvcHRpb25zKSB7XG4gICAgICAgIHZhciBpdGVtLCBnZW9Kc29uLCBmZWF0dXJlcywgeDtcbiAgICAgICAgZm9yICh4IGluIG9wdGlvbnMpIHtcbiAgICAgICAgICAgIGlmIChvcHRpb25zLmhhc093blByb3BlcnR5KHgpKSB7XG4gICAgICAgICAgICAgICAgaXRlbSA9IG9wdGlvbnNbeF07XG4gICAgICAgICAgICAgICAgZ2VvSnNvbiA9IHRvcG9qc29uLmZlYXR1cmUoZGF0YSwgZGF0YS5vYmplY3RzW2l0ZW0ub2JqZWN0XSk7XG4gICAgICAgICAgICAgICAgZmVhdHVyZXMgPSB0aGlzLnRoYXQuaW5zdGFuY2UuZGF0YS5hZGRHZW9Kc29uKGdlb0pzb24pO1xuICAgICAgICAgICAgICAgIHRoaXMuYWRkRmVhdHVyZU9wdGlvbnMoZmVhdHVyZXMsIGl0ZW0pO1xuICAgICAgICAgICAgICAgIG1hcFRvb2xzLm1hcHNbdGhpcy50aGF0LmlkXS5qc29uLmFsbFtpdGVtLm9iamVjdF0gPSBmZWF0dXJlcztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gZmVhdHVyZXM7XG4gICAgfTtcbiAgICBBZGRGZWF0dXJlLnByb3RvdHlwZS5hZGRHZW9Kc29uID0gZnVuY3Rpb24gKGRhdGEsIG9wdGlvbnMpIHtcbiAgICAgICAgdmFyIGZlYXR1cmVzID0gdGhpcy50aGF0Lmluc3RhbmNlLmRhdGEuYWRkR2VvSnNvbihkYXRhLCBvcHRpb25zKTtcbiAgICAgICAgdGhpcy5hZGRGZWF0dXJlT3B0aW9ucyhmZWF0dXJlcywgb3B0aW9ucyk7XG4gICAgICAgIHJldHVybiBmZWF0dXJlcztcbiAgICB9O1xuICAgIHJldHVybiBBZGRGZWF0dXJlO1xufSkoKTtcbm1vZHVsZS5leHBvcnRzID0gQWRkRmVhdHVyZTtcbiIsIi8vLyA8cmVmZXJlbmNlIHBhdGg9XCJ0eXBpbmdzL3RzZC5kLnRzXCIvPlxudmFyIHV0aWxzID0gcmVxdWlyZSgnLi91dGlscycpO1xudmFyIEFkZEZpbHRlciA9IChmdW5jdGlvbiAoKSB7XG4gICAgZnVuY3Rpb24gQWRkRmlsdGVyKHRoYXQsIHR5cGUpIHtcbiAgICAgICAgdGhpcy50aGF0ID0gdGhhdDtcbiAgICAgICAgdGhpcy50eXBlID0gdHlwZTtcbiAgICB9XG4gICAgQWRkRmlsdGVyLnByb3RvdHlwZS5hZGRGaWx0ZXIgPSBmdW5jdGlvbiAoZmlsdGVycykge1xuICAgICAgICB0aGlzLnRoYXRbdGhpcy50eXBlXS5jcm9zc2ZpbHRlciA9IHRoaXMudGhhdFt0aGlzLnR5cGVdLmNyb3NzZmlsdGVyIHx8IHRoaXMudGhhdC5jcm9zc2ZpbHRlcihbXSk7XG4gICAgICAgIHRoaXMudGhhdFt0aGlzLnR5cGVdLmZpbHRlciA9IHRoaXMudGhhdFt0aGlzLnR5cGVdLmZpbHRlciB8fCB7fTtcbiAgICAgICAgdmFyIGRpbWVuc2lvbiwgaXRlbTtcbiAgICAgICAgaWYgKHR5cGVvZiBmaWx0ZXJzID09PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgZmlsdGVycyA9IFtmaWx0ZXJzXTtcbiAgICAgICAgfVxuICAgICAgICBmb3IgKGRpbWVuc2lvbiBpbiBmaWx0ZXJzKSB7XG4gICAgICAgICAgICBpZiAoZmlsdGVycy5oYXNPd25Qcm9wZXJ0eShkaW1lbnNpb24pKSB7XG4gICAgICAgICAgICAgICAgaXRlbSA9IGZpbHRlcnNbZGltZW5zaW9uXTtcbiAgICAgICAgICAgICAgICBpZiAodHlwZW9mIGl0ZW0gPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMudGhhdFt0aGlzLnR5cGVdLmZpbHRlcltpdGVtXSA9IHRoaXMudGhhdFt0aGlzLnR5cGVdLmNyb3NzZmlsdGVyLmRpbWVuc2lvbih1dGlscy5kZWZhdWx0RGltZW5zaW9uKGl0ZW0pKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMudGhhdFt0aGlzLnR5cGVdLmZpbHRlcltPYmplY3Qua2V5cyhpdGVtKVswXV0gPSB0aGlzLnRoYXRbdGhpcy50eXBlXS5jcm9zc2ZpbHRlci5kaW1lbnNpb24oaXRlbVtPYmplY3Qua2V5cyhpdGVtKVswXV0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH07XG4gICAgcmV0dXJuIEFkZEZpbHRlcjtcbn0pKCk7XG5tb2R1bGUuZXhwb3J0cyA9IEFkZEZpbHRlcjtcbiIsIi8vLyA8cmVmZXJlbmNlIHBhdGg9XCJ0eXBpbmdzL3RzZC5kLnRzXCIvPlxudmFyIG1hcHMgPSByZXF1aXJlKCcuL21hcHMnKTtcbnZhciBjb25maWcgPSByZXF1aXJlKCcuL2NvbmZpZycpO1xudmFyIEFkZE1hcCA9IChmdW5jdGlvbiAoKSB7XG4gICAgZnVuY3Rpb24gQWRkTWFwKHRoYXQpIHtcbiAgICAgICAgdGhpcy50aGF0ID0gdGhhdDtcbiAgICB9XG4gICAgQWRkTWFwLnByb3RvdHlwZS5nZXRFbGVtZW50ID0gZnVuY3Rpb24gKGFyZ3MpIHtcbiAgICAgICAgaWYgKGFyZ3MuZWwpIHtcbiAgICAgICAgICAgIHJldHVybiB3aW5kb3cuZG9jdW1lbnQucXVlcnlTZWxlY3RvcihhcmdzLmVsKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoYXJncy5pZCkge1xuICAgICAgICAgICAgcmV0dXJuIHdpbmRvdy5kb2N1bWVudC5nZXRFbGVtZW50QnlJZChhcmdzLmlkKTtcbiAgICAgICAgfVxuICAgIH07XG4gICAgQWRkTWFwLnByb3RvdHlwZS5jcmVhdGUgPSBmdW5jdGlvbiAoYXJncywgY2IpIHtcbiAgICAgICAgdmFyIF90aGlzID0gdGhpcztcbiAgICAgICAgY2IgPSBjYiB8fCBmdW5jdGlvbiAoKSB7XG4gICAgICAgIH07XG4gICAgICAgIHZhciBtYXBPcHRpb25zID0gbWFwcy5tYXBPcHRpb25zKGFyZ3MpO1xuICAgICAgICBhcmdzLmlkID0gYXJncy5pZCB8fCBhcmdzLmVsLnN1YnN0cmluZygxKTtcbiAgICAgICAgdGhpcy50aGF0LmlkID0gYXJncy5pZDtcbiAgICAgICAgdGhpcy50aGF0Lm9wdGlvbnMgPSBhcmdzO1xuICAgICAgICB0aGlzLnRoYXQuaW5zdGFuY2UgPSBuZXcgZ29vZ2xlLm1hcHMuTWFwKHRoaXMuZ2V0RWxlbWVudChhcmdzKSwgbWFwT3B0aW9ucyk7XG4gICAgICAgIHRoaXMudGhhdC5ldmVudHMgPSBbXTtcbiAgICAgICAgLy8gQWRkIEV2ZW50c1xuICAgICAgICBpZiAoYXJncy5vbikge1xuICAgICAgICAgICAgdmFyIGk7XG4gICAgICAgICAgICBmb3IgKGkgaW4gYXJncy5vbikge1xuICAgICAgICAgICAgICAgIGlmIChhcmdzLm9uLmhhc093blByb3BlcnR5KGkpKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChjb25maWcuY3VzdG9tRXZlbnRzLmluZGV4T2YoaSkgPiAtMSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy50aGF0LmV2ZW50cy5wdXNoKGkpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGdvb2dsZS5tYXBzLmV2ZW50LmFkZExpc3RlbmVyKHRoaXMudGhhdC5pbnN0YW5jZSwgaSwgYXJncy5vbltpXSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHRoaXMudGhhdC5pbmZvV2luZG93ID0gZmFsc2U7XG4gICAgICAgIHRoaXMudGhhdC50ZW1wbGF0ZXMgPSB7XG4gICAgICAgICAgICBpbmZvV2luZG93OiB7fSxcbiAgICAgICAgICAgIHBhbmVsOiB7fVxuICAgICAgICB9O1xuICAgICAgICB0aGlzLnRoYXQudWlkID0gYXJncy51aWQ7XG4gICAgICAgIG1hcFRvb2xzLm1hcHNbdGhpcy50aGF0LmlkXS5pbnN0YW5jZSA9IHRoaXMudGhhdC5pbnN0YW5jZTtcbiAgICAgICAgZ29vZ2xlLm1hcHMuZXZlbnQuYWRkTGlzdGVuZXJPbmNlKHRoaXMudGhhdC5pbnN0YW5jZSwgJ2lkbGUnLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBjYihmYWxzZSwgX3RoaXMudGhhdCk7XG4gICAgICAgIH0pO1xuICAgIH07XG4gICAgQWRkTWFwLnByb3RvdHlwZS52YWxpZE9wdGlvbnMgPSBmdW5jdGlvbiAob3B0aW9ucywgY2IpIHtcbiAgICAgICAgaWYgKCFvcHRpb25zIHx8IChvcHRpb25zICYmIHR5cGVvZiBvcHRpb25zICE9PSAnb2JqZWN0JykpIHtcbiAgICAgICAgICAgIGNiKG5ldyBFcnJvcignWW91IG11c3QgcGFzcyBhIHZhbGlkIGZpcnN0IHBhcmFtZXRlcjogb3B0aW9ucycpKTtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoIW9wdGlvbnMuaWQgJiYgIW9wdGlvbnMuZWwpIHtcbiAgICAgICAgICAgIGNiKG5ldyBFcnJvcignWW91IG11c3QgcGFzcyBhbiBcImlkXCIgb3IgYSBcImVsXCIgcHJvcGVydHkgdmFsdWVzJykpO1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG4gICAgICAgIGlmICghb3B0aW9ucy5sYXQgfHwgIW9wdGlvbnMubG5nKSB7XG4gICAgICAgICAgICBjYihuZXcgRXJyb3IoJ1lvdSBtdXN0IHBhc3MgdmFsaWQgXCJsYXRcIiAobGF0aXR1ZGUpIGFuZCBcImxuZ1wiIChsb25naXR1ZGUpIHZhbHVlcycpKTtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9O1xuICAgIEFkZE1hcC5wcm90b3R5cGUubG9hZCA9IGZ1bmN0aW9uIChvcHRpb25zLCBjYikge1xuICAgICAgICBpZiAodGhpcy52YWxpZE9wdGlvbnMob3B0aW9ucywgY2IpKSB7XG4gICAgICAgICAgICB2YXIgaWQgPSBvcHRpb25zLmlkIHx8IG9wdGlvbnMuZWwuc3Vic3RyaW5nKDEpO1xuICAgICAgICAgICAgbWFwVG9vbHMubWFwcyA9IG1hcFRvb2xzLm1hcHMgfHwge307XG4gICAgICAgICAgICBpZiAobWFwVG9vbHMubWFwc1tpZF0pIHtcbiAgICAgICAgICAgICAgICB2YXIgbXNnID0gJ1RoZXJlIGlzIGFscmVhZHkgYW5vdGhlciBNYXAgdXNpbmcgdGhlIHNhbWUgaWQ6ICcgKyBpZDtcbiAgICAgICAgICAgICAgICBjYihuZXcgRXJyb3IobXNnKSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdmFyIHRoYXQgPSB0aGlzO1xuICAgICAgICAgICAgbWFwVG9vbHMubWFwc1tpZF0gPSB7XG4gICAgICAgICAgICAgICAgY3JlYXRlOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoYXQuY3JlYXRlKHRoaXMuYXJndW1lbnRzLCBjYik7XG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBhcmd1bWVudHM6IG9wdGlvbnNcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICAvLyBTZXQgR2xvYmFsIFN0cnVjdHVyZVxuICAgICAgICAgICAgbWFwVG9vbHMubWFwc1tpZF0ubWFya2VycyA9IG1hcFRvb2xzLm1hcHNbaWRdLm1hcmtlcnMgfHwgeyBhbGw6IHt9LCB0YWdzOiB7fSwgZGF0YUNoYW5nZWQ6IGZhbHNlIH07XG4gICAgICAgICAgICBtYXBUb29scy5tYXBzW2lkXS5qc29uID0gbWFwVG9vbHMubWFwc1tpZF0uanNvbiB8fCB7IGFsbDoge30sIGRhdGFDaGFuZ2VkOiBmYWxzZSB9O1xuICAgICAgICAgICAgdGhpcy50aGF0Lm1hcmtlcnMgPSBtYXBUb29scy5tYXBzW2lkXS5tYXJrZXJzO1xuICAgICAgICAgICAgdGhpcy50aGF0Lmpzb24gPSBtYXBUb29scy5tYXBzW2lkXS5qc29uO1xuICAgICAgICAgICAgaWYgKG9wdGlvbnMuYXN5bmMgIT09IGZhbHNlIHx8IG9wdGlvbnMuc3luYyA9PT0gdHJ1ZSkge1xuICAgICAgICAgICAgICAgIG1hcHMubG9hZChpZCwgb3B0aW9ucyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICBtYXBUb29scy5tYXBzW2lkXS5jcmVhdGUoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH07XG4gICAgcmV0dXJuIEFkZE1hcDtcbn0pKCk7XG5tb2R1bGUuZXhwb3J0cyA9IEFkZE1hcDtcbiIsIi8vLyA8cmVmZXJlbmNlIHBhdGg9XCJ0eXBpbmdzL3RzZC5kLnRzXCIvPlxudmFyIHV0aWxzID0gcmVxdWlyZSgnLi91dGlscycpO1xudmFyIGFkZEZpbHRlciA9IHJlcXVpcmUoJy4vYWRkRmlsdGVyJyk7XG52YXIgaW5mb1dpbmRvdyA9IHJlcXVpcmUoJy4vaW5mb1dpbmRvdycpO1xudmFyIEFkZE1hcmtlciA9IChmdW5jdGlvbiAoKSB7XG4gICAgZnVuY3Rpb24gQWRkTWFya2VyKHRoYXQpIHtcbiAgICAgICAgdGhpcy50aGF0ID0gdGhhdDtcbiAgICAgICAgdGhpcy5pbmZvV2luZG93ID0ge307XG4gICAgICAgIHZhciBhZGRGaWx0ZXJJbnN0YW5jZSA9IG5ldyBhZGRGaWx0ZXIodGhhdCwgJ21hcmtlcnMnKTtcbiAgICAgICAgdGhpcy5hZGRGaWx0ZXIgPSBmdW5jdGlvbiAoZmlsdGVycykge1xuICAgICAgICAgICAgcmV0dXJuIGFkZEZpbHRlckluc3RhbmNlLmFkZEZpbHRlcihmaWx0ZXJzKTtcbiAgICAgICAgfTtcbiAgICAgICAgdmFyIGluZm9XaW5kb3dJbnN0YW5jZSA9IG5ldyBpbmZvV2luZG93KHRoYXQpO1xuICAgICAgICB0aGlzLmluZm9XaW5kb3cuYWRkRXZlbnRzID0gZnVuY3Rpb24gKG1hcmtlciwgb3B0aW9ucywgbWFwKSB7XG4gICAgICAgICAgICBpbmZvV2luZG93SW5zdGFuY2UuYWRkRXZlbnRzKG1hcmtlciwgb3B0aW9ucywgbWFwKTtcbiAgICAgICAgfTtcbiAgICB9XG4gICAgQWRkTWFya2VyLnByb3RvdHlwZS5hZGRFeHRyYU9wdGlvbnMgPSBmdW5jdGlvbiAobWFya2VyLCBvcHRpb25zKSB7XG4gICAgICAgIHZhciBpO1xuICAgICAgICBmb3IgKGkgaW4gb3B0aW9ucykge1xuICAgICAgICAgICAgaWYgKG9wdGlvbnMuaGFzT3duUHJvcGVydHkoaSkpIHtcbiAgICAgICAgICAgICAgICBpZiAoIW9wdGlvbnMuZmlsdGVycykge1xuICAgICAgICAgICAgICAgICAgICBtYXJrZXJbaV0gPSBvcHRpb25zW2ldO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH07XG4gICAgQWRkTWFya2VyLnByb3RvdHlwZS5hZGRPcHRpb25zID0gZnVuY3Rpb24gKG1hcmtlciwgaW5zdGFuY2UpIHtcbiAgICAgICAgaWYgKG1hcmtlci5tb3ZlKSB7XG4gICAgICAgICAgICBpbnN0YW5jZS5zZXRBbmltYXRpb24oZ29vZ2xlLm1hcHMuQW5pbWF0aW9uW21hcmtlci5tb3ZlLnRvVXBwZXJDYXNlKCldKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAobWFya2VyLmluZm9XaW5kb3cpIHtcbiAgICAgICAgICAgIHRoaXMuaW5mb1dpbmRvdy5hZGRFdmVudHMoaW5zdGFuY2UsIG1hcmtlci5pbmZvV2luZG93LCB0aGlzLnRoYXQuaW5zdGFuY2UpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChtYXJrZXIub24pIHtcbiAgICAgICAgICAgIHRoaXMuYWRkRXZlbnRzKG1hcmtlciwgaW5zdGFuY2UpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChtYXJrZXIuY2FsbGJhY2spIHtcbiAgICAgICAgICAgIG1hcmtlci5jYWxsYmFjayhpbnN0YW5jZSk7XG4gICAgICAgIH1cbiAgICB9O1xuICAgIEFkZE1hcmtlci5wcm90b3R5cGUuX2FkZE1hcmtlciA9IGZ1bmN0aW9uIChtYXJrZXIsIG9wdGlvbnMpIHtcbiAgICAgICAgbWFya2VyLm1hcCA9IHRoaXMudGhhdC5pbnN0YW5jZTtcbiAgICAgICAgbWFya2VyLnBvc2l0aW9uID0gbmV3IGdvb2dsZS5tYXBzLkxhdExuZyhtYXJrZXIubGF0LCBtYXJrZXIubG5nKTtcbiAgICAgICAgLy8gQWRkcyBvcHRpb25zIHNldCB2aWEgMm5kIHBhcmFtZXRlci4gT3ZlcndyaXRlcyBhbnkgTWFya2VyIG9wdGlvbnMgYWxyZWFkeSBzZXQuXG4gICAgICAgIGlmIChvcHRpb25zKSB7XG4gICAgICAgICAgICB0aGlzLmFkZEV4dHJhT3B0aW9ucyhtYXJrZXIsIG9wdGlvbnMpO1xuICAgICAgICB9XG4gICAgICAgIG1hcmtlci5kYXRhID0gbWFya2VyLmRhdGEgfHwge307XG4gICAgICAgIG1hcmtlci5kYXRhLl9zZWxmID0gbWFya2VyOyAvLyBUaGlzIGhlbHBzIG1lIHRvIGRvIGxhdGVyIHJlc2V0TWFya2VyKClcbiAgICAgICAgdGhpcy5zZXRVaWQobWFya2VyKTtcbiAgICAgICAgLy8gQmVjYXVzZSB3ZSBhcmUgbm90IGFsbG93aW5nIGR1cGxpY2F0ZXNcbiAgICAgICAgaWYgKHRoaXMudGhhdC5tYXJrZXJzLmFsbFttYXJrZXIudWlkXSkge1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG4gICAgICAgIGlmIChvcHRpb25zICYmIG9wdGlvbnMuZmlsdGVycykge1xuICAgICAgICAgICAgLy8gT25seSBhZGQgZmlsdGVycyBpZiBub3QgZGVmaW5lZC5cbiAgICAgICAgICAgIGlmICghbWFwVG9vbHMubWFwc1t0aGlzLnRoYXQuaWRdLm1hcmtlcnMuZmlsdGVyKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5hZGRGaWx0ZXIob3B0aW9ucy5maWx0ZXJzKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICB2YXIgaW5zdGFuY2UgPSBuZXcgZ29vZ2xlLm1hcHMuTWFya2VyKG1hcmtlcik7XG4gICAgICAgIHRoaXMudGhhdC5tYXJrZXJzLmNyb3NzZmlsdGVyID0gdGhpcy50aGF0Lm1hcmtlcnMuY3Jvc3NmaWx0ZXIgfHwgdGhpcy50aGF0LmNyb3NzZmlsdGVyKFtdKTtcbiAgICAgICAgdGhpcy50aGF0Lm1hcmtlcnMuZmlsdGVyID0gdGhpcy50aGF0Lm1hcmtlcnMuZmlsdGVyIHx8IHt9O1xuICAgICAgICB0aGlzLnRoYXQubWFya2Vycy5jcm9zc2ZpbHRlci5hZGQoW2luc3RhbmNlXSk7XG4gICAgICAgIHRoaXMuYWRkT3B0aW9ucyhtYXJrZXIsIGluc3RhbmNlKTtcbiAgICAgICAgLy8gQWRkcyBNYXJrZXIgUmVmZXJlbmNlIG9mIGVhY2ggTWFya2VyIHRvIFwibWFya2Vycy5hbGxcIlxuICAgICAgICB0aGlzLnRoYXQubWFya2Vycy5hbGwgPSBtYXBUb29scy5tYXBzW3RoaXMudGhhdC5pZF0ubWFya2Vycy5hbGwgfHwge307XG4gICAgICAgIHRoaXMudGhhdC5tYXJrZXJzLmFsbFttYXJrZXIudWlkXSA9IGluc3RhbmNlO1xuICAgICAgICBpZiAobWFya2VyLnRhZ3MpIHtcbiAgICAgICAgICAgIHRoaXMuYWRkTWFya2VyQnlUYWcobWFya2VyLCBpbnN0YW5jZSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGluc3RhbmNlO1xuICAgIH07XG4gICAgQWRkTWFya2VyLnByb3RvdHlwZS5zZXRVaWQgPSBmdW5jdGlvbiAobWFya2VyKSB7XG4gICAgICAgIGlmICh0aGlzLnRoYXQudWlkICYmIG1hcmtlclt0aGlzLnRoYXQudWlkXSkge1xuICAgICAgICAgICAgbWFya2VyLmRhdGEudWlkID0gbWFya2VyW3RoaXMudGhhdC51aWRdO1xuICAgICAgICAgICAgbWFya2VyLnVpZCA9IG1hcmtlci5kYXRhLnVpZDtcbiAgICAgICAgfVxuICAgICAgICBpZiAobWFya2VyLmRhdGEudWlkICYmICFtYXJrZXIudWlkKSB7XG4gICAgICAgICAgICBtYXJrZXIudWlkID0gbWFya2VyLmRhdGEudWlkO1xuICAgICAgICB9XG4gICAgICAgIGlmICghbWFya2VyLnVpZCkge1xuICAgICAgICAgICAgbWFya2VyLmRhdGEudWlkID0gdXRpbHMuY3JlYXRlVWlkKCk7XG4gICAgICAgICAgICBtYXJrZXIudWlkID0gbWFya2VyLmRhdGEudWlkO1xuICAgICAgICB9XG4gICAgfTtcbiAgICBBZGRNYXJrZXIucHJvdG90eXBlLmFkZE1hcmtlckJ5VGFnID0gZnVuY3Rpb24gKG1hcmtlciwgaW5zdGFuY2UpIHtcbiAgICAgICAgaWYgKHV0aWxzLmlzQXJyYXkobWFya2VyLnRhZ3MpKSB7XG4gICAgICAgICAgICB2YXIgaSwgdGFnO1xuICAgICAgICAgICAgZm9yIChpIGluIG1hcmtlci50YWdzKSB7XG4gICAgICAgICAgICAgICAgaWYgKG1hcmtlci50YWdzLmhhc093blByb3BlcnR5KGkpKSB7XG4gICAgICAgICAgICAgICAgICAgIHRhZyA9IG1hcmtlci50YWdzW2ldO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnRoYXQubWFya2Vycy50YWdzW3RhZ10gPSB0aGlzLnRoYXQubWFya2Vycy50YWdzW3RhZ10gfHwge307XG4gICAgICAgICAgICAgICAgICAgIHRoaXMudGhhdC5tYXJrZXJzLnRhZ3NbdGFnXVtpbnN0YW5jZS5kYXRhLnVpZF0gPSBpbnN0YW5jZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICB0aGlzLnRoYXQubWFya2Vycy50YWdzW21hcmtlci50YWdzXSA9IHRoaXMudGhhdC5tYXJrZXJzLnRhZ3NbbWFya2VyLnRhZ3NdIHx8IHt9O1xuICAgICAgICAgICAgdGhpcy50aGF0Lm1hcmtlcnMudGFnc1ttYXJrZXIudGFnc11baW5zdGFuY2UuZGF0YS51aWRdID0gaW5zdGFuY2U7XG4gICAgICAgIH1cbiAgICB9O1xuICAgIEFkZE1hcmtlci5wcm90b3R5cGUuYWRkRXZlbnRzID0gZnVuY3Rpb24gKG1hcmtlciwgaW5zdGFuY2UpIHtcbiAgICAgICAgdmFyIGk7XG4gICAgICAgIGZvciAoaSBpbiBtYXJrZXIub24pIHtcbiAgICAgICAgICAgIGlmIChtYXJrZXIub24uaGFzT3duUHJvcGVydHkoaSkpIHtcbiAgICAgICAgICAgICAgICBnb29nbGUubWFwcy5ldmVudC5hZGRMaXN0ZW5lcihpbnN0YW5jZSwgaSwgbWFya2VyLm9uW2ldKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH07XG4gICAgLyoqXG4gICAgICogQWRkcyBNYXJrZXJzIHRvIHRoZSBNYXBcbiAgICAgKiBAcGFyYW0gYXJncyBBcnJheSBvciBNYXJrZXJzXG4gICAgICogQHBhcmFtIG9wdGlvbnMgdGhpbmdzIGxpa2UgZ3JvdXBzIGV0Y1xuICAgICAqIEByZXR1cm5zIHtBcnJheX0gYWxsIHRoZSBpbnN0YW5jZXMgb2YgdGhlIG1hcmtlcnMuXG4gICAgICovXG4gICAgQWRkTWFya2VyLnByb3RvdHlwZS5hZGRNYXJrZXIgPSBmdW5jdGlvbiAoYXJncywgb3B0aW9ucykge1xuICAgICAgICBpZiAodXRpbHMuaXNBcnJheShhcmdzKSkge1xuICAgICAgICAgICAgaWYgKGFyZ3MubGVuZ3RoID49IDEpIHtcbiAgICAgICAgICAgICAgICB2YXIgbWFya2VyLCBtYXJrZXJzID0gW107XG4gICAgICAgICAgICAgICAgZm9yICh2YXIgaSBpbiBhcmdzKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChhcmdzLmhhc093blByb3BlcnR5KGkpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBtYXJrZXIgPSB0aGlzLl9hZGRNYXJrZXIoYXJnc1tpXSwgb3B0aW9ucyk7XG4gICAgICAgICAgICAgICAgICAgICAgICBtYXJrZXJzLnB1c2gobWFya2VyKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB0aGlzLnRoYXQubWFya2Vycy5kYXRhQ2hhbmdlZCA9IHRydWU7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG1hcmtlcnM7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gW107XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy50aGF0Lm1hcmtlcnMuZGF0YUNoYW5nZWQgPSB0cnVlO1xuICAgICAgICByZXR1cm4gdGhpcy5fYWRkTWFya2VyKGFyZ3MsIG9wdGlvbnMpO1xuICAgIH07XG4gICAgcmV0dXJuIEFkZE1hcmtlcjtcbn0pKCk7XG5tb2R1bGUuZXhwb3J0cyA9IEFkZE1hcmtlcjtcbiIsIi8vLyA8cmVmZXJlbmNlIHBhdGg9XCJ0ZW1wbGF0ZS50c1wiLz5cbi8vLyA8cmVmZXJlbmNlIHBhdGg9XCJjb25maWcudHNcIi8+XG4vLy8gPHJlZmVyZW5jZSBwYXRoPVwidHlwaW5ncy90c2QuZC50c1wiLz5cbnZhciBjb25maWcgPSByZXF1aXJlKCcuL2NvbmZpZycpO1xudmFyIHRlbXBsYXRlID0gcmVxdWlyZSgnLi90ZW1wbGF0ZScpO1xudmFyIEFkZFBhbmVsID0gKGZ1bmN0aW9uICgpIHtcbiAgICBmdW5jdGlvbiBBZGRQYW5lbCh0aGF0KSB7XG4gICAgICAgIHRoaXMudGhhdCA9IHRoYXQ7XG4gICAgICAgIHZhciB0ZW1wbGF0ZUluc3RhbmNlID0gbmV3IHRlbXBsYXRlKHRoYXQpO1xuICAgICAgICB0aGlzLnRlbXBsYXRlID0gZnVuY3Rpb24gKHR5cGUsIHVybCwgY2IpIHtcbiAgICAgICAgICAgIHJldHVybiB0ZW1wbGF0ZUluc3RhbmNlLmxvYWQodHlwZSwgdXJsLCBjYik7XG4gICAgICAgIH07XG4gICAgfVxuICAgIEFkZFBhbmVsLnByb3RvdHlwZS5nZXRQb3NpdGlvbktleSA9IGZ1bmN0aW9uIChwb3MpIHtcbiAgICAgICAgcmV0dXJuIHBvcy50b1VwcGVyQ2FzZSgpLm1hdGNoKC9cXFMrL2cpLmpvaW4oJ18nKTtcbiAgICB9O1xuICAgIEFkZFBhbmVsLnByb3RvdHlwZS5oeTJjbW1sID0gZnVuY3Rpb24gKGspIHtcbiAgICAgICAgcmV0dXJuIGsucmVwbGFjZSgvLSguKS9nLCBmdW5jdGlvbiAobSwgZykge1xuICAgICAgICAgICAgcmV0dXJuIGcudG9VcHBlckNhc2UoKTtcbiAgICAgICAgfSk7XG4gICAgfTtcbiAgICBBZGRQYW5lbC5wcm90b3R5cGUuSFRNTFBhcnNlciA9IGZ1bmN0aW9uIChhSFRNTFN0cmluZykge1xuICAgICAgICB2YXIgY29udGFpbmVyID0gd2luZG93LmRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgICAgICBjb250YWluZXIuaW5uZXJIVE1MID0gYUhUTUxTdHJpbmc7XG4gICAgICAgIHJldHVybiBjb250YWluZXI7XG4gICAgfTtcbiAgICBBZGRQYW5lbC5wcm90b3R5cGUub25TdWNjZXNzID0gZnVuY3Rpb24gKG9wdGlvbnMsIHBvc2l0aW9uLCBwYW5lbCwgY2IpIHtcbiAgICAgICAgdmFyIGUsIHJ1bGU7XG4gICAgICAgIC8vIHBvc2l0aW9uaW5nIG9wdGlvbnNcbiAgICAgICAgaWYgKG9wdGlvbnMucG9zaXRpb24pIHtcbiAgICAgICAgICAgIC8vIGNvbnZlcnQgdG8gZ29vZ2xlIENvbnRyb2xQb3NpdGlvbiBtYXAgcG9zaXRpb24ga2V5c1xuICAgICAgICAgICAgb3B0aW9ucy5wb3NpdGlvbiA9IHRoaXMuZ2V0UG9zaXRpb25LZXkob3B0aW9ucy5wb3NpdGlvbik7XG4gICAgICAgICAgICBwb3NpdGlvbiA9IGdvb2dsZS5tYXBzLkNvbnRyb2xQb3NpdGlvbltvcHRpb25zLnBvc2l0aW9uXTtcbiAgICAgICAgfVxuICAgICAgICAvLyBzdHlsZSBvcHRpb25zXG4gICAgICAgIGlmICh0eXBlb2Ygb3B0aW9ucy5zdHlsZSA9PT0gJ29iamVjdCcpIHtcbiAgICAgICAgICAgIGZvciAocnVsZSBpbiBvcHRpb25zLnN0eWxlKSB7XG4gICAgICAgICAgICAgICAgaWYgKG9wdGlvbnMuc3R5bGUuaGFzT3duUHJvcGVydHkocnVsZSkpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHJ1bGVLZXkgPSB0aGlzLmh5MmNtbWwocnVsZSk7XG4gICAgICAgICAgICAgICAgICAgIHBhbmVsLnN0eWxlW3J1bGVLZXldID0gb3B0aW9ucy5zdHlsZVtydWxlXTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgLy8gZXZlbnQgaGFuZGxlclxuICAgICAgICBpZiAob3B0aW9ucy5ldmVudHMpIHtcbiAgICAgICAgICAgIGZvciAoZSBpbiBvcHRpb25zLmV2ZW50cykge1xuICAgICAgICAgICAgICAgIGlmIChvcHRpb25zLmV2ZW50cy5oYXNPd25Qcm9wZXJ0eShlKSkge1xuICAgICAgICAgICAgICAgICAgICB2YXIga2V5cyA9IGUubWF0Y2goL1xcUysvZyk7XG4gICAgICAgICAgICAgICAgICAgIHZhciBldmVudCA9IGtleXMuc3BsaWNlKC0xKTsgLy9ldmVudCB0eXBlXG4gICAgICAgICAgICAgICAgICAgIHZhciBzZWxlY3RvciA9IGtleXMuam9pbignICcpOyAvLyBzZWxlY3RvciBzdHJpbmdcbiAgICAgICAgICAgICAgICAgICAgdmFyIGVsZW1lbnRzID0gcGFuZWwucXVlcnlTZWxlY3RvckFsbChzZWxlY3Rvcik7XG4gICAgICAgICAgICAgICAgICAgIFtdLmZvckVhY2guY2FsbChlbGVtZW50cywgZnVuY3Rpb24gKGVsbSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgZ29vZ2xlLm1hcHMuZXZlbnQuYWRkRG9tTGlzdGVuZXIoZWxtLCBldmVudCwgb3B0aW9ucy5ldmVudHNbZV0pO1xuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy50aGF0Lmluc3RhbmNlLmNvbnRyb2xzW3Bvc2l0aW9uXS5wdXNoKHBhbmVsKTtcbiAgICAgICAgdGhpcy50aGF0LnBhbmVscyA9IHRoaXMudGhhdC5wYW5lbHMgfHwge307XG4gICAgICAgIHRoaXMudGhhdC5wYW5lbHNbcG9zaXRpb25dID0gcGFuZWw7XG4gICAgICAgIGNiKGZhbHNlLCBwYW5lbCk7XG4gICAgfTtcbiAgICBBZGRQYW5lbC5wcm90b3R5cGUuYWRkUGFuZWwgPSBmdW5jdGlvbiAob3B0aW9ucywgY2IpIHtcbiAgICAgICAgdmFyIF90aGlzID0gdGhpcztcbiAgICAgICAgY2IgPSBjYiB8fCBmdW5jdGlvbiAoKSB7XG4gICAgICAgIH07XG4gICAgICAgIHZhciBwb3NpdGlvbiwgcGFuZWw7XG4gICAgICAgIC8vIGRlZmF1bHQgcG9zaXRpb25cbiAgICAgICAgb3B0aW9ucy5wb3NpdGlvbiA9IG9wdGlvbnMucG9zaXRpb24gfHwgY29uZmlnLnBhbmVsUG9zaXRpb247XG4gICAgICAgIGlmIChvcHRpb25zLnRlbXBsYXRlVVJMKSB7XG4gICAgICAgICAgICB0aGlzLnRlbXBsYXRlKCdwYW5lbCcsIG9wdGlvbnMudGVtcGxhdGVVUkwsIGZ1bmN0aW9uIChlcnIsIHJlc3BvbnNlKSB7XG4gICAgICAgICAgICAgICAgaWYgKCFlcnIpIHtcbiAgICAgICAgICAgICAgICAgICAgcGFuZWwgPSBfdGhpcy5IVE1MUGFyc2VyKHJlc3BvbnNlKTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIF90aGlzLm9uU3VjY2VzcyhvcHRpb25zLCBwb3NpdGlvbiwgcGFuZWwsIGNiKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGNiKGVycik7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIGlmICh0eXBlb2Ygb3B0aW9ucy50ZW1wbGF0ZSA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgICAgICBwYW5lbCA9IHRoaXMuSFRNTFBhcnNlcihvcHRpb25zLnRlbXBsYXRlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIHBhbmVsID0gb3B0aW9ucy50ZW1wbGF0ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRoaXMub25TdWNjZXNzKG9wdGlvbnMsIHBvc2l0aW9uLCBwYW5lbCwgY2IpO1xuICAgICAgICB9XG4gICAgfTtcbiAgICByZXR1cm4gQWRkUGFuZWw7XG59KSgpO1xubW9kdWxlLmV4cG9ydHMgPSBBZGRQYW5lbDtcbiIsIi8vLyA8cmVmZXJlbmNlIHBhdGg9XCJ0eXBpbmdzL3RzZC5kLnRzXCIvPlxudmFyIENlbnRlciA9IChmdW5jdGlvbiAoKSB7XG4gICAgZnVuY3Rpb24gQ2VudGVyKCkge1xuICAgIH1cbiAgICBDZW50ZXIucHJvdG90eXBlLnBvcyA9IGZ1bmN0aW9uIChsYXQsIGxuZykge1xuICAgICAgICB2YXIgcG9zaXRpb247XG4gICAgICAgIGlmIChsYXQgJiYgbG5nKSB7XG4gICAgICAgICAgICBwb3NpdGlvbiA9IG5ldyBnb29nbGUubWFwcy5MYXRMbmcobGF0LCBsbmcpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgcG9zaXRpb24gPSBuZXcgZ29vZ2xlLm1hcHMuTGF0TG5nKHRoaXMub3B0aW9ucy5sYXQsIHRoaXMub3B0aW9ucy5sbmcpO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuaW5zdGFuY2Uuc2V0Q2VudGVyKHBvc2l0aW9uKTtcbiAgICB9O1xuICAgIHJldHVybiBDZW50ZXI7XG59KSgpO1xubW9kdWxlLmV4cG9ydHMgPSBDZW50ZXI7XG4iLCIvLy8gPHJlZmVyZW5jZSBwYXRoPVwidHlwaW5ncy90c2QuZC50c1wiLz5cbnZhciBDb25maWcgPSAoZnVuY3Rpb24gKCkge1xuICAgIGZ1bmN0aW9uIENvbmZpZygpIHtcbiAgICB9XG4gICAgQ29uZmlnLnZlcnNpb24gPSAnMy4xOCc7IC8vIFJlbGVhc2VkOiBNYXkgMTUsIDIwMVxuICAgIENvbmZpZy51cmwgPSAnLy9tYXBzLmdvb2dsZWFwaXMuY29tL21hcHMvYXBpL2pzJztcbiAgICBDb25maWcuem9vbSA9IDg7XG4gICAgQ29uZmlnLmN1c3RvbU1hcE9wdGlvbnMgPSBbJ2lkJywgJ2xhdCcsICdsbmcnLCAndHlwZScsICd1aWQnXTtcbiAgICBDb25maWcuY3VzdG9tTWFya2VyT3B0aW9ucyA9IFsnbGF0JywgJ2xuZycsICdtb3ZlJywgJ2luZm9XaW5kb3cnLCAnb24nLCAnY2FsbGJhY2snLCAndGFncyddO1xuICAgIENvbmZpZy5wYW5lbFBvc2l0aW9uID0gJ1RPUF9MRUZUJztcbiAgICBDb25maWcuY3VzdG9tSW5mb1dpbmRvd09wdGlvbnMgPSBbJ29wZW4nLCAnY2xvc2UnXTtcbiAgICBDb25maWcuY3VzdG9tRXZlbnRzID0gWydtYXJrZXJfdmlzaWJpbGl0eV9jaGFuZ2VkJ107XG4gICAgcmV0dXJuIENvbmZpZztcbn0pKCk7XG5tb2R1bGUuZXhwb3J0cyA9IENvbmZpZztcbiIsIi8vLyA8cmVmZXJlbmNlIHBhdGg9XCJ0eXBpbmdzL3RzZC5kLnRzXCIvPlxudmFyIGFkZEZpbHRlciA9IHJlcXVpcmUoJy4vYWRkRmlsdGVyJyk7XG52YXIgRmlsdGVyID0gKGZ1bmN0aW9uICgpIHtcbiAgICBmdW5jdGlvbiBGaWx0ZXIodGhhdCwgdHlwZSkge1xuICAgICAgICB0aGlzLnRoYXQgPSB0aGF0O1xuICAgICAgICB0aGlzLnR5cGUgPSB0eXBlO1xuICAgICAgICB0aGlzLm9yZGVyTG9va3VwID0ge1xuICAgICAgICAgICAgQVNDOiAndG9wJyxcbiAgICAgICAgICAgIERFU0M6ICdib3R0b20nXG4gICAgICAgIH07XG4gICAgICAgIHRoaXMudXRpbHMgPSByZXF1aXJlKCcuL3V0aWxzJyk7XG4gICAgICAgIHZhciBhZGRGaWx0ZXJJbnN0YW5jZSA9IG5ldyBhZGRGaWx0ZXIodGhhdCwgdHlwZSk7XG4gICAgICAgIHRoaXMuYWRkRmlsdGVyID0gZnVuY3Rpb24gKGZpbHRlcnMpIHtcbiAgICAgICAgICAgIHJldHVybiBhZGRGaWx0ZXJJbnN0YW5jZS5hZGRGaWx0ZXIoZmlsdGVycyk7XG4gICAgICAgIH07XG4gICAgfVxuICAgIC8vIGNmIGhhcyBpdCdzIG93biBzdGF0ZSwgZm9yIGVhY2ggZGltZW5zaW9uXG4gICAgLy8gYmVmb3JlIGVhY2ggbmV3IGZpbHRlcmluZyB3ZSBuZWVkIHRvIGNsZWFyIHRoaXMgc3RhdGVcbiAgICBGaWx0ZXIucHJvdG90eXBlLmNsZWFyQWxsID0gZnVuY3Rpb24gKGRpbWVuc2lvblNldCkge1xuICAgICAgICB2YXIgaSwgZGltZW5zaW9uO1xuICAgICAgICBmb3IgKGkgaW4gZGltZW5zaW9uU2V0KSB7XG4gICAgICAgICAgICBpZiAoZGltZW5zaW9uU2V0Lmhhc093blByb3BlcnR5KGkpKSB7XG4gICAgICAgICAgICAgICAgZGltZW5zaW9uID0gZGltZW5zaW9uU2V0W2ldO1xuICAgICAgICAgICAgICAgIGlmICh0aGlzLnRoYXRbdGhpcy50eXBlXS5kYXRhQ2hhbmdlZCA9PT0gdHJ1ZSkge1xuICAgICAgICAgICAgICAgICAgICBkaW1lbnNpb24uZGlzcG9zZSgpO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmFkZEZpbHRlcihpKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGRpbWVuc2lvbi5maWx0ZXJBbGwoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9O1xuICAgIEZpbHRlci5wcm90b3R5cGUuZmlsdGVyQnlUYWcgPSBmdW5jdGlvbiAocXVlcnkpIHtcbiAgICAgICAgLy8gaWYgdGhlIHNlYXJjaCBxdWVyeSBpcyBhbiBhcnJheSB3aXRoIG9ubHkgb25lIGl0ZW0gdGhlbiBqdXN0IHVzZSB0aGF0IHN0cmluZ1xuICAgICAgICBpZiAodGhpcy51dGlscy5pc0FycmF5KHF1ZXJ5KSAmJiBxdWVyeS5sZW5ndGggPT09IDEpIHtcbiAgICAgICAgICAgIHF1ZXJ5ID0gcXVlcnlbMF07XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHR5cGVvZiBxdWVyeSA9PT0gXCJzdHJpbmdcIikge1xuICAgICAgICAgICAgaWYgKHRoaXMudGhhdFt0aGlzLnR5cGVdLnRhZ3NbcXVlcnldKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMudXRpbHMudG9BcnJheSh0aGlzLnRoYXRbdGhpcy50eXBlXS50YWdzW3F1ZXJ5XSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gW107XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICB2YXIgbWFya2VycyA9IHRoaXMuZmV0Y2hCeVRhZyhxdWVyeSk7XG4gICAgICAgICAgICBpZiAodHlwZW9mIG1hcmtlcnMgPT09IFwib2JqZWN0XCIpIHtcbiAgICAgICAgICAgICAgICBtYXJrZXJzID0gdGhpcy51dGlscy50b0FycmF5KG1hcmtlcnMpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIG1hcmtlcnM7XG4gICAgICAgIH1cbiAgICB9O1xuICAgIEZpbHRlci5wcm90b3R5cGUuZmV0Y2hCeVRhZyA9IGZ1bmN0aW9uIChxdWVyeSkge1xuICAgICAgICB2YXIgbWFya2VyczsgLy8gc3RvcmUgZmlyc3Qgc2V0IG9mIG1hcmtlcnMgdG8gY29tcGFyZVxuICAgICAgICB2YXIgaTtcbiAgICAgICAgZm9yIChpID0gMDsgaSA8IHF1ZXJ5Lmxlbmd0aCAtIDE7IGkrKykge1xuICAgICAgICAgICAgdmFyIHRhZyA9IHF1ZXJ5W2ldO1xuICAgICAgICAgICAgdmFyIG5leHRUYWcgPSBxdWVyeVtpICsgMV07XG4gICAgICAgICAgICAvLyBudWxsIGNoZWNrIGtpY2tzIGluIHdoZW4gd2UgZ2V0IHRvIHRoZSBlbmQgb2YgdGhlIGZvciBsb29wXG4gICAgICAgICAgICBtYXJrZXJzID0gdGhpcy51dGlscy5nZXRDb21tb25PYmplY3QodGhpcy50aGF0W3RoaXMudHlwZV0udGFnc1t0YWddLCB0aGlzLnRoYXRbdGhpcy50eXBlXS50YWdzW25leHRUYWddKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gbWFya2VycztcbiAgICB9O1xuICAgIEZpbHRlci5wcm90b3R5cGUuZmlsdGVyID0gZnVuY3Rpb24gKGFyZ3MsIG9wdGlvbnMpIHtcbiAgICAgICAgLy8gUmV0dXJuIEFsbCBpdGVtcyBpZiBubyBhcmd1bWVudHMgYXJlIHN1cHBsaWVkXG4gICAgICAgIGlmICh0eXBlb2YgYXJncyA9PT0gJ3VuZGVmaW5lZCcgJiYgdHlwZW9mIG9wdGlvbnMgPT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy51dGlscy50b0FycmF5KHRoaXMudGhhdFt0aGlzLnR5cGVdLmFsbCk7XG4gICAgICAgIH1cbiAgICAgICAgdmFyIGRpbWVuc2lvbiwgb3JkZXIsIGxpbWl0LCBxdWVyeTtcbiAgICAgICAgaWYgKHR5cGVvZiBhcmdzID09PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgZGltZW5zaW9uID0gYXJncztcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIGRpbWVuc2lvbiA9IE9iamVjdC5rZXlzKGFyZ3MpWzBdO1xuICAgICAgICAgICAgcXVlcnkgPSBhcmdzW2RpbWVuc2lvbl07XG4gICAgICAgICAgICBpZiAoZGltZW5zaW9uID09PSAndGFncycpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5maWx0ZXJCeVRhZyhxdWVyeSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5jbGVhckFsbCh0aGlzLnRoYXRbdGhpcy50eXBlXS5maWx0ZXIpO1xuICAgICAgICAvLyBBZGQgQ3Jvc3NmaWx0ZXIgRGltZW5zaW9uIGlmIGl0IGRvZXMgbm90IGV4aXN0LlxuICAgICAgICBpZiAoIXRoaXMudGhhdFt0aGlzLnR5cGVdLmZpbHRlcltkaW1lbnNpb25dKSB7XG4gICAgICAgICAgICB0aGlzLmFkZEZpbHRlcihkaW1lbnNpb24pO1xuICAgICAgICB9XG4gICAgICAgIG9yZGVyID0gKG9wdGlvbnMgJiYgb3B0aW9ucy5vcmRlciAmJiB0aGlzLm9yZGVyTG9va3VwW29wdGlvbnMub3JkZXJdKSA/IHRoaXMub3JkZXJMb29rdXBbb3B0aW9ucy5vcmRlcl0gOiB0aGlzLm9yZGVyTG9va3VwW09iamVjdC5rZXlzKHRoaXMub3JkZXJMb29rdXApWzBdXTtcbiAgICAgICAgbGltaXQgPSAob3B0aW9ucyAmJiBvcHRpb25zLmxpbWl0KSA/IG9wdGlvbnMubGltaXQgOiBJbmZpbml0eTtcbiAgICAgICAgaWYgKHR5cGVvZiBxdWVyeSA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgIHF1ZXJ5ID0gbnVsbDtcbiAgICAgICAgfVxuICAgICAgICB2YXIgcmVzdWx0ID0gdGhpcy50aGF0W3RoaXMudHlwZV0uZmlsdGVyW2RpbWVuc2lvbl0uZmlsdGVyKHF1ZXJ5KVtvcmRlcl0obGltaXQpO1xuICAgICAgICB0aGlzLnRoYXRbdGhpcy50eXBlXS5kYXRhQ2hhbmdlZCA9IGZhbHNlO1xuICAgICAgICBpZiAobGltaXQgPT09IDEpIHtcbiAgICAgICAgICAgIHJldHVybiByZXN1bHRbMF07XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9O1xuICAgIHJldHVybiBGaWx0ZXI7XG59KSgpO1xubW9kdWxlLmV4cG9ydHMgPSBGaWx0ZXI7XG4iLCIvLy8gPHJlZmVyZW5jZSBwYXRoPVwidHlwaW5ncy90c2QuZC50c1wiLz5cbnZhciBGaW5kTWFya2VyQnlJZCA9IChmdW5jdGlvbiAoKSB7XG4gICAgZnVuY3Rpb24gRmluZE1hcmtlckJ5SWQodGhhdCkge1xuICAgICAgICB0aGlzLnRoYXQgPSB0aGF0O1xuICAgIH1cbiAgICBGaW5kTWFya2VyQnlJZC5wcm90b3R5cGUuZmluZCA9IGZ1bmN0aW9uIChtYXJrZXIpIHtcbiAgICAgICAgaWYgKG1hcmtlci5kYXRhICYmIG1hcmtlci5kYXRhLnVpZCkge1xuICAgICAgICAgICAgcmV0dXJuIG1hcmtlcjtcbiAgICAgICAgfVxuICAgICAgICBpZiAobWFya2VyLnVpZCAmJiBtYXBUb29scy5tYXBzW3RoaXMudGhhdC5pZF0ubWFya2Vycy5hbGxbbWFya2VyLnVpZF0pIHtcbiAgICAgICAgICAgIHJldHVybiBtYXBUb29scy5tYXBzW3RoaXMudGhhdC5pZF0ubWFya2Vycy5hbGxbbWFya2VyLnVpZF07XG4gICAgICAgIH1cbiAgICB9O1xuICAgIHJldHVybiBGaW5kTWFya2VyQnlJZDtcbn0pKCk7XG5tb2R1bGUuZXhwb3J0cyA9IEZpbmRNYXJrZXJCeUlkO1xuIiwiLy8vIDxyZWZlcmVuY2UgcGF0aD1cInR5cGluZ3MvdHNkLmQudHNcIi8+XG52YXIgSW5mb1dpbmRvdyA9IChmdW5jdGlvbiAoKSB7XG4gICAgZnVuY3Rpb24gSW5mb1dpbmRvdyh0aGF0KSB7XG4gICAgICAgIHRoaXMudGhhdCA9IHRoYXQ7XG4gICAgICAgIHRoaXMudXRpbHMgPSByZXF1aXJlKCcuL3V0aWxzJyk7XG4gICAgICAgIHRoaXMuY29uZmlnID0gcmVxdWlyZSgnLi9jb25maWcnKTtcbiAgICB9XG4gICAgSW5mb1dpbmRvdy5wcm90b3R5cGUuaW5mb1dpbmRvdyA9IGZ1bmN0aW9uIChtYXAsIG1hcmtlciwgYXJncykge1xuICAgICAgICB2YXIgY29udGVudCA9IGZhbHNlO1xuICAgICAgICBpZiAobWFya2VyLmluZm9XaW5kb3cuY29udGVudCkge1xuICAgICAgICAgICAgaWYgKG1hcmtlci5pbmZvV2luZG93LmNvbnRlbnQuaW5kZXhPZigneycpID4gLTEpIHtcbiAgICAgICAgICAgICAgICBjb250ZW50ID0gYXJncy5jb250ZW50LnJlcGxhY2UoL1xceyhcXHcrKVxcfS9nLCBmdW5jdGlvbiAobSwgdmFyaWFibGUpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG1hcmtlci5kYXRhW3ZhcmlhYmxlXSB8fCAnJztcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNvbnRlbnQgPSBjb250ZW50IHx8IG1hcmtlci5pbmZvV2luZG93LmNvbnRlbnQ7XG4gICAgICAgIH1cbiAgICAgICAgdmFyIG9wdGlvbnMgPSB0aGlzLnV0aWxzLmNsb25lKGFyZ3MpO1xuICAgICAgICBvcHRpb25zLmNvbnRlbnQgPSBjb250ZW50O1xuICAgICAgICB0aGlzLnRoYXQuaW5mb1dpbmRvdyA9IG5ldyBnb29nbGUubWFwcy5JbmZvV2luZG93KG9wdGlvbnMpO1xuICAgICAgICB0aGlzLnRoYXQuaW5mb1dpbmRvdy5vcGVuKG1hcCwgbWFya2VyKTtcbiAgICB9O1xuICAgIEluZm9XaW5kb3cucHJvdG90eXBlLm9wZW4gPSBmdW5jdGlvbiAobWFwLCBtYXJrZXIsIG9wdGlvbnMpIHtcbiAgICAgICAgdGhpcy5jbG9zZSgpO1xuICAgICAgICB0aGlzLmluZm9XaW5kb3cobWFwLCBtYXJrZXIsIG9wdGlvbnMpO1xuICAgIH07XG4gICAgSW5mb1dpbmRvdy5wcm90b3R5cGUuaXNPcGVuID0gZnVuY3Rpb24gKGluZm9XaW5kb3cpIHtcbiAgICAgICAgdmFyIG1hcCA9IGluZm9XaW5kb3cuZ2V0TWFwKCk7XG4gICAgICAgIHJldHVybiAobWFwICE9PSBudWxsICYmIHR5cGVvZiBtYXAgIT09IFwidW5kZWZpbmVkXCIpO1xuICAgIH07XG4gICAgSW5mb1dpbmRvdy5wcm90b3R5cGUuY2xvc2UgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGNsZWFyVGltZW91dCh0aGlzLnRpbWVyKTtcbiAgICAgICAgaWYgKHRoaXMudGhhdC5pbmZvV2luZG93ICYmIHRoaXMuaXNPcGVuKHRoaXMudGhhdC5pbmZvV2luZG93KSkge1xuICAgICAgICAgICAgdGhpcy50aGF0LmluZm9XaW5kb3cuY2xvc2UoKTtcbiAgICAgICAgfVxuICAgIH07XG4gICAgSW5mb1dpbmRvdy5wcm90b3R5cGUuYWRkRXZlbnRzID0gZnVuY3Rpb24gKG1hcmtlciwgb3B0aW9ucywgbWFwKSB7XG4gICAgICAgIHZhciBfdGhpcyA9IHRoaXM7XG4gICAgICAgIHZhciBhcmdzID0gdGhpcy51dGlscy5wcmVwYXJlT3B0aW9ucyhvcHRpb25zLCB0aGlzLmNvbmZpZy5jdXN0b21JbmZvV2luZG93T3B0aW9ucyk7XG4gICAgICAgIHZhciBvcGVuT24gPSAoYXJncy5jdXN0b20gJiYgYXJncy5jdXN0b20ub3BlbiAmJiBhcmdzLmN1c3RvbS5vcGVuLm9uKSA/IGFyZ3MuY3VzdG9tLm9wZW4ub24gOiAnY2xpY2snO1xuICAgICAgICB2YXIgY2xvc2VPbiA9IChhcmdzLmN1c3RvbSAmJiBhcmdzLmN1c3RvbS5jbG9zZSAmJiBhcmdzLmN1c3RvbS5jbG9zZS5vbikgPyBhcmdzLmN1c3RvbS5jbG9zZS5vbiA6ICdjbGljayc7XG4gICAgICAgIC8vIFRvZ2dsZSBFZmZlY3Qgd2hlbiB1c2luZyB0aGUgc2FtZSBtZXRob2QgdG8gT3BlbiBhbmQgQ2xvc2UuXG4gICAgICAgIGlmIChvcGVuT24gPT09IGNsb3NlT24pIHtcbiAgICAgICAgICAgIGdvb2dsZS5tYXBzLmV2ZW50LmFkZExpc3RlbmVyKG1hcmtlciwgb3Blbk9uLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgaWYgKCFfdGhpcy50aGF0LmluZm9XaW5kb3cgfHwgIV90aGlzLmlzT3BlbihfdGhpcy50aGF0LmluZm9XaW5kb3cpKSB7XG4gICAgICAgICAgICAgICAgICAgIF90aGlzLm9wZW4obWFwLCBtYXJrZXIsIGFyZ3MuZGVmYXVsdHMpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgX3RoaXMuY2xvc2UoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIGdvb2dsZS5tYXBzLmV2ZW50LmFkZExpc3RlbmVyKG1hcmtlciwgb3Blbk9uLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgX3RoaXMub3BlbihtYXAsIG1hcmtlciwgYXJncy5kZWZhdWx0cyk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIGdvb2dsZS5tYXBzLmV2ZW50LmFkZExpc3RlbmVyKG1hcmtlciwgY2xvc2VPbiwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIGlmIChhcmdzLmN1c3RvbS5jbG9zZS5kdXJhdGlvbikge1xuICAgICAgICAgICAgICAgICAgICBfdGhpcy50aW1lciA9IHNldFRpbWVvdXQoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgX3RoaXMuY2xvc2UoKTtcbiAgICAgICAgICAgICAgICAgICAgfSwgYXJncy5jdXN0b20uY2xvc2UuZHVyYXRpb24pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgX3RoaXMuY2xvc2UoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgIH07XG4gICAgcmV0dXJuIEluZm9XaW5kb3c7XG59KSgpO1xubW9kdWxlLmV4cG9ydHMgPSBJbmZvV2luZG93O1xuIiwidmFyIExvY2F0ZSA9IChmdW5jdGlvbiAoKSB7XG4gICAgZnVuY3Rpb24gTG9jYXRlKCkge1xuICAgIH1cbiAgICBMb2NhdGUucHJvdG90eXBlLmxvY2F0ZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIGNlbnRlciA9IHRoaXMuaW5zdGFuY2UuZ2V0Q2VudGVyKCk7XG4gICAgICAgIHJldHVybiB7IGxhdDogY2VudGVyLmxhdCgpLCBsbmc6IGNlbnRlci5sbmcoKSB9O1xuICAgIH07XG4gICAgcmV0dXJuIExvY2F0ZTtcbn0pKCk7XG5tb2R1bGUuZXhwb3J0cyA9IExvY2F0ZTtcbiIsIi8vLyA8cmVmZXJlbmNlIHBhdGg9XCJ0eXBpbmdzL3RzZC5kLnRzXCIvPlxudmFyIGFkZE1hcmtlciA9IHJlcXVpcmUoJy4vYWRkTWFya2VyJyk7XG52YXIgYWRkRmVhdHVyZSA9IHJlcXVpcmUoJy4vYWRkRmVhdHVyZScpO1xudmFyIGFkZFBhbmVsID0gcmVxdWlyZSgnLi9hZGRQYW5lbCcpO1xudmFyIGNlbnRlciA9IHJlcXVpcmUoJy4vY2VudGVyJyk7XG52YXIgbG9jYXRlID0gcmVxdWlyZSgnLi9sb2NhdGUnKTtcbnZhciB1cGRhdGVNYXJrZXIgPSByZXF1aXJlKCcuL3VwZGF0ZU1hcmtlcicpO1xudmFyIHVwZGF0ZU1hcCA9IHJlcXVpcmUoJy4vdXBkYXRlTWFwJyk7XG52YXIgdXBkYXRlRmVhdHVyZSA9IHJlcXVpcmUoJy4vdXBkYXRlRmVhdHVyZScpO1xudmFyIGFkZE1hcCA9IHJlcXVpcmUoJy4vYWRkTWFwJyk7XG52YXIgcmVtb3ZlTWFya2VyID0gcmVxdWlyZSgnLi9yZW1vdmVNYXJrZXInKTtcbnZhciByZXNldE1hcmtlciA9IHJlcXVpcmUoJy4vcmVzZXRNYXJrZXInKTtcbnZhciBmaWx0ZXIgPSByZXF1aXJlKCcuL2ZpbHRlcicpO1xudmFyIG1hcFRvb2xzID0gKGZ1bmN0aW9uICgpIHtcbiAgICBmdW5jdGlvbiBtYXBUb29scyhvcHRpb25zLCBjYikge1xuICAgICAgICB0aGlzLmNyb3NzZmlsdGVyID0gcmVxdWlyZSgnY3Jvc3NmaWx0ZXInKTtcbiAgICAgICAgdmFyIGFkZE1hcmtlckluc3RhbmNlID0gbmV3IGFkZE1hcmtlcih0aGlzKTtcbiAgICAgICAgdGhpcy5hZGRNYXJrZXIgPSBmdW5jdGlvbiAobWFya2VyLCBvcHRpb25zKSB7XG4gICAgICAgICAgICByZXR1cm4gYWRkTWFya2VySW5zdGFuY2UuYWRkTWFya2VyKG1hcmtlciwgb3B0aW9ucyk7XG4gICAgICAgIH07XG4gICAgICAgIHZhciBhZGRGZWF0dXJlSW5zdGFuY2UgPSBuZXcgYWRkRmVhdHVyZSh0aGlzKTtcbiAgICAgICAgdGhpcy5hZGRUb3BvSnNvbiA9IGZ1bmN0aW9uIChkYXRhLCBvcHRpb25zKSB7XG4gICAgICAgICAgICByZXR1cm4gYWRkRmVhdHVyZUluc3RhbmNlLmFkZFRvcG9Kc29uKGRhdGEsIG9wdGlvbnMpO1xuICAgICAgICB9O1xuICAgICAgICB0aGlzLmFkZEdlb0pzb24gPSBmdW5jdGlvbiAoZGF0YSwgb3B0aW9ucykge1xuICAgICAgICAgICAgcmV0dXJuIGFkZEZlYXR1cmVJbnN0YW5jZS5hZGRHZW9Kc29uKGRhdGEsIG9wdGlvbnMpO1xuICAgICAgICB9O1xuICAgICAgICB2YXIgYWRkUGFuZWxJbnN0YW5jZSA9IG5ldyBhZGRQYW5lbCh0aGlzKTtcbiAgICAgICAgdGhpcy5hZGRQYW5lbCA9IGZ1bmN0aW9uIChvcHRpb25zLCBjYikge1xuICAgICAgICAgICAgcmV0dXJuIGFkZFBhbmVsSW5zdGFuY2UuYWRkUGFuZWwob3B0aW9ucywgY2IpO1xuICAgICAgICB9O1xuICAgICAgICB0aGlzLmNlbnRlciA9IG5ldyBjZW50ZXIoKS5wb3M7XG4gICAgICAgIHRoaXMubG9jYXRlID0gbmV3IGxvY2F0ZSgpLmxvY2F0ZTtcbiAgICAgICAgdmFyIHVwZGF0ZU1hcmtlckluc3RhbmNlID0gbmV3IHVwZGF0ZU1hcmtlcih0aGlzKTtcbiAgICAgICAgdGhpcy51cGRhdGVNYXJrZXIgPSBmdW5jdGlvbiAoYXJncywgb3B0aW9ucykge1xuICAgICAgICAgICAgcmV0dXJuIHVwZGF0ZU1hcmtlckluc3RhbmNlLnVwZGF0ZShhcmdzLCBvcHRpb25zKTtcbiAgICAgICAgfTtcbiAgICAgICAgdmFyIHVwZGF0ZU1hcEluc3RhbmNlID0gbmV3IHVwZGF0ZU1hcCh0aGlzKTtcbiAgICAgICAgdGhpcy51cGRhdGVNYXAgPSBmdW5jdGlvbiAoYXJncykge1xuICAgICAgICAgICAgdXBkYXRlTWFwSW5zdGFuY2UudXBkYXRlTWFwKGFyZ3MpO1xuICAgICAgICB9O1xuICAgICAgICB2YXIgdXBkYXRlRmVhdHVyZUluc3RhbmNlID0gbmV3IHVwZGF0ZUZlYXR1cmUodGhpcyk7XG4gICAgICAgIHRoaXMudXBkYXRlRmVhdHVyZSA9IGZ1bmN0aW9uIChhcmdzLCBvcHRpb25zKSB7XG4gICAgICAgICAgICByZXR1cm4gdXBkYXRlRmVhdHVyZUluc3RhbmNlLnVwZGF0ZShhcmdzLCBvcHRpb25zKTtcbiAgICAgICAgfTtcbiAgICAgICAgdmFyIHJlbW92ZU1hcmtlckluc3RhbmNlID0gbmV3IHJlbW92ZU1hcmtlcih0aGlzKTtcbiAgICAgICAgdGhpcy5yZW1vdmVNYXJrZXIgPSBmdW5jdGlvbiAoYXJncykge1xuICAgICAgICAgICAgcmV0dXJuIHJlbW92ZU1hcmtlckluc3RhbmNlLnJlbW92ZU1hcmtlcihhcmdzKTtcbiAgICAgICAgfTtcbiAgICAgICAgdmFyIHJlc2V0TWFya2VySW5zdGFuY2UgPSBuZXcgcmVzZXRNYXJrZXIodGhpcyk7XG4gICAgICAgIHRoaXMucmVzZXRNYXJrZXIgPSBmdW5jdGlvbiAoYXJncywgb3B0aW9ucykge1xuICAgICAgICAgICAgcmV0dXJuIHJlc2V0TWFya2VySW5zdGFuY2UucmVzZXRNYXJrZXIoYXJncywgb3B0aW9ucyk7XG4gICAgICAgIH07XG4gICAgICAgIHZhciBmaW5kTWFya2VyID0gbmV3IGZpbHRlcih0aGlzLCAnbWFya2VycycpO1xuICAgICAgICB0aGlzLmZpbmRNYXJrZXIgPSBmdW5jdGlvbiAoYXJncywgb3B0aW9ucykge1xuICAgICAgICAgICAgcmV0dXJuIGZpbmRNYXJrZXIuZmlsdGVyKGFyZ3MsIG9wdGlvbnMpO1xuICAgICAgICB9O1xuICAgICAgICAvLyBVbml0IFRlc3RzP1xuICAgICAgICB2YXIgZmluZEZlYXR1cmUgPSBuZXcgZmlsdGVyKHRoaXMsICdqc29uJyk7XG4gICAgICAgIHRoaXMuZmluZEZlYXR1cmUgPSBmdW5jdGlvbiAoYXJncywgb3B0aW9ucykge1xuICAgICAgICAgICAgcmV0dXJuIGZpbmRGZWF0dXJlLmZpbHRlcihhcmdzLCBvcHRpb25zKTtcbiAgICAgICAgfTtcbiAgICAgICAgdmFyIG1hcCA9IG5ldyBhZGRNYXAodGhpcyk7XG4gICAgICAgIG1hcC5sb2FkKG9wdGlvbnMsIGNiKTtcbiAgICB9XG4gICAgbWFwVG9vbHMucHJvdG90eXBlLnpvb20gPSBmdW5jdGlvbiAoem9vbSkge1xuICAgICAgICBpZiAodHlwZW9mIHpvb20gPT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5pbnN0YW5jZS5nZXRab29tKCk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICB0aGlzLmluc3RhbmNlLnNldFpvb20oem9vbSk7XG4gICAgICAgIH1cbiAgICB9O1xuICAgIHJldHVybiBtYXBUb29scztcbn0pKCk7XG5tb2R1bGUuZXhwb3J0cyA9IG1hcFRvb2xzO1xuIiwiLy8vIDxyZWZlcmVuY2UgcGF0aD1cInR5cGluZ3MvdHNkLmQudHNcIi8+XG52YXIgdXRpbHMgPSByZXF1aXJlKCcuL3V0aWxzJyk7XG52YXIgY29uZmlnID0gcmVxdWlyZSgnLi9jb25maWcnKTtcbnZhciBNYXBzID0gKGZ1bmN0aW9uICgpIHtcbiAgICBmdW5jdGlvbiBNYXBzKCkge1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBJbmplY3RzIEdvb2dsZSBBUEkgSmF2YXNjcmlwdCBGaWxlIGFuZCBhZGRzIGEgY2FsbGJhY2sgdG8gbG9hZCB0aGUgR29vZ2xlIE1hcHMgQXN5bmMuXG4gICAgICogQHR5cGUge3tsb2FkOiBGdW5jdGlvbn19XG4gICAgICogQHByaXZhdGVcbiAgICAgKlxuICAgICAqIEByZXR1cm5zIHRoZSBlbGVtZW50IGFwcGVuZGVkXG4gICAgICovXG4gICAgTWFwcy5sb2FkID0gZnVuY3Rpb24gKGlkLCBhcmdzKSB7XG4gICAgICAgIHZhciB2ZXJzaW9uID0gYXJncy52ZXJzaW9uIHx8IGNvbmZpZy52ZXJzaW9uO1xuICAgICAgICB2YXIgc2NyaXB0ID0gd2luZG93LmRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3NjcmlwdCcpO1xuICAgICAgICBzY3JpcHQudHlwZSA9ICd0ZXh0L2phdmFzY3JpcHQnO1xuICAgICAgICBzY3JpcHQuc3JjID0gY29uZmlnLnVybCArICc/dj0nICsgdmVyc2lvbiArICcmY2FsbGJhY2s9bWFwVG9vbHMubWFwcy4nICsgaWQgKyAnLmNyZWF0ZSc7XG4gICAgICAgIHJldHVybiB3aW5kb3cuZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZChzY3JpcHQpO1xuICAgIH07XG4gICAgTWFwcy5tYXBPcHRpb25zID0gZnVuY3Rpb24gKGFyZ3MpIHtcbiAgICAgICAgLy8gVG8gY2xvbmUgQXJndW1lbnRzIGV4Y2x1ZGluZyBjdXN0b21NYXBPcHRpb25zXG4gICAgICAgIHZhciByZXN1bHQgPSB1dGlscy5jbG9uZShhcmdzLCBjb25maWcuY3VzdG9tTWFwT3B0aW9ucyk7XG4gICAgICAgIHJlc3VsdC56b29tID0gYXJncy56b29tIHx8IGNvbmZpZy56b29tO1xuICAgICAgICBpZiAoYXJncy5sYXQgJiYgYXJncy5sbmcpIHtcbiAgICAgICAgICAgIHJlc3VsdC5jZW50ZXIgPSBuZXcgZ29vZ2xlLm1hcHMuTGF0TG5nKGFyZ3MubGF0LCBhcmdzLmxuZyk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGFyZ3MudHlwZSkge1xuICAgICAgICAgICAgcmVzdWx0Lm1hcFR5cGVJZCA9IGdvb2dsZS5tYXBzLk1hcFR5cGVJZFthcmdzLnR5cGVdIHx8IGZhbHNlO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfTtcbiAgICByZXR1cm4gTWFwcztcbn0pKCk7XG5tb2R1bGUuZXhwb3J0cyA9IE1hcHM7XG4iLCIvLy8gPHJlZmVyZW5jZSBwYXRoPVwidHlwaW5ncy90c2QuZC50c1wiLz5cbnZhciBmaW5kTWFya2VyID0gcmVxdWlyZSgnLi9maW5kTWFya2VyQnlJZCcpO1xudmFyIFJlbW92ZU1hcmtlciA9IChmdW5jdGlvbiAoKSB7XG4gICAgZnVuY3Rpb24gUmVtb3ZlTWFya2VyKHRoYXQpIHtcbiAgICAgICAgdGhpcy50aGF0ID0gdGhhdDtcbiAgICAgICAgdmFyIGZpbmRNYXJrZXJJbnN0YW5jZSA9IG5ldyBmaW5kTWFya2VyKHRoYXQpO1xuICAgICAgICB0aGlzLmZpbmRNYXJrZXIgPSBmdW5jdGlvbiAobWFya2VyKSB7XG4gICAgICAgICAgICByZXR1cm4gZmluZE1hcmtlckluc3RhbmNlLmZpbmQobWFya2VyKTtcbiAgICAgICAgfTtcbiAgICB9XG4gICAgUmVtb3ZlTWFya2VyLnByb3RvdHlwZS5yZW1vdmVCdWxrID0gZnVuY3Rpb24gKGFyZ3MpIHtcbiAgICAgICAgdmFyIG1hcmtlciwgeDtcbiAgICAgICAgZm9yICh4IGluIGFyZ3MpIHtcbiAgICAgICAgICAgIGlmIChhcmdzLmhhc093blByb3BlcnR5KHgpKSB7XG4gICAgICAgICAgICAgICAgbWFya2VyID0gYXJnc1t4XTtcbiAgICAgICAgICAgICAgICB0aGlzLnJlbW92ZSh0aGlzLmZpbmRNYXJrZXIobWFya2VyKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9O1xuICAgIFJlbW92ZU1hcmtlci5wcm90b3R5cGUucmVtb3ZlTWFya2VyID0gZnVuY3Rpb24gKGFyZ3MpIHtcbiAgICAgICAgaWYgKHR5cGVvZiBhcmdzID09PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgdGhpcy5yZW1vdmVCdWxrKHRoaXMudGhhdC5tYXJrZXJzLmFsbCk7XG4gICAgICAgIH1cbiAgICAgICAgdmFyIHR5cGUgPSBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwoYXJncyk7XG4gICAgICAgIGlmICh0eXBlID09PSAnW29iamVjdCBPYmplY3RdJykge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMucmVtb3ZlKHRoaXMuZmluZE1hcmtlcihhcmdzKSk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHR5cGUgPT09ICdbb2JqZWN0IEFycmF5XScpIHtcbiAgICAgICAgICAgIHRoaXMucmVtb3ZlQnVsayhhcmdzKTtcbiAgICAgICAgfVxuICAgIH07XG4gICAgUmVtb3ZlTWFya2VyLnByb3RvdHlwZS5yZW1vdmUgPSBmdW5jdGlvbiAobWFya2VyKSB7XG4gICAgICAgIG1hcmtlci5zZXRNYXAobnVsbCk7XG4gICAgICAgIGRlbGV0ZSBtYXBUb29scy5tYXBzW3RoaXMudGhhdC5pZF0ubWFya2Vycy5hbGxbbWFya2VyLmRhdGEudWlkXTtcbiAgICB9O1xuICAgIHJldHVybiBSZW1vdmVNYXJrZXI7XG59KSgpO1xubW9kdWxlLmV4cG9ydHMgPSBSZW1vdmVNYXJrZXI7XG4iLCIvLy8gPHJlZmVyZW5jZSBwYXRoPVwidHlwaW5ncy90c2QuZC50c1wiLz5cbnZhciB1dGlscyA9IHJlcXVpcmUoJy4vdXRpbHMnKTtcbnZhciBjb25maWcgPSByZXF1aXJlKCcuL2NvbmZpZycpO1xudmFyIGZpbmRNYXJrZXIgPSByZXF1aXJlKCcuL2ZpbmRNYXJrZXJCeUlkJyk7XG52YXIgdXBkYXRlTWFya2VyID0gcmVxdWlyZSgnLi91cGRhdGVNYXJrZXInKTtcbnZhciBSZXNldE1hcmtlciA9IChmdW5jdGlvbiAoKSB7XG4gICAgZnVuY3Rpb24gUmVzZXRNYXJrZXIodGhhdCkge1xuICAgICAgICB0aGlzLnRoYXQgPSB0aGF0O1xuICAgICAgICB2YXIgZmluZE1hcmtlckluc3RhbmNlID0gbmV3IGZpbmRNYXJrZXIodGhhdCk7XG4gICAgICAgIHRoaXMuZmluZE1hcmtlciA9IGZ1bmN0aW9uIChtYXJrZXIpIHtcbiAgICAgICAgICAgIHJldHVybiBmaW5kTWFya2VySW5zdGFuY2UuZmluZChtYXJrZXIpO1xuICAgICAgICB9O1xuICAgICAgICB0aGlzLnVwZGF0ZU1hcmtlciA9IG5ldyB1cGRhdGVNYXJrZXIodGhhdCk7XG4gICAgfVxuICAgIFJlc2V0TWFya2VyLnByb3RvdHlwZS5yZXNldEJ1bGsgPSBmdW5jdGlvbiAobWFya2Vycywgb3B0aW9ucykge1xuICAgICAgICB2YXIgeDtcbiAgICAgICAgZm9yICh4IGluIG1hcmtlcnMpIHtcbiAgICAgICAgICAgIGlmIChtYXJrZXJzLmhhc093blByb3BlcnR5KHgpKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5yZXNldChtYXJrZXJzW3hdLCBvcHRpb25zKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH07XG4gICAgUmVzZXRNYXJrZXIucHJvdG90eXBlLnJlc2V0TWFya2VyID0gZnVuY3Rpb24gKGFyZ3MsIG9wdGlvbnMpIHtcbiAgICAgICAgdmFyIHR5cGUgPSBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwoYXJncyk7XG4gICAgICAgIHZhciByZXN1bHQ7XG4gICAgICAgIGlmICh0eXBlID09PSAnW29iamVjdCBPYmplY3RdJykge1xuICAgICAgICAgICAgcmVzdWx0ID0gdGhpcy5yZXNldCh0aGlzLmZpbmRNYXJrZXIoYXJncyksIG9wdGlvbnMpO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0eXBlID09PSAnW29iamVjdCBBcnJheV0nKSB7XG4gICAgICAgICAgICByZXN1bHQgPSB0aGlzLnJlc2V0QnVsayhhcmdzLCBvcHRpb25zKTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLnRoYXQubWFya2Vycy5kYXRhQ2hhbmdlZCA9IHRydWU7XG4gICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfTtcbiAgICBSZXNldE1hcmtlci5wcm90b3R5cGUuZm9ybWF0T3B0aW9ucyA9IGZ1bmN0aW9uIChtYXJrZXIsIG9wdGlvbnMpIHtcbiAgICAgICAgdmFyIGtleSwgb3AgPSB7fTtcbiAgICAgICAgdmFyIHR5cGUgPSBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwob3B0aW9ucyk7XG4gICAgICAgIGlmICh0eXBlID09PSAnW29iamVjdCBTdHJpbmddJykge1xuICAgICAgICAgICAgb3Bbb3B0aW9uc10gPSBtYXJrZXIuZGF0YS5fc2VsZltvcHRpb25zXTtcbiAgICAgICAgfVxuICAgICAgICBpZiAodHlwZSA9PT0gJ1tvYmplY3QgQXJyYXldJykge1xuICAgICAgICAgICAgZm9yIChrZXkgaW4gb3B0aW9ucykge1xuICAgICAgICAgICAgICAgIGlmIChvcHRpb25zLmhhc093blByb3BlcnR5KGtleSkpIHtcbiAgICAgICAgICAgICAgICAgICAgb3Bbb3B0aW9uc1trZXldXSA9IG1hcmtlci5kYXRhLl9zZWxmW29wdGlvbnNba2V5XV07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBvcDtcbiAgICB9O1xuICAgIFJlc2V0TWFya2VyLnByb3RvdHlwZS5yZXNldCA9IGZ1bmN0aW9uIChtYXJrZXIsIG9wdGlvbnMpIHtcbiAgICAgICAgdmFyIHByZXBhcmVkT3B0aW9ucyA9IHV0aWxzLnByZXBhcmVPcHRpb25zKHRoaXMuZm9ybWF0T3B0aW9ucyhtYXJrZXIsIG9wdGlvbnMpLCBjb25maWcuY3VzdG9tTWFya2VyT3B0aW9ucyk7XG4gICAgICAgIHRoaXMudXBkYXRlTWFya2VyLmN1c3RvbVVwZGF0ZShtYXJrZXIsIHByZXBhcmVkT3B0aW9ucyk7XG4gICAgICAgIHJldHVybiBtYXJrZXI7XG4gICAgfTtcbiAgICByZXR1cm4gUmVzZXRNYXJrZXI7XG59KSgpO1xubW9kdWxlLmV4cG9ydHMgPSBSZXNldE1hcmtlcjtcbiIsInZhciBUZW1wbGF0ZSA9IChmdW5jdGlvbiAoKSB7XG4gICAgZnVuY3Rpb24gVGVtcGxhdGUodGhhdCkge1xuICAgICAgICB0aGlzLnRoYXQgPSB0aGF0O1xuICAgIH1cbiAgICBUZW1wbGF0ZS5wcm90b3R5cGUubG9hZCA9IGZ1bmN0aW9uICh0eXBlLCB1cmwsIGNiKSB7XG4gICAgICAgIHZhciBfdGhpcyA9IHRoaXM7XG4gICAgICAgIGlmICh0aGlzLnRoYXQudGVtcGxhdGVzW3R5cGVdW3VybF0pIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLnRoYXQudGVtcGxhdGVzW3R5cGVdW3VybF07XG4gICAgICAgIH1cbiAgICAgICAgdmFyIHhociA9IG5ldyBYTUxIdHRwUmVxdWVzdCgpO1xuICAgICAgICB4aHIub3BlbihcIkdFVFwiLCB1cmwpO1xuICAgICAgICB4aHIub25sb2FkID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgaWYgKHhoci5yZWFkeVN0YXRlID09PSA0KSB7XG4gICAgICAgICAgICAgICAgaWYgKHhoci5zdGF0dXMgPT09IDIwMCkge1xuICAgICAgICAgICAgICAgICAgICBfdGhpcy50aGF0LnRlbXBsYXRlc1t0eXBlXVt1cmxdID0geGhyLnJlc3BvbnNlVGV4dDtcbiAgICAgICAgICAgICAgICAgICAgY2IoZmFsc2UsIHhoci5yZXNwb25zZVRleHQpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgY2IobmV3IEVycm9yKHhoci5zdGF0dXNUZXh0KSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgICAgICB4aHIuc2VuZChudWxsKTtcbiAgICB9O1xuICAgIHJldHVybiBUZW1wbGF0ZTtcbn0pKCk7XG5tb2R1bGUuZXhwb3J0cyA9IFRlbXBsYXRlO1xuIiwiLy8vIDxyZWZlcmVuY2UgcGF0aD1cInR5cGluZ3MvdHNkLmQudHNcIi8+XG52YXIgVXBkYXRlRmVhdHVyZSA9IChmdW5jdGlvbiAoKSB7XG4gICAgZnVuY3Rpb24gVXBkYXRlRmVhdHVyZSh0aGF0KSB7XG4gICAgICAgIHRoaXMudGhhdCA9IHRoYXQ7XG4gICAgfVxuICAgIFVwZGF0ZUZlYXR1cmUucHJvdG90eXBlLnVwZGF0ZVN0eWxlID0gZnVuY3Rpb24gKGYsIHN0eWxlKSB7XG4gICAgICAgIGlmICh0eXBlb2Ygc3R5bGUgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgIHZhciBzdHlsZU9wdGlvbnMgPSBzdHlsZS5jYWxsKGYpO1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMudGhhdC5pbnN0YW5jZS5kYXRhLm92ZXJyaWRlU3R5bGUoZiwgc3R5bGVPcHRpb25zKTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLnRoYXQuaW5zdGFuY2UuZGF0YS5vdmVycmlkZVN0eWxlKGYsIHN0eWxlKTtcbiAgICB9O1xuICAgIFVwZGF0ZUZlYXR1cmUucHJvdG90eXBlLmZpbmRBbmRVcGRhdGUgPSBmdW5jdGlvbiAoYXJncywgb3B0aW9ucykge1xuICAgICAgICBpZiAoYXJncy5kYXRhICYmIGFyZ3MuZGF0YS51aWQpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLnVwZGF0ZUZlYXR1cmUoYXJncywgb3B0aW9ucyk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGFyZ3MudWlkICYmIG1hcFRvb2xzLm1hcHNbdGhpcy50aGF0LmlkXS5qc29uICYmIG1hcFRvb2xzLm1hcHNbdGhpcy50aGF0LmlkXS5qc29uLmFsbFthcmdzLnVpZF0pIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLnVwZGF0ZUZlYXR1cmUobWFwVG9vbHMubWFwc1t0aGlzLnRoYXQuaWRdLmpzb24uYWxsW2FyZ3MudWlkXSwgb3B0aW9ucyk7XG4gICAgICAgIH1cbiAgICB9O1xuICAgIFVwZGF0ZUZlYXR1cmUucHJvdG90eXBlLnVwZGF0ZSA9IGZ1bmN0aW9uIChhcmdzLCBvcHRpb25zKSB7XG4gICAgICAgIHZhciB0eXBlID0gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKGFyZ3MpO1xuICAgICAgICBpZiAodHlwZSA9PT0gJ1tvYmplY3QgQXJyYXldJykge1xuICAgICAgICAgICAgdmFyIGZlYXR1cmUsIHg7XG4gICAgICAgICAgICBmb3IgKHggaW4gYXJncykge1xuICAgICAgICAgICAgICAgIGlmIChhcmdzLmhhc093blByb3BlcnR5KHgpKSB7XG4gICAgICAgICAgICAgICAgICAgIGZlYXR1cmUgPSBhcmdzW3hdO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmZpbmRBbmRVcGRhdGUoZmVhdHVyZSwgb3B0aW9ucyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGlmICh0eXBlID09PSAnW29iamVjdCBPYmplY3RdJykge1xuICAgICAgICAgICAgdGhpcy5maW5kQW5kVXBkYXRlKGFyZ3MsIG9wdGlvbnMpO1xuICAgICAgICB9XG4gICAgfTtcbiAgICBVcGRhdGVGZWF0dXJlLnByb3RvdHlwZS51cGRhdGVGZWF0dXJlID0gZnVuY3Rpb24gKGZlYXR1cmUsIG9wdGlvbnMpIHtcbiAgICAgICAgaWYgKG9wdGlvbnMuc3R5bGUpIHtcbiAgICAgICAgICAgIHRoaXMudXBkYXRlU3R5bGUoZmVhdHVyZSwgb3B0aW9ucy5zdHlsZSk7XG4gICAgICAgIH1cbiAgICB9O1xuICAgIHJldHVybiBVcGRhdGVGZWF0dXJlO1xufSkoKTtcbm1vZHVsZS5leHBvcnRzID0gVXBkYXRlRmVhdHVyZTtcbiIsIi8vLyA8cmVmZXJlbmNlIHBhdGg9XCJtYXBzLnRzXCIvPlxudmFyIG1hcHMgPSByZXF1aXJlKCcuL21hcHMnKTtcbnZhciBVcGRhdGVNYXAgPSAoZnVuY3Rpb24gKCkge1xuICAgIGZ1bmN0aW9uIFVwZGF0ZU1hcCh0aGF0KSB7XG4gICAgICAgIHRoaXMudGhhdCA9IHRoYXQ7XG4gICAgfVxuICAgIFVwZGF0ZU1hcC5wcm90b3R5cGUudXBkYXRlTWFwID0gZnVuY3Rpb24gKGFyZ3MpIHtcbiAgICAgICAgdmFyIG1hcE9wdGlvbnMgPSBtYXBzLm1hcE9wdGlvbnMoYXJncyk7XG4gICAgICAgIHJldHVybiB0aGlzLnRoYXQuaW5zdGFuY2Uuc2V0T3B0aW9ucyhtYXBPcHRpb25zKTtcbiAgICB9O1xuICAgIHJldHVybiBVcGRhdGVNYXA7XG59KSgpO1xubW9kdWxlLmV4cG9ydHMgPSBVcGRhdGVNYXA7XG4iLCIvLy8gPHJlZmVyZW5jZSBwYXRoPVwidHlwaW5ncy90c2QuZC50c1wiLz5cbnZhciB1dGlscyA9IHJlcXVpcmUoJy4vdXRpbHMnKTtcbnZhciBjb25maWcgPSByZXF1aXJlKCcuL2NvbmZpZycpO1xudmFyIGZpbmRNYXJrZXIgPSByZXF1aXJlKCcuL2ZpbmRNYXJrZXJCeUlkJyk7XG52YXIgZmlsdGVyID0gcmVxdWlyZSgnLi9maWx0ZXInKTtcbnZhciBVcGRhdGVNYXJrZXIgPSAoZnVuY3Rpb24gKCkge1xuICAgIGZ1bmN0aW9uIFVwZGF0ZU1hcmtlcih0aGF0KSB7XG4gICAgICAgIHRoaXMudGhhdCA9IHRoYXQ7XG4gICAgICAgIHZhciBmaW5kTWFya2VySW5zdGFuY2UgPSBuZXcgZmluZE1hcmtlcih0aGF0KTtcbiAgICAgICAgdGhpcy5maW5kTWFya2VyID0gZnVuY3Rpb24gKG1hcmtlcikge1xuICAgICAgICAgICAgcmV0dXJuIGZpbmRNYXJrZXJJbnN0YW5jZS5maW5kKG1hcmtlcik7XG4gICAgICAgIH07XG4gICAgfVxuICAgIFVwZGF0ZU1hcmtlci5wcm90b3R5cGUucmVtb3ZlVGFncyA9IGZ1bmN0aW9uIChtYXJrZXIpIHtcbiAgICAgICAgaWYgKHV0aWxzLmlzQXJyYXkobWFya2VyLnRhZ3MpKSB7XG4gICAgICAgICAgICB2YXIgaSwgdGFnO1xuICAgICAgICAgICAgZm9yIChpIGluIG1hcmtlci50YWdzKSB7XG4gICAgICAgICAgICAgICAgaWYgKG1hcmtlci50YWdzLmhhc093blByb3BlcnR5KGkpKSB7XG4gICAgICAgICAgICAgICAgICAgIHRhZyA9IG1hcmtlci50YWdzW2ldO1xuICAgICAgICAgICAgICAgICAgICBkZWxldGUgdGhpcy50aGF0Lm1hcmtlcnMudGFnc1t0YWddW21hcmtlci5kYXRhLnVpZF07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgZGVsZXRlIHRoaXMudGhhdC5tYXJrZXJzLnRhZ3NbbWFya2VyLnRhZ3NdW21hcmtlci5kYXRhLnVpZF07XG4gICAgICAgIH1cbiAgICB9O1xuICAgIFVwZGF0ZU1hcmtlci5wcm90b3R5cGUuYWRkVGFncyA9IGZ1bmN0aW9uIChtYXJrZXIsIG9wdGlvbnMpIHtcbiAgICAgICAgaWYgKHV0aWxzLmlzQXJyYXkob3B0aW9ucy5jdXN0b20udGFncykpIHtcbiAgICAgICAgICAgIHZhciBpLCB0YWc7XG4gICAgICAgICAgICBmb3IgKGkgaW4gb3B0aW9ucy5jdXN0b20udGFncykge1xuICAgICAgICAgICAgICAgIHRhZyA9IG9wdGlvbnMuY3VzdG9tLnRhZ3NbaV07XG4gICAgICAgICAgICAgICAgdGhpcy50aGF0Lm1hcmtlcnMudGFnc1t0YWddID0gdGhpcy50aGF0Lm1hcmtlcnMudGFnc1t0YWddIHx8IHt9O1xuICAgICAgICAgICAgICAgIHRoaXMudGhhdC5tYXJrZXJzLnRhZ3NbdGFnXVttYXJrZXIuZGF0YS51aWRdID0gbWFya2VyO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgdGhpcy50aGF0Lm1hcmtlcnMudGFnc1tvcHRpb25zLmN1c3RvbS50YWdzXSA9IHRoaXMudGhhdC5tYXJrZXJzLnRhZ3Nbb3B0aW9ucy5jdXN0b20udGFnc10gfHwge307XG4gICAgICAgICAgICB0aGlzLnRoYXQubWFya2Vycy50YWdzW29wdGlvbnMuY3VzdG9tLnRhZ3NdW21hcmtlci5kYXRhLnVpZF0gPSBtYXJrZXI7XG4gICAgICAgIH1cbiAgICAgICAgbWFya2VyLnRhZ3MgPSBvcHRpb25zLmN1c3RvbS50YWdzO1xuICAgIH07XG4gICAgVXBkYXRlTWFya2VyLnByb3RvdHlwZS51cGRhdGVUYWcgPSBmdW5jdGlvbiAobWFya2VyLCBvcHRpb25zKSB7XG4gICAgICAgIHRoaXMucmVtb3ZlVGFncyhtYXJrZXIpO1xuICAgICAgICB0aGlzLmFkZFRhZ3MobWFya2VyLCBvcHRpb25zKTtcbiAgICB9O1xuICAgIFVwZGF0ZU1hcmtlci5wcm90b3R5cGUuY3VzdG9tVXBkYXRlID0gZnVuY3Rpb24gKG1hcmtlciwgb3B0aW9ucykge1xuICAgICAgICBpZiAob3B0aW9ucy5jdXN0b20pIHtcbiAgICAgICAgICAgIGlmIChvcHRpb25zLmN1c3RvbS5tb3ZlKSB7XG4gICAgICAgICAgICAgICAgbWFya2VyLnNldEFuaW1hdGlvbihnb29nbGUubWFwcy5BbmltYXRpb25bb3B0aW9ucy5jdXN0b20ubW92ZS50b1VwcGVyQ2FzZSgpXSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAob3B0aW9ucy5jdXN0b20ubGF0ICYmIG9wdGlvbnMuY3VzdG9tLmxuZykge1xuICAgICAgICAgICAgICAgIG1hcmtlci5zZXRQb3NpdGlvbihuZXcgZ29vZ2xlLm1hcHMuTGF0TG5nKG9wdGlvbnMuY3VzdG9tLmxhdCwgb3B0aW9ucy5jdXN0b20ubG5nKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAob3B0aW9ucy5jdXN0b20uaW5mb1dpbmRvdyAmJiBvcHRpb25zLmN1c3RvbS5pbmZvV2luZG93LmNvbnRlbnQpIHtcbiAgICAgICAgICAgICAgICBtYXJrZXIuaW5mb1dpbmRvdy5jb250ZW50ID0gb3B0aW9ucy5jdXN0b20uaW5mb1dpbmRvdy5jb250ZW50O1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKG9wdGlvbnMuY3VzdG9tLnRhZ3MpIHtcbiAgICAgICAgICAgICAgICB0aGlzLnVwZGF0ZVRhZyhtYXJrZXIsIG9wdGlvbnMpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGlmIChvcHRpb25zLmRlZmF1bHRzKSB7XG4gICAgICAgICAgICBtYXJrZXIuc2V0T3B0aW9ucyhvcHRpb25zLmRlZmF1bHRzKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gbWFya2VyO1xuICAgIH07XG4gICAgVXBkYXRlTWFya2VyLnByb3RvdHlwZS5idWxrVXBkYXRlID0gZnVuY3Rpb24gKGFyZ3MsIG9wdGlvbnMpIHtcbiAgICAgICAgdmFyIG1hcmtlciwgcmVzdWx0cyA9IFtdLCBpbnN0YW5jZSwgeDtcbiAgICAgICAgZm9yICh4IGluIGFyZ3MpIHtcbiAgICAgICAgICAgIGlmIChhcmdzLmhhc093blByb3BlcnR5KHgpKSB7XG4gICAgICAgICAgICAgICAgbWFya2VyID0gYXJnc1t4XTtcbiAgICAgICAgICAgICAgICBpbnN0YW5jZSA9IHRoaXMuY3VzdG9tVXBkYXRlKHRoaXMuZmluZE1hcmtlcihtYXJrZXIpLCBvcHRpb25zKTtcbiAgICAgICAgICAgICAgICByZXN1bHRzLnB1c2goaW5zdGFuY2UpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiByZXN1bHRzO1xuICAgIH07XG4gICAgVXBkYXRlTWFya2VyLnByb3RvdHlwZS5jb3VudFZpc2libGUgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciB4LCBjb3VudCA9IDA7XG4gICAgICAgIGZvciAoeCBpbiB0aGlzLnRoYXQubWFya2Vycy5hbGwpIHtcbiAgICAgICAgICAgIGlmICh0aGlzLnRoYXQubWFya2Vycy5hbGxbeF0udmlzaWJsZSkge1xuICAgICAgICAgICAgICAgIGNvdW50Kys7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgZ29vZ2xlLm1hcHMuZXZlbnQudHJpZ2dlcih0aGlzLnRoYXQuaW5zdGFuY2UsICdtYXJrZXJfdmlzaWJpbGl0eV9jaGFuZ2VkJywgY291bnQpO1xuICAgIH07XG4gICAgVXBkYXRlTWFya2VyLnByb3RvdHlwZS51cGRhdGUgPSBmdW5jdGlvbiAoYXJncywgb3B0aW9ucykge1xuICAgICAgICB2YXIgdmlzaWJpbGl0eUZsYWcgPSBmYWxzZTtcbiAgICAgICAgdmFyIHByZXBhcmVkT3B0aW9ucyA9IHV0aWxzLnByZXBhcmVPcHRpb25zKG9wdGlvbnMsIGNvbmZpZy5jdXN0b21NYXJrZXJPcHRpb25zKTtcbiAgICAgICAgaWYgKHByZXBhcmVkT3B0aW9ucy5kZWZhdWx0cyAmJiBwcmVwYXJlZE9wdGlvbnMuZGVmYXVsdHMuaGFzT3duUHJvcGVydHkoJ3Zpc2libGUnKSAmJiB0aGlzLnRoYXQuZXZlbnRzLmluZGV4T2YoJ21hcmtlcl92aXNpYmlsaXR5X2NoYW5nZWQnKSA+IC0xKSB7XG4gICAgICAgICAgICB2aXNpYmlsaXR5RmxhZyA9IHRydWU7XG4gICAgICAgIH1cbiAgICAgICAgdmFyIHJlc3VsdDtcbiAgICAgICAgdmFyIHR5cGUgPSBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwoYXJncyk7XG4gICAgICAgIGlmICh0eXBlID09PSAnW29iamVjdCBPYmplY3RdJykge1xuICAgICAgICAgICAgaWYgKE9iamVjdC5rZXlzKGFyZ3MpLmxlbmd0aCA9PT0gMSAmJiBhcmdzLnRhZ3MpIHtcbiAgICAgICAgICAgICAgICB2YXIgZmlsdGVySW5zdGFuY2UgPSBuZXcgZmlsdGVyKHRoaXMudGhhdCwgJ21hcmtlcnMnKTtcbiAgICAgICAgICAgICAgICByZXN1bHQgPSB0aGlzLmJ1bGtVcGRhdGUoZmlsdGVySW5zdGFuY2UuZmlsdGVyKGFyZ3MpLCBwcmVwYXJlZE9wdGlvbnMpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgcmVzdWx0ID0gdGhpcy5jdXN0b21VcGRhdGUodGhpcy5maW5kTWFya2VyKGFyZ3MpLCBwcmVwYXJlZE9wdGlvbnMpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGlmICh0eXBlID09PSAnW29iamVjdCBBcnJheV0nKSB7XG4gICAgICAgICAgICByZXN1bHQgPSB0aGlzLmJ1bGtVcGRhdGUoYXJncywgcHJlcGFyZWRPcHRpb25zKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAodmlzaWJpbGl0eUZsYWcpIHtcbiAgICAgICAgICAgIHRoaXMuY291bnRWaXNpYmxlKCk7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy50aGF0Lm1hcmtlcnMuZGF0YUNoYW5nZWQgPSB0cnVlO1xuICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH07XG4gICAgcmV0dXJuIFVwZGF0ZU1hcmtlcjtcbn0pKCk7XG5tb2R1bGUuZXhwb3J0cyA9IFVwZGF0ZU1hcmtlcjtcbiIsInZhciBVdGlscyA9IChmdW5jdGlvbiAoKSB7XG4gICAgZnVuY3Rpb24gVXRpbHMoKSB7XG4gICAgfVxuICAgIFV0aWxzLmNsb25lID0gZnVuY3Rpb24gKG8sIGV4Y2VwdGlvbktleXMpIHtcbiAgICAgICAgdmFyIG91dCwgdiwga2V5O1xuICAgICAgICBvdXQgPSBBcnJheS5pc0FycmF5KG8pID8gW10gOiB7fTtcbiAgICAgICAgZm9yIChrZXkgaW4gbykge1xuICAgICAgICAgICAgaWYgKG8uaGFzT3duUHJvcGVydHkoa2V5KSkge1xuICAgICAgICAgICAgICAgIGlmICghZXhjZXB0aW9uS2V5cyB8fCAoZXhjZXB0aW9uS2V5cyAmJiBleGNlcHRpb25LZXlzLmluZGV4T2Yoa2V5KSA9PT0gLTEpKSB7XG4gICAgICAgICAgICAgICAgICAgIHYgPSBvW2tleV07XG4gICAgICAgICAgICAgICAgICAgIG91dFtrZXldID0gKHR5cGVvZiB2ID09PSAnb2JqZWN0JykgPyB0aGlzLmNsb25lKHYpIDogdjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG91dDtcbiAgICB9O1xuICAgIFV0aWxzLmNyZWF0ZVVpZCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuICd4eHh4eHh4eHh4eHg0eHh4eXh4eHh4eHh4eHh4eHh4eCcucmVwbGFjZSgvW3h5XS9nLCBmdW5jdGlvbiAoYykge1xuICAgICAgICAgICAgdmFyIHIsIHY7XG4gICAgICAgICAgICByID0gTWF0aC5yYW5kb20oKSAqIDE2IHwgMDtcbiAgICAgICAgICAgIHYgPSBjID09PSAneCcgPyByIDogciAmIDB4MyB8IDB4ODtcbiAgICAgICAgICAgIHJldHVybiB2LnRvU3RyaW5nKDE2KTtcbiAgICAgICAgfSk7XG4gICAgfTtcbiAgICBVdGlscy5wcmVwYXJlT3B0aW9ucyA9IGZ1bmN0aW9uIChvcHRpb25zLCBjdXN0b20pIHtcbiAgICAgICAgdmFyIHJlc3VsdCA9IHsgY3VzdG9tOiB7fSwgZGVmYXVsdHM6IHt9IH0sIG9wdGlvbjtcbiAgICAgICAgZm9yIChvcHRpb24gaW4gb3B0aW9ucykge1xuICAgICAgICAgICAgaWYgKG9wdGlvbnMuaGFzT3duUHJvcGVydHkob3B0aW9uKSkge1xuICAgICAgICAgICAgICAgIGlmIChjdXN0b20uaW5kZXhPZihvcHRpb24pID4gLTEpIHtcbiAgICAgICAgICAgICAgICAgICAgcmVzdWx0LmN1c3RvbSA9IHJlc3VsdC5jdXN0b20gfHwge307XG4gICAgICAgICAgICAgICAgICAgIHJlc3VsdC5jdXN0b21bb3B0aW9uXSA9IG9wdGlvbnNbb3B0aW9uXTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHJlc3VsdC5kZWZhdWx0cyA9IHJlc3VsdC5kZWZhdWx0cyB8fCB7fTtcbiAgICAgICAgICAgICAgICAgICAgcmVzdWx0LmRlZmF1bHRzW29wdGlvbl0gPSBvcHRpb25zW29wdGlvbl07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfTtcbiAgICBVdGlscy5pc0FycmF5ID0gZnVuY3Rpb24gKGFyZykge1xuICAgICAgICByZXR1cm4gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKGFyZykgPT09ICdbb2JqZWN0IEFycmF5XSc7XG4gICAgfTtcbiAgICBVdGlscy50b0FycmF5ID0gZnVuY3Rpb24gKG9iaikge1xuICAgICAgICByZXR1cm4gT2JqZWN0LmtleXMob2JqKS5tYXAoZnVuY3Rpb24gKGtleSkge1xuICAgICAgICAgICAgcmV0dXJuIG9ialtrZXldO1xuICAgICAgICB9KTtcbiAgICB9O1xuICAgIFV0aWxzLmRlZmF1bHREaW1lbnNpb24gPSBmdW5jdGlvbiAoaXRlbSkge1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24gKGQpIHtcbiAgICAgICAgICAgIGlmICh0eXBlb2YgZC5kYXRhW2l0ZW1dID09PSAndW5kZWZpbmVkJyAmJiB0eXBlb2YgZFtpdGVtXSAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZFtpdGVtXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICh0eXBlb2YgZC5kYXRhW2l0ZW1dID09PSAndW5kZWZpbmVkJyAmJiB0eXBlb2YgZFtpdGVtXSA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBkLmRhdGFbaXRlbV07XG4gICAgICAgIH07XG4gICAgfTtcbiAgICAvLyBjb21wYXJlcyB0d28gbGlzdHMgYW5kIHJldHVybnMgdGhlIGNvbW1vbiBpdGVtc1xuICAgIFV0aWxzLmdldENvbW1vbk9iamVjdCA9IGZ1bmN0aW9uIChsaXN0MSwgbGlzdDIpIHtcbiAgICAgICAgdmFyIHJlc3VsdCA9IHt9O1xuICAgICAgICBmb3IgKHZhciB1aWQgaW4gbGlzdDEpIHtcbiAgICAgICAgICAgIGlmIChsaXN0MS5oYXNPd25Qcm9wZXJ0eSh1aWQpKSB7XG4gICAgICAgICAgICAgICAgdmFyIG1hdGNoID0gbGlzdDJbdWlkXTtcbiAgICAgICAgICAgICAgICBpZiAodHlwZW9mIG1hdGNoICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgICAgICAgICByZXN1bHRbdWlkXSA9IG1hdGNoO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH07XG4gICAgcmV0dXJuIFV0aWxzO1xufSkoKTtcbm1vZHVsZS5leHBvcnRzID0gVXRpbHM7XG4iLCIoZnVuY3Rpb24oZXhwb3J0cyl7XG5jcm9zc2ZpbHRlci52ZXJzaW9uID0gXCIxLjMuMTFcIjtcbmZ1bmN0aW9uIGNyb3NzZmlsdGVyX2lkZW50aXR5KGQpIHtcbiAgcmV0dXJuIGQ7XG59XG5jcm9zc2ZpbHRlci5wZXJtdXRlID0gcGVybXV0ZTtcblxuZnVuY3Rpb24gcGVybXV0ZShhcnJheSwgaW5kZXgpIHtcbiAgZm9yICh2YXIgaSA9IDAsIG4gPSBpbmRleC5sZW5ndGgsIGNvcHkgPSBuZXcgQXJyYXkobik7IGkgPCBuOyArK2kpIHtcbiAgICBjb3B5W2ldID0gYXJyYXlbaW5kZXhbaV1dO1xuICB9XG4gIHJldHVybiBjb3B5O1xufVxudmFyIGJpc2VjdCA9IGNyb3NzZmlsdGVyLmJpc2VjdCA9IGJpc2VjdF9ieShjcm9zc2ZpbHRlcl9pZGVudGl0eSk7XG5cbmJpc2VjdC5ieSA9IGJpc2VjdF9ieTtcblxuZnVuY3Rpb24gYmlzZWN0X2J5KGYpIHtcblxuICAvLyBMb2NhdGUgdGhlIGluc2VydGlvbiBwb2ludCBmb3IgeCBpbiBhIHRvIG1haW50YWluIHNvcnRlZCBvcmRlci4gVGhlXG4gIC8vIGFyZ3VtZW50cyBsbyBhbmQgaGkgbWF5IGJlIHVzZWQgdG8gc3BlY2lmeSBhIHN1YnNldCBvZiB0aGUgYXJyYXkgd2hpY2hcbiAgLy8gc2hvdWxkIGJlIGNvbnNpZGVyZWQ7IGJ5IGRlZmF1bHQgdGhlIGVudGlyZSBhcnJheSBpcyB1c2VkLiBJZiB4IGlzIGFscmVhZHlcbiAgLy8gcHJlc2VudCBpbiBhLCB0aGUgaW5zZXJ0aW9uIHBvaW50IHdpbGwgYmUgYmVmb3JlICh0byB0aGUgbGVmdCBvZikgYW55XG4gIC8vIGV4aXN0aW5nIGVudHJpZXMuIFRoZSByZXR1cm4gdmFsdWUgaXMgc3VpdGFibGUgZm9yIHVzZSBhcyB0aGUgZmlyc3RcbiAgLy8gYXJndW1lbnQgdG8gYGFycmF5LnNwbGljZWAgYXNzdW1pbmcgdGhhdCBhIGlzIGFscmVhZHkgc29ydGVkLlxuICAvL1xuICAvLyBUaGUgcmV0dXJuZWQgaW5zZXJ0aW9uIHBvaW50IGkgcGFydGl0aW9ucyB0aGUgYXJyYXkgYSBpbnRvIHR3byBoYWx2ZXMgc29cbiAgLy8gdGhhdCBhbGwgdiA8IHggZm9yIHYgaW4gYVtsbzppXSBmb3IgdGhlIGxlZnQgc2lkZSBhbmQgYWxsIHYgPj0geCBmb3IgdiBpblxuICAvLyBhW2k6aGldIGZvciB0aGUgcmlnaHQgc2lkZS5cbiAgZnVuY3Rpb24gYmlzZWN0TGVmdChhLCB4LCBsbywgaGkpIHtcbiAgICB3aGlsZSAobG8gPCBoaSkge1xuICAgICAgdmFyIG1pZCA9IGxvICsgaGkgPj4+IDE7XG4gICAgICBpZiAoZihhW21pZF0pIDwgeCkgbG8gPSBtaWQgKyAxO1xuICAgICAgZWxzZSBoaSA9IG1pZDtcbiAgICB9XG4gICAgcmV0dXJuIGxvO1xuICB9XG5cbiAgLy8gU2ltaWxhciB0byBiaXNlY3RMZWZ0LCBidXQgcmV0dXJucyBhbiBpbnNlcnRpb24gcG9pbnQgd2hpY2ggY29tZXMgYWZ0ZXIgKHRvXG4gIC8vIHRoZSByaWdodCBvZikgYW55IGV4aXN0aW5nIGVudHJpZXMgb2YgeCBpbiBhLlxuICAvL1xuICAvLyBUaGUgcmV0dXJuZWQgaW5zZXJ0aW9uIHBvaW50IGkgcGFydGl0aW9ucyB0aGUgYXJyYXkgaW50byB0d28gaGFsdmVzIHNvIHRoYXRcbiAgLy8gYWxsIHYgPD0geCBmb3IgdiBpbiBhW2xvOmldIGZvciB0aGUgbGVmdCBzaWRlIGFuZCBhbGwgdiA+IHggZm9yIHYgaW5cbiAgLy8gYVtpOmhpXSBmb3IgdGhlIHJpZ2h0IHNpZGUuXG4gIGZ1bmN0aW9uIGJpc2VjdFJpZ2h0KGEsIHgsIGxvLCBoaSkge1xuICAgIHdoaWxlIChsbyA8IGhpKSB7XG4gICAgICB2YXIgbWlkID0gbG8gKyBoaSA+Pj4gMTtcbiAgICAgIGlmICh4IDwgZihhW21pZF0pKSBoaSA9IG1pZDtcbiAgICAgIGVsc2UgbG8gPSBtaWQgKyAxO1xuICAgIH1cbiAgICByZXR1cm4gbG87XG4gIH1cblxuICBiaXNlY3RSaWdodC5yaWdodCA9IGJpc2VjdFJpZ2h0O1xuICBiaXNlY3RSaWdodC5sZWZ0ID0gYmlzZWN0TGVmdDtcbiAgcmV0dXJuIGJpc2VjdFJpZ2h0O1xufVxudmFyIGhlYXAgPSBjcm9zc2ZpbHRlci5oZWFwID0gaGVhcF9ieShjcm9zc2ZpbHRlcl9pZGVudGl0eSk7XG5cbmhlYXAuYnkgPSBoZWFwX2J5O1xuXG5mdW5jdGlvbiBoZWFwX2J5KGYpIHtcblxuICAvLyBCdWlsZHMgYSBiaW5hcnkgaGVhcCB3aXRoaW4gdGhlIHNwZWNpZmllZCBhcnJheSBhW2xvOmhpXS4gVGhlIGhlYXAgaGFzIHRoZVxuICAvLyBwcm9wZXJ0eSBzdWNoIHRoYXQgdGhlIHBhcmVudCBhW2xvK2ldIGlzIGFsd2F5cyBsZXNzIHRoYW4gb3IgZXF1YWwgdG8gaXRzXG4gIC8vIHR3byBjaGlsZHJlbjogYVtsbysyKmkrMV0gYW5kIGFbbG8rMippKzJdLlxuICBmdW5jdGlvbiBoZWFwKGEsIGxvLCBoaSkge1xuICAgIHZhciBuID0gaGkgLSBsbyxcbiAgICAgICAgaSA9IChuID4+PiAxKSArIDE7XG4gICAgd2hpbGUgKC0taSA+IDApIHNpZnQoYSwgaSwgbiwgbG8pO1xuICAgIHJldHVybiBhO1xuICB9XG5cbiAgLy8gU29ydHMgdGhlIHNwZWNpZmllZCBhcnJheSBhW2xvOmhpXSBpbiBkZXNjZW5kaW5nIG9yZGVyLCBhc3N1bWluZyBpdCBpc1xuICAvLyBhbHJlYWR5IGEgaGVhcC5cbiAgZnVuY3Rpb24gc29ydChhLCBsbywgaGkpIHtcbiAgICB2YXIgbiA9IGhpIC0gbG8sXG4gICAgICAgIHQ7XG4gICAgd2hpbGUgKC0tbiA+IDApIHQgPSBhW2xvXSwgYVtsb10gPSBhW2xvICsgbl0sIGFbbG8gKyBuXSA9IHQsIHNpZnQoYSwgMSwgbiwgbG8pO1xuICAgIHJldHVybiBhO1xuICB9XG5cbiAgLy8gU2lmdHMgdGhlIGVsZW1lbnQgYVtsbytpLTFdIGRvd24gdGhlIGhlYXAsIHdoZXJlIHRoZSBoZWFwIGlzIHRoZSBjb250aWd1b3VzXG4gIC8vIHNsaWNlIG9mIGFycmF5IGFbbG86bG8rbl0uIFRoaXMgbWV0aG9kIGNhbiBhbHNvIGJlIHVzZWQgdG8gdXBkYXRlIHRoZSBoZWFwXG4gIC8vIGluY3JlbWVudGFsbHksIHdpdGhvdXQgaW5jdXJyaW5nIHRoZSBmdWxsIGNvc3Qgb2YgcmVjb25zdHJ1Y3RpbmcgdGhlIGhlYXAuXG4gIGZ1bmN0aW9uIHNpZnQoYSwgaSwgbiwgbG8pIHtcbiAgICB2YXIgZCA9IGFbLS1sbyArIGldLFxuICAgICAgICB4ID0gZihkKSxcbiAgICAgICAgY2hpbGQ7XG4gICAgd2hpbGUgKChjaGlsZCA9IGkgPDwgMSkgPD0gbikge1xuICAgICAgaWYgKGNoaWxkIDwgbiAmJiBmKGFbbG8gKyBjaGlsZF0pID4gZihhW2xvICsgY2hpbGQgKyAxXSkpIGNoaWxkKys7XG4gICAgICBpZiAoeCA8PSBmKGFbbG8gKyBjaGlsZF0pKSBicmVhaztcbiAgICAgIGFbbG8gKyBpXSA9IGFbbG8gKyBjaGlsZF07XG4gICAgICBpID0gY2hpbGQ7XG4gICAgfVxuICAgIGFbbG8gKyBpXSA9IGQ7XG4gIH1cblxuICBoZWFwLnNvcnQgPSBzb3J0O1xuICByZXR1cm4gaGVhcDtcbn1cbnZhciBoZWFwc2VsZWN0ID0gY3Jvc3NmaWx0ZXIuaGVhcHNlbGVjdCA9IGhlYXBzZWxlY3RfYnkoY3Jvc3NmaWx0ZXJfaWRlbnRpdHkpO1xuXG5oZWFwc2VsZWN0LmJ5ID0gaGVhcHNlbGVjdF9ieTtcblxuZnVuY3Rpb24gaGVhcHNlbGVjdF9ieShmKSB7XG4gIHZhciBoZWFwID0gaGVhcF9ieShmKTtcblxuICAvLyBSZXR1cm5zIGEgbmV3IGFycmF5IGNvbnRhaW5pbmcgdGhlIHRvcCBrIGVsZW1lbnRzIGluIHRoZSBhcnJheSBhW2xvOmhpXS5cbiAgLy8gVGhlIHJldHVybmVkIGFycmF5IGlzIG5vdCBzb3J0ZWQsIGJ1dCBtYWludGFpbnMgdGhlIGhlYXAgcHJvcGVydHkuIElmIGsgaXNcbiAgLy8gZ3JlYXRlciB0aGFuIGhpIC0gbG8sIHRoZW4gZmV3ZXIgdGhhbiBrIGVsZW1lbnRzIHdpbGwgYmUgcmV0dXJuZWQuIFRoZVxuICAvLyBvcmRlciBvZiBlbGVtZW50cyBpbiBhIGlzIHVuY2hhbmdlZCBieSB0aGlzIG9wZXJhdGlvbi5cbiAgZnVuY3Rpb24gaGVhcHNlbGVjdChhLCBsbywgaGksIGspIHtcbiAgICB2YXIgcXVldWUgPSBuZXcgQXJyYXkoayA9IE1hdGgubWluKGhpIC0gbG8sIGspKSxcbiAgICAgICAgbWluLFxuICAgICAgICBpLFxuICAgICAgICB4LFxuICAgICAgICBkO1xuXG4gICAgZm9yIChpID0gMDsgaSA8IGs7ICsraSkgcXVldWVbaV0gPSBhW2xvKytdO1xuICAgIGhlYXAocXVldWUsIDAsIGspO1xuXG4gICAgaWYgKGxvIDwgaGkpIHtcbiAgICAgIG1pbiA9IGYocXVldWVbMF0pO1xuICAgICAgZG8ge1xuICAgICAgICBpZiAoeCA9IGYoZCA9IGFbbG9dKSA+IG1pbikge1xuICAgICAgICAgIHF1ZXVlWzBdID0gZDtcbiAgICAgICAgICBtaW4gPSBmKGhlYXAocXVldWUsIDAsIGspWzBdKTtcbiAgICAgICAgfVxuICAgICAgfSB3aGlsZSAoKytsbyA8IGhpKTtcbiAgICB9XG5cbiAgICByZXR1cm4gcXVldWU7XG4gIH1cblxuICByZXR1cm4gaGVhcHNlbGVjdDtcbn1cbnZhciBpbnNlcnRpb25zb3J0ID0gY3Jvc3NmaWx0ZXIuaW5zZXJ0aW9uc29ydCA9IGluc2VydGlvbnNvcnRfYnkoY3Jvc3NmaWx0ZXJfaWRlbnRpdHkpO1xuXG5pbnNlcnRpb25zb3J0LmJ5ID0gaW5zZXJ0aW9uc29ydF9ieTtcblxuZnVuY3Rpb24gaW5zZXJ0aW9uc29ydF9ieShmKSB7XG5cbiAgZnVuY3Rpb24gaW5zZXJ0aW9uc29ydChhLCBsbywgaGkpIHtcbiAgICBmb3IgKHZhciBpID0gbG8gKyAxOyBpIDwgaGk7ICsraSkge1xuICAgICAgZm9yICh2YXIgaiA9IGksIHQgPSBhW2ldLCB4ID0gZih0KTsgaiA+IGxvICYmIGYoYVtqIC0gMV0pID4geDsgLS1qKSB7XG4gICAgICAgIGFbal0gPSBhW2ogLSAxXTtcbiAgICAgIH1cbiAgICAgIGFbal0gPSB0O1xuICAgIH1cbiAgICByZXR1cm4gYTtcbiAgfVxuXG4gIHJldHVybiBpbnNlcnRpb25zb3J0O1xufVxuLy8gQWxnb3JpdGhtIGRlc2lnbmVkIGJ5IFZsYWRpbWlyIFlhcm9zbGF2c2tpeS5cbi8vIEltcGxlbWVudGF0aW9uIGJhc2VkIG9uIHRoZSBEYXJ0IHByb2plY3Q7IHNlZSBsaWIvZGFydC9MSUNFTlNFIGZvciBkZXRhaWxzLlxuXG52YXIgcXVpY2tzb3J0ID0gY3Jvc3NmaWx0ZXIucXVpY2tzb3J0ID0gcXVpY2tzb3J0X2J5KGNyb3NzZmlsdGVyX2lkZW50aXR5KTtcblxucXVpY2tzb3J0LmJ5ID0gcXVpY2tzb3J0X2J5O1xuXG5mdW5jdGlvbiBxdWlja3NvcnRfYnkoZikge1xuICB2YXIgaW5zZXJ0aW9uc29ydCA9IGluc2VydGlvbnNvcnRfYnkoZik7XG5cbiAgZnVuY3Rpb24gc29ydChhLCBsbywgaGkpIHtcbiAgICByZXR1cm4gKGhpIC0gbG8gPCBxdWlja3NvcnRfc2l6ZVRocmVzaG9sZFxuICAgICAgICA/IGluc2VydGlvbnNvcnRcbiAgICAgICAgOiBxdWlja3NvcnQpKGEsIGxvLCBoaSk7XG4gIH1cblxuICBmdW5jdGlvbiBxdWlja3NvcnQoYSwgbG8sIGhpKSB7XG4gICAgLy8gQ29tcHV0ZSB0aGUgdHdvIHBpdm90cyBieSBsb29raW5nIGF0IDUgZWxlbWVudHMuXG4gICAgdmFyIHNpeHRoID0gKGhpIC0gbG8pIC8gNiB8IDAsXG4gICAgICAgIGkxID0gbG8gKyBzaXh0aCxcbiAgICAgICAgaTUgPSBoaSAtIDEgLSBzaXh0aCxcbiAgICAgICAgaTMgPSBsbyArIGhpIC0gMSA+PiAxLCAgLy8gVGhlIG1pZHBvaW50LlxuICAgICAgICBpMiA9IGkzIC0gc2l4dGgsXG4gICAgICAgIGk0ID0gaTMgKyBzaXh0aDtcblxuICAgIHZhciBlMSA9IGFbaTFdLCB4MSA9IGYoZTEpLFxuICAgICAgICBlMiA9IGFbaTJdLCB4MiA9IGYoZTIpLFxuICAgICAgICBlMyA9IGFbaTNdLCB4MyA9IGYoZTMpLFxuICAgICAgICBlNCA9IGFbaTRdLCB4NCA9IGYoZTQpLFxuICAgICAgICBlNSA9IGFbaTVdLCB4NSA9IGYoZTUpO1xuXG4gICAgdmFyIHQ7XG5cbiAgICAvLyBTb3J0IHRoZSBzZWxlY3RlZCA1IGVsZW1lbnRzIHVzaW5nIGEgc29ydGluZyBuZXR3b3JrLlxuICAgIGlmICh4MSA+IHgyKSB0ID0gZTEsIGUxID0gZTIsIGUyID0gdCwgdCA9IHgxLCB4MSA9IHgyLCB4MiA9IHQ7XG4gICAgaWYgKHg0ID4geDUpIHQgPSBlNCwgZTQgPSBlNSwgZTUgPSB0LCB0ID0geDQsIHg0ID0geDUsIHg1ID0gdDtcbiAgICBpZiAoeDEgPiB4MykgdCA9IGUxLCBlMSA9IGUzLCBlMyA9IHQsIHQgPSB4MSwgeDEgPSB4MywgeDMgPSB0O1xuICAgIGlmICh4MiA+IHgzKSB0ID0gZTIsIGUyID0gZTMsIGUzID0gdCwgdCA9IHgyLCB4MiA9IHgzLCB4MyA9IHQ7XG4gICAgaWYgKHgxID4geDQpIHQgPSBlMSwgZTEgPSBlNCwgZTQgPSB0LCB0ID0geDEsIHgxID0geDQsIHg0ID0gdDtcbiAgICBpZiAoeDMgPiB4NCkgdCA9IGUzLCBlMyA9IGU0LCBlNCA9IHQsIHQgPSB4MywgeDMgPSB4NCwgeDQgPSB0O1xuICAgIGlmICh4MiA+IHg1KSB0ID0gZTIsIGUyID0gZTUsIGU1ID0gdCwgdCA9IHgyLCB4MiA9IHg1LCB4NSA9IHQ7XG4gICAgaWYgKHgyID4geDMpIHQgPSBlMiwgZTIgPSBlMywgZTMgPSB0LCB0ID0geDIsIHgyID0geDMsIHgzID0gdDtcbiAgICBpZiAoeDQgPiB4NSkgdCA9IGU0LCBlNCA9IGU1LCBlNSA9IHQsIHQgPSB4NCwgeDQgPSB4NSwgeDUgPSB0O1xuXG4gICAgdmFyIHBpdm90MSA9IGUyLCBwaXZvdFZhbHVlMSA9IHgyLFxuICAgICAgICBwaXZvdDIgPSBlNCwgcGl2b3RWYWx1ZTIgPSB4NDtcblxuICAgIC8vIGUyIGFuZCBlNCBoYXZlIGJlZW4gc2F2ZWQgaW4gdGhlIHBpdm90IHZhcmlhYmxlcy4gVGhleSB3aWxsIGJlIHdyaXR0ZW5cbiAgICAvLyBiYWNrLCBvbmNlIHRoZSBwYXJ0aXRpb25pbmcgaXMgZmluaXNoZWQuXG4gICAgYVtpMV0gPSBlMTtcbiAgICBhW2kyXSA9IGFbbG9dO1xuICAgIGFbaTNdID0gZTM7XG4gICAgYVtpNF0gPSBhW2hpIC0gMV07XG4gICAgYVtpNV0gPSBlNTtcblxuICAgIHZhciBsZXNzID0gbG8gKyAxLCAgIC8vIEZpcnN0IGVsZW1lbnQgaW4gdGhlIG1pZGRsZSBwYXJ0aXRpb24uXG4gICAgICAgIGdyZWF0ID0gaGkgLSAyOyAgLy8gTGFzdCBlbGVtZW50IGluIHRoZSBtaWRkbGUgcGFydGl0aW9uLlxuXG4gICAgLy8gTm90ZSB0aGF0IGZvciB2YWx1ZSBjb21wYXJpc29uLCA8LCA8PSwgPj0gYW5kID4gY29lcmNlIHRvIGEgcHJpbWl0aXZlIHZpYVxuICAgIC8vIE9iamVjdC5wcm90b3R5cGUudmFsdWVPZjsgPT0gYW5kID09PSBkbyBub3QsIHNvIGluIG9yZGVyIHRvIGJlIGNvbnNpc3RlbnRcbiAgICAvLyB3aXRoIG5hdHVyYWwgb3JkZXIgKHN1Y2ggYXMgZm9yIERhdGUgb2JqZWN0cyksIHdlIG11c3QgZG8gdHdvIGNvbXBhcmVzLlxuICAgIHZhciBwaXZvdHNFcXVhbCA9IHBpdm90VmFsdWUxIDw9IHBpdm90VmFsdWUyICYmIHBpdm90VmFsdWUxID49IHBpdm90VmFsdWUyO1xuICAgIGlmIChwaXZvdHNFcXVhbCkge1xuXG4gICAgICAvLyBEZWdlbmVyYXRlZCBjYXNlIHdoZXJlIHRoZSBwYXJ0aXRpb25pbmcgYmVjb21lcyBhIGR1dGNoIG5hdGlvbmFsIGZsYWdcbiAgICAgIC8vIHByb2JsZW0uXG4gICAgICAvL1xuICAgICAgLy8gWyB8ICA8IHBpdm90ICB8ID09IHBpdm90IHwgdW5wYXJ0aXRpb25lZCB8ID4gcGl2b3QgIHwgXVxuICAgICAgLy8gIF4gICAgICAgICAgICAgXiAgICAgICAgICBeICAgICAgICAgICAgIF4gICAgICAgICAgICBeXG4gICAgICAvLyBsZWZ0ICAgICAgICAgbGVzcyAgICAgICAgIGsgICAgICAgICAgIGdyZWF0ICAgICAgICAgcmlnaHRcbiAgICAgIC8vXG4gICAgICAvLyBhW2xlZnRdIGFuZCBhW3JpZ2h0XSBhcmUgdW5kZWZpbmVkIGFuZCBhcmUgZmlsbGVkIGFmdGVyIHRoZVxuICAgICAgLy8gcGFydGl0aW9uaW5nLlxuICAgICAgLy9cbiAgICAgIC8vIEludmFyaWFudHM6XG4gICAgICAvLyAgIDEpIGZvciB4IGluIF1sZWZ0LCBsZXNzWyA6IHggPCBwaXZvdC5cbiAgICAgIC8vICAgMikgZm9yIHggaW4gW2xlc3MsIGtbIDogeCA9PSBwaXZvdC5cbiAgICAgIC8vICAgMykgZm9yIHggaW4gXWdyZWF0LCByaWdodFsgOiB4ID4gcGl2b3QuXG4gICAgICBmb3IgKHZhciBrID0gbGVzczsgayA8PSBncmVhdDsgKytrKSB7XG4gICAgICAgIHZhciBlayA9IGFba10sIHhrID0gZihlayk7XG4gICAgICAgIGlmICh4ayA8IHBpdm90VmFsdWUxKSB7XG4gICAgICAgICAgaWYgKGsgIT09IGxlc3MpIHtcbiAgICAgICAgICAgIGFba10gPSBhW2xlc3NdO1xuICAgICAgICAgICAgYVtsZXNzXSA9IGVrO1xuICAgICAgICAgIH1cbiAgICAgICAgICArK2xlc3M7XG4gICAgICAgIH0gZWxzZSBpZiAoeGsgPiBwaXZvdFZhbHVlMSkge1xuXG4gICAgICAgICAgLy8gRmluZCB0aGUgZmlyc3QgZWxlbWVudCA8PSBwaXZvdCBpbiB0aGUgcmFuZ2UgW2sgLSAxLCBncmVhdF0gYW5kXG4gICAgICAgICAgLy8gcHV0IFs6ZWs6XSB0aGVyZS4gV2Uga25vdyB0aGF0IHN1Y2ggYW4gZWxlbWVudCBtdXN0IGV4aXN0OlxuICAgICAgICAgIC8vIFdoZW4gayA9PSBsZXNzLCB0aGVuIGVsMyAod2hpY2ggaXMgZXF1YWwgdG8gcGl2b3QpIGxpZXMgaW4gdGhlXG4gICAgICAgICAgLy8gaW50ZXJ2YWwuIE90aGVyd2lzZSBhW2sgLSAxXSA9PSBwaXZvdCBhbmQgdGhlIHNlYXJjaCBzdG9wcyBhdCBrLTEuXG4gICAgICAgICAgLy8gTm90ZSB0aGF0IGluIHRoZSBsYXR0ZXIgY2FzZSBpbnZhcmlhbnQgMiB3aWxsIGJlIHZpb2xhdGVkIGZvciBhXG4gICAgICAgICAgLy8gc2hvcnQgYW1vdW50IG9mIHRpbWUuIFRoZSBpbnZhcmlhbnQgd2lsbCBiZSByZXN0b3JlZCB3aGVuIHRoZVxuICAgICAgICAgIC8vIHBpdm90cyBhcmUgcHV0IGludG8gdGhlaXIgZmluYWwgcG9zaXRpb25zLlxuICAgICAgICAgIHdoaWxlICh0cnVlKSB7XG4gICAgICAgICAgICB2YXIgZ3JlYXRWYWx1ZSA9IGYoYVtncmVhdF0pO1xuICAgICAgICAgICAgaWYgKGdyZWF0VmFsdWUgPiBwaXZvdFZhbHVlMSkge1xuICAgICAgICAgICAgICBncmVhdC0tO1xuICAgICAgICAgICAgICAvLyBUaGlzIGlzIHRoZSBvbmx5IGxvY2F0aW9uIGluIHRoZSB3aGlsZS1sb29wIHdoZXJlIGEgbmV3XG4gICAgICAgICAgICAgIC8vIGl0ZXJhdGlvbiBpcyBzdGFydGVkLlxuICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoZ3JlYXRWYWx1ZSA8IHBpdm90VmFsdWUxKSB7XG4gICAgICAgICAgICAgIC8vIFRyaXBsZSBleGNoYW5nZS5cbiAgICAgICAgICAgICAgYVtrXSA9IGFbbGVzc107XG4gICAgICAgICAgICAgIGFbbGVzcysrXSA9IGFbZ3JlYXRdO1xuICAgICAgICAgICAgICBhW2dyZWF0LS1dID0gZWs7XG4gICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgYVtrXSA9IGFbZ3JlYXRdO1xuICAgICAgICAgICAgICBhW2dyZWF0LS1dID0gZWs7XG4gICAgICAgICAgICAgIC8vIE5vdGU6IGlmIGdyZWF0IDwgayB0aGVuIHdlIHdpbGwgZXhpdCB0aGUgb3V0ZXIgbG9vcCBhbmQgZml4XG4gICAgICAgICAgICAgIC8vIGludmFyaWFudCAyICh3aGljaCB3ZSBqdXN0IHZpb2xhdGVkKS5cbiAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfSBlbHNlIHtcblxuICAgICAgLy8gV2UgcGFydGl0aW9uIHRoZSBsaXN0IGludG8gdGhyZWUgcGFydHM6XG4gICAgICAvLyAgMS4gPCBwaXZvdDFcbiAgICAgIC8vICAyLiA+PSBwaXZvdDEgJiYgPD0gcGl2b3QyXG4gICAgICAvLyAgMy4gPiBwaXZvdDJcbiAgICAgIC8vXG4gICAgICAvLyBEdXJpbmcgdGhlIGxvb3Agd2UgaGF2ZTpcbiAgICAgIC8vIFsgfCA8IHBpdm90MSB8ID49IHBpdm90MSAmJiA8PSBwaXZvdDIgfCB1bnBhcnRpdGlvbmVkICB8ID4gcGl2b3QyICB8IF1cbiAgICAgIC8vICBeICAgICAgICAgICAgXiAgICAgICAgICAgICAgICAgICAgICAgIF4gICAgICAgICAgICAgIF4gICAgICAgICAgICAgXlxuICAgICAgLy8gbGVmdCAgICAgICAgIGxlc3MgICAgICAgICAgICAgICAgICAgICBrICAgICAgICAgICAgICBncmVhdCAgICAgICAgcmlnaHRcbiAgICAgIC8vXG4gICAgICAvLyBhW2xlZnRdIGFuZCBhW3JpZ2h0XSBhcmUgdW5kZWZpbmVkIGFuZCBhcmUgZmlsbGVkIGFmdGVyIHRoZVxuICAgICAgLy8gcGFydGl0aW9uaW5nLlxuICAgICAgLy9cbiAgICAgIC8vIEludmFyaWFudHM6XG4gICAgICAvLyAgIDEuIGZvciB4IGluIF1sZWZ0LCBsZXNzWyA6IHggPCBwaXZvdDFcbiAgICAgIC8vICAgMi4gZm9yIHggaW4gW2xlc3MsIGtbIDogcGl2b3QxIDw9IHggJiYgeCA8PSBwaXZvdDJcbiAgICAgIC8vICAgMy4gZm9yIHggaW4gXWdyZWF0LCByaWdodFsgOiB4ID4gcGl2b3QyXG4gICAgICBmb3IgKHZhciBrID0gbGVzczsgayA8PSBncmVhdDsgaysrKSB7XG4gICAgICAgIHZhciBlayA9IGFba10sIHhrID0gZihlayk7XG4gICAgICAgIGlmICh4ayA8IHBpdm90VmFsdWUxKSB7XG4gICAgICAgICAgaWYgKGsgIT09IGxlc3MpIHtcbiAgICAgICAgICAgIGFba10gPSBhW2xlc3NdO1xuICAgICAgICAgICAgYVtsZXNzXSA9IGVrO1xuICAgICAgICAgIH1cbiAgICAgICAgICArK2xlc3M7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgaWYgKHhrID4gcGl2b3RWYWx1ZTIpIHtcbiAgICAgICAgICAgIHdoaWxlICh0cnVlKSB7XG4gICAgICAgICAgICAgIHZhciBncmVhdFZhbHVlID0gZihhW2dyZWF0XSk7XG4gICAgICAgICAgICAgIGlmIChncmVhdFZhbHVlID4gcGl2b3RWYWx1ZTIpIHtcbiAgICAgICAgICAgICAgICBncmVhdC0tO1xuICAgICAgICAgICAgICAgIGlmIChncmVhdCA8IGspIGJyZWFrO1xuICAgICAgICAgICAgICAgIC8vIFRoaXMgaXMgdGhlIG9ubHkgbG9jYXRpb24gaW5zaWRlIHRoZSBsb29wIHdoZXJlIGEgbmV3XG4gICAgICAgICAgICAgICAgLy8gaXRlcmF0aW9uIGlzIHN0YXJ0ZWQuXG4gICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgLy8gYVtncmVhdF0gPD0gcGl2b3QyLlxuICAgICAgICAgICAgICAgIGlmIChncmVhdFZhbHVlIDwgcGl2b3RWYWx1ZTEpIHtcbiAgICAgICAgICAgICAgICAgIC8vIFRyaXBsZSBleGNoYW5nZS5cbiAgICAgICAgICAgICAgICAgIGFba10gPSBhW2xlc3NdO1xuICAgICAgICAgICAgICAgICAgYVtsZXNzKytdID0gYVtncmVhdF07XG4gICAgICAgICAgICAgICAgICBhW2dyZWF0LS1dID0gZWs7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgIC8vIGFbZ3JlYXRdID49IHBpdm90MS5cbiAgICAgICAgICAgICAgICAgIGFba10gPSBhW2dyZWF0XTtcbiAgICAgICAgICAgICAgICAgIGFbZ3JlYXQtLV0gPSBlaztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBNb3ZlIHBpdm90cyBpbnRvIHRoZWlyIGZpbmFsIHBvc2l0aW9ucy5cbiAgICAvLyBXZSBzaHJ1bmsgdGhlIGxpc3QgZnJvbSBib3RoIHNpZGVzIChhW2xlZnRdIGFuZCBhW3JpZ2h0XSBoYXZlXG4gICAgLy8gbWVhbmluZ2xlc3MgdmFsdWVzIGluIHRoZW0pIGFuZCBub3cgd2UgbW92ZSBlbGVtZW50cyBmcm9tIHRoZSBmaXJzdFxuICAgIC8vIGFuZCB0aGlyZCBwYXJ0aXRpb24gaW50byB0aGVzZSBsb2NhdGlvbnMgc28gdGhhdCB3ZSBjYW4gc3RvcmUgdGhlXG4gICAgLy8gcGl2b3RzLlxuICAgIGFbbG9dID0gYVtsZXNzIC0gMV07XG4gICAgYVtsZXNzIC0gMV0gPSBwaXZvdDE7XG4gICAgYVtoaSAtIDFdID0gYVtncmVhdCArIDFdO1xuICAgIGFbZ3JlYXQgKyAxXSA9IHBpdm90MjtcblxuICAgIC8vIFRoZSBsaXN0IGlzIG5vdyBwYXJ0aXRpb25lZCBpbnRvIHRocmVlIHBhcnRpdGlvbnM6XG4gICAgLy8gWyA8IHBpdm90MSAgIHwgPj0gcGl2b3QxICYmIDw9IHBpdm90MiAgIHwgID4gcGl2b3QyICAgXVxuICAgIC8vICBeICAgICAgICAgICAgXiAgICAgICAgICAgICAgICAgICAgICAgIF4gICAgICAgICAgICAgXlxuICAgIC8vIGxlZnQgICAgICAgICBsZXNzICAgICAgICAgICAgICAgICAgICAgZ3JlYXQgICAgICAgIHJpZ2h0XG5cbiAgICAvLyBSZWN1cnNpdmUgZGVzY2VudC4gKERvbid0IGluY2x1ZGUgdGhlIHBpdm90IHZhbHVlcy4pXG4gICAgc29ydChhLCBsbywgbGVzcyAtIDEpO1xuICAgIHNvcnQoYSwgZ3JlYXQgKyAyLCBoaSk7XG5cbiAgICBpZiAocGl2b3RzRXF1YWwpIHtcbiAgICAgIC8vIEFsbCBlbGVtZW50cyBpbiB0aGUgc2Vjb25kIHBhcnRpdGlvbiBhcmUgZXF1YWwgdG8gdGhlIHBpdm90LiBOb1xuICAgICAgLy8gbmVlZCB0byBzb3J0IHRoZW0uXG4gICAgICByZXR1cm4gYTtcbiAgICB9XG5cbiAgICAvLyBJbiB0aGVvcnkgaXQgc2hvdWxkIGJlIGVub3VnaCB0byBjYWxsIF9kb1NvcnQgcmVjdXJzaXZlbHkgb24gdGhlIHNlY29uZFxuICAgIC8vIHBhcnRpdGlvbi5cbiAgICAvLyBUaGUgQW5kcm9pZCBzb3VyY2UgaG93ZXZlciByZW1vdmVzIHRoZSBwaXZvdCBlbGVtZW50cyBmcm9tIHRoZSByZWN1cnNpdmVcbiAgICAvLyBjYWxsIGlmIHRoZSBzZWNvbmQgcGFydGl0aW9uIGlzIHRvbyBsYXJnZSAobW9yZSB0aGFuIDIvMyBvZiB0aGUgbGlzdCkuXG4gICAgaWYgKGxlc3MgPCBpMSAmJiBncmVhdCA+IGk1KSB7XG4gICAgICB2YXIgbGVzc1ZhbHVlLCBncmVhdFZhbHVlO1xuICAgICAgd2hpbGUgKChsZXNzVmFsdWUgPSBmKGFbbGVzc10pKSA8PSBwaXZvdFZhbHVlMSAmJiBsZXNzVmFsdWUgPj0gcGl2b3RWYWx1ZTEpICsrbGVzcztcbiAgICAgIHdoaWxlICgoZ3JlYXRWYWx1ZSA9IGYoYVtncmVhdF0pKSA8PSBwaXZvdFZhbHVlMiAmJiBncmVhdFZhbHVlID49IHBpdm90VmFsdWUyKSAtLWdyZWF0O1xuXG4gICAgICAvLyBDb3B5IHBhc3RlIG9mIHRoZSBwcmV2aW91cyAzLXdheSBwYXJ0aXRpb25pbmcgd2l0aCBhZGFwdGlvbnMuXG4gICAgICAvL1xuICAgICAgLy8gV2UgcGFydGl0aW9uIHRoZSBsaXN0IGludG8gdGhyZWUgcGFydHM6XG4gICAgICAvLyAgMS4gPT0gcGl2b3QxXG4gICAgICAvLyAgMi4gPiBwaXZvdDEgJiYgPCBwaXZvdDJcbiAgICAgIC8vICAzLiA9PSBwaXZvdDJcbiAgICAgIC8vXG4gICAgICAvLyBEdXJpbmcgdGhlIGxvb3Agd2UgaGF2ZTpcbiAgICAgIC8vIFsgPT0gcGl2b3QxIHwgPiBwaXZvdDEgJiYgPCBwaXZvdDIgfCB1bnBhcnRpdGlvbmVkICB8ID09IHBpdm90MiBdXG4gICAgICAvLyAgICAgICAgICAgICAgXiAgICAgICAgICAgICAgICAgICAgICBeICAgICAgICAgICAgICBeXG4gICAgICAvLyAgICAgICAgICAgIGxlc3MgICAgICAgICAgICAgICAgICAgICBrICAgICAgICAgICAgICBncmVhdFxuICAgICAgLy9cbiAgICAgIC8vIEludmFyaWFudHM6XG4gICAgICAvLyAgIDEuIGZvciB4IGluIFsgKiwgbGVzc1sgOiB4ID09IHBpdm90MVxuICAgICAgLy8gICAyLiBmb3IgeCBpbiBbbGVzcywga1sgOiBwaXZvdDEgPCB4ICYmIHggPCBwaXZvdDJcbiAgICAgIC8vICAgMy4gZm9yIHggaW4gXWdyZWF0LCAqIF0gOiB4ID09IHBpdm90MlxuICAgICAgZm9yICh2YXIgayA9IGxlc3M7IGsgPD0gZ3JlYXQ7IGsrKykge1xuICAgICAgICB2YXIgZWsgPSBhW2tdLCB4ayA9IGYoZWspO1xuICAgICAgICBpZiAoeGsgPD0gcGl2b3RWYWx1ZTEgJiYgeGsgPj0gcGl2b3RWYWx1ZTEpIHtcbiAgICAgICAgICBpZiAoayAhPT0gbGVzcykge1xuICAgICAgICAgICAgYVtrXSA9IGFbbGVzc107XG4gICAgICAgICAgICBhW2xlc3NdID0gZWs7XG4gICAgICAgICAgfVxuICAgICAgICAgIGxlc3MrKztcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBpZiAoeGsgPD0gcGl2b3RWYWx1ZTIgJiYgeGsgPj0gcGl2b3RWYWx1ZTIpIHtcbiAgICAgICAgICAgIHdoaWxlICh0cnVlKSB7XG4gICAgICAgICAgICAgIHZhciBncmVhdFZhbHVlID0gZihhW2dyZWF0XSk7XG4gICAgICAgICAgICAgIGlmIChncmVhdFZhbHVlIDw9IHBpdm90VmFsdWUyICYmIGdyZWF0VmFsdWUgPj0gcGl2b3RWYWx1ZTIpIHtcbiAgICAgICAgICAgICAgICBncmVhdC0tO1xuICAgICAgICAgICAgICAgIGlmIChncmVhdCA8IGspIGJyZWFrO1xuICAgICAgICAgICAgICAgIC8vIFRoaXMgaXMgdGhlIG9ubHkgbG9jYXRpb24gaW5zaWRlIHRoZSBsb29wIHdoZXJlIGEgbmV3XG4gICAgICAgICAgICAgICAgLy8gaXRlcmF0aW9uIGlzIHN0YXJ0ZWQuXG4gICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgLy8gYVtncmVhdF0gPCBwaXZvdDIuXG4gICAgICAgICAgICAgICAgaWYgKGdyZWF0VmFsdWUgPCBwaXZvdFZhbHVlMSkge1xuICAgICAgICAgICAgICAgICAgLy8gVHJpcGxlIGV4Y2hhbmdlLlxuICAgICAgICAgICAgICAgICAgYVtrXSA9IGFbbGVzc107XG4gICAgICAgICAgICAgICAgICBhW2xlc3MrK10gPSBhW2dyZWF0XTtcbiAgICAgICAgICAgICAgICAgIGFbZ3JlYXQtLV0gPSBlaztcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgLy8gYVtncmVhdF0gPT0gcGl2b3QxLlxuICAgICAgICAgICAgICAgICAgYVtrXSA9IGFbZ3JlYXRdO1xuICAgICAgICAgICAgICAgICAgYVtncmVhdC0tXSA9IGVrO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIC8vIFRoZSBzZWNvbmQgcGFydGl0aW9uIGhhcyBub3cgYmVlbiBjbGVhcmVkIG9mIHBpdm90IGVsZW1lbnRzIGFuZCBsb29rc1xuICAgIC8vIGFzIGZvbGxvd3M6XG4gICAgLy8gWyAgKiAgfCAgPiBwaXZvdDEgJiYgPCBwaXZvdDIgIHwgKiBdXG4gICAgLy8gICAgICAgIF4gICAgICAgICAgICAgICAgICAgICAgXlxuICAgIC8vICAgICAgIGxlc3MgICAgICAgICAgICAgICAgICBncmVhdFxuICAgIC8vIFNvcnQgdGhlIHNlY29uZCBwYXJ0aXRpb24gdXNpbmcgcmVjdXJzaXZlIGRlc2NlbnQuXG5cbiAgICAvLyBUaGUgc2Vjb25kIHBhcnRpdGlvbiBsb29rcyBhcyBmb2xsb3dzOlxuICAgIC8vIFsgICogIHwgID49IHBpdm90MSAmJiA8PSBwaXZvdDIgIHwgKiBdXG4gICAgLy8gICAgICAgIF4gICAgICAgICAgICAgICAgICAgICAgICBeXG4gICAgLy8gICAgICAgbGVzcyAgICAgICAgICAgICAgICAgICAgZ3JlYXRcbiAgICAvLyBTaW1wbHkgc29ydCBpdCBieSByZWN1cnNpdmUgZGVzY2VudC5cblxuICAgIHJldHVybiBzb3J0KGEsIGxlc3MsIGdyZWF0ICsgMSk7XG4gIH1cblxuICByZXR1cm4gc29ydDtcbn1cblxudmFyIHF1aWNrc29ydF9zaXplVGhyZXNob2xkID0gMzI7XG52YXIgY3Jvc3NmaWx0ZXJfYXJyYXk4ID0gY3Jvc3NmaWx0ZXJfYXJyYXlVbnR5cGVkLFxuICAgIGNyb3NzZmlsdGVyX2FycmF5MTYgPSBjcm9zc2ZpbHRlcl9hcnJheVVudHlwZWQsXG4gICAgY3Jvc3NmaWx0ZXJfYXJyYXkzMiA9IGNyb3NzZmlsdGVyX2FycmF5VW50eXBlZCxcbiAgICBjcm9zc2ZpbHRlcl9hcnJheUxlbmd0aGVuID0gY3Jvc3NmaWx0ZXJfYXJyYXlMZW5ndGhlblVudHlwZWQsXG4gICAgY3Jvc3NmaWx0ZXJfYXJyYXlXaWRlbiA9IGNyb3NzZmlsdGVyX2FycmF5V2lkZW5VbnR5cGVkO1xuXG5pZiAodHlwZW9mIFVpbnQ4QXJyYXkgIT09IFwidW5kZWZpbmVkXCIpIHtcbiAgY3Jvc3NmaWx0ZXJfYXJyYXk4ID0gZnVuY3Rpb24obikgeyByZXR1cm4gbmV3IFVpbnQ4QXJyYXkobik7IH07XG4gIGNyb3NzZmlsdGVyX2FycmF5MTYgPSBmdW5jdGlvbihuKSB7IHJldHVybiBuZXcgVWludDE2QXJyYXkobik7IH07XG4gIGNyb3NzZmlsdGVyX2FycmF5MzIgPSBmdW5jdGlvbihuKSB7IHJldHVybiBuZXcgVWludDMyQXJyYXkobik7IH07XG5cbiAgY3Jvc3NmaWx0ZXJfYXJyYXlMZW5ndGhlbiA9IGZ1bmN0aW9uKGFycmF5LCBsZW5ndGgpIHtcbiAgICBpZiAoYXJyYXkubGVuZ3RoID49IGxlbmd0aCkgcmV0dXJuIGFycmF5O1xuICAgIHZhciBjb3B5ID0gbmV3IGFycmF5LmNvbnN0cnVjdG9yKGxlbmd0aCk7XG4gICAgY29weS5zZXQoYXJyYXkpO1xuICAgIHJldHVybiBjb3B5O1xuICB9O1xuXG4gIGNyb3NzZmlsdGVyX2FycmF5V2lkZW4gPSBmdW5jdGlvbihhcnJheSwgd2lkdGgpIHtcbiAgICB2YXIgY29weTtcbiAgICBzd2l0Y2ggKHdpZHRoKSB7XG4gICAgICBjYXNlIDE2OiBjb3B5ID0gY3Jvc3NmaWx0ZXJfYXJyYXkxNihhcnJheS5sZW5ndGgpOyBicmVhaztcbiAgICAgIGNhc2UgMzI6IGNvcHkgPSBjcm9zc2ZpbHRlcl9hcnJheTMyKGFycmF5Lmxlbmd0aCk7IGJyZWFrO1xuICAgICAgZGVmYXVsdDogdGhyb3cgbmV3IEVycm9yKFwiaW52YWxpZCBhcnJheSB3aWR0aCFcIik7XG4gICAgfVxuICAgIGNvcHkuc2V0KGFycmF5KTtcbiAgICByZXR1cm4gY29weTtcbiAgfTtcbn1cblxuZnVuY3Rpb24gY3Jvc3NmaWx0ZXJfYXJyYXlVbnR5cGVkKG4pIHtcbiAgdmFyIGFycmF5ID0gbmV3IEFycmF5KG4pLCBpID0gLTE7XG4gIHdoaWxlICgrK2kgPCBuKSBhcnJheVtpXSA9IDA7XG4gIHJldHVybiBhcnJheTtcbn1cblxuZnVuY3Rpb24gY3Jvc3NmaWx0ZXJfYXJyYXlMZW5ndGhlblVudHlwZWQoYXJyYXksIGxlbmd0aCkge1xuICB2YXIgbiA9IGFycmF5Lmxlbmd0aDtcbiAgd2hpbGUgKG4gPCBsZW5ndGgpIGFycmF5W24rK10gPSAwO1xuICByZXR1cm4gYXJyYXk7XG59XG5cbmZ1bmN0aW9uIGNyb3NzZmlsdGVyX2FycmF5V2lkZW5VbnR5cGVkKGFycmF5LCB3aWR0aCkge1xuICBpZiAod2lkdGggPiAzMikgdGhyb3cgbmV3IEVycm9yKFwiaW52YWxpZCBhcnJheSB3aWR0aCFcIik7XG4gIHJldHVybiBhcnJheTtcbn1cbmZ1bmN0aW9uIGNyb3NzZmlsdGVyX2ZpbHRlckV4YWN0KGJpc2VjdCwgdmFsdWUpIHtcbiAgcmV0dXJuIGZ1bmN0aW9uKHZhbHVlcykge1xuICAgIHZhciBuID0gdmFsdWVzLmxlbmd0aDtcbiAgICByZXR1cm4gW2Jpc2VjdC5sZWZ0KHZhbHVlcywgdmFsdWUsIDAsIG4pLCBiaXNlY3QucmlnaHQodmFsdWVzLCB2YWx1ZSwgMCwgbildO1xuICB9O1xufVxuXG5mdW5jdGlvbiBjcm9zc2ZpbHRlcl9maWx0ZXJSYW5nZShiaXNlY3QsIHJhbmdlKSB7XG4gIHZhciBtaW4gPSByYW5nZVswXSxcbiAgICAgIG1heCA9IHJhbmdlWzFdO1xuICByZXR1cm4gZnVuY3Rpb24odmFsdWVzKSB7XG4gICAgdmFyIG4gPSB2YWx1ZXMubGVuZ3RoO1xuICAgIHJldHVybiBbYmlzZWN0LmxlZnQodmFsdWVzLCBtaW4sIDAsIG4pLCBiaXNlY3QubGVmdCh2YWx1ZXMsIG1heCwgMCwgbildO1xuICB9O1xufVxuXG5mdW5jdGlvbiBjcm9zc2ZpbHRlcl9maWx0ZXJBbGwodmFsdWVzKSB7XG4gIHJldHVybiBbMCwgdmFsdWVzLmxlbmd0aF07XG59XG5mdW5jdGlvbiBjcm9zc2ZpbHRlcl9udWxsKCkge1xuICByZXR1cm4gbnVsbDtcbn1cbmZ1bmN0aW9uIGNyb3NzZmlsdGVyX3plcm8oKSB7XG4gIHJldHVybiAwO1xufVxuZnVuY3Rpb24gY3Jvc3NmaWx0ZXJfcmVkdWNlSW5jcmVtZW50KHApIHtcbiAgcmV0dXJuIHAgKyAxO1xufVxuXG5mdW5jdGlvbiBjcm9zc2ZpbHRlcl9yZWR1Y2VEZWNyZW1lbnQocCkge1xuICByZXR1cm4gcCAtIDE7XG59XG5cbmZ1bmN0aW9uIGNyb3NzZmlsdGVyX3JlZHVjZUFkZChmKSB7XG4gIHJldHVybiBmdW5jdGlvbihwLCB2KSB7XG4gICAgcmV0dXJuIHAgKyArZih2KTtcbiAgfTtcbn1cblxuZnVuY3Rpb24gY3Jvc3NmaWx0ZXJfcmVkdWNlU3VidHJhY3QoZikge1xuICByZXR1cm4gZnVuY3Rpb24ocCwgdikge1xuICAgIHJldHVybiBwIC0gZih2KTtcbiAgfTtcbn1cbmV4cG9ydHMuY3Jvc3NmaWx0ZXIgPSBjcm9zc2ZpbHRlcjtcblxuZnVuY3Rpb24gY3Jvc3NmaWx0ZXIoKSB7XG4gIHZhciBjcm9zc2ZpbHRlciA9IHtcbiAgICBhZGQ6IGFkZCxcbiAgICByZW1vdmU6IHJlbW92ZURhdGEsXG4gICAgZGltZW5zaW9uOiBkaW1lbnNpb24sXG4gICAgZ3JvdXBBbGw6IGdyb3VwQWxsLFxuICAgIHNpemU6IHNpemVcbiAgfTtcblxuICB2YXIgZGF0YSA9IFtdLCAvLyB0aGUgcmVjb3Jkc1xuICAgICAgbiA9IDAsIC8vIHRoZSBudW1iZXIgb2YgcmVjb3JkczsgZGF0YS5sZW5ndGhcbiAgICAgIG0gPSAwLCAvLyBhIGJpdCBtYXNrIHJlcHJlc2VudGluZyB3aGljaCBkaW1lbnNpb25zIGFyZSBpbiB1c2VcbiAgICAgIE0gPSA4LCAvLyBudW1iZXIgb2YgZGltZW5zaW9ucyB0aGF0IGNhbiBmaXQgaW4gYGZpbHRlcnNgXG4gICAgICBmaWx0ZXJzID0gY3Jvc3NmaWx0ZXJfYXJyYXk4KDApLCAvLyBNIGJpdHMgcGVyIHJlY29yZDsgMSBpcyBmaWx0ZXJlZCBvdXRcbiAgICAgIGZpbHRlckxpc3RlbmVycyA9IFtdLCAvLyB3aGVuIHRoZSBmaWx0ZXJzIGNoYW5nZVxuICAgICAgZGF0YUxpc3RlbmVycyA9IFtdLCAvLyB3aGVuIGRhdGEgaXMgYWRkZWRcbiAgICAgIHJlbW92ZURhdGFMaXN0ZW5lcnMgPSBbXTsgLy8gd2hlbiBkYXRhIGlzIHJlbW92ZWRcblxuICAvLyBBZGRzIHRoZSBzcGVjaWZpZWQgbmV3IHJlY29yZHMgdG8gdGhpcyBjcm9zc2ZpbHRlci5cbiAgZnVuY3Rpb24gYWRkKG5ld0RhdGEpIHtcbiAgICB2YXIgbjAgPSBuLFxuICAgICAgICBuMSA9IG5ld0RhdGEubGVuZ3RoO1xuXG4gICAgLy8gSWYgdGhlcmUncyBhY3R1YWxseSBuZXcgZGF0YSB0byBhZGTigKZcbiAgICAvLyBNZXJnZSB0aGUgbmV3IGRhdGEgaW50byB0aGUgZXhpc3RpbmcgZGF0YS5cbiAgICAvLyBMZW5ndGhlbiB0aGUgZmlsdGVyIGJpdHNldCB0byBoYW5kbGUgdGhlIG5ldyByZWNvcmRzLlxuICAgIC8vIE5vdGlmeSBsaXN0ZW5lcnMgKGRpbWVuc2lvbnMgYW5kIGdyb3VwcykgdGhhdCBuZXcgZGF0YSBpcyBhdmFpbGFibGUuXG4gICAgaWYgKG4xKSB7XG4gICAgICBkYXRhID0gZGF0YS5jb25jYXQobmV3RGF0YSk7XG4gICAgICBmaWx0ZXJzID0gY3Jvc3NmaWx0ZXJfYXJyYXlMZW5ndGhlbihmaWx0ZXJzLCBuICs9IG4xKTtcbiAgICAgIGRhdGFMaXN0ZW5lcnMuZm9yRWFjaChmdW5jdGlvbihsKSB7IGwobmV3RGF0YSwgbjAsIG4xKTsgfSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIGNyb3NzZmlsdGVyO1xuICB9XG5cbiAgLy8gUmVtb3ZlcyBhbGwgcmVjb3JkcyB0aGF0IG1hdGNoIHRoZSBjdXJyZW50IGZpbHRlcnMuXG4gIGZ1bmN0aW9uIHJlbW92ZURhdGEoKSB7XG4gICAgdmFyIG5ld0luZGV4ID0gY3Jvc3NmaWx0ZXJfaW5kZXgobiwgbiksXG4gICAgICAgIHJlbW92ZWQgPSBbXTtcbiAgICBmb3IgKHZhciBpID0gMCwgaiA9IDA7IGkgPCBuOyArK2kpIHtcbiAgICAgIGlmIChmaWx0ZXJzW2ldKSBuZXdJbmRleFtpXSA9IGorKztcbiAgICAgIGVsc2UgcmVtb3ZlZC5wdXNoKGkpO1xuICAgIH1cblxuICAgIC8vIFJlbW92ZSBhbGwgbWF0Y2hpbmcgcmVjb3JkcyBmcm9tIGdyb3Vwcy5cbiAgICBmaWx0ZXJMaXN0ZW5lcnMuZm9yRWFjaChmdW5jdGlvbihsKSB7IGwoMCwgW10sIHJlbW92ZWQpOyB9KTtcblxuICAgIC8vIFVwZGF0ZSBpbmRleGVzLlxuICAgIHJlbW92ZURhdGFMaXN0ZW5lcnMuZm9yRWFjaChmdW5jdGlvbihsKSB7IGwobmV3SW5kZXgpOyB9KTtcblxuICAgIC8vIFJlbW92ZSBvbGQgZmlsdGVycyBhbmQgZGF0YSBieSBvdmVyd3JpdGluZy5cbiAgICBmb3IgKHZhciBpID0gMCwgaiA9IDAsIGs7IGkgPCBuOyArK2kpIHtcbiAgICAgIGlmIChrID0gZmlsdGVyc1tpXSkge1xuICAgICAgICBpZiAoaSAhPT0gaikgZmlsdGVyc1tqXSA9IGssIGRhdGFbal0gPSBkYXRhW2ldO1xuICAgICAgICArK2o7XG4gICAgICB9XG4gICAgfVxuICAgIGRhdGEubGVuZ3RoID0gajtcbiAgICB3aGlsZSAobiA+IGopIGZpbHRlcnNbLS1uXSA9IDA7XG4gIH1cblxuICAvLyBBZGRzIGEgbmV3IGRpbWVuc2lvbiB3aXRoIHRoZSBzcGVjaWZpZWQgdmFsdWUgYWNjZXNzb3IgZnVuY3Rpb24uXG4gIGZ1bmN0aW9uIGRpbWVuc2lvbih2YWx1ZSkge1xuICAgIHZhciBkaW1lbnNpb24gPSB7XG4gICAgICBmaWx0ZXI6IGZpbHRlcixcbiAgICAgIGZpbHRlckV4YWN0OiBmaWx0ZXJFeGFjdCxcbiAgICAgIGZpbHRlclJhbmdlOiBmaWx0ZXJSYW5nZSxcbiAgICAgIGZpbHRlckZ1bmN0aW9uOiBmaWx0ZXJGdW5jdGlvbixcbiAgICAgIGZpbHRlckFsbDogZmlsdGVyQWxsLFxuICAgICAgdG9wOiB0b3AsXG4gICAgICBib3R0b206IGJvdHRvbSxcbiAgICAgIGdyb3VwOiBncm91cCxcbiAgICAgIGdyb3VwQWxsOiBncm91cEFsbCxcbiAgICAgIGRpc3Bvc2U6IGRpc3Bvc2UsXG4gICAgICByZW1vdmU6IGRpc3Bvc2UgLy8gZm9yIGJhY2t3YXJkcy1jb21wYXRpYmlsaXR5XG4gICAgfTtcblxuICAgIHZhciBvbmUgPSB+bSAmIC1+bSwgLy8gbG93ZXN0IHVuc2V0IGJpdCBhcyBtYXNrLCBlLmcuLCAwMDAwMTAwMFxuICAgICAgICB6ZXJvID0gfm9uZSwgLy8gaW52ZXJ0ZWQgb25lLCBlLmcuLCAxMTExMDExMVxuICAgICAgICB2YWx1ZXMsIC8vIHNvcnRlZCwgY2FjaGVkIGFycmF5XG4gICAgICAgIGluZGV4LCAvLyB2YWx1ZSByYW5rIOKGpiBvYmplY3QgaWRcbiAgICAgICAgbmV3VmFsdWVzLCAvLyB0ZW1wb3JhcnkgYXJyYXkgc3RvcmluZyBuZXdseS1hZGRlZCB2YWx1ZXNcbiAgICAgICAgbmV3SW5kZXgsIC8vIHRlbXBvcmFyeSBhcnJheSBzdG9yaW5nIG5ld2x5LWFkZGVkIGluZGV4XG4gICAgICAgIHNvcnQgPSBxdWlja3NvcnRfYnkoZnVuY3Rpb24oaSkgeyByZXR1cm4gbmV3VmFsdWVzW2ldOyB9KSxcbiAgICAgICAgcmVmaWx0ZXIgPSBjcm9zc2ZpbHRlcl9maWx0ZXJBbGwsIC8vIGZvciByZWNvbXB1dGluZyBmaWx0ZXJcbiAgICAgICAgcmVmaWx0ZXJGdW5jdGlvbiwgLy8gdGhlIGN1c3RvbSBmaWx0ZXIgZnVuY3Rpb24gaW4gdXNlXG4gICAgICAgIGluZGV4TGlzdGVuZXJzID0gW10sIC8vIHdoZW4gZGF0YSBpcyBhZGRlZFxuICAgICAgICBkaW1lbnNpb25Hcm91cHMgPSBbXSxcbiAgICAgICAgbG8wID0gMCxcbiAgICAgICAgaGkwID0gMDtcblxuICAgIC8vIFVwZGF0aW5nIGEgZGltZW5zaW9uIGlzIGEgdHdvLXN0YWdlIHByb2Nlc3MuIEZpcnN0LCB3ZSBtdXN0IHVwZGF0ZSB0aGVcbiAgICAvLyBhc3NvY2lhdGVkIGZpbHRlcnMgZm9yIHRoZSBuZXdseS1hZGRlZCByZWNvcmRzLiBPbmNlIGFsbCBkaW1lbnNpb25zIGhhdmVcbiAgICAvLyB1cGRhdGVkIHRoZWlyIGZpbHRlcnMsIHRoZSBncm91cHMgYXJlIG5vdGlmaWVkIHRvIHVwZGF0ZS5cbiAgICBkYXRhTGlzdGVuZXJzLnVuc2hpZnQocHJlQWRkKTtcbiAgICBkYXRhTGlzdGVuZXJzLnB1c2gocG9zdEFkZCk7XG5cbiAgICByZW1vdmVEYXRhTGlzdGVuZXJzLnB1c2gocmVtb3ZlRGF0YSk7XG5cbiAgICAvLyBJbmNvcnBvcmF0ZSBhbnkgZXhpc3RpbmcgZGF0YSBpbnRvIHRoaXMgZGltZW5zaW9uLCBhbmQgbWFrZSBzdXJlIHRoYXQgdGhlXG4gICAgLy8gZmlsdGVyIGJpdHNldCBpcyB3aWRlIGVub3VnaCB0byBoYW5kbGUgdGhlIG5ldyBkaW1lbnNpb24uXG4gICAgbSB8PSBvbmU7XG4gICAgaWYgKE0gPj0gMzIgPyAhb25lIDogbSAmICgxIDw8IE0pIC0gMSkge1xuICAgICAgZmlsdGVycyA9IGNyb3NzZmlsdGVyX2FycmF5V2lkZW4oZmlsdGVycywgTSA8PD0gMSk7XG4gICAgfVxuICAgIHByZUFkZChkYXRhLCAwLCBuKTtcbiAgICBwb3N0QWRkKGRhdGEsIDAsIG4pO1xuXG4gICAgLy8gSW5jb3Jwb3JhdGVzIHRoZSBzcGVjaWZpZWQgbmV3IHJlY29yZHMgaW50byB0aGlzIGRpbWVuc2lvbi5cbiAgICAvLyBUaGlzIGZ1bmN0aW9uIGlzIHJlc3BvbnNpYmxlIGZvciB1cGRhdGluZyBmaWx0ZXJzLCB2YWx1ZXMsIGFuZCBpbmRleC5cbiAgICBmdW5jdGlvbiBwcmVBZGQobmV3RGF0YSwgbjAsIG4xKSB7XG5cbiAgICAgIC8vIFBlcm11dGUgbmV3IHZhbHVlcyBpbnRvIG5hdHVyYWwgb3JkZXIgdXNpbmcgYSBzb3J0ZWQgaW5kZXguXG4gICAgICBuZXdWYWx1ZXMgPSBuZXdEYXRhLm1hcCh2YWx1ZSk7XG4gICAgICBuZXdJbmRleCA9IHNvcnQoY3Jvc3NmaWx0ZXJfcmFuZ2UobjEpLCAwLCBuMSk7XG4gICAgICBuZXdWYWx1ZXMgPSBwZXJtdXRlKG5ld1ZhbHVlcywgbmV3SW5kZXgpO1xuXG4gICAgICAvLyBCaXNlY3QgbmV3VmFsdWVzIHRvIGRldGVybWluZSB3aGljaCBuZXcgcmVjb3JkcyBhcmUgc2VsZWN0ZWQuXG4gICAgICB2YXIgYm91bmRzID0gcmVmaWx0ZXIobmV3VmFsdWVzKSwgbG8xID0gYm91bmRzWzBdLCBoaTEgPSBib3VuZHNbMV0sIGk7XG4gICAgICBpZiAocmVmaWx0ZXJGdW5jdGlvbikge1xuICAgICAgICBmb3IgKGkgPSAwOyBpIDwgbjE7ICsraSkge1xuICAgICAgICAgIGlmICghcmVmaWx0ZXJGdW5jdGlvbihuZXdWYWx1ZXNbaV0sIGkpKSBmaWx0ZXJzW25ld0luZGV4W2ldICsgbjBdIHw9IG9uZTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgZm9yIChpID0gMDsgaSA8IGxvMTsgKytpKSBmaWx0ZXJzW25ld0luZGV4W2ldICsgbjBdIHw9IG9uZTtcbiAgICAgICAgZm9yIChpID0gaGkxOyBpIDwgbjE7ICsraSkgZmlsdGVyc1tuZXdJbmRleFtpXSArIG4wXSB8PSBvbmU7XG4gICAgICB9XG5cbiAgICAgIC8vIElmIHRoaXMgZGltZW5zaW9uIHByZXZpb3VzbHkgaGFkIG5vIGRhdGEsIHRoZW4gd2UgZG9uJ3QgbmVlZCB0byBkbyB0aGVcbiAgICAgIC8vIG1vcmUgZXhwZW5zaXZlIG1lcmdlIG9wZXJhdGlvbjsgdXNlIHRoZSBuZXcgdmFsdWVzIGFuZCBpbmRleCBhcy1pcy5cbiAgICAgIGlmICghbjApIHtcbiAgICAgICAgdmFsdWVzID0gbmV3VmFsdWVzO1xuICAgICAgICBpbmRleCA9IG5ld0luZGV4O1xuICAgICAgICBsbzAgPSBsbzE7XG4gICAgICAgIGhpMCA9IGhpMTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICB2YXIgb2xkVmFsdWVzID0gdmFsdWVzLFxuICAgICAgICAgIG9sZEluZGV4ID0gaW5kZXgsXG4gICAgICAgICAgaTAgPSAwLFxuICAgICAgICAgIGkxID0gMDtcblxuICAgICAgLy8gT3RoZXJ3aXNlLCBjcmVhdGUgbmV3IGFycmF5cyBpbnRvIHdoaWNoIHRvIG1lcmdlIG5ldyBhbmQgb2xkLlxuICAgICAgdmFsdWVzID0gbmV3IEFycmF5KG4pO1xuICAgICAgaW5kZXggPSBjcm9zc2ZpbHRlcl9pbmRleChuLCBuKTtcblxuICAgICAgLy8gTWVyZ2UgdGhlIG9sZCBhbmQgbmV3IHNvcnRlZCB2YWx1ZXMsIGFuZCBvbGQgYW5kIG5ldyBpbmRleC5cbiAgICAgIGZvciAoaSA9IDA7IGkwIDwgbjAgJiYgaTEgPCBuMTsgKytpKSB7XG4gICAgICAgIGlmIChvbGRWYWx1ZXNbaTBdIDwgbmV3VmFsdWVzW2kxXSkge1xuICAgICAgICAgIHZhbHVlc1tpXSA9IG9sZFZhbHVlc1tpMF07XG4gICAgICAgICAgaW5kZXhbaV0gPSBvbGRJbmRleFtpMCsrXTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB2YWx1ZXNbaV0gPSBuZXdWYWx1ZXNbaTFdO1xuICAgICAgICAgIGluZGV4W2ldID0gbmV3SW5kZXhbaTErK10gKyBuMDtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICAvLyBBZGQgYW55IHJlbWFpbmluZyBvbGQgdmFsdWVzLlxuICAgICAgZm9yICg7IGkwIDwgbjA7ICsraTAsICsraSkge1xuICAgICAgICB2YWx1ZXNbaV0gPSBvbGRWYWx1ZXNbaTBdO1xuICAgICAgICBpbmRleFtpXSA9IG9sZEluZGV4W2kwXTtcbiAgICAgIH1cblxuICAgICAgLy8gQWRkIGFueSByZW1haW5pbmcgbmV3IHZhbHVlcy5cbiAgICAgIGZvciAoOyBpMSA8IG4xOyArK2kxLCArK2kpIHtcbiAgICAgICAgdmFsdWVzW2ldID0gbmV3VmFsdWVzW2kxXTtcbiAgICAgICAgaW5kZXhbaV0gPSBuZXdJbmRleFtpMV0gKyBuMDtcbiAgICAgIH1cblxuICAgICAgLy8gQmlzZWN0IGFnYWluIHRvIHJlY29tcHV0ZSBsbzAgYW5kIGhpMC5cbiAgICAgIGJvdW5kcyA9IHJlZmlsdGVyKHZhbHVlcyksIGxvMCA9IGJvdW5kc1swXSwgaGkwID0gYm91bmRzWzFdO1xuICAgIH1cblxuICAgIC8vIFdoZW4gYWxsIGZpbHRlcnMgaGF2ZSB1cGRhdGVkLCBub3RpZnkgaW5kZXggbGlzdGVuZXJzIG9mIHRoZSBuZXcgdmFsdWVzLlxuICAgIGZ1bmN0aW9uIHBvc3RBZGQobmV3RGF0YSwgbjAsIG4xKSB7XG4gICAgICBpbmRleExpc3RlbmVycy5mb3JFYWNoKGZ1bmN0aW9uKGwpIHsgbChuZXdWYWx1ZXMsIG5ld0luZGV4LCBuMCwgbjEpOyB9KTtcbiAgICAgIG5ld1ZhbHVlcyA9IG5ld0luZGV4ID0gbnVsbDtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiByZW1vdmVEYXRhKHJlSW5kZXgpIHtcbiAgICAgIGZvciAodmFyIGkgPSAwLCBqID0gMCwgazsgaSA8IG47ICsraSkge1xuICAgICAgICBpZiAoZmlsdGVyc1trID0gaW5kZXhbaV1dKSB7XG4gICAgICAgICAgaWYgKGkgIT09IGopIHZhbHVlc1tqXSA9IHZhbHVlc1tpXTtcbiAgICAgICAgICBpbmRleFtqXSA9IHJlSW5kZXhba107XG4gICAgICAgICAgKytqO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICB2YWx1ZXMubGVuZ3RoID0gajtcbiAgICAgIHdoaWxlIChqIDwgbikgaW5kZXhbaisrXSA9IDA7XG5cbiAgICAgIC8vIEJpc2VjdCBhZ2FpbiB0byByZWNvbXB1dGUgbG8wIGFuZCBoaTAuXG4gICAgICB2YXIgYm91bmRzID0gcmVmaWx0ZXIodmFsdWVzKTtcbiAgICAgIGxvMCA9IGJvdW5kc1swXSwgaGkwID0gYm91bmRzWzFdO1xuICAgIH1cblxuICAgIC8vIFVwZGF0ZXMgdGhlIHNlbGVjdGVkIHZhbHVlcyBiYXNlZCBvbiB0aGUgc3BlY2lmaWVkIGJvdW5kcyBbbG8sIGhpXS5cbiAgICAvLyBUaGlzIGltcGxlbWVudGF0aW9uIGlzIHVzZWQgYnkgYWxsIHRoZSBwdWJsaWMgZmlsdGVyIG1ldGhvZHMuXG4gICAgZnVuY3Rpb24gZmlsdGVySW5kZXhCb3VuZHMoYm91bmRzKSB7XG4gICAgICB2YXIgbG8xID0gYm91bmRzWzBdLFxuICAgICAgICAgIGhpMSA9IGJvdW5kc1sxXTtcblxuICAgICAgaWYgKHJlZmlsdGVyRnVuY3Rpb24pIHtcbiAgICAgICAgcmVmaWx0ZXJGdW5jdGlvbiA9IG51bGw7XG4gICAgICAgIGZpbHRlckluZGV4RnVuY3Rpb24oZnVuY3Rpb24oZCwgaSkgeyByZXR1cm4gbG8xIDw9IGkgJiYgaSA8IGhpMTsgfSk7XG4gICAgICAgIGxvMCA9IGxvMTtcbiAgICAgICAgaGkwID0gaGkxO1xuICAgICAgICByZXR1cm4gZGltZW5zaW9uO1xuICAgICAgfVxuXG4gICAgICB2YXIgaSxcbiAgICAgICAgICBqLFxuICAgICAgICAgIGssXG4gICAgICAgICAgYWRkZWQgPSBbXSxcbiAgICAgICAgICByZW1vdmVkID0gW107XG5cbiAgICAgIC8vIEZhc3QgaW5jcmVtZW50YWwgdXBkYXRlIGJhc2VkIG9uIHByZXZpb3VzIGxvIGluZGV4LlxuICAgICAgaWYgKGxvMSA8IGxvMCkge1xuICAgICAgICBmb3IgKGkgPSBsbzEsIGogPSBNYXRoLm1pbihsbzAsIGhpMSk7IGkgPCBqOyArK2kpIHtcbiAgICAgICAgICBmaWx0ZXJzW2sgPSBpbmRleFtpXV0gXj0gb25lO1xuICAgICAgICAgIGFkZGVkLnB1c2goayk7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSBpZiAobG8xID4gbG8wKSB7XG4gICAgICAgIGZvciAoaSA9IGxvMCwgaiA9IE1hdGgubWluKGxvMSwgaGkwKTsgaSA8IGo7ICsraSkge1xuICAgICAgICAgIGZpbHRlcnNbayA9IGluZGV4W2ldXSBePSBvbmU7XG4gICAgICAgICAgcmVtb3ZlZC5wdXNoKGspO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIC8vIEZhc3QgaW5jcmVtZW50YWwgdXBkYXRlIGJhc2VkIG9uIHByZXZpb3VzIGhpIGluZGV4LlxuICAgICAgaWYgKGhpMSA+IGhpMCkge1xuICAgICAgICBmb3IgKGkgPSBNYXRoLm1heChsbzEsIGhpMCksIGogPSBoaTE7IGkgPCBqOyArK2kpIHtcbiAgICAgICAgICBmaWx0ZXJzW2sgPSBpbmRleFtpXV0gXj0gb25lO1xuICAgICAgICAgIGFkZGVkLnB1c2goayk7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSBpZiAoaGkxIDwgaGkwKSB7XG4gICAgICAgIGZvciAoaSA9IE1hdGgubWF4KGxvMCwgaGkxKSwgaiA9IGhpMDsgaSA8IGo7ICsraSkge1xuICAgICAgICAgIGZpbHRlcnNbayA9IGluZGV4W2ldXSBePSBvbmU7XG4gICAgICAgICAgcmVtb3ZlZC5wdXNoKGspO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGxvMCA9IGxvMTtcbiAgICAgIGhpMCA9IGhpMTtcbiAgICAgIGZpbHRlckxpc3RlbmVycy5mb3JFYWNoKGZ1bmN0aW9uKGwpIHsgbChvbmUsIGFkZGVkLCByZW1vdmVkKTsgfSk7XG4gICAgICByZXR1cm4gZGltZW5zaW9uO1xuICAgIH1cblxuICAgIC8vIEZpbHRlcnMgdGhpcyBkaW1lbnNpb24gdXNpbmcgdGhlIHNwZWNpZmllZCByYW5nZSwgdmFsdWUsIG9yIG51bGwuXG4gICAgLy8gSWYgdGhlIHJhbmdlIGlzIG51bGwsIHRoaXMgaXMgZXF1aXZhbGVudCB0byBmaWx0ZXJBbGwuXG4gICAgLy8gSWYgdGhlIHJhbmdlIGlzIGFuIGFycmF5LCB0aGlzIGlzIGVxdWl2YWxlbnQgdG8gZmlsdGVyUmFuZ2UuXG4gICAgLy8gT3RoZXJ3aXNlLCB0aGlzIGlzIGVxdWl2YWxlbnQgdG8gZmlsdGVyRXhhY3QuXG4gICAgZnVuY3Rpb24gZmlsdGVyKHJhbmdlKSB7XG4gICAgICByZXR1cm4gcmFuZ2UgPT0gbnVsbFxuICAgICAgICAgID8gZmlsdGVyQWxsKCkgOiBBcnJheS5pc0FycmF5KHJhbmdlKVxuICAgICAgICAgID8gZmlsdGVyUmFuZ2UocmFuZ2UpIDogdHlwZW9mIHJhbmdlID09PSBcImZ1bmN0aW9uXCJcbiAgICAgICAgICA/IGZpbHRlckZ1bmN0aW9uKHJhbmdlKVxuICAgICAgICAgIDogZmlsdGVyRXhhY3QocmFuZ2UpO1xuICAgIH1cblxuICAgIC8vIEZpbHRlcnMgdGhpcyBkaW1lbnNpb24gdG8gc2VsZWN0IHRoZSBleGFjdCB2YWx1ZS5cbiAgICBmdW5jdGlvbiBmaWx0ZXJFeGFjdCh2YWx1ZSkge1xuICAgICAgcmV0dXJuIGZpbHRlckluZGV4Qm91bmRzKChyZWZpbHRlciA9IGNyb3NzZmlsdGVyX2ZpbHRlckV4YWN0KGJpc2VjdCwgdmFsdWUpKSh2YWx1ZXMpKTtcbiAgICB9XG5cbiAgICAvLyBGaWx0ZXJzIHRoaXMgZGltZW5zaW9uIHRvIHNlbGVjdCB0aGUgc3BlY2lmaWVkIHJhbmdlIFtsbywgaGldLlxuICAgIC8vIFRoZSBsb3dlciBib3VuZCBpcyBpbmNsdXNpdmUsIGFuZCB0aGUgdXBwZXIgYm91bmQgaXMgZXhjbHVzaXZlLlxuICAgIGZ1bmN0aW9uIGZpbHRlclJhbmdlKHJhbmdlKSB7XG4gICAgICByZXR1cm4gZmlsdGVySW5kZXhCb3VuZHMoKHJlZmlsdGVyID0gY3Jvc3NmaWx0ZXJfZmlsdGVyUmFuZ2UoYmlzZWN0LCByYW5nZSkpKHZhbHVlcykpO1xuICAgIH1cblxuICAgIC8vIENsZWFycyBhbnkgZmlsdGVycyBvbiB0aGlzIGRpbWVuc2lvbi5cbiAgICBmdW5jdGlvbiBmaWx0ZXJBbGwoKSB7XG4gICAgICByZXR1cm4gZmlsdGVySW5kZXhCb3VuZHMoKHJlZmlsdGVyID0gY3Jvc3NmaWx0ZXJfZmlsdGVyQWxsKSh2YWx1ZXMpKTtcbiAgICB9XG5cbiAgICAvLyBGaWx0ZXJzIHRoaXMgZGltZW5zaW9uIHVzaW5nIGFuIGFyYml0cmFyeSBmdW5jdGlvbi5cbiAgICBmdW5jdGlvbiBmaWx0ZXJGdW5jdGlvbihmKSB7XG4gICAgICByZWZpbHRlciA9IGNyb3NzZmlsdGVyX2ZpbHRlckFsbDtcblxuICAgICAgZmlsdGVySW5kZXhGdW5jdGlvbihyZWZpbHRlckZ1bmN0aW9uID0gZik7XG5cbiAgICAgIGxvMCA9IDA7XG4gICAgICBoaTAgPSBuO1xuXG4gICAgICByZXR1cm4gZGltZW5zaW9uO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGZpbHRlckluZGV4RnVuY3Rpb24oZikge1xuICAgICAgdmFyIGksXG4gICAgICAgICAgayxcbiAgICAgICAgICB4LFxuICAgICAgICAgIGFkZGVkID0gW10sXG4gICAgICAgICAgcmVtb3ZlZCA9IFtdO1xuXG4gICAgICBmb3IgKGkgPSAwOyBpIDwgbjsgKytpKSB7XG4gICAgICAgIGlmICghKGZpbHRlcnNbayA9IGluZGV4W2ldXSAmIG9uZSkgXiAhISh4ID0gZih2YWx1ZXNbaV0sIGkpKSkge1xuICAgICAgICAgIGlmICh4KSBmaWx0ZXJzW2tdICY9IHplcm8sIGFkZGVkLnB1c2goayk7XG4gICAgICAgICAgZWxzZSBmaWx0ZXJzW2tdIHw9IG9uZSwgcmVtb3ZlZC5wdXNoKGspO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBmaWx0ZXJMaXN0ZW5lcnMuZm9yRWFjaChmdW5jdGlvbihsKSB7IGwob25lLCBhZGRlZCwgcmVtb3ZlZCk7IH0pO1xuICAgIH1cblxuICAgIC8vIFJldHVybnMgdGhlIHRvcCBLIHNlbGVjdGVkIHJlY29yZHMgYmFzZWQgb24gdGhpcyBkaW1lbnNpb24ncyBvcmRlci5cbiAgICAvLyBOb3RlOiBvYnNlcnZlcyB0aGlzIGRpbWVuc2lvbidzIGZpbHRlciwgdW5saWtlIGdyb3VwIGFuZCBncm91cEFsbC5cbiAgICBmdW5jdGlvbiB0b3Aoaykge1xuICAgICAgdmFyIGFycmF5ID0gW10sXG4gICAgICAgICAgaSA9IGhpMCxcbiAgICAgICAgICBqO1xuXG4gICAgICB3aGlsZSAoLS1pID49IGxvMCAmJiBrID4gMCkge1xuICAgICAgICBpZiAoIWZpbHRlcnNbaiA9IGluZGV4W2ldXSkge1xuICAgICAgICAgIGFycmF5LnB1c2goZGF0YVtqXSk7XG4gICAgICAgICAgLS1rO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBhcnJheTtcbiAgICB9XG5cbiAgICAvLyBSZXR1cm5zIHRoZSBib3R0b20gSyBzZWxlY3RlZCByZWNvcmRzIGJhc2VkIG9uIHRoaXMgZGltZW5zaW9uJ3Mgb3JkZXIuXG4gICAgLy8gTm90ZTogb2JzZXJ2ZXMgdGhpcyBkaW1lbnNpb24ncyBmaWx0ZXIsIHVubGlrZSBncm91cCBhbmQgZ3JvdXBBbGwuXG4gICAgZnVuY3Rpb24gYm90dG9tKGspIHtcbiAgICAgIHZhciBhcnJheSA9IFtdLFxuICAgICAgICAgIGkgPSBsbzAsXG4gICAgICAgICAgajtcblxuICAgICAgd2hpbGUgKGkgPCBoaTAgJiYgayA+IDApIHtcbiAgICAgICAgaWYgKCFmaWx0ZXJzW2ogPSBpbmRleFtpXV0pIHtcbiAgICAgICAgICBhcnJheS5wdXNoKGRhdGFbal0pO1xuICAgICAgICAgIC0taztcbiAgICAgICAgfVxuICAgICAgICBpKys7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBhcnJheTtcbiAgICB9XG5cbiAgICAvLyBBZGRzIGEgbmV3IGdyb3VwIHRvIHRoaXMgZGltZW5zaW9uLCB1c2luZyB0aGUgc3BlY2lmaWVkIGtleSBmdW5jdGlvbi5cbiAgICBmdW5jdGlvbiBncm91cChrZXkpIHtcbiAgICAgIHZhciBncm91cCA9IHtcbiAgICAgICAgdG9wOiB0b3AsXG4gICAgICAgIGFsbDogYWxsLFxuICAgICAgICByZWR1Y2U6IHJlZHVjZSxcbiAgICAgICAgcmVkdWNlQ291bnQ6IHJlZHVjZUNvdW50LFxuICAgICAgICByZWR1Y2VTdW06IHJlZHVjZVN1bSxcbiAgICAgICAgb3JkZXI6IG9yZGVyLFxuICAgICAgICBvcmRlck5hdHVyYWw6IG9yZGVyTmF0dXJhbCxcbiAgICAgICAgc2l6ZTogc2l6ZSxcbiAgICAgICAgZGlzcG9zZTogZGlzcG9zZSxcbiAgICAgICAgcmVtb3ZlOiBkaXNwb3NlIC8vIGZvciBiYWNrd2FyZHMtY29tcGF0aWJpbGl0eVxuICAgICAgfTtcblxuICAgICAgLy8gRW5zdXJlIHRoYXQgdGhpcyBncm91cCB3aWxsIGJlIHJlbW92ZWQgd2hlbiB0aGUgZGltZW5zaW9uIGlzIHJlbW92ZWQuXG4gICAgICBkaW1lbnNpb25Hcm91cHMucHVzaChncm91cCk7XG5cbiAgICAgIHZhciBncm91cHMsIC8vIGFycmF5IG9mIHtrZXksIHZhbHVlfVxuICAgICAgICAgIGdyb3VwSW5kZXgsIC8vIG9iamVjdCBpZCDihqYgZ3JvdXAgaWRcbiAgICAgICAgICBncm91cFdpZHRoID0gOCxcbiAgICAgICAgICBncm91cENhcGFjaXR5ID0gY3Jvc3NmaWx0ZXJfY2FwYWNpdHkoZ3JvdXBXaWR0aCksXG4gICAgICAgICAgayA9IDAsIC8vIGNhcmRpbmFsaXR5XG4gICAgICAgICAgc2VsZWN0LFxuICAgICAgICAgIGhlYXAsXG4gICAgICAgICAgcmVkdWNlQWRkLFxuICAgICAgICAgIHJlZHVjZVJlbW92ZSxcbiAgICAgICAgICByZWR1Y2VJbml0aWFsLFxuICAgICAgICAgIHVwZGF0ZSA9IGNyb3NzZmlsdGVyX251bGwsXG4gICAgICAgICAgcmVzZXQgPSBjcm9zc2ZpbHRlcl9udWxsLFxuICAgICAgICAgIHJlc2V0TmVlZGVkID0gdHJ1ZSxcbiAgICAgICAgICBncm91cEFsbCA9IGtleSA9PT0gY3Jvc3NmaWx0ZXJfbnVsbDtcblxuICAgICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPCAxKSBrZXkgPSBjcm9zc2ZpbHRlcl9pZGVudGl0eTtcblxuICAgICAgLy8gVGhlIGdyb3VwIGxpc3RlbnMgdG8gdGhlIGNyb3NzZmlsdGVyIGZvciB3aGVuIGFueSBkaW1lbnNpb24gY2hhbmdlcywgc29cbiAgICAgIC8vIHRoYXQgaXQgY2FuIHVwZGF0ZSB0aGUgYXNzb2NpYXRlZCByZWR1Y2UgdmFsdWVzLiBJdCBtdXN0IGFsc28gbGlzdGVuIHRvXG4gICAgICAvLyB0aGUgcGFyZW50IGRpbWVuc2lvbiBmb3Igd2hlbiBkYXRhIGlzIGFkZGVkLCBhbmQgY29tcHV0ZSBuZXcga2V5cy5cbiAgICAgIGZpbHRlckxpc3RlbmVycy5wdXNoKHVwZGF0ZSk7XG4gICAgICBpbmRleExpc3RlbmVycy5wdXNoKGFkZCk7XG4gICAgICByZW1vdmVEYXRhTGlzdGVuZXJzLnB1c2gocmVtb3ZlRGF0YSk7XG5cbiAgICAgIC8vIEluY29ycG9yYXRlIGFueSBleGlzdGluZyBkYXRhIGludG8gdGhlIGdyb3VwaW5nLlxuICAgICAgYWRkKHZhbHVlcywgaW5kZXgsIDAsIG4pO1xuXG4gICAgICAvLyBJbmNvcnBvcmF0ZXMgdGhlIHNwZWNpZmllZCBuZXcgdmFsdWVzIGludG8gdGhpcyBncm91cC5cbiAgICAgIC8vIFRoaXMgZnVuY3Rpb24gaXMgcmVzcG9uc2libGUgZm9yIHVwZGF0aW5nIGdyb3VwcyBhbmQgZ3JvdXBJbmRleC5cbiAgICAgIGZ1bmN0aW9uIGFkZChuZXdWYWx1ZXMsIG5ld0luZGV4LCBuMCwgbjEpIHtcbiAgICAgICAgdmFyIG9sZEdyb3VwcyA9IGdyb3VwcyxcbiAgICAgICAgICAgIHJlSW5kZXggPSBjcm9zc2ZpbHRlcl9pbmRleChrLCBncm91cENhcGFjaXR5KSxcbiAgICAgICAgICAgIGFkZCA9IHJlZHVjZUFkZCxcbiAgICAgICAgICAgIGluaXRpYWwgPSByZWR1Y2VJbml0aWFsLFxuICAgICAgICAgICAgazAgPSBrLCAvLyBvbGQgY2FyZGluYWxpdHlcbiAgICAgICAgICAgIGkwID0gMCwgLy8gaW5kZXggb2Ygb2xkIGdyb3VwXG4gICAgICAgICAgICBpMSA9IDAsIC8vIGluZGV4IG9mIG5ldyByZWNvcmRcbiAgICAgICAgICAgIGosIC8vIG9iamVjdCBpZFxuICAgICAgICAgICAgZzAsIC8vIG9sZCBncm91cFxuICAgICAgICAgICAgeDAsIC8vIG9sZCBrZXlcbiAgICAgICAgICAgIHgxLCAvLyBuZXcga2V5XG4gICAgICAgICAgICBnLCAvLyBncm91cCB0byBhZGRcbiAgICAgICAgICAgIHg7IC8vIGtleSBvZiBncm91cCB0byBhZGRcblxuICAgICAgICAvLyBJZiBhIHJlc2V0IGlzIG5lZWRlZCwgd2UgZG9uJ3QgbmVlZCB0byB1cGRhdGUgdGhlIHJlZHVjZSB2YWx1ZXMuXG4gICAgICAgIGlmIChyZXNldE5lZWRlZCkgYWRkID0gaW5pdGlhbCA9IGNyb3NzZmlsdGVyX251bGw7XG5cbiAgICAgICAgLy8gUmVzZXQgdGhlIG5ldyBncm91cHMgKGsgaXMgYSBsb3dlciBib3VuZCkuXG4gICAgICAgIC8vIEFsc28sIG1ha2Ugc3VyZSB0aGF0IGdyb3VwSW5kZXggZXhpc3RzIGFuZCBpcyBsb25nIGVub3VnaC5cbiAgICAgICAgZ3JvdXBzID0gbmV3IEFycmF5KGspLCBrID0gMDtcbiAgICAgICAgZ3JvdXBJbmRleCA9IGswID4gMSA/IGNyb3NzZmlsdGVyX2FycmF5TGVuZ3RoZW4oZ3JvdXBJbmRleCwgbikgOiBjcm9zc2ZpbHRlcl9pbmRleChuLCBncm91cENhcGFjaXR5KTtcblxuICAgICAgICAvLyBHZXQgdGhlIGZpcnN0IG9sZCBrZXkgKHgwIG9mIGcwKSwgaWYgaXQgZXhpc3RzLlxuICAgICAgICBpZiAoazApIHgwID0gKGcwID0gb2xkR3JvdXBzWzBdKS5rZXk7XG5cbiAgICAgICAgLy8gRmluZCB0aGUgZmlyc3QgbmV3IGtleSAoeDEpLCBza2lwcGluZyBOYU4ga2V5cy5cbiAgICAgICAgd2hpbGUgKGkxIDwgbjEgJiYgISgoeDEgPSBrZXkobmV3VmFsdWVzW2kxXSkpID49IHgxKSkgKytpMTtcblxuICAgICAgICAvLyBXaGlsZSBuZXcga2V5cyByZW1haW7igKZcbiAgICAgICAgd2hpbGUgKGkxIDwgbjEpIHtcblxuICAgICAgICAgIC8vIERldGVybWluZSB0aGUgbGVzc2VyIG9mIHRoZSB0d28gY3VycmVudCBrZXlzOyBuZXcgYW5kIG9sZC5cbiAgICAgICAgICAvLyBJZiB0aGVyZSBhcmUgbm8gb2xkIGtleXMgcmVtYWluaW5nLCB0aGVuIGFsd2F5cyBhZGQgdGhlIG5ldyBrZXkuXG4gICAgICAgICAgaWYgKGcwICYmIHgwIDw9IHgxKSB7XG4gICAgICAgICAgICBnID0gZzAsIHggPSB4MDtcblxuICAgICAgICAgICAgLy8gUmVjb3JkIHRoZSBuZXcgaW5kZXggb2YgdGhlIG9sZCBncm91cC5cbiAgICAgICAgICAgIHJlSW5kZXhbaTBdID0gaztcblxuICAgICAgICAgICAgLy8gUmV0cmlldmUgdGhlIG5leHQgb2xkIGtleS5cbiAgICAgICAgICAgIGlmIChnMCA9IG9sZEdyb3Vwc1srK2kwXSkgeDAgPSBnMC5rZXk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGcgPSB7a2V5OiB4MSwgdmFsdWU6IGluaXRpYWwoKX0sIHggPSB4MTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICAvLyBBZGQgdGhlIGxlc3NlciBncm91cC5cbiAgICAgICAgICBncm91cHNba10gPSBnO1xuXG4gICAgICAgICAgLy8gQWRkIGFueSBzZWxlY3RlZCByZWNvcmRzIGJlbG9uZ2luZyB0byB0aGUgYWRkZWQgZ3JvdXAsIHdoaWxlXG4gICAgICAgICAgLy8gYWR2YW5jaW5nIHRoZSBuZXcga2V5IGFuZCBwb3B1bGF0aW5nIHRoZSBhc3NvY2lhdGVkIGdyb3VwIGluZGV4LlxuICAgICAgICAgIHdoaWxlICghKHgxID4geCkpIHtcbiAgICAgICAgICAgIGdyb3VwSW5kZXhbaiA9IG5ld0luZGV4W2kxXSArIG4wXSA9IGs7XG4gICAgICAgICAgICBpZiAoIShmaWx0ZXJzW2pdICYgemVybykpIGcudmFsdWUgPSBhZGQoZy52YWx1ZSwgZGF0YVtqXSk7XG4gICAgICAgICAgICBpZiAoKytpMSA+PSBuMSkgYnJlYWs7XG4gICAgICAgICAgICB4MSA9IGtleShuZXdWYWx1ZXNbaTFdKTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBncm91cEluY3JlbWVudCgpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gQWRkIGFueSByZW1haW5pbmcgb2xkIGdyb3VwcyB0aGF0IHdlcmUgZ3JlYXRlciB0aGFuIGFsbCBuZXcga2V5cy5cbiAgICAgICAgLy8gTm8gaW5jcmVtZW50YWwgcmVkdWNlIGlzIG5lZWRlZDsgdGhlc2UgZ3JvdXBzIGhhdmUgbm8gbmV3IHJlY29yZHMuXG4gICAgICAgIC8vIEFsc28gcmVjb3JkIHRoZSBuZXcgaW5kZXggb2YgdGhlIG9sZCBncm91cC5cbiAgICAgICAgd2hpbGUgKGkwIDwgazApIHtcbiAgICAgICAgICBncm91cHNbcmVJbmRleFtpMF0gPSBrXSA9IG9sZEdyb3Vwc1tpMCsrXTtcbiAgICAgICAgICBncm91cEluY3JlbWVudCgpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gSWYgd2UgYWRkZWQgYW55IG5ldyBncm91cHMgYmVmb3JlIGFueSBvbGQgZ3JvdXBzLFxuICAgICAgICAvLyB1cGRhdGUgdGhlIGdyb3VwIGluZGV4IG9mIGFsbCB0aGUgb2xkIHJlY29yZHMuXG4gICAgICAgIGlmIChrID4gaTApIGZvciAoaTAgPSAwOyBpMCA8IG4wOyArK2kwKSB7XG4gICAgICAgICAgZ3JvdXBJbmRleFtpMF0gPSByZUluZGV4W2dyb3VwSW5kZXhbaTBdXTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIE1vZGlmeSB0aGUgdXBkYXRlIGFuZCByZXNldCBiZWhhdmlvciBiYXNlZCBvbiB0aGUgY2FyZGluYWxpdHkuXG4gICAgICAgIC8vIElmIHRoZSBjYXJkaW5hbGl0eSBpcyBsZXNzIHRoYW4gb3IgZXF1YWwgdG8gb25lLCB0aGVuIHRoZSBncm91cEluZGV4XG4gICAgICAgIC8vIGlzIG5vdCBuZWVkZWQuIElmIHRoZSBjYXJkaW5hbGl0eSBpcyB6ZXJvLCB0aGVuIHRoZXJlIGFyZSBubyByZWNvcmRzXG4gICAgICAgIC8vIGFuZCB0aGVyZWZvcmUgbm8gZ3JvdXBzIHRvIHVwZGF0ZSBvciByZXNldC4gTm90ZSB0aGF0IHdlIGFsc28gbXVzdFxuICAgICAgICAvLyBjaGFuZ2UgdGhlIHJlZ2lzdGVyZWQgbGlzdGVuZXIgdG8gcG9pbnQgdG8gdGhlIG5ldyBtZXRob2QuXG4gICAgICAgIGogPSBmaWx0ZXJMaXN0ZW5lcnMuaW5kZXhPZih1cGRhdGUpO1xuICAgICAgICBpZiAoayA+IDEpIHtcbiAgICAgICAgICB1cGRhdGUgPSB1cGRhdGVNYW55O1xuICAgICAgICAgIHJlc2V0ID0gcmVzZXRNYW55O1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGlmICghayAmJiBncm91cEFsbCkge1xuICAgICAgICAgICAgayA9IDE7XG4gICAgICAgICAgICBncm91cHMgPSBbe2tleTogbnVsbCwgdmFsdWU6IGluaXRpYWwoKX1dO1xuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAoayA9PT0gMSkge1xuICAgICAgICAgICAgdXBkYXRlID0gdXBkYXRlT25lO1xuICAgICAgICAgICAgcmVzZXQgPSByZXNldE9uZTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdXBkYXRlID0gY3Jvc3NmaWx0ZXJfbnVsbDtcbiAgICAgICAgICAgIHJlc2V0ID0gY3Jvc3NmaWx0ZXJfbnVsbDtcbiAgICAgICAgICB9XG4gICAgICAgICAgZ3JvdXBJbmRleCA9IG51bGw7XG4gICAgICAgIH1cbiAgICAgICAgZmlsdGVyTGlzdGVuZXJzW2pdID0gdXBkYXRlO1xuXG4gICAgICAgIC8vIENvdW50IHRoZSBudW1iZXIgb2YgYWRkZWQgZ3JvdXBzLFxuICAgICAgICAvLyBhbmQgd2lkZW4gdGhlIGdyb3VwIGluZGV4IGFzIG5lZWRlZC5cbiAgICAgICAgZnVuY3Rpb24gZ3JvdXBJbmNyZW1lbnQoKSB7XG4gICAgICAgICAgaWYgKCsrayA9PT0gZ3JvdXBDYXBhY2l0eSkge1xuICAgICAgICAgICAgcmVJbmRleCA9IGNyb3NzZmlsdGVyX2FycmF5V2lkZW4ocmVJbmRleCwgZ3JvdXBXaWR0aCA8PD0gMSk7XG4gICAgICAgICAgICBncm91cEluZGV4ID0gY3Jvc3NmaWx0ZXJfYXJyYXlXaWRlbihncm91cEluZGV4LCBncm91cFdpZHRoKTtcbiAgICAgICAgICAgIGdyb3VwQ2FwYWNpdHkgPSBjcm9zc2ZpbHRlcl9jYXBhY2l0eShncm91cFdpZHRoKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgZnVuY3Rpb24gcmVtb3ZlRGF0YSgpIHtcbiAgICAgICAgaWYgKGsgPiAxKSB7XG4gICAgICAgICAgdmFyIG9sZEsgPSBrLFxuICAgICAgICAgICAgICBvbGRHcm91cHMgPSBncm91cHMsXG4gICAgICAgICAgICAgIHNlZW5Hcm91cHMgPSBjcm9zc2ZpbHRlcl9pbmRleChvbGRLLCBvbGRLKTtcblxuICAgICAgICAgIC8vIEZpbHRlciBvdXQgbm9uLW1hdGNoZXMgYnkgY29weWluZyBtYXRjaGluZyBncm91cCBpbmRleCBlbnRyaWVzIHRvXG4gICAgICAgICAgLy8gdGhlIGJlZ2lubmluZyBvZiB0aGUgYXJyYXkuXG4gICAgICAgICAgZm9yICh2YXIgaSA9IDAsIGogPSAwOyBpIDwgbjsgKytpKSB7XG4gICAgICAgICAgICBpZiAoZmlsdGVyc1tpXSkge1xuICAgICAgICAgICAgICBzZWVuR3JvdXBzW2dyb3VwSW5kZXhbal0gPSBncm91cEluZGV4W2ldXSA9IDE7XG4gICAgICAgICAgICAgICsrajtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG5cbiAgICAgICAgICAvLyBSZWFzc2VtYmxlIGdyb3VwcyBpbmNsdWRpbmcgb25seSB0aG9zZSBncm91cHMgdGhhdCB3ZXJlIHJlZmVycmVkXG4gICAgICAgICAgLy8gdG8gYnkgbWF0Y2hpbmcgZ3JvdXAgaW5kZXggZW50cmllcy4gIE5vdGUgdGhlIG5ldyBncm91cCBpbmRleCBpblxuICAgICAgICAgIC8vIHNlZW5Hcm91cHMuXG4gICAgICAgICAgZ3JvdXBzID0gW10sIGsgPSAwO1xuICAgICAgICAgIGZvciAoaSA9IDA7IGkgPCBvbGRLOyArK2kpIHtcbiAgICAgICAgICAgIGlmIChzZWVuR3JvdXBzW2ldKSB7XG4gICAgICAgICAgICAgIHNlZW5Hcm91cHNbaV0gPSBrKys7XG4gICAgICAgICAgICAgIGdyb3Vwcy5wdXNoKG9sZEdyb3Vwc1tpXSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgaWYgKGsgPiAxKSB7XG4gICAgICAgICAgICAvLyBSZWluZGV4IHRoZSBncm91cCBpbmRleCB1c2luZyBzZWVuR3JvdXBzIHRvIGZpbmQgdGhlIG5ldyBpbmRleC5cbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgajsgKytpKSBncm91cEluZGV4W2ldID0gc2Vlbkdyb3Vwc1tncm91cEluZGV4W2ldXTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgZ3JvdXBJbmRleCA9IG51bGw7XG4gICAgICAgICAgfVxuICAgICAgICAgIGZpbHRlckxpc3RlbmVyc1tmaWx0ZXJMaXN0ZW5lcnMuaW5kZXhPZih1cGRhdGUpXSA9IGsgPiAxXG4gICAgICAgICAgICAgID8gKHJlc2V0ID0gcmVzZXRNYW55LCB1cGRhdGUgPSB1cGRhdGVNYW55KVxuICAgICAgICAgICAgICA6IGsgPT09IDEgPyAocmVzZXQgPSByZXNldE9uZSwgdXBkYXRlID0gdXBkYXRlT25lKVxuICAgICAgICAgICAgICA6IHJlc2V0ID0gdXBkYXRlID0gY3Jvc3NmaWx0ZXJfbnVsbDtcbiAgICAgICAgfSBlbHNlIGlmIChrID09PSAxKSB7XG4gICAgICAgICAgaWYgKGdyb3VwQWxsKSByZXR1cm47XG4gICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBuOyArK2kpIGlmIChmaWx0ZXJzW2ldKSByZXR1cm47XG4gICAgICAgICAgZ3JvdXBzID0gW10sIGsgPSAwO1xuICAgICAgICAgIGZpbHRlckxpc3RlbmVyc1tmaWx0ZXJMaXN0ZW5lcnMuaW5kZXhPZih1cGRhdGUpXSA9XG4gICAgICAgICAgdXBkYXRlID0gcmVzZXQgPSBjcm9zc2ZpbHRlcl9udWxsO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIC8vIFJlZHVjZXMgdGhlIHNwZWNpZmllZCBzZWxlY3RlZCBvciBkZXNlbGVjdGVkIHJlY29yZHMuXG4gICAgICAvLyBUaGlzIGZ1bmN0aW9uIGlzIG9ubHkgdXNlZCB3aGVuIHRoZSBjYXJkaW5hbGl0eSBpcyBncmVhdGVyIHRoYW4gMS5cbiAgICAgIGZ1bmN0aW9uIHVwZGF0ZU1hbnkoZmlsdGVyT25lLCBhZGRlZCwgcmVtb3ZlZCkge1xuICAgICAgICBpZiAoZmlsdGVyT25lID09PSBvbmUgfHwgcmVzZXROZWVkZWQpIHJldHVybjtcblxuICAgICAgICB2YXIgaSxcbiAgICAgICAgICAgIGssXG4gICAgICAgICAgICBuLFxuICAgICAgICAgICAgZztcblxuICAgICAgICAvLyBBZGQgdGhlIGFkZGVkIHZhbHVlcy5cbiAgICAgICAgZm9yIChpID0gMCwgbiA9IGFkZGVkLmxlbmd0aDsgaSA8IG47ICsraSkge1xuICAgICAgICAgIGlmICghKGZpbHRlcnNbayA9IGFkZGVkW2ldXSAmIHplcm8pKSB7XG4gICAgICAgICAgICBnID0gZ3JvdXBzW2dyb3VwSW5kZXhba11dO1xuICAgICAgICAgICAgZy52YWx1ZSA9IHJlZHVjZUFkZChnLnZhbHVlLCBkYXRhW2tdKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICAvLyBSZW1vdmUgdGhlIHJlbW92ZWQgdmFsdWVzLlxuICAgICAgICBmb3IgKGkgPSAwLCBuID0gcmVtb3ZlZC5sZW5ndGg7IGkgPCBuOyArK2kpIHtcbiAgICAgICAgICBpZiAoKGZpbHRlcnNbayA9IHJlbW92ZWRbaV1dICYgemVybykgPT09IGZpbHRlck9uZSkge1xuICAgICAgICAgICAgZyA9IGdyb3Vwc1tncm91cEluZGV4W2tdXTtcbiAgICAgICAgICAgIGcudmFsdWUgPSByZWR1Y2VSZW1vdmUoZy52YWx1ZSwgZGF0YVtrXSk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIC8vIFJlZHVjZXMgdGhlIHNwZWNpZmllZCBzZWxlY3RlZCBvciBkZXNlbGVjdGVkIHJlY29yZHMuXG4gICAgICAvLyBUaGlzIGZ1bmN0aW9uIGlzIG9ubHkgdXNlZCB3aGVuIHRoZSBjYXJkaW5hbGl0eSBpcyAxLlxuICAgICAgZnVuY3Rpb24gdXBkYXRlT25lKGZpbHRlck9uZSwgYWRkZWQsIHJlbW92ZWQpIHtcbiAgICAgICAgaWYgKGZpbHRlck9uZSA9PT0gb25lIHx8IHJlc2V0TmVlZGVkKSByZXR1cm47XG5cbiAgICAgICAgdmFyIGksXG4gICAgICAgICAgICBrLFxuICAgICAgICAgICAgbixcbiAgICAgICAgICAgIGcgPSBncm91cHNbMF07XG5cbiAgICAgICAgLy8gQWRkIHRoZSBhZGRlZCB2YWx1ZXMuXG4gICAgICAgIGZvciAoaSA9IDAsIG4gPSBhZGRlZC5sZW5ndGg7IGkgPCBuOyArK2kpIHtcbiAgICAgICAgICBpZiAoIShmaWx0ZXJzW2sgPSBhZGRlZFtpXV0gJiB6ZXJvKSkge1xuICAgICAgICAgICAgZy52YWx1ZSA9IHJlZHVjZUFkZChnLnZhbHVlLCBkYXRhW2tdKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICAvLyBSZW1vdmUgdGhlIHJlbW92ZWQgdmFsdWVzLlxuICAgICAgICBmb3IgKGkgPSAwLCBuID0gcmVtb3ZlZC5sZW5ndGg7IGkgPCBuOyArK2kpIHtcbiAgICAgICAgICBpZiAoKGZpbHRlcnNbayA9IHJlbW92ZWRbaV1dICYgemVybykgPT09IGZpbHRlck9uZSkge1xuICAgICAgICAgICAgZy52YWx1ZSA9IHJlZHVjZVJlbW92ZShnLnZhbHVlLCBkYXRhW2tdKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgLy8gUmVjb21wdXRlcyB0aGUgZ3JvdXAgcmVkdWNlIHZhbHVlcyBmcm9tIHNjcmF0Y2guXG4gICAgICAvLyBUaGlzIGZ1bmN0aW9uIGlzIG9ubHkgdXNlZCB3aGVuIHRoZSBjYXJkaW5hbGl0eSBpcyBncmVhdGVyIHRoYW4gMS5cbiAgICAgIGZ1bmN0aW9uIHJlc2V0TWFueSgpIHtcbiAgICAgICAgdmFyIGksXG4gICAgICAgICAgICBnO1xuXG4gICAgICAgIC8vIFJlc2V0IGFsbCBncm91cCB2YWx1ZXMuXG4gICAgICAgIGZvciAoaSA9IDA7IGkgPCBrOyArK2kpIHtcbiAgICAgICAgICBncm91cHNbaV0udmFsdWUgPSByZWR1Y2VJbml0aWFsKCk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBBZGQgYW55IHNlbGVjdGVkIHJlY29yZHMuXG4gICAgICAgIGZvciAoaSA9IDA7IGkgPCBuOyArK2kpIHtcbiAgICAgICAgICBpZiAoIShmaWx0ZXJzW2ldICYgemVybykpIHtcbiAgICAgICAgICAgIGcgPSBncm91cHNbZ3JvdXBJbmRleFtpXV07XG4gICAgICAgICAgICBnLnZhbHVlID0gcmVkdWNlQWRkKGcudmFsdWUsIGRhdGFbaV0pO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICAvLyBSZWNvbXB1dGVzIHRoZSBncm91cCByZWR1Y2UgdmFsdWVzIGZyb20gc2NyYXRjaC5cbiAgICAgIC8vIFRoaXMgZnVuY3Rpb24gaXMgb25seSB1c2VkIHdoZW4gdGhlIGNhcmRpbmFsaXR5IGlzIDEuXG4gICAgICBmdW5jdGlvbiByZXNldE9uZSgpIHtcbiAgICAgICAgdmFyIGksXG4gICAgICAgICAgICBnID0gZ3JvdXBzWzBdO1xuXG4gICAgICAgIC8vIFJlc2V0IHRoZSBzaW5nbGV0b24gZ3JvdXAgdmFsdWVzLlxuICAgICAgICBnLnZhbHVlID0gcmVkdWNlSW5pdGlhbCgpO1xuXG4gICAgICAgIC8vIEFkZCBhbnkgc2VsZWN0ZWQgcmVjb3Jkcy5cbiAgICAgICAgZm9yIChpID0gMDsgaSA8IG47ICsraSkge1xuICAgICAgICAgIGlmICghKGZpbHRlcnNbaV0gJiB6ZXJvKSkge1xuICAgICAgICAgICAgZy52YWx1ZSA9IHJlZHVjZUFkZChnLnZhbHVlLCBkYXRhW2ldKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgLy8gUmV0dXJucyB0aGUgYXJyYXkgb2YgZ3JvdXAgdmFsdWVzLCBpbiB0aGUgZGltZW5zaW9uJ3MgbmF0dXJhbCBvcmRlci5cbiAgICAgIGZ1bmN0aW9uIGFsbCgpIHtcbiAgICAgICAgaWYgKHJlc2V0TmVlZGVkKSByZXNldCgpLCByZXNldE5lZWRlZCA9IGZhbHNlO1xuICAgICAgICByZXR1cm4gZ3JvdXBzO1xuICAgICAgfVxuXG4gICAgICAvLyBSZXR1cm5zIGEgbmV3IGFycmF5IGNvbnRhaW5pbmcgdGhlIHRvcCBLIGdyb3VwIHZhbHVlcywgaW4gcmVkdWNlIG9yZGVyLlxuICAgICAgZnVuY3Rpb24gdG9wKGspIHtcbiAgICAgICAgdmFyIHRvcCA9IHNlbGVjdChhbGwoKSwgMCwgZ3JvdXBzLmxlbmd0aCwgayk7XG4gICAgICAgIHJldHVybiBoZWFwLnNvcnQodG9wLCAwLCB0b3AubGVuZ3RoKTtcbiAgICAgIH1cblxuICAgICAgLy8gU2V0cyB0aGUgcmVkdWNlIGJlaGF2aW9yIGZvciB0aGlzIGdyb3VwIHRvIHVzZSB0aGUgc3BlY2lmaWVkIGZ1bmN0aW9ucy5cbiAgICAgIC8vIFRoaXMgbWV0aG9kIGxhemlseSByZWNvbXB1dGVzIHRoZSByZWR1Y2UgdmFsdWVzLCB3YWl0aW5nIHVudGlsIG5lZWRlZC5cbiAgICAgIGZ1bmN0aW9uIHJlZHVjZShhZGQsIHJlbW92ZSwgaW5pdGlhbCkge1xuICAgICAgICByZWR1Y2VBZGQgPSBhZGQ7XG4gICAgICAgIHJlZHVjZVJlbW92ZSA9IHJlbW92ZTtcbiAgICAgICAgcmVkdWNlSW5pdGlhbCA9IGluaXRpYWw7XG4gICAgICAgIHJlc2V0TmVlZGVkID0gdHJ1ZTtcbiAgICAgICAgcmV0dXJuIGdyb3VwO1xuICAgICAgfVxuXG4gICAgICAvLyBBIGNvbnZlbmllbmNlIG1ldGhvZCBmb3IgcmVkdWNpbmcgYnkgY291bnQuXG4gICAgICBmdW5jdGlvbiByZWR1Y2VDb3VudCgpIHtcbiAgICAgICAgcmV0dXJuIHJlZHVjZShjcm9zc2ZpbHRlcl9yZWR1Y2VJbmNyZW1lbnQsIGNyb3NzZmlsdGVyX3JlZHVjZURlY3JlbWVudCwgY3Jvc3NmaWx0ZXJfemVybyk7XG4gICAgICB9XG5cbiAgICAgIC8vIEEgY29udmVuaWVuY2UgbWV0aG9kIGZvciByZWR1Y2luZyBieSBzdW0odmFsdWUpLlxuICAgICAgZnVuY3Rpb24gcmVkdWNlU3VtKHZhbHVlKSB7XG4gICAgICAgIHJldHVybiByZWR1Y2UoY3Jvc3NmaWx0ZXJfcmVkdWNlQWRkKHZhbHVlKSwgY3Jvc3NmaWx0ZXJfcmVkdWNlU3VidHJhY3QodmFsdWUpLCBjcm9zc2ZpbHRlcl96ZXJvKTtcbiAgICAgIH1cblxuICAgICAgLy8gU2V0cyB0aGUgcmVkdWNlIG9yZGVyLCB1c2luZyB0aGUgc3BlY2lmaWVkIGFjY2Vzc29yLlxuICAgICAgZnVuY3Rpb24gb3JkZXIodmFsdWUpIHtcbiAgICAgICAgc2VsZWN0ID0gaGVhcHNlbGVjdF9ieSh2YWx1ZU9mKTtcbiAgICAgICAgaGVhcCA9IGhlYXBfYnkodmFsdWVPZik7XG4gICAgICAgIGZ1bmN0aW9uIHZhbHVlT2YoZCkgeyByZXR1cm4gdmFsdWUoZC52YWx1ZSk7IH1cbiAgICAgICAgcmV0dXJuIGdyb3VwO1xuICAgICAgfVxuXG4gICAgICAvLyBBIGNvbnZlbmllbmNlIG1ldGhvZCBmb3IgbmF0dXJhbCBvcmRlcmluZyBieSByZWR1Y2UgdmFsdWUuXG4gICAgICBmdW5jdGlvbiBvcmRlck5hdHVyYWwoKSB7XG4gICAgICAgIHJldHVybiBvcmRlcihjcm9zc2ZpbHRlcl9pZGVudGl0eSk7XG4gICAgICB9XG5cbiAgICAgIC8vIFJldHVybnMgdGhlIGNhcmRpbmFsaXR5IG9mIHRoaXMgZ3JvdXAsIGlycmVzcGVjdGl2ZSBvZiBhbnkgZmlsdGVycy5cbiAgICAgIGZ1bmN0aW9uIHNpemUoKSB7XG4gICAgICAgIHJldHVybiBrO1xuICAgICAgfVxuXG4gICAgICAvLyBSZW1vdmVzIHRoaXMgZ3JvdXAgYW5kIGFzc29jaWF0ZWQgZXZlbnQgbGlzdGVuZXJzLlxuICAgICAgZnVuY3Rpb24gZGlzcG9zZSgpIHtcbiAgICAgICAgdmFyIGkgPSBmaWx0ZXJMaXN0ZW5lcnMuaW5kZXhPZih1cGRhdGUpO1xuICAgICAgICBpZiAoaSA+PSAwKSBmaWx0ZXJMaXN0ZW5lcnMuc3BsaWNlKGksIDEpO1xuICAgICAgICBpID0gaW5kZXhMaXN0ZW5lcnMuaW5kZXhPZihhZGQpO1xuICAgICAgICBpZiAoaSA+PSAwKSBpbmRleExpc3RlbmVycy5zcGxpY2UoaSwgMSk7XG4gICAgICAgIGkgPSByZW1vdmVEYXRhTGlzdGVuZXJzLmluZGV4T2YocmVtb3ZlRGF0YSk7XG4gICAgICAgIGlmIChpID49IDApIHJlbW92ZURhdGFMaXN0ZW5lcnMuc3BsaWNlKGksIDEpO1xuICAgICAgICByZXR1cm4gZ3JvdXA7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiByZWR1Y2VDb3VudCgpLm9yZGVyTmF0dXJhbCgpO1xuICAgIH1cblxuICAgIC8vIEEgY29udmVuaWVuY2UgZnVuY3Rpb24gZm9yIGdlbmVyYXRpbmcgYSBzaW5nbGV0b24gZ3JvdXAuXG4gICAgZnVuY3Rpb24gZ3JvdXBBbGwoKSB7XG4gICAgICB2YXIgZyA9IGdyb3VwKGNyb3NzZmlsdGVyX251bGwpLCBhbGwgPSBnLmFsbDtcbiAgICAgIGRlbGV0ZSBnLmFsbDtcbiAgICAgIGRlbGV0ZSBnLnRvcDtcbiAgICAgIGRlbGV0ZSBnLm9yZGVyO1xuICAgICAgZGVsZXRlIGcub3JkZXJOYXR1cmFsO1xuICAgICAgZGVsZXRlIGcuc2l6ZTtcbiAgICAgIGcudmFsdWUgPSBmdW5jdGlvbigpIHsgcmV0dXJuIGFsbCgpWzBdLnZhbHVlOyB9O1xuICAgICAgcmV0dXJuIGc7XG4gICAgfVxuXG4gICAgLy8gUmVtb3ZlcyB0aGlzIGRpbWVuc2lvbiBhbmQgYXNzb2NpYXRlZCBncm91cHMgYW5kIGV2ZW50IGxpc3RlbmVycy5cbiAgICBmdW5jdGlvbiBkaXNwb3NlKCkge1xuICAgICAgZGltZW5zaW9uR3JvdXBzLmZvckVhY2goZnVuY3Rpb24oZ3JvdXApIHsgZ3JvdXAuZGlzcG9zZSgpOyB9KTtcbiAgICAgIHZhciBpID0gZGF0YUxpc3RlbmVycy5pbmRleE9mKHByZUFkZCk7XG4gICAgICBpZiAoaSA+PSAwKSBkYXRhTGlzdGVuZXJzLnNwbGljZShpLCAxKTtcbiAgICAgIGkgPSBkYXRhTGlzdGVuZXJzLmluZGV4T2YocG9zdEFkZCk7XG4gICAgICBpZiAoaSA+PSAwKSBkYXRhTGlzdGVuZXJzLnNwbGljZShpLCAxKTtcbiAgICAgIGkgPSByZW1vdmVEYXRhTGlzdGVuZXJzLmluZGV4T2YocmVtb3ZlRGF0YSk7XG4gICAgICBpZiAoaSA+PSAwKSByZW1vdmVEYXRhTGlzdGVuZXJzLnNwbGljZShpLCAxKTtcbiAgICAgIG0gJj0gemVybztcbiAgICAgIHJldHVybiBmaWx0ZXJBbGwoKTtcbiAgICB9XG5cbiAgICByZXR1cm4gZGltZW5zaW9uO1xuICB9XG5cbiAgLy8gQSBjb252ZW5pZW5jZSBtZXRob2QgZm9yIGdyb3VwQWxsIG9uIGEgZHVtbXkgZGltZW5zaW9uLlxuICAvLyBUaGlzIGltcGxlbWVudGF0aW9uIGNhbiBiZSBvcHRpbWl6ZWQgc2luY2UgaXQgYWx3YXlzIGhhcyBjYXJkaW5hbGl0eSAxLlxuICBmdW5jdGlvbiBncm91cEFsbCgpIHtcbiAgICB2YXIgZ3JvdXAgPSB7XG4gICAgICByZWR1Y2U6IHJlZHVjZSxcbiAgICAgIHJlZHVjZUNvdW50OiByZWR1Y2VDb3VudCxcbiAgICAgIHJlZHVjZVN1bTogcmVkdWNlU3VtLFxuICAgICAgdmFsdWU6IHZhbHVlLFxuICAgICAgZGlzcG9zZTogZGlzcG9zZSxcbiAgICAgIHJlbW92ZTogZGlzcG9zZSAvLyBmb3IgYmFja3dhcmRzLWNvbXBhdGliaWxpdHlcbiAgICB9O1xuXG4gICAgdmFyIHJlZHVjZVZhbHVlLFxuICAgICAgICByZWR1Y2VBZGQsXG4gICAgICAgIHJlZHVjZVJlbW92ZSxcbiAgICAgICAgcmVkdWNlSW5pdGlhbCxcbiAgICAgICAgcmVzZXROZWVkZWQgPSB0cnVlO1xuXG4gICAgLy8gVGhlIGdyb3VwIGxpc3RlbnMgdG8gdGhlIGNyb3NzZmlsdGVyIGZvciB3aGVuIGFueSBkaW1lbnNpb24gY2hhbmdlcywgc29cbiAgICAvLyB0aGF0IGl0IGNhbiB1cGRhdGUgdGhlIHJlZHVjZSB2YWx1ZS4gSXQgbXVzdCBhbHNvIGxpc3RlbiB0byB0aGUgcGFyZW50XG4gICAgLy8gZGltZW5zaW9uIGZvciB3aGVuIGRhdGEgaXMgYWRkZWQuXG4gICAgZmlsdGVyTGlzdGVuZXJzLnB1c2godXBkYXRlKTtcbiAgICBkYXRhTGlzdGVuZXJzLnB1c2goYWRkKTtcblxuICAgIC8vIEZvciBjb25zaXN0ZW5jeTsgYWN0dWFsbHkgYSBuby1vcCBzaW5jZSByZXNldE5lZWRlZCBpcyB0cnVlLlxuICAgIGFkZChkYXRhLCAwLCBuKTtcblxuICAgIC8vIEluY29ycG9yYXRlcyB0aGUgc3BlY2lmaWVkIG5ldyB2YWx1ZXMgaW50byB0aGlzIGdyb3VwLlxuICAgIGZ1bmN0aW9uIGFkZChuZXdEYXRhLCBuMCkge1xuICAgICAgdmFyIGk7XG5cbiAgICAgIGlmIChyZXNldE5lZWRlZCkgcmV0dXJuO1xuXG4gICAgICAvLyBBZGQgdGhlIGFkZGVkIHZhbHVlcy5cbiAgICAgIGZvciAoaSA9IG4wOyBpIDwgbjsgKytpKSB7XG4gICAgICAgIGlmICghZmlsdGVyc1tpXSkge1xuICAgICAgICAgIHJlZHVjZVZhbHVlID0gcmVkdWNlQWRkKHJlZHVjZVZhbHVlLCBkYXRhW2ldKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIC8vIFJlZHVjZXMgdGhlIHNwZWNpZmllZCBzZWxlY3RlZCBvciBkZXNlbGVjdGVkIHJlY29yZHMuXG4gICAgZnVuY3Rpb24gdXBkYXRlKGZpbHRlck9uZSwgYWRkZWQsIHJlbW92ZWQpIHtcbiAgICAgIHZhciBpLFxuICAgICAgICAgIGssXG4gICAgICAgICAgbjtcblxuICAgICAgaWYgKHJlc2V0TmVlZGVkKSByZXR1cm47XG5cbiAgICAgIC8vIEFkZCB0aGUgYWRkZWQgdmFsdWVzLlxuICAgICAgZm9yIChpID0gMCwgbiA9IGFkZGVkLmxlbmd0aDsgaSA8IG47ICsraSkge1xuICAgICAgICBpZiAoIWZpbHRlcnNbayA9IGFkZGVkW2ldXSkge1xuICAgICAgICAgIHJlZHVjZVZhbHVlID0gcmVkdWNlQWRkKHJlZHVjZVZhbHVlLCBkYXRhW2tdKTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICAvLyBSZW1vdmUgdGhlIHJlbW92ZWQgdmFsdWVzLlxuICAgICAgZm9yIChpID0gMCwgbiA9IHJlbW92ZWQubGVuZ3RoOyBpIDwgbjsgKytpKSB7XG4gICAgICAgIGlmIChmaWx0ZXJzW2sgPSByZW1vdmVkW2ldXSA9PT0gZmlsdGVyT25lKSB7XG4gICAgICAgICAgcmVkdWNlVmFsdWUgPSByZWR1Y2VSZW1vdmUocmVkdWNlVmFsdWUsIGRhdGFba10pO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gUmVjb21wdXRlcyB0aGUgZ3JvdXAgcmVkdWNlIHZhbHVlIGZyb20gc2NyYXRjaC5cbiAgICBmdW5jdGlvbiByZXNldCgpIHtcbiAgICAgIHZhciBpO1xuXG4gICAgICByZWR1Y2VWYWx1ZSA9IHJlZHVjZUluaXRpYWwoKTtcblxuICAgICAgZm9yIChpID0gMDsgaSA8IG47ICsraSkge1xuICAgICAgICBpZiAoIWZpbHRlcnNbaV0pIHtcbiAgICAgICAgICByZWR1Y2VWYWx1ZSA9IHJlZHVjZUFkZChyZWR1Y2VWYWx1ZSwgZGF0YVtpXSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBTZXRzIHRoZSByZWR1Y2UgYmVoYXZpb3IgZm9yIHRoaXMgZ3JvdXAgdG8gdXNlIHRoZSBzcGVjaWZpZWQgZnVuY3Rpb25zLlxuICAgIC8vIFRoaXMgbWV0aG9kIGxhemlseSByZWNvbXB1dGVzIHRoZSByZWR1Y2UgdmFsdWUsIHdhaXRpbmcgdW50aWwgbmVlZGVkLlxuICAgIGZ1bmN0aW9uIHJlZHVjZShhZGQsIHJlbW92ZSwgaW5pdGlhbCkge1xuICAgICAgcmVkdWNlQWRkID0gYWRkO1xuICAgICAgcmVkdWNlUmVtb3ZlID0gcmVtb3ZlO1xuICAgICAgcmVkdWNlSW5pdGlhbCA9IGluaXRpYWw7XG4gICAgICByZXNldE5lZWRlZCA9IHRydWU7XG4gICAgICByZXR1cm4gZ3JvdXA7XG4gICAgfVxuXG4gICAgLy8gQSBjb252ZW5pZW5jZSBtZXRob2QgZm9yIHJlZHVjaW5nIGJ5IGNvdW50LlxuICAgIGZ1bmN0aW9uIHJlZHVjZUNvdW50KCkge1xuICAgICAgcmV0dXJuIHJlZHVjZShjcm9zc2ZpbHRlcl9yZWR1Y2VJbmNyZW1lbnQsIGNyb3NzZmlsdGVyX3JlZHVjZURlY3JlbWVudCwgY3Jvc3NmaWx0ZXJfemVybyk7XG4gICAgfVxuXG4gICAgLy8gQSBjb252ZW5pZW5jZSBtZXRob2QgZm9yIHJlZHVjaW5nIGJ5IHN1bSh2YWx1ZSkuXG4gICAgZnVuY3Rpb24gcmVkdWNlU3VtKHZhbHVlKSB7XG4gICAgICByZXR1cm4gcmVkdWNlKGNyb3NzZmlsdGVyX3JlZHVjZUFkZCh2YWx1ZSksIGNyb3NzZmlsdGVyX3JlZHVjZVN1YnRyYWN0KHZhbHVlKSwgY3Jvc3NmaWx0ZXJfemVybyk7XG4gICAgfVxuXG4gICAgLy8gUmV0dXJucyB0aGUgY29tcHV0ZWQgcmVkdWNlIHZhbHVlLlxuICAgIGZ1bmN0aW9uIHZhbHVlKCkge1xuICAgICAgaWYgKHJlc2V0TmVlZGVkKSByZXNldCgpLCByZXNldE5lZWRlZCA9IGZhbHNlO1xuICAgICAgcmV0dXJuIHJlZHVjZVZhbHVlO1xuICAgIH1cblxuICAgIC8vIFJlbW92ZXMgdGhpcyBncm91cCBhbmQgYXNzb2NpYXRlZCBldmVudCBsaXN0ZW5lcnMuXG4gICAgZnVuY3Rpb24gZGlzcG9zZSgpIHtcbiAgICAgIHZhciBpID0gZmlsdGVyTGlzdGVuZXJzLmluZGV4T2YodXBkYXRlKTtcbiAgICAgIGlmIChpID49IDApIGZpbHRlckxpc3RlbmVycy5zcGxpY2UoaSk7XG4gICAgICBpID0gZGF0YUxpc3RlbmVycy5pbmRleE9mKGFkZCk7XG4gICAgICBpZiAoaSA+PSAwKSBkYXRhTGlzdGVuZXJzLnNwbGljZShpKTtcbiAgICAgIHJldHVybiBncm91cDtcbiAgICB9XG5cbiAgICByZXR1cm4gcmVkdWNlQ291bnQoKTtcbiAgfVxuXG4gIC8vIFJldHVybnMgdGhlIG51bWJlciBvZiByZWNvcmRzIGluIHRoaXMgY3Jvc3NmaWx0ZXIsIGlycmVzcGVjdGl2ZSBvZiBhbnkgZmlsdGVycy5cbiAgZnVuY3Rpb24gc2l6ZSgpIHtcbiAgICByZXR1cm4gbjtcbiAgfVxuXG4gIHJldHVybiBhcmd1bWVudHMubGVuZ3RoXG4gICAgICA/IGFkZChhcmd1bWVudHNbMF0pXG4gICAgICA6IGNyb3NzZmlsdGVyO1xufVxuXG4vLyBSZXR1cm5zIGFuIGFycmF5IG9mIHNpemUgbiwgYmlnIGVub3VnaCB0byBzdG9yZSBpZHMgdXAgdG8gbS5cbmZ1bmN0aW9uIGNyb3NzZmlsdGVyX2luZGV4KG4sIG0pIHtcbiAgcmV0dXJuIChtIDwgMHgxMDFcbiAgICAgID8gY3Jvc3NmaWx0ZXJfYXJyYXk4IDogbSA8IDB4MTAwMDFcbiAgICAgID8gY3Jvc3NmaWx0ZXJfYXJyYXkxNlxuICAgICAgOiBjcm9zc2ZpbHRlcl9hcnJheTMyKShuKTtcbn1cblxuLy8gQ29uc3RydWN0cyBhIG5ldyBhcnJheSBvZiBzaXplIG4sIHdpdGggc2VxdWVudGlhbCB2YWx1ZXMgZnJvbSAwIHRvIG4gLSAxLlxuZnVuY3Rpb24gY3Jvc3NmaWx0ZXJfcmFuZ2Uobikge1xuICB2YXIgcmFuZ2UgPSBjcm9zc2ZpbHRlcl9pbmRleChuLCBuKTtcbiAgZm9yICh2YXIgaSA9IC0xOyArK2kgPCBuOykgcmFuZ2VbaV0gPSBpO1xuICByZXR1cm4gcmFuZ2U7XG59XG5cbmZ1bmN0aW9uIGNyb3NzZmlsdGVyX2NhcGFjaXR5KHcpIHtcbiAgcmV0dXJuIHcgPT09IDhcbiAgICAgID8gMHgxMDAgOiB3ID09PSAxNlxuICAgICAgPyAweDEwMDAwXG4gICAgICA6IDB4MTAwMDAwMDAwO1xufVxufSkodHlwZW9mIGV4cG9ydHMgIT09ICd1bmRlZmluZWQnICYmIGV4cG9ydHMgfHwgdGhpcyk7XG4iLCJtb2R1bGUuZXhwb3J0cyA9IHJlcXVpcmUoXCIuL2Nyb3NzZmlsdGVyXCIpLmNyb3NzZmlsdGVyO1xuIiwiIWZ1bmN0aW9uKCkge1xuICB2YXIgdG9wb2pzb24gPSB7XG4gICAgdmVyc2lvbjogXCIxLjYuMTlcIixcbiAgICBtZXNoOiBmdW5jdGlvbih0b3BvbG9neSkgeyByZXR1cm4gb2JqZWN0KHRvcG9sb2d5LCBtZXNoQXJjcy5hcHBseSh0aGlzLCBhcmd1bWVudHMpKTsgfSxcbiAgICBtZXNoQXJjczogbWVzaEFyY3MsXG4gICAgbWVyZ2U6IGZ1bmN0aW9uKHRvcG9sb2d5KSB7IHJldHVybiBvYmplY3QodG9wb2xvZ3ksIG1lcmdlQXJjcy5hcHBseSh0aGlzLCBhcmd1bWVudHMpKTsgfSxcbiAgICBtZXJnZUFyY3M6IG1lcmdlQXJjcyxcbiAgICBmZWF0dXJlOiBmZWF0dXJlT3JDb2xsZWN0aW9uLFxuICAgIG5laWdoYm9yczogbmVpZ2hib3JzLFxuICAgIHByZXNpbXBsaWZ5OiBwcmVzaW1wbGlmeVxuICB9O1xuXG4gIGZ1bmN0aW9uIHN0aXRjaEFyY3ModG9wb2xvZ3ksIGFyY3MpIHtcbiAgICB2YXIgc3RpdGNoZWRBcmNzID0ge30sXG4gICAgICAgIGZyYWdtZW50QnlTdGFydCA9IHt9LFxuICAgICAgICBmcmFnbWVudEJ5RW5kID0ge30sXG4gICAgICAgIGZyYWdtZW50cyA9IFtdLFxuICAgICAgICBlbXB0eUluZGV4ID0gLTE7XG5cbiAgICAvLyBTdGl0Y2ggZW1wdHkgYXJjcyBmaXJzdCwgc2luY2UgdGhleSBtYXkgYmUgc3Vic3VtZWQgYnkgb3RoZXIgYXJjcy5cbiAgICBhcmNzLmZvckVhY2goZnVuY3Rpb24oaSwgaikge1xuICAgICAgdmFyIGFyYyA9IHRvcG9sb2d5LmFyY3NbaSA8IDAgPyB+aSA6IGldLCB0O1xuICAgICAgaWYgKGFyYy5sZW5ndGggPCAzICYmICFhcmNbMV1bMF0gJiYgIWFyY1sxXVsxXSkge1xuICAgICAgICB0ID0gYXJjc1srK2VtcHR5SW5kZXhdLCBhcmNzW2VtcHR5SW5kZXhdID0gaSwgYXJjc1tqXSA9IHQ7XG4gICAgICB9XG4gICAgfSk7XG5cbiAgICBhcmNzLmZvckVhY2goZnVuY3Rpb24oaSkge1xuICAgICAgdmFyIGUgPSBlbmRzKGkpLFxuICAgICAgICAgIHN0YXJ0ID0gZVswXSxcbiAgICAgICAgICBlbmQgPSBlWzFdLFxuICAgICAgICAgIGYsIGc7XG5cbiAgICAgIGlmIChmID0gZnJhZ21lbnRCeUVuZFtzdGFydF0pIHtcbiAgICAgICAgZGVsZXRlIGZyYWdtZW50QnlFbmRbZi5lbmRdO1xuICAgICAgICBmLnB1c2goaSk7XG4gICAgICAgIGYuZW5kID0gZW5kO1xuICAgICAgICBpZiAoZyA9IGZyYWdtZW50QnlTdGFydFtlbmRdKSB7XG4gICAgICAgICAgZGVsZXRlIGZyYWdtZW50QnlTdGFydFtnLnN0YXJ0XTtcbiAgICAgICAgICB2YXIgZmcgPSBnID09PSBmID8gZiA6IGYuY29uY2F0KGcpO1xuICAgICAgICAgIGZyYWdtZW50QnlTdGFydFtmZy5zdGFydCA9IGYuc3RhcnRdID0gZnJhZ21lbnRCeUVuZFtmZy5lbmQgPSBnLmVuZF0gPSBmZztcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBmcmFnbWVudEJ5U3RhcnRbZi5zdGFydF0gPSBmcmFnbWVudEJ5RW5kW2YuZW5kXSA9IGY7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSBpZiAoZiA9IGZyYWdtZW50QnlTdGFydFtlbmRdKSB7XG4gICAgICAgIGRlbGV0ZSBmcmFnbWVudEJ5U3RhcnRbZi5zdGFydF07XG4gICAgICAgIGYudW5zaGlmdChpKTtcbiAgICAgICAgZi5zdGFydCA9IHN0YXJ0O1xuICAgICAgICBpZiAoZyA9IGZyYWdtZW50QnlFbmRbc3RhcnRdKSB7XG4gICAgICAgICAgZGVsZXRlIGZyYWdtZW50QnlFbmRbZy5lbmRdO1xuICAgICAgICAgIHZhciBnZiA9IGcgPT09IGYgPyBmIDogZy5jb25jYXQoZik7XG4gICAgICAgICAgZnJhZ21lbnRCeVN0YXJ0W2dmLnN0YXJ0ID0gZy5zdGFydF0gPSBmcmFnbWVudEJ5RW5kW2dmLmVuZCA9IGYuZW5kXSA9IGdmO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGZyYWdtZW50QnlTdGFydFtmLnN0YXJ0XSA9IGZyYWdtZW50QnlFbmRbZi5lbmRdID0gZjtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgZiA9IFtpXTtcbiAgICAgICAgZnJhZ21lbnRCeVN0YXJ0W2Yuc3RhcnQgPSBzdGFydF0gPSBmcmFnbWVudEJ5RW5kW2YuZW5kID0gZW5kXSA9IGY7XG4gICAgICB9XG4gICAgfSk7XG5cbiAgICBmdW5jdGlvbiBlbmRzKGkpIHtcbiAgICAgIHZhciBhcmMgPSB0b3BvbG9neS5hcmNzW2kgPCAwID8gfmkgOiBpXSwgcDAgPSBhcmNbMF0sIHAxO1xuICAgICAgaWYgKHRvcG9sb2d5LnRyYW5zZm9ybSkgcDEgPSBbMCwgMF0sIGFyYy5mb3JFYWNoKGZ1bmN0aW9uKGRwKSB7IHAxWzBdICs9IGRwWzBdLCBwMVsxXSArPSBkcFsxXTsgfSk7XG4gICAgICBlbHNlIHAxID0gYXJjW2FyYy5sZW5ndGggLSAxXTtcbiAgICAgIHJldHVybiBpIDwgMCA/IFtwMSwgcDBdIDogW3AwLCBwMV07XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZmx1c2goZnJhZ21lbnRCeUVuZCwgZnJhZ21lbnRCeVN0YXJ0KSB7XG4gICAgICBmb3IgKHZhciBrIGluIGZyYWdtZW50QnlFbmQpIHtcbiAgICAgICAgdmFyIGYgPSBmcmFnbWVudEJ5RW5kW2tdO1xuICAgICAgICBkZWxldGUgZnJhZ21lbnRCeVN0YXJ0W2Yuc3RhcnRdO1xuICAgICAgICBkZWxldGUgZi5zdGFydDtcbiAgICAgICAgZGVsZXRlIGYuZW5kO1xuICAgICAgICBmLmZvckVhY2goZnVuY3Rpb24oaSkgeyBzdGl0Y2hlZEFyY3NbaSA8IDAgPyB+aSA6IGldID0gMTsgfSk7XG4gICAgICAgIGZyYWdtZW50cy5wdXNoKGYpO1xuICAgICAgfVxuICAgIH1cblxuICAgIGZsdXNoKGZyYWdtZW50QnlFbmQsIGZyYWdtZW50QnlTdGFydCk7XG4gICAgZmx1c2goZnJhZ21lbnRCeVN0YXJ0LCBmcmFnbWVudEJ5RW5kKTtcbiAgICBhcmNzLmZvckVhY2goZnVuY3Rpb24oaSkgeyBpZiAoIXN0aXRjaGVkQXJjc1tpIDwgMCA/IH5pIDogaV0pIGZyYWdtZW50cy5wdXNoKFtpXSk7IH0pO1xuXG4gICAgcmV0dXJuIGZyYWdtZW50cztcbiAgfVxuXG4gIGZ1bmN0aW9uIG1lc2hBcmNzKHRvcG9sb2d5LCBvLCBmaWx0ZXIpIHtcbiAgICB2YXIgYXJjcyA9IFtdO1xuXG4gICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPiAxKSB7XG4gICAgICB2YXIgZ2VvbXNCeUFyYyA9IFtdLFxuICAgICAgICAgIGdlb207XG5cbiAgICAgIGZ1bmN0aW9uIGFyYyhpKSB7XG4gICAgICAgIHZhciBqID0gaSA8IDAgPyB+aSA6IGk7XG4gICAgICAgIChnZW9tc0J5QXJjW2pdIHx8IChnZW9tc0J5QXJjW2pdID0gW10pKS5wdXNoKHtpOiBpLCBnOiBnZW9tfSk7XG4gICAgICB9XG5cbiAgICAgIGZ1bmN0aW9uIGxpbmUoYXJjcykge1xuICAgICAgICBhcmNzLmZvckVhY2goYXJjKTtcbiAgICAgIH1cblxuICAgICAgZnVuY3Rpb24gcG9seWdvbihhcmNzKSB7XG4gICAgICAgIGFyY3MuZm9yRWFjaChsaW5lKTtcbiAgICAgIH1cblxuICAgICAgZnVuY3Rpb24gZ2VvbWV0cnkobykge1xuICAgICAgICBpZiAoby50eXBlID09PSBcIkdlb21ldHJ5Q29sbGVjdGlvblwiKSBvLmdlb21ldHJpZXMuZm9yRWFjaChnZW9tZXRyeSk7XG4gICAgICAgIGVsc2UgaWYgKG8udHlwZSBpbiBnZW9tZXRyeVR5cGUpIGdlb20gPSBvLCBnZW9tZXRyeVR5cGVbby50eXBlXShvLmFyY3MpO1xuICAgICAgfVxuXG4gICAgICB2YXIgZ2VvbWV0cnlUeXBlID0ge1xuICAgICAgICBMaW5lU3RyaW5nOiBsaW5lLFxuICAgICAgICBNdWx0aUxpbmVTdHJpbmc6IHBvbHlnb24sXG4gICAgICAgIFBvbHlnb246IHBvbHlnb24sXG4gICAgICAgIE11bHRpUG9seWdvbjogZnVuY3Rpb24oYXJjcykgeyBhcmNzLmZvckVhY2gocG9seWdvbik7IH1cbiAgICAgIH07XG5cbiAgICAgIGdlb21ldHJ5KG8pO1xuXG4gICAgICBnZW9tc0J5QXJjLmZvckVhY2goYXJndW1lbnRzLmxlbmd0aCA8IDNcbiAgICAgICAgICA/IGZ1bmN0aW9uKGdlb21zKSB7IGFyY3MucHVzaChnZW9tc1swXS5pKTsgfVxuICAgICAgICAgIDogZnVuY3Rpb24oZ2VvbXMpIHsgaWYgKGZpbHRlcihnZW9tc1swXS5nLCBnZW9tc1tnZW9tcy5sZW5ndGggLSAxXS5nKSkgYXJjcy5wdXNoKGdlb21zWzBdLmkpOyB9KTtcbiAgICB9IGVsc2Uge1xuICAgICAgZm9yICh2YXIgaSA9IDAsIG4gPSB0b3BvbG9neS5hcmNzLmxlbmd0aDsgaSA8IG47ICsraSkgYXJjcy5wdXNoKGkpO1xuICAgIH1cblxuICAgIHJldHVybiB7dHlwZTogXCJNdWx0aUxpbmVTdHJpbmdcIiwgYXJjczogc3RpdGNoQXJjcyh0b3BvbG9neSwgYXJjcyl9O1xuICB9XG5cbiAgZnVuY3Rpb24gbWVyZ2VBcmNzKHRvcG9sb2d5LCBvYmplY3RzKSB7XG4gICAgdmFyIHBvbHlnb25zQnlBcmMgPSB7fSxcbiAgICAgICAgcG9seWdvbnMgPSBbXSxcbiAgICAgICAgY29tcG9uZW50cyA9IFtdO1xuXG4gICAgb2JqZWN0cy5mb3JFYWNoKGZ1bmN0aW9uKG8pIHtcbiAgICAgIGlmIChvLnR5cGUgPT09IFwiUG9seWdvblwiKSByZWdpc3RlcihvLmFyY3MpO1xuICAgICAgZWxzZSBpZiAoby50eXBlID09PSBcIk11bHRpUG9seWdvblwiKSBvLmFyY3MuZm9yRWFjaChyZWdpc3Rlcik7XG4gICAgfSk7XG5cbiAgICBmdW5jdGlvbiByZWdpc3Rlcihwb2x5Z29uKSB7XG4gICAgICBwb2x5Z29uLmZvckVhY2goZnVuY3Rpb24ocmluZykge1xuICAgICAgICByaW5nLmZvckVhY2goZnVuY3Rpb24oYXJjKSB7XG4gICAgICAgICAgKHBvbHlnb25zQnlBcmNbYXJjID0gYXJjIDwgMCA/IH5hcmMgOiBhcmNdIHx8IChwb2x5Z29uc0J5QXJjW2FyY10gPSBbXSkpLnB1c2gocG9seWdvbik7XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgICBwb2x5Z29ucy5wdXNoKHBvbHlnb24pO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGV4dGVyaW9yKHJpbmcpIHtcbiAgICAgIHJldHVybiBjYXJ0ZXNpYW5SaW5nQXJlYShvYmplY3QodG9wb2xvZ3ksIHt0eXBlOiBcIlBvbHlnb25cIiwgYXJjczogW3JpbmddfSkuY29vcmRpbmF0ZXNbMF0pID4gMDsgLy8gVE9ETyBhbGxvdyBzcGhlcmljYWw/XG4gICAgfVxuXG4gICAgcG9seWdvbnMuZm9yRWFjaChmdW5jdGlvbihwb2x5Z29uKSB7XG4gICAgICBpZiAoIXBvbHlnb24uXykge1xuICAgICAgICB2YXIgY29tcG9uZW50ID0gW10sXG4gICAgICAgICAgICBuZWlnaGJvcnMgPSBbcG9seWdvbl07XG4gICAgICAgIHBvbHlnb24uXyA9IDE7XG4gICAgICAgIGNvbXBvbmVudHMucHVzaChjb21wb25lbnQpO1xuICAgICAgICB3aGlsZSAocG9seWdvbiA9IG5laWdoYm9ycy5wb3AoKSkge1xuICAgICAgICAgIGNvbXBvbmVudC5wdXNoKHBvbHlnb24pO1xuICAgICAgICAgIHBvbHlnb24uZm9yRWFjaChmdW5jdGlvbihyaW5nKSB7XG4gICAgICAgICAgICByaW5nLmZvckVhY2goZnVuY3Rpb24oYXJjKSB7XG4gICAgICAgICAgICAgIHBvbHlnb25zQnlBcmNbYXJjIDwgMCA/IH5hcmMgOiBhcmNdLmZvckVhY2goZnVuY3Rpb24ocG9seWdvbikge1xuICAgICAgICAgICAgICAgIGlmICghcG9seWdvbi5fKSB7XG4gICAgICAgICAgICAgICAgICBwb2x5Z29uLl8gPSAxO1xuICAgICAgICAgICAgICAgICAgbmVpZ2hib3JzLnB1c2gocG9seWdvbik7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSk7XG5cbiAgICBwb2x5Z29ucy5mb3JFYWNoKGZ1bmN0aW9uKHBvbHlnb24pIHtcbiAgICAgIGRlbGV0ZSBwb2x5Z29uLl87XG4gICAgfSk7XG5cbiAgICByZXR1cm4ge1xuICAgICAgdHlwZTogXCJNdWx0aVBvbHlnb25cIixcbiAgICAgIGFyY3M6IGNvbXBvbmVudHMubWFwKGZ1bmN0aW9uKHBvbHlnb25zKSB7XG4gICAgICAgIHZhciBhcmNzID0gW107XG5cbiAgICAgICAgLy8gRXh0cmFjdCB0aGUgZXh0ZXJpb3IgKHVuaXF1ZSkgYXJjcy5cbiAgICAgICAgcG9seWdvbnMuZm9yRWFjaChmdW5jdGlvbihwb2x5Z29uKSB7XG4gICAgICAgICAgcG9seWdvbi5mb3JFYWNoKGZ1bmN0aW9uKHJpbmcpIHtcbiAgICAgICAgICAgIHJpbmcuZm9yRWFjaChmdW5jdGlvbihhcmMpIHtcbiAgICAgICAgICAgICAgaWYgKHBvbHlnb25zQnlBcmNbYXJjIDwgMCA/IH5hcmMgOiBhcmNdLmxlbmd0aCA8IDIpIHtcbiAgICAgICAgICAgICAgICBhcmNzLnB1c2goYXJjKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIC8vIFN0aXRjaCB0aGUgYXJjcyBpbnRvIG9uZSBvciBtb3JlIHJpbmdzLlxuICAgICAgICBhcmNzID0gc3RpdGNoQXJjcyh0b3BvbG9neSwgYXJjcyk7XG5cbiAgICAgICAgLy8gSWYgbW9yZSB0aGFuIG9uZSByaW5nIGlzIHJldHVybmVkLFxuICAgICAgICAvLyBhdCBtb3N0IG9uZSBvZiB0aGVzZSByaW5ncyBjYW4gYmUgdGhlIGV4dGVyaW9yO1xuICAgICAgICAvLyB0aGlzIGV4dGVyaW9yIHJpbmcgaGFzIHRoZSBzYW1lIHdpbmRpbmcgb3JkZXJcbiAgICAgICAgLy8gYXMgYW55IGV4dGVyaW9yIHJpbmcgaW4gdGhlIG9yaWdpbmFsIHBvbHlnb25zLlxuICAgICAgICBpZiAoKG4gPSBhcmNzLmxlbmd0aCkgPiAxKSB7XG4gICAgICAgICAgdmFyIHNnbiA9IGV4dGVyaW9yKHBvbHlnb25zWzBdWzBdKTtcbiAgICAgICAgICBmb3IgKHZhciBpID0gMCwgdDsgaSA8IG47ICsraSkge1xuICAgICAgICAgICAgaWYgKHNnbiA9PT0gZXh0ZXJpb3IoYXJjc1tpXSkpIHtcbiAgICAgICAgICAgICAgdCA9IGFyY3NbMF0sIGFyY3NbMF0gPSBhcmNzW2ldLCBhcmNzW2ldID0gdDtcbiAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGFyY3M7XG4gICAgICB9KVxuICAgIH07XG4gIH1cblxuICBmdW5jdGlvbiBmZWF0dXJlT3JDb2xsZWN0aW9uKHRvcG9sb2d5LCBvKSB7XG4gICAgcmV0dXJuIG8udHlwZSA9PT0gXCJHZW9tZXRyeUNvbGxlY3Rpb25cIiA/IHtcbiAgICAgIHR5cGU6IFwiRmVhdHVyZUNvbGxlY3Rpb25cIixcbiAgICAgIGZlYXR1cmVzOiBvLmdlb21ldHJpZXMubWFwKGZ1bmN0aW9uKG8pIHsgcmV0dXJuIGZlYXR1cmUodG9wb2xvZ3ksIG8pOyB9KVxuICAgIH0gOiBmZWF0dXJlKHRvcG9sb2d5LCBvKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGZlYXR1cmUodG9wb2xvZ3ksIG8pIHtcbiAgICB2YXIgZiA9IHtcbiAgICAgIHR5cGU6IFwiRmVhdHVyZVwiLFxuICAgICAgaWQ6IG8uaWQsXG4gICAgICBwcm9wZXJ0aWVzOiBvLnByb3BlcnRpZXMgfHwge30sXG4gICAgICBnZW9tZXRyeTogb2JqZWN0KHRvcG9sb2d5LCBvKVxuICAgIH07XG4gICAgaWYgKG8uaWQgPT0gbnVsbCkgZGVsZXRlIGYuaWQ7XG4gICAgcmV0dXJuIGY7XG4gIH1cblxuICBmdW5jdGlvbiBvYmplY3QodG9wb2xvZ3ksIG8pIHtcbiAgICB2YXIgYWJzb2x1dGUgPSB0cmFuc2Zvcm1BYnNvbHV0ZSh0b3BvbG9neS50cmFuc2Zvcm0pLFxuICAgICAgICBhcmNzID0gdG9wb2xvZ3kuYXJjcztcblxuICAgIGZ1bmN0aW9uIGFyYyhpLCBwb2ludHMpIHtcbiAgICAgIGlmIChwb2ludHMubGVuZ3RoKSBwb2ludHMucG9wKCk7XG4gICAgICBmb3IgKHZhciBhID0gYXJjc1tpIDwgMCA/IH5pIDogaV0sIGsgPSAwLCBuID0gYS5sZW5ndGgsIHA7IGsgPCBuOyArK2spIHtcbiAgICAgICAgcG9pbnRzLnB1c2gocCA9IGFba10uc2xpY2UoKSk7XG4gICAgICAgIGFic29sdXRlKHAsIGspO1xuICAgICAgfVxuICAgICAgaWYgKGkgPCAwKSByZXZlcnNlKHBvaW50cywgbik7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gcG9pbnQocCkge1xuICAgICAgcCA9IHAuc2xpY2UoKTtcbiAgICAgIGFic29sdXRlKHAsIDApO1xuICAgICAgcmV0dXJuIHA7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gbGluZShhcmNzKSB7XG4gICAgICB2YXIgcG9pbnRzID0gW107XG4gICAgICBmb3IgKHZhciBpID0gMCwgbiA9IGFyY3MubGVuZ3RoOyBpIDwgbjsgKytpKSBhcmMoYXJjc1tpXSwgcG9pbnRzKTtcbiAgICAgIGlmIChwb2ludHMubGVuZ3RoIDwgMikgcG9pbnRzLnB1c2gocG9pbnRzWzBdLnNsaWNlKCkpO1xuICAgICAgcmV0dXJuIHBvaW50cztcbiAgICB9XG5cbiAgICBmdW5jdGlvbiByaW5nKGFyY3MpIHtcbiAgICAgIHZhciBwb2ludHMgPSBsaW5lKGFyY3MpO1xuICAgICAgd2hpbGUgKHBvaW50cy5sZW5ndGggPCA0KSBwb2ludHMucHVzaChwb2ludHNbMF0uc2xpY2UoKSk7XG4gICAgICByZXR1cm4gcG9pbnRzO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHBvbHlnb24oYXJjcykge1xuICAgICAgcmV0dXJuIGFyY3MubWFwKHJpbmcpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGdlb21ldHJ5KG8pIHtcbiAgICAgIHZhciB0ID0gby50eXBlO1xuICAgICAgcmV0dXJuIHQgPT09IFwiR2VvbWV0cnlDb2xsZWN0aW9uXCIgPyB7dHlwZTogdCwgZ2VvbWV0cmllczogby5nZW9tZXRyaWVzLm1hcChnZW9tZXRyeSl9XG4gICAgICAgICAgOiB0IGluIGdlb21ldHJ5VHlwZSA/IHt0eXBlOiB0LCBjb29yZGluYXRlczogZ2VvbWV0cnlUeXBlW3RdKG8pfVxuICAgICAgICAgIDogbnVsbDtcbiAgICB9XG5cbiAgICB2YXIgZ2VvbWV0cnlUeXBlID0ge1xuICAgICAgUG9pbnQ6IGZ1bmN0aW9uKG8pIHsgcmV0dXJuIHBvaW50KG8uY29vcmRpbmF0ZXMpOyB9LFxuICAgICAgTXVsdGlQb2ludDogZnVuY3Rpb24obykgeyByZXR1cm4gby5jb29yZGluYXRlcy5tYXAocG9pbnQpOyB9LFxuICAgICAgTGluZVN0cmluZzogZnVuY3Rpb24obykgeyByZXR1cm4gbGluZShvLmFyY3MpOyB9LFxuICAgICAgTXVsdGlMaW5lU3RyaW5nOiBmdW5jdGlvbihvKSB7IHJldHVybiBvLmFyY3MubWFwKGxpbmUpOyB9LFxuICAgICAgUG9seWdvbjogZnVuY3Rpb24obykgeyByZXR1cm4gcG9seWdvbihvLmFyY3MpOyB9LFxuICAgICAgTXVsdGlQb2x5Z29uOiBmdW5jdGlvbihvKSB7IHJldHVybiBvLmFyY3MubWFwKHBvbHlnb24pOyB9XG4gICAgfTtcblxuICAgIHJldHVybiBnZW9tZXRyeShvKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHJldmVyc2UoYXJyYXksIG4pIHtcbiAgICB2YXIgdCwgaiA9IGFycmF5Lmxlbmd0aCwgaSA9IGogLSBuOyB3aGlsZSAoaSA8IC0taikgdCA9IGFycmF5W2ldLCBhcnJheVtpKytdID0gYXJyYXlbal0sIGFycmF5W2pdID0gdDtcbiAgfVxuXG4gIGZ1bmN0aW9uIGJpc2VjdChhLCB4KSB7XG4gICAgdmFyIGxvID0gMCwgaGkgPSBhLmxlbmd0aDtcbiAgICB3aGlsZSAobG8gPCBoaSkge1xuICAgICAgdmFyIG1pZCA9IGxvICsgaGkgPj4+IDE7XG4gICAgICBpZiAoYVttaWRdIDwgeCkgbG8gPSBtaWQgKyAxO1xuICAgICAgZWxzZSBoaSA9IG1pZDtcbiAgICB9XG4gICAgcmV0dXJuIGxvO1xuICB9XG5cbiAgZnVuY3Rpb24gbmVpZ2hib3JzKG9iamVjdHMpIHtcbiAgICB2YXIgaW5kZXhlc0J5QXJjID0ge30sIC8vIGFyYyBpbmRleCAtPiBhcnJheSBvZiBvYmplY3QgaW5kZXhlc1xuICAgICAgICBuZWlnaGJvcnMgPSBvYmplY3RzLm1hcChmdW5jdGlvbigpIHsgcmV0dXJuIFtdOyB9KTtcblxuICAgIGZ1bmN0aW9uIGxpbmUoYXJjcywgaSkge1xuICAgICAgYXJjcy5mb3JFYWNoKGZ1bmN0aW9uKGEpIHtcbiAgICAgICAgaWYgKGEgPCAwKSBhID0gfmE7XG4gICAgICAgIHZhciBvID0gaW5kZXhlc0J5QXJjW2FdO1xuICAgICAgICBpZiAobykgby5wdXNoKGkpO1xuICAgICAgICBlbHNlIGluZGV4ZXNCeUFyY1thXSA9IFtpXTtcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHBvbHlnb24oYXJjcywgaSkge1xuICAgICAgYXJjcy5mb3JFYWNoKGZ1bmN0aW9uKGFyYykgeyBsaW5lKGFyYywgaSk7IH0pO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGdlb21ldHJ5KG8sIGkpIHtcbiAgICAgIGlmIChvLnR5cGUgPT09IFwiR2VvbWV0cnlDb2xsZWN0aW9uXCIpIG8uZ2VvbWV0cmllcy5mb3JFYWNoKGZ1bmN0aW9uKG8pIHsgZ2VvbWV0cnkobywgaSk7IH0pO1xuICAgICAgZWxzZSBpZiAoby50eXBlIGluIGdlb21ldHJ5VHlwZSkgZ2VvbWV0cnlUeXBlW28udHlwZV0oby5hcmNzLCBpKTtcbiAgICB9XG5cbiAgICB2YXIgZ2VvbWV0cnlUeXBlID0ge1xuICAgICAgTGluZVN0cmluZzogbGluZSxcbiAgICAgIE11bHRpTGluZVN0cmluZzogcG9seWdvbixcbiAgICAgIFBvbHlnb246IHBvbHlnb24sXG4gICAgICBNdWx0aVBvbHlnb246IGZ1bmN0aW9uKGFyY3MsIGkpIHsgYXJjcy5mb3JFYWNoKGZ1bmN0aW9uKGFyYykgeyBwb2x5Z29uKGFyYywgaSk7IH0pOyB9XG4gICAgfTtcblxuICAgIG9iamVjdHMuZm9yRWFjaChnZW9tZXRyeSk7XG5cbiAgICBmb3IgKHZhciBpIGluIGluZGV4ZXNCeUFyYykge1xuICAgICAgZm9yICh2YXIgaW5kZXhlcyA9IGluZGV4ZXNCeUFyY1tpXSwgbSA9IGluZGV4ZXMubGVuZ3RoLCBqID0gMDsgaiA8IG07ICsraikge1xuICAgICAgICBmb3IgKHZhciBrID0gaiArIDE7IGsgPCBtOyArK2spIHtcbiAgICAgICAgICB2YXIgaWogPSBpbmRleGVzW2pdLCBpayA9IGluZGV4ZXNba10sIG47XG4gICAgICAgICAgaWYgKChuID0gbmVpZ2hib3JzW2lqXSlbaSA9IGJpc2VjdChuLCBpayldICE9PSBpaykgbi5zcGxpY2UoaSwgMCwgaWspO1xuICAgICAgICAgIGlmICgobiA9IG5laWdoYm9yc1tpa10pW2kgPSBiaXNlY3QobiwgaWopXSAhPT0gaWopIG4uc3BsaWNlKGksIDAsIGlqKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBuZWlnaGJvcnM7XG4gIH1cblxuICBmdW5jdGlvbiBwcmVzaW1wbGlmeSh0b3BvbG9neSwgdHJpYW5nbGVBcmVhKSB7XG4gICAgdmFyIGFic29sdXRlID0gdHJhbnNmb3JtQWJzb2x1dGUodG9wb2xvZ3kudHJhbnNmb3JtKSxcbiAgICAgICAgcmVsYXRpdmUgPSB0cmFuc2Zvcm1SZWxhdGl2ZSh0b3BvbG9neS50cmFuc2Zvcm0pLFxuICAgICAgICBoZWFwID0gbWluQXJlYUhlYXAoKTtcblxuICAgIGlmICghdHJpYW5nbGVBcmVhKSB0cmlhbmdsZUFyZWEgPSBjYXJ0ZXNpYW5UcmlhbmdsZUFyZWE7XG5cbiAgICB0b3BvbG9neS5hcmNzLmZvckVhY2goZnVuY3Rpb24oYXJjKSB7XG4gICAgICB2YXIgdHJpYW5nbGVzID0gW10sXG4gICAgICAgICAgbWF4QXJlYSA9IDAsXG4gICAgICAgICAgdHJpYW5nbGU7XG5cbiAgICAgIC8vIFRvIHN0b3JlIGVhY2ggcG9pbnTigJlzIGVmZmVjdGl2ZSBhcmVhLCB3ZSBjcmVhdGUgYSBuZXcgYXJyYXkgcmF0aGVyIHRoYW5cbiAgICAgIC8vIGV4dGVuZGluZyB0aGUgcGFzc2VkLWluIHBvaW50IHRvIHdvcmthcm91bmQgYSBDaHJvbWUvVjggYnVnIChnZXR0aW5nXG4gICAgICAvLyBzdHVjayBpbiBzbWkgbW9kZSkuIEZvciBtaWRwb2ludHMsIHRoZSBpbml0aWFsIGVmZmVjdGl2ZSBhcmVhIG9mXG4gICAgICAvLyBJbmZpbml0eSB3aWxsIGJlIGNvbXB1dGVkIGluIHRoZSBuZXh0IHN0ZXAuXG4gICAgICBmb3IgKHZhciBpID0gMCwgbiA9IGFyYy5sZW5ndGgsIHA7IGkgPCBuOyArK2kpIHtcbiAgICAgICAgcCA9IGFyY1tpXTtcbiAgICAgICAgYWJzb2x1dGUoYXJjW2ldID0gW3BbMF0sIHBbMV0sIEluZmluaXR5XSwgaSk7XG4gICAgICB9XG5cbiAgICAgIGZvciAodmFyIGkgPSAxLCBuID0gYXJjLmxlbmd0aCAtIDE7IGkgPCBuOyArK2kpIHtcbiAgICAgICAgdHJpYW5nbGUgPSBhcmMuc2xpY2UoaSAtIDEsIGkgKyAyKTtcbiAgICAgICAgdHJpYW5nbGVbMV1bMl0gPSB0cmlhbmdsZUFyZWEodHJpYW5nbGUpO1xuICAgICAgICB0cmlhbmdsZXMucHVzaCh0cmlhbmdsZSk7XG4gICAgICAgIGhlYXAucHVzaCh0cmlhbmdsZSk7XG4gICAgICB9XG5cbiAgICAgIGZvciAodmFyIGkgPSAwLCBuID0gdHJpYW5nbGVzLmxlbmd0aDsgaSA8IG47ICsraSkge1xuICAgICAgICB0cmlhbmdsZSA9IHRyaWFuZ2xlc1tpXTtcbiAgICAgICAgdHJpYW5nbGUucHJldmlvdXMgPSB0cmlhbmdsZXNbaSAtIDFdO1xuICAgICAgICB0cmlhbmdsZS5uZXh0ID0gdHJpYW5nbGVzW2kgKyAxXTtcbiAgICAgIH1cblxuICAgICAgd2hpbGUgKHRyaWFuZ2xlID0gaGVhcC5wb3AoKSkge1xuICAgICAgICB2YXIgcHJldmlvdXMgPSB0cmlhbmdsZS5wcmV2aW91cyxcbiAgICAgICAgICAgIG5leHQgPSB0cmlhbmdsZS5uZXh0O1xuXG4gICAgICAgIC8vIElmIHRoZSBhcmVhIG9mIHRoZSBjdXJyZW50IHBvaW50IGlzIGxlc3MgdGhhbiB0aGF0IG9mIHRoZSBwcmV2aW91cyBwb2ludFxuICAgICAgICAvLyB0byBiZSBlbGltaW5hdGVkLCB1c2UgdGhlIGxhdHRlcidzIGFyZWEgaW5zdGVhZC4gVGhpcyBlbnN1cmVzIHRoYXQgdGhlXG4gICAgICAgIC8vIGN1cnJlbnQgcG9pbnQgY2Fubm90IGJlIGVsaW1pbmF0ZWQgd2l0aG91dCBlbGltaW5hdGluZyBwcmV2aW91c2x5LVxuICAgICAgICAvLyBlbGltaW5hdGVkIHBvaW50cy5cbiAgICAgICAgaWYgKHRyaWFuZ2xlWzFdWzJdIDwgbWF4QXJlYSkgdHJpYW5nbGVbMV1bMl0gPSBtYXhBcmVhO1xuICAgICAgICBlbHNlIG1heEFyZWEgPSB0cmlhbmdsZVsxXVsyXTtcblxuICAgICAgICBpZiAocHJldmlvdXMpIHtcbiAgICAgICAgICBwcmV2aW91cy5uZXh0ID0gbmV4dDtcbiAgICAgICAgICBwcmV2aW91c1syXSA9IHRyaWFuZ2xlWzJdO1xuICAgICAgICAgIHVwZGF0ZShwcmV2aW91cyk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAobmV4dCkge1xuICAgICAgICAgIG5leHQucHJldmlvdXMgPSBwcmV2aW91cztcbiAgICAgICAgICBuZXh0WzBdID0gdHJpYW5nbGVbMF07XG4gICAgICAgICAgdXBkYXRlKG5leHQpO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGFyYy5mb3JFYWNoKHJlbGF0aXZlKTtcbiAgICB9KTtcblxuICAgIGZ1bmN0aW9uIHVwZGF0ZSh0cmlhbmdsZSkge1xuICAgICAgaGVhcC5yZW1vdmUodHJpYW5nbGUpO1xuICAgICAgdHJpYW5nbGVbMV1bMl0gPSB0cmlhbmdsZUFyZWEodHJpYW5nbGUpO1xuICAgICAgaGVhcC5wdXNoKHRyaWFuZ2xlKTtcbiAgICB9XG5cbiAgICByZXR1cm4gdG9wb2xvZ3k7XG4gIH07XG5cbiAgZnVuY3Rpb24gY2FydGVzaWFuUmluZ0FyZWEocmluZykge1xuICAgIHZhciBpID0gLTEsXG4gICAgICAgIG4gPSByaW5nLmxlbmd0aCxcbiAgICAgICAgYSxcbiAgICAgICAgYiA9IHJpbmdbbiAtIDFdLFxuICAgICAgICBhcmVhID0gMDtcblxuICAgIHdoaWxlICgrK2kgPCBuKSB7XG4gICAgICBhID0gYjtcbiAgICAgIGIgPSByaW5nW2ldO1xuICAgICAgYXJlYSArPSBhWzBdICogYlsxXSAtIGFbMV0gKiBiWzBdO1xuICAgIH1cblxuICAgIHJldHVybiBhcmVhICogLjU7XG4gIH1cblxuICBmdW5jdGlvbiBjYXJ0ZXNpYW5UcmlhbmdsZUFyZWEodHJpYW5nbGUpIHtcbiAgICB2YXIgYSA9IHRyaWFuZ2xlWzBdLCBiID0gdHJpYW5nbGVbMV0sIGMgPSB0cmlhbmdsZVsyXTtcbiAgICByZXR1cm4gTWF0aC5hYnMoKGFbMF0gLSBjWzBdKSAqIChiWzFdIC0gYVsxXSkgLSAoYVswXSAtIGJbMF0pICogKGNbMV0gLSBhWzFdKSk7XG4gIH1cblxuICBmdW5jdGlvbiBjb21wYXJlQXJlYShhLCBiKSB7XG4gICAgcmV0dXJuIGFbMV1bMl0gLSBiWzFdWzJdO1xuICB9XG5cbiAgZnVuY3Rpb24gbWluQXJlYUhlYXAoKSB7XG4gICAgdmFyIGhlYXAgPSB7fSxcbiAgICAgICAgYXJyYXkgPSBbXSxcbiAgICAgICAgc2l6ZSA9IDA7XG5cbiAgICBoZWFwLnB1c2ggPSBmdW5jdGlvbihvYmplY3QpIHtcbiAgICAgIHVwKGFycmF5W29iamVjdC5fID0gc2l6ZV0gPSBvYmplY3QsIHNpemUrKyk7XG4gICAgICByZXR1cm4gc2l6ZTtcbiAgICB9O1xuXG4gICAgaGVhcC5wb3AgPSBmdW5jdGlvbigpIHtcbiAgICAgIGlmIChzaXplIDw9IDApIHJldHVybjtcbiAgICAgIHZhciByZW1vdmVkID0gYXJyYXlbMF0sIG9iamVjdDtcbiAgICAgIGlmICgtLXNpemUgPiAwKSBvYmplY3QgPSBhcnJheVtzaXplXSwgZG93bihhcnJheVtvYmplY3QuXyA9IDBdID0gb2JqZWN0LCAwKTtcbiAgICAgIHJldHVybiByZW1vdmVkO1xuICAgIH07XG5cbiAgICBoZWFwLnJlbW92ZSA9IGZ1bmN0aW9uKHJlbW92ZWQpIHtcbiAgICAgIHZhciBpID0gcmVtb3ZlZC5fLCBvYmplY3Q7XG4gICAgICBpZiAoYXJyYXlbaV0gIT09IHJlbW92ZWQpIHJldHVybjsgLy8gaW52YWxpZCByZXF1ZXN0XG4gICAgICBpZiAoaSAhPT0gLS1zaXplKSBvYmplY3QgPSBhcnJheVtzaXplXSwgKGNvbXBhcmVBcmVhKG9iamVjdCwgcmVtb3ZlZCkgPCAwID8gdXAgOiBkb3duKShhcnJheVtvYmplY3QuXyA9IGldID0gb2JqZWN0LCBpKTtcbiAgICAgIHJldHVybiBpO1xuICAgIH07XG5cbiAgICBmdW5jdGlvbiB1cChvYmplY3QsIGkpIHtcbiAgICAgIHdoaWxlIChpID4gMCkge1xuICAgICAgICB2YXIgaiA9ICgoaSArIDEpID4+IDEpIC0gMSxcbiAgICAgICAgICAgIHBhcmVudCA9IGFycmF5W2pdO1xuICAgICAgICBpZiAoY29tcGFyZUFyZWEob2JqZWN0LCBwYXJlbnQpID49IDApIGJyZWFrO1xuICAgICAgICBhcnJheVtwYXJlbnQuXyA9IGldID0gcGFyZW50O1xuICAgICAgICBhcnJheVtvYmplY3QuXyA9IGkgPSBqXSA9IG9iamVjdDtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBmdW5jdGlvbiBkb3duKG9iamVjdCwgaSkge1xuICAgICAgd2hpbGUgKHRydWUpIHtcbiAgICAgICAgdmFyIHIgPSAoaSArIDEpIDw8IDEsXG4gICAgICAgICAgICBsID0gciAtIDEsXG4gICAgICAgICAgICBqID0gaSxcbiAgICAgICAgICAgIGNoaWxkID0gYXJyYXlbal07XG4gICAgICAgIGlmIChsIDwgc2l6ZSAmJiBjb21wYXJlQXJlYShhcnJheVtsXSwgY2hpbGQpIDwgMCkgY2hpbGQgPSBhcnJheVtqID0gbF07XG4gICAgICAgIGlmIChyIDwgc2l6ZSAmJiBjb21wYXJlQXJlYShhcnJheVtyXSwgY2hpbGQpIDwgMCkgY2hpbGQgPSBhcnJheVtqID0gcl07XG4gICAgICAgIGlmIChqID09PSBpKSBicmVhaztcbiAgICAgICAgYXJyYXlbY2hpbGQuXyA9IGldID0gY2hpbGQ7XG4gICAgICAgIGFycmF5W29iamVjdC5fID0gaSA9IGpdID0gb2JqZWN0O1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBoZWFwO1xuICB9XG5cbiAgZnVuY3Rpb24gdHJhbnNmb3JtQWJzb2x1dGUodHJhbnNmb3JtKSB7XG4gICAgaWYgKCF0cmFuc2Zvcm0pIHJldHVybiBub29wO1xuICAgIHZhciB4MCxcbiAgICAgICAgeTAsXG4gICAgICAgIGt4ID0gdHJhbnNmb3JtLnNjYWxlWzBdLFxuICAgICAgICBreSA9IHRyYW5zZm9ybS5zY2FsZVsxXSxcbiAgICAgICAgZHggPSB0cmFuc2Zvcm0udHJhbnNsYXRlWzBdLFxuICAgICAgICBkeSA9IHRyYW5zZm9ybS50cmFuc2xhdGVbMV07XG4gICAgcmV0dXJuIGZ1bmN0aW9uKHBvaW50LCBpKSB7XG4gICAgICBpZiAoIWkpIHgwID0geTAgPSAwO1xuICAgICAgcG9pbnRbMF0gPSAoeDAgKz0gcG9pbnRbMF0pICoga3ggKyBkeDtcbiAgICAgIHBvaW50WzFdID0gKHkwICs9IHBvaW50WzFdKSAqIGt5ICsgZHk7XG4gICAgfTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHRyYW5zZm9ybVJlbGF0aXZlKHRyYW5zZm9ybSkge1xuICAgIGlmICghdHJhbnNmb3JtKSByZXR1cm4gbm9vcDtcbiAgICB2YXIgeDAsXG4gICAgICAgIHkwLFxuICAgICAgICBreCA9IHRyYW5zZm9ybS5zY2FsZVswXSxcbiAgICAgICAga3kgPSB0cmFuc2Zvcm0uc2NhbGVbMV0sXG4gICAgICAgIGR4ID0gdHJhbnNmb3JtLnRyYW5zbGF0ZVswXSxcbiAgICAgICAgZHkgPSB0cmFuc2Zvcm0udHJhbnNsYXRlWzFdO1xuICAgIHJldHVybiBmdW5jdGlvbihwb2ludCwgaSkge1xuICAgICAgaWYgKCFpKSB4MCA9IHkwID0gMDtcbiAgICAgIHZhciB4MSA9IChwb2ludFswXSAtIGR4KSAvIGt4IHwgMCxcbiAgICAgICAgICB5MSA9IChwb2ludFsxXSAtIGR5KSAvIGt5IHwgMDtcbiAgICAgIHBvaW50WzBdID0geDEgLSB4MDtcbiAgICAgIHBvaW50WzFdID0geTEgLSB5MDtcbiAgICAgIHgwID0geDE7XG4gICAgICB5MCA9IHkxO1xuICAgIH07XG4gIH1cblxuICBmdW5jdGlvbiBub29wKCkge31cblxuICBpZiAodHlwZW9mIGRlZmluZSA9PT0gXCJmdW5jdGlvblwiICYmIGRlZmluZS5hbWQpIGRlZmluZSh0b3BvanNvbik7XG4gIGVsc2UgaWYgKHR5cGVvZiBtb2R1bGUgPT09IFwib2JqZWN0XCIgJiYgbW9kdWxlLmV4cG9ydHMpIG1vZHVsZS5leHBvcnRzID0gdG9wb2pzb247XG4gIGVsc2UgdGhpcy50b3BvanNvbiA9IHRvcG9qc29uO1xufSgpO1xuIl19
