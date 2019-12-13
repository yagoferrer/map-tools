/* map-tools.js 2.0.2 MIT License. 2019 Yago Ferrer <yago.ferrer@gmail.com> */
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
                feature.data = { uid: uid };
                feature.forEachProperty(function (value, key) {
                    feature.data[key] = value;
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
        script.src = "" + config.url + "?v=" + version + "&key=" + args.key + "&callback=mapTools.maps." + id + ".create";
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
crossfilter.version = "1.3.12";
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
    if (M >= 32 ? !one : m & -(1 << M)) {
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
'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var topojsonClient = require('topojson-client');
var topojsonServer = require('topojson-server');
var topojsonSimplify = require('topojson-simplify');



Object.keys(topojsonClient).forEach(function (key) { exports[key] = topojsonClient[key]; });
Object.keys(topojsonServer).forEach(function (key) { exports[key] = topojsonServer[key]; });
Object.keys(topojsonSimplify).forEach(function (key) { exports[key] = topojsonSimplify[key]; });

},{"topojson-client":24,"topojson-server":25,"topojson-simplify":26}],24:[function(require,module,exports){
// https://github.com/topojson/topojson-client Version 3.0.0. Copyright 2017 Mike Bostock.
(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
	typeof define === 'function' && define.amd ? define(['exports'], factory) :
	(factory((global.topojson = global.topojson || {})));
}(this, (function (exports) { 'use strict';

var identity = function(x) {
  return x;
};

var transform = function(transform) {
  if (transform == null) return identity;
  var x0,
      y0,
      kx = transform.scale[0],
      ky = transform.scale[1],
      dx = transform.translate[0],
      dy = transform.translate[1];
  return function(input, i) {
    if (!i) x0 = y0 = 0;
    var j = 2, n = input.length, output = new Array(n);
    output[0] = (x0 += input[0]) * kx + dx;
    output[1] = (y0 += input[1]) * ky + dy;
    while (j < n) output[j] = input[j], ++j;
    return output;
  };
};

var bbox = function(topology) {
  var t = transform(topology.transform), key,
      x0 = Infinity, y0 = x0, x1 = -x0, y1 = -x0;

  function bboxPoint(p) {
    p = t(p);
    if (p[0] < x0) x0 = p[0];
    if (p[0] > x1) x1 = p[0];
    if (p[1] < y0) y0 = p[1];
    if (p[1] > y1) y1 = p[1];
  }

  function bboxGeometry(o) {
    switch (o.type) {
      case "GeometryCollection": o.geometries.forEach(bboxGeometry); break;
      case "Point": bboxPoint(o.coordinates); break;
      case "MultiPoint": o.coordinates.forEach(bboxPoint); break;
    }
  }

  topology.arcs.forEach(function(arc) {
    var i = -1, n = arc.length, p;
    while (++i < n) {
      p = t(arc[i], i);
      if (p[0] < x0) x0 = p[0];
      if (p[0] > x1) x1 = p[0];
      if (p[1] < y0) y0 = p[1];
      if (p[1] > y1) y1 = p[1];
    }
  });

  for (key in topology.objects) {
    bboxGeometry(topology.objects[key]);
  }

  return [x0, y0, x1, y1];
};

var reverse = function(array, n) {
  var t, j = array.length, i = j - n;
  while (i < --j) t = array[i], array[i++] = array[j], array[j] = t;
};

var feature = function(topology, o) {
  return o.type === "GeometryCollection"
      ? {type: "FeatureCollection", features: o.geometries.map(function(o) { return feature$1(topology, o); })}
      : feature$1(topology, o);
};

function feature$1(topology, o) {
  var id = o.id,
      bbox = o.bbox,
      properties = o.properties == null ? {} : o.properties,
      geometry = object(topology, o);
  return id == null && bbox == null ? {type: "Feature", properties: properties, geometry: geometry}
      : bbox == null ? {type: "Feature", id: id, properties: properties, geometry: geometry}
      : {type: "Feature", id: id, bbox: bbox, properties: properties, geometry: geometry};
}

function object(topology, o) {
  var transformPoint = transform(topology.transform),
      arcs = topology.arcs;

  function arc(i, points) {
    if (points.length) points.pop();
    for (var a = arcs[i < 0 ? ~i : i], k = 0, n = a.length; k < n; ++k) {
      points.push(transformPoint(a[k], k));
    }
    if (i < 0) reverse(points, n);
  }

  function point(p) {
    return transformPoint(p);
  }

  function line(arcs) {
    var points = [];
    for (var i = 0, n = arcs.length; i < n; ++i) arc(arcs[i], points);
    if (points.length < 2) points.push(points[0]); // This should never happen per the specification.
    return points;
  }

  function ring(arcs) {
    var points = line(arcs);
    while (points.length < 4) points.push(points[0]); // This may happen if an arc has only two points.
    return points;
  }

  function polygon(arcs) {
    return arcs.map(ring);
  }

  function geometry(o) {
    var type = o.type, coordinates;
    switch (type) {
      case "GeometryCollection": return {type: type, geometries: o.geometries.map(geometry)};
      case "Point": coordinates = point(o.coordinates); break;
      case "MultiPoint": coordinates = o.coordinates.map(point); break;
      case "LineString": coordinates = line(o.arcs); break;
      case "MultiLineString": coordinates = o.arcs.map(line); break;
      case "Polygon": coordinates = polygon(o.arcs); break;
      case "MultiPolygon": coordinates = o.arcs.map(polygon); break;
      default: return null;
    }
    return {type: type, coordinates: coordinates};
  }

  return geometry(o);
}

var stitch = function(topology, arcs) {
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
};

var mesh = function(topology) {
  return object(topology, meshArcs.apply(this, arguments));
};

function meshArcs(topology, object$$1, filter) {
  var arcs, i, n;
  if (arguments.length > 1) arcs = extractArcs(topology, object$$1, filter);
  else for (i = 0, arcs = new Array(n = topology.arcs.length); i < n; ++i) arcs[i] = i;
  return {type: "MultiLineString", arcs: stitch(topology, arcs)};
}

function extractArcs(topology, object$$1, filter) {
  var arcs = [],
      geomsByArc = [],
      geom;

  function extract0(i) {
    var j = i < 0 ? ~i : i;
    (geomsByArc[j] || (geomsByArc[j] = [])).push({i: i, g: geom});
  }

  function extract1(arcs) {
    arcs.forEach(extract0);
  }

  function extract2(arcs) {
    arcs.forEach(extract1);
  }

  function extract3(arcs) {
    arcs.forEach(extract2);
  }

  function geometry(o) {
    switch (geom = o, o.type) {
      case "GeometryCollection": o.geometries.forEach(geometry); break;
      case "LineString": extract1(o.arcs); break;
      case "MultiLineString": case "Polygon": extract2(o.arcs); break;
      case "MultiPolygon": extract3(o.arcs); break;
    }
  }

  geometry(object$$1);

  geomsByArc.forEach(filter == null
      ? function(geoms) { arcs.push(geoms[0].i); }
      : function(geoms) { if (filter(geoms[0].g, geoms[geoms.length - 1].g)) arcs.push(geoms[0].i); });

  return arcs;
}

function planarRingArea(ring) {
  var i = -1, n = ring.length, a, b = ring[n - 1], area = 0;
  while (++i < n) a = b, b = ring[i], area += a[0] * b[1] - a[1] * b[0];
  return Math.abs(area); // Note: doubled area!
}

var merge = function(topology) {
  return object(topology, mergeArcs.apply(this, arguments));
};

function mergeArcs(topology, objects) {
  var polygonsByArc = {},
      polygons = [],
      groups = [];

  objects.forEach(geometry);

  function geometry(o) {
    switch (o.type) {
      case "GeometryCollection": o.geometries.forEach(geometry); break;
      case "Polygon": extract(o.arcs); break;
      case "MultiPolygon": o.arcs.forEach(extract); break;
    }
  }

  function extract(polygon) {
    polygon.forEach(function(ring) {
      ring.forEach(function(arc) {
        (polygonsByArc[arc = arc < 0 ? ~arc : arc] || (polygonsByArc[arc] = [])).push(polygon);
      });
    });
    polygons.push(polygon);
  }

  function area(ring) {
    return planarRingArea(object(topology, {type: "Polygon", arcs: [ring]}).coordinates[0]);
  }

  polygons.forEach(function(polygon) {
    if (!polygon._) {
      var group = [],
          neighbors = [polygon];
      polygon._ = 1;
      groups.push(group);
      while (polygon = neighbors.pop()) {
        group.push(polygon);
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
    arcs: groups.map(function(polygons) {
      var arcs = [], n;

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
      arcs = stitch(topology, arcs);

      // If more than one ring is returned,
      // at most one of these rings can be the exterior;
      // choose the one with the greatest absolute area.
      if ((n = arcs.length) > 1) {
        for (var i = 1, k = area(arcs[0]), ki, t; i < n; ++i) {
          if ((ki = area(arcs[i])) > k) {
            t = arcs[0], arcs[0] = arcs[i], arcs[i] = t, k = ki;
          }
        }
      }

      return arcs;
    })
  };
}

var bisect = function(a, x) {
  var lo = 0, hi = a.length;
  while (lo < hi) {
    var mid = lo + hi >>> 1;
    if (a[mid] < x) lo = mid + 1;
    else hi = mid;
  }
  return lo;
};

var neighbors = function(objects) {
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
};

var untransform = function(transform) {
  if (transform == null) return identity;
  var x0,
      y0,
      kx = transform.scale[0],
      ky = transform.scale[1],
      dx = transform.translate[0],
      dy = transform.translate[1];
  return function(input, i) {
    if (!i) x0 = y0 = 0;
    var j = 2,
        n = input.length,
        output = new Array(n),
        x1 = Math.round((input[0] - dx) / kx),
        y1 = Math.round((input[1] - dy) / ky);
    output[0] = x1 - x0, x0 = x1;
    output[1] = y1 - y0, y0 = y1;
    while (j < n) output[j] = input[j], ++j;
    return output;
  };
};

var quantize = function(topology, transform) {
  if (topology.transform) throw new Error("already quantized");

  if (!transform || !transform.scale) {
    if (!((n = Math.floor(transform)) >= 2)) throw new Error("n must be ≥2");
    box = topology.bbox || bbox(topology);
    var x0 = box[0], y0 = box[1], x1 = box[2], y1 = box[3], n;
    transform = {scale: [x1 - x0 ? (x1 - x0) / (n - 1) : 1, y1 - y0 ? (y1 - y0) / (n - 1) : 1], translate: [x0, y0]};
  } else {
    box = topology.bbox;
  }

  var t = untransform(transform), box, key, inputs = topology.objects, outputs = {};

  function quantizePoint(point) {
    return t(point);
  }

  function quantizeGeometry(input) {
    var output;
    switch (input.type) {
      case "GeometryCollection": output = {type: "GeometryCollection", geometries: input.geometries.map(quantizeGeometry)}; break;
      case "Point": output = {type: "Point", coordinates: quantizePoint(input.coordinates)}; break;
      case "MultiPoint": output = {type: "MultiPoint", coordinates: input.coordinates.map(quantizePoint)}; break;
      default: return input;
    }
    if (input.id != null) output.id = input.id;
    if (input.bbox != null) output.bbox = input.bbox;
    if (input.properties != null) output.properties = input.properties;
    return output;
  }

  function quantizeArc(input) {
    var i = 0, j = 1, n = input.length, p, output = new Array(n); // pessimistic
    output[0] = t(input[0], 0);
    while (++i < n) if ((p = t(input[i], i))[0] || p[1]) output[j++] = p; // non-coincident points
    if (j === 1) output[j++] = [0, 0]; // an arc must have at least two points
    output.length = j;
    return output;
  }

  for (key in inputs) outputs[key] = quantizeGeometry(inputs[key]);

  return {
    type: "Topology",
    bbox: box,
    transform: transform,
    objects: outputs,
    arcs: topology.arcs.map(quantizeArc)
  };
};

exports.bbox = bbox;
exports.feature = feature;
exports.mesh = mesh;
exports.meshArcs = meshArcs;
exports.merge = merge;
exports.mergeArcs = mergeArcs;
exports.neighbors = neighbors;
exports.quantize = quantize;
exports.transform = transform;
exports.untransform = untransform;

Object.defineProperty(exports, '__esModule', { value: true });

})));

},{}],25:[function(require,module,exports){
// https://github.com/topojson/topojson-server Version 3.0.0. Copyright 2017 Mike Bostock.
(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
	typeof define === 'function' && define.amd ? define(['exports'], factory) :
	(factory((global.topojson = global.topojson || {})));
}(this, (function (exports) { 'use strict';

// Computes the bounding box of the specified hash of GeoJSON objects.
var bounds = function(objects) {
  var x0 = Infinity,
      y0 = Infinity,
      x1 = -Infinity,
      y1 = -Infinity;

  function boundGeometry(geometry) {
    if (geometry != null && boundGeometryType.hasOwnProperty(geometry.type)) boundGeometryType[geometry.type](geometry);
  }

  var boundGeometryType = {
    GeometryCollection: function(o) { o.geometries.forEach(boundGeometry); },
    Point: function(o) { boundPoint(o.coordinates); },
    MultiPoint: function(o) { o.coordinates.forEach(boundPoint); },
    LineString: function(o) { boundLine(o.arcs); },
    MultiLineString: function(o) { o.arcs.forEach(boundLine); },
    Polygon: function(o) { o.arcs.forEach(boundLine); },
    MultiPolygon: function(o) { o.arcs.forEach(boundMultiLine); }
  };

  function boundPoint(coordinates) {
    var x = coordinates[0],
        y = coordinates[1];
    if (x < x0) x0 = x;
    if (x > x1) x1 = x;
    if (y < y0) y0 = y;
    if (y > y1) y1 = y;
  }

  function boundLine(coordinates) {
    coordinates.forEach(boundPoint);
  }

  function boundMultiLine(coordinates) {
    coordinates.forEach(boundLine);
  }

  for (var key in objects) {
    boundGeometry(objects[key]);
  }

  return x1 >= x0 && y1 >= y0 ? [x0, y0, x1, y1] : undefined;
};

var hashset = function(size, hash, equal, type, empty) {
  if (arguments.length === 3) {
    type = Array;
    empty = null;
  }

  var store = new type(size = 1 << Math.max(4, Math.ceil(Math.log(size) / Math.LN2))),
      mask = size - 1;

  for (var i = 0; i < size; ++i) {
    store[i] = empty;
  }

  function add(value) {
    var index = hash(value) & mask,
        match = store[index],
        collisions = 0;
    while (match != empty) {
      if (equal(match, value)) return true;
      if (++collisions >= size) throw new Error("full hashset");
      match = store[index = (index + 1) & mask];
    }
    store[index] = value;
    return true;
  }

  function has(value) {
    var index = hash(value) & mask,
        match = store[index],
        collisions = 0;
    while (match != empty) {
      if (equal(match, value)) return true;
      if (++collisions >= size) break;
      match = store[index = (index + 1) & mask];
    }
    return false;
  }

  function values() {
    var values = [];
    for (var i = 0, n = store.length; i < n; ++i) {
      var match = store[i];
      if (match != empty) values.push(match);
    }
    return values;
  }

  return {
    add: add,
    has: has,
    values: values
  };
};

var hashmap = function(size, hash, equal, keyType, keyEmpty, valueType) {
  if (arguments.length === 3) {
    keyType = valueType = Array;
    keyEmpty = null;
  }

  var keystore = new keyType(size = 1 << Math.max(4, Math.ceil(Math.log(size) / Math.LN2))),
      valstore = new valueType(size),
      mask = size - 1;

  for (var i = 0; i < size; ++i) {
    keystore[i] = keyEmpty;
  }

  function set(key, value) {
    var index = hash(key) & mask,
        matchKey = keystore[index],
        collisions = 0;
    while (matchKey != keyEmpty) {
      if (equal(matchKey, key)) return valstore[index] = value;
      if (++collisions >= size) throw new Error("full hashmap");
      matchKey = keystore[index = (index + 1) & mask];
    }
    keystore[index] = key;
    valstore[index] = value;
    return value;
  }

  function maybeSet(key, value) {
    var index = hash(key) & mask,
        matchKey = keystore[index],
        collisions = 0;
    while (matchKey != keyEmpty) {
      if (equal(matchKey, key)) return valstore[index];
      if (++collisions >= size) throw new Error("full hashmap");
      matchKey = keystore[index = (index + 1) & mask];
    }
    keystore[index] = key;
    valstore[index] = value;
    return value;
  }

  function get(key, missingValue) {
    var index = hash(key) & mask,
        matchKey = keystore[index],
        collisions = 0;
    while (matchKey != keyEmpty) {
      if (equal(matchKey, key)) return valstore[index];
      if (++collisions >= size) break;
      matchKey = keystore[index = (index + 1) & mask];
    }
    return missingValue;
  }

  function keys() {
    var keys = [];
    for (var i = 0, n = keystore.length; i < n; ++i) {
      var matchKey = keystore[i];
      if (matchKey != keyEmpty) keys.push(matchKey);
    }
    return keys;
  }

  return {
    set: set,
    maybeSet: maybeSet, // set if unset
    get: get,
    keys: keys
  };
};

var equalPoint = function(pointA, pointB) {
  return pointA[0] === pointB[0] && pointA[1] === pointB[1];
};

// TODO if quantized, use simpler Int32 hashing?

var buffer = new ArrayBuffer(16);
var floats = new Float64Array(buffer);
var uints = new Uint32Array(buffer);

var hashPoint = function(point) {
  floats[0] = point[0];
  floats[1] = point[1];
  var hash = uints[0] ^ uints[1];
  hash = hash << 5 ^ hash >> 7 ^ uints[2] ^ uints[3];
  return hash & 0x7fffffff;
};

// Given an extracted (pre-)topology, identifies all of the junctions. These are
// the points at which arcs (lines or rings) will need to be cut so that each
// arc is represented uniquely.
//
// A junction is a point where at least one arc deviates from another arc going
// through the same point. For example, consider the point B. If there is a arc
// through ABC and another arc through CBA, then B is not a junction because in
// both cases the adjacent point pairs are {A,C}. However, if there is an
// additional arc ABD, then {A,D} != {A,C}, and thus B becomes a junction.
//
// For a closed ring ABCA, the first point A’s adjacent points are the second
// and last point {B,C}. For a line, the first and last point are always
// considered junctions, even if the line is closed; this ensures that a closed
// line is never rotated.
var join = function(topology) {
  var coordinates = topology.coordinates,
      lines = topology.lines,
      rings = topology.rings,
      indexes = index(),
      visitedByIndex = new Int32Array(coordinates.length),
      leftByIndex = new Int32Array(coordinates.length),
      rightByIndex = new Int32Array(coordinates.length),
      junctionByIndex = new Int8Array(coordinates.length),
      junctionCount = 0, // upper bound on number of junctions
      i, n,
      previousIndex,
      currentIndex,
      nextIndex;

  for (i = 0, n = coordinates.length; i < n; ++i) {
    visitedByIndex[i] = leftByIndex[i] = rightByIndex[i] = -1;
  }

  for (i = 0, n = lines.length; i < n; ++i) {
    var line = lines[i],
        lineStart = line[0],
        lineEnd = line[1];
    currentIndex = indexes[lineStart];
    nextIndex = indexes[++lineStart];
    ++junctionCount, junctionByIndex[currentIndex] = 1; // start
    while (++lineStart <= lineEnd) {
      sequence(i, previousIndex = currentIndex, currentIndex = nextIndex, nextIndex = indexes[lineStart]);
    }
    ++junctionCount, junctionByIndex[nextIndex] = 1; // end
  }

  for (i = 0, n = coordinates.length; i < n; ++i) {
    visitedByIndex[i] = -1;
  }

  for (i = 0, n = rings.length; i < n; ++i) {
    var ring = rings[i],
        ringStart = ring[0] + 1,
        ringEnd = ring[1];
    previousIndex = indexes[ringEnd - 1];
    currentIndex = indexes[ringStart - 1];
    nextIndex = indexes[ringStart];
    sequence(i, previousIndex, currentIndex, nextIndex);
    while (++ringStart <= ringEnd) {
      sequence(i, previousIndex = currentIndex, currentIndex = nextIndex, nextIndex = indexes[ringStart]);
    }
  }

  function sequence(i, previousIndex, currentIndex, nextIndex) {
    if (visitedByIndex[currentIndex] === i) return; // ignore self-intersection
    visitedByIndex[currentIndex] = i;
    var leftIndex = leftByIndex[currentIndex];
    if (leftIndex >= 0) {
      var rightIndex = rightByIndex[currentIndex];
      if ((leftIndex !== previousIndex || rightIndex !== nextIndex)
        && (leftIndex !== nextIndex || rightIndex !== previousIndex)) {
        ++junctionCount, junctionByIndex[currentIndex] = 1;
      }
    } else {
      leftByIndex[currentIndex] = previousIndex;
      rightByIndex[currentIndex] = nextIndex;
    }
  }

  function index() {
    var indexByPoint = hashmap(coordinates.length * 1.4, hashIndex, equalIndex, Int32Array, -1, Int32Array),
        indexes = new Int32Array(coordinates.length);

    for (var i = 0, n = coordinates.length; i < n; ++i) {
      indexes[i] = indexByPoint.maybeSet(i, i);
    }

    return indexes;
  }

  function hashIndex(i) {
    return hashPoint(coordinates[i]);
  }

  function equalIndex(i, j) {
    return equalPoint(coordinates[i], coordinates[j]);
  }

  visitedByIndex = leftByIndex = rightByIndex = null;

  var junctionByPoint = hashset(junctionCount * 1.4, hashPoint, equalPoint), j;

  // Convert back to a standard hashset by point for caller convenience.
  for (i = 0, n = coordinates.length; i < n; ++i) {
    if (junctionByIndex[j = indexes[i]]) {
      junctionByPoint.add(coordinates[j]);
    }
  }

  return junctionByPoint;
};

// Given an extracted (pre-)topology, cuts (or rotates) arcs so that all shared
// point sequences are identified. The topology can then be subsequently deduped
// to remove exact duplicate arcs.
var cut = function(topology) {
  var junctions = join(topology),
      coordinates = topology.coordinates,
      lines = topology.lines,
      rings = topology.rings,
      next,
      i, n;

  for (i = 0, n = lines.length; i < n; ++i) {
    var line = lines[i],
        lineMid = line[0],
        lineEnd = line[1];
    while (++lineMid < lineEnd) {
      if (junctions.has(coordinates[lineMid])) {
        next = {0: lineMid, 1: line[1]};
        line[1] = lineMid;
        line = line.next = next;
      }
    }
  }

  for (i = 0, n = rings.length; i < n; ++i) {
    var ring = rings[i],
        ringStart = ring[0],
        ringMid = ringStart,
        ringEnd = ring[1],
        ringFixed = junctions.has(coordinates[ringStart]);
    while (++ringMid < ringEnd) {
      if (junctions.has(coordinates[ringMid])) {
        if (ringFixed) {
          next = {0: ringMid, 1: ring[1]};
          ring[1] = ringMid;
          ring = ring.next = next;
        } else { // For the first junction, we can rotate rather than cut.
          rotateArray(coordinates, ringStart, ringEnd, ringEnd - ringMid);
          coordinates[ringEnd] = coordinates[ringStart];
          ringFixed = true;
          ringMid = ringStart; // restart; we may have skipped junctions
        }
      }
    }
  }

  return topology;
};

function rotateArray(array, start, end, offset) {
  reverse(array, start, end);
  reverse(array, start, start + offset);
  reverse(array, start + offset, end);
}

function reverse(array, start, end) {
  for (var mid = start + ((end-- - start) >> 1), t; start < mid; ++start, --end) {
    t = array[start], array[start] = array[end], array[end] = t;
  }
}

// Given a cut topology, combines duplicate arcs.
var dedup = function(topology) {
  var coordinates = topology.coordinates,
      lines = topology.lines, line,
      rings = topology.rings, ring,
      arcCount = lines.length + rings.length,
      i, n;

  delete topology.lines;
  delete topology.rings;

  // Count the number of (non-unique) arcs to initialize the hashmap safely.
  for (i = 0, n = lines.length; i < n; ++i) {
    line = lines[i]; while (line = line.next) ++arcCount;
  }
  for (i = 0, n = rings.length; i < n; ++i) {
    ring = rings[i]; while (ring = ring.next) ++arcCount;
  }

  var arcsByEnd = hashmap(arcCount * 2 * 1.4, hashPoint, equalPoint),
      arcs = topology.arcs = [];

  for (i = 0, n = lines.length; i < n; ++i) {
    line = lines[i];
    do {
      dedupLine(line);
    } while (line = line.next);
  }

  for (i = 0, n = rings.length; i < n; ++i) {
    ring = rings[i];
    if (ring.next) { // arc is no longer closed
      do {
        dedupLine(ring);
      } while (ring = ring.next);
    } else {
      dedupRing(ring);
    }
  }

  function dedupLine(arc) {
    var startPoint,
        endPoint,
        startArcs, startArc,
        endArcs, endArc,
        i, n;

    // Does this arc match an existing arc in order?
    if (startArcs = arcsByEnd.get(startPoint = coordinates[arc[0]])) {
      for (i = 0, n = startArcs.length; i < n; ++i) {
        startArc = startArcs[i];
        if (equalLine(startArc, arc)) {
          arc[0] = startArc[0];
          arc[1] = startArc[1];
          return;
        }
      }
    }

    // Does this arc match an existing arc in reverse order?
    if (endArcs = arcsByEnd.get(endPoint = coordinates[arc[1]])) {
      for (i = 0, n = endArcs.length; i < n; ++i) {
        endArc = endArcs[i];
        if (reverseEqualLine(endArc, arc)) {
          arc[1] = endArc[0];
          arc[0] = endArc[1];
          return;
        }
      }
    }

    if (startArcs) startArcs.push(arc); else arcsByEnd.set(startPoint, [arc]);
    if (endArcs) endArcs.push(arc); else arcsByEnd.set(endPoint, [arc]);
    arcs.push(arc);
  }

  function dedupRing(arc) {
    var endPoint,
        endArcs,
        endArc,
        i, n;

    // Does this arc match an existing line in order, or reverse order?
    // Rings are closed, so their start point and end point is the same.
    if (endArcs = arcsByEnd.get(endPoint = coordinates[arc[0]])) {
      for (i = 0, n = endArcs.length; i < n; ++i) {
        endArc = endArcs[i];
        if (equalRing(endArc, arc)) {
          arc[0] = endArc[0];
          arc[1] = endArc[1];
          return;
        }
        if (reverseEqualRing(endArc, arc)) {
          arc[0] = endArc[1];
          arc[1] = endArc[0];
          return;
        }
      }
    }

    // Otherwise, does this arc match an existing ring in order, or reverse order?
    if (endArcs = arcsByEnd.get(endPoint = coordinates[arc[0] + findMinimumOffset(arc)])) {
      for (i = 0, n = endArcs.length; i < n; ++i) {
        endArc = endArcs[i];
        if (equalRing(endArc, arc)) {
          arc[0] = endArc[0];
          arc[1] = endArc[1];
          return;
        }
        if (reverseEqualRing(endArc, arc)) {
          arc[0] = endArc[1];
          arc[1] = endArc[0];
          return;
        }
      }
    }

    if (endArcs) endArcs.push(arc); else arcsByEnd.set(endPoint, [arc]);
    arcs.push(arc);
  }

  function equalLine(arcA, arcB) {
    var ia = arcA[0], ib = arcB[0],
        ja = arcA[1], jb = arcB[1];
    if (ia - ja !== ib - jb) return false;
    for (; ia <= ja; ++ia, ++ib) if (!equalPoint(coordinates[ia], coordinates[ib])) return false;
    return true;
  }

  function reverseEqualLine(arcA, arcB) {
    var ia = arcA[0], ib = arcB[0],
        ja = arcA[1], jb = arcB[1];
    if (ia - ja !== ib - jb) return false;
    for (; ia <= ja; ++ia, --jb) if (!equalPoint(coordinates[ia], coordinates[jb])) return false;
    return true;
  }

  function equalRing(arcA, arcB) {
    var ia = arcA[0], ib = arcB[0],
        ja = arcA[1], jb = arcB[1],
        n = ja - ia;
    if (n !== jb - ib) return false;
    var ka = findMinimumOffset(arcA),
        kb = findMinimumOffset(arcB);
    for (var i = 0; i < n; ++i) {
      if (!equalPoint(coordinates[ia + (i + ka) % n], coordinates[ib + (i + kb) % n])) return false;
    }
    return true;
  }

  function reverseEqualRing(arcA, arcB) {
    var ia = arcA[0], ib = arcB[0],
        ja = arcA[1], jb = arcB[1],
        n = ja - ia;
    if (n !== jb - ib) return false;
    var ka = findMinimumOffset(arcA),
        kb = n - findMinimumOffset(arcB);
    for (var i = 0; i < n; ++i) {
      if (!equalPoint(coordinates[ia + (i + ka) % n], coordinates[jb - (i + kb) % n])) return false;
    }
    return true;
  }

  // Rings are rotated to a consistent, but arbitrary, start point.
  // This is necessary to detect when a ring and a rotated copy are dupes.
  function findMinimumOffset(arc) {
    var start = arc[0],
        end = arc[1],
        mid = start,
        minimum = mid,
        minimumPoint = coordinates[mid];
    while (++mid < end) {
      var point = coordinates[mid];
      if (point[0] < minimumPoint[0] || point[0] === minimumPoint[0] && point[1] < minimumPoint[1]) {
        minimum = mid;
        minimumPoint = point;
      }
    }
    return minimum - start;
  }

  return topology;
};

// Given an array of arcs in absolute (but already quantized!) coordinates,
// converts to fixed-point delta encoding.
// This is a destructive operation that modifies the given arcs!
var delta = function(arcs) {
  var i = -1,
      n = arcs.length;

  while (++i < n) {
    var arc = arcs[i],
        j = 0,
        k = 1,
        m = arc.length,
        point = arc[0],
        x0 = point[0],
        y0 = point[1],
        x1,
        y1;

    while (++j < m) {
      point = arc[j], x1 = point[0], y1 = point[1];
      if (x1 !== x0 || y1 !== y0) arc[k++] = [x1 - x0, y1 - y0], x0 = x1, y0 = y1;
    }

    if (k === 1) arc[k++] = [0, 0]; // Each arc must be an array of two or more positions.

    arc.length = k;
  }

  return arcs;
};

// Extracts the lines and rings from the specified hash of geometry objects.
//
// Returns an object with three properties:
//
// * coordinates - shared buffer of [x, y] coordinates
// * lines - lines extracted from the hash, of the form [start, end]
// * rings - rings extracted from the hash, of the form [start, end]
//
// For each ring or line, start and end represent inclusive indexes into the
// coordinates buffer. For rings (and closed lines), coordinates[start] equals
// coordinates[end].
//
// For each line or polygon geometry in the input hash, including nested
// geometries as in geometry collections, the `coordinates` array is replaced
// with an equivalent `arcs` array that, for each line (for line string
// geometries) or ring (for polygon geometries), points to one of the above
// lines or rings.
var extract = function(objects) {
  var index = -1,
      lines = [],
      rings = [],
      coordinates = [];

  function extractGeometry(geometry) {
    if (geometry && extractGeometryType.hasOwnProperty(geometry.type)) extractGeometryType[geometry.type](geometry);
  }

  var extractGeometryType = {
    GeometryCollection: function(o) { o.geometries.forEach(extractGeometry); },
    LineString: function(o) { o.arcs = extractLine(o.arcs); },
    MultiLineString: function(o) { o.arcs = o.arcs.map(extractLine); },
    Polygon: function(o) { o.arcs = o.arcs.map(extractRing); },
    MultiPolygon: function(o) { o.arcs = o.arcs.map(extractMultiRing); }
  };

  function extractLine(line) {
    for (var i = 0, n = line.length; i < n; ++i) coordinates[++index] = line[i];
    var arc = {0: index - n + 1, 1: index};
    lines.push(arc);
    return arc;
  }

  function extractRing(ring) {
    for (var i = 0, n = ring.length; i < n; ++i) coordinates[++index] = ring[i];
    var arc = {0: index - n + 1, 1: index};
    rings.push(arc);
    return arc;
  }

  function extractMultiRing(rings) {
    return rings.map(extractRing);
  }

  for (var key in objects) {
    extractGeometry(objects[key]);
  }

  return {
    type: "Topology",
    coordinates: coordinates,
    lines: lines,
    rings: rings,
    objects: objects
  };
};

// Given a hash of GeoJSON objects, returns a hash of GeoJSON geometry objects.
// Any null input geometry objects are represented as {type: null} in the output.
// Any feature.{id,properties,bbox} are transferred to the output geometry object.
// Each output geometry object is a shallow copy of the input (e.g., properties, coordinates)!
var geometry = function(inputs) {
  var outputs = {}, key;
  for (key in inputs) outputs[key] = geomifyObject(inputs[key]);
  return outputs;
};

function geomifyObject(input) {
  return input == null ? {type: null}
      : (input.type === "FeatureCollection" ? geomifyFeatureCollection
      : input.type === "Feature" ? geomifyFeature
      : geomifyGeometry)(input);
}

function geomifyFeatureCollection(input) {
  var output = {type: "GeometryCollection", geometries: input.features.map(geomifyFeature)};
  if (input.bbox != null) output.bbox = input.bbox;
  return output;
}

function geomifyFeature(input) {
  var output = geomifyGeometry(input.geometry), key; // eslint-disable-line no-unused-vars
  if (input.id != null) output.id = input.id;
  if (input.bbox != null) output.bbox = input.bbox;
  for (key in input.properties) { output.properties = input.properties; break; }
  return output;
}

function geomifyGeometry(input) {
  if (input == null) return {type: null};
  var output = input.type === "GeometryCollection" ? {type: "GeometryCollection", geometries: input.geometries.map(geomifyGeometry)}
      : input.type === "Point" || input.type === "MultiPoint" ? {type: input.type, coordinates: input.coordinates}
      : {type: input.type, arcs: input.coordinates}; // TODO Check for unknown types?
  if (input.bbox != null) output.bbox = input.bbox;
  return output;
}

var prequantize = function(objects, bbox, n) {
  var x0 = bbox[0],
      y0 = bbox[1],
      x1 = bbox[2],
      y1 = bbox[3],
      kx = x1 - x0 ? (n - 1) / (x1 - x0) : 1,
      ky = y1 - y0 ? (n - 1) / (y1 - y0) : 1;

  function quantizePoint(input) {
    return [Math.round((input[0] - x0) * kx), Math.round((input[1] - y0) * ky)];
  }

  function quantizePoints(input, m) {
    var i = -1,
        j = 0,
        n = input.length,
        output = new Array(n), // pessimistic
        pi,
        px,
        py,
        x,
        y;

    while (++i < n) {
      pi = input[i];
      x = Math.round((pi[0] - x0) * kx);
      y = Math.round((pi[1] - y0) * ky);
      if (x !== px || y !== py) output[j++] = [px = x, py = y]; // non-coincident points
    }

    output.length = j;
    while (j < m) j = output.push([output[0][0], output[0][1]]);
    return output;
  }

  function quantizeLine(input) {
    return quantizePoints(input, 2);
  }

  function quantizeRing(input) {
    return quantizePoints(input, 4);
  }

  function quantizePolygon(input) {
    return input.map(quantizeRing);
  }

  function quantizeGeometry(o) {
    if (o != null && quantizeGeometryType.hasOwnProperty(o.type)) quantizeGeometryType[o.type](o);
  }

  var quantizeGeometryType = {
    GeometryCollection: function(o) { o.geometries.forEach(quantizeGeometry); },
    Point: function(o) { o.coordinates = quantizePoint(o.coordinates); },
    MultiPoint: function(o) { o.coordinates = o.coordinates.map(quantizePoint); },
    LineString: function(o) { o.arcs = quantizeLine(o.arcs); },
    MultiLineString: function(o) { o.arcs = o.arcs.map(quantizeLine); },
    Polygon: function(o) { o.arcs = quantizePolygon(o.arcs); },
    MultiPolygon: function(o) { o.arcs = o.arcs.map(quantizePolygon); }
  };

  for (var key in objects) {
    quantizeGeometry(objects[key]);
  }

  return {
    scale: [1 / kx, 1 / ky],
    translate: [x0, y0]
  };
};

// Constructs the TopoJSON Topology for the specified hash of features.
// Each object in the specified hash must be a GeoJSON object,
// meaning FeatureCollection, a Feature or a geometry object.
var topology = function(objects, quantization) {
  var bbox = bounds(objects = geometry(objects)),
      transform = quantization > 0 && bbox && prequantize(objects, bbox, quantization),
      topology = dedup(cut(extract(objects))),
      coordinates = topology.coordinates,
      indexByArc = hashmap(topology.arcs.length * 1.4, hashArc, equalArc);

  objects = topology.objects; // for garbage collection
  topology.bbox = bbox;
  topology.arcs = topology.arcs.map(function(arc, i) {
    indexByArc.set(arc, i);
    return coordinates.slice(arc[0], arc[1] + 1);
  });

  delete topology.coordinates;
  coordinates = null;

  function indexGeometry(geometry$$1) {
    if (geometry$$1 && indexGeometryType.hasOwnProperty(geometry$$1.type)) indexGeometryType[geometry$$1.type](geometry$$1);
  }

  var indexGeometryType = {
    GeometryCollection: function(o) { o.geometries.forEach(indexGeometry); },
    LineString: function(o) { o.arcs = indexArcs(o.arcs); },
    MultiLineString: function(o) { o.arcs = o.arcs.map(indexArcs); },
    Polygon: function(o) { o.arcs = o.arcs.map(indexArcs); },
    MultiPolygon: function(o) { o.arcs = o.arcs.map(indexMultiArcs); }
  };

  function indexArcs(arc) {
    var indexes = [];
    do {
      var index = indexByArc.get(arc);
      indexes.push(arc[0] < arc[1] ? index : ~index);
    } while (arc = arc.next);
    return indexes;
  }

  function indexMultiArcs(arcs) {
    return arcs.map(indexArcs);
  }

  for (var key in objects) {
    indexGeometry(objects[key]);
  }

  if (transform) {
    topology.transform = transform;
    topology.arcs = delta(topology.arcs);
  }

  return topology;
};

function hashArc(arc) {
  var i = arc[0], j = arc[1], t;
  if (j < i) t = i, i = j, j = t;
  return i + 31 * j;
}

function equalArc(arcA, arcB) {
  var ia = arcA[0], ja = arcA[1],
      ib = arcB[0], jb = arcB[1], t;
  if (ja < ia) t = ia, ia = ja, ja = t;
  if (jb < ib) t = ib, ib = jb, jb = t;
  return ia === ib && ja === jb;
}

exports.topology = topology;

Object.defineProperty(exports, '__esModule', { value: true });

})));

},{}],26:[function(require,module,exports){
// https://github.com/topojson/topojson-simplify Version 3.0.2. Copyright 2017 Mike Bostock.
(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('topojson-client')) :
	typeof define === 'function' && define.amd ? define(['exports', 'topojson-client'], factory) :
	(factory((global.topojson = global.topojson || {}),global.topojson));
}(this, (function (exports,topojsonClient) { 'use strict';

var prune = function(topology) {
  var oldObjects = topology.objects,
      newObjects = {},
      oldArcs = topology.arcs,
      oldArcsLength = oldArcs.length,
      oldIndex = -1,
      newIndexByOldIndex = new Array(oldArcsLength),
      newArcsLength = 0,
      newArcs,
      newIndex = -1,
      key;

  function scanGeometry(input) {
    switch (input.type) {
      case "GeometryCollection": input.geometries.forEach(scanGeometry); break;
      case "LineString": scanArcs(input.arcs); break;
      case "MultiLineString": input.arcs.forEach(scanArcs); break;
      case "Polygon": input.arcs.forEach(scanArcs); break;
      case "MultiPolygon": input.arcs.forEach(scanMultiArcs); break;
    }
  }

  function scanArc(index) {
    if (index < 0) index = ~index;
    if (!newIndexByOldIndex[index]) newIndexByOldIndex[index] = 1, ++newArcsLength;
  }

  function scanArcs(arcs) {
    arcs.forEach(scanArc);
  }

  function scanMultiArcs(arcs) {
    arcs.forEach(scanArcs);
  }

  function reindexGeometry(input) {
    var output;
    switch (input.type) {
      case "GeometryCollection": output = {type: "GeometryCollection", geometries: input.geometries.map(reindexGeometry)}; break;
      case "LineString": output = {type: "LineString", arcs: reindexArcs(input.arcs)}; break;
      case "MultiLineString": output = {type: "MultiLineString", arcs: input.arcs.map(reindexArcs)}; break;
      case "Polygon": output = {type: "Polygon", arcs: input.arcs.map(reindexArcs)}; break;
      case "MultiPolygon": output = {type: "MultiPolygon", arcs: input.arcs.map(reindexMultiArcs)}; break;
      default: return input;
    }
    if (input.id != null) output.id = input.id;
    if (input.bbox != null) output.bbox = input.bbox;
    if (input.properties != null) output.properties = input.properties;
    return output;
  }

  function reindexArc(oldIndex) {
    return oldIndex < 0 ? ~newIndexByOldIndex[~oldIndex] : newIndexByOldIndex[oldIndex];
  }

  function reindexArcs(arcs) {
    return arcs.map(reindexArc);
  }

  function reindexMultiArcs(arcs) {
    return arcs.map(reindexArcs);
  }

  for (key in oldObjects) {
    scanGeometry(oldObjects[key]);
  }

  newArcs = new Array(newArcsLength);

  while (++oldIndex < oldArcsLength) {
    if (newIndexByOldIndex[oldIndex]) {
      newIndexByOldIndex[oldIndex] = ++newIndex;
      newArcs[newIndex] = oldArcs[oldIndex];
    }
  }

  for (key in oldObjects) {
    newObjects[key] = reindexGeometry(oldObjects[key]);
  }

  return {
    type: "Topology",
    bbox: topology.bbox,
    transform: topology.transform,
    objects: newObjects,
    arcs: newArcs
  };
};

var filter = function(topology, filter) {
  var oldObjects = topology.objects,
      newObjects = {},
      key;

  if (filter == null) filter = filterTrue;

  function filterGeometry(input) {
    var output, arcs;
    switch (input.type) {
      case "Polygon": {
        arcs = filterRings(input.arcs);
        output = arcs ? {type: "Polygon", arcs: arcs} : {type: null};
        break;
      }
      case "MultiPolygon": {
        arcs = input.arcs.map(filterRings).filter(filterIdentity);
        output = arcs.length ? {type: "MultiPolygon", arcs: arcs} : {type: null};
        break;
      }
      case "GeometryCollection": {
        arcs = input.geometries.map(filterGeometry).filter(filterNotNull);
        output = arcs.length ? {type: "GeometryCollection", geometries: arcs} : {type: null};
        break;
      }
      default: return input;
    }
    if (input.id != null) output.id = input.id;
    if (input.bbox != null) output.bbox = input.bbox;
    if (input.properties != null) output.properties = input.properties;
    return output;
  }

  function filterRings(arcs) {
    return arcs.length && filterExteriorRing(arcs[0]) // if the exterior is small, ignore any holes
        ? [arcs[0]].concat(arcs.slice(1).filter(filterInteriorRing))
        : null;
  }

  function filterExteriorRing(ring) {
    return filter(ring, false);
  }

  function filterInteriorRing(ring) {
    return filter(ring, true);
  }

  for (key in oldObjects) {
    newObjects[key] = filterGeometry(oldObjects[key]);
  }

  return prune({
    type: "Topology",
    bbox: topology.bbox,
    transform: topology.transform,
    objects: newObjects,
    arcs: topology.arcs
  });
};

function filterTrue() {
  return true;
}

function filterIdentity(x) {
  return x;
}

function filterNotNull(geometry) {
  return geometry.type != null;
}

var filterAttached = function(topology) {
  var ownerByArc = new Array(topology.arcs.length), // arc index -> index of unique associated ring, or -1 if used by multiple rings
      ownerIndex = 0,
      key;

  function testGeometry(o) {
    switch (o.type) {
      case "GeometryCollection": o.geometries.forEach(testGeometry); break;
      case "Polygon": testArcs(o.arcs); break;
      case "MultiPolygon": o.arcs.forEach(testArcs); break;
    }
  }

  function testArcs(arcs) {
    for (var i = 0, n = arcs.length; i < n; ++i, ++ownerIndex) {
      for (var ring = arcs[i], j = 0, m = ring.length; j < m; ++j) {
        var arc = ring[j];
        if (arc < 0) arc = ~arc;
        var owner = ownerByArc[arc];
        if (owner == null) ownerByArc[arc] = ownerIndex;
        else if (owner !== ownerIndex) ownerByArc[arc] = -1;
      }
    }
  }

  for (key in topology.objects) {
    testGeometry(topology.objects[key]);
  }

  return function(ring) {
    for (var j = 0, m = ring.length, arc; j < m; ++j) {
      if (ownerByArc[(arc = ring[j]) < 0 ? ~arc : arc] === -1) {
        return true;
      }
    }
    return false;
  };
};

function planarTriangleArea(triangle) {
  var a = triangle[0], b = triangle[1], c = triangle[2];
  return Math.abs((a[0] - c[0]) * (b[1] - a[1]) - (a[0] - b[0]) * (c[1] - a[1])) / 2;
}

function planarRingArea(ring) {
  var i = -1, n = ring.length, a, b = ring[n - 1], area = 0;
  while (++i < n) a = b, b = ring[i], area += a[0] * b[1] - a[1] * b[0];
  return Math.abs(area) / 2;
}

var filterWeight = function(topology, minWeight, weight) {
  minWeight = minWeight == null ? Number.MIN_VALUE : +minWeight;

  if (weight == null) weight = planarRingArea;

  return function(ring, interior) {
    return weight(topojsonClient.feature(topology, {type: "Polygon", arcs: [ring]}).geometry.coordinates[0], interior) >= minWeight;
  };
};

var filterAttachedWeight = function(topology, minWeight, weight) {
  var a = filterAttached(topology),
      w = filterWeight(topology, minWeight, weight);
  return function(ring, interior) {
    return a(ring, interior) || w(ring, interior);
  };
};

function compare(a, b) {
  return a[1][2] - b[1][2];
}

var newHeap = function() {
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
    if (i !== --size) object = array[size], (compare(object, removed) < 0 ? up : down)(array[object._ = i] = object, i);
    return i;
  };

  function up(object, i) {
    while (i > 0) {
      var j = ((i + 1) >> 1) - 1,
          parent = array[j];
      if (compare(object, parent) >= 0) break;
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
      if (l < size && compare(array[l], child) < 0) child = array[j = l];
      if (r < size && compare(array[r], child) < 0) child = array[j = r];
      if (j === i) break;
      array[child._ = i] = child;
      array[object._ = i = j] = object;
    }
  }

  return heap;
};

function copy(point) {
  return [point[0], point[1], 0];
}

var presimplify = function(topology, weight) {
  var point = topology.transform ? topojsonClient.transform(topology.transform) : copy,
      heap = newHeap();

  if (weight == null) weight = planarTriangleArea;

  var arcs = topology.arcs.map(function(arc) {
    var triangles = [],
        maxWeight = 0,
        triangle,
        i,
        n;

    arc = arc.map(point);

    for (i = 1, n = arc.length - 1; i < n; ++i) {
      triangle = [arc[i - 1], arc[i], arc[i + 1]];
      triangle[1][2] = weight(triangle);
      triangles.push(triangle);
      heap.push(triangle);
    }

    // Always keep the arc endpoints!
    arc[0][2] = arc[n][2] = Infinity;

    for (i = 0, n = triangles.length; i < n; ++i) {
      triangle = triangles[i];
      triangle.previous = triangles[i - 1];
      triangle.next = triangles[i + 1];
    }

    while (triangle = heap.pop()) {
      var previous = triangle.previous,
          next = triangle.next;

      // If the weight of the current point is less than that of the previous
      // point to be eliminated, use the latter’s weight instead. This ensures
      // that the current point cannot be eliminated without eliminating
      // previously- eliminated points.
      if (triangle[1][2] < maxWeight) triangle[1][2] = maxWeight;
      else maxWeight = triangle[1][2];

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

    return arc;
  });

  function update(triangle) {
    heap.remove(triangle);
    triangle[1][2] = weight(triangle);
    heap.push(triangle);
  }

  return {
    type: "Topology",
    bbox: topology.bbox,
    objects: topology.objects,
    arcs: arcs
  };
};

var quantile = function(topology, p) {
  var array = [];

  topology.arcs.forEach(function(arc) {
    arc.forEach(function(point) {
      if (isFinite(point[2])) { // Ignore endpoints, whose weight is Infinity.
        array.push(point[2]);
      }
    });
  });

  return array.length && quantile$1(array.sort(descending), p);
};

function quantile$1(array, p) {
  if (!(n = array.length)) return;
  if ((p = +p) <= 0 || n < 2) return array[0];
  if (p >= 1) return array[n - 1];
  var n,
      h = (n - 1) * p,
      i = Math.floor(h),
      a = array[i],
      b = array[i + 1];
  return a + (b - a) * (h - i);
}

function descending(a, b) {
  return b - a;
}

var simplify = function(topology, minWeight) {
  minWeight = minWeight == null ? Number.MIN_VALUE : +minWeight;

  // Remove points whose weight is less than the minimum weight.
  var arcs = topology.arcs.map(function(input) {
    var i = -1,
        j = 0,
        n = input.length,
        output = new Array(n), // pessimistic
        point;

    while (++i < n) {
      if ((point = input[i])[2] >= minWeight) {
        output[j++] = [point[0], point[1]];
      }
    }

    output.length = j;
    return output;
  });

  return {
    type: "Topology",
    transform: topology.transform,
    bbox: topology.bbox,
    objects: topology.objects,
    arcs: arcs
  };
};

var pi = Math.PI;
var tau = 2 * pi;
var quarterPi = pi / 4;
var radians = pi / 180;
var abs = Math.abs;
var atan2 = Math.atan2;
var cos = Math.cos;
var sin = Math.sin;

function halfArea(ring, closed) {
  var i = 0,
      n = ring.length,
      sum = 0,
      point = ring[closed ? i++ : n - 1],
      lambda0, lambda1 = point[0] * radians,
      phi1 = (point[1] * radians) / 2 + quarterPi,
      cosPhi0, cosPhi1 = cos(phi1),
      sinPhi0, sinPhi1 = sin(phi1);

  for (; i < n; ++i) {
    point = ring[i];
    lambda0 = lambda1, lambda1 = point[0] * radians;
    phi1 = (point[1] * radians) / 2 + quarterPi;
    cosPhi0 = cosPhi1, cosPhi1 = cos(phi1);
    sinPhi0 = sinPhi1, sinPhi1 = sin(phi1);

    // Spherical excess E for a spherical triangle with vertices: south pole,
    // previous point, current point.  Uses a formula derived from Cagnoli’s
    // theorem.  See Todhunter, Spherical Trig. (1871), Sec. 103, Eq. (2).
    // See https://github.com/d3/d3-geo/blob/master/README.md#geoArea
    var dLambda = lambda1 - lambda0,
        sdLambda = dLambda >= 0 ? 1 : -1,
        adLambda = sdLambda * dLambda,
        k = sinPhi0 * sinPhi1,
        u = cosPhi0 * cosPhi1 + k * cos(adLambda),
        v = k * sdLambda * sin(adLambda);
    sum += atan2(v, u);
  }

  return sum;
}

function sphericalRingArea(ring, interior) {
  var sum = halfArea(ring, true);
  if (interior) sum *= -1;
  return (sum < 0 ? tau + sum : sum) * 2;
}

function sphericalTriangleArea(t) {
  return abs(halfArea(t, false)) * 2;
}

exports.filter = filter;
exports.filterAttached = filterAttached;
exports.filterAttachedWeight = filterAttachedWeight;
exports.filterWeight = filterWeight;
exports.planarRingArea = planarRingArea;
exports.planarTriangleArea = planarTriangleArea;
exports.presimplify = presimplify;
exports.quantile = quantile;
exports.simplify = simplify;
exports.sphericalRingArea = sphericalRingArea;
exports.sphericalTriangleArea = sphericalTriangleArea;

Object.defineProperty(exports, '__esModule', { value: true });

})));

},{"topojson-client":24}]},{},[12])(12)
});

//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJidWlsZC9hZGRGZWF0dXJlLmpzIiwiYnVpbGQvYWRkRmlsdGVyLmpzIiwiYnVpbGQvYWRkTWFwLmpzIiwiYnVpbGQvYWRkTWFya2VyLmpzIiwiYnVpbGQvYWRkUGFuZWwuanMiLCJidWlsZC9jZW50ZXIuanMiLCJidWlsZC9jb25maWcuanMiLCJidWlsZC9maWx0ZXIuanMiLCJidWlsZC9maW5kTWFya2VyQnlJZC5qcyIsImJ1aWxkL2luZm9XaW5kb3cuanMiLCJidWlsZC9sb2NhdGUuanMiLCJidWlsZC9tYXBUb29scy5qcyIsImJ1aWxkL21hcHMuanMiLCJidWlsZC9yZW1vdmVNYXJrZXIuanMiLCJidWlsZC9yZXNldE1hcmtlci5qcyIsImJ1aWxkL3RlbXBsYXRlLmpzIiwiYnVpbGQvdXBkYXRlRmVhdHVyZS5qcyIsImJ1aWxkL3VwZGF0ZU1hcC5qcyIsImJ1aWxkL3VwZGF0ZU1hcmtlci5qcyIsImJ1aWxkL3V0aWxzLmpzIiwibm9kZV9tb2R1bGVzL2Nyb3NzZmlsdGVyL2Nyb3NzZmlsdGVyLmpzIiwibm9kZV9tb2R1bGVzL2Nyb3NzZmlsdGVyL2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL3RvcG9qc29uL2Rpc3QvdG9wb2pzb24ubm9kZS5qcyIsIm5vZGVfbW9kdWxlcy90b3BvanNvbi9ub2RlX21vZHVsZXMvdG9wb2pzb24tY2xpZW50L2Rpc3QvdG9wb2pzb24tY2xpZW50LmpzIiwibm9kZV9tb2R1bGVzL3RvcG9qc29uL25vZGVfbW9kdWxlcy90b3BvanNvbi1zZXJ2ZXIvZGlzdC90b3BvanNvbi1zZXJ2ZXIuanMiLCJub2RlX21vZHVsZXMvdG9wb2pzb24vbm9kZV9tb2R1bGVzL3RvcG9qc29uLXNpbXBsaWZ5L2Rpc3QvdG9wb2pzb24tc2ltcGxpZnkuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQy9GQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxSUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5RkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNmQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDckdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2RUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNWQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzVFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbkNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDekRBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbkhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6M0NBO0FBQ0E7O0FDREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNiQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pmQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcDBCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiLy8vIDxyZWZlcmVuY2UgcGF0aD1cInR5cGluZ3MvdHNkLmQudHNcIi8+XG52YXIgdG9wb2pzb24gPSByZXF1aXJlKCd0b3BvanNvbicpO1xudmFyIHV0aWxzID0gcmVxdWlyZSgnLi91dGlscycpO1xudmFyIGFkZEZpbHRlciA9IHJlcXVpcmUoJy4vYWRkRmlsdGVyJyk7XG52YXIgQWRkRmVhdHVyZSA9IChmdW5jdGlvbiAoKSB7XG4gICAgZnVuY3Rpb24gQWRkRmVhdHVyZSh0aGF0KSB7XG4gICAgICAgIHRoaXMudGhhdCA9IHRoYXQ7XG4gICAgICAgIHZhciBhZGRGaWx0ZXJJbnN0YW5jZSA9IG5ldyBhZGRGaWx0ZXIodGhhdCwgJ2pzb24nKTtcbiAgICAgICAgdGhpcy5hZGRGaWx0ZXIgPSBmdW5jdGlvbiAoZmlsdGVycykge1xuICAgICAgICAgICAgcmV0dXJuIGFkZEZpbHRlckluc3RhbmNlLmFkZEZpbHRlcihmaWx0ZXJzKTtcbiAgICAgICAgfTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogQWRkcyBHZW9KU09OIEZlYXR1cmUgT3B0aW9ucyBsaWtlOiBzdHlsZVxuICAgICAqIEBwYXJhbSBmZWF0dXJlc1xuICAgICAqIEBwYXJhbSBvcHRpb25zXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBBZGRGZWF0dXJlLnByb3RvdHlwZS5hZGRGZWF0dXJlT3B0aW9ucyA9IGZ1bmN0aW9uIChmZWF0dXJlcywgb3B0aW9ucykge1xuICAgICAgICB2YXIgZmVhdHVyZSwgeDtcbiAgICAgICAgZm9yICh4IGluIGZlYXR1cmVzKSB7XG4gICAgICAgICAgICBpZiAoZmVhdHVyZXMuaGFzT3duUHJvcGVydHkoeCkpIHtcbiAgICAgICAgICAgICAgICBmZWF0dXJlID0gZmVhdHVyZXNbeF07XG4gICAgICAgICAgICAgICAgdmFyIHVpZCA9IHV0aWxzLmNyZWF0ZVVpZCgpO1xuICAgICAgICAgICAgICAgIGZlYXR1cmUudWlkID0gdWlkO1xuICAgICAgICAgICAgICAgIGZlYXR1cmUuZGF0YSA9IHsgdWlkOiB1aWQgfTtcbiAgICAgICAgICAgICAgICBmZWF0dXJlLmZvckVhY2hQcm9wZXJ0eShmdW5jdGlvbiAodmFsdWUsIGtleSkge1xuICAgICAgICAgICAgICAgICAgICBmZWF0dXJlLmRhdGFba2V5XSA9IHZhbHVlO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIGlmIChvcHRpb25zKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChvcHRpb25zLmZpbHRlcnMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIEFkZCBmaWx0ZXJzIGlmIG5vdCBkZWZpbmVkLlxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCF0aGlzLnRoYXQuanNvbi5maWx0ZXIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmFkZEZpbHRlcihvcHRpb25zLmZpbHRlcnMpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy50aGF0Lmpzb24uY3Jvc3NmaWx0ZXIuYWRkKFtmZWF0dXJlXSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgaWYgKG9wdGlvbnMuc3R5bGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMudGhhdC5pbnN0YW5jZS5kYXRhLm92ZXJyaWRlU3R5bGUoZmVhdHVyZSwgb3B0aW9ucy5zdHlsZSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgdGhpcy50aGF0Lmpzb24uYWxsW2ZlYXR1cmUuZGF0YS51aWRdID0gZmVhdHVyZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH07XG4gICAgLyoqXG4gICAgICogQWRkcyBhIFRvcG8gSlNPTiBmaWxlIGludG8gYSBNYXBcbiAgICAgKiBAcGFyYW0gZGF0YSBUaGUgcGFyc2VkIEpTT04gRmlsZVxuICAgICAqIEBwYXJhbSBvcHRpb25zXG4gICAgICovXG4gICAgQWRkRmVhdHVyZS5wcm90b3R5cGUuYWRkVG9wb0pzb24gPSBmdW5jdGlvbiAoZGF0YSwgb3B0aW9ucykge1xuICAgICAgICB2YXIgaXRlbSwgZ2VvSnNvbiwgZmVhdHVyZXMsIHg7XG4gICAgICAgIGZvciAoeCBpbiBvcHRpb25zKSB7XG4gICAgICAgICAgICBpZiAob3B0aW9ucy5oYXNPd25Qcm9wZXJ0eSh4KSkge1xuICAgICAgICAgICAgICAgIGl0ZW0gPSBvcHRpb25zW3hdO1xuICAgICAgICAgICAgICAgIGdlb0pzb24gPSB0b3BvanNvbi5mZWF0dXJlKGRhdGEsIGRhdGEub2JqZWN0c1tpdGVtLm9iamVjdF0pO1xuICAgICAgICAgICAgICAgIGZlYXR1cmVzID0gdGhpcy50aGF0Lmluc3RhbmNlLmRhdGEuYWRkR2VvSnNvbihnZW9Kc29uKTtcbiAgICAgICAgICAgICAgICB0aGlzLmFkZEZlYXR1cmVPcHRpb25zKGZlYXR1cmVzLCBpdGVtKTtcbiAgICAgICAgICAgICAgICBtYXBUb29scy5tYXBzW3RoaXMudGhhdC5pZF0uanNvbi5hbGxbaXRlbS5vYmplY3RdID0gZmVhdHVyZXM7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGZlYXR1cmVzO1xuICAgIH07XG4gICAgQWRkRmVhdHVyZS5wcm90b3R5cGUuYWRkR2VvSnNvbiA9IGZ1bmN0aW9uIChkYXRhLCBvcHRpb25zKSB7XG4gICAgICAgIHZhciBmZWF0dXJlcyA9IHRoaXMudGhhdC5pbnN0YW5jZS5kYXRhLmFkZEdlb0pzb24oZGF0YSwgb3B0aW9ucyk7XG4gICAgICAgIHRoaXMuYWRkRmVhdHVyZU9wdGlvbnMoZmVhdHVyZXMsIG9wdGlvbnMpO1xuICAgICAgICByZXR1cm4gZmVhdHVyZXM7XG4gICAgfTtcbiAgICByZXR1cm4gQWRkRmVhdHVyZTtcbn0pKCk7XG5tb2R1bGUuZXhwb3J0cyA9IEFkZEZlYXR1cmU7XG4iLCIvLy8gPHJlZmVyZW5jZSBwYXRoPVwidHlwaW5ncy90c2QuZC50c1wiLz5cbnZhciB1dGlscyA9IHJlcXVpcmUoJy4vdXRpbHMnKTtcbnZhciBBZGRGaWx0ZXIgPSAoZnVuY3Rpb24gKCkge1xuICAgIGZ1bmN0aW9uIEFkZEZpbHRlcih0aGF0LCB0eXBlKSB7XG4gICAgICAgIHRoaXMudGhhdCA9IHRoYXQ7XG4gICAgICAgIHRoaXMudHlwZSA9IHR5cGU7XG4gICAgfVxuICAgIEFkZEZpbHRlci5wcm90b3R5cGUuYWRkRmlsdGVyID0gZnVuY3Rpb24gKGZpbHRlcnMpIHtcbiAgICAgICAgdGhpcy50aGF0W3RoaXMudHlwZV0uY3Jvc3NmaWx0ZXIgPSB0aGlzLnRoYXRbdGhpcy50eXBlXS5jcm9zc2ZpbHRlciB8fCB0aGlzLnRoYXQuY3Jvc3NmaWx0ZXIoW10pO1xuICAgICAgICB0aGlzLnRoYXRbdGhpcy50eXBlXS5maWx0ZXIgPSB0aGlzLnRoYXRbdGhpcy50eXBlXS5maWx0ZXIgfHwge307XG4gICAgICAgIHZhciBkaW1lbnNpb24sIGl0ZW07XG4gICAgICAgIGlmICh0eXBlb2YgZmlsdGVycyA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgIGZpbHRlcnMgPSBbZmlsdGVyc107XG4gICAgICAgIH1cbiAgICAgICAgZm9yIChkaW1lbnNpb24gaW4gZmlsdGVycykge1xuICAgICAgICAgICAgaWYgKGZpbHRlcnMuaGFzT3duUHJvcGVydHkoZGltZW5zaW9uKSkge1xuICAgICAgICAgICAgICAgIGl0ZW0gPSBmaWx0ZXJzW2RpbWVuc2lvbl07XG4gICAgICAgICAgICAgICAgaWYgKHR5cGVvZiBpdGVtID09PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnRoYXRbdGhpcy50eXBlXS5maWx0ZXJbaXRlbV0gPSB0aGlzLnRoYXRbdGhpcy50eXBlXS5jcm9zc2ZpbHRlci5kaW1lbnNpb24odXRpbHMuZGVmYXVsdERpbWVuc2lvbihpdGVtKSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnRoYXRbdGhpcy50eXBlXS5maWx0ZXJbT2JqZWN0LmtleXMoaXRlbSlbMF1dID0gdGhpcy50aGF0W3RoaXMudHlwZV0uY3Jvc3NmaWx0ZXIuZGltZW5zaW9uKGl0ZW1bT2JqZWN0LmtleXMoaXRlbSlbMF1dKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9O1xuICAgIHJldHVybiBBZGRGaWx0ZXI7XG59KSgpO1xubW9kdWxlLmV4cG9ydHMgPSBBZGRGaWx0ZXI7XG4iLCIvLy8gPHJlZmVyZW5jZSBwYXRoPVwidHlwaW5ncy90c2QuZC50c1wiLz5cbnZhciBtYXBzID0gcmVxdWlyZSgnLi9tYXBzJyk7XG52YXIgY29uZmlnID0gcmVxdWlyZSgnLi9jb25maWcnKTtcbnZhciBBZGRNYXAgPSAoZnVuY3Rpb24gKCkge1xuICAgIGZ1bmN0aW9uIEFkZE1hcCh0aGF0KSB7XG4gICAgICAgIHRoaXMudGhhdCA9IHRoYXQ7XG4gICAgfVxuICAgIEFkZE1hcC5wcm90b3R5cGUuZ2V0RWxlbWVudCA9IGZ1bmN0aW9uIChhcmdzKSB7XG4gICAgICAgIGlmIChhcmdzLmVsKSB7XG4gICAgICAgICAgICByZXR1cm4gd2luZG93LmRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoYXJncy5lbCk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGFyZ3MuaWQpIHtcbiAgICAgICAgICAgIHJldHVybiB3aW5kb3cuZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoYXJncy5pZCk7XG4gICAgICAgIH1cbiAgICB9O1xuICAgIEFkZE1hcC5wcm90b3R5cGUuY3JlYXRlID0gZnVuY3Rpb24gKGFyZ3MsIGNiKSB7XG4gICAgICAgIHZhciBfdGhpcyA9IHRoaXM7XG4gICAgICAgIGNiID0gY2IgfHwgZnVuY3Rpb24gKCkge1xuICAgICAgICB9O1xuICAgICAgICB2YXIgbWFwT3B0aW9ucyA9IG1hcHMubWFwT3B0aW9ucyhhcmdzKTtcbiAgICAgICAgYXJncy5pZCA9IGFyZ3MuaWQgfHwgYXJncy5lbC5zdWJzdHJpbmcoMSk7XG4gICAgICAgIHRoaXMudGhhdC5pZCA9IGFyZ3MuaWQ7XG4gICAgICAgIHRoaXMudGhhdC5vcHRpb25zID0gYXJncztcbiAgICAgICAgdGhpcy50aGF0Lmluc3RhbmNlID0gbmV3IGdvb2dsZS5tYXBzLk1hcCh0aGlzLmdldEVsZW1lbnQoYXJncyksIG1hcE9wdGlvbnMpO1xuICAgICAgICB0aGlzLnRoYXQuZXZlbnRzID0gW107XG4gICAgICAgIC8vIEFkZCBFdmVudHNcbiAgICAgICAgaWYgKGFyZ3Mub24pIHtcbiAgICAgICAgICAgIHZhciBpO1xuICAgICAgICAgICAgZm9yIChpIGluIGFyZ3Mub24pIHtcbiAgICAgICAgICAgICAgICBpZiAoYXJncy5vbi5oYXNPd25Qcm9wZXJ0eShpKSkge1xuICAgICAgICAgICAgICAgICAgICBpZiAoY29uZmlnLmN1c3RvbUV2ZW50cy5pbmRleE9mKGkpID4gLTEpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMudGhhdC5ldmVudHMucHVzaChpKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBnb29nbGUubWFwcy5ldmVudC5hZGRMaXN0ZW5lcih0aGlzLnRoYXQuaW5zdGFuY2UsIGksIGFyZ3Mub25baV0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICB0aGlzLnRoYXQuaW5mb1dpbmRvdyA9IGZhbHNlO1xuICAgICAgICB0aGlzLnRoYXQudGVtcGxhdGVzID0ge1xuICAgICAgICAgICAgaW5mb1dpbmRvdzoge30sXG4gICAgICAgICAgICBwYW5lbDoge31cbiAgICAgICAgfTtcbiAgICAgICAgdGhpcy50aGF0LnVpZCA9IGFyZ3MudWlkO1xuICAgICAgICBtYXBUb29scy5tYXBzW3RoaXMudGhhdC5pZF0uaW5zdGFuY2UgPSB0aGlzLnRoYXQuaW5zdGFuY2U7XG4gICAgICAgIGdvb2dsZS5tYXBzLmV2ZW50LmFkZExpc3RlbmVyT25jZSh0aGlzLnRoYXQuaW5zdGFuY2UsICdpZGxlJywgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgY2IoZmFsc2UsIF90aGlzLnRoYXQpO1xuICAgICAgICB9KTtcbiAgICB9O1xuICAgIEFkZE1hcC5wcm90b3R5cGUudmFsaWRPcHRpb25zID0gZnVuY3Rpb24gKG9wdGlvbnMsIGNiKSB7XG4gICAgICAgIGlmICghb3B0aW9ucyB8fCAob3B0aW9ucyAmJiB0eXBlb2Ygb3B0aW9ucyAhPT0gJ29iamVjdCcpKSB7XG4gICAgICAgICAgICBjYihuZXcgRXJyb3IoJ1lvdSBtdXN0IHBhc3MgYSB2YWxpZCBmaXJzdCBwYXJhbWV0ZXI6IG9wdGlvbnMnKSk7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCFvcHRpb25zLmlkICYmICFvcHRpb25zLmVsKSB7XG4gICAgICAgICAgICBjYihuZXcgRXJyb3IoJ1lvdSBtdXN0IHBhc3MgYW4gXCJpZFwiIG9yIGEgXCJlbFwiIHByb3BlcnR5IHZhbHVlcycpKTtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoIW9wdGlvbnMubGF0IHx8ICFvcHRpb25zLmxuZykge1xuICAgICAgICAgICAgY2IobmV3IEVycm9yKCdZb3UgbXVzdCBwYXNzIHZhbGlkIFwibGF0XCIgKGxhdGl0dWRlKSBhbmQgXCJsbmdcIiAobG9uZ2l0dWRlKSB2YWx1ZXMnKSk7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfTtcbiAgICBBZGRNYXAucHJvdG90eXBlLmxvYWQgPSBmdW5jdGlvbiAob3B0aW9ucywgY2IpIHtcbiAgICAgICAgaWYgKHRoaXMudmFsaWRPcHRpb25zKG9wdGlvbnMsIGNiKSkge1xuICAgICAgICAgICAgdmFyIGlkID0gb3B0aW9ucy5pZCB8fCBvcHRpb25zLmVsLnN1YnN0cmluZygxKTtcbiAgICAgICAgICAgIG1hcFRvb2xzLm1hcHMgPSBtYXBUb29scy5tYXBzIHx8IHt9O1xuICAgICAgICAgICAgaWYgKG1hcFRvb2xzLm1hcHNbaWRdKSB7XG4gICAgICAgICAgICAgICAgdmFyIG1zZyA9ICdUaGVyZSBpcyBhbHJlYWR5IGFub3RoZXIgTWFwIHVzaW5nIHRoZSBzYW1lIGlkOiAnICsgaWQ7XG4gICAgICAgICAgICAgICAgY2IobmV3IEVycm9yKG1zZykpO1xuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHZhciB0aGF0ID0gdGhpcztcbiAgICAgICAgICAgIG1hcFRvb2xzLm1hcHNbaWRdID0ge1xuICAgICAgICAgICAgICAgIGNyZWF0ZTogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICB0aGF0LmNyZWF0ZSh0aGlzLmFyZ3VtZW50cywgY2IpO1xuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgYXJndW1lbnRzOiBvcHRpb25zXG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgLy8gU2V0IEdsb2JhbCBTdHJ1Y3R1cmVcbiAgICAgICAgICAgIG1hcFRvb2xzLm1hcHNbaWRdLm1hcmtlcnMgPSBtYXBUb29scy5tYXBzW2lkXS5tYXJrZXJzIHx8IHsgYWxsOiB7fSwgdGFnczoge30sIGRhdGFDaGFuZ2VkOiBmYWxzZSB9O1xuICAgICAgICAgICAgbWFwVG9vbHMubWFwc1tpZF0uanNvbiA9IG1hcFRvb2xzLm1hcHNbaWRdLmpzb24gfHwgeyBhbGw6IHt9LCBkYXRhQ2hhbmdlZDogZmFsc2UgfTtcbiAgICAgICAgICAgIHRoaXMudGhhdC5tYXJrZXJzID0gbWFwVG9vbHMubWFwc1tpZF0ubWFya2VycztcbiAgICAgICAgICAgIHRoaXMudGhhdC5qc29uID0gbWFwVG9vbHMubWFwc1tpZF0uanNvbjtcbiAgICAgICAgICAgIGlmIChvcHRpb25zLmFzeW5jICE9PSBmYWxzZSB8fCBvcHRpb25zLnN5bmMgPT09IHRydWUpIHtcbiAgICAgICAgICAgICAgICBtYXBzLmxvYWQoaWQsIG9wdGlvbnMpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgbWFwVG9vbHMubWFwc1tpZF0uY3JlYXRlKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9O1xuICAgIHJldHVybiBBZGRNYXA7XG59KSgpO1xubW9kdWxlLmV4cG9ydHMgPSBBZGRNYXA7XG4iLCIvLy8gPHJlZmVyZW5jZSBwYXRoPVwidHlwaW5ncy90c2QuZC50c1wiLz5cbnZhciB1dGlscyA9IHJlcXVpcmUoJy4vdXRpbHMnKTtcbnZhciBhZGRGaWx0ZXIgPSByZXF1aXJlKCcuL2FkZEZpbHRlcicpO1xudmFyIGluZm9XaW5kb3cgPSByZXF1aXJlKCcuL2luZm9XaW5kb3cnKTtcbnZhciBBZGRNYXJrZXIgPSAoZnVuY3Rpb24gKCkge1xuICAgIGZ1bmN0aW9uIEFkZE1hcmtlcih0aGF0KSB7XG4gICAgICAgIHRoaXMudGhhdCA9IHRoYXQ7XG4gICAgICAgIHRoaXMuaW5mb1dpbmRvdyA9IHt9O1xuICAgICAgICB2YXIgYWRkRmlsdGVySW5zdGFuY2UgPSBuZXcgYWRkRmlsdGVyKHRoYXQsICdtYXJrZXJzJyk7XG4gICAgICAgIHRoaXMuYWRkRmlsdGVyID0gZnVuY3Rpb24gKGZpbHRlcnMpIHtcbiAgICAgICAgICAgIHJldHVybiBhZGRGaWx0ZXJJbnN0YW5jZS5hZGRGaWx0ZXIoZmlsdGVycyk7XG4gICAgICAgIH07XG4gICAgICAgIHZhciBpbmZvV2luZG93SW5zdGFuY2UgPSBuZXcgaW5mb1dpbmRvdyh0aGF0KTtcbiAgICAgICAgdGhpcy5pbmZvV2luZG93LmFkZEV2ZW50cyA9IGZ1bmN0aW9uIChtYXJrZXIsIG9wdGlvbnMsIG1hcCkge1xuICAgICAgICAgICAgaW5mb1dpbmRvd0luc3RhbmNlLmFkZEV2ZW50cyhtYXJrZXIsIG9wdGlvbnMsIG1hcCk7XG4gICAgICAgIH07XG4gICAgfVxuICAgIEFkZE1hcmtlci5wcm90b3R5cGUuYWRkRXh0cmFPcHRpb25zID0gZnVuY3Rpb24gKG1hcmtlciwgb3B0aW9ucykge1xuICAgICAgICB2YXIgaTtcbiAgICAgICAgZm9yIChpIGluIG9wdGlvbnMpIHtcbiAgICAgICAgICAgIGlmIChvcHRpb25zLmhhc093blByb3BlcnR5KGkpKSB7XG4gICAgICAgICAgICAgICAgaWYgKCFvcHRpb25zLmZpbHRlcnMpIHtcbiAgICAgICAgICAgICAgICAgICAgbWFya2VyW2ldID0gb3B0aW9uc1tpXTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9O1xuICAgIEFkZE1hcmtlci5wcm90b3R5cGUuYWRkT3B0aW9ucyA9IGZ1bmN0aW9uIChtYXJrZXIsIGluc3RhbmNlKSB7XG4gICAgICAgIGlmIChtYXJrZXIubW92ZSkge1xuICAgICAgICAgICAgaW5zdGFuY2Uuc2V0QW5pbWF0aW9uKGdvb2dsZS5tYXBzLkFuaW1hdGlvblttYXJrZXIubW92ZS50b1VwcGVyQ2FzZSgpXSk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKG1hcmtlci5pbmZvV2luZG93KSB7XG4gICAgICAgICAgICB0aGlzLmluZm9XaW5kb3cuYWRkRXZlbnRzKGluc3RhbmNlLCBtYXJrZXIuaW5mb1dpbmRvdywgdGhpcy50aGF0Lmluc3RhbmNlKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAobWFya2VyLm9uKSB7XG4gICAgICAgICAgICB0aGlzLmFkZEV2ZW50cyhtYXJrZXIsIGluc3RhbmNlKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAobWFya2VyLmNhbGxiYWNrKSB7XG4gICAgICAgICAgICBtYXJrZXIuY2FsbGJhY2soaW5zdGFuY2UpO1xuICAgICAgICB9XG4gICAgfTtcbiAgICBBZGRNYXJrZXIucHJvdG90eXBlLl9hZGRNYXJrZXIgPSBmdW5jdGlvbiAobWFya2VyLCBvcHRpb25zKSB7XG4gICAgICAgIG1hcmtlci5tYXAgPSB0aGlzLnRoYXQuaW5zdGFuY2U7XG4gICAgICAgIG1hcmtlci5wb3NpdGlvbiA9IG5ldyBnb29nbGUubWFwcy5MYXRMbmcobWFya2VyLmxhdCwgbWFya2VyLmxuZyk7XG4gICAgICAgIC8vIEFkZHMgb3B0aW9ucyBzZXQgdmlhIDJuZCBwYXJhbWV0ZXIuIE92ZXJ3cml0ZXMgYW55IE1hcmtlciBvcHRpb25zIGFscmVhZHkgc2V0LlxuICAgICAgICBpZiAob3B0aW9ucykge1xuICAgICAgICAgICAgdGhpcy5hZGRFeHRyYU9wdGlvbnMobWFya2VyLCBvcHRpb25zKTtcbiAgICAgICAgfVxuICAgICAgICBtYXJrZXIuZGF0YSA9IG1hcmtlci5kYXRhIHx8IHt9O1xuICAgICAgICBtYXJrZXIuZGF0YS5fc2VsZiA9IG1hcmtlcjsgLy8gVGhpcyBoZWxwcyBtZSB0byBkbyBsYXRlciByZXNldE1hcmtlcigpXG4gICAgICAgIHRoaXMuc2V0VWlkKG1hcmtlcik7XG4gICAgICAgIC8vIEJlY2F1c2Ugd2UgYXJlIG5vdCBhbGxvd2luZyBkdXBsaWNhdGVzXG4gICAgICAgIGlmICh0aGlzLnRoYXQubWFya2Vycy5hbGxbbWFya2VyLnVpZF0pIHtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgICBpZiAob3B0aW9ucyAmJiBvcHRpb25zLmZpbHRlcnMpIHtcbiAgICAgICAgICAgIC8vIE9ubHkgYWRkIGZpbHRlcnMgaWYgbm90IGRlZmluZWQuXG4gICAgICAgICAgICBpZiAoIW1hcFRvb2xzLm1hcHNbdGhpcy50aGF0LmlkXS5tYXJrZXJzLmZpbHRlcikge1xuICAgICAgICAgICAgICAgIHRoaXMuYWRkRmlsdGVyKG9wdGlvbnMuZmlsdGVycyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgdmFyIGluc3RhbmNlID0gbmV3IGdvb2dsZS5tYXBzLk1hcmtlcihtYXJrZXIpO1xuICAgICAgICB0aGlzLnRoYXQubWFya2Vycy5jcm9zc2ZpbHRlciA9IHRoaXMudGhhdC5tYXJrZXJzLmNyb3NzZmlsdGVyIHx8IHRoaXMudGhhdC5jcm9zc2ZpbHRlcihbXSk7XG4gICAgICAgIHRoaXMudGhhdC5tYXJrZXJzLmZpbHRlciA9IHRoaXMudGhhdC5tYXJrZXJzLmZpbHRlciB8fCB7fTtcbiAgICAgICAgdGhpcy50aGF0Lm1hcmtlcnMuY3Jvc3NmaWx0ZXIuYWRkKFtpbnN0YW5jZV0pO1xuICAgICAgICB0aGlzLmFkZE9wdGlvbnMobWFya2VyLCBpbnN0YW5jZSk7XG4gICAgICAgIC8vIEFkZHMgTWFya2VyIFJlZmVyZW5jZSBvZiBlYWNoIE1hcmtlciB0byBcIm1hcmtlcnMuYWxsXCJcbiAgICAgICAgdGhpcy50aGF0Lm1hcmtlcnMuYWxsID0gbWFwVG9vbHMubWFwc1t0aGlzLnRoYXQuaWRdLm1hcmtlcnMuYWxsIHx8IHt9O1xuICAgICAgICB0aGlzLnRoYXQubWFya2Vycy5hbGxbbWFya2VyLnVpZF0gPSBpbnN0YW5jZTtcbiAgICAgICAgaWYgKG1hcmtlci50YWdzKSB7XG4gICAgICAgICAgICB0aGlzLmFkZE1hcmtlckJ5VGFnKG1hcmtlciwgaW5zdGFuY2UpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBpbnN0YW5jZTtcbiAgICB9O1xuICAgIEFkZE1hcmtlci5wcm90b3R5cGUuc2V0VWlkID0gZnVuY3Rpb24gKG1hcmtlcikge1xuICAgICAgICBpZiAodGhpcy50aGF0LnVpZCAmJiBtYXJrZXJbdGhpcy50aGF0LnVpZF0pIHtcbiAgICAgICAgICAgIG1hcmtlci5kYXRhLnVpZCA9IG1hcmtlclt0aGlzLnRoYXQudWlkXTtcbiAgICAgICAgICAgIG1hcmtlci51aWQgPSBtYXJrZXIuZGF0YS51aWQ7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKG1hcmtlci5kYXRhLnVpZCAmJiAhbWFya2VyLnVpZCkge1xuICAgICAgICAgICAgbWFya2VyLnVpZCA9IG1hcmtlci5kYXRhLnVpZDtcbiAgICAgICAgfVxuICAgICAgICBpZiAoIW1hcmtlci51aWQpIHtcbiAgICAgICAgICAgIG1hcmtlci5kYXRhLnVpZCA9IHV0aWxzLmNyZWF0ZVVpZCgpO1xuICAgICAgICAgICAgbWFya2VyLnVpZCA9IG1hcmtlci5kYXRhLnVpZDtcbiAgICAgICAgfVxuICAgIH07XG4gICAgQWRkTWFya2VyLnByb3RvdHlwZS5hZGRNYXJrZXJCeVRhZyA9IGZ1bmN0aW9uIChtYXJrZXIsIGluc3RhbmNlKSB7XG4gICAgICAgIGlmICh1dGlscy5pc0FycmF5KG1hcmtlci50YWdzKSkge1xuICAgICAgICAgICAgdmFyIGksIHRhZztcbiAgICAgICAgICAgIGZvciAoaSBpbiBtYXJrZXIudGFncykge1xuICAgICAgICAgICAgICAgIGlmIChtYXJrZXIudGFncy5oYXNPd25Qcm9wZXJ0eShpKSkge1xuICAgICAgICAgICAgICAgICAgICB0YWcgPSBtYXJrZXIudGFnc1tpXTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy50aGF0Lm1hcmtlcnMudGFnc1t0YWddID0gdGhpcy50aGF0Lm1hcmtlcnMudGFnc1t0YWddIHx8IHt9O1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnRoYXQubWFya2Vycy50YWdzW3RhZ11baW5zdGFuY2UuZGF0YS51aWRdID0gaW5zdGFuY2U7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgdGhpcy50aGF0Lm1hcmtlcnMudGFnc1ttYXJrZXIudGFnc10gPSB0aGlzLnRoYXQubWFya2Vycy50YWdzW21hcmtlci50YWdzXSB8fCB7fTtcbiAgICAgICAgICAgIHRoaXMudGhhdC5tYXJrZXJzLnRhZ3NbbWFya2VyLnRhZ3NdW2luc3RhbmNlLmRhdGEudWlkXSA9IGluc3RhbmNlO1xuICAgICAgICB9XG4gICAgfTtcbiAgICBBZGRNYXJrZXIucHJvdG90eXBlLmFkZEV2ZW50cyA9IGZ1bmN0aW9uIChtYXJrZXIsIGluc3RhbmNlKSB7XG4gICAgICAgIHZhciBpO1xuICAgICAgICBmb3IgKGkgaW4gbWFya2VyLm9uKSB7XG4gICAgICAgICAgICBpZiAobWFya2VyLm9uLmhhc093blByb3BlcnR5KGkpKSB7XG4gICAgICAgICAgICAgICAgZ29vZ2xlLm1hcHMuZXZlbnQuYWRkTGlzdGVuZXIoaW5zdGFuY2UsIGksIG1hcmtlci5vbltpXSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9O1xuICAgIC8qKlxuICAgICAqIEFkZHMgTWFya2VycyB0byB0aGUgTWFwXG4gICAgICogQHBhcmFtIGFyZ3MgQXJyYXkgb3IgTWFya2Vyc1xuICAgICAqIEBwYXJhbSBvcHRpb25zIHRoaW5ncyBsaWtlIGdyb3VwcyBldGNcbiAgICAgKiBAcmV0dXJucyB7QXJyYXl9IGFsbCB0aGUgaW5zdGFuY2VzIG9mIHRoZSBtYXJrZXJzLlxuICAgICAqL1xuICAgIEFkZE1hcmtlci5wcm90b3R5cGUuYWRkTWFya2VyID0gZnVuY3Rpb24gKGFyZ3MsIG9wdGlvbnMpIHtcbiAgICAgICAgaWYgKHV0aWxzLmlzQXJyYXkoYXJncykpIHtcbiAgICAgICAgICAgIGlmIChhcmdzLmxlbmd0aCA+PSAxKSB7XG4gICAgICAgICAgICAgICAgdmFyIG1hcmtlciwgbWFya2VycyA9IFtdO1xuICAgICAgICAgICAgICAgIGZvciAodmFyIGkgaW4gYXJncykge1xuICAgICAgICAgICAgICAgICAgICBpZiAoYXJncy5oYXNPd25Qcm9wZXJ0eShpKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgbWFya2VyID0gdGhpcy5fYWRkTWFya2VyKGFyZ3NbaV0sIG9wdGlvbnMpO1xuICAgICAgICAgICAgICAgICAgICAgICAgbWFya2Vycy5wdXNoKG1hcmtlcik7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgdGhpcy50aGF0Lm1hcmtlcnMuZGF0YUNoYW5nZWQgPSB0cnVlO1xuICAgICAgICAgICAgICAgIHJldHVybiBtYXJrZXJzO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIFtdO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMudGhhdC5tYXJrZXJzLmRhdGFDaGFuZ2VkID0gdHJ1ZTtcbiAgICAgICAgcmV0dXJuIHRoaXMuX2FkZE1hcmtlcihhcmdzLCBvcHRpb25zKTtcbiAgICB9O1xuICAgIHJldHVybiBBZGRNYXJrZXI7XG59KSgpO1xubW9kdWxlLmV4cG9ydHMgPSBBZGRNYXJrZXI7XG4iLCIvLy8gPHJlZmVyZW5jZSBwYXRoPVwidGVtcGxhdGUudHNcIi8+XG4vLy8gPHJlZmVyZW5jZSBwYXRoPVwiY29uZmlnLnRzXCIvPlxuLy8vIDxyZWZlcmVuY2UgcGF0aD1cInR5cGluZ3MvdHNkLmQudHNcIi8+XG52YXIgY29uZmlnID0gcmVxdWlyZSgnLi9jb25maWcnKTtcbnZhciB0ZW1wbGF0ZSA9IHJlcXVpcmUoJy4vdGVtcGxhdGUnKTtcbnZhciBBZGRQYW5lbCA9IChmdW5jdGlvbiAoKSB7XG4gICAgZnVuY3Rpb24gQWRkUGFuZWwodGhhdCkge1xuICAgICAgICB0aGlzLnRoYXQgPSB0aGF0O1xuICAgICAgICB2YXIgdGVtcGxhdGVJbnN0YW5jZSA9IG5ldyB0ZW1wbGF0ZSh0aGF0KTtcbiAgICAgICAgdGhpcy50ZW1wbGF0ZSA9IGZ1bmN0aW9uICh0eXBlLCB1cmwsIGNiKSB7XG4gICAgICAgICAgICByZXR1cm4gdGVtcGxhdGVJbnN0YW5jZS5sb2FkKHR5cGUsIHVybCwgY2IpO1xuICAgICAgICB9O1xuICAgIH1cbiAgICBBZGRQYW5lbC5wcm90b3R5cGUuZ2V0UG9zaXRpb25LZXkgPSBmdW5jdGlvbiAocG9zKSB7XG4gICAgICAgIHJldHVybiBwb3MudG9VcHBlckNhc2UoKS5tYXRjaCgvXFxTKy9nKS5qb2luKCdfJyk7XG4gICAgfTtcbiAgICBBZGRQYW5lbC5wcm90b3R5cGUuaHkyY21tbCA9IGZ1bmN0aW9uIChrKSB7XG4gICAgICAgIHJldHVybiBrLnJlcGxhY2UoLy0oLikvZywgZnVuY3Rpb24gKG0sIGcpIHtcbiAgICAgICAgICAgIHJldHVybiBnLnRvVXBwZXJDYXNlKCk7XG4gICAgICAgIH0pO1xuICAgIH07XG4gICAgQWRkUGFuZWwucHJvdG90eXBlLkhUTUxQYXJzZXIgPSBmdW5jdGlvbiAoYUhUTUxTdHJpbmcpIHtcbiAgICAgICAgdmFyIGNvbnRhaW5lciA9IHdpbmRvdy5kb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICAgICAgY29udGFpbmVyLmlubmVySFRNTCA9IGFIVE1MU3RyaW5nO1xuICAgICAgICByZXR1cm4gY29udGFpbmVyO1xuICAgIH07XG4gICAgQWRkUGFuZWwucHJvdG90eXBlLm9uU3VjY2VzcyA9IGZ1bmN0aW9uIChvcHRpb25zLCBwb3NpdGlvbiwgcGFuZWwsIGNiKSB7XG4gICAgICAgIHZhciBlLCBydWxlO1xuICAgICAgICAvLyBwb3NpdGlvbmluZyBvcHRpb25zXG4gICAgICAgIGlmIChvcHRpb25zLnBvc2l0aW9uKSB7XG4gICAgICAgICAgICAvLyBjb252ZXJ0IHRvIGdvb2dsZSBDb250cm9sUG9zaXRpb24gbWFwIHBvc2l0aW9uIGtleXNcbiAgICAgICAgICAgIG9wdGlvbnMucG9zaXRpb24gPSB0aGlzLmdldFBvc2l0aW9uS2V5KG9wdGlvbnMucG9zaXRpb24pO1xuICAgICAgICAgICAgcG9zaXRpb24gPSBnb29nbGUubWFwcy5Db250cm9sUG9zaXRpb25bb3B0aW9ucy5wb3NpdGlvbl07XG4gICAgICAgIH1cbiAgICAgICAgLy8gc3R5bGUgb3B0aW9uc1xuICAgICAgICBpZiAodHlwZW9mIG9wdGlvbnMuc3R5bGUgPT09ICdvYmplY3QnKSB7XG4gICAgICAgICAgICBmb3IgKHJ1bGUgaW4gb3B0aW9ucy5zdHlsZSkge1xuICAgICAgICAgICAgICAgIGlmIChvcHRpb25zLnN0eWxlLmhhc093blByb3BlcnR5KHJ1bGUpKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBydWxlS2V5ID0gdGhpcy5oeTJjbW1sKHJ1bGUpO1xuICAgICAgICAgICAgICAgICAgICBwYW5lbC5zdHlsZVtydWxlS2V5XSA9IG9wdGlvbnMuc3R5bGVbcnVsZV07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIC8vIGV2ZW50IGhhbmRsZXJcbiAgICAgICAgaWYgKG9wdGlvbnMuZXZlbnRzKSB7XG4gICAgICAgICAgICBmb3IgKGUgaW4gb3B0aW9ucy5ldmVudHMpIHtcbiAgICAgICAgICAgICAgICBpZiAob3B0aW9ucy5ldmVudHMuaGFzT3duUHJvcGVydHkoZSkpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGtleXMgPSBlLm1hdGNoKC9cXFMrL2cpO1xuICAgICAgICAgICAgICAgICAgICB2YXIgZXZlbnQgPSBrZXlzLnNwbGljZSgtMSk7IC8vZXZlbnQgdHlwZVxuICAgICAgICAgICAgICAgICAgICB2YXIgc2VsZWN0b3IgPSBrZXlzLmpvaW4oJyAnKTsgLy8gc2VsZWN0b3Igc3RyaW5nXG4gICAgICAgICAgICAgICAgICAgIHZhciBlbGVtZW50cyA9IHBhbmVsLnF1ZXJ5U2VsZWN0b3JBbGwoc2VsZWN0b3IpO1xuICAgICAgICAgICAgICAgICAgICBbXS5mb3JFYWNoLmNhbGwoZWxlbWVudHMsIGZ1bmN0aW9uIChlbG0pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGdvb2dsZS5tYXBzLmV2ZW50LmFkZERvbUxpc3RlbmVyKGVsbSwgZXZlbnQsIG9wdGlvbnMuZXZlbnRzW2VdKTtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHRoaXMudGhhdC5pbnN0YW5jZS5jb250cm9sc1twb3NpdGlvbl0ucHVzaChwYW5lbCk7XG4gICAgICAgIHRoaXMudGhhdC5wYW5lbHMgPSB0aGlzLnRoYXQucGFuZWxzIHx8IHt9O1xuICAgICAgICB0aGlzLnRoYXQucGFuZWxzW3Bvc2l0aW9uXSA9IHBhbmVsO1xuICAgICAgICBjYihmYWxzZSwgcGFuZWwpO1xuICAgIH07XG4gICAgQWRkUGFuZWwucHJvdG90eXBlLmFkZFBhbmVsID0gZnVuY3Rpb24gKG9wdGlvbnMsIGNiKSB7XG4gICAgICAgIHZhciBfdGhpcyA9IHRoaXM7XG4gICAgICAgIGNiID0gY2IgfHwgZnVuY3Rpb24gKCkge1xuICAgICAgICB9O1xuICAgICAgICB2YXIgcG9zaXRpb24sIHBhbmVsO1xuICAgICAgICAvLyBkZWZhdWx0IHBvc2l0aW9uXG4gICAgICAgIG9wdGlvbnMucG9zaXRpb24gPSBvcHRpb25zLnBvc2l0aW9uIHx8IGNvbmZpZy5wYW5lbFBvc2l0aW9uO1xuICAgICAgICBpZiAob3B0aW9ucy50ZW1wbGF0ZVVSTCkge1xuICAgICAgICAgICAgdGhpcy50ZW1wbGF0ZSgncGFuZWwnLCBvcHRpb25zLnRlbXBsYXRlVVJMLCBmdW5jdGlvbiAoZXJyLCByZXNwb25zZSkge1xuICAgICAgICAgICAgICAgIGlmICghZXJyKSB7XG4gICAgICAgICAgICAgICAgICAgIHBhbmVsID0gX3RoaXMuSFRNTFBhcnNlcihyZXNwb25zZSk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBfdGhpcy5vblN1Y2Nlc3Mob3B0aW9ucywgcG9zaXRpb24sIHBhbmVsLCBjYik7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBjYihlcnIpO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBpZiAodHlwZW9mIG9wdGlvbnMudGVtcGxhdGUgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICAgICAgcGFuZWwgPSB0aGlzLkhUTUxQYXJzZXIob3B0aW9ucy50ZW1wbGF0ZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICBwYW5lbCA9IG9wdGlvbnMudGVtcGxhdGU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aGlzLm9uU3VjY2VzcyhvcHRpb25zLCBwb3NpdGlvbiwgcGFuZWwsIGNiKTtcbiAgICAgICAgfVxuICAgIH07XG4gICAgcmV0dXJuIEFkZFBhbmVsO1xufSkoKTtcbm1vZHVsZS5leHBvcnRzID0gQWRkUGFuZWw7XG4iLCIvLy8gPHJlZmVyZW5jZSBwYXRoPVwidHlwaW5ncy90c2QuZC50c1wiLz5cbnZhciBDZW50ZXIgPSAoZnVuY3Rpb24gKCkge1xuICAgIGZ1bmN0aW9uIENlbnRlcigpIHtcbiAgICB9XG4gICAgQ2VudGVyLnByb3RvdHlwZS5wb3MgPSBmdW5jdGlvbiAobGF0LCBsbmcpIHtcbiAgICAgICAgdmFyIHBvc2l0aW9uO1xuICAgICAgICBpZiAobGF0ICYmIGxuZykge1xuICAgICAgICAgICAgcG9zaXRpb24gPSBuZXcgZ29vZ2xlLm1hcHMuTGF0TG5nKGxhdCwgbG5nKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHBvc2l0aW9uID0gbmV3IGdvb2dsZS5tYXBzLkxhdExuZyh0aGlzLm9wdGlvbnMubGF0LCB0aGlzLm9wdGlvbnMubG5nKTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLmluc3RhbmNlLnNldENlbnRlcihwb3NpdGlvbik7XG4gICAgfTtcbiAgICByZXR1cm4gQ2VudGVyO1xufSkoKTtcbm1vZHVsZS5leHBvcnRzID0gQ2VudGVyO1xuIiwiLy8vIDxyZWZlcmVuY2UgcGF0aD1cInR5cGluZ3MvdHNkLmQudHNcIi8+XG52YXIgQ29uZmlnID0gKGZ1bmN0aW9uICgpIHtcbiAgICBmdW5jdGlvbiBDb25maWcoKSB7XG4gICAgfVxuICAgIENvbmZpZy52ZXJzaW9uID0gJzMuMTgnOyAvLyBSZWxlYXNlZDogTWF5IDE1LCAyMDFcbiAgICBDb25maWcudXJsID0gJy8vbWFwcy5nb29nbGVhcGlzLmNvbS9tYXBzL2FwaS9qcyc7XG4gICAgQ29uZmlnLnpvb20gPSA4O1xuICAgIENvbmZpZy5jdXN0b21NYXBPcHRpb25zID0gWydpZCcsICdsYXQnLCAnbG5nJywgJ3R5cGUnLCAndWlkJ107XG4gICAgQ29uZmlnLmN1c3RvbU1hcmtlck9wdGlvbnMgPSBbJ2xhdCcsICdsbmcnLCAnbW92ZScsICdpbmZvV2luZG93JywgJ29uJywgJ2NhbGxiYWNrJywgJ3RhZ3MnXTtcbiAgICBDb25maWcucGFuZWxQb3NpdGlvbiA9ICdUT1BfTEVGVCc7XG4gICAgQ29uZmlnLmN1c3RvbUluZm9XaW5kb3dPcHRpb25zID0gWydvcGVuJywgJ2Nsb3NlJ107XG4gICAgQ29uZmlnLmN1c3RvbUV2ZW50cyA9IFsnbWFya2VyX3Zpc2liaWxpdHlfY2hhbmdlZCddO1xuICAgIHJldHVybiBDb25maWc7XG59KSgpO1xubW9kdWxlLmV4cG9ydHMgPSBDb25maWc7XG4iLCIvLy8gPHJlZmVyZW5jZSBwYXRoPVwidHlwaW5ncy90c2QuZC50c1wiLz5cbnZhciBhZGRGaWx0ZXIgPSByZXF1aXJlKCcuL2FkZEZpbHRlcicpO1xudmFyIEZpbHRlciA9IChmdW5jdGlvbiAoKSB7XG4gICAgZnVuY3Rpb24gRmlsdGVyKHRoYXQsIHR5cGUpIHtcbiAgICAgICAgdGhpcy50aGF0ID0gdGhhdDtcbiAgICAgICAgdGhpcy50eXBlID0gdHlwZTtcbiAgICAgICAgdGhpcy5vcmRlckxvb2t1cCA9IHtcbiAgICAgICAgICAgIEFTQzogJ3RvcCcsXG4gICAgICAgICAgICBERVNDOiAnYm90dG9tJ1xuICAgICAgICB9O1xuICAgICAgICB0aGlzLnV0aWxzID0gcmVxdWlyZSgnLi91dGlscycpO1xuICAgICAgICB2YXIgYWRkRmlsdGVySW5zdGFuY2UgPSBuZXcgYWRkRmlsdGVyKHRoYXQsIHR5cGUpO1xuICAgICAgICB0aGlzLmFkZEZpbHRlciA9IGZ1bmN0aW9uIChmaWx0ZXJzKSB7XG4gICAgICAgICAgICByZXR1cm4gYWRkRmlsdGVySW5zdGFuY2UuYWRkRmlsdGVyKGZpbHRlcnMpO1xuICAgICAgICB9O1xuICAgIH1cbiAgICAvLyBjZiBoYXMgaXQncyBvd24gc3RhdGUsIGZvciBlYWNoIGRpbWVuc2lvblxuICAgIC8vIGJlZm9yZSBlYWNoIG5ldyBmaWx0ZXJpbmcgd2UgbmVlZCB0byBjbGVhciB0aGlzIHN0YXRlXG4gICAgRmlsdGVyLnByb3RvdHlwZS5jbGVhckFsbCA9IGZ1bmN0aW9uIChkaW1lbnNpb25TZXQpIHtcbiAgICAgICAgdmFyIGksIGRpbWVuc2lvbjtcbiAgICAgICAgZm9yIChpIGluIGRpbWVuc2lvblNldCkge1xuICAgICAgICAgICAgaWYgKGRpbWVuc2lvblNldC5oYXNPd25Qcm9wZXJ0eShpKSkge1xuICAgICAgICAgICAgICAgIGRpbWVuc2lvbiA9IGRpbWVuc2lvblNldFtpXTtcbiAgICAgICAgICAgICAgICBpZiAodGhpcy50aGF0W3RoaXMudHlwZV0uZGF0YUNoYW5nZWQgPT09IHRydWUpIHtcbiAgICAgICAgICAgICAgICAgICAgZGltZW5zaW9uLmRpc3Bvc2UoKTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5hZGRGaWx0ZXIoaSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBkaW1lbnNpb24uZmlsdGVyQWxsKCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfTtcbiAgICBGaWx0ZXIucHJvdG90eXBlLmZpbHRlckJ5VGFnID0gZnVuY3Rpb24gKHF1ZXJ5KSB7XG4gICAgICAgIC8vIGlmIHRoZSBzZWFyY2ggcXVlcnkgaXMgYW4gYXJyYXkgd2l0aCBvbmx5IG9uZSBpdGVtIHRoZW4ganVzdCB1c2UgdGhhdCBzdHJpbmdcbiAgICAgICAgaWYgKHRoaXMudXRpbHMuaXNBcnJheShxdWVyeSkgJiYgcXVlcnkubGVuZ3RoID09PSAxKSB7XG4gICAgICAgICAgICBxdWVyeSA9IHF1ZXJ5WzBdO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0eXBlb2YgcXVlcnkgPT09IFwic3RyaW5nXCIpIHtcbiAgICAgICAgICAgIGlmICh0aGlzLnRoYXRbdGhpcy50eXBlXS50YWdzW3F1ZXJ5XSkge1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLnV0aWxzLnRvQXJyYXkodGhpcy50aGF0W3RoaXMudHlwZV0udGFnc1txdWVyeV0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIFtdO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgdmFyIG1hcmtlcnMgPSB0aGlzLmZldGNoQnlUYWcocXVlcnkpO1xuICAgICAgICAgICAgaWYgKHR5cGVvZiBtYXJrZXJzID09PSBcIm9iamVjdFwiKSB7XG4gICAgICAgICAgICAgICAgbWFya2VycyA9IHRoaXMudXRpbHMudG9BcnJheShtYXJrZXJzKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBtYXJrZXJzO1xuICAgICAgICB9XG4gICAgfTtcbiAgICBGaWx0ZXIucHJvdG90eXBlLmZldGNoQnlUYWcgPSBmdW5jdGlvbiAocXVlcnkpIHtcbiAgICAgICAgdmFyIG1hcmtlcnM7IC8vIHN0b3JlIGZpcnN0IHNldCBvZiBtYXJrZXJzIHRvIGNvbXBhcmVcbiAgICAgICAgdmFyIGk7XG4gICAgICAgIGZvciAoaSA9IDA7IGkgPCBxdWVyeS5sZW5ndGggLSAxOyBpKyspIHtcbiAgICAgICAgICAgIHZhciB0YWcgPSBxdWVyeVtpXTtcbiAgICAgICAgICAgIHZhciBuZXh0VGFnID0gcXVlcnlbaSArIDFdO1xuICAgICAgICAgICAgLy8gbnVsbCBjaGVjayBraWNrcyBpbiB3aGVuIHdlIGdldCB0byB0aGUgZW5kIG9mIHRoZSBmb3IgbG9vcFxuICAgICAgICAgICAgbWFya2VycyA9IHRoaXMudXRpbHMuZ2V0Q29tbW9uT2JqZWN0KHRoaXMudGhhdFt0aGlzLnR5cGVdLnRhZ3NbdGFnXSwgdGhpcy50aGF0W3RoaXMudHlwZV0udGFnc1tuZXh0VGFnXSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG1hcmtlcnM7XG4gICAgfTtcbiAgICBGaWx0ZXIucHJvdG90eXBlLmZpbHRlciA9IGZ1bmN0aW9uIChhcmdzLCBvcHRpb25zKSB7XG4gICAgICAgIC8vIFJldHVybiBBbGwgaXRlbXMgaWYgbm8gYXJndW1lbnRzIGFyZSBzdXBwbGllZFxuICAgICAgICBpZiAodHlwZW9mIGFyZ3MgPT09ICd1bmRlZmluZWQnICYmIHR5cGVvZiBvcHRpb25zID09PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMudXRpbHMudG9BcnJheSh0aGlzLnRoYXRbdGhpcy50eXBlXS5hbGwpO1xuICAgICAgICB9XG4gICAgICAgIHZhciBkaW1lbnNpb24sIG9yZGVyLCBsaW1pdCwgcXVlcnk7XG4gICAgICAgIGlmICh0eXBlb2YgYXJncyA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgIGRpbWVuc2lvbiA9IGFyZ3M7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBkaW1lbnNpb24gPSBPYmplY3Qua2V5cyhhcmdzKVswXTtcbiAgICAgICAgICAgIHF1ZXJ5ID0gYXJnc1tkaW1lbnNpb25dO1xuICAgICAgICAgICAgaWYgKGRpbWVuc2lvbiA9PT0gJ3RhZ3MnKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuZmlsdGVyQnlUYWcocXVlcnkpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHRoaXMuY2xlYXJBbGwodGhpcy50aGF0W3RoaXMudHlwZV0uZmlsdGVyKTtcbiAgICAgICAgLy8gQWRkIENyb3NzZmlsdGVyIERpbWVuc2lvbiBpZiBpdCBkb2VzIG5vdCBleGlzdC5cbiAgICAgICAgaWYgKCF0aGlzLnRoYXRbdGhpcy50eXBlXS5maWx0ZXJbZGltZW5zaW9uXSkge1xuICAgICAgICAgICAgdGhpcy5hZGRGaWx0ZXIoZGltZW5zaW9uKTtcbiAgICAgICAgfVxuICAgICAgICBvcmRlciA9IChvcHRpb25zICYmIG9wdGlvbnMub3JkZXIgJiYgdGhpcy5vcmRlckxvb2t1cFtvcHRpb25zLm9yZGVyXSkgPyB0aGlzLm9yZGVyTG9va3VwW29wdGlvbnMub3JkZXJdIDogdGhpcy5vcmRlckxvb2t1cFtPYmplY3Qua2V5cyh0aGlzLm9yZGVyTG9va3VwKVswXV07XG4gICAgICAgIGxpbWl0ID0gKG9wdGlvbnMgJiYgb3B0aW9ucy5saW1pdCkgPyBvcHRpb25zLmxpbWl0IDogSW5maW5pdHk7XG4gICAgICAgIGlmICh0eXBlb2YgcXVlcnkgPT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICBxdWVyeSA9IG51bGw7XG4gICAgICAgIH1cbiAgICAgICAgdmFyIHJlc3VsdCA9IHRoaXMudGhhdFt0aGlzLnR5cGVdLmZpbHRlcltkaW1lbnNpb25dLmZpbHRlcihxdWVyeSlbb3JkZXJdKGxpbWl0KTtcbiAgICAgICAgdGhpcy50aGF0W3RoaXMudHlwZV0uZGF0YUNoYW5nZWQgPSBmYWxzZTtcbiAgICAgICAgaWYgKGxpbWl0ID09PSAxKSB7XG4gICAgICAgICAgICByZXR1cm4gcmVzdWx0WzBdO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfTtcbiAgICByZXR1cm4gRmlsdGVyO1xufSkoKTtcbm1vZHVsZS5leHBvcnRzID0gRmlsdGVyO1xuIiwiLy8vIDxyZWZlcmVuY2UgcGF0aD1cInR5cGluZ3MvdHNkLmQudHNcIi8+XG52YXIgRmluZE1hcmtlckJ5SWQgPSAoZnVuY3Rpb24gKCkge1xuICAgIGZ1bmN0aW9uIEZpbmRNYXJrZXJCeUlkKHRoYXQpIHtcbiAgICAgICAgdGhpcy50aGF0ID0gdGhhdDtcbiAgICB9XG4gICAgRmluZE1hcmtlckJ5SWQucHJvdG90eXBlLmZpbmQgPSBmdW5jdGlvbiAobWFya2VyKSB7XG4gICAgICAgIGlmIChtYXJrZXIuZGF0YSAmJiBtYXJrZXIuZGF0YS51aWQpIHtcbiAgICAgICAgICAgIHJldHVybiBtYXJrZXI7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKG1hcmtlci51aWQgJiYgbWFwVG9vbHMubWFwc1t0aGlzLnRoYXQuaWRdLm1hcmtlcnMuYWxsW21hcmtlci51aWRdKSB7XG4gICAgICAgICAgICByZXR1cm4gbWFwVG9vbHMubWFwc1t0aGlzLnRoYXQuaWRdLm1hcmtlcnMuYWxsW21hcmtlci51aWRdO1xuICAgICAgICB9XG4gICAgfTtcbiAgICByZXR1cm4gRmluZE1hcmtlckJ5SWQ7XG59KSgpO1xubW9kdWxlLmV4cG9ydHMgPSBGaW5kTWFya2VyQnlJZDtcbiIsIi8vLyA8cmVmZXJlbmNlIHBhdGg9XCJ0eXBpbmdzL3RzZC5kLnRzXCIvPlxudmFyIEluZm9XaW5kb3cgPSAoZnVuY3Rpb24gKCkge1xuICAgIGZ1bmN0aW9uIEluZm9XaW5kb3codGhhdCkge1xuICAgICAgICB0aGlzLnRoYXQgPSB0aGF0O1xuICAgICAgICB0aGlzLnV0aWxzID0gcmVxdWlyZSgnLi91dGlscycpO1xuICAgICAgICB0aGlzLmNvbmZpZyA9IHJlcXVpcmUoJy4vY29uZmlnJyk7XG4gICAgfVxuICAgIEluZm9XaW5kb3cucHJvdG90eXBlLmluZm9XaW5kb3cgPSBmdW5jdGlvbiAobWFwLCBtYXJrZXIsIGFyZ3MpIHtcbiAgICAgICAgdmFyIGNvbnRlbnQgPSBmYWxzZTtcbiAgICAgICAgaWYgKG1hcmtlci5pbmZvV2luZG93LmNvbnRlbnQpIHtcbiAgICAgICAgICAgIGlmIChtYXJrZXIuaW5mb1dpbmRvdy5jb250ZW50LmluZGV4T2YoJ3snKSA+IC0xKSB7XG4gICAgICAgICAgICAgICAgY29udGVudCA9IGFyZ3MuY29udGVudC5yZXBsYWNlKC9cXHsoXFx3KylcXH0vZywgZnVuY3Rpb24gKG0sIHZhcmlhYmxlKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBtYXJrZXIuZGF0YVt2YXJpYWJsZV0gfHwgJyc7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjb250ZW50ID0gY29udGVudCB8fCBtYXJrZXIuaW5mb1dpbmRvdy5jb250ZW50O1xuICAgICAgICB9XG4gICAgICAgIHZhciBvcHRpb25zID0gdGhpcy51dGlscy5jbG9uZShhcmdzKTtcbiAgICAgICAgb3B0aW9ucy5jb250ZW50ID0gY29udGVudDtcbiAgICAgICAgdGhpcy50aGF0LmluZm9XaW5kb3cgPSBuZXcgZ29vZ2xlLm1hcHMuSW5mb1dpbmRvdyhvcHRpb25zKTtcbiAgICAgICAgdGhpcy50aGF0LmluZm9XaW5kb3cub3BlbihtYXAsIG1hcmtlcik7XG4gICAgfTtcbiAgICBJbmZvV2luZG93LnByb3RvdHlwZS5vcGVuID0gZnVuY3Rpb24gKG1hcCwgbWFya2VyLCBvcHRpb25zKSB7XG4gICAgICAgIHRoaXMuY2xvc2UoKTtcbiAgICAgICAgdGhpcy5pbmZvV2luZG93KG1hcCwgbWFya2VyLCBvcHRpb25zKTtcbiAgICB9O1xuICAgIEluZm9XaW5kb3cucHJvdG90eXBlLmlzT3BlbiA9IGZ1bmN0aW9uIChpbmZvV2luZG93KSB7XG4gICAgICAgIHZhciBtYXAgPSBpbmZvV2luZG93LmdldE1hcCgpO1xuICAgICAgICByZXR1cm4gKG1hcCAhPT0gbnVsbCAmJiB0eXBlb2YgbWFwICE9PSBcInVuZGVmaW5lZFwiKTtcbiAgICB9O1xuICAgIEluZm9XaW5kb3cucHJvdG90eXBlLmNsb3NlID0gZnVuY3Rpb24gKCkge1xuICAgICAgICBjbGVhclRpbWVvdXQodGhpcy50aW1lcik7XG4gICAgICAgIGlmICh0aGlzLnRoYXQuaW5mb1dpbmRvdyAmJiB0aGlzLmlzT3Blbih0aGlzLnRoYXQuaW5mb1dpbmRvdykpIHtcbiAgICAgICAgICAgIHRoaXMudGhhdC5pbmZvV2luZG93LmNsb3NlKCk7XG4gICAgICAgIH1cbiAgICB9O1xuICAgIEluZm9XaW5kb3cucHJvdG90eXBlLmFkZEV2ZW50cyA9IGZ1bmN0aW9uIChtYXJrZXIsIG9wdGlvbnMsIG1hcCkge1xuICAgICAgICB2YXIgX3RoaXMgPSB0aGlzO1xuICAgICAgICB2YXIgYXJncyA9IHRoaXMudXRpbHMucHJlcGFyZU9wdGlvbnMob3B0aW9ucywgdGhpcy5jb25maWcuY3VzdG9tSW5mb1dpbmRvd09wdGlvbnMpO1xuICAgICAgICB2YXIgb3Blbk9uID0gKGFyZ3MuY3VzdG9tICYmIGFyZ3MuY3VzdG9tLm9wZW4gJiYgYXJncy5jdXN0b20ub3Blbi5vbikgPyBhcmdzLmN1c3RvbS5vcGVuLm9uIDogJ2NsaWNrJztcbiAgICAgICAgdmFyIGNsb3NlT24gPSAoYXJncy5jdXN0b20gJiYgYXJncy5jdXN0b20uY2xvc2UgJiYgYXJncy5jdXN0b20uY2xvc2Uub24pID8gYXJncy5jdXN0b20uY2xvc2Uub24gOiAnY2xpY2snO1xuICAgICAgICAvLyBUb2dnbGUgRWZmZWN0IHdoZW4gdXNpbmcgdGhlIHNhbWUgbWV0aG9kIHRvIE9wZW4gYW5kIENsb3NlLlxuICAgICAgICBpZiAob3Blbk9uID09PSBjbG9zZU9uKSB7XG4gICAgICAgICAgICBnb29nbGUubWFwcy5ldmVudC5hZGRMaXN0ZW5lcihtYXJrZXIsIG9wZW5PbiwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIGlmICghX3RoaXMudGhhdC5pbmZvV2luZG93IHx8ICFfdGhpcy5pc09wZW4oX3RoaXMudGhhdC5pbmZvV2luZG93KSkge1xuICAgICAgICAgICAgICAgICAgICBfdGhpcy5vcGVuKG1hcCwgbWFya2VyLCBhcmdzLmRlZmF1bHRzKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIF90aGlzLmNsb3NlKCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBnb29nbGUubWFwcy5ldmVudC5hZGRMaXN0ZW5lcihtYXJrZXIsIG9wZW5PbiwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIF90aGlzLm9wZW4obWFwLCBtYXJrZXIsIGFyZ3MuZGVmYXVsdHMpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBnb29nbGUubWFwcy5ldmVudC5hZGRMaXN0ZW5lcihtYXJrZXIsIGNsb3NlT24sIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBpZiAoYXJncy5jdXN0b20uY2xvc2UuZHVyYXRpb24pIHtcbiAgICAgICAgICAgICAgICAgICAgX3RoaXMudGltZXIgPSBzZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIF90aGlzLmNsb3NlKCk7XG4gICAgICAgICAgICAgICAgICAgIH0sIGFyZ3MuY3VzdG9tLmNsb3NlLmR1cmF0aW9uKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIF90aGlzLmNsb3NlKCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICB9O1xuICAgIHJldHVybiBJbmZvV2luZG93O1xufSkoKTtcbm1vZHVsZS5leHBvcnRzID0gSW5mb1dpbmRvdztcbiIsInZhciBMb2NhdGUgPSAoZnVuY3Rpb24gKCkge1xuICAgIGZ1bmN0aW9uIExvY2F0ZSgpIHtcbiAgICB9XG4gICAgTG9jYXRlLnByb3RvdHlwZS5sb2NhdGUgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBjZW50ZXIgPSB0aGlzLmluc3RhbmNlLmdldENlbnRlcigpO1xuICAgICAgICByZXR1cm4geyBsYXQ6IGNlbnRlci5sYXQoKSwgbG5nOiBjZW50ZXIubG5nKCkgfTtcbiAgICB9O1xuICAgIHJldHVybiBMb2NhdGU7XG59KSgpO1xubW9kdWxlLmV4cG9ydHMgPSBMb2NhdGU7XG4iLCIvLy8gPHJlZmVyZW5jZSBwYXRoPVwidHlwaW5ncy90c2QuZC50c1wiLz5cbnZhciBhZGRNYXJrZXIgPSByZXF1aXJlKCcuL2FkZE1hcmtlcicpO1xudmFyIGFkZEZlYXR1cmUgPSByZXF1aXJlKCcuL2FkZEZlYXR1cmUnKTtcbnZhciBhZGRQYW5lbCA9IHJlcXVpcmUoJy4vYWRkUGFuZWwnKTtcbnZhciBjZW50ZXIgPSByZXF1aXJlKCcuL2NlbnRlcicpO1xudmFyIGxvY2F0ZSA9IHJlcXVpcmUoJy4vbG9jYXRlJyk7XG52YXIgdXBkYXRlTWFya2VyID0gcmVxdWlyZSgnLi91cGRhdGVNYXJrZXInKTtcbnZhciB1cGRhdGVNYXAgPSByZXF1aXJlKCcuL3VwZGF0ZU1hcCcpO1xudmFyIHVwZGF0ZUZlYXR1cmUgPSByZXF1aXJlKCcuL3VwZGF0ZUZlYXR1cmUnKTtcbnZhciBhZGRNYXAgPSByZXF1aXJlKCcuL2FkZE1hcCcpO1xudmFyIHJlbW92ZU1hcmtlciA9IHJlcXVpcmUoJy4vcmVtb3ZlTWFya2VyJyk7XG52YXIgcmVzZXRNYXJrZXIgPSByZXF1aXJlKCcuL3Jlc2V0TWFya2VyJyk7XG52YXIgZmlsdGVyID0gcmVxdWlyZSgnLi9maWx0ZXInKTtcbnZhciBtYXBUb29scyA9IChmdW5jdGlvbiAoKSB7XG4gICAgZnVuY3Rpb24gbWFwVG9vbHMob3B0aW9ucywgY2IpIHtcbiAgICAgICAgdGhpcy5jcm9zc2ZpbHRlciA9IHJlcXVpcmUoJ2Nyb3NzZmlsdGVyJyk7XG4gICAgICAgIHZhciBhZGRNYXJrZXJJbnN0YW5jZSA9IG5ldyBhZGRNYXJrZXIodGhpcyk7XG4gICAgICAgIHRoaXMuYWRkTWFya2VyID0gZnVuY3Rpb24gKG1hcmtlciwgb3B0aW9ucykge1xuICAgICAgICAgICAgcmV0dXJuIGFkZE1hcmtlckluc3RhbmNlLmFkZE1hcmtlcihtYXJrZXIsIG9wdGlvbnMpO1xuICAgICAgICB9O1xuICAgICAgICB2YXIgYWRkRmVhdHVyZUluc3RhbmNlID0gbmV3IGFkZEZlYXR1cmUodGhpcyk7XG4gICAgICAgIHRoaXMuYWRkVG9wb0pzb24gPSBmdW5jdGlvbiAoZGF0YSwgb3B0aW9ucykge1xuICAgICAgICAgICAgcmV0dXJuIGFkZEZlYXR1cmVJbnN0YW5jZS5hZGRUb3BvSnNvbihkYXRhLCBvcHRpb25zKTtcbiAgICAgICAgfTtcbiAgICAgICAgdGhpcy5hZGRHZW9Kc29uID0gZnVuY3Rpb24gKGRhdGEsIG9wdGlvbnMpIHtcbiAgICAgICAgICAgIHJldHVybiBhZGRGZWF0dXJlSW5zdGFuY2UuYWRkR2VvSnNvbihkYXRhLCBvcHRpb25zKTtcbiAgICAgICAgfTtcbiAgICAgICAgdmFyIGFkZFBhbmVsSW5zdGFuY2UgPSBuZXcgYWRkUGFuZWwodGhpcyk7XG4gICAgICAgIHRoaXMuYWRkUGFuZWwgPSBmdW5jdGlvbiAob3B0aW9ucywgY2IpIHtcbiAgICAgICAgICAgIHJldHVybiBhZGRQYW5lbEluc3RhbmNlLmFkZFBhbmVsKG9wdGlvbnMsIGNiKTtcbiAgICAgICAgfTtcbiAgICAgICAgdGhpcy5jZW50ZXIgPSBuZXcgY2VudGVyKCkucG9zO1xuICAgICAgICB0aGlzLmxvY2F0ZSA9IG5ldyBsb2NhdGUoKS5sb2NhdGU7XG4gICAgICAgIHZhciB1cGRhdGVNYXJrZXJJbnN0YW5jZSA9IG5ldyB1cGRhdGVNYXJrZXIodGhpcyk7XG4gICAgICAgIHRoaXMudXBkYXRlTWFya2VyID0gZnVuY3Rpb24gKGFyZ3MsIG9wdGlvbnMpIHtcbiAgICAgICAgICAgIHJldHVybiB1cGRhdGVNYXJrZXJJbnN0YW5jZS51cGRhdGUoYXJncywgb3B0aW9ucyk7XG4gICAgICAgIH07XG4gICAgICAgIHZhciB1cGRhdGVNYXBJbnN0YW5jZSA9IG5ldyB1cGRhdGVNYXAodGhpcyk7XG4gICAgICAgIHRoaXMudXBkYXRlTWFwID0gZnVuY3Rpb24gKGFyZ3MpIHtcbiAgICAgICAgICAgIHVwZGF0ZU1hcEluc3RhbmNlLnVwZGF0ZU1hcChhcmdzKTtcbiAgICAgICAgfTtcbiAgICAgICAgdmFyIHVwZGF0ZUZlYXR1cmVJbnN0YW5jZSA9IG5ldyB1cGRhdGVGZWF0dXJlKHRoaXMpO1xuICAgICAgICB0aGlzLnVwZGF0ZUZlYXR1cmUgPSBmdW5jdGlvbiAoYXJncywgb3B0aW9ucykge1xuICAgICAgICAgICAgcmV0dXJuIHVwZGF0ZUZlYXR1cmVJbnN0YW5jZS51cGRhdGUoYXJncywgb3B0aW9ucyk7XG4gICAgICAgIH07XG4gICAgICAgIHZhciByZW1vdmVNYXJrZXJJbnN0YW5jZSA9IG5ldyByZW1vdmVNYXJrZXIodGhpcyk7XG4gICAgICAgIHRoaXMucmVtb3ZlTWFya2VyID0gZnVuY3Rpb24gKGFyZ3MpIHtcbiAgICAgICAgICAgIHJldHVybiByZW1vdmVNYXJrZXJJbnN0YW5jZS5yZW1vdmVNYXJrZXIoYXJncyk7XG4gICAgICAgIH07XG4gICAgICAgIHZhciByZXNldE1hcmtlckluc3RhbmNlID0gbmV3IHJlc2V0TWFya2VyKHRoaXMpO1xuICAgICAgICB0aGlzLnJlc2V0TWFya2VyID0gZnVuY3Rpb24gKGFyZ3MsIG9wdGlvbnMpIHtcbiAgICAgICAgICAgIHJldHVybiByZXNldE1hcmtlckluc3RhbmNlLnJlc2V0TWFya2VyKGFyZ3MsIG9wdGlvbnMpO1xuICAgICAgICB9O1xuICAgICAgICB2YXIgZmluZE1hcmtlciA9IG5ldyBmaWx0ZXIodGhpcywgJ21hcmtlcnMnKTtcbiAgICAgICAgdGhpcy5maW5kTWFya2VyID0gZnVuY3Rpb24gKGFyZ3MsIG9wdGlvbnMpIHtcbiAgICAgICAgICAgIHJldHVybiBmaW5kTWFya2VyLmZpbHRlcihhcmdzLCBvcHRpb25zKTtcbiAgICAgICAgfTtcbiAgICAgICAgLy8gVW5pdCBUZXN0cz9cbiAgICAgICAgdmFyIGZpbmRGZWF0dXJlID0gbmV3IGZpbHRlcih0aGlzLCAnanNvbicpO1xuICAgICAgICB0aGlzLmZpbmRGZWF0dXJlID0gZnVuY3Rpb24gKGFyZ3MsIG9wdGlvbnMpIHtcbiAgICAgICAgICAgIHJldHVybiBmaW5kRmVhdHVyZS5maWx0ZXIoYXJncywgb3B0aW9ucyk7XG4gICAgICAgIH07XG4gICAgICAgIHZhciBtYXAgPSBuZXcgYWRkTWFwKHRoaXMpO1xuICAgICAgICBtYXAubG9hZChvcHRpb25zLCBjYik7XG4gICAgfVxuICAgIG1hcFRvb2xzLnByb3RvdHlwZS56b29tID0gZnVuY3Rpb24gKHpvb20pIHtcbiAgICAgICAgaWYgKHR5cGVvZiB6b29tID09PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuaW5zdGFuY2UuZ2V0Wm9vbSgpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5pbnN0YW5jZS5zZXRab29tKHpvb20pO1xuICAgICAgICB9XG4gICAgfTtcbiAgICByZXR1cm4gbWFwVG9vbHM7XG59KSgpO1xubW9kdWxlLmV4cG9ydHMgPSBtYXBUb29scztcbiIsIi8vLyA8cmVmZXJlbmNlIHBhdGg9XCJ0eXBpbmdzL3RzZC5kLnRzXCIvPlxudmFyIHV0aWxzID0gcmVxdWlyZSgnLi91dGlscycpO1xudmFyIGNvbmZpZyA9IHJlcXVpcmUoJy4vY29uZmlnJyk7XG52YXIgTWFwcyA9IChmdW5jdGlvbiAoKSB7XG4gICAgZnVuY3Rpb24gTWFwcygpIHtcbiAgICB9XG4gICAgLyoqXG4gICAgICogSW5qZWN0cyBHb29nbGUgQVBJIEphdmFzY3JpcHQgRmlsZSBhbmQgYWRkcyBhIGNhbGxiYWNrIHRvIGxvYWQgdGhlIEdvb2dsZSBNYXBzIEFzeW5jLlxuICAgICAqIEB0eXBlIHt7bG9hZDogRnVuY3Rpb259fVxuICAgICAqIEBwcml2YXRlXG4gICAgICpcbiAgICAgKiBAcmV0dXJucyB0aGUgZWxlbWVudCBhcHBlbmRlZFxuICAgICAqL1xuICAgIE1hcHMubG9hZCA9IGZ1bmN0aW9uIChpZCwgYXJncykge1xuICAgICAgICB2YXIgdmVyc2lvbiA9IGFyZ3MudmVyc2lvbiB8fCBjb25maWcudmVyc2lvbjtcbiAgICAgICAgdmFyIHNjcmlwdCA9IHdpbmRvdy5kb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzY3JpcHQnKTtcbiAgICAgICAgc2NyaXB0LnR5cGUgPSAndGV4dC9qYXZhc2NyaXB0JztcbiAgICAgICAgc2NyaXB0LnNyYyA9IFwiXCIgKyBjb25maWcudXJsICsgXCI/dj1cIiArIHZlcnNpb24gKyBcIiZrZXk9XCIgKyBhcmdzLmtleSArIFwiJmNhbGxiYWNrPW1hcFRvb2xzLm1hcHMuXCIgKyBpZCArIFwiLmNyZWF0ZVwiO1xuICAgICAgICByZXR1cm4gd2luZG93LmRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQoc2NyaXB0KTtcbiAgICB9O1xuICAgIE1hcHMubWFwT3B0aW9ucyA9IGZ1bmN0aW9uIChhcmdzKSB7XG4gICAgICAgIC8vIFRvIGNsb25lIEFyZ3VtZW50cyBleGNsdWRpbmcgY3VzdG9tTWFwT3B0aW9uc1xuICAgICAgICB2YXIgcmVzdWx0ID0gdXRpbHMuY2xvbmUoYXJncywgY29uZmlnLmN1c3RvbU1hcE9wdGlvbnMpO1xuICAgICAgICByZXN1bHQuem9vbSA9IGFyZ3Muem9vbSB8fCBjb25maWcuem9vbTtcbiAgICAgICAgaWYgKGFyZ3MubGF0ICYmIGFyZ3MubG5nKSB7XG4gICAgICAgICAgICByZXN1bHQuY2VudGVyID0gbmV3IGdvb2dsZS5tYXBzLkxhdExuZyhhcmdzLmxhdCwgYXJncy5sbmcpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChhcmdzLnR5cGUpIHtcbiAgICAgICAgICAgIHJlc3VsdC5tYXBUeXBlSWQgPSBnb29nbGUubWFwcy5NYXBUeXBlSWRbYXJncy50eXBlXSB8fCBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH07XG4gICAgcmV0dXJuIE1hcHM7XG59KSgpO1xubW9kdWxlLmV4cG9ydHMgPSBNYXBzO1xuIiwiLy8vIDxyZWZlcmVuY2UgcGF0aD1cInR5cGluZ3MvdHNkLmQudHNcIi8+XG52YXIgZmluZE1hcmtlciA9IHJlcXVpcmUoJy4vZmluZE1hcmtlckJ5SWQnKTtcbnZhciBSZW1vdmVNYXJrZXIgPSAoZnVuY3Rpb24gKCkge1xuICAgIGZ1bmN0aW9uIFJlbW92ZU1hcmtlcih0aGF0KSB7XG4gICAgICAgIHRoaXMudGhhdCA9IHRoYXQ7XG4gICAgICAgIHZhciBmaW5kTWFya2VySW5zdGFuY2UgPSBuZXcgZmluZE1hcmtlcih0aGF0KTtcbiAgICAgICAgdGhpcy5maW5kTWFya2VyID0gZnVuY3Rpb24gKG1hcmtlcikge1xuICAgICAgICAgICAgcmV0dXJuIGZpbmRNYXJrZXJJbnN0YW5jZS5maW5kKG1hcmtlcik7XG4gICAgICAgIH07XG4gICAgfVxuICAgIFJlbW92ZU1hcmtlci5wcm90b3R5cGUucmVtb3ZlQnVsayA9IGZ1bmN0aW9uIChhcmdzKSB7XG4gICAgICAgIHZhciBtYXJrZXIsIHg7XG4gICAgICAgIGZvciAoeCBpbiBhcmdzKSB7XG4gICAgICAgICAgICBpZiAoYXJncy5oYXNPd25Qcm9wZXJ0eSh4KSkge1xuICAgICAgICAgICAgICAgIG1hcmtlciA9IGFyZ3NbeF07XG4gICAgICAgICAgICAgICAgdGhpcy5yZW1vdmUodGhpcy5maW5kTWFya2VyKG1hcmtlcikpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfTtcbiAgICBSZW1vdmVNYXJrZXIucHJvdG90eXBlLnJlbW92ZU1hcmtlciA9IGZ1bmN0aW9uIChhcmdzKSB7XG4gICAgICAgIGlmICh0eXBlb2YgYXJncyA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgIHRoaXMucmVtb3ZlQnVsayh0aGlzLnRoYXQubWFya2Vycy5hbGwpO1xuICAgICAgICB9XG4gICAgICAgIHZhciB0eXBlID0gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKGFyZ3MpO1xuICAgICAgICBpZiAodHlwZSA9PT0gJ1tvYmplY3QgT2JqZWN0XScpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLnJlbW92ZSh0aGlzLmZpbmRNYXJrZXIoYXJncykpO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0eXBlID09PSAnW29iamVjdCBBcnJheV0nKSB7XG4gICAgICAgICAgICB0aGlzLnJlbW92ZUJ1bGsoYXJncyk7XG4gICAgICAgIH1cbiAgICB9O1xuICAgIFJlbW92ZU1hcmtlci5wcm90b3R5cGUucmVtb3ZlID0gZnVuY3Rpb24gKG1hcmtlcikge1xuICAgICAgICBtYXJrZXIuc2V0TWFwKG51bGwpO1xuICAgICAgICBkZWxldGUgbWFwVG9vbHMubWFwc1t0aGlzLnRoYXQuaWRdLm1hcmtlcnMuYWxsW21hcmtlci5kYXRhLnVpZF07XG4gICAgfTtcbiAgICByZXR1cm4gUmVtb3ZlTWFya2VyO1xufSkoKTtcbm1vZHVsZS5leHBvcnRzID0gUmVtb3ZlTWFya2VyO1xuIiwiLy8vIDxyZWZlcmVuY2UgcGF0aD1cInR5cGluZ3MvdHNkLmQudHNcIi8+XG52YXIgdXRpbHMgPSByZXF1aXJlKCcuL3V0aWxzJyk7XG52YXIgY29uZmlnID0gcmVxdWlyZSgnLi9jb25maWcnKTtcbnZhciBmaW5kTWFya2VyID0gcmVxdWlyZSgnLi9maW5kTWFya2VyQnlJZCcpO1xudmFyIHVwZGF0ZU1hcmtlciA9IHJlcXVpcmUoJy4vdXBkYXRlTWFya2VyJyk7XG52YXIgUmVzZXRNYXJrZXIgPSAoZnVuY3Rpb24gKCkge1xuICAgIGZ1bmN0aW9uIFJlc2V0TWFya2VyKHRoYXQpIHtcbiAgICAgICAgdGhpcy50aGF0ID0gdGhhdDtcbiAgICAgICAgdmFyIGZpbmRNYXJrZXJJbnN0YW5jZSA9IG5ldyBmaW5kTWFya2VyKHRoYXQpO1xuICAgICAgICB0aGlzLmZpbmRNYXJrZXIgPSBmdW5jdGlvbiAobWFya2VyKSB7XG4gICAgICAgICAgICByZXR1cm4gZmluZE1hcmtlckluc3RhbmNlLmZpbmQobWFya2VyKTtcbiAgICAgICAgfTtcbiAgICAgICAgdGhpcy51cGRhdGVNYXJrZXIgPSBuZXcgdXBkYXRlTWFya2VyKHRoYXQpO1xuICAgIH1cbiAgICBSZXNldE1hcmtlci5wcm90b3R5cGUucmVzZXRCdWxrID0gZnVuY3Rpb24gKG1hcmtlcnMsIG9wdGlvbnMpIHtcbiAgICAgICAgdmFyIHg7XG4gICAgICAgIGZvciAoeCBpbiBtYXJrZXJzKSB7XG4gICAgICAgICAgICBpZiAobWFya2Vycy5oYXNPd25Qcm9wZXJ0eSh4KSkge1xuICAgICAgICAgICAgICAgIHRoaXMucmVzZXQobWFya2Vyc1t4XSwgb3B0aW9ucyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9O1xuICAgIFJlc2V0TWFya2VyLnByb3RvdHlwZS5yZXNldE1hcmtlciA9IGZ1bmN0aW9uIChhcmdzLCBvcHRpb25zKSB7XG4gICAgICAgIHZhciB0eXBlID0gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKGFyZ3MpO1xuICAgICAgICB2YXIgcmVzdWx0O1xuICAgICAgICBpZiAodHlwZSA9PT0gJ1tvYmplY3QgT2JqZWN0XScpIHtcbiAgICAgICAgICAgIHJlc3VsdCA9IHRoaXMucmVzZXQodGhpcy5maW5kTWFya2VyKGFyZ3MpLCBvcHRpb25zKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAodHlwZSA9PT0gJ1tvYmplY3QgQXJyYXldJykge1xuICAgICAgICAgICAgcmVzdWx0ID0gdGhpcy5yZXNldEJ1bGsoYXJncywgb3B0aW9ucyk7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy50aGF0Lm1hcmtlcnMuZGF0YUNoYW5nZWQgPSB0cnVlO1xuICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH07XG4gICAgUmVzZXRNYXJrZXIucHJvdG90eXBlLmZvcm1hdE9wdGlvbnMgPSBmdW5jdGlvbiAobWFya2VyLCBvcHRpb25zKSB7XG4gICAgICAgIHZhciBrZXksIG9wID0ge307XG4gICAgICAgIHZhciB0eXBlID0gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKG9wdGlvbnMpO1xuICAgICAgICBpZiAodHlwZSA9PT0gJ1tvYmplY3QgU3RyaW5nXScpIHtcbiAgICAgICAgICAgIG9wW29wdGlvbnNdID0gbWFya2VyLmRhdGEuX3NlbGZbb3B0aW9uc107XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHR5cGUgPT09ICdbb2JqZWN0IEFycmF5XScpIHtcbiAgICAgICAgICAgIGZvciAoa2V5IGluIG9wdGlvbnMpIHtcbiAgICAgICAgICAgICAgICBpZiAob3B0aW9ucy5oYXNPd25Qcm9wZXJ0eShrZXkpKSB7XG4gICAgICAgICAgICAgICAgICAgIG9wW29wdGlvbnNba2V5XV0gPSBtYXJrZXIuZGF0YS5fc2VsZltvcHRpb25zW2tleV1dO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gb3A7XG4gICAgfTtcbiAgICBSZXNldE1hcmtlci5wcm90b3R5cGUucmVzZXQgPSBmdW5jdGlvbiAobWFya2VyLCBvcHRpb25zKSB7XG4gICAgICAgIHZhciBwcmVwYXJlZE9wdGlvbnMgPSB1dGlscy5wcmVwYXJlT3B0aW9ucyh0aGlzLmZvcm1hdE9wdGlvbnMobWFya2VyLCBvcHRpb25zKSwgY29uZmlnLmN1c3RvbU1hcmtlck9wdGlvbnMpO1xuICAgICAgICB0aGlzLnVwZGF0ZU1hcmtlci5jdXN0b21VcGRhdGUobWFya2VyLCBwcmVwYXJlZE9wdGlvbnMpO1xuICAgICAgICByZXR1cm4gbWFya2VyO1xuICAgIH07XG4gICAgcmV0dXJuIFJlc2V0TWFya2VyO1xufSkoKTtcbm1vZHVsZS5leHBvcnRzID0gUmVzZXRNYXJrZXI7XG4iLCJ2YXIgVGVtcGxhdGUgPSAoZnVuY3Rpb24gKCkge1xuICAgIGZ1bmN0aW9uIFRlbXBsYXRlKHRoYXQpIHtcbiAgICAgICAgdGhpcy50aGF0ID0gdGhhdDtcbiAgICB9XG4gICAgVGVtcGxhdGUucHJvdG90eXBlLmxvYWQgPSBmdW5jdGlvbiAodHlwZSwgdXJsLCBjYikge1xuICAgICAgICB2YXIgX3RoaXMgPSB0aGlzO1xuICAgICAgICBpZiAodGhpcy50aGF0LnRlbXBsYXRlc1t0eXBlXVt1cmxdKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy50aGF0LnRlbXBsYXRlc1t0eXBlXVt1cmxdO1xuICAgICAgICB9XG4gICAgICAgIHZhciB4aHIgPSBuZXcgWE1MSHR0cFJlcXVlc3QoKTtcbiAgICAgICAgeGhyLm9wZW4oXCJHRVRcIiwgdXJsKTtcbiAgICAgICAgeGhyLm9ubG9hZCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGlmICh4aHIucmVhZHlTdGF0ZSA9PT0gNCkge1xuICAgICAgICAgICAgICAgIGlmICh4aHIuc3RhdHVzID09PSAyMDApIHtcbiAgICAgICAgICAgICAgICAgICAgX3RoaXMudGhhdC50ZW1wbGF0ZXNbdHlwZV1bdXJsXSA9IHhoci5yZXNwb25zZVRleHQ7XG4gICAgICAgICAgICAgICAgICAgIGNiKGZhbHNlLCB4aHIucmVzcG9uc2VUZXh0KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGNiKG5ldyBFcnJvcih4aHIuc3RhdHVzVGV4dCkpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICAgICAgeGhyLnNlbmQobnVsbCk7XG4gICAgfTtcbiAgICByZXR1cm4gVGVtcGxhdGU7XG59KSgpO1xubW9kdWxlLmV4cG9ydHMgPSBUZW1wbGF0ZTtcbiIsIi8vLyA8cmVmZXJlbmNlIHBhdGg9XCJ0eXBpbmdzL3RzZC5kLnRzXCIvPlxudmFyIFVwZGF0ZUZlYXR1cmUgPSAoZnVuY3Rpb24gKCkge1xuICAgIGZ1bmN0aW9uIFVwZGF0ZUZlYXR1cmUodGhhdCkge1xuICAgICAgICB0aGlzLnRoYXQgPSB0aGF0O1xuICAgIH1cbiAgICBVcGRhdGVGZWF0dXJlLnByb3RvdHlwZS51cGRhdGVTdHlsZSA9IGZ1bmN0aW9uIChmLCBzdHlsZSkge1xuICAgICAgICBpZiAodHlwZW9mIHN0eWxlID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICB2YXIgc3R5bGVPcHRpb25zID0gc3R5bGUuY2FsbChmKTtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLnRoYXQuaW5zdGFuY2UuZGF0YS5vdmVycmlkZVN0eWxlKGYsIHN0eWxlT3B0aW9ucyk7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy50aGF0Lmluc3RhbmNlLmRhdGEub3ZlcnJpZGVTdHlsZShmLCBzdHlsZSk7XG4gICAgfTtcbiAgICBVcGRhdGVGZWF0dXJlLnByb3RvdHlwZS5maW5kQW5kVXBkYXRlID0gZnVuY3Rpb24gKGFyZ3MsIG9wdGlvbnMpIHtcbiAgICAgICAgaWYgKGFyZ3MuZGF0YSAmJiBhcmdzLmRhdGEudWlkKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy51cGRhdGVGZWF0dXJlKGFyZ3MsIG9wdGlvbnMpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChhcmdzLnVpZCAmJiBtYXBUb29scy5tYXBzW3RoaXMudGhhdC5pZF0uanNvbiAmJiBtYXBUb29scy5tYXBzW3RoaXMudGhhdC5pZF0uanNvbi5hbGxbYXJncy51aWRdKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy51cGRhdGVGZWF0dXJlKG1hcFRvb2xzLm1hcHNbdGhpcy50aGF0LmlkXS5qc29uLmFsbFthcmdzLnVpZF0sIG9wdGlvbnMpO1xuICAgICAgICB9XG4gICAgfTtcbiAgICBVcGRhdGVGZWF0dXJlLnByb3RvdHlwZS51cGRhdGUgPSBmdW5jdGlvbiAoYXJncywgb3B0aW9ucykge1xuICAgICAgICB2YXIgdHlwZSA9IE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbChhcmdzKTtcbiAgICAgICAgaWYgKHR5cGUgPT09ICdbb2JqZWN0IEFycmF5XScpIHtcbiAgICAgICAgICAgIHZhciBmZWF0dXJlLCB4O1xuICAgICAgICAgICAgZm9yICh4IGluIGFyZ3MpIHtcbiAgICAgICAgICAgICAgICBpZiAoYXJncy5oYXNPd25Qcm9wZXJ0eSh4KSkge1xuICAgICAgICAgICAgICAgICAgICBmZWF0dXJlID0gYXJnc1t4XTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5maW5kQW5kVXBkYXRlKGZlYXR1cmUsIG9wdGlvbnMpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBpZiAodHlwZSA9PT0gJ1tvYmplY3QgT2JqZWN0XScpIHtcbiAgICAgICAgICAgIHRoaXMuZmluZEFuZFVwZGF0ZShhcmdzLCBvcHRpb25zKTtcbiAgICAgICAgfVxuICAgIH07XG4gICAgVXBkYXRlRmVhdHVyZS5wcm90b3R5cGUudXBkYXRlRmVhdHVyZSA9IGZ1bmN0aW9uIChmZWF0dXJlLCBvcHRpb25zKSB7XG4gICAgICAgIGlmIChvcHRpb25zLnN0eWxlKSB7XG4gICAgICAgICAgICB0aGlzLnVwZGF0ZVN0eWxlKGZlYXR1cmUsIG9wdGlvbnMuc3R5bGUpO1xuICAgICAgICB9XG4gICAgfTtcbiAgICByZXR1cm4gVXBkYXRlRmVhdHVyZTtcbn0pKCk7XG5tb2R1bGUuZXhwb3J0cyA9IFVwZGF0ZUZlYXR1cmU7XG4iLCIvLy8gPHJlZmVyZW5jZSBwYXRoPVwibWFwcy50c1wiLz5cbnZhciBtYXBzID0gcmVxdWlyZSgnLi9tYXBzJyk7XG52YXIgVXBkYXRlTWFwID0gKGZ1bmN0aW9uICgpIHtcbiAgICBmdW5jdGlvbiBVcGRhdGVNYXAodGhhdCkge1xuICAgICAgICB0aGlzLnRoYXQgPSB0aGF0O1xuICAgIH1cbiAgICBVcGRhdGVNYXAucHJvdG90eXBlLnVwZGF0ZU1hcCA9IGZ1bmN0aW9uIChhcmdzKSB7XG4gICAgICAgIHZhciBtYXBPcHRpb25zID0gbWFwcy5tYXBPcHRpb25zKGFyZ3MpO1xuICAgICAgICByZXR1cm4gdGhpcy50aGF0Lmluc3RhbmNlLnNldE9wdGlvbnMobWFwT3B0aW9ucyk7XG4gICAgfTtcbiAgICByZXR1cm4gVXBkYXRlTWFwO1xufSkoKTtcbm1vZHVsZS5leHBvcnRzID0gVXBkYXRlTWFwO1xuIiwiLy8vIDxyZWZlcmVuY2UgcGF0aD1cInR5cGluZ3MvdHNkLmQudHNcIi8+XG52YXIgdXRpbHMgPSByZXF1aXJlKCcuL3V0aWxzJyk7XG52YXIgY29uZmlnID0gcmVxdWlyZSgnLi9jb25maWcnKTtcbnZhciBmaW5kTWFya2VyID0gcmVxdWlyZSgnLi9maW5kTWFya2VyQnlJZCcpO1xudmFyIGZpbHRlciA9IHJlcXVpcmUoJy4vZmlsdGVyJyk7XG52YXIgVXBkYXRlTWFya2VyID0gKGZ1bmN0aW9uICgpIHtcbiAgICBmdW5jdGlvbiBVcGRhdGVNYXJrZXIodGhhdCkge1xuICAgICAgICB0aGlzLnRoYXQgPSB0aGF0O1xuICAgICAgICB2YXIgZmluZE1hcmtlckluc3RhbmNlID0gbmV3IGZpbmRNYXJrZXIodGhhdCk7XG4gICAgICAgIHRoaXMuZmluZE1hcmtlciA9IGZ1bmN0aW9uIChtYXJrZXIpIHtcbiAgICAgICAgICAgIHJldHVybiBmaW5kTWFya2VySW5zdGFuY2UuZmluZChtYXJrZXIpO1xuICAgICAgICB9O1xuICAgIH1cbiAgICBVcGRhdGVNYXJrZXIucHJvdG90eXBlLnJlbW92ZVRhZ3MgPSBmdW5jdGlvbiAobWFya2VyKSB7XG4gICAgICAgIGlmICh1dGlscy5pc0FycmF5KG1hcmtlci50YWdzKSkge1xuICAgICAgICAgICAgdmFyIGksIHRhZztcbiAgICAgICAgICAgIGZvciAoaSBpbiBtYXJrZXIudGFncykge1xuICAgICAgICAgICAgICAgIGlmIChtYXJrZXIudGFncy5oYXNPd25Qcm9wZXJ0eShpKSkge1xuICAgICAgICAgICAgICAgICAgICB0YWcgPSBtYXJrZXIudGFnc1tpXTtcbiAgICAgICAgICAgICAgICAgICAgZGVsZXRlIHRoaXMudGhhdC5tYXJrZXJzLnRhZ3NbdGFnXVttYXJrZXIuZGF0YS51aWRdO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIGRlbGV0ZSB0aGlzLnRoYXQubWFya2Vycy50YWdzW21hcmtlci50YWdzXVttYXJrZXIuZGF0YS51aWRdO1xuICAgICAgICB9XG4gICAgfTtcbiAgICBVcGRhdGVNYXJrZXIucHJvdG90eXBlLmFkZFRhZ3MgPSBmdW5jdGlvbiAobWFya2VyLCBvcHRpb25zKSB7XG4gICAgICAgIGlmICh1dGlscy5pc0FycmF5KG9wdGlvbnMuY3VzdG9tLnRhZ3MpKSB7XG4gICAgICAgICAgICB2YXIgaSwgdGFnO1xuICAgICAgICAgICAgZm9yIChpIGluIG9wdGlvbnMuY3VzdG9tLnRhZ3MpIHtcbiAgICAgICAgICAgICAgICB0YWcgPSBvcHRpb25zLmN1c3RvbS50YWdzW2ldO1xuICAgICAgICAgICAgICAgIHRoaXMudGhhdC5tYXJrZXJzLnRhZ3NbdGFnXSA9IHRoaXMudGhhdC5tYXJrZXJzLnRhZ3NbdGFnXSB8fCB7fTtcbiAgICAgICAgICAgICAgICB0aGlzLnRoYXQubWFya2Vycy50YWdzW3RhZ11bbWFya2VyLmRhdGEudWlkXSA9IG1hcmtlcjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMudGhhdC5tYXJrZXJzLnRhZ3Nbb3B0aW9ucy5jdXN0b20udGFnc10gPSB0aGlzLnRoYXQubWFya2Vycy50YWdzW29wdGlvbnMuY3VzdG9tLnRhZ3NdIHx8IHt9O1xuICAgICAgICAgICAgdGhpcy50aGF0Lm1hcmtlcnMudGFnc1tvcHRpb25zLmN1c3RvbS50YWdzXVttYXJrZXIuZGF0YS51aWRdID0gbWFya2VyO1xuICAgICAgICB9XG4gICAgICAgIG1hcmtlci50YWdzID0gb3B0aW9ucy5jdXN0b20udGFncztcbiAgICB9O1xuICAgIFVwZGF0ZU1hcmtlci5wcm90b3R5cGUudXBkYXRlVGFnID0gZnVuY3Rpb24gKG1hcmtlciwgb3B0aW9ucykge1xuICAgICAgICB0aGlzLnJlbW92ZVRhZ3MobWFya2VyKTtcbiAgICAgICAgdGhpcy5hZGRUYWdzKG1hcmtlciwgb3B0aW9ucyk7XG4gICAgfTtcbiAgICBVcGRhdGVNYXJrZXIucHJvdG90eXBlLmN1c3RvbVVwZGF0ZSA9IGZ1bmN0aW9uIChtYXJrZXIsIG9wdGlvbnMpIHtcbiAgICAgICAgaWYgKG9wdGlvbnMuY3VzdG9tKSB7XG4gICAgICAgICAgICBpZiAob3B0aW9ucy5jdXN0b20ubW92ZSkge1xuICAgICAgICAgICAgICAgIG1hcmtlci5zZXRBbmltYXRpb24oZ29vZ2xlLm1hcHMuQW5pbWF0aW9uW29wdGlvbnMuY3VzdG9tLm1vdmUudG9VcHBlckNhc2UoKV0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKG9wdGlvbnMuY3VzdG9tLmxhdCAmJiBvcHRpb25zLmN1c3RvbS5sbmcpIHtcbiAgICAgICAgICAgICAgICBtYXJrZXIuc2V0UG9zaXRpb24obmV3IGdvb2dsZS5tYXBzLkxhdExuZyhvcHRpb25zLmN1c3RvbS5sYXQsIG9wdGlvbnMuY3VzdG9tLmxuZykpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKG9wdGlvbnMuY3VzdG9tLmluZm9XaW5kb3cgJiYgb3B0aW9ucy5jdXN0b20uaW5mb1dpbmRvdy5jb250ZW50KSB7XG4gICAgICAgICAgICAgICAgbWFya2VyLmluZm9XaW5kb3cuY29udGVudCA9IG9wdGlvbnMuY3VzdG9tLmluZm9XaW5kb3cuY29udGVudDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChvcHRpb25zLmN1c3RvbS50YWdzKSB7XG4gICAgICAgICAgICAgICAgdGhpcy51cGRhdGVUYWcobWFya2VyLCBvcHRpb25zKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBpZiAob3B0aW9ucy5kZWZhdWx0cykge1xuICAgICAgICAgICAgbWFya2VyLnNldE9wdGlvbnMob3B0aW9ucy5kZWZhdWx0cyk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG1hcmtlcjtcbiAgICB9O1xuICAgIFVwZGF0ZU1hcmtlci5wcm90b3R5cGUuYnVsa1VwZGF0ZSA9IGZ1bmN0aW9uIChhcmdzLCBvcHRpb25zKSB7XG4gICAgICAgIHZhciBtYXJrZXIsIHJlc3VsdHMgPSBbXSwgaW5zdGFuY2UsIHg7XG4gICAgICAgIGZvciAoeCBpbiBhcmdzKSB7XG4gICAgICAgICAgICBpZiAoYXJncy5oYXNPd25Qcm9wZXJ0eSh4KSkge1xuICAgICAgICAgICAgICAgIG1hcmtlciA9IGFyZ3NbeF07XG4gICAgICAgICAgICAgICAgaW5zdGFuY2UgPSB0aGlzLmN1c3RvbVVwZGF0ZSh0aGlzLmZpbmRNYXJrZXIobWFya2VyKSwgb3B0aW9ucyk7XG4gICAgICAgICAgICAgICAgcmVzdWx0cy5wdXNoKGluc3RhbmNlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcmVzdWx0cztcbiAgICB9O1xuICAgIFVwZGF0ZU1hcmtlci5wcm90b3R5cGUuY291bnRWaXNpYmxlID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgeCwgY291bnQgPSAwO1xuICAgICAgICBmb3IgKHggaW4gdGhpcy50aGF0Lm1hcmtlcnMuYWxsKSB7XG4gICAgICAgICAgICBpZiAodGhpcy50aGF0Lm1hcmtlcnMuYWxsW3hdLnZpc2libGUpIHtcbiAgICAgICAgICAgICAgICBjb3VudCsrO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGdvb2dsZS5tYXBzLmV2ZW50LnRyaWdnZXIodGhpcy50aGF0Lmluc3RhbmNlLCAnbWFya2VyX3Zpc2liaWxpdHlfY2hhbmdlZCcsIGNvdW50KTtcbiAgICB9O1xuICAgIFVwZGF0ZU1hcmtlci5wcm90b3R5cGUudXBkYXRlID0gZnVuY3Rpb24gKGFyZ3MsIG9wdGlvbnMpIHtcbiAgICAgICAgdmFyIHZpc2liaWxpdHlGbGFnID0gZmFsc2U7XG4gICAgICAgIHZhciBwcmVwYXJlZE9wdGlvbnMgPSB1dGlscy5wcmVwYXJlT3B0aW9ucyhvcHRpb25zLCBjb25maWcuY3VzdG9tTWFya2VyT3B0aW9ucyk7XG4gICAgICAgIGlmIChwcmVwYXJlZE9wdGlvbnMuZGVmYXVsdHMgJiYgcHJlcGFyZWRPcHRpb25zLmRlZmF1bHRzLmhhc093blByb3BlcnR5KCd2aXNpYmxlJykgJiYgdGhpcy50aGF0LmV2ZW50cy5pbmRleE9mKCdtYXJrZXJfdmlzaWJpbGl0eV9jaGFuZ2VkJykgPiAtMSkge1xuICAgICAgICAgICAgdmlzaWJpbGl0eUZsYWcgPSB0cnVlO1xuICAgICAgICB9XG4gICAgICAgIHZhciByZXN1bHQ7XG4gICAgICAgIHZhciB0eXBlID0gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKGFyZ3MpO1xuICAgICAgICBpZiAodHlwZSA9PT0gJ1tvYmplY3QgT2JqZWN0XScpIHtcbiAgICAgICAgICAgIGlmIChPYmplY3Qua2V5cyhhcmdzKS5sZW5ndGggPT09IDEgJiYgYXJncy50YWdzKSB7XG4gICAgICAgICAgICAgICAgdmFyIGZpbHRlckluc3RhbmNlID0gbmV3IGZpbHRlcih0aGlzLnRoYXQsICdtYXJrZXJzJyk7XG4gICAgICAgICAgICAgICAgcmVzdWx0ID0gdGhpcy5idWxrVXBkYXRlKGZpbHRlckluc3RhbmNlLmZpbHRlcihhcmdzKSwgcHJlcGFyZWRPcHRpb25zKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIHJlc3VsdCA9IHRoaXMuY3VzdG9tVXBkYXRlKHRoaXMuZmluZE1hcmtlcihhcmdzKSwgcHJlcGFyZWRPcHRpb25zKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBpZiAodHlwZSA9PT0gJ1tvYmplY3QgQXJyYXldJykge1xuICAgICAgICAgICAgcmVzdWx0ID0gdGhpcy5idWxrVXBkYXRlKGFyZ3MsIHByZXBhcmVkT3B0aW9ucyk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHZpc2liaWxpdHlGbGFnKSB7XG4gICAgICAgICAgICB0aGlzLmNvdW50VmlzaWJsZSgpO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMudGhhdC5tYXJrZXJzLmRhdGFDaGFuZ2VkID0gdHJ1ZTtcbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9O1xuICAgIHJldHVybiBVcGRhdGVNYXJrZXI7XG59KSgpO1xubW9kdWxlLmV4cG9ydHMgPSBVcGRhdGVNYXJrZXI7XG4iLCJ2YXIgVXRpbHMgPSAoZnVuY3Rpb24gKCkge1xuICAgIGZ1bmN0aW9uIFV0aWxzKCkge1xuICAgIH1cbiAgICBVdGlscy5jbG9uZSA9IGZ1bmN0aW9uIChvLCBleGNlcHRpb25LZXlzKSB7XG4gICAgICAgIHZhciBvdXQsIHYsIGtleTtcbiAgICAgICAgb3V0ID0gQXJyYXkuaXNBcnJheShvKSA/IFtdIDoge307XG4gICAgICAgIGZvciAoa2V5IGluIG8pIHtcbiAgICAgICAgICAgIGlmIChvLmhhc093blByb3BlcnR5KGtleSkpIHtcbiAgICAgICAgICAgICAgICBpZiAoIWV4Y2VwdGlvbktleXMgfHwgKGV4Y2VwdGlvbktleXMgJiYgZXhjZXB0aW9uS2V5cy5pbmRleE9mKGtleSkgPT09IC0xKSkge1xuICAgICAgICAgICAgICAgICAgICB2ID0gb1trZXldO1xuICAgICAgICAgICAgICAgICAgICBvdXRba2V5XSA9ICh0eXBlb2YgdiA9PT0gJ29iamVjdCcpID8gdGhpcy5jbG9uZSh2KSA6IHY7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBvdXQ7XG4gICAgfTtcbiAgICBVdGlscy5jcmVhdGVVaWQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiAneHh4eHh4eHh4eHh4NHh4eHl4eHh4eHh4eHh4eHh4eHgnLnJlcGxhY2UoL1t4eV0vZywgZnVuY3Rpb24gKGMpIHtcbiAgICAgICAgICAgIHZhciByLCB2O1xuICAgICAgICAgICAgciA9IE1hdGgucmFuZG9tKCkgKiAxNiB8IDA7XG4gICAgICAgICAgICB2ID0gYyA9PT0gJ3gnID8gciA6IHIgJiAweDMgfCAweDg7XG4gICAgICAgICAgICByZXR1cm4gdi50b1N0cmluZygxNik7XG4gICAgICAgIH0pO1xuICAgIH07XG4gICAgVXRpbHMucHJlcGFyZU9wdGlvbnMgPSBmdW5jdGlvbiAob3B0aW9ucywgY3VzdG9tKSB7XG4gICAgICAgIHZhciByZXN1bHQgPSB7IGN1c3RvbToge30sIGRlZmF1bHRzOiB7fSB9LCBvcHRpb247XG4gICAgICAgIGZvciAob3B0aW9uIGluIG9wdGlvbnMpIHtcbiAgICAgICAgICAgIGlmIChvcHRpb25zLmhhc093blByb3BlcnR5KG9wdGlvbikpIHtcbiAgICAgICAgICAgICAgICBpZiAoY3VzdG9tLmluZGV4T2Yob3B0aW9uKSA+IC0xKSB7XG4gICAgICAgICAgICAgICAgICAgIHJlc3VsdC5jdXN0b20gPSByZXN1bHQuY3VzdG9tIHx8IHt9O1xuICAgICAgICAgICAgICAgICAgICByZXN1bHQuY3VzdG9tW29wdGlvbl0gPSBvcHRpb25zW29wdGlvbl07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICByZXN1bHQuZGVmYXVsdHMgPSByZXN1bHQuZGVmYXVsdHMgfHwge307XG4gICAgICAgICAgICAgICAgICAgIHJlc3VsdC5kZWZhdWx0c1tvcHRpb25dID0gb3B0aW9uc1tvcHRpb25dO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH07XG4gICAgVXRpbHMuaXNBcnJheSA9IGZ1bmN0aW9uIChhcmcpIHtcbiAgICAgICAgcmV0dXJuIE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbChhcmcpID09PSAnW29iamVjdCBBcnJheV0nO1xuICAgIH07XG4gICAgVXRpbHMudG9BcnJheSA9IGZ1bmN0aW9uIChvYmopIHtcbiAgICAgICAgcmV0dXJuIE9iamVjdC5rZXlzKG9iaikubWFwKGZ1bmN0aW9uIChrZXkpIHtcbiAgICAgICAgICAgIHJldHVybiBvYmpba2V5XTtcbiAgICAgICAgfSk7XG4gICAgfTtcbiAgICBVdGlscy5kZWZhdWx0RGltZW5zaW9uID0gZnVuY3Rpb24gKGl0ZW0pIHtcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uIChkKSB7XG4gICAgICAgICAgICBpZiAodHlwZW9mIGQuZGF0YVtpdGVtXSA9PT0gJ3VuZGVmaW5lZCcgJiYgdHlwZW9mIGRbaXRlbV0gIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGRbaXRlbV07XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAodHlwZW9mIGQuZGF0YVtpdGVtXSA9PT0gJ3VuZGVmaW5lZCcgJiYgdHlwZW9mIGRbaXRlbV0gPT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gZC5kYXRhW2l0ZW1dO1xuICAgICAgICB9O1xuICAgIH07XG4gICAgLy8gY29tcGFyZXMgdHdvIGxpc3RzIGFuZCByZXR1cm5zIHRoZSBjb21tb24gaXRlbXNcbiAgICBVdGlscy5nZXRDb21tb25PYmplY3QgPSBmdW5jdGlvbiAobGlzdDEsIGxpc3QyKSB7XG4gICAgICAgIHZhciByZXN1bHQgPSB7fTtcbiAgICAgICAgZm9yICh2YXIgdWlkIGluIGxpc3QxKSB7XG4gICAgICAgICAgICBpZiAobGlzdDEuaGFzT3duUHJvcGVydHkodWlkKSkge1xuICAgICAgICAgICAgICAgIHZhciBtYXRjaCA9IGxpc3QyW3VpZF07XG4gICAgICAgICAgICAgICAgaWYgKHR5cGVvZiBtYXRjaCAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgICAgICAgICAgcmVzdWx0W3VpZF0gPSBtYXRjaDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9O1xuICAgIHJldHVybiBVdGlscztcbn0pKCk7XG5tb2R1bGUuZXhwb3J0cyA9IFV0aWxzO1xuIiwiKGZ1bmN0aW9uKGV4cG9ydHMpe1xuY3Jvc3NmaWx0ZXIudmVyc2lvbiA9IFwiMS4zLjEyXCI7XG5mdW5jdGlvbiBjcm9zc2ZpbHRlcl9pZGVudGl0eShkKSB7XG4gIHJldHVybiBkO1xufVxuY3Jvc3NmaWx0ZXIucGVybXV0ZSA9IHBlcm11dGU7XG5cbmZ1bmN0aW9uIHBlcm11dGUoYXJyYXksIGluZGV4KSB7XG4gIGZvciAodmFyIGkgPSAwLCBuID0gaW5kZXgubGVuZ3RoLCBjb3B5ID0gbmV3IEFycmF5KG4pOyBpIDwgbjsgKytpKSB7XG4gICAgY29weVtpXSA9IGFycmF5W2luZGV4W2ldXTtcbiAgfVxuICByZXR1cm4gY29weTtcbn1cbnZhciBiaXNlY3QgPSBjcm9zc2ZpbHRlci5iaXNlY3QgPSBiaXNlY3RfYnkoY3Jvc3NmaWx0ZXJfaWRlbnRpdHkpO1xuXG5iaXNlY3QuYnkgPSBiaXNlY3RfYnk7XG5cbmZ1bmN0aW9uIGJpc2VjdF9ieShmKSB7XG5cbiAgLy8gTG9jYXRlIHRoZSBpbnNlcnRpb24gcG9pbnQgZm9yIHggaW4gYSB0byBtYWludGFpbiBzb3J0ZWQgb3JkZXIuIFRoZVxuICAvLyBhcmd1bWVudHMgbG8gYW5kIGhpIG1heSBiZSB1c2VkIHRvIHNwZWNpZnkgYSBzdWJzZXQgb2YgdGhlIGFycmF5IHdoaWNoXG4gIC8vIHNob3VsZCBiZSBjb25zaWRlcmVkOyBieSBkZWZhdWx0IHRoZSBlbnRpcmUgYXJyYXkgaXMgdXNlZC4gSWYgeCBpcyBhbHJlYWR5XG4gIC8vIHByZXNlbnQgaW4gYSwgdGhlIGluc2VydGlvbiBwb2ludCB3aWxsIGJlIGJlZm9yZSAodG8gdGhlIGxlZnQgb2YpIGFueVxuICAvLyBleGlzdGluZyBlbnRyaWVzLiBUaGUgcmV0dXJuIHZhbHVlIGlzIHN1aXRhYmxlIGZvciB1c2UgYXMgdGhlIGZpcnN0XG4gIC8vIGFyZ3VtZW50IHRvIGBhcnJheS5zcGxpY2VgIGFzc3VtaW5nIHRoYXQgYSBpcyBhbHJlYWR5IHNvcnRlZC5cbiAgLy9cbiAgLy8gVGhlIHJldHVybmVkIGluc2VydGlvbiBwb2ludCBpIHBhcnRpdGlvbnMgdGhlIGFycmF5IGEgaW50byB0d28gaGFsdmVzIHNvXG4gIC8vIHRoYXQgYWxsIHYgPCB4IGZvciB2IGluIGFbbG86aV0gZm9yIHRoZSBsZWZ0IHNpZGUgYW5kIGFsbCB2ID49IHggZm9yIHYgaW5cbiAgLy8gYVtpOmhpXSBmb3IgdGhlIHJpZ2h0IHNpZGUuXG4gIGZ1bmN0aW9uIGJpc2VjdExlZnQoYSwgeCwgbG8sIGhpKSB7XG4gICAgd2hpbGUgKGxvIDwgaGkpIHtcbiAgICAgIHZhciBtaWQgPSBsbyArIGhpID4+PiAxO1xuICAgICAgaWYgKGYoYVttaWRdKSA8IHgpIGxvID0gbWlkICsgMTtcbiAgICAgIGVsc2UgaGkgPSBtaWQ7XG4gICAgfVxuICAgIHJldHVybiBsbztcbiAgfVxuXG4gIC8vIFNpbWlsYXIgdG8gYmlzZWN0TGVmdCwgYnV0IHJldHVybnMgYW4gaW5zZXJ0aW9uIHBvaW50IHdoaWNoIGNvbWVzIGFmdGVyICh0b1xuICAvLyB0aGUgcmlnaHQgb2YpIGFueSBleGlzdGluZyBlbnRyaWVzIG9mIHggaW4gYS5cbiAgLy9cbiAgLy8gVGhlIHJldHVybmVkIGluc2VydGlvbiBwb2ludCBpIHBhcnRpdGlvbnMgdGhlIGFycmF5IGludG8gdHdvIGhhbHZlcyBzbyB0aGF0XG4gIC8vIGFsbCB2IDw9IHggZm9yIHYgaW4gYVtsbzppXSBmb3IgdGhlIGxlZnQgc2lkZSBhbmQgYWxsIHYgPiB4IGZvciB2IGluXG4gIC8vIGFbaTpoaV0gZm9yIHRoZSByaWdodCBzaWRlLlxuICBmdW5jdGlvbiBiaXNlY3RSaWdodChhLCB4LCBsbywgaGkpIHtcbiAgICB3aGlsZSAobG8gPCBoaSkge1xuICAgICAgdmFyIG1pZCA9IGxvICsgaGkgPj4+IDE7XG4gICAgICBpZiAoeCA8IGYoYVttaWRdKSkgaGkgPSBtaWQ7XG4gICAgICBlbHNlIGxvID0gbWlkICsgMTtcbiAgICB9XG4gICAgcmV0dXJuIGxvO1xuICB9XG5cbiAgYmlzZWN0UmlnaHQucmlnaHQgPSBiaXNlY3RSaWdodDtcbiAgYmlzZWN0UmlnaHQubGVmdCA9IGJpc2VjdExlZnQ7XG4gIHJldHVybiBiaXNlY3RSaWdodDtcbn1cbnZhciBoZWFwID0gY3Jvc3NmaWx0ZXIuaGVhcCA9IGhlYXBfYnkoY3Jvc3NmaWx0ZXJfaWRlbnRpdHkpO1xuXG5oZWFwLmJ5ID0gaGVhcF9ieTtcblxuZnVuY3Rpb24gaGVhcF9ieShmKSB7XG5cbiAgLy8gQnVpbGRzIGEgYmluYXJ5IGhlYXAgd2l0aGluIHRoZSBzcGVjaWZpZWQgYXJyYXkgYVtsbzpoaV0uIFRoZSBoZWFwIGhhcyB0aGVcbiAgLy8gcHJvcGVydHkgc3VjaCB0aGF0IHRoZSBwYXJlbnQgYVtsbytpXSBpcyBhbHdheXMgbGVzcyB0aGFuIG9yIGVxdWFsIHRvIGl0c1xuICAvLyB0d28gY2hpbGRyZW46IGFbbG8rMippKzFdIGFuZCBhW2xvKzIqaSsyXS5cbiAgZnVuY3Rpb24gaGVhcChhLCBsbywgaGkpIHtcbiAgICB2YXIgbiA9IGhpIC0gbG8sXG4gICAgICAgIGkgPSAobiA+Pj4gMSkgKyAxO1xuICAgIHdoaWxlICgtLWkgPiAwKSBzaWZ0KGEsIGksIG4sIGxvKTtcbiAgICByZXR1cm4gYTtcbiAgfVxuXG4gIC8vIFNvcnRzIHRoZSBzcGVjaWZpZWQgYXJyYXkgYVtsbzpoaV0gaW4gZGVzY2VuZGluZyBvcmRlciwgYXNzdW1pbmcgaXQgaXNcbiAgLy8gYWxyZWFkeSBhIGhlYXAuXG4gIGZ1bmN0aW9uIHNvcnQoYSwgbG8sIGhpKSB7XG4gICAgdmFyIG4gPSBoaSAtIGxvLFxuICAgICAgICB0O1xuICAgIHdoaWxlICgtLW4gPiAwKSB0ID0gYVtsb10sIGFbbG9dID0gYVtsbyArIG5dLCBhW2xvICsgbl0gPSB0LCBzaWZ0KGEsIDEsIG4sIGxvKTtcbiAgICByZXR1cm4gYTtcbiAgfVxuXG4gIC8vIFNpZnRzIHRoZSBlbGVtZW50IGFbbG8raS0xXSBkb3duIHRoZSBoZWFwLCB3aGVyZSB0aGUgaGVhcCBpcyB0aGUgY29udGlndW91c1xuICAvLyBzbGljZSBvZiBhcnJheSBhW2xvOmxvK25dLiBUaGlzIG1ldGhvZCBjYW4gYWxzbyBiZSB1c2VkIHRvIHVwZGF0ZSB0aGUgaGVhcFxuICAvLyBpbmNyZW1lbnRhbGx5LCB3aXRob3V0IGluY3VycmluZyB0aGUgZnVsbCBjb3N0IG9mIHJlY29uc3RydWN0aW5nIHRoZSBoZWFwLlxuICBmdW5jdGlvbiBzaWZ0KGEsIGksIG4sIGxvKSB7XG4gICAgdmFyIGQgPSBhWy0tbG8gKyBpXSxcbiAgICAgICAgeCA9IGYoZCksXG4gICAgICAgIGNoaWxkO1xuICAgIHdoaWxlICgoY2hpbGQgPSBpIDw8IDEpIDw9IG4pIHtcbiAgICAgIGlmIChjaGlsZCA8IG4gJiYgZihhW2xvICsgY2hpbGRdKSA+IGYoYVtsbyArIGNoaWxkICsgMV0pKSBjaGlsZCsrO1xuICAgICAgaWYgKHggPD0gZihhW2xvICsgY2hpbGRdKSkgYnJlYWs7XG4gICAgICBhW2xvICsgaV0gPSBhW2xvICsgY2hpbGRdO1xuICAgICAgaSA9IGNoaWxkO1xuICAgIH1cbiAgICBhW2xvICsgaV0gPSBkO1xuICB9XG5cbiAgaGVhcC5zb3J0ID0gc29ydDtcbiAgcmV0dXJuIGhlYXA7XG59XG52YXIgaGVhcHNlbGVjdCA9IGNyb3NzZmlsdGVyLmhlYXBzZWxlY3QgPSBoZWFwc2VsZWN0X2J5KGNyb3NzZmlsdGVyX2lkZW50aXR5KTtcblxuaGVhcHNlbGVjdC5ieSA9IGhlYXBzZWxlY3RfYnk7XG5cbmZ1bmN0aW9uIGhlYXBzZWxlY3RfYnkoZikge1xuICB2YXIgaGVhcCA9IGhlYXBfYnkoZik7XG5cbiAgLy8gUmV0dXJucyBhIG5ldyBhcnJheSBjb250YWluaW5nIHRoZSB0b3AgayBlbGVtZW50cyBpbiB0aGUgYXJyYXkgYVtsbzpoaV0uXG4gIC8vIFRoZSByZXR1cm5lZCBhcnJheSBpcyBub3Qgc29ydGVkLCBidXQgbWFpbnRhaW5zIHRoZSBoZWFwIHByb3BlcnR5LiBJZiBrIGlzXG4gIC8vIGdyZWF0ZXIgdGhhbiBoaSAtIGxvLCB0aGVuIGZld2VyIHRoYW4gayBlbGVtZW50cyB3aWxsIGJlIHJldHVybmVkLiBUaGVcbiAgLy8gb3JkZXIgb2YgZWxlbWVudHMgaW4gYSBpcyB1bmNoYW5nZWQgYnkgdGhpcyBvcGVyYXRpb24uXG4gIGZ1bmN0aW9uIGhlYXBzZWxlY3QoYSwgbG8sIGhpLCBrKSB7XG4gICAgdmFyIHF1ZXVlID0gbmV3IEFycmF5KGsgPSBNYXRoLm1pbihoaSAtIGxvLCBrKSksXG4gICAgICAgIG1pbixcbiAgICAgICAgaSxcbiAgICAgICAgeCxcbiAgICAgICAgZDtcblxuICAgIGZvciAoaSA9IDA7IGkgPCBrOyArK2kpIHF1ZXVlW2ldID0gYVtsbysrXTtcbiAgICBoZWFwKHF1ZXVlLCAwLCBrKTtcblxuICAgIGlmIChsbyA8IGhpKSB7XG4gICAgICBtaW4gPSBmKHF1ZXVlWzBdKTtcbiAgICAgIGRvIHtcbiAgICAgICAgaWYgKHggPSBmKGQgPSBhW2xvXSkgPiBtaW4pIHtcbiAgICAgICAgICBxdWV1ZVswXSA9IGQ7XG4gICAgICAgICAgbWluID0gZihoZWFwKHF1ZXVlLCAwLCBrKVswXSk7XG4gICAgICAgIH1cbiAgICAgIH0gd2hpbGUgKCsrbG8gPCBoaSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHF1ZXVlO1xuICB9XG5cbiAgcmV0dXJuIGhlYXBzZWxlY3Q7XG59XG52YXIgaW5zZXJ0aW9uc29ydCA9IGNyb3NzZmlsdGVyLmluc2VydGlvbnNvcnQgPSBpbnNlcnRpb25zb3J0X2J5KGNyb3NzZmlsdGVyX2lkZW50aXR5KTtcblxuaW5zZXJ0aW9uc29ydC5ieSA9IGluc2VydGlvbnNvcnRfYnk7XG5cbmZ1bmN0aW9uIGluc2VydGlvbnNvcnRfYnkoZikge1xuXG4gIGZ1bmN0aW9uIGluc2VydGlvbnNvcnQoYSwgbG8sIGhpKSB7XG4gICAgZm9yICh2YXIgaSA9IGxvICsgMTsgaSA8IGhpOyArK2kpIHtcbiAgICAgIGZvciAodmFyIGogPSBpLCB0ID0gYVtpXSwgeCA9IGYodCk7IGogPiBsbyAmJiBmKGFbaiAtIDFdKSA+IHg7IC0taikge1xuICAgICAgICBhW2pdID0gYVtqIC0gMV07XG4gICAgICB9XG4gICAgICBhW2pdID0gdDtcbiAgICB9XG4gICAgcmV0dXJuIGE7XG4gIH1cblxuICByZXR1cm4gaW5zZXJ0aW9uc29ydDtcbn1cbi8vIEFsZ29yaXRobSBkZXNpZ25lZCBieSBWbGFkaW1pciBZYXJvc2xhdnNraXkuXG4vLyBJbXBsZW1lbnRhdGlvbiBiYXNlZCBvbiB0aGUgRGFydCBwcm9qZWN0OyBzZWUgbGliL2RhcnQvTElDRU5TRSBmb3IgZGV0YWlscy5cblxudmFyIHF1aWNrc29ydCA9IGNyb3NzZmlsdGVyLnF1aWNrc29ydCA9IHF1aWNrc29ydF9ieShjcm9zc2ZpbHRlcl9pZGVudGl0eSk7XG5cbnF1aWNrc29ydC5ieSA9IHF1aWNrc29ydF9ieTtcblxuZnVuY3Rpb24gcXVpY2tzb3J0X2J5KGYpIHtcbiAgdmFyIGluc2VydGlvbnNvcnQgPSBpbnNlcnRpb25zb3J0X2J5KGYpO1xuXG4gIGZ1bmN0aW9uIHNvcnQoYSwgbG8sIGhpKSB7XG4gICAgcmV0dXJuIChoaSAtIGxvIDwgcXVpY2tzb3J0X3NpemVUaHJlc2hvbGRcbiAgICAgICAgPyBpbnNlcnRpb25zb3J0XG4gICAgICAgIDogcXVpY2tzb3J0KShhLCBsbywgaGkpO1xuICB9XG5cbiAgZnVuY3Rpb24gcXVpY2tzb3J0KGEsIGxvLCBoaSkge1xuICAgIC8vIENvbXB1dGUgdGhlIHR3byBwaXZvdHMgYnkgbG9va2luZyBhdCA1IGVsZW1lbnRzLlxuICAgIHZhciBzaXh0aCA9IChoaSAtIGxvKSAvIDYgfCAwLFxuICAgICAgICBpMSA9IGxvICsgc2l4dGgsXG4gICAgICAgIGk1ID0gaGkgLSAxIC0gc2l4dGgsXG4gICAgICAgIGkzID0gbG8gKyBoaSAtIDEgPj4gMSwgIC8vIFRoZSBtaWRwb2ludC5cbiAgICAgICAgaTIgPSBpMyAtIHNpeHRoLFxuICAgICAgICBpNCA9IGkzICsgc2l4dGg7XG5cbiAgICB2YXIgZTEgPSBhW2kxXSwgeDEgPSBmKGUxKSxcbiAgICAgICAgZTIgPSBhW2kyXSwgeDIgPSBmKGUyKSxcbiAgICAgICAgZTMgPSBhW2kzXSwgeDMgPSBmKGUzKSxcbiAgICAgICAgZTQgPSBhW2k0XSwgeDQgPSBmKGU0KSxcbiAgICAgICAgZTUgPSBhW2k1XSwgeDUgPSBmKGU1KTtcblxuICAgIHZhciB0O1xuXG4gICAgLy8gU29ydCB0aGUgc2VsZWN0ZWQgNSBlbGVtZW50cyB1c2luZyBhIHNvcnRpbmcgbmV0d29yay5cbiAgICBpZiAoeDEgPiB4MikgdCA9IGUxLCBlMSA9IGUyLCBlMiA9IHQsIHQgPSB4MSwgeDEgPSB4MiwgeDIgPSB0O1xuICAgIGlmICh4NCA+IHg1KSB0ID0gZTQsIGU0ID0gZTUsIGU1ID0gdCwgdCA9IHg0LCB4NCA9IHg1LCB4NSA9IHQ7XG4gICAgaWYgKHgxID4geDMpIHQgPSBlMSwgZTEgPSBlMywgZTMgPSB0LCB0ID0geDEsIHgxID0geDMsIHgzID0gdDtcbiAgICBpZiAoeDIgPiB4MykgdCA9IGUyLCBlMiA9IGUzLCBlMyA9IHQsIHQgPSB4MiwgeDIgPSB4MywgeDMgPSB0O1xuICAgIGlmICh4MSA+IHg0KSB0ID0gZTEsIGUxID0gZTQsIGU0ID0gdCwgdCA9IHgxLCB4MSA9IHg0LCB4NCA9IHQ7XG4gICAgaWYgKHgzID4geDQpIHQgPSBlMywgZTMgPSBlNCwgZTQgPSB0LCB0ID0geDMsIHgzID0geDQsIHg0ID0gdDtcbiAgICBpZiAoeDIgPiB4NSkgdCA9IGUyLCBlMiA9IGU1LCBlNSA9IHQsIHQgPSB4MiwgeDIgPSB4NSwgeDUgPSB0O1xuICAgIGlmICh4MiA+IHgzKSB0ID0gZTIsIGUyID0gZTMsIGUzID0gdCwgdCA9IHgyLCB4MiA9IHgzLCB4MyA9IHQ7XG4gICAgaWYgKHg0ID4geDUpIHQgPSBlNCwgZTQgPSBlNSwgZTUgPSB0LCB0ID0geDQsIHg0ID0geDUsIHg1ID0gdDtcblxuICAgIHZhciBwaXZvdDEgPSBlMiwgcGl2b3RWYWx1ZTEgPSB4MixcbiAgICAgICAgcGl2b3QyID0gZTQsIHBpdm90VmFsdWUyID0geDQ7XG5cbiAgICAvLyBlMiBhbmQgZTQgaGF2ZSBiZWVuIHNhdmVkIGluIHRoZSBwaXZvdCB2YXJpYWJsZXMuIFRoZXkgd2lsbCBiZSB3cml0dGVuXG4gICAgLy8gYmFjaywgb25jZSB0aGUgcGFydGl0aW9uaW5nIGlzIGZpbmlzaGVkLlxuICAgIGFbaTFdID0gZTE7XG4gICAgYVtpMl0gPSBhW2xvXTtcbiAgICBhW2kzXSA9IGUzO1xuICAgIGFbaTRdID0gYVtoaSAtIDFdO1xuICAgIGFbaTVdID0gZTU7XG5cbiAgICB2YXIgbGVzcyA9IGxvICsgMSwgICAvLyBGaXJzdCBlbGVtZW50IGluIHRoZSBtaWRkbGUgcGFydGl0aW9uLlxuICAgICAgICBncmVhdCA9IGhpIC0gMjsgIC8vIExhc3QgZWxlbWVudCBpbiB0aGUgbWlkZGxlIHBhcnRpdGlvbi5cblxuICAgIC8vIE5vdGUgdGhhdCBmb3IgdmFsdWUgY29tcGFyaXNvbiwgPCwgPD0sID49IGFuZCA+IGNvZXJjZSB0byBhIHByaW1pdGl2ZSB2aWFcbiAgICAvLyBPYmplY3QucHJvdG90eXBlLnZhbHVlT2Y7ID09IGFuZCA9PT0gZG8gbm90LCBzbyBpbiBvcmRlciB0byBiZSBjb25zaXN0ZW50XG4gICAgLy8gd2l0aCBuYXR1cmFsIG9yZGVyIChzdWNoIGFzIGZvciBEYXRlIG9iamVjdHMpLCB3ZSBtdXN0IGRvIHR3byBjb21wYXJlcy5cbiAgICB2YXIgcGl2b3RzRXF1YWwgPSBwaXZvdFZhbHVlMSA8PSBwaXZvdFZhbHVlMiAmJiBwaXZvdFZhbHVlMSA+PSBwaXZvdFZhbHVlMjtcbiAgICBpZiAocGl2b3RzRXF1YWwpIHtcblxuICAgICAgLy8gRGVnZW5lcmF0ZWQgY2FzZSB3aGVyZSB0aGUgcGFydGl0aW9uaW5nIGJlY29tZXMgYSBkdXRjaCBuYXRpb25hbCBmbGFnXG4gICAgICAvLyBwcm9ibGVtLlxuICAgICAgLy9cbiAgICAgIC8vIFsgfCAgPCBwaXZvdCAgfCA9PSBwaXZvdCB8IHVucGFydGl0aW9uZWQgfCA+IHBpdm90ICB8IF1cbiAgICAgIC8vICBeICAgICAgICAgICAgIF4gICAgICAgICAgXiAgICAgICAgICAgICBeICAgICAgICAgICAgXlxuICAgICAgLy8gbGVmdCAgICAgICAgIGxlc3MgICAgICAgICBrICAgICAgICAgICBncmVhdCAgICAgICAgIHJpZ2h0XG4gICAgICAvL1xuICAgICAgLy8gYVtsZWZ0XSBhbmQgYVtyaWdodF0gYXJlIHVuZGVmaW5lZCBhbmQgYXJlIGZpbGxlZCBhZnRlciB0aGVcbiAgICAgIC8vIHBhcnRpdGlvbmluZy5cbiAgICAgIC8vXG4gICAgICAvLyBJbnZhcmlhbnRzOlxuICAgICAgLy8gICAxKSBmb3IgeCBpbiBdbGVmdCwgbGVzc1sgOiB4IDwgcGl2b3QuXG4gICAgICAvLyAgIDIpIGZvciB4IGluIFtsZXNzLCBrWyA6IHggPT0gcGl2b3QuXG4gICAgICAvLyAgIDMpIGZvciB4IGluIF1ncmVhdCwgcmlnaHRbIDogeCA+IHBpdm90LlxuICAgICAgZm9yICh2YXIgayA9IGxlc3M7IGsgPD0gZ3JlYXQ7ICsraykge1xuICAgICAgICB2YXIgZWsgPSBhW2tdLCB4ayA9IGYoZWspO1xuICAgICAgICBpZiAoeGsgPCBwaXZvdFZhbHVlMSkge1xuICAgICAgICAgIGlmIChrICE9PSBsZXNzKSB7XG4gICAgICAgICAgICBhW2tdID0gYVtsZXNzXTtcbiAgICAgICAgICAgIGFbbGVzc10gPSBlaztcbiAgICAgICAgICB9XG4gICAgICAgICAgKytsZXNzO1xuICAgICAgICB9IGVsc2UgaWYgKHhrID4gcGl2b3RWYWx1ZTEpIHtcblxuICAgICAgICAgIC8vIEZpbmQgdGhlIGZpcnN0IGVsZW1lbnQgPD0gcGl2b3QgaW4gdGhlIHJhbmdlIFtrIC0gMSwgZ3JlYXRdIGFuZFxuICAgICAgICAgIC8vIHB1dCBbOmVrOl0gdGhlcmUuIFdlIGtub3cgdGhhdCBzdWNoIGFuIGVsZW1lbnQgbXVzdCBleGlzdDpcbiAgICAgICAgICAvLyBXaGVuIGsgPT0gbGVzcywgdGhlbiBlbDMgKHdoaWNoIGlzIGVxdWFsIHRvIHBpdm90KSBsaWVzIGluIHRoZVxuICAgICAgICAgIC8vIGludGVydmFsLiBPdGhlcndpc2UgYVtrIC0gMV0gPT0gcGl2b3QgYW5kIHRoZSBzZWFyY2ggc3RvcHMgYXQgay0xLlxuICAgICAgICAgIC8vIE5vdGUgdGhhdCBpbiB0aGUgbGF0dGVyIGNhc2UgaW52YXJpYW50IDIgd2lsbCBiZSB2aW9sYXRlZCBmb3IgYVxuICAgICAgICAgIC8vIHNob3J0IGFtb3VudCBvZiB0aW1lLiBUaGUgaW52YXJpYW50IHdpbGwgYmUgcmVzdG9yZWQgd2hlbiB0aGVcbiAgICAgICAgICAvLyBwaXZvdHMgYXJlIHB1dCBpbnRvIHRoZWlyIGZpbmFsIHBvc2l0aW9ucy5cbiAgICAgICAgICB3aGlsZSAodHJ1ZSkge1xuICAgICAgICAgICAgdmFyIGdyZWF0VmFsdWUgPSBmKGFbZ3JlYXRdKTtcbiAgICAgICAgICAgIGlmIChncmVhdFZhbHVlID4gcGl2b3RWYWx1ZTEpIHtcbiAgICAgICAgICAgICAgZ3JlYXQtLTtcbiAgICAgICAgICAgICAgLy8gVGhpcyBpcyB0aGUgb25seSBsb2NhdGlvbiBpbiB0aGUgd2hpbGUtbG9vcCB3aGVyZSBhIG5ld1xuICAgICAgICAgICAgICAvLyBpdGVyYXRpb24gaXMgc3RhcnRlZC5cbiAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKGdyZWF0VmFsdWUgPCBwaXZvdFZhbHVlMSkge1xuICAgICAgICAgICAgICAvLyBUcmlwbGUgZXhjaGFuZ2UuXG4gICAgICAgICAgICAgIGFba10gPSBhW2xlc3NdO1xuICAgICAgICAgICAgICBhW2xlc3MrK10gPSBhW2dyZWF0XTtcbiAgICAgICAgICAgICAgYVtncmVhdC0tXSA9IGVrO1xuICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIGFba10gPSBhW2dyZWF0XTtcbiAgICAgICAgICAgICAgYVtncmVhdC0tXSA9IGVrO1xuICAgICAgICAgICAgICAvLyBOb3RlOiBpZiBncmVhdCA8IGsgdGhlbiB3ZSB3aWxsIGV4aXQgdGhlIG91dGVyIGxvb3AgYW5kIGZpeFxuICAgICAgICAgICAgICAvLyBpbnZhcmlhbnQgMiAod2hpY2ggd2UganVzdCB2aW9sYXRlZCkuXG4gICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0gZWxzZSB7XG5cbiAgICAgIC8vIFdlIHBhcnRpdGlvbiB0aGUgbGlzdCBpbnRvIHRocmVlIHBhcnRzOlxuICAgICAgLy8gIDEuIDwgcGl2b3QxXG4gICAgICAvLyAgMi4gPj0gcGl2b3QxICYmIDw9IHBpdm90MlxuICAgICAgLy8gIDMuID4gcGl2b3QyXG4gICAgICAvL1xuICAgICAgLy8gRHVyaW5nIHRoZSBsb29wIHdlIGhhdmU6XG4gICAgICAvLyBbIHwgPCBwaXZvdDEgfCA+PSBwaXZvdDEgJiYgPD0gcGl2b3QyIHwgdW5wYXJ0aXRpb25lZCAgfCA+IHBpdm90MiAgfCBdXG4gICAgICAvLyAgXiAgICAgICAgICAgIF4gICAgICAgICAgICAgICAgICAgICAgICBeICAgICAgICAgICAgICBeICAgICAgICAgICAgIF5cbiAgICAgIC8vIGxlZnQgICAgICAgICBsZXNzICAgICAgICAgICAgICAgICAgICAgayAgICAgICAgICAgICAgZ3JlYXQgICAgICAgIHJpZ2h0XG4gICAgICAvL1xuICAgICAgLy8gYVtsZWZ0XSBhbmQgYVtyaWdodF0gYXJlIHVuZGVmaW5lZCBhbmQgYXJlIGZpbGxlZCBhZnRlciB0aGVcbiAgICAgIC8vIHBhcnRpdGlvbmluZy5cbiAgICAgIC8vXG4gICAgICAvLyBJbnZhcmlhbnRzOlxuICAgICAgLy8gICAxLiBmb3IgeCBpbiBdbGVmdCwgbGVzc1sgOiB4IDwgcGl2b3QxXG4gICAgICAvLyAgIDIuIGZvciB4IGluIFtsZXNzLCBrWyA6IHBpdm90MSA8PSB4ICYmIHggPD0gcGl2b3QyXG4gICAgICAvLyAgIDMuIGZvciB4IGluIF1ncmVhdCwgcmlnaHRbIDogeCA+IHBpdm90MlxuICAgICAgZm9yICh2YXIgayA9IGxlc3M7IGsgPD0gZ3JlYXQ7IGsrKykge1xuICAgICAgICB2YXIgZWsgPSBhW2tdLCB4ayA9IGYoZWspO1xuICAgICAgICBpZiAoeGsgPCBwaXZvdFZhbHVlMSkge1xuICAgICAgICAgIGlmIChrICE9PSBsZXNzKSB7XG4gICAgICAgICAgICBhW2tdID0gYVtsZXNzXTtcbiAgICAgICAgICAgIGFbbGVzc10gPSBlaztcbiAgICAgICAgICB9XG4gICAgICAgICAgKytsZXNzO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGlmICh4ayA+IHBpdm90VmFsdWUyKSB7XG4gICAgICAgICAgICB3aGlsZSAodHJ1ZSkge1xuICAgICAgICAgICAgICB2YXIgZ3JlYXRWYWx1ZSA9IGYoYVtncmVhdF0pO1xuICAgICAgICAgICAgICBpZiAoZ3JlYXRWYWx1ZSA+IHBpdm90VmFsdWUyKSB7XG4gICAgICAgICAgICAgICAgZ3JlYXQtLTtcbiAgICAgICAgICAgICAgICBpZiAoZ3JlYXQgPCBrKSBicmVhaztcbiAgICAgICAgICAgICAgICAvLyBUaGlzIGlzIHRoZSBvbmx5IGxvY2F0aW9uIGluc2lkZSB0aGUgbG9vcCB3aGVyZSBhIG5ld1xuICAgICAgICAgICAgICAgIC8vIGl0ZXJhdGlvbiBpcyBzdGFydGVkLlxuICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIC8vIGFbZ3JlYXRdIDw9IHBpdm90Mi5cbiAgICAgICAgICAgICAgICBpZiAoZ3JlYXRWYWx1ZSA8IHBpdm90VmFsdWUxKSB7XG4gICAgICAgICAgICAgICAgICAvLyBUcmlwbGUgZXhjaGFuZ2UuXG4gICAgICAgICAgICAgICAgICBhW2tdID0gYVtsZXNzXTtcbiAgICAgICAgICAgICAgICAgIGFbbGVzcysrXSA9IGFbZ3JlYXRdO1xuICAgICAgICAgICAgICAgICAgYVtncmVhdC0tXSA9IGVrO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAvLyBhW2dyZWF0XSA+PSBwaXZvdDEuXG4gICAgICAgICAgICAgICAgICBhW2tdID0gYVtncmVhdF07XG4gICAgICAgICAgICAgICAgICBhW2dyZWF0LS1dID0gZWs7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gTW92ZSBwaXZvdHMgaW50byB0aGVpciBmaW5hbCBwb3NpdGlvbnMuXG4gICAgLy8gV2Ugc2hydW5rIHRoZSBsaXN0IGZyb20gYm90aCBzaWRlcyAoYVtsZWZ0XSBhbmQgYVtyaWdodF0gaGF2ZVxuICAgIC8vIG1lYW5pbmdsZXNzIHZhbHVlcyBpbiB0aGVtKSBhbmQgbm93IHdlIG1vdmUgZWxlbWVudHMgZnJvbSB0aGUgZmlyc3RcbiAgICAvLyBhbmQgdGhpcmQgcGFydGl0aW9uIGludG8gdGhlc2UgbG9jYXRpb25zIHNvIHRoYXQgd2UgY2FuIHN0b3JlIHRoZVxuICAgIC8vIHBpdm90cy5cbiAgICBhW2xvXSA9IGFbbGVzcyAtIDFdO1xuICAgIGFbbGVzcyAtIDFdID0gcGl2b3QxO1xuICAgIGFbaGkgLSAxXSA9IGFbZ3JlYXQgKyAxXTtcbiAgICBhW2dyZWF0ICsgMV0gPSBwaXZvdDI7XG5cbiAgICAvLyBUaGUgbGlzdCBpcyBub3cgcGFydGl0aW9uZWQgaW50byB0aHJlZSBwYXJ0aXRpb25zOlxuICAgIC8vIFsgPCBwaXZvdDEgICB8ID49IHBpdm90MSAmJiA8PSBwaXZvdDIgICB8ICA+IHBpdm90MiAgIF1cbiAgICAvLyAgXiAgICAgICAgICAgIF4gICAgICAgICAgICAgICAgICAgICAgICBeICAgICAgICAgICAgIF5cbiAgICAvLyBsZWZ0ICAgICAgICAgbGVzcyAgICAgICAgICAgICAgICAgICAgIGdyZWF0ICAgICAgICByaWdodFxuXG4gICAgLy8gUmVjdXJzaXZlIGRlc2NlbnQuIChEb24ndCBpbmNsdWRlIHRoZSBwaXZvdCB2YWx1ZXMuKVxuICAgIHNvcnQoYSwgbG8sIGxlc3MgLSAxKTtcbiAgICBzb3J0KGEsIGdyZWF0ICsgMiwgaGkpO1xuXG4gICAgaWYgKHBpdm90c0VxdWFsKSB7XG4gICAgICAvLyBBbGwgZWxlbWVudHMgaW4gdGhlIHNlY29uZCBwYXJ0aXRpb24gYXJlIGVxdWFsIHRvIHRoZSBwaXZvdC4gTm9cbiAgICAgIC8vIG5lZWQgdG8gc29ydCB0aGVtLlxuICAgICAgcmV0dXJuIGE7XG4gICAgfVxuXG4gICAgLy8gSW4gdGhlb3J5IGl0IHNob3VsZCBiZSBlbm91Z2ggdG8gY2FsbCBfZG9Tb3J0IHJlY3Vyc2l2ZWx5IG9uIHRoZSBzZWNvbmRcbiAgICAvLyBwYXJ0aXRpb24uXG4gICAgLy8gVGhlIEFuZHJvaWQgc291cmNlIGhvd2V2ZXIgcmVtb3ZlcyB0aGUgcGl2b3QgZWxlbWVudHMgZnJvbSB0aGUgcmVjdXJzaXZlXG4gICAgLy8gY2FsbCBpZiB0aGUgc2Vjb25kIHBhcnRpdGlvbiBpcyB0b28gbGFyZ2UgKG1vcmUgdGhhbiAyLzMgb2YgdGhlIGxpc3QpLlxuICAgIGlmIChsZXNzIDwgaTEgJiYgZ3JlYXQgPiBpNSkge1xuICAgICAgdmFyIGxlc3NWYWx1ZSwgZ3JlYXRWYWx1ZTtcbiAgICAgIHdoaWxlICgobGVzc1ZhbHVlID0gZihhW2xlc3NdKSkgPD0gcGl2b3RWYWx1ZTEgJiYgbGVzc1ZhbHVlID49IHBpdm90VmFsdWUxKSArK2xlc3M7XG4gICAgICB3aGlsZSAoKGdyZWF0VmFsdWUgPSBmKGFbZ3JlYXRdKSkgPD0gcGl2b3RWYWx1ZTIgJiYgZ3JlYXRWYWx1ZSA+PSBwaXZvdFZhbHVlMikgLS1ncmVhdDtcblxuICAgICAgLy8gQ29weSBwYXN0ZSBvZiB0aGUgcHJldmlvdXMgMy13YXkgcGFydGl0aW9uaW5nIHdpdGggYWRhcHRpb25zLlxuICAgICAgLy9cbiAgICAgIC8vIFdlIHBhcnRpdGlvbiB0aGUgbGlzdCBpbnRvIHRocmVlIHBhcnRzOlxuICAgICAgLy8gIDEuID09IHBpdm90MVxuICAgICAgLy8gIDIuID4gcGl2b3QxICYmIDwgcGl2b3QyXG4gICAgICAvLyAgMy4gPT0gcGl2b3QyXG4gICAgICAvL1xuICAgICAgLy8gRHVyaW5nIHRoZSBsb29wIHdlIGhhdmU6XG4gICAgICAvLyBbID09IHBpdm90MSB8ID4gcGl2b3QxICYmIDwgcGl2b3QyIHwgdW5wYXJ0aXRpb25lZCAgfCA9PSBwaXZvdDIgXVxuICAgICAgLy8gICAgICAgICAgICAgIF4gICAgICAgICAgICAgICAgICAgICAgXiAgICAgICAgICAgICAgXlxuICAgICAgLy8gICAgICAgICAgICBsZXNzICAgICAgICAgICAgICAgICAgICAgayAgICAgICAgICAgICAgZ3JlYXRcbiAgICAgIC8vXG4gICAgICAvLyBJbnZhcmlhbnRzOlxuICAgICAgLy8gICAxLiBmb3IgeCBpbiBbICosIGxlc3NbIDogeCA9PSBwaXZvdDFcbiAgICAgIC8vICAgMi4gZm9yIHggaW4gW2xlc3MsIGtbIDogcGl2b3QxIDwgeCAmJiB4IDwgcGl2b3QyXG4gICAgICAvLyAgIDMuIGZvciB4IGluIF1ncmVhdCwgKiBdIDogeCA9PSBwaXZvdDJcbiAgICAgIGZvciAodmFyIGsgPSBsZXNzOyBrIDw9IGdyZWF0OyBrKyspIHtcbiAgICAgICAgdmFyIGVrID0gYVtrXSwgeGsgPSBmKGVrKTtcbiAgICAgICAgaWYgKHhrIDw9IHBpdm90VmFsdWUxICYmIHhrID49IHBpdm90VmFsdWUxKSB7XG4gICAgICAgICAgaWYgKGsgIT09IGxlc3MpIHtcbiAgICAgICAgICAgIGFba10gPSBhW2xlc3NdO1xuICAgICAgICAgICAgYVtsZXNzXSA9IGVrO1xuICAgICAgICAgIH1cbiAgICAgICAgICBsZXNzKys7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgaWYgKHhrIDw9IHBpdm90VmFsdWUyICYmIHhrID49IHBpdm90VmFsdWUyKSB7XG4gICAgICAgICAgICB3aGlsZSAodHJ1ZSkge1xuICAgICAgICAgICAgICB2YXIgZ3JlYXRWYWx1ZSA9IGYoYVtncmVhdF0pO1xuICAgICAgICAgICAgICBpZiAoZ3JlYXRWYWx1ZSA8PSBwaXZvdFZhbHVlMiAmJiBncmVhdFZhbHVlID49IHBpdm90VmFsdWUyKSB7XG4gICAgICAgICAgICAgICAgZ3JlYXQtLTtcbiAgICAgICAgICAgICAgICBpZiAoZ3JlYXQgPCBrKSBicmVhaztcbiAgICAgICAgICAgICAgICAvLyBUaGlzIGlzIHRoZSBvbmx5IGxvY2F0aW9uIGluc2lkZSB0aGUgbG9vcCB3aGVyZSBhIG5ld1xuICAgICAgICAgICAgICAgIC8vIGl0ZXJhdGlvbiBpcyBzdGFydGVkLlxuICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIC8vIGFbZ3JlYXRdIDwgcGl2b3QyLlxuICAgICAgICAgICAgICAgIGlmIChncmVhdFZhbHVlIDwgcGl2b3RWYWx1ZTEpIHtcbiAgICAgICAgICAgICAgICAgIC8vIFRyaXBsZSBleGNoYW5nZS5cbiAgICAgICAgICAgICAgICAgIGFba10gPSBhW2xlc3NdO1xuICAgICAgICAgICAgICAgICAgYVtsZXNzKytdID0gYVtncmVhdF07XG4gICAgICAgICAgICAgICAgICBhW2dyZWF0LS1dID0gZWs7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgIC8vIGFbZ3JlYXRdID09IHBpdm90MS5cbiAgICAgICAgICAgICAgICAgIGFba10gPSBhW2dyZWF0XTtcbiAgICAgICAgICAgICAgICAgIGFbZ3JlYXQtLV0gPSBlaztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBUaGUgc2Vjb25kIHBhcnRpdGlvbiBoYXMgbm93IGJlZW4gY2xlYXJlZCBvZiBwaXZvdCBlbGVtZW50cyBhbmQgbG9va3NcbiAgICAvLyBhcyBmb2xsb3dzOlxuICAgIC8vIFsgICogIHwgID4gcGl2b3QxICYmIDwgcGl2b3QyICB8ICogXVxuICAgIC8vICAgICAgICBeICAgICAgICAgICAgICAgICAgICAgIF5cbiAgICAvLyAgICAgICBsZXNzICAgICAgICAgICAgICAgICAgZ3JlYXRcbiAgICAvLyBTb3J0IHRoZSBzZWNvbmQgcGFydGl0aW9uIHVzaW5nIHJlY3Vyc2l2ZSBkZXNjZW50LlxuXG4gICAgLy8gVGhlIHNlY29uZCBwYXJ0aXRpb24gbG9va3MgYXMgZm9sbG93czpcbiAgICAvLyBbICAqICB8ICA+PSBwaXZvdDEgJiYgPD0gcGl2b3QyICB8ICogXVxuICAgIC8vICAgICAgICBeICAgICAgICAgICAgICAgICAgICAgICAgXlxuICAgIC8vICAgICAgIGxlc3MgICAgICAgICAgICAgICAgICAgIGdyZWF0XG4gICAgLy8gU2ltcGx5IHNvcnQgaXQgYnkgcmVjdXJzaXZlIGRlc2NlbnQuXG5cbiAgICByZXR1cm4gc29ydChhLCBsZXNzLCBncmVhdCArIDEpO1xuICB9XG5cbiAgcmV0dXJuIHNvcnQ7XG59XG5cbnZhciBxdWlja3NvcnRfc2l6ZVRocmVzaG9sZCA9IDMyO1xudmFyIGNyb3NzZmlsdGVyX2FycmF5OCA9IGNyb3NzZmlsdGVyX2FycmF5VW50eXBlZCxcbiAgICBjcm9zc2ZpbHRlcl9hcnJheTE2ID0gY3Jvc3NmaWx0ZXJfYXJyYXlVbnR5cGVkLFxuICAgIGNyb3NzZmlsdGVyX2FycmF5MzIgPSBjcm9zc2ZpbHRlcl9hcnJheVVudHlwZWQsXG4gICAgY3Jvc3NmaWx0ZXJfYXJyYXlMZW5ndGhlbiA9IGNyb3NzZmlsdGVyX2FycmF5TGVuZ3RoZW5VbnR5cGVkLFxuICAgIGNyb3NzZmlsdGVyX2FycmF5V2lkZW4gPSBjcm9zc2ZpbHRlcl9hcnJheVdpZGVuVW50eXBlZDtcblxuaWYgKHR5cGVvZiBVaW50OEFycmF5ICE9PSBcInVuZGVmaW5lZFwiKSB7XG4gIGNyb3NzZmlsdGVyX2FycmF5OCA9IGZ1bmN0aW9uKG4pIHsgcmV0dXJuIG5ldyBVaW50OEFycmF5KG4pOyB9O1xuICBjcm9zc2ZpbHRlcl9hcnJheTE2ID0gZnVuY3Rpb24obikgeyByZXR1cm4gbmV3IFVpbnQxNkFycmF5KG4pOyB9O1xuICBjcm9zc2ZpbHRlcl9hcnJheTMyID0gZnVuY3Rpb24obikgeyByZXR1cm4gbmV3IFVpbnQzMkFycmF5KG4pOyB9O1xuXG4gIGNyb3NzZmlsdGVyX2FycmF5TGVuZ3RoZW4gPSBmdW5jdGlvbihhcnJheSwgbGVuZ3RoKSB7XG4gICAgaWYgKGFycmF5Lmxlbmd0aCA+PSBsZW5ndGgpIHJldHVybiBhcnJheTtcbiAgICB2YXIgY29weSA9IG5ldyBhcnJheS5jb25zdHJ1Y3RvcihsZW5ndGgpO1xuICAgIGNvcHkuc2V0KGFycmF5KTtcbiAgICByZXR1cm4gY29weTtcbiAgfTtcblxuICBjcm9zc2ZpbHRlcl9hcnJheVdpZGVuID0gZnVuY3Rpb24oYXJyYXksIHdpZHRoKSB7XG4gICAgdmFyIGNvcHk7XG4gICAgc3dpdGNoICh3aWR0aCkge1xuICAgICAgY2FzZSAxNjogY29weSA9IGNyb3NzZmlsdGVyX2FycmF5MTYoYXJyYXkubGVuZ3RoKTsgYnJlYWs7XG4gICAgICBjYXNlIDMyOiBjb3B5ID0gY3Jvc3NmaWx0ZXJfYXJyYXkzMihhcnJheS5sZW5ndGgpOyBicmVhaztcbiAgICAgIGRlZmF1bHQ6IHRocm93IG5ldyBFcnJvcihcImludmFsaWQgYXJyYXkgd2lkdGghXCIpO1xuICAgIH1cbiAgICBjb3B5LnNldChhcnJheSk7XG4gICAgcmV0dXJuIGNvcHk7XG4gIH07XG59XG5cbmZ1bmN0aW9uIGNyb3NzZmlsdGVyX2FycmF5VW50eXBlZChuKSB7XG4gIHZhciBhcnJheSA9IG5ldyBBcnJheShuKSwgaSA9IC0xO1xuICB3aGlsZSAoKytpIDwgbikgYXJyYXlbaV0gPSAwO1xuICByZXR1cm4gYXJyYXk7XG59XG5cbmZ1bmN0aW9uIGNyb3NzZmlsdGVyX2FycmF5TGVuZ3RoZW5VbnR5cGVkKGFycmF5LCBsZW5ndGgpIHtcbiAgdmFyIG4gPSBhcnJheS5sZW5ndGg7XG4gIHdoaWxlIChuIDwgbGVuZ3RoKSBhcnJheVtuKytdID0gMDtcbiAgcmV0dXJuIGFycmF5O1xufVxuXG5mdW5jdGlvbiBjcm9zc2ZpbHRlcl9hcnJheVdpZGVuVW50eXBlZChhcnJheSwgd2lkdGgpIHtcbiAgaWYgKHdpZHRoID4gMzIpIHRocm93IG5ldyBFcnJvcihcImludmFsaWQgYXJyYXkgd2lkdGghXCIpO1xuICByZXR1cm4gYXJyYXk7XG59XG5mdW5jdGlvbiBjcm9zc2ZpbHRlcl9maWx0ZXJFeGFjdChiaXNlY3QsIHZhbHVlKSB7XG4gIHJldHVybiBmdW5jdGlvbih2YWx1ZXMpIHtcbiAgICB2YXIgbiA9IHZhbHVlcy5sZW5ndGg7XG4gICAgcmV0dXJuIFtiaXNlY3QubGVmdCh2YWx1ZXMsIHZhbHVlLCAwLCBuKSwgYmlzZWN0LnJpZ2h0KHZhbHVlcywgdmFsdWUsIDAsIG4pXTtcbiAgfTtcbn1cblxuZnVuY3Rpb24gY3Jvc3NmaWx0ZXJfZmlsdGVyUmFuZ2UoYmlzZWN0LCByYW5nZSkge1xuICB2YXIgbWluID0gcmFuZ2VbMF0sXG4gICAgICBtYXggPSByYW5nZVsxXTtcbiAgcmV0dXJuIGZ1bmN0aW9uKHZhbHVlcykge1xuICAgIHZhciBuID0gdmFsdWVzLmxlbmd0aDtcbiAgICByZXR1cm4gW2Jpc2VjdC5sZWZ0KHZhbHVlcywgbWluLCAwLCBuKSwgYmlzZWN0LmxlZnQodmFsdWVzLCBtYXgsIDAsIG4pXTtcbiAgfTtcbn1cblxuZnVuY3Rpb24gY3Jvc3NmaWx0ZXJfZmlsdGVyQWxsKHZhbHVlcykge1xuICByZXR1cm4gWzAsIHZhbHVlcy5sZW5ndGhdO1xufVxuZnVuY3Rpb24gY3Jvc3NmaWx0ZXJfbnVsbCgpIHtcbiAgcmV0dXJuIG51bGw7XG59XG5mdW5jdGlvbiBjcm9zc2ZpbHRlcl96ZXJvKCkge1xuICByZXR1cm4gMDtcbn1cbmZ1bmN0aW9uIGNyb3NzZmlsdGVyX3JlZHVjZUluY3JlbWVudChwKSB7XG4gIHJldHVybiBwICsgMTtcbn1cblxuZnVuY3Rpb24gY3Jvc3NmaWx0ZXJfcmVkdWNlRGVjcmVtZW50KHApIHtcbiAgcmV0dXJuIHAgLSAxO1xufVxuXG5mdW5jdGlvbiBjcm9zc2ZpbHRlcl9yZWR1Y2VBZGQoZikge1xuICByZXR1cm4gZnVuY3Rpb24ocCwgdikge1xuICAgIHJldHVybiBwICsgK2Yodik7XG4gIH07XG59XG5cbmZ1bmN0aW9uIGNyb3NzZmlsdGVyX3JlZHVjZVN1YnRyYWN0KGYpIHtcbiAgcmV0dXJuIGZ1bmN0aW9uKHAsIHYpIHtcbiAgICByZXR1cm4gcCAtIGYodik7XG4gIH07XG59XG5leHBvcnRzLmNyb3NzZmlsdGVyID0gY3Jvc3NmaWx0ZXI7XG5cbmZ1bmN0aW9uIGNyb3NzZmlsdGVyKCkge1xuICB2YXIgY3Jvc3NmaWx0ZXIgPSB7XG4gICAgYWRkOiBhZGQsXG4gICAgcmVtb3ZlOiByZW1vdmVEYXRhLFxuICAgIGRpbWVuc2lvbjogZGltZW5zaW9uLFxuICAgIGdyb3VwQWxsOiBncm91cEFsbCxcbiAgICBzaXplOiBzaXplXG4gIH07XG5cbiAgdmFyIGRhdGEgPSBbXSwgLy8gdGhlIHJlY29yZHNcbiAgICAgIG4gPSAwLCAvLyB0aGUgbnVtYmVyIG9mIHJlY29yZHM7IGRhdGEubGVuZ3RoXG4gICAgICBtID0gMCwgLy8gYSBiaXQgbWFzayByZXByZXNlbnRpbmcgd2hpY2ggZGltZW5zaW9ucyBhcmUgaW4gdXNlXG4gICAgICBNID0gOCwgLy8gbnVtYmVyIG9mIGRpbWVuc2lvbnMgdGhhdCBjYW4gZml0IGluIGBmaWx0ZXJzYFxuICAgICAgZmlsdGVycyA9IGNyb3NzZmlsdGVyX2FycmF5OCgwKSwgLy8gTSBiaXRzIHBlciByZWNvcmQ7IDEgaXMgZmlsdGVyZWQgb3V0XG4gICAgICBmaWx0ZXJMaXN0ZW5lcnMgPSBbXSwgLy8gd2hlbiB0aGUgZmlsdGVycyBjaGFuZ2VcbiAgICAgIGRhdGFMaXN0ZW5lcnMgPSBbXSwgLy8gd2hlbiBkYXRhIGlzIGFkZGVkXG4gICAgICByZW1vdmVEYXRhTGlzdGVuZXJzID0gW107IC8vIHdoZW4gZGF0YSBpcyByZW1vdmVkXG5cbiAgLy8gQWRkcyB0aGUgc3BlY2lmaWVkIG5ldyByZWNvcmRzIHRvIHRoaXMgY3Jvc3NmaWx0ZXIuXG4gIGZ1bmN0aW9uIGFkZChuZXdEYXRhKSB7XG4gICAgdmFyIG4wID0gbixcbiAgICAgICAgbjEgPSBuZXdEYXRhLmxlbmd0aDtcblxuICAgIC8vIElmIHRoZXJlJ3MgYWN0dWFsbHkgbmV3IGRhdGEgdG8gYWRk4oCmXG4gICAgLy8gTWVyZ2UgdGhlIG5ldyBkYXRhIGludG8gdGhlIGV4aXN0aW5nIGRhdGEuXG4gICAgLy8gTGVuZ3RoZW4gdGhlIGZpbHRlciBiaXRzZXQgdG8gaGFuZGxlIHRoZSBuZXcgcmVjb3Jkcy5cbiAgICAvLyBOb3RpZnkgbGlzdGVuZXJzIChkaW1lbnNpb25zIGFuZCBncm91cHMpIHRoYXQgbmV3IGRhdGEgaXMgYXZhaWxhYmxlLlxuICAgIGlmIChuMSkge1xuICAgICAgZGF0YSA9IGRhdGEuY29uY2F0KG5ld0RhdGEpO1xuICAgICAgZmlsdGVycyA9IGNyb3NzZmlsdGVyX2FycmF5TGVuZ3RoZW4oZmlsdGVycywgbiArPSBuMSk7XG4gICAgICBkYXRhTGlzdGVuZXJzLmZvckVhY2goZnVuY3Rpb24obCkgeyBsKG5ld0RhdGEsIG4wLCBuMSk7IH0pO1xuICAgIH1cblxuICAgIHJldHVybiBjcm9zc2ZpbHRlcjtcbiAgfVxuXG4gIC8vIFJlbW92ZXMgYWxsIHJlY29yZHMgdGhhdCBtYXRjaCB0aGUgY3VycmVudCBmaWx0ZXJzLlxuICBmdW5jdGlvbiByZW1vdmVEYXRhKCkge1xuICAgIHZhciBuZXdJbmRleCA9IGNyb3NzZmlsdGVyX2luZGV4KG4sIG4pLFxuICAgICAgICByZW1vdmVkID0gW107XG4gICAgZm9yICh2YXIgaSA9IDAsIGogPSAwOyBpIDwgbjsgKytpKSB7XG4gICAgICBpZiAoZmlsdGVyc1tpXSkgbmV3SW5kZXhbaV0gPSBqKys7XG4gICAgICBlbHNlIHJlbW92ZWQucHVzaChpKTtcbiAgICB9XG5cbiAgICAvLyBSZW1vdmUgYWxsIG1hdGNoaW5nIHJlY29yZHMgZnJvbSBncm91cHMuXG4gICAgZmlsdGVyTGlzdGVuZXJzLmZvckVhY2goZnVuY3Rpb24obCkgeyBsKDAsIFtdLCByZW1vdmVkKTsgfSk7XG5cbiAgICAvLyBVcGRhdGUgaW5kZXhlcy5cbiAgICByZW1vdmVEYXRhTGlzdGVuZXJzLmZvckVhY2goZnVuY3Rpb24obCkgeyBsKG5ld0luZGV4KTsgfSk7XG5cbiAgICAvLyBSZW1vdmUgb2xkIGZpbHRlcnMgYW5kIGRhdGEgYnkgb3ZlcndyaXRpbmcuXG4gICAgZm9yICh2YXIgaSA9IDAsIGogPSAwLCBrOyBpIDwgbjsgKytpKSB7XG4gICAgICBpZiAoayA9IGZpbHRlcnNbaV0pIHtcbiAgICAgICAgaWYgKGkgIT09IGopIGZpbHRlcnNbal0gPSBrLCBkYXRhW2pdID0gZGF0YVtpXTtcbiAgICAgICAgKytqO1xuICAgICAgfVxuICAgIH1cbiAgICBkYXRhLmxlbmd0aCA9IGo7XG4gICAgd2hpbGUgKG4gPiBqKSBmaWx0ZXJzWy0tbl0gPSAwO1xuICB9XG5cbiAgLy8gQWRkcyBhIG5ldyBkaW1lbnNpb24gd2l0aCB0aGUgc3BlY2lmaWVkIHZhbHVlIGFjY2Vzc29yIGZ1bmN0aW9uLlxuICBmdW5jdGlvbiBkaW1lbnNpb24odmFsdWUpIHtcbiAgICB2YXIgZGltZW5zaW9uID0ge1xuICAgICAgZmlsdGVyOiBmaWx0ZXIsXG4gICAgICBmaWx0ZXJFeGFjdDogZmlsdGVyRXhhY3QsXG4gICAgICBmaWx0ZXJSYW5nZTogZmlsdGVyUmFuZ2UsXG4gICAgICBmaWx0ZXJGdW5jdGlvbjogZmlsdGVyRnVuY3Rpb24sXG4gICAgICBmaWx0ZXJBbGw6IGZpbHRlckFsbCxcbiAgICAgIHRvcDogdG9wLFxuICAgICAgYm90dG9tOiBib3R0b20sXG4gICAgICBncm91cDogZ3JvdXAsXG4gICAgICBncm91cEFsbDogZ3JvdXBBbGwsXG4gICAgICBkaXNwb3NlOiBkaXNwb3NlLFxuICAgICAgcmVtb3ZlOiBkaXNwb3NlIC8vIGZvciBiYWNrd2FyZHMtY29tcGF0aWJpbGl0eVxuICAgIH07XG5cbiAgICB2YXIgb25lID0gfm0gJiAtfm0sIC8vIGxvd2VzdCB1bnNldCBiaXQgYXMgbWFzaywgZS5nLiwgMDAwMDEwMDBcbiAgICAgICAgemVybyA9IH5vbmUsIC8vIGludmVydGVkIG9uZSwgZS5nLiwgMTExMTAxMTFcbiAgICAgICAgdmFsdWVzLCAvLyBzb3J0ZWQsIGNhY2hlZCBhcnJheVxuICAgICAgICBpbmRleCwgLy8gdmFsdWUgcmFuayDihqYgb2JqZWN0IGlkXG4gICAgICAgIG5ld1ZhbHVlcywgLy8gdGVtcG9yYXJ5IGFycmF5IHN0b3JpbmcgbmV3bHktYWRkZWQgdmFsdWVzXG4gICAgICAgIG5ld0luZGV4LCAvLyB0ZW1wb3JhcnkgYXJyYXkgc3RvcmluZyBuZXdseS1hZGRlZCBpbmRleFxuICAgICAgICBzb3J0ID0gcXVpY2tzb3J0X2J5KGZ1bmN0aW9uKGkpIHsgcmV0dXJuIG5ld1ZhbHVlc1tpXTsgfSksXG4gICAgICAgIHJlZmlsdGVyID0gY3Jvc3NmaWx0ZXJfZmlsdGVyQWxsLCAvLyBmb3IgcmVjb21wdXRpbmcgZmlsdGVyXG4gICAgICAgIHJlZmlsdGVyRnVuY3Rpb24sIC8vIHRoZSBjdXN0b20gZmlsdGVyIGZ1bmN0aW9uIGluIHVzZVxuICAgICAgICBpbmRleExpc3RlbmVycyA9IFtdLCAvLyB3aGVuIGRhdGEgaXMgYWRkZWRcbiAgICAgICAgZGltZW5zaW9uR3JvdXBzID0gW10sXG4gICAgICAgIGxvMCA9IDAsXG4gICAgICAgIGhpMCA9IDA7XG5cbiAgICAvLyBVcGRhdGluZyBhIGRpbWVuc2lvbiBpcyBhIHR3by1zdGFnZSBwcm9jZXNzLiBGaXJzdCwgd2UgbXVzdCB1cGRhdGUgdGhlXG4gICAgLy8gYXNzb2NpYXRlZCBmaWx0ZXJzIGZvciB0aGUgbmV3bHktYWRkZWQgcmVjb3Jkcy4gT25jZSBhbGwgZGltZW5zaW9ucyBoYXZlXG4gICAgLy8gdXBkYXRlZCB0aGVpciBmaWx0ZXJzLCB0aGUgZ3JvdXBzIGFyZSBub3RpZmllZCB0byB1cGRhdGUuXG4gICAgZGF0YUxpc3RlbmVycy51bnNoaWZ0KHByZUFkZCk7XG4gICAgZGF0YUxpc3RlbmVycy5wdXNoKHBvc3RBZGQpO1xuXG4gICAgcmVtb3ZlRGF0YUxpc3RlbmVycy5wdXNoKHJlbW92ZURhdGEpO1xuXG4gICAgLy8gSW5jb3Jwb3JhdGUgYW55IGV4aXN0aW5nIGRhdGEgaW50byB0aGlzIGRpbWVuc2lvbiwgYW5kIG1ha2Ugc3VyZSB0aGF0IHRoZVxuICAgIC8vIGZpbHRlciBiaXRzZXQgaXMgd2lkZSBlbm91Z2ggdG8gaGFuZGxlIHRoZSBuZXcgZGltZW5zaW9uLlxuICAgIG0gfD0gb25lO1xuICAgIGlmIChNID49IDMyID8gIW9uZSA6IG0gJiAtKDEgPDwgTSkpIHtcbiAgICAgIGZpbHRlcnMgPSBjcm9zc2ZpbHRlcl9hcnJheVdpZGVuKGZpbHRlcnMsIE0gPDw9IDEpO1xuICAgIH1cbiAgICBwcmVBZGQoZGF0YSwgMCwgbik7XG4gICAgcG9zdEFkZChkYXRhLCAwLCBuKTtcblxuICAgIC8vIEluY29ycG9yYXRlcyB0aGUgc3BlY2lmaWVkIG5ldyByZWNvcmRzIGludG8gdGhpcyBkaW1lbnNpb24uXG4gICAgLy8gVGhpcyBmdW5jdGlvbiBpcyByZXNwb25zaWJsZSBmb3IgdXBkYXRpbmcgZmlsdGVycywgdmFsdWVzLCBhbmQgaW5kZXguXG4gICAgZnVuY3Rpb24gcHJlQWRkKG5ld0RhdGEsIG4wLCBuMSkge1xuXG4gICAgICAvLyBQZXJtdXRlIG5ldyB2YWx1ZXMgaW50byBuYXR1cmFsIG9yZGVyIHVzaW5nIGEgc29ydGVkIGluZGV4LlxuICAgICAgbmV3VmFsdWVzID0gbmV3RGF0YS5tYXAodmFsdWUpO1xuICAgICAgbmV3SW5kZXggPSBzb3J0KGNyb3NzZmlsdGVyX3JhbmdlKG4xKSwgMCwgbjEpO1xuICAgICAgbmV3VmFsdWVzID0gcGVybXV0ZShuZXdWYWx1ZXMsIG5ld0luZGV4KTtcblxuICAgICAgLy8gQmlzZWN0IG5ld1ZhbHVlcyB0byBkZXRlcm1pbmUgd2hpY2ggbmV3IHJlY29yZHMgYXJlIHNlbGVjdGVkLlxuICAgICAgdmFyIGJvdW5kcyA9IHJlZmlsdGVyKG5ld1ZhbHVlcyksIGxvMSA9IGJvdW5kc1swXSwgaGkxID0gYm91bmRzWzFdLCBpO1xuICAgICAgaWYgKHJlZmlsdGVyRnVuY3Rpb24pIHtcbiAgICAgICAgZm9yIChpID0gMDsgaSA8IG4xOyArK2kpIHtcbiAgICAgICAgICBpZiAoIXJlZmlsdGVyRnVuY3Rpb24obmV3VmFsdWVzW2ldLCBpKSkgZmlsdGVyc1tuZXdJbmRleFtpXSArIG4wXSB8PSBvbmU7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGZvciAoaSA9IDA7IGkgPCBsbzE7ICsraSkgZmlsdGVyc1tuZXdJbmRleFtpXSArIG4wXSB8PSBvbmU7XG4gICAgICAgIGZvciAoaSA9IGhpMTsgaSA8IG4xOyArK2kpIGZpbHRlcnNbbmV3SW5kZXhbaV0gKyBuMF0gfD0gb25lO1xuICAgICAgfVxuXG4gICAgICAvLyBJZiB0aGlzIGRpbWVuc2lvbiBwcmV2aW91c2x5IGhhZCBubyBkYXRhLCB0aGVuIHdlIGRvbid0IG5lZWQgdG8gZG8gdGhlXG4gICAgICAvLyBtb3JlIGV4cGVuc2l2ZSBtZXJnZSBvcGVyYXRpb247IHVzZSB0aGUgbmV3IHZhbHVlcyBhbmQgaW5kZXggYXMtaXMuXG4gICAgICBpZiAoIW4wKSB7XG4gICAgICAgIHZhbHVlcyA9IG5ld1ZhbHVlcztcbiAgICAgICAgaW5kZXggPSBuZXdJbmRleDtcbiAgICAgICAgbG8wID0gbG8xO1xuICAgICAgICBoaTAgPSBoaTE7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgdmFyIG9sZFZhbHVlcyA9IHZhbHVlcyxcbiAgICAgICAgICBvbGRJbmRleCA9IGluZGV4LFxuICAgICAgICAgIGkwID0gMCxcbiAgICAgICAgICBpMSA9IDA7XG5cbiAgICAgIC8vIE90aGVyd2lzZSwgY3JlYXRlIG5ldyBhcnJheXMgaW50byB3aGljaCB0byBtZXJnZSBuZXcgYW5kIG9sZC5cbiAgICAgIHZhbHVlcyA9IG5ldyBBcnJheShuKTtcbiAgICAgIGluZGV4ID0gY3Jvc3NmaWx0ZXJfaW5kZXgobiwgbik7XG5cbiAgICAgIC8vIE1lcmdlIHRoZSBvbGQgYW5kIG5ldyBzb3J0ZWQgdmFsdWVzLCBhbmQgb2xkIGFuZCBuZXcgaW5kZXguXG4gICAgICBmb3IgKGkgPSAwOyBpMCA8IG4wICYmIGkxIDwgbjE7ICsraSkge1xuICAgICAgICBpZiAob2xkVmFsdWVzW2kwXSA8IG5ld1ZhbHVlc1tpMV0pIHtcbiAgICAgICAgICB2YWx1ZXNbaV0gPSBvbGRWYWx1ZXNbaTBdO1xuICAgICAgICAgIGluZGV4W2ldID0gb2xkSW5kZXhbaTArK107XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdmFsdWVzW2ldID0gbmV3VmFsdWVzW2kxXTtcbiAgICAgICAgICBpbmRleFtpXSA9IG5ld0luZGV4W2kxKytdICsgbjA7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgLy8gQWRkIGFueSByZW1haW5pbmcgb2xkIHZhbHVlcy5cbiAgICAgIGZvciAoOyBpMCA8IG4wOyArK2kwLCArK2kpIHtcbiAgICAgICAgdmFsdWVzW2ldID0gb2xkVmFsdWVzW2kwXTtcbiAgICAgICAgaW5kZXhbaV0gPSBvbGRJbmRleFtpMF07XG4gICAgICB9XG5cbiAgICAgIC8vIEFkZCBhbnkgcmVtYWluaW5nIG5ldyB2YWx1ZXMuXG4gICAgICBmb3IgKDsgaTEgPCBuMTsgKytpMSwgKytpKSB7XG4gICAgICAgIHZhbHVlc1tpXSA9IG5ld1ZhbHVlc1tpMV07XG4gICAgICAgIGluZGV4W2ldID0gbmV3SW5kZXhbaTFdICsgbjA7XG4gICAgICB9XG5cbiAgICAgIC8vIEJpc2VjdCBhZ2FpbiB0byByZWNvbXB1dGUgbG8wIGFuZCBoaTAuXG4gICAgICBib3VuZHMgPSByZWZpbHRlcih2YWx1ZXMpLCBsbzAgPSBib3VuZHNbMF0sIGhpMCA9IGJvdW5kc1sxXTtcbiAgICB9XG5cbiAgICAvLyBXaGVuIGFsbCBmaWx0ZXJzIGhhdmUgdXBkYXRlZCwgbm90aWZ5IGluZGV4IGxpc3RlbmVycyBvZiB0aGUgbmV3IHZhbHVlcy5cbiAgICBmdW5jdGlvbiBwb3N0QWRkKG5ld0RhdGEsIG4wLCBuMSkge1xuICAgICAgaW5kZXhMaXN0ZW5lcnMuZm9yRWFjaChmdW5jdGlvbihsKSB7IGwobmV3VmFsdWVzLCBuZXdJbmRleCwgbjAsIG4xKTsgfSk7XG4gICAgICBuZXdWYWx1ZXMgPSBuZXdJbmRleCA9IG51bGw7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gcmVtb3ZlRGF0YShyZUluZGV4KSB7XG4gICAgICBmb3IgKHZhciBpID0gMCwgaiA9IDAsIGs7IGkgPCBuOyArK2kpIHtcbiAgICAgICAgaWYgKGZpbHRlcnNbayA9IGluZGV4W2ldXSkge1xuICAgICAgICAgIGlmIChpICE9PSBqKSB2YWx1ZXNbal0gPSB2YWx1ZXNbaV07XG4gICAgICAgICAgaW5kZXhbal0gPSByZUluZGV4W2tdO1xuICAgICAgICAgICsrajtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgdmFsdWVzLmxlbmd0aCA9IGo7XG4gICAgICB3aGlsZSAoaiA8IG4pIGluZGV4W2orK10gPSAwO1xuXG4gICAgICAvLyBCaXNlY3QgYWdhaW4gdG8gcmVjb21wdXRlIGxvMCBhbmQgaGkwLlxuICAgICAgdmFyIGJvdW5kcyA9IHJlZmlsdGVyKHZhbHVlcyk7XG4gICAgICBsbzAgPSBib3VuZHNbMF0sIGhpMCA9IGJvdW5kc1sxXTtcbiAgICB9XG5cbiAgICAvLyBVcGRhdGVzIHRoZSBzZWxlY3RlZCB2YWx1ZXMgYmFzZWQgb24gdGhlIHNwZWNpZmllZCBib3VuZHMgW2xvLCBoaV0uXG4gICAgLy8gVGhpcyBpbXBsZW1lbnRhdGlvbiBpcyB1c2VkIGJ5IGFsbCB0aGUgcHVibGljIGZpbHRlciBtZXRob2RzLlxuICAgIGZ1bmN0aW9uIGZpbHRlckluZGV4Qm91bmRzKGJvdW5kcykge1xuICAgICAgdmFyIGxvMSA9IGJvdW5kc1swXSxcbiAgICAgICAgICBoaTEgPSBib3VuZHNbMV07XG5cbiAgICAgIGlmIChyZWZpbHRlckZ1bmN0aW9uKSB7XG4gICAgICAgIHJlZmlsdGVyRnVuY3Rpb24gPSBudWxsO1xuICAgICAgICBmaWx0ZXJJbmRleEZ1bmN0aW9uKGZ1bmN0aW9uKGQsIGkpIHsgcmV0dXJuIGxvMSA8PSBpICYmIGkgPCBoaTE7IH0pO1xuICAgICAgICBsbzAgPSBsbzE7XG4gICAgICAgIGhpMCA9IGhpMTtcbiAgICAgICAgcmV0dXJuIGRpbWVuc2lvbjtcbiAgICAgIH1cblxuICAgICAgdmFyIGksXG4gICAgICAgICAgaixcbiAgICAgICAgICBrLFxuICAgICAgICAgIGFkZGVkID0gW10sXG4gICAgICAgICAgcmVtb3ZlZCA9IFtdO1xuXG4gICAgICAvLyBGYXN0IGluY3JlbWVudGFsIHVwZGF0ZSBiYXNlZCBvbiBwcmV2aW91cyBsbyBpbmRleC5cbiAgICAgIGlmIChsbzEgPCBsbzApIHtcbiAgICAgICAgZm9yIChpID0gbG8xLCBqID0gTWF0aC5taW4obG8wLCBoaTEpOyBpIDwgajsgKytpKSB7XG4gICAgICAgICAgZmlsdGVyc1trID0gaW5kZXhbaV1dIF49IG9uZTtcbiAgICAgICAgICBhZGRlZC5wdXNoKGspO1xuICAgICAgICB9XG4gICAgICB9IGVsc2UgaWYgKGxvMSA+IGxvMCkge1xuICAgICAgICBmb3IgKGkgPSBsbzAsIGogPSBNYXRoLm1pbihsbzEsIGhpMCk7IGkgPCBqOyArK2kpIHtcbiAgICAgICAgICBmaWx0ZXJzW2sgPSBpbmRleFtpXV0gXj0gb25lO1xuICAgICAgICAgIHJlbW92ZWQucHVzaChrKTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICAvLyBGYXN0IGluY3JlbWVudGFsIHVwZGF0ZSBiYXNlZCBvbiBwcmV2aW91cyBoaSBpbmRleC5cbiAgICAgIGlmIChoaTEgPiBoaTApIHtcbiAgICAgICAgZm9yIChpID0gTWF0aC5tYXgobG8xLCBoaTApLCBqID0gaGkxOyBpIDwgajsgKytpKSB7XG4gICAgICAgICAgZmlsdGVyc1trID0gaW5kZXhbaV1dIF49IG9uZTtcbiAgICAgICAgICBhZGRlZC5wdXNoKGspO1xuICAgICAgICB9XG4gICAgICB9IGVsc2UgaWYgKGhpMSA8IGhpMCkge1xuICAgICAgICBmb3IgKGkgPSBNYXRoLm1heChsbzAsIGhpMSksIGogPSBoaTA7IGkgPCBqOyArK2kpIHtcbiAgICAgICAgICBmaWx0ZXJzW2sgPSBpbmRleFtpXV0gXj0gb25lO1xuICAgICAgICAgIHJlbW92ZWQucHVzaChrKTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBsbzAgPSBsbzE7XG4gICAgICBoaTAgPSBoaTE7XG4gICAgICBmaWx0ZXJMaXN0ZW5lcnMuZm9yRWFjaChmdW5jdGlvbihsKSB7IGwob25lLCBhZGRlZCwgcmVtb3ZlZCk7IH0pO1xuICAgICAgcmV0dXJuIGRpbWVuc2lvbjtcbiAgICB9XG5cbiAgICAvLyBGaWx0ZXJzIHRoaXMgZGltZW5zaW9uIHVzaW5nIHRoZSBzcGVjaWZpZWQgcmFuZ2UsIHZhbHVlLCBvciBudWxsLlxuICAgIC8vIElmIHRoZSByYW5nZSBpcyBudWxsLCB0aGlzIGlzIGVxdWl2YWxlbnQgdG8gZmlsdGVyQWxsLlxuICAgIC8vIElmIHRoZSByYW5nZSBpcyBhbiBhcnJheSwgdGhpcyBpcyBlcXVpdmFsZW50IHRvIGZpbHRlclJhbmdlLlxuICAgIC8vIE90aGVyd2lzZSwgdGhpcyBpcyBlcXVpdmFsZW50IHRvIGZpbHRlckV4YWN0LlxuICAgIGZ1bmN0aW9uIGZpbHRlcihyYW5nZSkge1xuICAgICAgcmV0dXJuIHJhbmdlID09IG51bGxcbiAgICAgICAgICA/IGZpbHRlckFsbCgpIDogQXJyYXkuaXNBcnJheShyYW5nZSlcbiAgICAgICAgICA/IGZpbHRlclJhbmdlKHJhbmdlKSA6IHR5cGVvZiByYW5nZSA9PT0gXCJmdW5jdGlvblwiXG4gICAgICAgICAgPyBmaWx0ZXJGdW5jdGlvbihyYW5nZSlcbiAgICAgICAgICA6IGZpbHRlckV4YWN0KHJhbmdlKTtcbiAgICB9XG5cbiAgICAvLyBGaWx0ZXJzIHRoaXMgZGltZW5zaW9uIHRvIHNlbGVjdCB0aGUgZXhhY3QgdmFsdWUuXG4gICAgZnVuY3Rpb24gZmlsdGVyRXhhY3QodmFsdWUpIHtcbiAgICAgIHJldHVybiBmaWx0ZXJJbmRleEJvdW5kcygocmVmaWx0ZXIgPSBjcm9zc2ZpbHRlcl9maWx0ZXJFeGFjdChiaXNlY3QsIHZhbHVlKSkodmFsdWVzKSk7XG4gICAgfVxuXG4gICAgLy8gRmlsdGVycyB0aGlzIGRpbWVuc2lvbiB0byBzZWxlY3QgdGhlIHNwZWNpZmllZCByYW5nZSBbbG8sIGhpXS5cbiAgICAvLyBUaGUgbG93ZXIgYm91bmQgaXMgaW5jbHVzaXZlLCBhbmQgdGhlIHVwcGVyIGJvdW5kIGlzIGV4Y2x1c2l2ZS5cbiAgICBmdW5jdGlvbiBmaWx0ZXJSYW5nZShyYW5nZSkge1xuICAgICAgcmV0dXJuIGZpbHRlckluZGV4Qm91bmRzKChyZWZpbHRlciA9IGNyb3NzZmlsdGVyX2ZpbHRlclJhbmdlKGJpc2VjdCwgcmFuZ2UpKSh2YWx1ZXMpKTtcbiAgICB9XG5cbiAgICAvLyBDbGVhcnMgYW55IGZpbHRlcnMgb24gdGhpcyBkaW1lbnNpb24uXG4gICAgZnVuY3Rpb24gZmlsdGVyQWxsKCkge1xuICAgICAgcmV0dXJuIGZpbHRlckluZGV4Qm91bmRzKChyZWZpbHRlciA9IGNyb3NzZmlsdGVyX2ZpbHRlckFsbCkodmFsdWVzKSk7XG4gICAgfVxuXG4gICAgLy8gRmlsdGVycyB0aGlzIGRpbWVuc2lvbiB1c2luZyBhbiBhcmJpdHJhcnkgZnVuY3Rpb24uXG4gICAgZnVuY3Rpb24gZmlsdGVyRnVuY3Rpb24oZikge1xuICAgICAgcmVmaWx0ZXIgPSBjcm9zc2ZpbHRlcl9maWx0ZXJBbGw7XG5cbiAgICAgIGZpbHRlckluZGV4RnVuY3Rpb24ocmVmaWx0ZXJGdW5jdGlvbiA9IGYpO1xuXG4gICAgICBsbzAgPSAwO1xuICAgICAgaGkwID0gbjtcblxuICAgICAgcmV0dXJuIGRpbWVuc2lvbjtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBmaWx0ZXJJbmRleEZ1bmN0aW9uKGYpIHtcbiAgICAgIHZhciBpLFxuICAgICAgICAgIGssXG4gICAgICAgICAgeCxcbiAgICAgICAgICBhZGRlZCA9IFtdLFxuICAgICAgICAgIHJlbW92ZWQgPSBbXTtcblxuICAgICAgZm9yIChpID0gMDsgaSA8IG47ICsraSkge1xuICAgICAgICBpZiAoIShmaWx0ZXJzW2sgPSBpbmRleFtpXV0gJiBvbmUpIF4gISEoeCA9IGYodmFsdWVzW2ldLCBpKSkpIHtcbiAgICAgICAgICBpZiAoeCkgZmlsdGVyc1trXSAmPSB6ZXJvLCBhZGRlZC5wdXNoKGspO1xuICAgICAgICAgIGVsc2UgZmlsdGVyc1trXSB8PSBvbmUsIHJlbW92ZWQucHVzaChrKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgZmlsdGVyTGlzdGVuZXJzLmZvckVhY2goZnVuY3Rpb24obCkgeyBsKG9uZSwgYWRkZWQsIHJlbW92ZWQpOyB9KTtcbiAgICB9XG5cbiAgICAvLyBSZXR1cm5zIHRoZSB0b3AgSyBzZWxlY3RlZCByZWNvcmRzIGJhc2VkIG9uIHRoaXMgZGltZW5zaW9uJ3Mgb3JkZXIuXG4gICAgLy8gTm90ZTogb2JzZXJ2ZXMgdGhpcyBkaW1lbnNpb24ncyBmaWx0ZXIsIHVubGlrZSBncm91cCBhbmQgZ3JvdXBBbGwuXG4gICAgZnVuY3Rpb24gdG9wKGspIHtcbiAgICAgIHZhciBhcnJheSA9IFtdLFxuICAgICAgICAgIGkgPSBoaTAsXG4gICAgICAgICAgajtcblxuICAgICAgd2hpbGUgKC0taSA+PSBsbzAgJiYgayA+IDApIHtcbiAgICAgICAgaWYgKCFmaWx0ZXJzW2ogPSBpbmRleFtpXV0pIHtcbiAgICAgICAgICBhcnJheS5wdXNoKGRhdGFbal0pO1xuICAgICAgICAgIC0taztcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICByZXR1cm4gYXJyYXk7XG4gICAgfVxuXG4gICAgLy8gUmV0dXJucyB0aGUgYm90dG9tIEsgc2VsZWN0ZWQgcmVjb3JkcyBiYXNlZCBvbiB0aGlzIGRpbWVuc2lvbidzIG9yZGVyLlxuICAgIC8vIE5vdGU6IG9ic2VydmVzIHRoaXMgZGltZW5zaW9uJ3MgZmlsdGVyLCB1bmxpa2UgZ3JvdXAgYW5kIGdyb3VwQWxsLlxuICAgIGZ1bmN0aW9uIGJvdHRvbShrKSB7XG4gICAgICB2YXIgYXJyYXkgPSBbXSxcbiAgICAgICAgICBpID0gbG8wLFxuICAgICAgICAgIGo7XG5cbiAgICAgIHdoaWxlIChpIDwgaGkwICYmIGsgPiAwKSB7XG4gICAgICAgIGlmICghZmlsdGVyc1tqID0gaW5kZXhbaV1dKSB7XG4gICAgICAgICAgYXJyYXkucHVzaChkYXRhW2pdKTtcbiAgICAgICAgICAtLWs7XG4gICAgICAgIH1cbiAgICAgICAgaSsrO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gYXJyYXk7XG4gICAgfVxuXG4gICAgLy8gQWRkcyBhIG5ldyBncm91cCB0byB0aGlzIGRpbWVuc2lvbiwgdXNpbmcgdGhlIHNwZWNpZmllZCBrZXkgZnVuY3Rpb24uXG4gICAgZnVuY3Rpb24gZ3JvdXAoa2V5KSB7XG4gICAgICB2YXIgZ3JvdXAgPSB7XG4gICAgICAgIHRvcDogdG9wLFxuICAgICAgICBhbGw6IGFsbCxcbiAgICAgICAgcmVkdWNlOiByZWR1Y2UsXG4gICAgICAgIHJlZHVjZUNvdW50OiByZWR1Y2VDb3VudCxcbiAgICAgICAgcmVkdWNlU3VtOiByZWR1Y2VTdW0sXG4gICAgICAgIG9yZGVyOiBvcmRlcixcbiAgICAgICAgb3JkZXJOYXR1cmFsOiBvcmRlck5hdHVyYWwsXG4gICAgICAgIHNpemU6IHNpemUsXG4gICAgICAgIGRpc3Bvc2U6IGRpc3Bvc2UsXG4gICAgICAgIHJlbW92ZTogZGlzcG9zZSAvLyBmb3IgYmFja3dhcmRzLWNvbXBhdGliaWxpdHlcbiAgICAgIH07XG5cbiAgICAgIC8vIEVuc3VyZSB0aGF0IHRoaXMgZ3JvdXAgd2lsbCBiZSByZW1vdmVkIHdoZW4gdGhlIGRpbWVuc2lvbiBpcyByZW1vdmVkLlxuICAgICAgZGltZW5zaW9uR3JvdXBzLnB1c2goZ3JvdXApO1xuXG4gICAgICB2YXIgZ3JvdXBzLCAvLyBhcnJheSBvZiB7a2V5LCB2YWx1ZX1cbiAgICAgICAgICBncm91cEluZGV4LCAvLyBvYmplY3QgaWQg4oamIGdyb3VwIGlkXG4gICAgICAgICAgZ3JvdXBXaWR0aCA9IDgsXG4gICAgICAgICAgZ3JvdXBDYXBhY2l0eSA9IGNyb3NzZmlsdGVyX2NhcGFjaXR5KGdyb3VwV2lkdGgpLFxuICAgICAgICAgIGsgPSAwLCAvLyBjYXJkaW5hbGl0eVxuICAgICAgICAgIHNlbGVjdCxcbiAgICAgICAgICBoZWFwLFxuICAgICAgICAgIHJlZHVjZUFkZCxcbiAgICAgICAgICByZWR1Y2VSZW1vdmUsXG4gICAgICAgICAgcmVkdWNlSW5pdGlhbCxcbiAgICAgICAgICB1cGRhdGUgPSBjcm9zc2ZpbHRlcl9udWxsLFxuICAgICAgICAgIHJlc2V0ID0gY3Jvc3NmaWx0ZXJfbnVsbCxcbiAgICAgICAgICByZXNldE5lZWRlZCA9IHRydWUsXG4gICAgICAgICAgZ3JvdXBBbGwgPSBrZXkgPT09IGNyb3NzZmlsdGVyX251bGw7XG5cbiAgICAgIGlmIChhcmd1bWVudHMubGVuZ3RoIDwgMSkga2V5ID0gY3Jvc3NmaWx0ZXJfaWRlbnRpdHk7XG5cbiAgICAgIC8vIFRoZSBncm91cCBsaXN0ZW5zIHRvIHRoZSBjcm9zc2ZpbHRlciBmb3Igd2hlbiBhbnkgZGltZW5zaW9uIGNoYW5nZXMsIHNvXG4gICAgICAvLyB0aGF0IGl0IGNhbiB1cGRhdGUgdGhlIGFzc29jaWF0ZWQgcmVkdWNlIHZhbHVlcy4gSXQgbXVzdCBhbHNvIGxpc3RlbiB0b1xuICAgICAgLy8gdGhlIHBhcmVudCBkaW1lbnNpb24gZm9yIHdoZW4gZGF0YSBpcyBhZGRlZCwgYW5kIGNvbXB1dGUgbmV3IGtleXMuXG4gICAgICBmaWx0ZXJMaXN0ZW5lcnMucHVzaCh1cGRhdGUpO1xuICAgICAgaW5kZXhMaXN0ZW5lcnMucHVzaChhZGQpO1xuICAgICAgcmVtb3ZlRGF0YUxpc3RlbmVycy5wdXNoKHJlbW92ZURhdGEpO1xuXG4gICAgICAvLyBJbmNvcnBvcmF0ZSBhbnkgZXhpc3RpbmcgZGF0YSBpbnRvIHRoZSBncm91cGluZy5cbiAgICAgIGFkZCh2YWx1ZXMsIGluZGV4LCAwLCBuKTtcblxuICAgICAgLy8gSW5jb3Jwb3JhdGVzIHRoZSBzcGVjaWZpZWQgbmV3IHZhbHVlcyBpbnRvIHRoaXMgZ3JvdXAuXG4gICAgICAvLyBUaGlzIGZ1bmN0aW9uIGlzIHJlc3BvbnNpYmxlIGZvciB1cGRhdGluZyBncm91cHMgYW5kIGdyb3VwSW5kZXguXG4gICAgICBmdW5jdGlvbiBhZGQobmV3VmFsdWVzLCBuZXdJbmRleCwgbjAsIG4xKSB7XG4gICAgICAgIHZhciBvbGRHcm91cHMgPSBncm91cHMsXG4gICAgICAgICAgICByZUluZGV4ID0gY3Jvc3NmaWx0ZXJfaW5kZXgoaywgZ3JvdXBDYXBhY2l0eSksXG4gICAgICAgICAgICBhZGQgPSByZWR1Y2VBZGQsXG4gICAgICAgICAgICBpbml0aWFsID0gcmVkdWNlSW5pdGlhbCxcbiAgICAgICAgICAgIGswID0gaywgLy8gb2xkIGNhcmRpbmFsaXR5XG4gICAgICAgICAgICBpMCA9IDAsIC8vIGluZGV4IG9mIG9sZCBncm91cFxuICAgICAgICAgICAgaTEgPSAwLCAvLyBpbmRleCBvZiBuZXcgcmVjb3JkXG4gICAgICAgICAgICBqLCAvLyBvYmplY3QgaWRcbiAgICAgICAgICAgIGcwLCAvLyBvbGQgZ3JvdXBcbiAgICAgICAgICAgIHgwLCAvLyBvbGQga2V5XG4gICAgICAgICAgICB4MSwgLy8gbmV3IGtleVxuICAgICAgICAgICAgZywgLy8gZ3JvdXAgdG8gYWRkXG4gICAgICAgICAgICB4OyAvLyBrZXkgb2YgZ3JvdXAgdG8gYWRkXG5cbiAgICAgICAgLy8gSWYgYSByZXNldCBpcyBuZWVkZWQsIHdlIGRvbid0IG5lZWQgdG8gdXBkYXRlIHRoZSByZWR1Y2UgdmFsdWVzLlxuICAgICAgICBpZiAocmVzZXROZWVkZWQpIGFkZCA9IGluaXRpYWwgPSBjcm9zc2ZpbHRlcl9udWxsO1xuXG4gICAgICAgIC8vIFJlc2V0IHRoZSBuZXcgZ3JvdXBzIChrIGlzIGEgbG93ZXIgYm91bmQpLlxuICAgICAgICAvLyBBbHNvLCBtYWtlIHN1cmUgdGhhdCBncm91cEluZGV4IGV4aXN0cyBhbmQgaXMgbG9uZyBlbm91Z2guXG4gICAgICAgIGdyb3VwcyA9IG5ldyBBcnJheShrKSwgayA9IDA7XG4gICAgICAgIGdyb3VwSW5kZXggPSBrMCA+IDEgPyBjcm9zc2ZpbHRlcl9hcnJheUxlbmd0aGVuKGdyb3VwSW5kZXgsIG4pIDogY3Jvc3NmaWx0ZXJfaW5kZXgobiwgZ3JvdXBDYXBhY2l0eSk7XG5cbiAgICAgICAgLy8gR2V0IHRoZSBmaXJzdCBvbGQga2V5ICh4MCBvZiBnMCksIGlmIGl0IGV4aXN0cy5cbiAgICAgICAgaWYgKGswKSB4MCA9IChnMCA9IG9sZEdyb3Vwc1swXSkua2V5O1xuXG4gICAgICAgIC8vIEZpbmQgdGhlIGZpcnN0IG5ldyBrZXkgKHgxKSwgc2tpcHBpbmcgTmFOIGtleXMuXG4gICAgICAgIHdoaWxlIChpMSA8IG4xICYmICEoKHgxID0ga2V5KG5ld1ZhbHVlc1tpMV0pKSA+PSB4MSkpICsraTE7XG5cbiAgICAgICAgLy8gV2hpbGUgbmV3IGtleXMgcmVtYWlu4oCmXG4gICAgICAgIHdoaWxlIChpMSA8IG4xKSB7XG5cbiAgICAgICAgICAvLyBEZXRlcm1pbmUgdGhlIGxlc3NlciBvZiB0aGUgdHdvIGN1cnJlbnQga2V5czsgbmV3IGFuZCBvbGQuXG4gICAgICAgICAgLy8gSWYgdGhlcmUgYXJlIG5vIG9sZCBrZXlzIHJlbWFpbmluZywgdGhlbiBhbHdheXMgYWRkIHRoZSBuZXcga2V5LlxuICAgICAgICAgIGlmIChnMCAmJiB4MCA8PSB4MSkge1xuICAgICAgICAgICAgZyA9IGcwLCB4ID0geDA7XG5cbiAgICAgICAgICAgIC8vIFJlY29yZCB0aGUgbmV3IGluZGV4IG9mIHRoZSBvbGQgZ3JvdXAuXG4gICAgICAgICAgICByZUluZGV4W2kwXSA9IGs7XG5cbiAgICAgICAgICAgIC8vIFJldHJpZXZlIHRoZSBuZXh0IG9sZCBrZXkuXG4gICAgICAgICAgICBpZiAoZzAgPSBvbGRHcm91cHNbKytpMF0pIHgwID0gZzAua2V5O1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBnID0ge2tleTogeDEsIHZhbHVlOiBpbml0aWFsKCl9LCB4ID0geDE7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgLy8gQWRkIHRoZSBsZXNzZXIgZ3JvdXAuXG4gICAgICAgICAgZ3JvdXBzW2tdID0gZztcblxuICAgICAgICAgIC8vIEFkZCBhbnkgc2VsZWN0ZWQgcmVjb3JkcyBiZWxvbmdpbmcgdG8gdGhlIGFkZGVkIGdyb3VwLCB3aGlsZVxuICAgICAgICAgIC8vIGFkdmFuY2luZyB0aGUgbmV3IGtleSBhbmQgcG9wdWxhdGluZyB0aGUgYXNzb2NpYXRlZCBncm91cCBpbmRleC5cbiAgICAgICAgICB3aGlsZSAoISh4MSA+IHgpKSB7XG4gICAgICAgICAgICBncm91cEluZGV4W2ogPSBuZXdJbmRleFtpMV0gKyBuMF0gPSBrO1xuICAgICAgICAgICAgaWYgKCEoZmlsdGVyc1tqXSAmIHplcm8pKSBnLnZhbHVlID0gYWRkKGcudmFsdWUsIGRhdGFbal0pO1xuICAgICAgICAgICAgaWYgKCsraTEgPj0gbjEpIGJyZWFrO1xuICAgICAgICAgICAgeDEgPSBrZXkobmV3VmFsdWVzW2kxXSk7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgZ3JvdXBJbmNyZW1lbnQoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIEFkZCBhbnkgcmVtYWluaW5nIG9sZCBncm91cHMgdGhhdCB3ZXJlIGdyZWF0ZXIgdGhhbiBhbGwgbmV3IGtleXMuXG4gICAgICAgIC8vIE5vIGluY3JlbWVudGFsIHJlZHVjZSBpcyBuZWVkZWQ7IHRoZXNlIGdyb3VwcyBoYXZlIG5vIG5ldyByZWNvcmRzLlxuICAgICAgICAvLyBBbHNvIHJlY29yZCB0aGUgbmV3IGluZGV4IG9mIHRoZSBvbGQgZ3JvdXAuXG4gICAgICAgIHdoaWxlIChpMCA8IGswKSB7XG4gICAgICAgICAgZ3JvdXBzW3JlSW5kZXhbaTBdID0ga10gPSBvbGRHcm91cHNbaTArK107XG4gICAgICAgICAgZ3JvdXBJbmNyZW1lbnQoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIElmIHdlIGFkZGVkIGFueSBuZXcgZ3JvdXBzIGJlZm9yZSBhbnkgb2xkIGdyb3VwcyxcbiAgICAgICAgLy8gdXBkYXRlIHRoZSBncm91cCBpbmRleCBvZiBhbGwgdGhlIG9sZCByZWNvcmRzLlxuICAgICAgICBpZiAoayA+IGkwKSBmb3IgKGkwID0gMDsgaTAgPCBuMDsgKytpMCkge1xuICAgICAgICAgIGdyb3VwSW5kZXhbaTBdID0gcmVJbmRleFtncm91cEluZGV4W2kwXV07XG4gICAgICAgIH1cblxuICAgICAgICAvLyBNb2RpZnkgdGhlIHVwZGF0ZSBhbmQgcmVzZXQgYmVoYXZpb3IgYmFzZWQgb24gdGhlIGNhcmRpbmFsaXR5LlxuICAgICAgICAvLyBJZiB0aGUgY2FyZGluYWxpdHkgaXMgbGVzcyB0aGFuIG9yIGVxdWFsIHRvIG9uZSwgdGhlbiB0aGUgZ3JvdXBJbmRleFxuICAgICAgICAvLyBpcyBub3QgbmVlZGVkLiBJZiB0aGUgY2FyZGluYWxpdHkgaXMgemVybywgdGhlbiB0aGVyZSBhcmUgbm8gcmVjb3Jkc1xuICAgICAgICAvLyBhbmQgdGhlcmVmb3JlIG5vIGdyb3VwcyB0byB1cGRhdGUgb3IgcmVzZXQuIE5vdGUgdGhhdCB3ZSBhbHNvIG11c3RcbiAgICAgICAgLy8gY2hhbmdlIHRoZSByZWdpc3RlcmVkIGxpc3RlbmVyIHRvIHBvaW50IHRvIHRoZSBuZXcgbWV0aG9kLlxuICAgICAgICBqID0gZmlsdGVyTGlzdGVuZXJzLmluZGV4T2YodXBkYXRlKTtcbiAgICAgICAgaWYgKGsgPiAxKSB7XG4gICAgICAgICAgdXBkYXRlID0gdXBkYXRlTWFueTtcbiAgICAgICAgICByZXNldCA9IHJlc2V0TWFueTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBpZiAoIWsgJiYgZ3JvdXBBbGwpIHtcbiAgICAgICAgICAgIGsgPSAxO1xuICAgICAgICAgICAgZ3JvdXBzID0gW3trZXk6IG51bGwsIHZhbHVlOiBpbml0aWFsKCl9XTtcbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKGsgPT09IDEpIHtcbiAgICAgICAgICAgIHVwZGF0ZSA9IHVwZGF0ZU9uZTtcbiAgICAgICAgICAgIHJlc2V0ID0gcmVzZXRPbmU7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHVwZGF0ZSA9IGNyb3NzZmlsdGVyX251bGw7XG4gICAgICAgICAgICByZXNldCA9IGNyb3NzZmlsdGVyX251bGw7XG4gICAgICAgICAgfVxuICAgICAgICAgIGdyb3VwSW5kZXggPSBudWxsO1xuICAgICAgICB9XG4gICAgICAgIGZpbHRlckxpc3RlbmVyc1tqXSA9IHVwZGF0ZTtcblxuICAgICAgICAvLyBDb3VudCB0aGUgbnVtYmVyIG9mIGFkZGVkIGdyb3VwcyxcbiAgICAgICAgLy8gYW5kIHdpZGVuIHRoZSBncm91cCBpbmRleCBhcyBuZWVkZWQuXG4gICAgICAgIGZ1bmN0aW9uIGdyb3VwSW5jcmVtZW50KCkge1xuICAgICAgICAgIGlmICgrK2sgPT09IGdyb3VwQ2FwYWNpdHkpIHtcbiAgICAgICAgICAgIHJlSW5kZXggPSBjcm9zc2ZpbHRlcl9hcnJheVdpZGVuKHJlSW5kZXgsIGdyb3VwV2lkdGggPDw9IDEpO1xuICAgICAgICAgICAgZ3JvdXBJbmRleCA9IGNyb3NzZmlsdGVyX2FycmF5V2lkZW4oZ3JvdXBJbmRleCwgZ3JvdXBXaWR0aCk7XG4gICAgICAgICAgICBncm91cENhcGFjaXR5ID0gY3Jvc3NmaWx0ZXJfY2FwYWNpdHkoZ3JvdXBXaWR0aCk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGZ1bmN0aW9uIHJlbW92ZURhdGEoKSB7XG4gICAgICAgIGlmIChrID4gMSkge1xuICAgICAgICAgIHZhciBvbGRLID0gayxcbiAgICAgICAgICAgICAgb2xkR3JvdXBzID0gZ3JvdXBzLFxuICAgICAgICAgICAgICBzZWVuR3JvdXBzID0gY3Jvc3NmaWx0ZXJfaW5kZXgob2xkSywgb2xkSyk7XG5cbiAgICAgICAgICAvLyBGaWx0ZXIgb3V0IG5vbi1tYXRjaGVzIGJ5IGNvcHlpbmcgbWF0Y2hpbmcgZ3JvdXAgaW5kZXggZW50cmllcyB0b1xuICAgICAgICAgIC8vIHRoZSBiZWdpbm5pbmcgb2YgdGhlIGFycmF5LlxuICAgICAgICAgIGZvciAodmFyIGkgPSAwLCBqID0gMDsgaSA8IG47ICsraSkge1xuICAgICAgICAgICAgaWYgKGZpbHRlcnNbaV0pIHtcbiAgICAgICAgICAgICAgc2Vlbkdyb3Vwc1tncm91cEluZGV4W2pdID0gZ3JvdXBJbmRleFtpXV0gPSAxO1xuICAgICAgICAgICAgICArK2o7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgLy8gUmVhc3NlbWJsZSBncm91cHMgaW5jbHVkaW5nIG9ubHkgdGhvc2UgZ3JvdXBzIHRoYXQgd2VyZSByZWZlcnJlZFxuICAgICAgICAgIC8vIHRvIGJ5IG1hdGNoaW5nIGdyb3VwIGluZGV4IGVudHJpZXMuICBOb3RlIHRoZSBuZXcgZ3JvdXAgaW5kZXggaW5cbiAgICAgICAgICAvLyBzZWVuR3JvdXBzLlxuICAgICAgICAgIGdyb3VwcyA9IFtdLCBrID0gMDtcbiAgICAgICAgICBmb3IgKGkgPSAwOyBpIDwgb2xkSzsgKytpKSB7XG4gICAgICAgICAgICBpZiAoc2Vlbkdyb3Vwc1tpXSkge1xuICAgICAgICAgICAgICBzZWVuR3JvdXBzW2ldID0gaysrO1xuICAgICAgICAgICAgICBncm91cHMucHVzaChvbGRHcm91cHNbaV0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cblxuICAgICAgICAgIGlmIChrID4gMSkge1xuICAgICAgICAgICAgLy8gUmVpbmRleCB0aGUgZ3JvdXAgaW5kZXggdXNpbmcgc2Vlbkdyb3VwcyB0byBmaW5kIHRoZSBuZXcgaW5kZXguXG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGo7ICsraSkgZ3JvdXBJbmRleFtpXSA9IHNlZW5Hcm91cHNbZ3JvdXBJbmRleFtpXV07XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGdyb3VwSW5kZXggPSBudWxsO1xuICAgICAgICAgIH1cbiAgICAgICAgICBmaWx0ZXJMaXN0ZW5lcnNbZmlsdGVyTGlzdGVuZXJzLmluZGV4T2YodXBkYXRlKV0gPSBrID4gMVxuICAgICAgICAgICAgICA/IChyZXNldCA9IHJlc2V0TWFueSwgdXBkYXRlID0gdXBkYXRlTWFueSlcbiAgICAgICAgICAgICAgOiBrID09PSAxID8gKHJlc2V0ID0gcmVzZXRPbmUsIHVwZGF0ZSA9IHVwZGF0ZU9uZSlcbiAgICAgICAgICAgICAgOiByZXNldCA9IHVwZGF0ZSA9IGNyb3NzZmlsdGVyX251bGw7XG4gICAgICAgIH0gZWxzZSBpZiAoayA9PT0gMSkge1xuICAgICAgICAgIGlmIChncm91cEFsbCkgcmV0dXJuO1xuICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbjsgKytpKSBpZiAoZmlsdGVyc1tpXSkgcmV0dXJuO1xuICAgICAgICAgIGdyb3VwcyA9IFtdLCBrID0gMDtcbiAgICAgICAgICBmaWx0ZXJMaXN0ZW5lcnNbZmlsdGVyTGlzdGVuZXJzLmluZGV4T2YodXBkYXRlKV0gPVxuICAgICAgICAgIHVwZGF0ZSA9IHJlc2V0ID0gY3Jvc3NmaWx0ZXJfbnVsbDtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICAvLyBSZWR1Y2VzIHRoZSBzcGVjaWZpZWQgc2VsZWN0ZWQgb3IgZGVzZWxlY3RlZCByZWNvcmRzLlxuICAgICAgLy8gVGhpcyBmdW5jdGlvbiBpcyBvbmx5IHVzZWQgd2hlbiB0aGUgY2FyZGluYWxpdHkgaXMgZ3JlYXRlciB0aGFuIDEuXG4gICAgICBmdW5jdGlvbiB1cGRhdGVNYW55KGZpbHRlck9uZSwgYWRkZWQsIHJlbW92ZWQpIHtcbiAgICAgICAgaWYgKGZpbHRlck9uZSA9PT0gb25lIHx8IHJlc2V0TmVlZGVkKSByZXR1cm47XG5cbiAgICAgICAgdmFyIGksXG4gICAgICAgICAgICBrLFxuICAgICAgICAgICAgbixcbiAgICAgICAgICAgIGc7XG5cbiAgICAgICAgLy8gQWRkIHRoZSBhZGRlZCB2YWx1ZXMuXG4gICAgICAgIGZvciAoaSA9IDAsIG4gPSBhZGRlZC5sZW5ndGg7IGkgPCBuOyArK2kpIHtcbiAgICAgICAgICBpZiAoIShmaWx0ZXJzW2sgPSBhZGRlZFtpXV0gJiB6ZXJvKSkge1xuICAgICAgICAgICAgZyA9IGdyb3Vwc1tncm91cEluZGV4W2tdXTtcbiAgICAgICAgICAgIGcudmFsdWUgPSByZWR1Y2VBZGQoZy52YWx1ZSwgZGF0YVtrXSk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgLy8gUmVtb3ZlIHRoZSByZW1vdmVkIHZhbHVlcy5cbiAgICAgICAgZm9yIChpID0gMCwgbiA9IHJlbW92ZWQubGVuZ3RoOyBpIDwgbjsgKytpKSB7XG4gICAgICAgICAgaWYgKChmaWx0ZXJzW2sgPSByZW1vdmVkW2ldXSAmIHplcm8pID09PSBmaWx0ZXJPbmUpIHtcbiAgICAgICAgICAgIGcgPSBncm91cHNbZ3JvdXBJbmRleFtrXV07XG4gICAgICAgICAgICBnLnZhbHVlID0gcmVkdWNlUmVtb3ZlKGcudmFsdWUsIGRhdGFba10pO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICAvLyBSZWR1Y2VzIHRoZSBzcGVjaWZpZWQgc2VsZWN0ZWQgb3IgZGVzZWxlY3RlZCByZWNvcmRzLlxuICAgICAgLy8gVGhpcyBmdW5jdGlvbiBpcyBvbmx5IHVzZWQgd2hlbiB0aGUgY2FyZGluYWxpdHkgaXMgMS5cbiAgICAgIGZ1bmN0aW9uIHVwZGF0ZU9uZShmaWx0ZXJPbmUsIGFkZGVkLCByZW1vdmVkKSB7XG4gICAgICAgIGlmIChmaWx0ZXJPbmUgPT09IG9uZSB8fCByZXNldE5lZWRlZCkgcmV0dXJuO1xuXG4gICAgICAgIHZhciBpLFxuICAgICAgICAgICAgayxcbiAgICAgICAgICAgIG4sXG4gICAgICAgICAgICBnID0gZ3JvdXBzWzBdO1xuXG4gICAgICAgIC8vIEFkZCB0aGUgYWRkZWQgdmFsdWVzLlxuICAgICAgICBmb3IgKGkgPSAwLCBuID0gYWRkZWQubGVuZ3RoOyBpIDwgbjsgKytpKSB7XG4gICAgICAgICAgaWYgKCEoZmlsdGVyc1trID0gYWRkZWRbaV1dICYgemVybykpIHtcbiAgICAgICAgICAgIGcudmFsdWUgPSByZWR1Y2VBZGQoZy52YWx1ZSwgZGF0YVtrXSk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgLy8gUmVtb3ZlIHRoZSByZW1vdmVkIHZhbHVlcy5cbiAgICAgICAgZm9yIChpID0gMCwgbiA9IHJlbW92ZWQubGVuZ3RoOyBpIDwgbjsgKytpKSB7XG4gICAgICAgICAgaWYgKChmaWx0ZXJzW2sgPSByZW1vdmVkW2ldXSAmIHplcm8pID09PSBmaWx0ZXJPbmUpIHtcbiAgICAgICAgICAgIGcudmFsdWUgPSByZWR1Y2VSZW1vdmUoZy52YWx1ZSwgZGF0YVtrXSk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIC8vIFJlY29tcHV0ZXMgdGhlIGdyb3VwIHJlZHVjZSB2YWx1ZXMgZnJvbSBzY3JhdGNoLlxuICAgICAgLy8gVGhpcyBmdW5jdGlvbiBpcyBvbmx5IHVzZWQgd2hlbiB0aGUgY2FyZGluYWxpdHkgaXMgZ3JlYXRlciB0aGFuIDEuXG4gICAgICBmdW5jdGlvbiByZXNldE1hbnkoKSB7XG4gICAgICAgIHZhciBpLFxuICAgICAgICAgICAgZztcblxuICAgICAgICAvLyBSZXNldCBhbGwgZ3JvdXAgdmFsdWVzLlxuICAgICAgICBmb3IgKGkgPSAwOyBpIDwgazsgKytpKSB7XG4gICAgICAgICAgZ3JvdXBzW2ldLnZhbHVlID0gcmVkdWNlSW5pdGlhbCgpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gQWRkIGFueSBzZWxlY3RlZCByZWNvcmRzLlxuICAgICAgICBmb3IgKGkgPSAwOyBpIDwgbjsgKytpKSB7XG4gICAgICAgICAgaWYgKCEoZmlsdGVyc1tpXSAmIHplcm8pKSB7XG4gICAgICAgICAgICBnID0gZ3JvdXBzW2dyb3VwSW5kZXhbaV1dO1xuICAgICAgICAgICAgZy52YWx1ZSA9IHJlZHVjZUFkZChnLnZhbHVlLCBkYXRhW2ldKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgLy8gUmVjb21wdXRlcyB0aGUgZ3JvdXAgcmVkdWNlIHZhbHVlcyBmcm9tIHNjcmF0Y2guXG4gICAgICAvLyBUaGlzIGZ1bmN0aW9uIGlzIG9ubHkgdXNlZCB3aGVuIHRoZSBjYXJkaW5hbGl0eSBpcyAxLlxuICAgICAgZnVuY3Rpb24gcmVzZXRPbmUoKSB7XG4gICAgICAgIHZhciBpLFxuICAgICAgICAgICAgZyA9IGdyb3Vwc1swXTtcblxuICAgICAgICAvLyBSZXNldCB0aGUgc2luZ2xldG9uIGdyb3VwIHZhbHVlcy5cbiAgICAgICAgZy52YWx1ZSA9IHJlZHVjZUluaXRpYWwoKTtcblxuICAgICAgICAvLyBBZGQgYW55IHNlbGVjdGVkIHJlY29yZHMuXG4gICAgICAgIGZvciAoaSA9IDA7IGkgPCBuOyArK2kpIHtcbiAgICAgICAgICBpZiAoIShmaWx0ZXJzW2ldICYgemVybykpIHtcbiAgICAgICAgICAgIGcudmFsdWUgPSByZWR1Y2VBZGQoZy52YWx1ZSwgZGF0YVtpXSk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIC8vIFJldHVybnMgdGhlIGFycmF5IG9mIGdyb3VwIHZhbHVlcywgaW4gdGhlIGRpbWVuc2lvbidzIG5hdHVyYWwgb3JkZXIuXG4gICAgICBmdW5jdGlvbiBhbGwoKSB7XG4gICAgICAgIGlmIChyZXNldE5lZWRlZCkgcmVzZXQoKSwgcmVzZXROZWVkZWQgPSBmYWxzZTtcbiAgICAgICAgcmV0dXJuIGdyb3VwcztcbiAgICAgIH1cblxuICAgICAgLy8gUmV0dXJucyBhIG5ldyBhcnJheSBjb250YWluaW5nIHRoZSB0b3AgSyBncm91cCB2YWx1ZXMsIGluIHJlZHVjZSBvcmRlci5cbiAgICAgIGZ1bmN0aW9uIHRvcChrKSB7XG4gICAgICAgIHZhciB0b3AgPSBzZWxlY3QoYWxsKCksIDAsIGdyb3Vwcy5sZW5ndGgsIGspO1xuICAgICAgICByZXR1cm4gaGVhcC5zb3J0KHRvcCwgMCwgdG9wLmxlbmd0aCk7XG4gICAgICB9XG5cbiAgICAgIC8vIFNldHMgdGhlIHJlZHVjZSBiZWhhdmlvciBmb3IgdGhpcyBncm91cCB0byB1c2UgdGhlIHNwZWNpZmllZCBmdW5jdGlvbnMuXG4gICAgICAvLyBUaGlzIG1ldGhvZCBsYXppbHkgcmVjb21wdXRlcyB0aGUgcmVkdWNlIHZhbHVlcywgd2FpdGluZyB1bnRpbCBuZWVkZWQuXG4gICAgICBmdW5jdGlvbiByZWR1Y2UoYWRkLCByZW1vdmUsIGluaXRpYWwpIHtcbiAgICAgICAgcmVkdWNlQWRkID0gYWRkO1xuICAgICAgICByZWR1Y2VSZW1vdmUgPSByZW1vdmU7XG4gICAgICAgIHJlZHVjZUluaXRpYWwgPSBpbml0aWFsO1xuICAgICAgICByZXNldE5lZWRlZCA9IHRydWU7XG4gICAgICAgIHJldHVybiBncm91cDtcbiAgICAgIH1cblxuICAgICAgLy8gQSBjb252ZW5pZW5jZSBtZXRob2QgZm9yIHJlZHVjaW5nIGJ5IGNvdW50LlxuICAgICAgZnVuY3Rpb24gcmVkdWNlQ291bnQoKSB7XG4gICAgICAgIHJldHVybiByZWR1Y2UoY3Jvc3NmaWx0ZXJfcmVkdWNlSW5jcmVtZW50LCBjcm9zc2ZpbHRlcl9yZWR1Y2VEZWNyZW1lbnQsIGNyb3NzZmlsdGVyX3plcm8pO1xuICAgICAgfVxuXG4gICAgICAvLyBBIGNvbnZlbmllbmNlIG1ldGhvZCBmb3IgcmVkdWNpbmcgYnkgc3VtKHZhbHVlKS5cbiAgICAgIGZ1bmN0aW9uIHJlZHVjZVN1bSh2YWx1ZSkge1xuICAgICAgICByZXR1cm4gcmVkdWNlKGNyb3NzZmlsdGVyX3JlZHVjZUFkZCh2YWx1ZSksIGNyb3NzZmlsdGVyX3JlZHVjZVN1YnRyYWN0KHZhbHVlKSwgY3Jvc3NmaWx0ZXJfemVybyk7XG4gICAgICB9XG5cbiAgICAgIC8vIFNldHMgdGhlIHJlZHVjZSBvcmRlciwgdXNpbmcgdGhlIHNwZWNpZmllZCBhY2Nlc3Nvci5cbiAgICAgIGZ1bmN0aW9uIG9yZGVyKHZhbHVlKSB7XG4gICAgICAgIHNlbGVjdCA9IGhlYXBzZWxlY3RfYnkodmFsdWVPZik7XG4gICAgICAgIGhlYXAgPSBoZWFwX2J5KHZhbHVlT2YpO1xuICAgICAgICBmdW5jdGlvbiB2YWx1ZU9mKGQpIHsgcmV0dXJuIHZhbHVlKGQudmFsdWUpOyB9XG4gICAgICAgIHJldHVybiBncm91cDtcbiAgICAgIH1cblxuICAgICAgLy8gQSBjb252ZW5pZW5jZSBtZXRob2QgZm9yIG5hdHVyYWwgb3JkZXJpbmcgYnkgcmVkdWNlIHZhbHVlLlxuICAgICAgZnVuY3Rpb24gb3JkZXJOYXR1cmFsKCkge1xuICAgICAgICByZXR1cm4gb3JkZXIoY3Jvc3NmaWx0ZXJfaWRlbnRpdHkpO1xuICAgICAgfVxuXG4gICAgICAvLyBSZXR1cm5zIHRoZSBjYXJkaW5hbGl0eSBvZiB0aGlzIGdyb3VwLCBpcnJlc3BlY3RpdmUgb2YgYW55IGZpbHRlcnMuXG4gICAgICBmdW5jdGlvbiBzaXplKCkge1xuICAgICAgICByZXR1cm4gaztcbiAgICAgIH1cblxuICAgICAgLy8gUmVtb3ZlcyB0aGlzIGdyb3VwIGFuZCBhc3NvY2lhdGVkIGV2ZW50IGxpc3RlbmVycy5cbiAgICAgIGZ1bmN0aW9uIGRpc3Bvc2UoKSB7XG4gICAgICAgIHZhciBpID0gZmlsdGVyTGlzdGVuZXJzLmluZGV4T2YodXBkYXRlKTtcbiAgICAgICAgaWYgKGkgPj0gMCkgZmlsdGVyTGlzdGVuZXJzLnNwbGljZShpLCAxKTtcbiAgICAgICAgaSA9IGluZGV4TGlzdGVuZXJzLmluZGV4T2YoYWRkKTtcbiAgICAgICAgaWYgKGkgPj0gMCkgaW5kZXhMaXN0ZW5lcnMuc3BsaWNlKGksIDEpO1xuICAgICAgICBpID0gcmVtb3ZlRGF0YUxpc3RlbmVycy5pbmRleE9mKHJlbW92ZURhdGEpO1xuICAgICAgICBpZiAoaSA+PSAwKSByZW1vdmVEYXRhTGlzdGVuZXJzLnNwbGljZShpLCAxKTtcbiAgICAgICAgcmV0dXJuIGdyb3VwO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gcmVkdWNlQ291bnQoKS5vcmRlck5hdHVyYWwoKTtcbiAgICB9XG5cbiAgICAvLyBBIGNvbnZlbmllbmNlIGZ1bmN0aW9uIGZvciBnZW5lcmF0aW5nIGEgc2luZ2xldG9uIGdyb3VwLlxuICAgIGZ1bmN0aW9uIGdyb3VwQWxsKCkge1xuICAgICAgdmFyIGcgPSBncm91cChjcm9zc2ZpbHRlcl9udWxsKSwgYWxsID0gZy5hbGw7XG4gICAgICBkZWxldGUgZy5hbGw7XG4gICAgICBkZWxldGUgZy50b3A7XG4gICAgICBkZWxldGUgZy5vcmRlcjtcbiAgICAgIGRlbGV0ZSBnLm9yZGVyTmF0dXJhbDtcbiAgICAgIGRlbGV0ZSBnLnNpemU7XG4gICAgICBnLnZhbHVlID0gZnVuY3Rpb24oKSB7IHJldHVybiBhbGwoKVswXS52YWx1ZTsgfTtcbiAgICAgIHJldHVybiBnO1xuICAgIH1cblxuICAgIC8vIFJlbW92ZXMgdGhpcyBkaW1lbnNpb24gYW5kIGFzc29jaWF0ZWQgZ3JvdXBzIGFuZCBldmVudCBsaXN0ZW5lcnMuXG4gICAgZnVuY3Rpb24gZGlzcG9zZSgpIHtcbiAgICAgIGRpbWVuc2lvbkdyb3Vwcy5mb3JFYWNoKGZ1bmN0aW9uKGdyb3VwKSB7IGdyb3VwLmRpc3Bvc2UoKTsgfSk7XG4gICAgICB2YXIgaSA9IGRhdGFMaXN0ZW5lcnMuaW5kZXhPZihwcmVBZGQpO1xuICAgICAgaWYgKGkgPj0gMCkgZGF0YUxpc3RlbmVycy5zcGxpY2UoaSwgMSk7XG4gICAgICBpID0gZGF0YUxpc3RlbmVycy5pbmRleE9mKHBvc3RBZGQpO1xuICAgICAgaWYgKGkgPj0gMCkgZGF0YUxpc3RlbmVycy5zcGxpY2UoaSwgMSk7XG4gICAgICBpID0gcmVtb3ZlRGF0YUxpc3RlbmVycy5pbmRleE9mKHJlbW92ZURhdGEpO1xuICAgICAgaWYgKGkgPj0gMCkgcmVtb3ZlRGF0YUxpc3RlbmVycy5zcGxpY2UoaSwgMSk7XG4gICAgICBtICY9IHplcm87XG4gICAgICByZXR1cm4gZmlsdGVyQWxsKCk7XG4gICAgfVxuXG4gICAgcmV0dXJuIGRpbWVuc2lvbjtcbiAgfVxuXG4gIC8vIEEgY29udmVuaWVuY2UgbWV0aG9kIGZvciBncm91cEFsbCBvbiBhIGR1bW15IGRpbWVuc2lvbi5cbiAgLy8gVGhpcyBpbXBsZW1lbnRhdGlvbiBjYW4gYmUgb3B0aW1pemVkIHNpbmNlIGl0IGFsd2F5cyBoYXMgY2FyZGluYWxpdHkgMS5cbiAgZnVuY3Rpb24gZ3JvdXBBbGwoKSB7XG4gICAgdmFyIGdyb3VwID0ge1xuICAgICAgcmVkdWNlOiByZWR1Y2UsXG4gICAgICByZWR1Y2VDb3VudDogcmVkdWNlQ291bnQsXG4gICAgICByZWR1Y2VTdW06IHJlZHVjZVN1bSxcbiAgICAgIHZhbHVlOiB2YWx1ZSxcbiAgICAgIGRpc3Bvc2U6IGRpc3Bvc2UsXG4gICAgICByZW1vdmU6IGRpc3Bvc2UgLy8gZm9yIGJhY2t3YXJkcy1jb21wYXRpYmlsaXR5XG4gICAgfTtcblxuICAgIHZhciByZWR1Y2VWYWx1ZSxcbiAgICAgICAgcmVkdWNlQWRkLFxuICAgICAgICByZWR1Y2VSZW1vdmUsXG4gICAgICAgIHJlZHVjZUluaXRpYWwsXG4gICAgICAgIHJlc2V0TmVlZGVkID0gdHJ1ZTtcblxuICAgIC8vIFRoZSBncm91cCBsaXN0ZW5zIHRvIHRoZSBjcm9zc2ZpbHRlciBmb3Igd2hlbiBhbnkgZGltZW5zaW9uIGNoYW5nZXMsIHNvXG4gICAgLy8gdGhhdCBpdCBjYW4gdXBkYXRlIHRoZSByZWR1Y2UgdmFsdWUuIEl0IG11c3QgYWxzbyBsaXN0ZW4gdG8gdGhlIHBhcmVudFxuICAgIC8vIGRpbWVuc2lvbiBmb3Igd2hlbiBkYXRhIGlzIGFkZGVkLlxuICAgIGZpbHRlckxpc3RlbmVycy5wdXNoKHVwZGF0ZSk7XG4gICAgZGF0YUxpc3RlbmVycy5wdXNoKGFkZCk7XG5cbiAgICAvLyBGb3IgY29uc2lzdGVuY3k7IGFjdHVhbGx5IGEgbm8tb3Agc2luY2UgcmVzZXROZWVkZWQgaXMgdHJ1ZS5cbiAgICBhZGQoZGF0YSwgMCwgbik7XG5cbiAgICAvLyBJbmNvcnBvcmF0ZXMgdGhlIHNwZWNpZmllZCBuZXcgdmFsdWVzIGludG8gdGhpcyBncm91cC5cbiAgICBmdW5jdGlvbiBhZGQobmV3RGF0YSwgbjApIHtcbiAgICAgIHZhciBpO1xuXG4gICAgICBpZiAocmVzZXROZWVkZWQpIHJldHVybjtcblxuICAgICAgLy8gQWRkIHRoZSBhZGRlZCB2YWx1ZXMuXG4gICAgICBmb3IgKGkgPSBuMDsgaSA8IG47ICsraSkge1xuICAgICAgICBpZiAoIWZpbHRlcnNbaV0pIHtcbiAgICAgICAgICByZWR1Y2VWYWx1ZSA9IHJlZHVjZUFkZChyZWR1Y2VWYWx1ZSwgZGF0YVtpXSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBSZWR1Y2VzIHRoZSBzcGVjaWZpZWQgc2VsZWN0ZWQgb3IgZGVzZWxlY3RlZCByZWNvcmRzLlxuICAgIGZ1bmN0aW9uIHVwZGF0ZShmaWx0ZXJPbmUsIGFkZGVkLCByZW1vdmVkKSB7XG4gICAgICB2YXIgaSxcbiAgICAgICAgICBrLFxuICAgICAgICAgIG47XG5cbiAgICAgIGlmIChyZXNldE5lZWRlZCkgcmV0dXJuO1xuXG4gICAgICAvLyBBZGQgdGhlIGFkZGVkIHZhbHVlcy5cbiAgICAgIGZvciAoaSA9IDAsIG4gPSBhZGRlZC5sZW5ndGg7IGkgPCBuOyArK2kpIHtcbiAgICAgICAgaWYgKCFmaWx0ZXJzW2sgPSBhZGRlZFtpXV0pIHtcbiAgICAgICAgICByZWR1Y2VWYWx1ZSA9IHJlZHVjZUFkZChyZWR1Y2VWYWx1ZSwgZGF0YVtrXSk7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgLy8gUmVtb3ZlIHRoZSByZW1vdmVkIHZhbHVlcy5cbiAgICAgIGZvciAoaSA9IDAsIG4gPSByZW1vdmVkLmxlbmd0aDsgaSA8IG47ICsraSkge1xuICAgICAgICBpZiAoZmlsdGVyc1trID0gcmVtb3ZlZFtpXV0gPT09IGZpbHRlck9uZSkge1xuICAgICAgICAgIHJlZHVjZVZhbHVlID0gcmVkdWNlUmVtb3ZlKHJlZHVjZVZhbHVlLCBkYXRhW2tdKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIC8vIFJlY29tcHV0ZXMgdGhlIGdyb3VwIHJlZHVjZSB2YWx1ZSBmcm9tIHNjcmF0Y2guXG4gICAgZnVuY3Rpb24gcmVzZXQoKSB7XG4gICAgICB2YXIgaTtcblxuICAgICAgcmVkdWNlVmFsdWUgPSByZWR1Y2VJbml0aWFsKCk7XG5cbiAgICAgIGZvciAoaSA9IDA7IGkgPCBuOyArK2kpIHtcbiAgICAgICAgaWYgKCFmaWx0ZXJzW2ldKSB7XG4gICAgICAgICAgcmVkdWNlVmFsdWUgPSByZWR1Y2VBZGQocmVkdWNlVmFsdWUsIGRhdGFbaV0pO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gU2V0cyB0aGUgcmVkdWNlIGJlaGF2aW9yIGZvciB0aGlzIGdyb3VwIHRvIHVzZSB0aGUgc3BlY2lmaWVkIGZ1bmN0aW9ucy5cbiAgICAvLyBUaGlzIG1ldGhvZCBsYXppbHkgcmVjb21wdXRlcyB0aGUgcmVkdWNlIHZhbHVlLCB3YWl0aW5nIHVudGlsIG5lZWRlZC5cbiAgICBmdW5jdGlvbiByZWR1Y2UoYWRkLCByZW1vdmUsIGluaXRpYWwpIHtcbiAgICAgIHJlZHVjZUFkZCA9IGFkZDtcbiAgICAgIHJlZHVjZVJlbW92ZSA9IHJlbW92ZTtcbiAgICAgIHJlZHVjZUluaXRpYWwgPSBpbml0aWFsO1xuICAgICAgcmVzZXROZWVkZWQgPSB0cnVlO1xuICAgICAgcmV0dXJuIGdyb3VwO1xuICAgIH1cblxuICAgIC8vIEEgY29udmVuaWVuY2UgbWV0aG9kIGZvciByZWR1Y2luZyBieSBjb3VudC5cbiAgICBmdW5jdGlvbiByZWR1Y2VDb3VudCgpIHtcbiAgICAgIHJldHVybiByZWR1Y2UoY3Jvc3NmaWx0ZXJfcmVkdWNlSW5jcmVtZW50LCBjcm9zc2ZpbHRlcl9yZWR1Y2VEZWNyZW1lbnQsIGNyb3NzZmlsdGVyX3plcm8pO1xuICAgIH1cblxuICAgIC8vIEEgY29udmVuaWVuY2UgbWV0aG9kIGZvciByZWR1Y2luZyBieSBzdW0odmFsdWUpLlxuICAgIGZ1bmN0aW9uIHJlZHVjZVN1bSh2YWx1ZSkge1xuICAgICAgcmV0dXJuIHJlZHVjZShjcm9zc2ZpbHRlcl9yZWR1Y2VBZGQodmFsdWUpLCBjcm9zc2ZpbHRlcl9yZWR1Y2VTdWJ0cmFjdCh2YWx1ZSksIGNyb3NzZmlsdGVyX3plcm8pO1xuICAgIH1cblxuICAgIC8vIFJldHVybnMgdGhlIGNvbXB1dGVkIHJlZHVjZSB2YWx1ZS5cbiAgICBmdW5jdGlvbiB2YWx1ZSgpIHtcbiAgICAgIGlmIChyZXNldE5lZWRlZCkgcmVzZXQoKSwgcmVzZXROZWVkZWQgPSBmYWxzZTtcbiAgICAgIHJldHVybiByZWR1Y2VWYWx1ZTtcbiAgICB9XG5cbiAgICAvLyBSZW1vdmVzIHRoaXMgZ3JvdXAgYW5kIGFzc29jaWF0ZWQgZXZlbnQgbGlzdGVuZXJzLlxuICAgIGZ1bmN0aW9uIGRpc3Bvc2UoKSB7XG4gICAgICB2YXIgaSA9IGZpbHRlckxpc3RlbmVycy5pbmRleE9mKHVwZGF0ZSk7XG4gICAgICBpZiAoaSA+PSAwKSBmaWx0ZXJMaXN0ZW5lcnMuc3BsaWNlKGkpO1xuICAgICAgaSA9IGRhdGFMaXN0ZW5lcnMuaW5kZXhPZihhZGQpO1xuICAgICAgaWYgKGkgPj0gMCkgZGF0YUxpc3RlbmVycy5zcGxpY2UoaSk7XG4gICAgICByZXR1cm4gZ3JvdXA7XG4gICAgfVxuXG4gICAgcmV0dXJuIHJlZHVjZUNvdW50KCk7XG4gIH1cblxuICAvLyBSZXR1cm5zIHRoZSBudW1iZXIgb2YgcmVjb3JkcyBpbiB0aGlzIGNyb3NzZmlsdGVyLCBpcnJlc3BlY3RpdmUgb2YgYW55IGZpbHRlcnMuXG4gIGZ1bmN0aW9uIHNpemUoKSB7XG4gICAgcmV0dXJuIG47XG4gIH1cblxuICByZXR1cm4gYXJndW1lbnRzLmxlbmd0aFxuICAgICAgPyBhZGQoYXJndW1lbnRzWzBdKVxuICAgICAgOiBjcm9zc2ZpbHRlcjtcbn1cblxuLy8gUmV0dXJucyBhbiBhcnJheSBvZiBzaXplIG4sIGJpZyBlbm91Z2ggdG8gc3RvcmUgaWRzIHVwIHRvIG0uXG5mdW5jdGlvbiBjcm9zc2ZpbHRlcl9pbmRleChuLCBtKSB7XG4gIHJldHVybiAobSA8IDB4MTAxXG4gICAgICA/IGNyb3NzZmlsdGVyX2FycmF5OCA6IG0gPCAweDEwMDAxXG4gICAgICA/IGNyb3NzZmlsdGVyX2FycmF5MTZcbiAgICAgIDogY3Jvc3NmaWx0ZXJfYXJyYXkzMikobik7XG59XG5cbi8vIENvbnN0cnVjdHMgYSBuZXcgYXJyYXkgb2Ygc2l6ZSBuLCB3aXRoIHNlcXVlbnRpYWwgdmFsdWVzIGZyb20gMCB0byBuIC0gMS5cbmZ1bmN0aW9uIGNyb3NzZmlsdGVyX3JhbmdlKG4pIHtcbiAgdmFyIHJhbmdlID0gY3Jvc3NmaWx0ZXJfaW5kZXgobiwgbik7XG4gIGZvciAodmFyIGkgPSAtMTsgKytpIDwgbjspIHJhbmdlW2ldID0gaTtcbiAgcmV0dXJuIHJhbmdlO1xufVxuXG5mdW5jdGlvbiBjcm9zc2ZpbHRlcl9jYXBhY2l0eSh3KSB7XG4gIHJldHVybiB3ID09PSA4XG4gICAgICA/IDB4MTAwIDogdyA9PT0gMTZcbiAgICAgID8gMHgxMDAwMFxuICAgICAgOiAweDEwMDAwMDAwMDtcbn1cbn0pKHR5cGVvZiBleHBvcnRzICE9PSAndW5kZWZpbmVkJyAmJiBleHBvcnRzIHx8IHRoaXMpO1xuIiwibW9kdWxlLmV4cG9ydHMgPSByZXF1aXJlKFwiLi9jcm9zc2ZpbHRlclwiKS5jcm9zc2ZpbHRlcjtcbiIsIid1c2Ugc3RyaWN0JztcblxuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsICdfX2VzTW9kdWxlJywgeyB2YWx1ZTogdHJ1ZSB9KTtcblxudmFyIHRvcG9qc29uQ2xpZW50ID0gcmVxdWlyZSgndG9wb2pzb24tY2xpZW50Jyk7XG52YXIgdG9wb2pzb25TZXJ2ZXIgPSByZXF1aXJlKCd0b3BvanNvbi1zZXJ2ZXInKTtcbnZhciB0b3BvanNvblNpbXBsaWZ5ID0gcmVxdWlyZSgndG9wb2pzb24tc2ltcGxpZnknKTtcblxuXG5cbk9iamVjdC5rZXlzKHRvcG9qc29uQ2xpZW50KS5mb3JFYWNoKGZ1bmN0aW9uIChrZXkpIHsgZXhwb3J0c1trZXldID0gdG9wb2pzb25DbGllbnRba2V5XTsgfSk7XG5PYmplY3Qua2V5cyh0b3BvanNvblNlcnZlcikuZm9yRWFjaChmdW5jdGlvbiAoa2V5KSB7IGV4cG9ydHNba2V5XSA9IHRvcG9qc29uU2VydmVyW2tleV07IH0pO1xuT2JqZWN0LmtleXModG9wb2pzb25TaW1wbGlmeSkuZm9yRWFjaChmdW5jdGlvbiAoa2V5KSB7IGV4cG9ydHNba2V5XSA9IHRvcG9qc29uU2ltcGxpZnlba2V5XTsgfSk7XG4iLCIvLyBodHRwczovL2dpdGh1Yi5jb20vdG9wb2pzb24vdG9wb2pzb24tY2xpZW50IFZlcnNpb24gMy4wLjAuIENvcHlyaWdodCAyMDE3IE1pa2UgQm9zdG9jay5cbihmdW5jdGlvbiAoZ2xvYmFsLCBmYWN0b3J5KSB7XG5cdHR5cGVvZiBleHBvcnRzID09PSAnb2JqZWN0JyAmJiB0eXBlb2YgbW9kdWxlICE9PSAndW5kZWZpbmVkJyA/IGZhY3RvcnkoZXhwb3J0cykgOlxuXHR0eXBlb2YgZGVmaW5lID09PSAnZnVuY3Rpb24nICYmIGRlZmluZS5hbWQgPyBkZWZpbmUoWydleHBvcnRzJ10sIGZhY3RvcnkpIDpcblx0KGZhY3RvcnkoKGdsb2JhbC50b3BvanNvbiA9IGdsb2JhbC50b3BvanNvbiB8fCB7fSkpKTtcbn0odGhpcywgKGZ1bmN0aW9uIChleHBvcnRzKSB7ICd1c2Ugc3RyaWN0JztcblxudmFyIGlkZW50aXR5ID0gZnVuY3Rpb24oeCkge1xuICByZXR1cm4geDtcbn07XG5cbnZhciB0cmFuc2Zvcm0gPSBmdW5jdGlvbih0cmFuc2Zvcm0pIHtcbiAgaWYgKHRyYW5zZm9ybSA9PSBudWxsKSByZXR1cm4gaWRlbnRpdHk7XG4gIHZhciB4MCxcbiAgICAgIHkwLFxuICAgICAga3ggPSB0cmFuc2Zvcm0uc2NhbGVbMF0sXG4gICAgICBreSA9IHRyYW5zZm9ybS5zY2FsZVsxXSxcbiAgICAgIGR4ID0gdHJhbnNmb3JtLnRyYW5zbGF0ZVswXSxcbiAgICAgIGR5ID0gdHJhbnNmb3JtLnRyYW5zbGF0ZVsxXTtcbiAgcmV0dXJuIGZ1bmN0aW9uKGlucHV0LCBpKSB7XG4gICAgaWYgKCFpKSB4MCA9IHkwID0gMDtcbiAgICB2YXIgaiA9IDIsIG4gPSBpbnB1dC5sZW5ndGgsIG91dHB1dCA9IG5ldyBBcnJheShuKTtcbiAgICBvdXRwdXRbMF0gPSAoeDAgKz0gaW5wdXRbMF0pICoga3ggKyBkeDtcbiAgICBvdXRwdXRbMV0gPSAoeTAgKz0gaW5wdXRbMV0pICoga3kgKyBkeTtcbiAgICB3aGlsZSAoaiA8IG4pIG91dHB1dFtqXSA9IGlucHV0W2pdLCArK2o7XG4gICAgcmV0dXJuIG91dHB1dDtcbiAgfTtcbn07XG5cbnZhciBiYm94ID0gZnVuY3Rpb24odG9wb2xvZ3kpIHtcbiAgdmFyIHQgPSB0cmFuc2Zvcm0odG9wb2xvZ3kudHJhbnNmb3JtKSwga2V5LFxuICAgICAgeDAgPSBJbmZpbml0eSwgeTAgPSB4MCwgeDEgPSAteDAsIHkxID0gLXgwO1xuXG4gIGZ1bmN0aW9uIGJib3hQb2ludChwKSB7XG4gICAgcCA9IHQocCk7XG4gICAgaWYgKHBbMF0gPCB4MCkgeDAgPSBwWzBdO1xuICAgIGlmIChwWzBdID4geDEpIHgxID0gcFswXTtcbiAgICBpZiAocFsxXSA8IHkwKSB5MCA9IHBbMV07XG4gICAgaWYgKHBbMV0gPiB5MSkgeTEgPSBwWzFdO1xuICB9XG5cbiAgZnVuY3Rpb24gYmJveEdlb21ldHJ5KG8pIHtcbiAgICBzd2l0Y2ggKG8udHlwZSkge1xuICAgICAgY2FzZSBcIkdlb21ldHJ5Q29sbGVjdGlvblwiOiBvLmdlb21ldHJpZXMuZm9yRWFjaChiYm94R2VvbWV0cnkpOyBicmVhaztcbiAgICAgIGNhc2UgXCJQb2ludFwiOiBiYm94UG9pbnQoby5jb29yZGluYXRlcyk7IGJyZWFrO1xuICAgICAgY2FzZSBcIk11bHRpUG9pbnRcIjogby5jb29yZGluYXRlcy5mb3JFYWNoKGJib3hQb2ludCk7IGJyZWFrO1xuICAgIH1cbiAgfVxuXG4gIHRvcG9sb2d5LmFyY3MuZm9yRWFjaChmdW5jdGlvbihhcmMpIHtcbiAgICB2YXIgaSA9IC0xLCBuID0gYXJjLmxlbmd0aCwgcDtcbiAgICB3aGlsZSAoKytpIDwgbikge1xuICAgICAgcCA9IHQoYXJjW2ldLCBpKTtcbiAgICAgIGlmIChwWzBdIDwgeDApIHgwID0gcFswXTtcbiAgICAgIGlmIChwWzBdID4geDEpIHgxID0gcFswXTtcbiAgICAgIGlmIChwWzFdIDwgeTApIHkwID0gcFsxXTtcbiAgICAgIGlmIChwWzFdID4geTEpIHkxID0gcFsxXTtcbiAgICB9XG4gIH0pO1xuXG4gIGZvciAoa2V5IGluIHRvcG9sb2d5Lm9iamVjdHMpIHtcbiAgICBiYm94R2VvbWV0cnkodG9wb2xvZ3kub2JqZWN0c1trZXldKTtcbiAgfVxuXG4gIHJldHVybiBbeDAsIHkwLCB4MSwgeTFdO1xufTtcblxudmFyIHJldmVyc2UgPSBmdW5jdGlvbihhcnJheSwgbikge1xuICB2YXIgdCwgaiA9IGFycmF5Lmxlbmd0aCwgaSA9IGogLSBuO1xuICB3aGlsZSAoaSA8IC0taikgdCA9IGFycmF5W2ldLCBhcnJheVtpKytdID0gYXJyYXlbal0sIGFycmF5W2pdID0gdDtcbn07XG5cbnZhciBmZWF0dXJlID0gZnVuY3Rpb24odG9wb2xvZ3ksIG8pIHtcbiAgcmV0dXJuIG8udHlwZSA9PT0gXCJHZW9tZXRyeUNvbGxlY3Rpb25cIlxuICAgICAgPyB7dHlwZTogXCJGZWF0dXJlQ29sbGVjdGlvblwiLCBmZWF0dXJlczogby5nZW9tZXRyaWVzLm1hcChmdW5jdGlvbihvKSB7IHJldHVybiBmZWF0dXJlJDEodG9wb2xvZ3ksIG8pOyB9KX1cbiAgICAgIDogZmVhdHVyZSQxKHRvcG9sb2d5LCBvKTtcbn07XG5cbmZ1bmN0aW9uIGZlYXR1cmUkMSh0b3BvbG9neSwgbykge1xuICB2YXIgaWQgPSBvLmlkLFxuICAgICAgYmJveCA9IG8uYmJveCxcbiAgICAgIHByb3BlcnRpZXMgPSBvLnByb3BlcnRpZXMgPT0gbnVsbCA/IHt9IDogby5wcm9wZXJ0aWVzLFxuICAgICAgZ2VvbWV0cnkgPSBvYmplY3QodG9wb2xvZ3ksIG8pO1xuICByZXR1cm4gaWQgPT0gbnVsbCAmJiBiYm94ID09IG51bGwgPyB7dHlwZTogXCJGZWF0dXJlXCIsIHByb3BlcnRpZXM6IHByb3BlcnRpZXMsIGdlb21ldHJ5OiBnZW9tZXRyeX1cbiAgICAgIDogYmJveCA9PSBudWxsID8ge3R5cGU6IFwiRmVhdHVyZVwiLCBpZDogaWQsIHByb3BlcnRpZXM6IHByb3BlcnRpZXMsIGdlb21ldHJ5OiBnZW9tZXRyeX1cbiAgICAgIDoge3R5cGU6IFwiRmVhdHVyZVwiLCBpZDogaWQsIGJib3g6IGJib3gsIHByb3BlcnRpZXM6IHByb3BlcnRpZXMsIGdlb21ldHJ5OiBnZW9tZXRyeX07XG59XG5cbmZ1bmN0aW9uIG9iamVjdCh0b3BvbG9neSwgbykge1xuICB2YXIgdHJhbnNmb3JtUG9pbnQgPSB0cmFuc2Zvcm0odG9wb2xvZ3kudHJhbnNmb3JtKSxcbiAgICAgIGFyY3MgPSB0b3BvbG9neS5hcmNzO1xuXG4gIGZ1bmN0aW9uIGFyYyhpLCBwb2ludHMpIHtcbiAgICBpZiAocG9pbnRzLmxlbmd0aCkgcG9pbnRzLnBvcCgpO1xuICAgIGZvciAodmFyIGEgPSBhcmNzW2kgPCAwID8gfmkgOiBpXSwgayA9IDAsIG4gPSBhLmxlbmd0aDsgayA8IG47ICsraykge1xuICAgICAgcG9pbnRzLnB1c2godHJhbnNmb3JtUG9pbnQoYVtrXSwgaykpO1xuICAgIH1cbiAgICBpZiAoaSA8IDApIHJldmVyc2UocG9pbnRzLCBuKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHBvaW50KHApIHtcbiAgICByZXR1cm4gdHJhbnNmb3JtUG9pbnQocCk7XG4gIH1cblxuICBmdW5jdGlvbiBsaW5lKGFyY3MpIHtcbiAgICB2YXIgcG9pbnRzID0gW107XG4gICAgZm9yICh2YXIgaSA9IDAsIG4gPSBhcmNzLmxlbmd0aDsgaSA8IG47ICsraSkgYXJjKGFyY3NbaV0sIHBvaW50cyk7XG4gICAgaWYgKHBvaW50cy5sZW5ndGggPCAyKSBwb2ludHMucHVzaChwb2ludHNbMF0pOyAvLyBUaGlzIHNob3VsZCBuZXZlciBoYXBwZW4gcGVyIHRoZSBzcGVjaWZpY2F0aW9uLlxuICAgIHJldHVybiBwb2ludHM7XG4gIH1cblxuICBmdW5jdGlvbiByaW5nKGFyY3MpIHtcbiAgICB2YXIgcG9pbnRzID0gbGluZShhcmNzKTtcbiAgICB3aGlsZSAocG9pbnRzLmxlbmd0aCA8IDQpIHBvaW50cy5wdXNoKHBvaW50c1swXSk7IC8vIFRoaXMgbWF5IGhhcHBlbiBpZiBhbiBhcmMgaGFzIG9ubHkgdHdvIHBvaW50cy5cbiAgICByZXR1cm4gcG9pbnRzO1xuICB9XG5cbiAgZnVuY3Rpb24gcG9seWdvbihhcmNzKSB7XG4gICAgcmV0dXJuIGFyY3MubWFwKHJpbmcpO1xuICB9XG5cbiAgZnVuY3Rpb24gZ2VvbWV0cnkobykge1xuICAgIHZhciB0eXBlID0gby50eXBlLCBjb29yZGluYXRlcztcbiAgICBzd2l0Y2ggKHR5cGUpIHtcbiAgICAgIGNhc2UgXCJHZW9tZXRyeUNvbGxlY3Rpb25cIjogcmV0dXJuIHt0eXBlOiB0eXBlLCBnZW9tZXRyaWVzOiBvLmdlb21ldHJpZXMubWFwKGdlb21ldHJ5KX07XG4gICAgICBjYXNlIFwiUG9pbnRcIjogY29vcmRpbmF0ZXMgPSBwb2ludChvLmNvb3JkaW5hdGVzKTsgYnJlYWs7XG4gICAgICBjYXNlIFwiTXVsdGlQb2ludFwiOiBjb29yZGluYXRlcyA9IG8uY29vcmRpbmF0ZXMubWFwKHBvaW50KTsgYnJlYWs7XG4gICAgICBjYXNlIFwiTGluZVN0cmluZ1wiOiBjb29yZGluYXRlcyA9IGxpbmUoby5hcmNzKTsgYnJlYWs7XG4gICAgICBjYXNlIFwiTXVsdGlMaW5lU3RyaW5nXCI6IGNvb3JkaW5hdGVzID0gby5hcmNzLm1hcChsaW5lKTsgYnJlYWs7XG4gICAgICBjYXNlIFwiUG9seWdvblwiOiBjb29yZGluYXRlcyA9IHBvbHlnb24oby5hcmNzKTsgYnJlYWs7XG4gICAgICBjYXNlIFwiTXVsdGlQb2x5Z29uXCI6IGNvb3JkaW5hdGVzID0gby5hcmNzLm1hcChwb2x5Z29uKTsgYnJlYWs7XG4gICAgICBkZWZhdWx0OiByZXR1cm4gbnVsbDtcbiAgICB9XG4gICAgcmV0dXJuIHt0eXBlOiB0eXBlLCBjb29yZGluYXRlczogY29vcmRpbmF0ZXN9O1xuICB9XG5cbiAgcmV0dXJuIGdlb21ldHJ5KG8pO1xufVxuXG52YXIgc3RpdGNoID0gZnVuY3Rpb24odG9wb2xvZ3ksIGFyY3MpIHtcbiAgdmFyIHN0aXRjaGVkQXJjcyA9IHt9LFxuICAgICAgZnJhZ21lbnRCeVN0YXJ0ID0ge30sXG4gICAgICBmcmFnbWVudEJ5RW5kID0ge30sXG4gICAgICBmcmFnbWVudHMgPSBbXSxcbiAgICAgIGVtcHR5SW5kZXggPSAtMTtcblxuICAvLyBTdGl0Y2ggZW1wdHkgYXJjcyBmaXJzdCwgc2luY2UgdGhleSBtYXkgYmUgc3Vic3VtZWQgYnkgb3RoZXIgYXJjcy5cbiAgYXJjcy5mb3JFYWNoKGZ1bmN0aW9uKGksIGopIHtcbiAgICB2YXIgYXJjID0gdG9wb2xvZ3kuYXJjc1tpIDwgMCA/IH5pIDogaV0sIHQ7XG4gICAgaWYgKGFyYy5sZW5ndGggPCAzICYmICFhcmNbMV1bMF0gJiYgIWFyY1sxXVsxXSkge1xuICAgICAgdCA9IGFyY3NbKytlbXB0eUluZGV4XSwgYXJjc1tlbXB0eUluZGV4XSA9IGksIGFyY3Nbal0gPSB0O1xuICAgIH1cbiAgfSk7XG5cbiAgYXJjcy5mb3JFYWNoKGZ1bmN0aW9uKGkpIHtcbiAgICB2YXIgZSA9IGVuZHMoaSksXG4gICAgICAgIHN0YXJ0ID0gZVswXSxcbiAgICAgICAgZW5kID0gZVsxXSxcbiAgICAgICAgZiwgZztcblxuICAgIGlmIChmID0gZnJhZ21lbnRCeUVuZFtzdGFydF0pIHtcbiAgICAgIGRlbGV0ZSBmcmFnbWVudEJ5RW5kW2YuZW5kXTtcbiAgICAgIGYucHVzaChpKTtcbiAgICAgIGYuZW5kID0gZW5kO1xuICAgICAgaWYgKGcgPSBmcmFnbWVudEJ5U3RhcnRbZW5kXSkge1xuICAgICAgICBkZWxldGUgZnJhZ21lbnRCeVN0YXJ0W2cuc3RhcnRdO1xuICAgICAgICB2YXIgZmcgPSBnID09PSBmID8gZiA6IGYuY29uY2F0KGcpO1xuICAgICAgICBmcmFnbWVudEJ5U3RhcnRbZmcuc3RhcnQgPSBmLnN0YXJ0XSA9IGZyYWdtZW50QnlFbmRbZmcuZW5kID0gZy5lbmRdID0gZmc7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBmcmFnbWVudEJ5U3RhcnRbZi5zdGFydF0gPSBmcmFnbWVudEJ5RW5kW2YuZW5kXSA9IGY7XG4gICAgICB9XG4gICAgfSBlbHNlIGlmIChmID0gZnJhZ21lbnRCeVN0YXJ0W2VuZF0pIHtcbiAgICAgIGRlbGV0ZSBmcmFnbWVudEJ5U3RhcnRbZi5zdGFydF07XG4gICAgICBmLnVuc2hpZnQoaSk7XG4gICAgICBmLnN0YXJ0ID0gc3RhcnQ7XG4gICAgICBpZiAoZyA9IGZyYWdtZW50QnlFbmRbc3RhcnRdKSB7XG4gICAgICAgIGRlbGV0ZSBmcmFnbWVudEJ5RW5kW2cuZW5kXTtcbiAgICAgICAgdmFyIGdmID0gZyA9PT0gZiA/IGYgOiBnLmNvbmNhdChmKTtcbiAgICAgICAgZnJhZ21lbnRCeVN0YXJ0W2dmLnN0YXJ0ID0gZy5zdGFydF0gPSBmcmFnbWVudEJ5RW5kW2dmLmVuZCA9IGYuZW5kXSA9IGdmO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgZnJhZ21lbnRCeVN0YXJ0W2Yuc3RhcnRdID0gZnJhZ21lbnRCeUVuZFtmLmVuZF0gPSBmO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBmID0gW2ldO1xuICAgICAgZnJhZ21lbnRCeVN0YXJ0W2Yuc3RhcnQgPSBzdGFydF0gPSBmcmFnbWVudEJ5RW5kW2YuZW5kID0gZW5kXSA9IGY7XG4gICAgfVxuICB9KTtcblxuICBmdW5jdGlvbiBlbmRzKGkpIHtcbiAgICB2YXIgYXJjID0gdG9wb2xvZ3kuYXJjc1tpIDwgMCA/IH5pIDogaV0sIHAwID0gYXJjWzBdLCBwMTtcbiAgICBpZiAodG9wb2xvZ3kudHJhbnNmb3JtKSBwMSA9IFswLCAwXSwgYXJjLmZvckVhY2goZnVuY3Rpb24oZHApIHsgcDFbMF0gKz0gZHBbMF0sIHAxWzFdICs9IGRwWzFdOyB9KTtcbiAgICBlbHNlIHAxID0gYXJjW2FyYy5sZW5ndGggLSAxXTtcbiAgICByZXR1cm4gaSA8IDAgPyBbcDEsIHAwXSA6IFtwMCwgcDFdO1xuICB9XG5cbiAgZnVuY3Rpb24gZmx1c2goZnJhZ21lbnRCeUVuZCwgZnJhZ21lbnRCeVN0YXJ0KSB7XG4gICAgZm9yICh2YXIgayBpbiBmcmFnbWVudEJ5RW5kKSB7XG4gICAgICB2YXIgZiA9IGZyYWdtZW50QnlFbmRba107XG4gICAgICBkZWxldGUgZnJhZ21lbnRCeVN0YXJ0W2Yuc3RhcnRdO1xuICAgICAgZGVsZXRlIGYuc3RhcnQ7XG4gICAgICBkZWxldGUgZi5lbmQ7XG4gICAgICBmLmZvckVhY2goZnVuY3Rpb24oaSkgeyBzdGl0Y2hlZEFyY3NbaSA8IDAgPyB+aSA6IGldID0gMTsgfSk7XG4gICAgICBmcmFnbWVudHMucHVzaChmKTtcbiAgICB9XG4gIH1cblxuICBmbHVzaChmcmFnbWVudEJ5RW5kLCBmcmFnbWVudEJ5U3RhcnQpO1xuICBmbHVzaChmcmFnbWVudEJ5U3RhcnQsIGZyYWdtZW50QnlFbmQpO1xuICBhcmNzLmZvckVhY2goZnVuY3Rpb24oaSkgeyBpZiAoIXN0aXRjaGVkQXJjc1tpIDwgMCA/IH5pIDogaV0pIGZyYWdtZW50cy5wdXNoKFtpXSk7IH0pO1xuXG4gIHJldHVybiBmcmFnbWVudHM7XG59O1xuXG52YXIgbWVzaCA9IGZ1bmN0aW9uKHRvcG9sb2d5KSB7XG4gIHJldHVybiBvYmplY3QodG9wb2xvZ3ksIG1lc2hBcmNzLmFwcGx5KHRoaXMsIGFyZ3VtZW50cykpO1xufTtcblxuZnVuY3Rpb24gbWVzaEFyY3ModG9wb2xvZ3ksIG9iamVjdCQkMSwgZmlsdGVyKSB7XG4gIHZhciBhcmNzLCBpLCBuO1xuICBpZiAoYXJndW1lbnRzLmxlbmd0aCA+IDEpIGFyY3MgPSBleHRyYWN0QXJjcyh0b3BvbG9neSwgb2JqZWN0JCQxLCBmaWx0ZXIpO1xuICBlbHNlIGZvciAoaSA9IDAsIGFyY3MgPSBuZXcgQXJyYXkobiA9IHRvcG9sb2d5LmFyY3MubGVuZ3RoKTsgaSA8IG47ICsraSkgYXJjc1tpXSA9IGk7XG4gIHJldHVybiB7dHlwZTogXCJNdWx0aUxpbmVTdHJpbmdcIiwgYXJjczogc3RpdGNoKHRvcG9sb2d5LCBhcmNzKX07XG59XG5cbmZ1bmN0aW9uIGV4dHJhY3RBcmNzKHRvcG9sb2d5LCBvYmplY3QkJDEsIGZpbHRlcikge1xuICB2YXIgYXJjcyA9IFtdLFxuICAgICAgZ2VvbXNCeUFyYyA9IFtdLFxuICAgICAgZ2VvbTtcblxuICBmdW5jdGlvbiBleHRyYWN0MChpKSB7XG4gICAgdmFyIGogPSBpIDwgMCA/IH5pIDogaTtcbiAgICAoZ2VvbXNCeUFyY1tqXSB8fCAoZ2VvbXNCeUFyY1tqXSA9IFtdKSkucHVzaCh7aTogaSwgZzogZ2VvbX0pO1xuICB9XG5cbiAgZnVuY3Rpb24gZXh0cmFjdDEoYXJjcykge1xuICAgIGFyY3MuZm9yRWFjaChleHRyYWN0MCk7XG4gIH1cblxuICBmdW5jdGlvbiBleHRyYWN0MihhcmNzKSB7XG4gICAgYXJjcy5mb3JFYWNoKGV4dHJhY3QxKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGV4dHJhY3QzKGFyY3MpIHtcbiAgICBhcmNzLmZvckVhY2goZXh0cmFjdDIpO1xuICB9XG5cbiAgZnVuY3Rpb24gZ2VvbWV0cnkobykge1xuICAgIHN3aXRjaCAoZ2VvbSA9IG8sIG8udHlwZSkge1xuICAgICAgY2FzZSBcIkdlb21ldHJ5Q29sbGVjdGlvblwiOiBvLmdlb21ldHJpZXMuZm9yRWFjaChnZW9tZXRyeSk7IGJyZWFrO1xuICAgICAgY2FzZSBcIkxpbmVTdHJpbmdcIjogZXh0cmFjdDEoby5hcmNzKTsgYnJlYWs7XG4gICAgICBjYXNlIFwiTXVsdGlMaW5lU3RyaW5nXCI6IGNhc2UgXCJQb2x5Z29uXCI6IGV4dHJhY3QyKG8uYXJjcyk7IGJyZWFrO1xuICAgICAgY2FzZSBcIk11bHRpUG9seWdvblwiOiBleHRyYWN0MyhvLmFyY3MpOyBicmVhaztcbiAgICB9XG4gIH1cblxuICBnZW9tZXRyeShvYmplY3QkJDEpO1xuXG4gIGdlb21zQnlBcmMuZm9yRWFjaChmaWx0ZXIgPT0gbnVsbFxuICAgICAgPyBmdW5jdGlvbihnZW9tcykgeyBhcmNzLnB1c2goZ2VvbXNbMF0uaSk7IH1cbiAgICAgIDogZnVuY3Rpb24oZ2VvbXMpIHsgaWYgKGZpbHRlcihnZW9tc1swXS5nLCBnZW9tc1tnZW9tcy5sZW5ndGggLSAxXS5nKSkgYXJjcy5wdXNoKGdlb21zWzBdLmkpOyB9KTtcblxuICByZXR1cm4gYXJjcztcbn1cblxuZnVuY3Rpb24gcGxhbmFyUmluZ0FyZWEocmluZykge1xuICB2YXIgaSA9IC0xLCBuID0gcmluZy5sZW5ndGgsIGEsIGIgPSByaW5nW24gLSAxXSwgYXJlYSA9IDA7XG4gIHdoaWxlICgrK2kgPCBuKSBhID0gYiwgYiA9IHJpbmdbaV0sIGFyZWEgKz0gYVswXSAqIGJbMV0gLSBhWzFdICogYlswXTtcbiAgcmV0dXJuIE1hdGguYWJzKGFyZWEpOyAvLyBOb3RlOiBkb3VibGVkIGFyZWEhXG59XG5cbnZhciBtZXJnZSA9IGZ1bmN0aW9uKHRvcG9sb2d5KSB7XG4gIHJldHVybiBvYmplY3QodG9wb2xvZ3ksIG1lcmdlQXJjcy5hcHBseSh0aGlzLCBhcmd1bWVudHMpKTtcbn07XG5cbmZ1bmN0aW9uIG1lcmdlQXJjcyh0b3BvbG9neSwgb2JqZWN0cykge1xuICB2YXIgcG9seWdvbnNCeUFyYyA9IHt9LFxuICAgICAgcG9seWdvbnMgPSBbXSxcbiAgICAgIGdyb3VwcyA9IFtdO1xuXG4gIG9iamVjdHMuZm9yRWFjaChnZW9tZXRyeSk7XG5cbiAgZnVuY3Rpb24gZ2VvbWV0cnkobykge1xuICAgIHN3aXRjaCAoby50eXBlKSB7XG4gICAgICBjYXNlIFwiR2VvbWV0cnlDb2xsZWN0aW9uXCI6IG8uZ2VvbWV0cmllcy5mb3JFYWNoKGdlb21ldHJ5KTsgYnJlYWs7XG4gICAgICBjYXNlIFwiUG9seWdvblwiOiBleHRyYWN0KG8uYXJjcyk7IGJyZWFrO1xuICAgICAgY2FzZSBcIk11bHRpUG9seWdvblwiOiBvLmFyY3MuZm9yRWFjaChleHRyYWN0KTsgYnJlYWs7XG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gZXh0cmFjdChwb2x5Z29uKSB7XG4gICAgcG9seWdvbi5mb3JFYWNoKGZ1bmN0aW9uKHJpbmcpIHtcbiAgICAgIHJpbmcuZm9yRWFjaChmdW5jdGlvbihhcmMpIHtcbiAgICAgICAgKHBvbHlnb25zQnlBcmNbYXJjID0gYXJjIDwgMCA/IH5hcmMgOiBhcmNdIHx8IChwb2x5Z29uc0J5QXJjW2FyY10gPSBbXSkpLnB1c2gocG9seWdvbik7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgICBwb2x5Z29ucy5wdXNoKHBvbHlnb24pO1xuICB9XG5cbiAgZnVuY3Rpb24gYXJlYShyaW5nKSB7XG4gICAgcmV0dXJuIHBsYW5hclJpbmdBcmVhKG9iamVjdCh0b3BvbG9neSwge3R5cGU6IFwiUG9seWdvblwiLCBhcmNzOiBbcmluZ119KS5jb29yZGluYXRlc1swXSk7XG4gIH1cblxuICBwb2x5Z29ucy5mb3JFYWNoKGZ1bmN0aW9uKHBvbHlnb24pIHtcbiAgICBpZiAoIXBvbHlnb24uXykge1xuICAgICAgdmFyIGdyb3VwID0gW10sXG4gICAgICAgICAgbmVpZ2hib3JzID0gW3BvbHlnb25dO1xuICAgICAgcG9seWdvbi5fID0gMTtcbiAgICAgIGdyb3Vwcy5wdXNoKGdyb3VwKTtcbiAgICAgIHdoaWxlIChwb2x5Z29uID0gbmVpZ2hib3JzLnBvcCgpKSB7XG4gICAgICAgIGdyb3VwLnB1c2gocG9seWdvbik7XG4gICAgICAgIHBvbHlnb24uZm9yRWFjaChmdW5jdGlvbihyaW5nKSB7XG4gICAgICAgICAgcmluZy5mb3JFYWNoKGZ1bmN0aW9uKGFyYykge1xuICAgICAgICAgICAgcG9seWdvbnNCeUFyY1thcmMgPCAwID8gfmFyYyA6IGFyY10uZm9yRWFjaChmdW5jdGlvbihwb2x5Z29uKSB7XG4gICAgICAgICAgICAgIGlmICghcG9seWdvbi5fKSB7XG4gICAgICAgICAgICAgICAgcG9seWdvbi5fID0gMTtcbiAgICAgICAgICAgICAgICBuZWlnaGJvcnMucHVzaChwb2x5Z29uKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgIH1cbiAgfSk7XG5cbiAgcG9seWdvbnMuZm9yRWFjaChmdW5jdGlvbihwb2x5Z29uKSB7XG4gICAgZGVsZXRlIHBvbHlnb24uXztcbiAgfSk7XG5cbiAgcmV0dXJuIHtcbiAgICB0eXBlOiBcIk11bHRpUG9seWdvblwiLFxuICAgIGFyY3M6IGdyb3Vwcy5tYXAoZnVuY3Rpb24ocG9seWdvbnMpIHtcbiAgICAgIHZhciBhcmNzID0gW10sIG47XG5cbiAgICAgIC8vIEV4dHJhY3QgdGhlIGV4dGVyaW9yICh1bmlxdWUpIGFyY3MuXG4gICAgICBwb2x5Z29ucy5mb3JFYWNoKGZ1bmN0aW9uKHBvbHlnb24pIHtcbiAgICAgICAgcG9seWdvbi5mb3JFYWNoKGZ1bmN0aW9uKHJpbmcpIHtcbiAgICAgICAgICByaW5nLmZvckVhY2goZnVuY3Rpb24oYXJjKSB7XG4gICAgICAgICAgICBpZiAocG9seWdvbnNCeUFyY1thcmMgPCAwID8gfmFyYyA6IGFyY10ubGVuZ3RoIDwgMikge1xuICAgICAgICAgICAgICBhcmNzLnB1c2goYXJjKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgICB9KTtcblxuICAgICAgLy8gU3RpdGNoIHRoZSBhcmNzIGludG8gb25lIG9yIG1vcmUgcmluZ3MuXG4gICAgICBhcmNzID0gc3RpdGNoKHRvcG9sb2d5LCBhcmNzKTtcblxuICAgICAgLy8gSWYgbW9yZSB0aGFuIG9uZSByaW5nIGlzIHJldHVybmVkLFxuICAgICAgLy8gYXQgbW9zdCBvbmUgb2YgdGhlc2UgcmluZ3MgY2FuIGJlIHRoZSBleHRlcmlvcjtcbiAgICAgIC8vIGNob29zZSB0aGUgb25lIHdpdGggdGhlIGdyZWF0ZXN0IGFic29sdXRlIGFyZWEuXG4gICAgICBpZiAoKG4gPSBhcmNzLmxlbmd0aCkgPiAxKSB7XG4gICAgICAgIGZvciAodmFyIGkgPSAxLCBrID0gYXJlYShhcmNzWzBdKSwga2ksIHQ7IGkgPCBuOyArK2kpIHtcbiAgICAgICAgICBpZiAoKGtpID0gYXJlYShhcmNzW2ldKSkgPiBrKSB7XG4gICAgICAgICAgICB0ID0gYXJjc1swXSwgYXJjc1swXSA9IGFyY3NbaV0sIGFyY3NbaV0gPSB0LCBrID0ga2k7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBhcmNzO1xuICAgIH0pXG4gIH07XG59XG5cbnZhciBiaXNlY3QgPSBmdW5jdGlvbihhLCB4KSB7XG4gIHZhciBsbyA9IDAsIGhpID0gYS5sZW5ndGg7XG4gIHdoaWxlIChsbyA8IGhpKSB7XG4gICAgdmFyIG1pZCA9IGxvICsgaGkgPj4+IDE7XG4gICAgaWYgKGFbbWlkXSA8IHgpIGxvID0gbWlkICsgMTtcbiAgICBlbHNlIGhpID0gbWlkO1xuICB9XG4gIHJldHVybiBsbztcbn07XG5cbnZhciBuZWlnaGJvcnMgPSBmdW5jdGlvbihvYmplY3RzKSB7XG4gIHZhciBpbmRleGVzQnlBcmMgPSB7fSwgLy8gYXJjIGluZGV4IC0+IGFycmF5IG9mIG9iamVjdCBpbmRleGVzXG4gICAgICBuZWlnaGJvcnMgPSBvYmplY3RzLm1hcChmdW5jdGlvbigpIHsgcmV0dXJuIFtdOyB9KTtcblxuICBmdW5jdGlvbiBsaW5lKGFyY3MsIGkpIHtcbiAgICBhcmNzLmZvckVhY2goZnVuY3Rpb24oYSkge1xuICAgICAgaWYgKGEgPCAwKSBhID0gfmE7XG4gICAgICB2YXIgbyA9IGluZGV4ZXNCeUFyY1thXTtcbiAgICAgIGlmIChvKSBvLnB1c2goaSk7XG4gICAgICBlbHNlIGluZGV4ZXNCeUFyY1thXSA9IFtpXTtcbiAgICB9KTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHBvbHlnb24oYXJjcywgaSkge1xuICAgIGFyY3MuZm9yRWFjaChmdW5jdGlvbihhcmMpIHsgbGluZShhcmMsIGkpOyB9KTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGdlb21ldHJ5KG8sIGkpIHtcbiAgICBpZiAoby50eXBlID09PSBcIkdlb21ldHJ5Q29sbGVjdGlvblwiKSBvLmdlb21ldHJpZXMuZm9yRWFjaChmdW5jdGlvbihvKSB7IGdlb21ldHJ5KG8sIGkpOyB9KTtcbiAgICBlbHNlIGlmIChvLnR5cGUgaW4gZ2VvbWV0cnlUeXBlKSBnZW9tZXRyeVR5cGVbby50eXBlXShvLmFyY3MsIGkpO1xuICB9XG5cbiAgdmFyIGdlb21ldHJ5VHlwZSA9IHtcbiAgICBMaW5lU3RyaW5nOiBsaW5lLFxuICAgIE11bHRpTGluZVN0cmluZzogcG9seWdvbixcbiAgICBQb2x5Z29uOiBwb2x5Z29uLFxuICAgIE11bHRpUG9seWdvbjogZnVuY3Rpb24oYXJjcywgaSkgeyBhcmNzLmZvckVhY2goZnVuY3Rpb24oYXJjKSB7IHBvbHlnb24oYXJjLCBpKTsgfSk7IH1cbiAgfTtcblxuICBvYmplY3RzLmZvckVhY2goZ2VvbWV0cnkpO1xuXG4gIGZvciAodmFyIGkgaW4gaW5kZXhlc0J5QXJjKSB7XG4gICAgZm9yICh2YXIgaW5kZXhlcyA9IGluZGV4ZXNCeUFyY1tpXSwgbSA9IGluZGV4ZXMubGVuZ3RoLCBqID0gMDsgaiA8IG07ICsraikge1xuICAgICAgZm9yICh2YXIgayA9IGogKyAxOyBrIDwgbTsgKytrKSB7XG4gICAgICAgIHZhciBpaiA9IGluZGV4ZXNbal0sIGlrID0gaW5kZXhlc1trXSwgbjtcbiAgICAgICAgaWYgKChuID0gbmVpZ2hib3JzW2lqXSlbaSA9IGJpc2VjdChuLCBpayldICE9PSBpaykgbi5zcGxpY2UoaSwgMCwgaWspO1xuICAgICAgICBpZiAoKG4gPSBuZWlnaGJvcnNbaWtdKVtpID0gYmlzZWN0KG4sIGlqKV0gIT09IGlqKSBuLnNwbGljZShpLCAwLCBpaik7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIG5laWdoYm9ycztcbn07XG5cbnZhciB1bnRyYW5zZm9ybSA9IGZ1bmN0aW9uKHRyYW5zZm9ybSkge1xuICBpZiAodHJhbnNmb3JtID09IG51bGwpIHJldHVybiBpZGVudGl0eTtcbiAgdmFyIHgwLFxuICAgICAgeTAsXG4gICAgICBreCA9IHRyYW5zZm9ybS5zY2FsZVswXSxcbiAgICAgIGt5ID0gdHJhbnNmb3JtLnNjYWxlWzFdLFxuICAgICAgZHggPSB0cmFuc2Zvcm0udHJhbnNsYXRlWzBdLFxuICAgICAgZHkgPSB0cmFuc2Zvcm0udHJhbnNsYXRlWzFdO1xuICByZXR1cm4gZnVuY3Rpb24oaW5wdXQsIGkpIHtcbiAgICBpZiAoIWkpIHgwID0geTAgPSAwO1xuICAgIHZhciBqID0gMixcbiAgICAgICAgbiA9IGlucHV0Lmxlbmd0aCxcbiAgICAgICAgb3V0cHV0ID0gbmV3IEFycmF5KG4pLFxuICAgICAgICB4MSA9IE1hdGgucm91bmQoKGlucHV0WzBdIC0gZHgpIC8ga3gpLFxuICAgICAgICB5MSA9IE1hdGgucm91bmQoKGlucHV0WzFdIC0gZHkpIC8ga3kpO1xuICAgIG91dHB1dFswXSA9IHgxIC0geDAsIHgwID0geDE7XG4gICAgb3V0cHV0WzFdID0geTEgLSB5MCwgeTAgPSB5MTtcbiAgICB3aGlsZSAoaiA8IG4pIG91dHB1dFtqXSA9IGlucHV0W2pdLCArK2o7XG4gICAgcmV0dXJuIG91dHB1dDtcbiAgfTtcbn07XG5cbnZhciBxdWFudGl6ZSA9IGZ1bmN0aW9uKHRvcG9sb2d5LCB0cmFuc2Zvcm0pIHtcbiAgaWYgKHRvcG9sb2d5LnRyYW5zZm9ybSkgdGhyb3cgbmV3IEVycm9yKFwiYWxyZWFkeSBxdWFudGl6ZWRcIik7XG5cbiAgaWYgKCF0cmFuc2Zvcm0gfHwgIXRyYW5zZm9ybS5zY2FsZSkge1xuICAgIGlmICghKChuID0gTWF0aC5mbG9vcih0cmFuc2Zvcm0pKSA+PSAyKSkgdGhyb3cgbmV3IEVycm9yKFwibiBtdXN0IGJlIOKJpTJcIik7XG4gICAgYm94ID0gdG9wb2xvZ3kuYmJveCB8fCBiYm94KHRvcG9sb2d5KTtcbiAgICB2YXIgeDAgPSBib3hbMF0sIHkwID0gYm94WzFdLCB4MSA9IGJveFsyXSwgeTEgPSBib3hbM10sIG47XG4gICAgdHJhbnNmb3JtID0ge3NjYWxlOiBbeDEgLSB4MCA/ICh4MSAtIHgwKSAvIChuIC0gMSkgOiAxLCB5MSAtIHkwID8gKHkxIC0geTApIC8gKG4gLSAxKSA6IDFdLCB0cmFuc2xhdGU6IFt4MCwgeTBdfTtcbiAgfSBlbHNlIHtcbiAgICBib3ggPSB0b3BvbG9neS5iYm94O1xuICB9XG5cbiAgdmFyIHQgPSB1bnRyYW5zZm9ybSh0cmFuc2Zvcm0pLCBib3gsIGtleSwgaW5wdXRzID0gdG9wb2xvZ3kub2JqZWN0cywgb3V0cHV0cyA9IHt9O1xuXG4gIGZ1bmN0aW9uIHF1YW50aXplUG9pbnQocG9pbnQpIHtcbiAgICByZXR1cm4gdChwb2ludCk7XG4gIH1cblxuICBmdW5jdGlvbiBxdWFudGl6ZUdlb21ldHJ5KGlucHV0KSB7XG4gICAgdmFyIG91dHB1dDtcbiAgICBzd2l0Y2ggKGlucHV0LnR5cGUpIHtcbiAgICAgIGNhc2UgXCJHZW9tZXRyeUNvbGxlY3Rpb25cIjogb3V0cHV0ID0ge3R5cGU6IFwiR2VvbWV0cnlDb2xsZWN0aW9uXCIsIGdlb21ldHJpZXM6IGlucHV0Lmdlb21ldHJpZXMubWFwKHF1YW50aXplR2VvbWV0cnkpfTsgYnJlYWs7XG4gICAgICBjYXNlIFwiUG9pbnRcIjogb3V0cHV0ID0ge3R5cGU6IFwiUG9pbnRcIiwgY29vcmRpbmF0ZXM6IHF1YW50aXplUG9pbnQoaW5wdXQuY29vcmRpbmF0ZXMpfTsgYnJlYWs7XG4gICAgICBjYXNlIFwiTXVsdGlQb2ludFwiOiBvdXRwdXQgPSB7dHlwZTogXCJNdWx0aVBvaW50XCIsIGNvb3JkaW5hdGVzOiBpbnB1dC5jb29yZGluYXRlcy5tYXAocXVhbnRpemVQb2ludCl9OyBicmVhaztcbiAgICAgIGRlZmF1bHQ6IHJldHVybiBpbnB1dDtcbiAgICB9XG4gICAgaWYgKGlucHV0LmlkICE9IG51bGwpIG91dHB1dC5pZCA9IGlucHV0LmlkO1xuICAgIGlmIChpbnB1dC5iYm94ICE9IG51bGwpIG91dHB1dC5iYm94ID0gaW5wdXQuYmJveDtcbiAgICBpZiAoaW5wdXQucHJvcGVydGllcyAhPSBudWxsKSBvdXRwdXQucHJvcGVydGllcyA9IGlucHV0LnByb3BlcnRpZXM7XG4gICAgcmV0dXJuIG91dHB1dDtcbiAgfVxuXG4gIGZ1bmN0aW9uIHF1YW50aXplQXJjKGlucHV0KSB7XG4gICAgdmFyIGkgPSAwLCBqID0gMSwgbiA9IGlucHV0Lmxlbmd0aCwgcCwgb3V0cHV0ID0gbmV3IEFycmF5KG4pOyAvLyBwZXNzaW1pc3RpY1xuICAgIG91dHB1dFswXSA9IHQoaW5wdXRbMF0sIDApO1xuICAgIHdoaWxlICgrK2kgPCBuKSBpZiAoKHAgPSB0KGlucHV0W2ldLCBpKSlbMF0gfHwgcFsxXSkgb3V0cHV0W2orK10gPSBwOyAvLyBub24tY29pbmNpZGVudCBwb2ludHNcbiAgICBpZiAoaiA9PT0gMSkgb3V0cHV0W2orK10gPSBbMCwgMF07IC8vIGFuIGFyYyBtdXN0IGhhdmUgYXQgbGVhc3QgdHdvIHBvaW50c1xuICAgIG91dHB1dC5sZW5ndGggPSBqO1xuICAgIHJldHVybiBvdXRwdXQ7XG4gIH1cblxuICBmb3IgKGtleSBpbiBpbnB1dHMpIG91dHB1dHNba2V5XSA9IHF1YW50aXplR2VvbWV0cnkoaW5wdXRzW2tleV0pO1xuXG4gIHJldHVybiB7XG4gICAgdHlwZTogXCJUb3BvbG9neVwiLFxuICAgIGJib3g6IGJveCxcbiAgICB0cmFuc2Zvcm06IHRyYW5zZm9ybSxcbiAgICBvYmplY3RzOiBvdXRwdXRzLFxuICAgIGFyY3M6IHRvcG9sb2d5LmFyY3MubWFwKHF1YW50aXplQXJjKVxuICB9O1xufTtcblxuZXhwb3J0cy5iYm94ID0gYmJveDtcbmV4cG9ydHMuZmVhdHVyZSA9IGZlYXR1cmU7XG5leHBvcnRzLm1lc2ggPSBtZXNoO1xuZXhwb3J0cy5tZXNoQXJjcyA9IG1lc2hBcmNzO1xuZXhwb3J0cy5tZXJnZSA9IG1lcmdlO1xuZXhwb3J0cy5tZXJnZUFyY3MgPSBtZXJnZUFyY3M7XG5leHBvcnRzLm5laWdoYm9ycyA9IG5laWdoYm9ycztcbmV4cG9ydHMucXVhbnRpemUgPSBxdWFudGl6ZTtcbmV4cG9ydHMudHJhbnNmb3JtID0gdHJhbnNmb3JtO1xuZXhwb3J0cy51bnRyYW5zZm9ybSA9IHVudHJhbnNmb3JtO1xuXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgJ19fZXNNb2R1bGUnLCB7IHZhbHVlOiB0cnVlIH0pO1xuXG59KSkpO1xuIiwiLy8gaHR0cHM6Ly9naXRodWIuY29tL3RvcG9qc29uL3RvcG9qc29uLXNlcnZlciBWZXJzaW9uIDMuMC4wLiBDb3B5cmlnaHQgMjAxNyBNaWtlIEJvc3RvY2suXG4oZnVuY3Rpb24gKGdsb2JhbCwgZmFjdG9yeSkge1xuXHR0eXBlb2YgZXhwb3J0cyA9PT0gJ29iamVjdCcgJiYgdHlwZW9mIG1vZHVsZSAhPT0gJ3VuZGVmaW5lZCcgPyBmYWN0b3J5KGV4cG9ydHMpIDpcblx0dHlwZW9mIGRlZmluZSA9PT0gJ2Z1bmN0aW9uJyAmJiBkZWZpbmUuYW1kID8gZGVmaW5lKFsnZXhwb3J0cyddLCBmYWN0b3J5KSA6XG5cdChmYWN0b3J5KChnbG9iYWwudG9wb2pzb24gPSBnbG9iYWwudG9wb2pzb24gfHwge30pKSk7XG59KHRoaXMsIChmdW5jdGlvbiAoZXhwb3J0cykgeyAndXNlIHN0cmljdCc7XG5cbi8vIENvbXB1dGVzIHRoZSBib3VuZGluZyBib3ggb2YgdGhlIHNwZWNpZmllZCBoYXNoIG9mIEdlb0pTT04gb2JqZWN0cy5cbnZhciBib3VuZHMgPSBmdW5jdGlvbihvYmplY3RzKSB7XG4gIHZhciB4MCA9IEluZmluaXR5LFxuICAgICAgeTAgPSBJbmZpbml0eSxcbiAgICAgIHgxID0gLUluZmluaXR5LFxuICAgICAgeTEgPSAtSW5maW5pdHk7XG5cbiAgZnVuY3Rpb24gYm91bmRHZW9tZXRyeShnZW9tZXRyeSkge1xuICAgIGlmIChnZW9tZXRyeSAhPSBudWxsICYmIGJvdW5kR2VvbWV0cnlUeXBlLmhhc093blByb3BlcnR5KGdlb21ldHJ5LnR5cGUpKSBib3VuZEdlb21ldHJ5VHlwZVtnZW9tZXRyeS50eXBlXShnZW9tZXRyeSk7XG4gIH1cblxuICB2YXIgYm91bmRHZW9tZXRyeVR5cGUgPSB7XG4gICAgR2VvbWV0cnlDb2xsZWN0aW9uOiBmdW5jdGlvbihvKSB7IG8uZ2VvbWV0cmllcy5mb3JFYWNoKGJvdW5kR2VvbWV0cnkpOyB9LFxuICAgIFBvaW50OiBmdW5jdGlvbihvKSB7IGJvdW5kUG9pbnQoby5jb29yZGluYXRlcyk7IH0sXG4gICAgTXVsdGlQb2ludDogZnVuY3Rpb24obykgeyBvLmNvb3JkaW5hdGVzLmZvckVhY2goYm91bmRQb2ludCk7IH0sXG4gICAgTGluZVN0cmluZzogZnVuY3Rpb24obykgeyBib3VuZExpbmUoby5hcmNzKTsgfSxcbiAgICBNdWx0aUxpbmVTdHJpbmc6IGZ1bmN0aW9uKG8pIHsgby5hcmNzLmZvckVhY2goYm91bmRMaW5lKTsgfSxcbiAgICBQb2x5Z29uOiBmdW5jdGlvbihvKSB7IG8uYXJjcy5mb3JFYWNoKGJvdW5kTGluZSk7IH0sXG4gICAgTXVsdGlQb2x5Z29uOiBmdW5jdGlvbihvKSB7IG8uYXJjcy5mb3JFYWNoKGJvdW5kTXVsdGlMaW5lKTsgfVxuICB9O1xuXG4gIGZ1bmN0aW9uIGJvdW5kUG9pbnQoY29vcmRpbmF0ZXMpIHtcbiAgICB2YXIgeCA9IGNvb3JkaW5hdGVzWzBdLFxuICAgICAgICB5ID0gY29vcmRpbmF0ZXNbMV07XG4gICAgaWYgKHggPCB4MCkgeDAgPSB4O1xuICAgIGlmICh4ID4geDEpIHgxID0geDtcbiAgICBpZiAoeSA8IHkwKSB5MCA9IHk7XG4gICAgaWYgKHkgPiB5MSkgeTEgPSB5O1xuICB9XG5cbiAgZnVuY3Rpb24gYm91bmRMaW5lKGNvb3JkaW5hdGVzKSB7XG4gICAgY29vcmRpbmF0ZXMuZm9yRWFjaChib3VuZFBvaW50KTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGJvdW5kTXVsdGlMaW5lKGNvb3JkaW5hdGVzKSB7XG4gICAgY29vcmRpbmF0ZXMuZm9yRWFjaChib3VuZExpbmUpO1xuICB9XG5cbiAgZm9yICh2YXIga2V5IGluIG9iamVjdHMpIHtcbiAgICBib3VuZEdlb21ldHJ5KG9iamVjdHNba2V5XSk7XG4gIH1cblxuICByZXR1cm4geDEgPj0geDAgJiYgeTEgPj0geTAgPyBbeDAsIHkwLCB4MSwgeTFdIDogdW5kZWZpbmVkO1xufTtcblxudmFyIGhhc2hzZXQgPSBmdW5jdGlvbihzaXplLCBoYXNoLCBlcXVhbCwgdHlwZSwgZW1wdHkpIHtcbiAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDMpIHtcbiAgICB0eXBlID0gQXJyYXk7XG4gICAgZW1wdHkgPSBudWxsO1xuICB9XG5cbiAgdmFyIHN0b3JlID0gbmV3IHR5cGUoc2l6ZSA9IDEgPDwgTWF0aC5tYXgoNCwgTWF0aC5jZWlsKE1hdGgubG9nKHNpemUpIC8gTWF0aC5MTjIpKSksXG4gICAgICBtYXNrID0gc2l6ZSAtIDE7XG5cbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBzaXplOyArK2kpIHtcbiAgICBzdG9yZVtpXSA9IGVtcHR5O1xuICB9XG5cbiAgZnVuY3Rpb24gYWRkKHZhbHVlKSB7XG4gICAgdmFyIGluZGV4ID0gaGFzaCh2YWx1ZSkgJiBtYXNrLFxuICAgICAgICBtYXRjaCA9IHN0b3JlW2luZGV4XSxcbiAgICAgICAgY29sbGlzaW9ucyA9IDA7XG4gICAgd2hpbGUgKG1hdGNoICE9IGVtcHR5KSB7XG4gICAgICBpZiAoZXF1YWwobWF0Y2gsIHZhbHVlKSkgcmV0dXJuIHRydWU7XG4gICAgICBpZiAoKytjb2xsaXNpb25zID49IHNpemUpIHRocm93IG5ldyBFcnJvcihcImZ1bGwgaGFzaHNldFwiKTtcbiAgICAgIG1hdGNoID0gc3RvcmVbaW5kZXggPSAoaW5kZXggKyAxKSAmIG1hc2tdO1xuICAgIH1cbiAgICBzdG9yZVtpbmRleF0gPSB2YWx1ZTtcbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGhhcyh2YWx1ZSkge1xuICAgIHZhciBpbmRleCA9IGhhc2godmFsdWUpICYgbWFzayxcbiAgICAgICAgbWF0Y2ggPSBzdG9yZVtpbmRleF0sXG4gICAgICAgIGNvbGxpc2lvbnMgPSAwO1xuICAgIHdoaWxlIChtYXRjaCAhPSBlbXB0eSkge1xuICAgICAgaWYgKGVxdWFsKG1hdGNoLCB2YWx1ZSkpIHJldHVybiB0cnVlO1xuICAgICAgaWYgKCsrY29sbGlzaW9ucyA+PSBzaXplKSBicmVhaztcbiAgICAgIG1hdGNoID0gc3RvcmVbaW5kZXggPSAoaW5kZXggKyAxKSAmIG1hc2tdO1xuICAgIH1cbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICBmdW5jdGlvbiB2YWx1ZXMoKSB7XG4gICAgdmFyIHZhbHVlcyA9IFtdO1xuICAgIGZvciAodmFyIGkgPSAwLCBuID0gc3RvcmUubGVuZ3RoOyBpIDwgbjsgKytpKSB7XG4gICAgICB2YXIgbWF0Y2ggPSBzdG9yZVtpXTtcbiAgICAgIGlmIChtYXRjaCAhPSBlbXB0eSkgdmFsdWVzLnB1c2gobWF0Y2gpO1xuICAgIH1cbiAgICByZXR1cm4gdmFsdWVzO1xuICB9XG5cbiAgcmV0dXJuIHtcbiAgICBhZGQ6IGFkZCxcbiAgICBoYXM6IGhhcyxcbiAgICB2YWx1ZXM6IHZhbHVlc1xuICB9O1xufTtcblxudmFyIGhhc2htYXAgPSBmdW5jdGlvbihzaXplLCBoYXNoLCBlcXVhbCwga2V5VHlwZSwga2V5RW1wdHksIHZhbHVlVHlwZSkge1xuICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMykge1xuICAgIGtleVR5cGUgPSB2YWx1ZVR5cGUgPSBBcnJheTtcbiAgICBrZXlFbXB0eSA9IG51bGw7XG4gIH1cblxuICB2YXIga2V5c3RvcmUgPSBuZXcga2V5VHlwZShzaXplID0gMSA8PCBNYXRoLm1heCg0LCBNYXRoLmNlaWwoTWF0aC5sb2coc2l6ZSkgLyBNYXRoLkxOMikpKSxcbiAgICAgIHZhbHN0b3JlID0gbmV3IHZhbHVlVHlwZShzaXplKSxcbiAgICAgIG1hc2sgPSBzaXplIC0gMTtcblxuICBmb3IgKHZhciBpID0gMDsgaSA8IHNpemU7ICsraSkge1xuICAgIGtleXN0b3JlW2ldID0ga2V5RW1wdHk7XG4gIH1cblxuICBmdW5jdGlvbiBzZXQoa2V5LCB2YWx1ZSkge1xuICAgIHZhciBpbmRleCA9IGhhc2goa2V5KSAmIG1hc2ssXG4gICAgICAgIG1hdGNoS2V5ID0ga2V5c3RvcmVbaW5kZXhdLFxuICAgICAgICBjb2xsaXNpb25zID0gMDtcbiAgICB3aGlsZSAobWF0Y2hLZXkgIT0ga2V5RW1wdHkpIHtcbiAgICAgIGlmIChlcXVhbChtYXRjaEtleSwga2V5KSkgcmV0dXJuIHZhbHN0b3JlW2luZGV4XSA9IHZhbHVlO1xuICAgICAgaWYgKCsrY29sbGlzaW9ucyA+PSBzaXplKSB0aHJvdyBuZXcgRXJyb3IoXCJmdWxsIGhhc2htYXBcIik7XG4gICAgICBtYXRjaEtleSA9IGtleXN0b3JlW2luZGV4ID0gKGluZGV4ICsgMSkgJiBtYXNrXTtcbiAgICB9XG4gICAga2V5c3RvcmVbaW5kZXhdID0ga2V5O1xuICAgIHZhbHN0b3JlW2luZGV4XSA9IHZhbHVlO1xuICAgIHJldHVybiB2YWx1ZTtcbiAgfVxuXG4gIGZ1bmN0aW9uIG1heWJlU2V0KGtleSwgdmFsdWUpIHtcbiAgICB2YXIgaW5kZXggPSBoYXNoKGtleSkgJiBtYXNrLFxuICAgICAgICBtYXRjaEtleSA9IGtleXN0b3JlW2luZGV4XSxcbiAgICAgICAgY29sbGlzaW9ucyA9IDA7XG4gICAgd2hpbGUgKG1hdGNoS2V5ICE9IGtleUVtcHR5KSB7XG4gICAgICBpZiAoZXF1YWwobWF0Y2hLZXksIGtleSkpIHJldHVybiB2YWxzdG9yZVtpbmRleF07XG4gICAgICBpZiAoKytjb2xsaXNpb25zID49IHNpemUpIHRocm93IG5ldyBFcnJvcihcImZ1bGwgaGFzaG1hcFwiKTtcbiAgICAgIG1hdGNoS2V5ID0ga2V5c3RvcmVbaW5kZXggPSAoaW5kZXggKyAxKSAmIG1hc2tdO1xuICAgIH1cbiAgICBrZXlzdG9yZVtpbmRleF0gPSBrZXk7XG4gICAgdmFsc3RvcmVbaW5kZXhdID0gdmFsdWU7XG4gICAgcmV0dXJuIHZhbHVlO1xuICB9XG5cbiAgZnVuY3Rpb24gZ2V0KGtleSwgbWlzc2luZ1ZhbHVlKSB7XG4gICAgdmFyIGluZGV4ID0gaGFzaChrZXkpICYgbWFzayxcbiAgICAgICAgbWF0Y2hLZXkgPSBrZXlzdG9yZVtpbmRleF0sXG4gICAgICAgIGNvbGxpc2lvbnMgPSAwO1xuICAgIHdoaWxlIChtYXRjaEtleSAhPSBrZXlFbXB0eSkge1xuICAgICAgaWYgKGVxdWFsKG1hdGNoS2V5LCBrZXkpKSByZXR1cm4gdmFsc3RvcmVbaW5kZXhdO1xuICAgICAgaWYgKCsrY29sbGlzaW9ucyA+PSBzaXplKSBicmVhaztcbiAgICAgIG1hdGNoS2V5ID0ga2V5c3RvcmVbaW5kZXggPSAoaW5kZXggKyAxKSAmIG1hc2tdO1xuICAgIH1cbiAgICByZXR1cm4gbWlzc2luZ1ZhbHVlO1xuICB9XG5cbiAgZnVuY3Rpb24ga2V5cygpIHtcbiAgICB2YXIga2V5cyA9IFtdO1xuICAgIGZvciAodmFyIGkgPSAwLCBuID0ga2V5c3RvcmUubGVuZ3RoOyBpIDwgbjsgKytpKSB7XG4gICAgICB2YXIgbWF0Y2hLZXkgPSBrZXlzdG9yZVtpXTtcbiAgICAgIGlmIChtYXRjaEtleSAhPSBrZXlFbXB0eSkga2V5cy5wdXNoKG1hdGNoS2V5KTtcbiAgICB9XG4gICAgcmV0dXJuIGtleXM7XG4gIH1cblxuICByZXR1cm4ge1xuICAgIHNldDogc2V0LFxuICAgIG1heWJlU2V0OiBtYXliZVNldCwgLy8gc2V0IGlmIHVuc2V0XG4gICAgZ2V0OiBnZXQsXG4gICAga2V5czoga2V5c1xuICB9O1xufTtcblxudmFyIGVxdWFsUG9pbnQgPSBmdW5jdGlvbihwb2ludEEsIHBvaW50Qikge1xuICByZXR1cm4gcG9pbnRBWzBdID09PSBwb2ludEJbMF0gJiYgcG9pbnRBWzFdID09PSBwb2ludEJbMV07XG59O1xuXG4vLyBUT0RPIGlmIHF1YW50aXplZCwgdXNlIHNpbXBsZXIgSW50MzIgaGFzaGluZz9cblxudmFyIGJ1ZmZlciA9IG5ldyBBcnJheUJ1ZmZlcigxNik7XG52YXIgZmxvYXRzID0gbmV3IEZsb2F0NjRBcnJheShidWZmZXIpO1xudmFyIHVpbnRzID0gbmV3IFVpbnQzMkFycmF5KGJ1ZmZlcik7XG5cbnZhciBoYXNoUG9pbnQgPSBmdW5jdGlvbihwb2ludCkge1xuICBmbG9hdHNbMF0gPSBwb2ludFswXTtcbiAgZmxvYXRzWzFdID0gcG9pbnRbMV07XG4gIHZhciBoYXNoID0gdWludHNbMF0gXiB1aW50c1sxXTtcbiAgaGFzaCA9IGhhc2ggPDwgNSBeIGhhc2ggPj4gNyBeIHVpbnRzWzJdIF4gdWludHNbM107XG4gIHJldHVybiBoYXNoICYgMHg3ZmZmZmZmZjtcbn07XG5cbi8vIEdpdmVuIGFuIGV4dHJhY3RlZCAocHJlLSl0b3BvbG9neSwgaWRlbnRpZmllcyBhbGwgb2YgdGhlIGp1bmN0aW9ucy4gVGhlc2UgYXJlXG4vLyB0aGUgcG9pbnRzIGF0IHdoaWNoIGFyY3MgKGxpbmVzIG9yIHJpbmdzKSB3aWxsIG5lZWQgdG8gYmUgY3V0IHNvIHRoYXQgZWFjaFxuLy8gYXJjIGlzIHJlcHJlc2VudGVkIHVuaXF1ZWx5LlxuLy9cbi8vIEEganVuY3Rpb24gaXMgYSBwb2ludCB3aGVyZSBhdCBsZWFzdCBvbmUgYXJjIGRldmlhdGVzIGZyb20gYW5vdGhlciBhcmMgZ29pbmdcbi8vIHRocm91Z2ggdGhlIHNhbWUgcG9pbnQuIEZvciBleGFtcGxlLCBjb25zaWRlciB0aGUgcG9pbnQgQi4gSWYgdGhlcmUgaXMgYSBhcmNcbi8vIHRocm91Z2ggQUJDIGFuZCBhbm90aGVyIGFyYyB0aHJvdWdoIENCQSwgdGhlbiBCIGlzIG5vdCBhIGp1bmN0aW9uIGJlY2F1c2UgaW5cbi8vIGJvdGggY2FzZXMgdGhlIGFkamFjZW50IHBvaW50IHBhaXJzIGFyZSB7QSxDfS4gSG93ZXZlciwgaWYgdGhlcmUgaXMgYW5cbi8vIGFkZGl0aW9uYWwgYXJjIEFCRCwgdGhlbiB7QSxEfSAhPSB7QSxDfSwgYW5kIHRodXMgQiBiZWNvbWVzIGEganVuY3Rpb24uXG4vL1xuLy8gRm9yIGEgY2xvc2VkIHJpbmcgQUJDQSwgdGhlIGZpcnN0IHBvaW50IEHigJlzIGFkamFjZW50IHBvaW50cyBhcmUgdGhlIHNlY29uZFxuLy8gYW5kIGxhc3QgcG9pbnQge0IsQ30uIEZvciBhIGxpbmUsIHRoZSBmaXJzdCBhbmQgbGFzdCBwb2ludCBhcmUgYWx3YXlzXG4vLyBjb25zaWRlcmVkIGp1bmN0aW9ucywgZXZlbiBpZiB0aGUgbGluZSBpcyBjbG9zZWQ7IHRoaXMgZW5zdXJlcyB0aGF0IGEgY2xvc2VkXG4vLyBsaW5lIGlzIG5ldmVyIHJvdGF0ZWQuXG52YXIgam9pbiA9IGZ1bmN0aW9uKHRvcG9sb2d5KSB7XG4gIHZhciBjb29yZGluYXRlcyA9IHRvcG9sb2d5LmNvb3JkaW5hdGVzLFxuICAgICAgbGluZXMgPSB0b3BvbG9neS5saW5lcyxcbiAgICAgIHJpbmdzID0gdG9wb2xvZ3kucmluZ3MsXG4gICAgICBpbmRleGVzID0gaW5kZXgoKSxcbiAgICAgIHZpc2l0ZWRCeUluZGV4ID0gbmV3IEludDMyQXJyYXkoY29vcmRpbmF0ZXMubGVuZ3RoKSxcbiAgICAgIGxlZnRCeUluZGV4ID0gbmV3IEludDMyQXJyYXkoY29vcmRpbmF0ZXMubGVuZ3RoKSxcbiAgICAgIHJpZ2h0QnlJbmRleCA9IG5ldyBJbnQzMkFycmF5KGNvb3JkaW5hdGVzLmxlbmd0aCksXG4gICAgICBqdW5jdGlvbkJ5SW5kZXggPSBuZXcgSW50OEFycmF5KGNvb3JkaW5hdGVzLmxlbmd0aCksXG4gICAgICBqdW5jdGlvbkNvdW50ID0gMCwgLy8gdXBwZXIgYm91bmQgb24gbnVtYmVyIG9mIGp1bmN0aW9uc1xuICAgICAgaSwgbixcbiAgICAgIHByZXZpb3VzSW5kZXgsXG4gICAgICBjdXJyZW50SW5kZXgsXG4gICAgICBuZXh0SW5kZXg7XG5cbiAgZm9yIChpID0gMCwgbiA9IGNvb3JkaW5hdGVzLmxlbmd0aDsgaSA8IG47ICsraSkge1xuICAgIHZpc2l0ZWRCeUluZGV4W2ldID0gbGVmdEJ5SW5kZXhbaV0gPSByaWdodEJ5SW5kZXhbaV0gPSAtMTtcbiAgfVxuXG4gIGZvciAoaSA9IDAsIG4gPSBsaW5lcy5sZW5ndGg7IGkgPCBuOyArK2kpIHtcbiAgICB2YXIgbGluZSA9IGxpbmVzW2ldLFxuICAgICAgICBsaW5lU3RhcnQgPSBsaW5lWzBdLFxuICAgICAgICBsaW5lRW5kID0gbGluZVsxXTtcbiAgICBjdXJyZW50SW5kZXggPSBpbmRleGVzW2xpbmVTdGFydF07XG4gICAgbmV4dEluZGV4ID0gaW5kZXhlc1srK2xpbmVTdGFydF07XG4gICAgKytqdW5jdGlvbkNvdW50LCBqdW5jdGlvbkJ5SW5kZXhbY3VycmVudEluZGV4XSA9IDE7IC8vIHN0YXJ0XG4gICAgd2hpbGUgKCsrbGluZVN0YXJ0IDw9IGxpbmVFbmQpIHtcbiAgICAgIHNlcXVlbmNlKGksIHByZXZpb3VzSW5kZXggPSBjdXJyZW50SW5kZXgsIGN1cnJlbnRJbmRleCA9IG5leHRJbmRleCwgbmV4dEluZGV4ID0gaW5kZXhlc1tsaW5lU3RhcnRdKTtcbiAgICB9XG4gICAgKytqdW5jdGlvbkNvdW50LCBqdW5jdGlvbkJ5SW5kZXhbbmV4dEluZGV4XSA9IDE7IC8vIGVuZFxuICB9XG5cbiAgZm9yIChpID0gMCwgbiA9IGNvb3JkaW5hdGVzLmxlbmd0aDsgaSA8IG47ICsraSkge1xuICAgIHZpc2l0ZWRCeUluZGV4W2ldID0gLTE7XG4gIH1cblxuICBmb3IgKGkgPSAwLCBuID0gcmluZ3MubGVuZ3RoOyBpIDwgbjsgKytpKSB7XG4gICAgdmFyIHJpbmcgPSByaW5nc1tpXSxcbiAgICAgICAgcmluZ1N0YXJ0ID0gcmluZ1swXSArIDEsXG4gICAgICAgIHJpbmdFbmQgPSByaW5nWzFdO1xuICAgIHByZXZpb3VzSW5kZXggPSBpbmRleGVzW3JpbmdFbmQgLSAxXTtcbiAgICBjdXJyZW50SW5kZXggPSBpbmRleGVzW3JpbmdTdGFydCAtIDFdO1xuICAgIG5leHRJbmRleCA9IGluZGV4ZXNbcmluZ1N0YXJ0XTtcbiAgICBzZXF1ZW5jZShpLCBwcmV2aW91c0luZGV4LCBjdXJyZW50SW5kZXgsIG5leHRJbmRleCk7XG4gICAgd2hpbGUgKCsrcmluZ1N0YXJ0IDw9IHJpbmdFbmQpIHtcbiAgICAgIHNlcXVlbmNlKGksIHByZXZpb3VzSW5kZXggPSBjdXJyZW50SW5kZXgsIGN1cnJlbnRJbmRleCA9IG5leHRJbmRleCwgbmV4dEluZGV4ID0gaW5kZXhlc1tyaW5nU3RhcnRdKTtcbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiBzZXF1ZW5jZShpLCBwcmV2aW91c0luZGV4LCBjdXJyZW50SW5kZXgsIG5leHRJbmRleCkge1xuICAgIGlmICh2aXNpdGVkQnlJbmRleFtjdXJyZW50SW5kZXhdID09PSBpKSByZXR1cm47IC8vIGlnbm9yZSBzZWxmLWludGVyc2VjdGlvblxuICAgIHZpc2l0ZWRCeUluZGV4W2N1cnJlbnRJbmRleF0gPSBpO1xuICAgIHZhciBsZWZ0SW5kZXggPSBsZWZ0QnlJbmRleFtjdXJyZW50SW5kZXhdO1xuICAgIGlmIChsZWZ0SW5kZXggPj0gMCkge1xuICAgICAgdmFyIHJpZ2h0SW5kZXggPSByaWdodEJ5SW5kZXhbY3VycmVudEluZGV4XTtcbiAgICAgIGlmICgobGVmdEluZGV4ICE9PSBwcmV2aW91c0luZGV4IHx8IHJpZ2h0SW5kZXggIT09IG5leHRJbmRleClcbiAgICAgICAgJiYgKGxlZnRJbmRleCAhPT0gbmV4dEluZGV4IHx8IHJpZ2h0SW5kZXggIT09IHByZXZpb3VzSW5kZXgpKSB7XG4gICAgICAgICsranVuY3Rpb25Db3VudCwganVuY3Rpb25CeUluZGV4W2N1cnJlbnRJbmRleF0gPSAxO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBsZWZ0QnlJbmRleFtjdXJyZW50SW5kZXhdID0gcHJldmlvdXNJbmRleDtcbiAgICAgIHJpZ2h0QnlJbmRleFtjdXJyZW50SW5kZXhdID0gbmV4dEluZGV4O1xuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIGluZGV4KCkge1xuICAgIHZhciBpbmRleEJ5UG9pbnQgPSBoYXNobWFwKGNvb3JkaW5hdGVzLmxlbmd0aCAqIDEuNCwgaGFzaEluZGV4LCBlcXVhbEluZGV4LCBJbnQzMkFycmF5LCAtMSwgSW50MzJBcnJheSksXG4gICAgICAgIGluZGV4ZXMgPSBuZXcgSW50MzJBcnJheShjb29yZGluYXRlcy5sZW5ndGgpO1xuXG4gICAgZm9yICh2YXIgaSA9IDAsIG4gPSBjb29yZGluYXRlcy5sZW5ndGg7IGkgPCBuOyArK2kpIHtcbiAgICAgIGluZGV4ZXNbaV0gPSBpbmRleEJ5UG9pbnQubWF5YmVTZXQoaSwgaSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIGluZGV4ZXM7XG4gIH1cblxuICBmdW5jdGlvbiBoYXNoSW5kZXgoaSkge1xuICAgIHJldHVybiBoYXNoUG9pbnQoY29vcmRpbmF0ZXNbaV0pO1xuICB9XG5cbiAgZnVuY3Rpb24gZXF1YWxJbmRleChpLCBqKSB7XG4gICAgcmV0dXJuIGVxdWFsUG9pbnQoY29vcmRpbmF0ZXNbaV0sIGNvb3JkaW5hdGVzW2pdKTtcbiAgfVxuXG4gIHZpc2l0ZWRCeUluZGV4ID0gbGVmdEJ5SW5kZXggPSByaWdodEJ5SW5kZXggPSBudWxsO1xuXG4gIHZhciBqdW5jdGlvbkJ5UG9pbnQgPSBoYXNoc2V0KGp1bmN0aW9uQ291bnQgKiAxLjQsIGhhc2hQb2ludCwgZXF1YWxQb2ludCksIGo7XG5cbiAgLy8gQ29udmVydCBiYWNrIHRvIGEgc3RhbmRhcmQgaGFzaHNldCBieSBwb2ludCBmb3IgY2FsbGVyIGNvbnZlbmllbmNlLlxuICBmb3IgKGkgPSAwLCBuID0gY29vcmRpbmF0ZXMubGVuZ3RoOyBpIDwgbjsgKytpKSB7XG4gICAgaWYgKGp1bmN0aW9uQnlJbmRleFtqID0gaW5kZXhlc1tpXV0pIHtcbiAgICAgIGp1bmN0aW9uQnlQb2ludC5hZGQoY29vcmRpbmF0ZXNbal0pO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiBqdW5jdGlvbkJ5UG9pbnQ7XG59O1xuXG4vLyBHaXZlbiBhbiBleHRyYWN0ZWQgKHByZS0pdG9wb2xvZ3ksIGN1dHMgKG9yIHJvdGF0ZXMpIGFyY3Mgc28gdGhhdCBhbGwgc2hhcmVkXG4vLyBwb2ludCBzZXF1ZW5jZXMgYXJlIGlkZW50aWZpZWQuIFRoZSB0b3BvbG9neSBjYW4gdGhlbiBiZSBzdWJzZXF1ZW50bHkgZGVkdXBlZFxuLy8gdG8gcmVtb3ZlIGV4YWN0IGR1cGxpY2F0ZSBhcmNzLlxudmFyIGN1dCA9IGZ1bmN0aW9uKHRvcG9sb2d5KSB7XG4gIHZhciBqdW5jdGlvbnMgPSBqb2luKHRvcG9sb2d5KSxcbiAgICAgIGNvb3JkaW5hdGVzID0gdG9wb2xvZ3kuY29vcmRpbmF0ZXMsXG4gICAgICBsaW5lcyA9IHRvcG9sb2d5LmxpbmVzLFxuICAgICAgcmluZ3MgPSB0b3BvbG9neS5yaW5ncyxcbiAgICAgIG5leHQsXG4gICAgICBpLCBuO1xuXG4gIGZvciAoaSA9IDAsIG4gPSBsaW5lcy5sZW5ndGg7IGkgPCBuOyArK2kpIHtcbiAgICB2YXIgbGluZSA9IGxpbmVzW2ldLFxuICAgICAgICBsaW5lTWlkID0gbGluZVswXSxcbiAgICAgICAgbGluZUVuZCA9IGxpbmVbMV07XG4gICAgd2hpbGUgKCsrbGluZU1pZCA8IGxpbmVFbmQpIHtcbiAgICAgIGlmIChqdW5jdGlvbnMuaGFzKGNvb3JkaW5hdGVzW2xpbmVNaWRdKSkge1xuICAgICAgICBuZXh0ID0gezA6IGxpbmVNaWQsIDE6IGxpbmVbMV19O1xuICAgICAgICBsaW5lWzFdID0gbGluZU1pZDtcbiAgICAgICAgbGluZSA9IGxpbmUubmV4dCA9IG5leHQ7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgZm9yIChpID0gMCwgbiA9IHJpbmdzLmxlbmd0aDsgaSA8IG47ICsraSkge1xuICAgIHZhciByaW5nID0gcmluZ3NbaV0sXG4gICAgICAgIHJpbmdTdGFydCA9IHJpbmdbMF0sXG4gICAgICAgIHJpbmdNaWQgPSByaW5nU3RhcnQsXG4gICAgICAgIHJpbmdFbmQgPSByaW5nWzFdLFxuICAgICAgICByaW5nRml4ZWQgPSBqdW5jdGlvbnMuaGFzKGNvb3JkaW5hdGVzW3JpbmdTdGFydF0pO1xuICAgIHdoaWxlICgrK3JpbmdNaWQgPCByaW5nRW5kKSB7XG4gICAgICBpZiAoanVuY3Rpb25zLmhhcyhjb29yZGluYXRlc1tyaW5nTWlkXSkpIHtcbiAgICAgICAgaWYgKHJpbmdGaXhlZCkge1xuICAgICAgICAgIG5leHQgPSB7MDogcmluZ01pZCwgMTogcmluZ1sxXX07XG4gICAgICAgICAgcmluZ1sxXSA9IHJpbmdNaWQ7XG4gICAgICAgICAgcmluZyA9IHJpbmcubmV4dCA9IG5leHQ7XG4gICAgICAgIH0gZWxzZSB7IC8vIEZvciB0aGUgZmlyc3QganVuY3Rpb24sIHdlIGNhbiByb3RhdGUgcmF0aGVyIHRoYW4gY3V0LlxuICAgICAgICAgIHJvdGF0ZUFycmF5KGNvb3JkaW5hdGVzLCByaW5nU3RhcnQsIHJpbmdFbmQsIHJpbmdFbmQgLSByaW5nTWlkKTtcbiAgICAgICAgICBjb29yZGluYXRlc1tyaW5nRW5kXSA9IGNvb3JkaW5hdGVzW3JpbmdTdGFydF07XG4gICAgICAgICAgcmluZ0ZpeGVkID0gdHJ1ZTtcbiAgICAgICAgICByaW5nTWlkID0gcmluZ1N0YXJ0OyAvLyByZXN0YXJ0OyB3ZSBtYXkgaGF2ZSBza2lwcGVkIGp1bmN0aW9uc1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIHRvcG9sb2d5O1xufTtcblxuZnVuY3Rpb24gcm90YXRlQXJyYXkoYXJyYXksIHN0YXJ0LCBlbmQsIG9mZnNldCkge1xuICByZXZlcnNlKGFycmF5LCBzdGFydCwgZW5kKTtcbiAgcmV2ZXJzZShhcnJheSwgc3RhcnQsIHN0YXJ0ICsgb2Zmc2V0KTtcbiAgcmV2ZXJzZShhcnJheSwgc3RhcnQgKyBvZmZzZXQsIGVuZCk7XG59XG5cbmZ1bmN0aW9uIHJldmVyc2UoYXJyYXksIHN0YXJ0LCBlbmQpIHtcbiAgZm9yICh2YXIgbWlkID0gc3RhcnQgKyAoKGVuZC0tIC0gc3RhcnQpID4+IDEpLCB0OyBzdGFydCA8IG1pZDsgKytzdGFydCwgLS1lbmQpIHtcbiAgICB0ID0gYXJyYXlbc3RhcnRdLCBhcnJheVtzdGFydF0gPSBhcnJheVtlbmRdLCBhcnJheVtlbmRdID0gdDtcbiAgfVxufVxuXG4vLyBHaXZlbiBhIGN1dCB0b3BvbG9neSwgY29tYmluZXMgZHVwbGljYXRlIGFyY3MuXG52YXIgZGVkdXAgPSBmdW5jdGlvbih0b3BvbG9neSkge1xuICB2YXIgY29vcmRpbmF0ZXMgPSB0b3BvbG9neS5jb29yZGluYXRlcyxcbiAgICAgIGxpbmVzID0gdG9wb2xvZ3kubGluZXMsIGxpbmUsXG4gICAgICByaW5ncyA9IHRvcG9sb2d5LnJpbmdzLCByaW5nLFxuICAgICAgYXJjQ291bnQgPSBsaW5lcy5sZW5ndGggKyByaW5ncy5sZW5ndGgsXG4gICAgICBpLCBuO1xuXG4gIGRlbGV0ZSB0b3BvbG9neS5saW5lcztcbiAgZGVsZXRlIHRvcG9sb2d5LnJpbmdzO1xuXG4gIC8vIENvdW50IHRoZSBudW1iZXIgb2YgKG5vbi11bmlxdWUpIGFyY3MgdG8gaW5pdGlhbGl6ZSB0aGUgaGFzaG1hcCBzYWZlbHkuXG4gIGZvciAoaSA9IDAsIG4gPSBsaW5lcy5sZW5ndGg7IGkgPCBuOyArK2kpIHtcbiAgICBsaW5lID0gbGluZXNbaV07IHdoaWxlIChsaW5lID0gbGluZS5uZXh0KSArK2FyY0NvdW50O1xuICB9XG4gIGZvciAoaSA9IDAsIG4gPSByaW5ncy5sZW5ndGg7IGkgPCBuOyArK2kpIHtcbiAgICByaW5nID0gcmluZ3NbaV07IHdoaWxlIChyaW5nID0gcmluZy5uZXh0KSArK2FyY0NvdW50O1xuICB9XG5cbiAgdmFyIGFyY3NCeUVuZCA9IGhhc2htYXAoYXJjQ291bnQgKiAyICogMS40LCBoYXNoUG9pbnQsIGVxdWFsUG9pbnQpLFxuICAgICAgYXJjcyA9IHRvcG9sb2d5LmFyY3MgPSBbXTtcblxuICBmb3IgKGkgPSAwLCBuID0gbGluZXMubGVuZ3RoOyBpIDwgbjsgKytpKSB7XG4gICAgbGluZSA9IGxpbmVzW2ldO1xuICAgIGRvIHtcbiAgICAgIGRlZHVwTGluZShsaW5lKTtcbiAgICB9IHdoaWxlIChsaW5lID0gbGluZS5uZXh0KTtcbiAgfVxuXG4gIGZvciAoaSA9IDAsIG4gPSByaW5ncy5sZW5ndGg7IGkgPCBuOyArK2kpIHtcbiAgICByaW5nID0gcmluZ3NbaV07XG4gICAgaWYgKHJpbmcubmV4dCkgeyAvLyBhcmMgaXMgbm8gbG9uZ2VyIGNsb3NlZFxuICAgICAgZG8ge1xuICAgICAgICBkZWR1cExpbmUocmluZyk7XG4gICAgICB9IHdoaWxlIChyaW5nID0gcmluZy5uZXh0KTtcbiAgICB9IGVsc2Uge1xuICAgICAgZGVkdXBSaW5nKHJpbmcpO1xuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIGRlZHVwTGluZShhcmMpIHtcbiAgICB2YXIgc3RhcnRQb2ludCxcbiAgICAgICAgZW5kUG9pbnQsXG4gICAgICAgIHN0YXJ0QXJjcywgc3RhcnRBcmMsXG4gICAgICAgIGVuZEFyY3MsIGVuZEFyYyxcbiAgICAgICAgaSwgbjtcblxuICAgIC8vIERvZXMgdGhpcyBhcmMgbWF0Y2ggYW4gZXhpc3RpbmcgYXJjIGluIG9yZGVyP1xuICAgIGlmIChzdGFydEFyY3MgPSBhcmNzQnlFbmQuZ2V0KHN0YXJ0UG9pbnQgPSBjb29yZGluYXRlc1thcmNbMF1dKSkge1xuICAgICAgZm9yIChpID0gMCwgbiA9IHN0YXJ0QXJjcy5sZW5ndGg7IGkgPCBuOyArK2kpIHtcbiAgICAgICAgc3RhcnRBcmMgPSBzdGFydEFyY3NbaV07XG4gICAgICAgIGlmIChlcXVhbExpbmUoc3RhcnRBcmMsIGFyYykpIHtcbiAgICAgICAgICBhcmNbMF0gPSBzdGFydEFyY1swXTtcbiAgICAgICAgICBhcmNbMV0gPSBzdGFydEFyY1sxXTtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBEb2VzIHRoaXMgYXJjIG1hdGNoIGFuIGV4aXN0aW5nIGFyYyBpbiByZXZlcnNlIG9yZGVyP1xuICAgIGlmIChlbmRBcmNzID0gYXJjc0J5RW5kLmdldChlbmRQb2ludCA9IGNvb3JkaW5hdGVzW2FyY1sxXV0pKSB7XG4gICAgICBmb3IgKGkgPSAwLCBuID0gZW5kQXJjcy5sZW5ndGg7IGkgPCBuOyArK2kpIHtcbiAgICAgICAgZW5kQXJjID0gZW5kQXJjc1tpXTtcbiAgICAgICAgaWYgKHJldmVyc2VFcXVhbExpbmUoZW5kQXJjLCBhcmMpKSB7XG4gICAgICAgICAgYXJjWzFdID0gZW5kQXJjWzBdO1xuICAgICAgICAgIGFyY1swXSA9IGVuZEFyY1sxXTtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAoc3RhcnRBcmNzKSBzdGFydEFyY3MucHVzaChhcmMpOyBlbHNlIGFyY3NCeUVuZC5zZXQoc3RhcnRQb2ludCwgW2FyY10pO1xuICAgIGlmIChlbmRBcmNzKSBlbmRBcmNzLnB1c2goYXJjKTsgZWxzZSBhcmNzQnlFbmQuc2V0KGVuZFBvaW50LCBbYXJjXSk7XG4gICAgYXJjcy5wdXNoKGFyYyk7XG4gIH1cblxuICBmdW5jdGlvbiBkZWR1cFJpbmcoYXJjKSB7XG4gICAgdmFyIGVuZFBvaW50LFxuICAgICAgICBlbmRBcmNzLFxuICAgICAgICBlbmRBcmMsXG4gICAgICAgIGksIG47XG5cbiAgICAvLyBEb2VzIHRoaXMgYXJjIG1hdGNoIGFuIGV4aXN0aW5nIGxpbmUgaW4gb3JkZXIsIG9yIHJldmVyc2Ugb3JkZXI/XG4gICAgLy8gUmluZ3MgYXJlIGNsb3NlZCwgc28gdGhlaXIgc3RhcnQgcG9pbnQgYW5kIGVuZCBwb2ludCBpcyB0aGUgc2FtZS5cbiAgICBpZiAoZW5kQXJjcyA9IGFyY3NCeUVuZC5nZXQoZW5kUG9pbnQgPSBjb29yZGluYXRlc1thcmNbMF1dKSkge1xuICAgICAgZm9yIChpID0gMCwgbiA9IGVuZEFyY3MubGVuZ3RoOyBpIDwgbjsgKytpKSB7XG4gICAgICAgIGVuZEFyYyA9IGVuZEFyY3NbaV07XG4gICAgICAgIGlmIChlcXVhbFJpbmcoZW5kQXJjLCBhcmMpKSB7XG4gICAgICAgICAgYXJjWzBdID0gZW5kQXJjWzBdO1xuICAgICAgICAgIGFyY1sxXSA9IGVuZEFyY1sxXTtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHJldmVyc2VFcXVhbFJpbmcoZW5kQXJjLCBhcmMpKSB7XG4gICAgICAgICAgYXJjWzBdID0gZW5kQXJjWzFdO1xuICAgICAgICAgIGFyY1sxXSA9IGVuZEFyY1swXTtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBPdGhlcndpc2UsIGRvZXMgdGhpcyBhcmMgbWF0Y2ggYW4gZXhpc3RpbmcgcmluZyBpbiBvcmRlciwgb3IgcmV2ZXJzZSBvcmRlcj9cbiAgICBpZiAoZW5kQXJjcyA9IGFyY3NCeUVuZC5nZXQoZW5kUG9pbnQgPSBjb29yZGluYXRlc1thcmNbMF0gKyBmaW5kTWluaW11bU9mZnNldChhcmMpXSkpIHtcbiAgICAgIGZvciAoaSA9IDAsIG4gPSBlbmRBcmNzLmxlbmd0aDsgaSA8IG47ICsraSkge1xuICAgICAgICBlbmRBcmMgPSBlbmRBcmNzW2ldO1xuICAgICAgICBpZiAoZXF1YWxSaW5nKGVuZEFyYywgYXJjKSkge1xuICAgICAgICAgIGFyY1swXSA9IGVuZEFyY1swXTtcbiAgICAgICAgICBhcmNbMV0gPSBlbmRBcmNbMV07XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGlmIChyZXZlcnNlRXF1YWxSaW5nKGVuZEFyYywgYXJjKSkge1xuICAgICAgICAgIGFyY1swXSA9IGVuZEFyY1sxXTtcbiAgICAgICAgICBhcmNbMV0gPSBlbmRBcmNbMF07XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKGVuZEFyY3MpIGVuZEFyY3MucHVzaChhcmMpOyBlbHNlIGFyY3NCeUVuZC5zZXQoZW5kUG9pbnQsIFthcmNdKTtcbiAgICBhcmNzLnB1c2goYXJjKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGVxdWFsTGluZShhcmNBLCBhcmNCKSB7XG4gICAgdmFyIGlhID0gYXJjQVswXSwgaWIgPSBhcmNCWzBdLFxuICAgICAgICBqYSA9IGFyY0FbMV0sIGpiID0gYXJjQlsxXTtcbiAgICBpZiAoaWEgLSBqYSAhPT0gaWIgLSBqYikgcmV0dXJuIGZhbHNlO1xuICAgIGZvciAoOyBpYSA8PSBqYTsgKytpYSwgKytpYikgaWYgKCFlcXVhbFBvaW50KGNvb3JkaW5hdGVzW2lhXSwgY29vcmRpbmF0ZXNbaWJdKSkgcmV0dXJuIGZhbHNlO1xuICAgIHJldHVybiB0cnVlO1xuICB9XG5cbiAgZnVuY3Rpb24gcmV2ZXJzZUVxdWFsTGluZShhcmNBLCBhcmNCKSB7XG4gICAgdmFyIGlhID0gYXJjQVswXSwgaWIgPSBhcmNCWzBdLFxuICAgICAgICBqYSA9IGFyY0FbMV0sIGpiID0gYXJjQlsxXTtcbiAgICBpZiAoaWEgLSBqYSAhPT0gaWIgLSBqYikgcmV0dXJuIGZhbHNlO1xuICAgIGZvciAoOyBpYSA8PSBqYTsgKytpYSwgLS1qYikgaWYgKCFlcXVhbFBvaW50KGNvb3JkaW5hdGVzW2lhXSwgY29vcmRpbmF0ZXNbamJdKSkgcmV0dXJuIGZhbHNlO1xuICAgIHJldHVybiB0cnVlO1xuICB9XG5cbiAgZnVuY3Rpb24gZXF1YWxSaW5nKGFyY0EsIGFyY0IpIHtcbiAgICB2YXIgaWEgPSBhcmNBWzBdLCBpYiA9IGFyY0JbMF0sXG4gICAgICAgIGphID0gYXJjQVsxXSwgamIgPSBhcmNCWzFdLFxuICAgICAgICBuID0gamEgLSBpYTtcbiAgICBpZiAobiAhPT0gamIgLSBpYikgcmV0dXJuIGZhbHNlO1xuICAgIHZhciBrYSA9IGZpbmRNaW5pbXVtT2Zmc2V0KGFyY0EpLFxuICAgICAgICBrYiA9IGZpbmRNaW5pbXVtT2Zmc2V0KGFyY0IpO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbjsgKytpKSB7XG4gICAgICBpZiAoIWVxdWFsUG9pbnQoY29vcmRpbmF0ZXNbaWEgKyAoaSArIGthKSAlIG5dLCBjb29yZGluYXRlc1tpYiArIChpICsga2IpICUgbl0pKSByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIHJldHVybiB0cnVlO1xuICB9XG5cbiAgZnVuY3Rpb24gcmV2ZXJzZUVxdWFsUmluZyhhcmNBLCBhcmNCKSB7XG4gICAgdmFyIGlhID0gYXJjQVswXSwgaWIgPSBhcmNCWzBdLFxuICAgICAgICBqYSA9IGFyY0FbMV0sIGpiID0gYXJjQlsxXSxcbiAgICAgICAgbiA9IGphIC0gaWE7XG4gICAgaWYgKG4gIT09IGpiIC0gaWIpIHJldHVybiBmYWxzZTtcbiAgICB2YXIga2EgPSBmaW5kTWluaW11bU9mZnNldChhcmNBKSxcbiAgICAgICAga2IgPSBuIC0gZmluZE1pbmltdW1PZmZzZXQoYXJjQik7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBuOyArK2kpIHtcbiAgICAgIGlmICghZXF1YWxQb2ludChjb29yZGluYXRlc1tpYSArIChpICsga2EpICUgbl0sIGNvb3JkaW5hdGVzW2piIC0gKGkgKyBrYikgJSBuXSkpIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cblxuICAvLyBSaW5ncyBhcmUgcm90YXRlZCB0byBhIGNvbnNpc3RlbnQsIGJ1dCBhcmJpdHJhcnksIHN0YXJ0IHBvaW50LlxuICAvLyBUaGlzIGlzIG5lY2Vzc2FyeSB0byBkZXRlY3Qgd2hlbiBhIHJpbmcgYW5kIGEgcm90YXRlZCBjb3B5IGFyZSBkdXBlcy5cbiAgZnVuY3Rpb24gZmluZE1pbmltdW1PZmZzZXQoYXJjKSB7XG4gICAgdmFyIHN0YXJ0ID0gYXJjWzBdLFxuICAgICAgICBlbmQgPSBhcmNbMV0sXG4gICAgICAgIG1pZCA9IHN0YXJ0LFxuICAgICAgICBtaW5pbXVtID0gbWlkLFxuICAgICAgICBtaW5pbXVtUG9pbnQgPSBjb29yZGluYXRlc1ttaWRdO1xuICAgIHdoaWxlICgrK21pZCA8IGVuZCkge1xuICAgICAgdmFyIHBvaW50ID0gY29vcmRpbmF0ZXNbbWlkXTtcbiAgICAgIGlmIChwb2ludFswXSA8IG1pbmltdW1Qb2ludFswXSB8fCBwb2ludFswXSA9PT0gbWluaW11bVBvaW50WzBdICYmIHBvaW50WzFdIDwgbWluaW11bVBvaW50WzFdKSB7XG4gICAgICAgIG1pbmltdW0gPSBtaWQ7XG4gICAgICAgIG1pbmltdW1Qb2ludCA9IHBvaW50O1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gbWluaW11bSAtIHN0YXJ0O1xuICB9XG5cbiAgcmV0dXJuIHRvcG9sb2d5O1xufTtcblxuLy8gR2l2ZW4gYW4gYXJyYXkgb2YgYXJjcyBpbiBhYnNvbHV0ZSAoYnV0IGFscmVhZHkgcXVhbnRpemVkISkgY29vcmRpbmF0ZXMsXG4vLyBjb252ZXJ0cyB0byBmaXhlZC1wb2ludCBkZWx0YSBlbmNvZGluZy5cbi8vIFRoaXMgaXMgYSBkZXN0cnVjdGl2ZSBvcGVyYXRpb24gdGhhdCBtb2RpZmllcyB0aGUgZ2l2ZW4gYXJjcyFcbnZhciBkZWx0YSA9IGZ1bmN0aW9uKGFyY3MpIHtcbiAgdmFyIGkgPSAtMSxcbiAgICAgIG4gPSBhcmNzLmxlbmd0aDtcblxuICB3aGlsZSAoKytpIDwgbikge1xuICAgIHZhciBhcmMgPSBhcmNzW2ldLFxuICAgICAgICBqID0gMCxcbiAgICAgICAgayA9IDEsXG4gICAgICAgIG0gPSBhcmMubGVuZ3RoLFxuICAgICAgICBwb2ludCA9IGFyY1swXSxcbiAgICAgICAgeDAgPSBwb2ludFswXSxcbiAgICAgICAgeTAgPSBwb2ludFsxXSxcbiAgICAgICAgeDEsXG4gICAgICAgIHkxO1xuXG4gICAgd2hpbGUgKCsraiA8IG0pIHtcbiAgICAgIHBvaW50ID0gYXJjW2pdLCB4MSA9IHBvaW50WzBdLCB5MSA9IHBvaW50WzFdO1xuICAgICAgaWYgKHgxICE9PSB4MCB8fCB5MSAhPT0geTApIGFyY1trKytdID0gW3gxIC0geDAsIHkxIC0geTBdLCB4MCA9IHgxLCB5MCA9IHkxO1xuICAgIH1cblxuICAgIGlmIChrID09PSAxKSBhcmNbaysrXSA9IFswLCAwXTsgLy8gRWFjaCBhcmMgbXVzdCBiZSBhbiBhcnJheSBvZiB0d28gb3IgbW9yZSBwb3NpdGlvbnMuXG5cbiAgICBhcmMubGVuZ3RoID0gaztcbiAgfVxuXG4gIHJldHVybiBhcmNzO1xufTtcblxuLy8gRXh0cmFjdHMgdGhlIGxpbmVzIGFuZCByaW5ncyBmcm9tIHRoZSBzcGVjaWZpZWQgaGFzaCBvZiBnZW9tZXRyeSBvYmplY3RzLlxuLy9cbi8vIFJldHVybnMgYW4gb2JqZWN0IHdpdGggdGhyZWUgcHJvcGVydGllczpcbi8vXG4vLyAqIGNvb3JkaW5hdGVzIC0gc2hhcmVkIGJ1ZmZlciBvZiBbeCwgeV0gY29vcmRpbmF0ZXNcbi8vICogbGluZXMgLSBsaW5lcyBleHRyYWN0ZWQgZnJvbSB0aGUgaGFzaCwgb2YgdGhlIGZvcm0gW3N0YXJ0LCBlbmRdXG4vLyAqIHJpbmdzIC0gcmluZ3MgZXh0cmFjdGVkIGZyb20gdGhlIGhhc2gsIG9mIHRoZSBmb3JtIFtzdGFydCwgZW5kXVxuLy9cbi8vIEZvciBlYWNoIHJpbmcgb3IgbGluZSwgc3RhcnQgYW5kIGVuZCByZXByZXNlbnQgaW5jbHVzaXZlIGluZGV4ZXMgaW50byB0aGVcbi8vIGNvb3JkaW5hdGVzIGJ1ZmZlci4gRm9yIHJpbmdzIChhbmQgY2xvc2VkIGxpbmVzKSwgY29vcmRpbmF0ZXNbc3RhcnRdIGVxdWFsc1xuLy8gY29vcmRpbmF0ZXNbZW5kXS5cbi8vXG4vLyBGb3IgZWFjaCBsaW5lIG9yIHBvbHlnb24gZ2VvbWV0cnkgaW4gdGhlIGlucHV0IGhhc2gsIGluY2x1ZGluZyBuZXN0ZWRcbi8vIGdlb21ldHJpZXMgYXMgaW4gZ2VvbWV0cnkgY29sbGVjdGlvbnMsIHRoZSBgY29vcmRpbmF0ZXNgIGFycmF5IGlzIHJlcGxhY2VkXG4vLyB3aXRoIGFuIGVxdWl2YWxlbnQgYGFyY3NgIGFycmF5IHRoYXQsIGZvciBlYWNoIGxpbmUgKGZvciBsaW5lIHN0cmluZ1xuLy8gZ2VvbWV0cmllcykgb3IgcmluZyAoZm9yIHBvbHlnb24gZ2VvbWV0cmllcyksIHBvaW50cyB0byBvbmUgb2YgdGhlIGFib3ZlXG4vLyBsaW5lcyBvciByaW5ncy5cbnZhciBleHRyYWN0ID0gZnVuY3Rpb24ob2JqZWN0cykge1xuICB2YXIgaW5kZXggPSAtMSxcbiAgICAgIGxpbmVzID0gW10sXG4gICAgICByaW5ncyA9IFtdLFxuICAgICAgY29vcmRpbmF0ZXMgPSBbXTtcblxuICBmdW5jdGlvbiBleHRyYWN0R2VvbWV0cnkoZ2VvbWV0cnkpIHtcbiAgICBpZiAoZ2VvbWV0cnkgJiYgZXh0cmFjdEdlb21ldHJ5VHlwZS5oYXNPd25Qcm9wZXJ0eShnZW9tZXRyeS50eXBlKSkgZXh0cmFjdEdlb21ldHJ5VHlwZVtnZW9tZXRyeS50eXBlXShnZW9tZXRyeSk7XG4gIH1cblxuICB2YXIgZXh0cmFjdEdlb21ldHJ5VHlwZSA9IHtcbiAgICBHZW9tZXRyeUNvbGxlY3Rpb246IGZ1bmN0aW9uKG8pIHsgby5nZW9tZXRyaWVzLmZvckVhY2goZXh0cmFjdEdlb21ldHJ5KTsgfSxcbiAgICBMaW5lU3RyaW5nOiBmdW5jdGlvbihvKSB7IG8uYXJjcyA9IGV4dHJhY3RMaW5lKG8uYXJjcyk7IH0sXG4gICAgTXVsdGlMaW5lU3RyaW5nOiBmdW5jdGlvbihvKSB7IG8uYXJjcyA9IG8uYXJjcy5tYXAoZXh0cmFjdExpbmUpOyB9LFxuICAgIFBvbHlnb246IGZ1bmN0aW9uKG8pIHsgby5hcmNzID0gby5hcmNzLm1hcChleHRyYWN0UmluZyk7IH0sXG4gICAgTXVsdGlQb2x5Z29uOiBmdW5jdGlvbihvKSB7IG8uYXJjcyA9IG8uYXJjcy5tYXAoZXh0cmFjdE11bHRpUmluZyk7IH1cbiAgfTtcblxuICBmdW5jdGlvbiBleHRyYWN0TGluZShsaW5lKSB7XG4gICAgZm9yICh2YXIgaSA9IDAsIG4gPSBsaW5lLmxlbmd0aDsgaSA8IG47ICsraSkgY29vcmRpbmF0ZXNbKytpbmRleF0gPSBsaW5lW2ldO1xuICAgIHZhciBhcmMgPSB7MDogaW5kZXggLSBuICsgMSwgMTogaW5kZXh9O1xuICAgIGxpbmVzLnB1c2goYXJjKTtcbiAgICByZXR1cm4gYXJjO1xuICB9XG5cbiAgZnVuY3Rpb24gZXh0cmFjdFJpbmcocmluZykge1xuICAgIGZvciAodmFyIGkgPSAwLCBuID0gcmluZy5sZW5ndGg7IGkgPCBuOyArK2kpIGNvb3JkaW5hdGVzWysraW5kZXhdID0gcmluZ1tpXTtcbiAgICB2YXIgYXJjID0gezA6IGluZGV4IC0gbiArIDEsIDE6IGluZGV4fTtcbiAgICByaW5ncy5wdXNoKGFyYyk7XG4gICAgcmV0dXJuIGFyYztcbiAgfVxuXG4gIGZ1bmN0aW9uIGV4dHJhY3RNdWx0aVJpbmcocmluZ3MpIHtcbiAgICByZXR1cm4gcmluZ3MubWFwKGV4dHJhY3RSaW5nKTtcbiAgfVxuXG4gIGZvciAodmFyIGtleSBpbiBvYmplY3RzKSB7XG4gICAgZXh0cmFjdEdlb21ldHJ5KG9iamVjdHNba2V5XSk7XG4gIH1cblxuICByZXR1cm4ge1xuICAgIHR5cGU6IFwiVG9wb2xvZ3lcIixcbiAgICBjb29yZGluYXRlczogY29vcmRpbmF0ZXMsXG4gICAgbGluZXM6IGxpbmVzLFxuICAgIHJpbmdzOiByaW5ncyxcbiAgICBvYmplY3RzOiBvYmplY3RzXG4gIH07XG59O1xuXG4vLyBHaXZlbiBhIGhhc2ggb2YgR2VvSlNPTiBvYmplY3RzLCByZXR1cm5zIGEgaGFzaCBvZiBHZW9KU09OIGdlb21ldHJ5IG9iamVjdHMuXG4vLyBBbnkgbnVsbCBpbnB1dCBnZW9tZXRyeSBvYmplY3RzIGFyZSByZXByZXNlbnRlZCBhcyB7dHlwZTogbnVsbH0gaW4gdGhlIG91dHB1dC5cbi8vIEFueSBmZWF0dXJlLntpZCxwcm9wZXJ0aWVzLGJib3h9IGFyZSB0cmFuc2ZlcnJlZCB0byB0aGUgb3V0cHV0IGdlb21ldHJ5IG9iamVjdC5cbi8vIEVhY2ggb3V0cHV0IGdlb21ldHJ5IG9iamVjdCBpcyBhIHNoYWxsb3cgY29weSBvZiB0aGUgaW5wdXQgKGUuZy4sIHByb3BlcnRpZXMsIGNvb3JkaW5hdGVzKSFcbnZhciBnZW9tZXRyeSA9IGZ1bmN0aW9uKGlucHV0cykge1xuICB2YXIgb3V0cHV0cyA9IHt9LCBrZXk7XG4gIGZvciAoa2V5IGluIGlucHV0cykgb3V0cHV0c1trZXldID0gZ2VvbWlmeU9iamVjdChpbnB1dHNba2V5XSk7XG4gIHJldHVybiBvdXRwdXRzO1xufTtcblxuZnVuY3Rpb24gZ2VvbWlmeU9iamVjdChpbnB1dCkge1xuICByZXR1cm4gaW5wdXQgPT0gbnVsbCA/IHt0eXBlOiBudWxsfVxuICAgICAgOiAoaW5wdXQudHlwZSA9PT0gXCJGZWF0dXJlQ29sbGVjdGlvblwiID8gZ2VvbWlmeUZlYXR1cmVDb2xsZWN0aW9uXG4gICAgICA6IGlucHV0LnR5cGUgPT09IFwiRmVhdHVyZVwiID8gZ2VvbWlmeUZlYXR1cmVcbiAgICAgIDogZ2VvbWlmeUdlb21ldHJ5KShpbnB1dCk7XG59XG5cbmZ1bmN0aW9uIGdlb21pZnlGZWF0dXJlQ29sbGVjdGlvbihpbnB1dCkge1xuICB2YXIgb3V0cHV0ID0ge3R5cGU6IFwiR2VvbWV0cnlDb2xsZWN0aW9uXCIsIGdlb21ldHJpZXM6IGlucHV0LmZlYXR1cmVzLm1hcChnZW9taWZ5RmVhdHVyZSl9O1xuICBpZiAoaW5wdXQuYmJveCAhPSBudWxsKSBvdXRwdXQuYmJveCA9IGlucHV0LmJib3g7XG4gIHJldHVybiBvdXRwdXQ7XG59XG5cbmZ1bmN0aW9uIGdlb21pZnlGZWF0dXJlKGlucHV0KSB7XG4gIHZhciBvdXRwdXQgPSBnZW9taWZ5R2VvbWV0cnkoaW5wdXQuZ2VvbWV0cnkpLCBrZXk7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbm8tdW51c2VkLXZhcnNcbiAgaWYgKGlucHV0LmlkICE9IG51bGwpIG91dHB1dC5pZCA9IGlucHV0LmlkO1xuICBpZiAoaW5wdXQuYmJveCAhPSBudWxsKSBvdXRwdXQuYmJveCA9IGlucHV0LmJib3g7XG4gIGZvciAoa2V5IGluIGlucHV0LnByb3BlcnRpZXMpIHsgb3V0cHV0LnByb3BlcnRpZXMgPSBpbnB1dC5wcm9wZXJ0aWVzOyBicmVhazsgfVxuICByZXR1cm4gb3V0cHV0O1xufVxuXG5mdW5jdGlvbiBnZW9taWZ5R2VvbWV0cnkoaW5wdXQpIHtcbiAgaWYgKGlucHV0ID09IG51bGwpIHJldHVybiB7dHlwZTogbnVsbH07XG4gIHZhciBvdXRwdXQgPSBpbnB1dC50eXBlID09PSBcIkdlb21ldHJ5Q29sbGVjdGlvblwiID8ge3R5cGU6IFwiR2VvbWV0cnlDb2xsZWN0aW9uXCIsIGdlb21ldHJpZXM6IGlucHV0Lmdlb21ldHJpZXMubWFwKGdlb21pZnlHZW9tZXRyeSl9XG4gICAgICA6IGlucHV0LnR5cGUgPT09IFwiUG9pbnRcIiB8fCBpbnB1dC50eXBlID09PSBcIk11bHRpUG9pbnRcIiA/IHt0eXBlOiBpbnB1dC50eXBlLCBjb29yZGluYXRlczogaW5wdXQuY29vcmRpbmF0ZXN9XG4gICAgICA6IHt0eXBlOiBpbnB1dC50eXBlLCBhcmNzOiBpbnB1dC5jb29yZGluYXRlc307IC8vIFRPRE8gQ2hlY2sgZm9yIHVua25vd24gdHlwZXM/XG4gIGlmIChpbnB1dC5iYm94ICE9IG51bGwpIG91dHB1dC5iYm94ID0gaW5wdXQuYmJveDtcbiAgcmV0dXJuIG91dHB1dDtcbn1cblxudmFyIHByZXF1YW50aXplID0gZnVuY3Rpb24ob2JqZWN0cywgYmJveCwgbikge1xuICB2YXIgeDAgPSBiYm94WzBdLFxuICAgICAgeTAgPSBiYm94WzFdLFxuICAgICAgeDEgPSBiYm94WzJdLFxuICAgICAgeTEgPSBiYm94WzNdLFxuICAgICAga3ggPSB4MSAtIHgwID8gKG4gLSAxKSAvICh4MSAtIHgwKSA6IDEsXG4gICAgICBreSA9IHkxIC0geTAgPyAobiAtIDEpIC8gKHkxIC0geTApIDogMTtcblxuICBmdW5jdGlvbiBxdWFudGl6ZVBvaW50KGlucHV0KSB7XG4gICAgcmV0dXJuIFtNYXRoLnJvdW5kKChpbnB1dFswXSAtIHgwKSAqIGt4KSwgTWF0aC5yb3VuZCgoaW5wdXRbMV0gLSB5MCkgKiBreSldO1xuICB9XG5cbiAgZnVuY3Rpb24gcXVhbnRpemVQb2ludHMoaW5wdXQsIG0pIHtcbiAgICB2YXIgaSA9IC0xLFxuICAgICAgICBqID0gMCxcbiAgICAgICAgbiA9IGlucHV0Lmxlbmd0aCxcbiAgICAgICAgb3V0cHV0ID0gbmV3IEFycmF5KG4pLCAvLyBwZXNzaW1pc3RpY1xuICAgICAgICBwaSxcbiAgICAgICAgcHgsXG4gICAgICAgIHB5LFxuICAgICAgICB4LFxuICAgICAgICB5O1xuXG4gICAgd2hpbGUgKCsraSA8IG4pIHtcbiAgICAgIHBpID0gaW5wdXRbaV07XG4gICAgICB4ID0gTWF0aC5yb3VuZCgocGlbMF0gLSB4MCkgKiBreCk7XG4gICAgICB5ID0gTWF0aC5yb3VuZCgocGlbMV0gLSB5MCkgKiBreSk7XG4gICAgICBpZiAoeCAhPT0gcHggfHwgeSAhPT0gcHkpIG91dHB1dFtqKytdID0gW3B4ID0geCwgcHkgPSB5XTsgLy8gbm9uLWNvaW5jaWRlbnQgcG9pbnRzXG4gICAgfVxuXG4gICAgb3V0cHV0Lmxlbmd0aCA9IGo7XG4gICAgd2hpbGUgKGogPCBtKSBqID0gb3V0cHV0LnB1c2goW291dHB1dFswXVswXSwgb3V0cHV0WzBdWzFdXSk7XG4gICAgcmV0dXJuIG91dHB1dDtcbiAgfVxuXG4gIGZ1bmN0aW9uIHF1YW50aXplTGluZShpbnB1dCkge1xuICAgIHJldHVybiBxdWFudGl6ZVBvaW50cyhpbnB1dCwgMik7XG4gIH1cblxuICBmdW5jdGlvbiBxdWFudGl6ZVJpbmcoaW5wdXQpIHtcbiAgICByZXR1cm4gcXVhbnRpemVQb2ludHMoaW5wdXQsIDQpO1xuICB9XG5cbiAgZnVuY3Rpb24gcXVhbnRpemVQb2x5Z29uKGlucHV0KSB7XG4gICAgcmV0dXJuIGlucHV0Lm1hcChxdWFudGl6ZVJpbmcpO1xuICB9XG5cbiAgZnVuY3Rpb24gcXVhbnRpemVHZW9tZXRyeShvKSB7XG4gICAgaWYgKG8gIT0gbnVsbCAmJiBxdWFudGl6ZUdlb21ldHJ5VHlwZS5oYXNPd25Qcm9wZXJ0eShvLnR5cGUpKSBxdWFudGl6ZUdlb21ldHJ5VHlwZVtvLnR5cGVdKG8pO1xuICB9XG5cbiAgdmFyIHF1YW50aXplR2VvbWV0cnlUeXBlID0ge1xuICAgIEdlb21ldHJ5Q29sbGVjdGlvbjogZnVuY3Rpb24obykgeyBvLmdlb21ldHJpZXMuZm9yRWFjaChxdWFudGl6ZUdlb21ldHJ5KTsgfSxcbiAgICBQb2ludDogZnVuY3Rpb24obykgeyBvLmNvb3JkaW5hdGVzID0gcXVhbnRpemVQb2ludChvLmNvb3JkaW5hdGVzKTsgfSxcbiAgICBNdWx0aVBvaW50OiBmdW5jdGlvbihvKSB7IG8uY29vcmRpbmF0ZXMgPSBvLmNvb3JkaW5hdGVzLm1hcChxdWFudGl6ZVBvaW50KTsgfSxcbiAgICBMaW5lU3RyaW5nOiBmdW5jdGlvbihvKSB7IG8uYXJjcyA9IHF1YW50aXplTGluZShvLmFyY3MpOyB9LFxuICAgIE11bHRpTGluZVN0cmluZzogZnVuY3Rpb24obykgeyBvLmFyY3MgPSBvLmFyY3MubWFwKHF1YW50aXplTGluZSk7IH0sXG4gICAgUG9seWdvbjogZnVuY3Rpb24obykgeyBvLmFyY3MgPSBxdWFudGl6ZVBvbHlnb24oby5hcmNzKTsgfSxcbiAgICBNdWx0aVBvbHlnb246IGZ1bmN0aW9uKG8pIHsgby5hcmNzID0gby5hcmNzLm1hcChxdWFudGl6ZVBvbHlnb24pOyB9XG4gIH07XG5cbiAgZm9yICh2YXIga2V5IGluIG9iamVjdHMpIHtcbiAgICBxdWFudGl6ZUdlb21ldHJ5KG9iamVjdHNba2V5XSk7XG4gIH1cblxuICByZXR1cm4ge1xuICAgIHNjYWxlOiBbMSAvIGt4LCAxIC8ga3ldLFxuICAgIHRyYW5zbGF0ZTogW3gwLCB5MF1cbiAgfTtcbn07XG5cbi8vIENvbnN0cnVjdHMgdGhlIFRvcG9KU09OIFRvcG9sb2d5IGZvciB0aGUgc3BlY2lmaWVkIGhhc2ggb2YgZmVhdHVyZXMuXG4vLyBFYWNoIG9iamVjdCBpbiB0aGUgc3BlY2lmaWVkIGhhc2ggbXVzdCBiZSBhIEdlb0pTT04gb2JqZWN0LFxuLy8gbWVhbmluZyBGZWF0dXJlQ29sbGVjdGlvbiwgYSBGZWF0dXJlIG9yIGEgZ2VvbWV0cnkgb2JqZWN0LlxudmFyIHRvcG9sb2d5ID0gZnVuY3Rpb24ob2JqZWN0cywgcXVhbnRpemF0aW9uKSB7XG4gIHZhciBiYm94ID0gYm91bmRzKG9iamVjdHMgPSBnZW9tZXRyeShvYmplY3RzKSksXG4gICAgICB0cmFuc2Zvcm0gPSBxdWFudGl6YXRpb24gPiAwICYmIGJib3ggJiYgcHJlcXVhbnRpemUob2JqZWN0cywgYmJveCwgcXVhbnRpemF0aW9uKSxcbiAgICAgIHRvcG9sb2d5ID0gZGVkdXAoY3V0KGV4dHJhY3Qob2JqZWN0cykpKSxcbiAgICAgIGNvb3JkaW5hdGVzID0gdG9wb2xvZ3kuY29vcmRpbmF0ZXMsXG4gICAgICBpbmRleEJ5QXJjID0gaGFzaG1hcCh0b3BvbG9neS5hcmNzLmxlbmd0aCAqIDEuNCwgaGFzaEFyYywgZXF1YWxBcmMpO1xuXG4gIG9iamVjdHMgPSB0b3BvbG9neS5vYmplY3RzOyAvLyBmb3IgZ2FyYmFnZSBjb2xsZWN0aW9uXG4gIHRvcG9sb2d5LmJib3ggPSBiYm94O1xuICB0b3BvbG9neS5hcmNzID0gdG9wb2xvZ3kuYXJjcy5tYXAoZnVuY3Rpb24oYXJjLCBpKSB7XG4gICAgaW5kZXhCeUFyYy5zZXQoYXJjLCBpKTtcbiAgICByZXR1cm4gY29vcmRpbmF0ZXMuc2xpY2UoYXJjWzBdLCBhcmNbMV0gKyAxKTtcbiAgfSk7XG5cbiAgZGVsZXRlIHRvcG9sb2d5LmNvb3JkaW5hdGVzO1xuICBjb29yZGluYXRlcyA9IG51bGw7XG5cbiAgZnVuY3Rpb24gaW5kZXhHZW9tZXRyeShnZW9tZXRyeSQkMSkge1xuICAgIGlmIChnZW9tZXRyeSQkMSAmJiBpbmRleEdlb21ldHJ5VHlwZS5oYXNPd25Qcm9wZXJ0eShnZW9tZXRyeSQkMS50eXBlKSkgaW5kZXhHZW9tZXRyeVR5cGVbZ2VvbWV0cnkkJDEudHlwZV0oZ2VvbWV0cnkkJDEpO1xuICB9XG5cbiAgdmFyIGluZGV4R2VvbWV0cnlUeXBlID0ge1xuICAgIEdlb21ldHJ5Q29sbGVjdGlvbjogZnVuY3Rpb24obykgeyBvLmdlb21ldHJpZXMuZm9yRWFjaChpbmRleEdlb21ldHJ5KTsgfSxcbiAgICBMaW5lU3RyaW5nOiBmdW5jdGlvbihvKSB7IG8uYXJjcyA9IGluZGV4QXJjcyhvLmFyY3MpOyB9LFxuICAgIE11bHRpTGluZVN0cmluZzogZnVuY3Rpb24obykgeyBvLmFyY3MgPSBvLmFyY3MubWFwKGluZGV4QXJjcyk7IH0sXG4gICAgUG9seWdvbjogZnVuY3Rpb24obykgeyBvLmFyY3MgPSBvLmFyY3MubWFwKGluZGV4QXJjcyk7IH0sXG4gICAgTXVsdGlQb2x5Z29uOiBmdW5jdGlvbihvKSB7IG8uYXJjcyA9IG8uYXJjcy5tYXAoaW5kZXhNdWx0aUFyY3MpOyB9XG4gIH07XG5cbiAgZnVuY3Rpb24gaW5kZXhBcmNzKGFyYykge1xuICAgIHZhciBpbmRleGVzID0gW107XG4gICAgZG8ge1xuICAgICAgdmFyIGluZGV4ID0gaW5kZXhCeUFyYy5nZXQoYXJjKTtcbiAgICAgIGluZGV4ZXMucHVzaChhcmNbMF0gPCBhcmNbMV0gPyBpbmRleCA6IH5pbmRleCk7XG4gICAgfSB3aGlsZSAoYXJjID0gYXJjLm5leHQpO1xuICAgIHJldHVybiBpbmRleGVzO1xuICB9XG5cbiAgZnVuY3Rpb24gaW5kZXhNdWx0aUFyY3MoYXJjcykge1xuICAgIHJldHVybiBhcmNzLm1hcChpbmRleEFyY3MpO1xuICB9XG5cbiAgZm9yICh2YXIga2V5IGluIG9iamVjdHMpIHtcbiAgICBpbmRleEdlb21ldHJ5KG9iamVjdHNba2V5XSk7XG4gIH1cblxuICBpZiAodHJhbnNmb3JtKSB7XG4gICAgdG9wb2xvZ3kudHJhbnNmb3JtID0gdHJhbnNmb3JtO1xuICAgIHRvcG9sb2d5LmFyY3MgPSBkZWx0YSh0b3BvbG9neS5hcmNzKTtcbiAgfVxuXG4gIHJldHVybiB0b3BvbG9neTtcbn07XG5cbmZ1bmN0aW9uIGhhc2hBcmMoYXJjKSB7XG4gIHZhciBpID0gYXJjWzBdLCBqID0gYXJjWzFdLCB0O1xuICBpZiAoaiA8IGkpIHQgPSBpLCBpID0gaiwgaiA9IHQ7XG4gIHJldHVybiBpICsgMzEgKiBqO1xufVxuXG5mdW5jdGlvbiBlcXVhbEFyYyhhcmNBLCBhcmNCKSB7XG4gIHZhciBpYSA9IGFyY0FbMF0sIGphID0gYXJjQVsxXSxcbiAgICAgIGliID0gYXJjQlswXSwgamIgPSBhcmNCWzFdLCB0O1xuICBpZiAoamEgPCBpYSkgdCA9IGlhLCBpYSA9IGphLCBqYSA9IHQ7XG4gIGlmIChqYiA8IGliKSB0ID0gaWIsIGliID0gamIsIGpiID0gdDtcbiAgcmV0dXJuIGlhID09PSBpYiAmJiBqYSA9PT0gamI7XG59XG5cbmV4cG9ydHMudG9wb2xvZ3kgPSB0b3BvbG9neTtcblxuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsICdfX2VzTW9kdWxlJywgeyB2YWx1ZTogdHJ1ZSB9KTtcblxufSkpKTtcbiIsIi8vIGh0dHBzOi8vZ2l0aHViLmNvbS90b3BvanNvbi90b3BvanNvbi1zaW1wbGlmeSBWZXJzaW9uIDMuMC4yLiBDb3B5cmlnaHQgMjAxNyBNaWtlIEJvc3RvY2suXG4oZnVuY3Rpb24gKGdsb2JhbCwgZmFjdG9yeSkge1xuXHR0eXBlb2YgZXhwb3J0cyA9PT0gJ29iamVjdCcgJiYgdHlwZW9mIG1vZHVsZSAhPT0gJ3VuZGVmaW5lZCcgPyBmYWN0b3J5KGV4cG9ydHMsIHJlcXVpcmUoJ3RvcG9qc29uLWNsaWVudCcpKSA6XG5cdHR5cGVvZiBkZWZpbmUgPT09ICdmdW5jdGlvbicgJiYgZGVmaW5lLmFtZCA/IGRlZmluZShbJ2V4cG9ydHMnLCAndG9wb2pzb24tY2xpZW50J10sIGZhY3RvcnkpIDpcblx0KGZhY3RvcnkoKGdsb2JhbC50b3BvanNvbiA9IGdsb2JhbC50b3BvanNvbiB8fCB7fSksZ2xvYmFsLnRvcG9qc29uKSk7XG59KHRoaXMsIChmdW5jdGlvbiAoZXhwb3J0cyx0b3BvanNvbkNsaWVudCkgeyAndXNlIHN0cmljdCc7XG5cbnZhciBwcnVuZSA9IGZ1bmN0aW9uKHRvcG9sb2d5KSB7XG4gIHZhciBvbGRPYmplY3RzID0gdG9wb2xvZ3kub2JqZWN0cyxcbiAgICAgIG5ld09iamVjdHMgPSB7fSxcbiAgICAgIG9sZEFyY3MgPSB0b3BvbG9neS5hcmNzLFxuICAgICAgb2xkQXJjc0xlbmd0aCA9IG9sZEFyY3MubGVuZ3RoLFxuICAgICAgb2xkSW5kZXggPSAtMSxcbiAgICAgIG5ld0luZGV4QnlPbGRJbmRleCA9IG5ldyBBcnJheShvbGRBcmNzTGVuZ3RoKSxcbiAgICAgIG5ld0FyY3NMZW5ndGggPSAwLFxuICAgICAgbmV3QXJjcyxcbiAgICAgIG5ld0luZGV4ID0gLTEsXG4gICAgICBrZXk7XG5cbiAgZnVuY3Rpb24gc2Nhbkdlb21ldHJ5KGlucHV0KSB7XG4gICAgc3dpdGNoIChpbnB1dC50eXBlKSB7XG4gICAgICBjYXNlIFwiR2VvbWV0cnlDb2xsZWN0aW9uXCI6IGlucHV0Lmdlb21ldHJpZXMuZm9yRWFjaChzY2FuR2VvbWV0cnkpOyBicmVhaztcbiAgICAgIGNhc2UgXCJMaW5lU3RyaW5nXCI6IHNjYW5BcmNzKGlucHV0LmFyY3MpOyBicmVhaztcbiAgICAgIGNhc2UgXCJNdWx0aUxpbmVTdHJpbmdcIjogaW5wdXQuYXJjcy5mb3JFYWNoKHNjYW5BcmNzKTsgYnJlYWs7XG4gICAgICBjYXNlIFwiUG9seWdvblwiOiBpbnB1dC5hcmNzLmZvckVhY2goc2NhbkFyY3MpOyBicmVhaztcbiAgICAgIGNhc2UgXCJNdWx0aVBvbHlnb25cIjogaW5wdXQuYXJjcy5mb3JFYWNoKHNjYW5NdWx0aUFyY3MpOyBicmVhaztcbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiBzY2FuQXJjKGluZGV4KSB7XG4gICAgaWYgKGluZGV4IDwgMCkgaW5kZXggPSB+aW5kZXg7XG4gICAgaWYgKCFuZXdJbmRleEJ5T2xkSW5kZXhbaW5kZXhdKSBuZXdJbmRleEJ5T2xkSW5kZXhbaW5kZXhdID0gMSwgKytuZXdBcmNzTGVuZ3RoO1xuICB9XG5cbiAgZnVuY3Rpb24gc2NhbkFyY3MoYXJjcykge1xuICAgIGFyY3MuZm9yRWFjaChzY2FuQXJjKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHNjYW5NdWx0aUFyY3MoYXJjcykge1xuICAgIGFyY3MuZm9yRWFjaChzY2FuQXJjcyk7XG4gIH1cblxuICBmdW5jdGlvbiByZWluZGV4R2VvbWV0cnkoaW5wdXQpIHtcbiAgICB2YXIgb3V0cHV0O1xuICAgIHN3aXRjaCAoaW5wdXQudHlwZSkge1xuICAgICAgY2FzZSBcIkdlb21ldHJ5Q29sbGVjdGlvblwiOiBvdXRwdXQgPSB7dHlwZTogXCJHZW9tZXRyeUNvbGxlY3Rpb25cIiwgZ2VvbWV0cmllczogaW5wdXQuZ2VvbWV0cmllcy5tYXAocmVpbmRleEdlb21ldHJ5KX07IGJyZWFrO1xuICAgICAgY2FzZSBcIkxpbmVTdHJpbmdcIjogb3V0cHV0ID0ge3R5cGU6IFwiTGluZVN0cmluZ1wiLCBhcmNzOiByZWluZGV4QXJjcyhpbnB1dC5hcmNzKX07IGJyZWFrO1xuICAgICAgY2FzZSBcIk11bHRpTGluZVN0cmluZ1wiOiBvdXRwdXQgPSB7dHlwZTogXCJNdWx0aUxpbmVTdHJpbmdcIiwgYXJjczogaW5wdXQuYXJjcy5tYXAocmVpbmRleEFyY3MpfTsgYnJlYWs7XG4gICAgICBjYXNlIFwiUG9seWdvblwiOiBvdXRwdXQgPSB7dHlwZTogXCJQb2x5Z29uXCIsIGFyY3M6IGlucHV0LmFyY3MubWFwKHJlaW5kZXhBcmNzKX07IGJyZWFrO1xuICAgICAgY2FzZSBcIk11bHRpUG9seWdvblwiOiBvdXRwdXQgPSB7dHlwZTogXCJNdWx0aVBvbHlnb25cIiwgYXJjczogaW5wdXQuYXJjcy5tYXAocmVpbmRleE11bHRpQXJjcyl9OyBicmVhaztcbiAgICAgIGRlZmF1bHQ6IHJldHVybiBpbnB1dDtcbiAgICB9XG4gICAgaWYgKGlucHV0LmlkICE9IG51bGwpIG91dHB1dC5pZCA9IGlucHV0LmlkO1xuICAgIGlmIChpbnB1dC5iYm94ICE9IG51bGwpIG91dHB1dC5iYm94ID0gaW5wdXQuYmJveDtcbiAgICBpZiAoaW5wdXQucHJvcGVydGllcyAhPSBudWxsKSBvdXRwdXQucHJvcGVydGllcyA9IGlucHV0LnByb3BlcnRpZXM7XG4gICAgcmV0dXJuIG91dHB1dDtcbiAgfVxuXG4gIGZ1bmN0aW9uIHJlaW5kZXhBcmMob2xkSW5kZXgpIHtcbiAgICByZXR1cm4gb2xkSW5kZXggPCAwID8gfm5ld0luZGV4QnlPbGRJbmRleFt+b2xkSW5kZXhdIDogbmV3SW5kZXhCeU9sZEluZGV4W29sZEluZGV4XTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHJlaW5kZXhBcmNzKGFyY3MpIHtcbiAgICByZXR1cm4gYXJjcy5tYXAocmVpbmRleEFyYyk7XG4gIH1cblxuICBmdW5jdGlvbiByZWluZGV4TXVsdGlBcmNzKGFyY3MpIHtcbiAgICByZXR1cm4gYXJjcy5tYXAocmVpbmRleEFyY3MpO1xuICB9XG5cbiAgZm9yIChrZXkgaW4gb2xkT2JqZWN0cykge1xuICAgIHNjYW5HZW9tZXRyeShvbGRPYmplY3RzW2tleV0pO1xuICB9XG5cbiAgbmV3QXJjcyA9IG5ldyBBcnJheShuZXdBcmNzTGVuZ3RoKTtcblxuICB3aGlsZSAoKytvbGRJbmRleCA8IG9sZEFyY3NMZW5ndGgpIHtcbiAgICBpZiAobmV3SW5kZXhCeU9sZEluZGV4W29sZEluZGV4XSkge1xuICAgICAgbmV3SW5kZXhCeU9sZEluZGV4W29sZEluZGV4XSA9ICsrbmV3SW5kZXg7XG4gICAgICBuZXdBcmNzW25ld0luZGV4XSA9IG9sZEFyY3Nbb2xkSW5kZXhdO1xuICAgIH1cbiAgfVxuXG4gIGZvciAoa2V5IGluIG9sZE9iamVjdHMpIHtcbiAgICBuZXdPYmplY3RzW2tleV0gPSByZWluZGV4R2VvbWV0cnkob2xkT2JqZWN0c1trZXldKTtcbiAgfVxuXG4gIHJldHVybiB7XG4gICAgdHlwZTogXCJUb3BvbG9neVwiLFxuICAgIGJib3g6IHRvcG9sb2d5LmJib3gsXG4gICAgdHJhbnNmb3JtOiB0b3BvbG9neS50cmFuc2Zvcm0sXG4gICAgb2JqZWN0czogbmV3T2JqZWN0cyxcbiAgICBhcmNzOiBuZXdBcmNzXG4gIH07XG59O1xuXG52YXIgZmlsdGVyID0gZnVuY3Rpb24odG9wb2xvZ3ksIGZpbHRlcikge1xuICB2YXIgb2xkT2JqZWN0cyA9IHRvcG9sb2d5Lm9iamVjdHMsXG4gICAgICBuZXdPYmplY3RzID0ge30sXG4gICAgICBrZXk7XG5cbiAgaWYgKGZpbHRlciA9PSBudWxsKSBmaWx0ZXIgPSBmaWx0ZXJUcnVlO1xuXG4gIGZ1bmN0aW9uIGZpbHRlckdlb21ldHJ5KGlucHV0KSB7XG4gICAgdmFyIG91dHB1dCwgYXJjcztcbiAgICBzd2l0Y2ggKGlucHV0LnR5cGUpIHtcbiAgICAgIGNhc2UgXCJQb2x5Z29uXCI6IHtcbiAgICAgICAgYXJjcyA9IGZpbHRlclJpbmdzKGlucHV0LmFyY3MpO1xuICAgICAgICBvdXRwdXQgPSBhcmNzID8ge3R5cGU6IFwiUG9seWdvblwiLCBhcmNzOiBhcmNzfSA6IHt0eXBlOiBudWxsfTtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgICBjYXNlIFwiTXVsdGlQb2x5Z29uXCI6IHtcbiAgICAgICAgYXJjcyA9IGlucHV0LmFyY3MubWFwKGZpbHRlclJpbmdzKS5maWx0ZXIoZmlsdGVySWRlbnRpdHkpO1xuICAgICAgICBvdXRwdXQgPSBhcmNzLmxlbmd0aCA/IHt0eXBlOiBcIk11bHRpUG9seWdvblwiLCBhcmNzOiBhcmNzfSA6IHt0eXBlOiBudWxsfTtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgICBjYXNlIFwiR2VvbWV0cnlDb2xsZWN0aW9uXCI6IHtcbiAgICAgICAgYXJjcyA9IGlucHV0Lmdlb21ldHJpZXMubWFwKGZpbHRlckdlb21ldHJ5KS5maWx0ZXIoZmlsdGVyTm90TnVsbCk7XG4gICAgICAgIG91dHB1dCA9IGFyY3MubGVuZ3RoID8ge3R5cGU6IFwiR2VvbWV0cnlDb2xsZWN0aW9uXCIsIGdlb21ldHJpZXM6IGFyY3N9IDoge3R5cGU6IG51bGx9O1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICAgIGRlZmF1bHQ6IHJldHVybiBpbnB1dDtcbiAgICB9XG4gICAgaWYgKGlucHV0LmlkICE9IG51bGwpIG91dHB1dC5pZCA9IGlucHV0LmlkO1xuICAgIGlmIChpbnB1dC5iYm94ICE9IG51bGwpIG91dHB1dC5iYm94ID0gaW5wdXQuYmJveDtcbiAgICBpZiAoaW5wdXQucHJvcGVydGllcyAhPSBudWxsKSBvdXRwdXQucHJvcGVydGllcyA9IGlucHV0LnByb3BlcnRpZXM7XG4gICAgcmV0dXJuIG91dHB1dDtcbiAgfVxuXG4gIGZ1bmN0aW9uIGZpbHRlclJpbmdzKGFyY3MpIHtcbiAgICByZXR1cm4gYXJjcy5sZW5ndGggJiYgZmlsdGVyRXh0ZXJpb3JSaW5nKGFyY3NbMF0pIC8vIGlmIHRoZSBleHRlcmlvciBpcyBzbWFsbCwgaWdub3JlIGFueSBob2xlc1xuICAgICAgICA/IFthcmNzWzBdXS5jb25jYXQoYXJjcy5zbGljZSgxKS5maWx0ZXIoZmlsdGVySW50ZXJpb3JSaW5nKSlcbiAgICAgICAgOiBudWxsO1xuICB9XG5cbiAgZnVuY3Rpb24gZmlsdGVyRXh0ZXJpb3JSaW5nKHJpbmcpIHtcbiAgICByZXR1cm4gZmlsdGVyKHJpbmcsIGZhbHNlKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGZpbHRlckludGVyaW9yUmluZyhyaW5nKSB7XG4gICAgcmV0dXJuIGZpbHRlcihyaW5nLCB0cnVlKTtcbiAgfVxuXG4gIGZvciAoa2V5IGluIG9sZE9iamVjdHMpIHtcbiAgICBuZXdPYmplY3RzW2tleV0gPSBmaWx0ZXJHZW9tZXRyeShvbGRPYmplY3RzW2tleV0pO1xuICB9XG5cbiAgcmV0dXJuIHBydW5lKHtcbiAgICB0eXBlOiBcIlRvcG9sb2d5XCIsXG4gICAgYmJveDogdG9wb2xvZ3kuYmJveCxcbiAgICB0cmFuc2Zvcm06IHRvcG9sb2d5LnRyYW5zZm9ybSxcbiAgICBvYmplY3RzOiBuZXdPYmplY3RzLFxuICAgIGFyY3M6IHRvcG9sb2d5LmFyY3NcbiAgfSk7XG59O1xuXG5mdW5jdGlvbiBmaWx0ZXJUcnVlKCkge1xuICByZXR1cm4gdHJ1ZTtcbn1cblxuZnVuY3Rpb24gZmlsdGVySWRlbnRpdHkoeCkge1xuICByZXR1cm4geDtcbn1cblxuZnVuY3Rpb24gZmlsdGVyTm90TnVsbChnZW9tZXRyeSkge1xuICByZXR1cm4gZ2VvbWV0cnkudHlwZSAhPSBudWxsO1xufVxuXG52YXIgZmlsdGVyQXR0YWNoZWQgPSBmdW5jdGlvbih0b3BvbG9neSkge1xuICB2YXIgb3duZXJCeUFyYyA9IG5ldyBBcnJheSh0b3BvbG9neS5hcmNzLmxlbmd0aCksIC8vIGFyYyBpbmRleCAtPiBpbmRleCBvZiB1bmlxdWUgYXNzb2NpYXRlZCByaW5nLCBvciAtMSBpZiB1c2VkIGJ5IG11bHRpcGxlIHJpbmdzXG4gICAgICBvd25lckluZGV4ID0gMCxcbiAgICAgIGtleTtcblxuICBmdW5jdGlvbiB0ZXN0R2VvbWV0cnkobykge1xuICAgIHN3aXRjaCAoby50eXBlKSB7XG4gICAgICBjYXNlIFwiR2VvbWV0cnlDb2xsZWN0aW9uXCI6IG8uZ2VvbWV0cmllcy5mb3JFYWNoKHRlc3RHZW9tZXRyeSk7IGJyZWFrO1xuICAgICAgY2FzZSBcIlBvbHlnb25cIjogdGVzdEFyY3Moby5hcmNzKTsgYnJlYWs7XG4gICAgICBjYXNlIFwiTXVsdGlQb2x5Z29uXCI6IG8uYXJjcy5mb3JFYWNoKHRlc3RBcmNzKTsgYnJlYWs7XG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gdGVzdEFyY3MoYXJjcykge1xuICAgIGZvciAodmFyIGkgPSAwLCBuID0gYXJjcy5sZW5ndGg7IGkgPCBuOyArK2ksICsrb3duZXJJbmRleCkge1xuICAgICAgZm9yICh2YXIgcmluZyA9IGFyY3NbaV0sIGogPSAwLCBtID0gcmluZy5sZW5ndGg7IGogPCBtOyArK2opIHtcbiAgICAgICAgdmFyIGFyYyA9IHJpbmdbal07XG4gICAgICAgIGlmIChhcmMgPCAwKSBhcmMgPSB+YXJjO1xuICAgICAgICB2YXIgb3duZXIgPSBvd25lckJ5QXJjW2FyY107XG4gICAgICAgIGlmIChvd25lciA9PSBudWxsKSBvd25lckJ5QXJjW2FyY10gPSBvd25lckluZGV4O1xuICAgICAgICBlbHNlIGlmIChvd25lciAhPT0gb3duZXJJbmRleCkgb3duZXJCeUFyY1thcmNdID0gLTE7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgZm9yIChrZXkgaW4gdG9wb2xvZ3kub2JqZWN0cykge1xuICAgIHRlc3RHZW9tZXRyeSh0b3BvbG9neS5vYmplY3RzW2tleV0pO1xuICB9XG5cbiAgcmV0dXJuIGZ1bmN0aW9uKHJpbmcpIHtcbiAgICBmb3IgKHZhciBqID0gMCwgbSA9IHJpbmcubGVuZ3RoLCBhcmM7IGogPCBtOyArK2opIHtcbiAgICAgIGlmIChvd25lckJ5QXJjWyhhcmMgPSByaW5nW2pdKSA8IDAgPyB+YXJjIDogYXJjXSA9PT0gLTEpIHtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBmYWxzZTtcbiAgfTtcbn07XG5cbmZ1bmN0aW9uIHBsYW5hclRyaWFuZ2xlQXJlYSh0cmlhbmdsZSkge1xuICB2YXIgYSA9IHRyaWFuZ2xlWzBdLCBiID0gdHJpYW5nbGVbMV0sIGMgPSB0cmlhbmdsZVsyXTtcbiAgcmV0dXJuIE1hdGguYWJzKChhWzBdIC0gY1swXSkgKiAoYlsxXSAtIGFbMV0pIC0gKGFbMF0gLSBiWzBdKSAqIChjWzFdIC0gYVsxXSkpIC8gMjtcbn1cblxuZnVuY3Rpb24gcGxhbmFyUmluZ0FyZWEocmluZykge1xuICB2YXIgaSA9IC0xLCBuID0gcmluZy5sZW5ndGgsIGEsIGIgPSByaW5nW24gLSAxXSwgYXJlYSA9IDA7XG4gIHdoaWxlICgrK2kgPCBuKSBhID0gYiwgYiA9IHJpbmdbaV0sIGFyZWEgKz0gYVswXSAqIGJbMV0gLSBhWzFdICogYlswXTtcbiAgcmV0dXJuIE1hdGguYWJzKGFyZWEpIC8gMjtcbn1cblxudmFyIGZpbHRlcldlaWdodCA9IGZ1bmN0aW9uKHRvcG9sb2d5LCBtaW5XZWlnaHQsIHdlaWdodCkge1xuICBtaW5XZWlnaHQgPSBtaW5XZWlnaHQgPT0gbnVsbCA/IE51bWJlci5NSU5fVkFMVUUgOiArbWluV2VpZ2h0O1xuXG4gIGlmICh3ZWlnaHQgPT0gbnVsbCkgd2VpZ2h0ID0gcGxhbmFyUmluZ0FyZWE7XG5cbiAgcmV0dXJuIGZ1bmN0aW9uKHJpbmcsIGludGVyaW9yKSB7XG4gICAgcmV0dXJuIHdlaWdodCh0b3BvanNvbkNsaWVudC5mZWF0dXJlKHRvcG9sb2d5LCB7dHlwZTogXCJQb2x5Z29uXCIsIGFyY3M6IFtyaW5nXX0pLmdlb21ldHJ5LmNvb3JkaW5hdGVzWzBdLCBpbnRlcmlvcikgPj0gbWluV2VpZ2h0O1xuICB9O1xufTtcblxudmFyIGZpbHRlckF0dGFjaGVkV2VpZ2h0ID0gZnVuY3Rpb24odG9wb2xvZ3ksIG1pbldlaWdodCwgd2VpZ2h0KSB7XG4gIHZhciBhID0gZmlsdGVyQXR0YWNoZWQodG9wb2xvZ3kpLFxuICAgICAgdyA9IGZpbHRlcldlaWdodCh0b3BvbG9neSwgbWluV2VpZ2h0LCB3ZWlnaHQpO1xuICByZXR1cm4gZnVuY3Rpb24ocmluZywgaW50ZXJpb3IpIHtcbiAgICByZXR1cm4gYShyaW5nLCBpbnRlcmlvcikgfHwgdyhyaW5nLCBpbnRlcmlvcik7XG4gIH07XG59O1xuXG5mdW5jdGlvbiBjb21wYXJlKGEsIGIpIHtcbiAgcmV0dXJuIGFbMV1bMl0gLSBiWzFdWzJdO1xufVxuXG52YXIgbmV3SGVhcCA9IGZ1bmN0aW9uKCkge1xuICB2YXIgaGVhcCA9IHt9LFxuICAgICAgYXJyYXkgPSBbXSxcbiAgICAgIHNpemUgPSAwO1xuXG4gIGhlYXAucHVzaCA9IGZ1bmN0aW9uKG9iamVjdCkge1xuICAgIHVwKGFycmF5W29iamVjdC5fID0gc2l6ZV0gPSBvYmplY3QsIHNpemUrKyk7XG4gICAgcmV0dXJuIHNpemU7XG4gIH07XG5cbiAgaGVhcC5wb3AgPSBmdW5jdGlvbigpIHtcbiAgICBpZiAoc2l6ZSA8PSAwKSByZXR1cm47XG4gICAgdmFyIHJlbW92ZWQgPSBhcnJheVswXSwgb2JqZWN0O1xuICAgIGlmICgtLXNpemUgPiAwKSBvYmplY3QgPSBhcnJheVtzaXplXSwgZG93bihhcnJheVtvYmplY3QuXyA9IDBdID0gb2JqZWN0LCAwKTtcbiAgICByZXR1cm4gcmVtb3ZlZDtcbiAgfTtcblxuICBoZWFwLnJlbW92ZSA9IGZ1bmN0aW9uKHJlbW92ZWQpIHtcbiAgICB2YXIgaSA9IHJlbW92ZWQuXywgb2JqZWN0O1xuICAgIGlmIChhcnJheVtpXSAhPT0gcmVtb3ZlZCkgcmV0dXJuOyAvLyBpbnZhbGlkIHJlcXVlc3RcbiAgICBpZiAoaSAhPT0gLS1zaXplKSBvYmplY3QgPSBhcnJheVtzaXplXSwgKGNvbXBhcmUob2JqZWN0LCByZW1vdmVkKSA8IDAgPyB1cCA6IGRvd24pKGFycmF5W29iamVjdC5fID0gaV0gPSBvYmplY3QsIGkpO1xuICAgIHJldHVybiBpO1xuICB9O1xuXG4gIGZ1bmN0aW9uIHVwKG9iamVjdCwgaSkge1xuICAgIHdoaWxlIChpID4gMCkge1xuICAgICAgdmFyIGogPSAoKGkgKyAxKSA+PiAxKSAtIDEsXG4gICAgICAgICAgcGFyZW50ID0gYXJyYXlbal07XG4gICAgICBpZiAoY29tcGFyZShvYmplY3QsIHBhcmVudCkgPj0gMCkgYnJlYWs7XG4gICAgICBhcnJheVtwYXJlbnQuXyA9IGldID0gcGFyZW50O1xuICAgICAgYXJyYXlbb2JqZWN0Ll8gPSBpID0gal0gPSBvYmplY3Q7XG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gZG93bihvYmplY3QsIGkpIHtcbiAgICB3aGlsZSAodHJ1ZSkge1xuICAgICAgdmFyIHIgPSAoaSArIDEpIDw8IDEsXG4gICAgICAgICAgbCA9IHIgLSAxLFxuICAgICAgICAgIGogPSBpLFxuICAgICAgICAgIGNoaWxkID0gYXJyYXlbal07XG4gICAgICBpZiAobCA8IHNpemUgJiYgY29tcGFyZShhcnJheVtsXSwgY2hpbGQpIDwgMCkgY2hpbGQgPSBhcnJheVtqID0gbF07XG4gICAgICBpZiAociA8IHNpemUgJiYgY29tcGFyZShhcnJheVtyXSwgY2hpbGQpIDwgMCkgY2hpbGQgPSBhcnJheVtqID0gcl07XG4gICAgICBpZiAoaiA9PT0gaSkgYnJlYWs7XG4gICAgICBhcnJheVtjaGlsZC5fID0gaV0gPSBjaGlsZDtcbiAgICAgIGFycmF5W29iamVjdC5fID0gaSA9IGpdID0gb2JqZWN0O1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiBoZWFwO1xufTtcblxuZnVuY3Rpb24gY29weShwb2ludCkge1xuICByZXR1cm4gW3BvaW50WzBdLCBwb2ludFsxXSwgMF07XG59XG5cbnZhciBwcmVzaW1wbGlmeSA9IGZ1bmN0aW9uKHRvcG9sb2d5LCB3ZWlnaHQpIHtcbiAgdmFyIHBvaW50ID0gdG9wb2xvZ3kudHJhbnNmb3JtID8gdG9wb2pzb25DbGllbnQudHJhbnNmb3JtKHRvcG9sb2d5LnRyYW5zZm9ybSkgOiBjb3B5LFxuICAgICAgaGVhcCA9IG5ld0hlYXAoKTtcblxuICBpZiAod2VpZ2h0ID09IG51bGwpIHdlaWdodCA9IHBsYW5hclRyaWFuZ2xlQXJlYTtcblxuICB2YXIgYXJjcyA9IHRvcG9sb2d5LmFyY3MubWFwKGZ1bmN0aW9uKGFyYykge1xuICAgIHZhciB0cmlhbmdsZXMgPSBbXSxcbiAgICAgICAgbWF4V2VpZ2h0ID0gMCxcbiAgICAgICAgdHJpYW5nbGUsXG4gICAgICAgIGksXG4gICAgICAgIG47XG5cbiAgICBhcmMgPSBhcmMubWFwKHBvaW50KTtcblxuICAgIGZvciAoaSA9IDEsIG4gPSBhcmMubGVuZ3RoIC0gMTsgaSA8IG47ICsraSkge1xuICAgICAgdHJpYW5nbGUgPSBbYXJjW2kgLSAxXSwgYXJjW2ldLCBhcmNbaSArIDFdXTtcbiAgICAgIHRyaWFuZ2xlWzFdWzJdID0gd2VpZ2h0KHRyaWFuZ2xlKTtcbiAgICAgIHRyaWFuZ2xlcy5wdXNoKHRyaWFuZ2xlKTtcbiAgICAgIGhlYXAucHVzaCh0cmlhbmdsZSk7XG4gICAgfVxuXG4gICAgLy8gQWx3YXlzIGtlZXAgdGhlIGFyYyBlbmRwb2ludHMhXG4gICAgYXJjWzBdWzJdID0gYXJjW25dWzJdID0gSW5maW5pdHk7XG5cbiAgICBmb3IgKGkgPSAwLCBuID0gdHJpYW5nbGVzLmxlbmd0aDsgaSA8IG47ICsraSkge1xuICAgICAgdHJpYW5nbGUgPSB0cmlhbmdsZXNbaV07XG4gICAgICB0cmlhbmdsZS5wcmV2aW91cyA9IHRyaWFuZ2xlc1tpIC0gMV07XG4gICAgICB0cmlhbmdsZS5uZXh0ID0gdHJpYW5nbGVzW2kgKyAxXTtcbiAgICB9XG5cbiAgICB3aGlsZSAodHJpYW5nbGUgPSBoZWFwLnBvcCgpKSB7XG4gICAgICB2YXIgcHJldmlvdXMgPSB0cmlhbmdsZS5wcmV2aW91cyxcbiAgICAgICAgICBuZXh0ID0gdHJpYW5nbGUubmV4dDtcblxuICAgICAgLy8gSWYgdGhlIHdlaWdodCBvZiB0aGUgY3VycmVudCBwb2ludCBpcyBsZXNzIHRoYW4gdGhhdCBvZiB0aGUgcHJldmlvdXNcbiAgICAgIC8vIHBvaW50IHRvIGJlIGVsaW1pbmF0ZWQsIHVzZSB0aGUgbGF0dGVy4oCZcyB3ZWlnaHQgaW5zdGVhZC4gVGhpcyBlbnN1cmVzXG4gICAgICAvLyB0aGF0IHRoZSBjdXJyZW50IHBvaW50IGNhbm5vdCBiZSBlbGltaW5hdGVkIHdpdGhvdXQgZWxpbWluYXRpbmdcbiAgICAgIC8vIHByZXZpb3VzbHktIGVsaW1pbmF0ZWQgcG9pbnRzLlxuICAgICAgaWYgKHRyaWFuZ2xlWzFdWzJdIDwgbWF4V2VpZ2h0KSB0cmlhbmdsZVsxXVsyXSA9IG1heFdlaWdodDtcbiAgICAgIGVsc2UgbWF4V2VpZ2h0ID0gdHJpYW5nbGVbMV1bMl07XG5cbiAgICAgIGlmIChwcmV2aW91cykge1xuICAgICAgICBwcmV2aW91cy5uZXh0ID0gbmV4dDtcbiAgICAgICAgcHJldmlvdXNbMl0gPSB0cmlhbmdsZVsyXTtcbiAgICAgICAgdXBkYXRlKHByZXZpb3VzKTtcbiAgICAgIH1cblxuICAgICAgaWYgKG5leHQpIHtcbiAgICAgICAgbmV4dC5wcmV2aW91cyA9IHByZXZpb3VzO1xuICAgICAgICBuZXh0WzBdID0gdHJpYW5nbGVbMF07XG4gICAgICAgIHVwZGF0ZShuZXh0KTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gYXJjO1xuICB9KTtcblxuICBmdW5jdGlvbiB1cGRhdGUodHJpYW5nbGUpIHtcbiAgICBoZWFwLnJlbW92ZSh0cmlhbmdsZSk7XG4gICAgdHJpYW5nbGVbMV1bMl0gPSB3ZWlnaHQodHJpYW5nbGUpO1xuICAgIGhlYXAucHVzaCh0cmlhbmdsZSk7XG4gIH1cblxuICByZXR1cm4ge1xuICAgIHR5cGU6IFwiVG9wb2xvZ3lcIixcbiAgICBiYm94OiB0b3BvbG9neS5iYm94LFxuICAgIG9iamVjdHM6IHRvcG9sb2d5Lm9iamVjdHMsXG4gICAgYXJjczogYXJjc1xuICB9O1xufTtcblxudmFyIHF1YW50aWxlID0gZnVuY3Rpb24odG9wb2xvZ3ksIHApIHtcbiAgdmFyIGFycmF5ID0gW107XG5cbiAgdG9wb2xvZ3kuYXJjcy5mb3JFYWNoKGZ1bmN0aW9uKGFyYykge1xuICAgIGFyYy5mb3JFYWNoKGZ1bmN0aW9uKHBvaW50KSB7XG4gICAgICBpZiAoaXNGaW5pdGUocG9pbnRbMl0pKSB7IC8vIElnbm9yZSBlbmRwb2ludHMsIHdob3NlIHdlaWdodCBpcyBJbmZpbml0eS5cbiAgICAgICAgYXJyYXkucHVzaChwb2ludFsyXSk7XG4gICAgICB9XG4gICAgfSk7XG4gIH0pO1xuXG4gIHJldHVybiBhcnJheS5sZW5ndGggJiYgcXVhbnRpbGUkMShhcnJheS5zb3J0KGRlc2NlbmRpbmcpLCBwKTtcbn07XG5cbmZ1bmN0aW9uIHF1YW50aWxlJDEoYXJyYXksIHApIHtcbiAgaWYgKCEobiA9IGFycmF5Lmxlbmd0aCkpIHJldHVybjtcbiAgaWYgKChwID0gK3ApIDw9IDAgfHwgbiA8IDIpIHJldHVybiBhcnJheVswXTtcbiAgaWYgKHAgPj0gMSkgcmV0dXJuIGFycmF5W24gLSAxXTtcbiAgdmFyIG4sXG4gICAgICBoID0gKG4gLSAxKSAqIHAsXG4gICAgICBpID0gTWF0aC5mbG9vcihoKSxcbiAgICAgIGEgPSBhcnJheVtpXSxcbiAgICAgIGIgPSBhcnJheVtpICsgMV07XG4gIHJldHVybiBhICsgKGIgLSBhKSAqIChoIC0gaSk7XG59XG5cbmZ1bmN0aW9uIGRlc2NlbmRpbmcoYSwgYikge1xuICByZXR1cm4gYiAtIGE7XG59XG5cbnZhciBzaW1wbGlmeSA9IGZ1bmN0aW9uKHRvcG9sb2d5LCBtaW5XZWlnaHQpIHtcbiAgbWluV2VpZ2h0ID0gbWluV2VpZ2h0ID09IG51bGwgPyBOdW1iZXIuTUlOX1ZBTFVFIDogK21pbldlaWdodDtcblxuICAvLyBSZW1vdmUgcG9pbnRzIHdob3NlIHdlaWdodCBpcyBsZXNzIHRoYW4gdGhlIG1pbmltdW0gd2VpZ2h0LlxuICB2YXIgYXJjcyA9IHRvcG9sb2d5LmFyY3MubWFwKGZ1bmN0aW9uKGlucHV0KSB7XG4gICAgdmFyIGkgPSAtMSxcbiAgICAgICAgaiA9IDAsXG4gICAgICAgIG4gPSBpbnB1dC5sZW5ndGgsXG4gICAgICAgIG91dHB1dCA9IG5ldyBBcnJheShuKSwgLy8gcGVzc2ltaXN0aWNcbiAgICAgICAgcG9pbnQ7XG5cbiAgICB3aGlsZSAoKytpIDwgbikge1xuICAgICAgaWYgKChwb2ludCA9IGlucHV0W2ldKVsyXSA+PSBtaW5XZWlnaHQpIHtcbiAgICAgICAgb3V0cHV0W2orK10gPSBbcG9pbnRbMF0sIHBvaW50WzFdXTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBvdXRwdXQubGVuZ3RoID0gajtcbiAgICByZXR1cm4gb3V0cHV0O1xuICB9KTtcblxuICByZXR1cm4ge1xuICAgIHR5cGU6IFwiVG9wb2xvZ3lcIixcbiAgICB0cmFuc2Zvcm06IHRvcG9sb2d5LnRyYW5zZm9ybSxcbiAgICBiYm94OiB0b3BvbG9neS5iYm94LFxuICAgIG9iamVjdHM6IHRvcG9sb2d5Lm9iamVjdHMsXG4gICAgYXJjczogYXJjc1xuICB9O1xufTtcblxudmFyIHBpID0gTWF0aC5QSTtcbnZhciB0YXUgPSAyICogcGk7XG52YXIgcXVhcnRlclBpID0gcGkgLyA0O1xudmFyIHJhZGlhbnMgPSBwaSAvIDE4MDtcbnZhciBhYnMgPSBNYXRoLmFicztcbnZhciBhdGFuMiA9IE1hdGguYXRhbjI7XG52YXIgY29zID0gTWF0aC5jb3M7XG52YXIgc2luID0gTWF0aC5zaW47XG5cbmZ1bmN0aW9uIGhhbGZBcmVhKHJpbmcsIGNsb3NlZCkge1xuICB2YXIgaSA9IDAsXG4gICAgICBuID0gcmluZy5sZW5ndGgsXG4gICAgICBzdW0gPSAwLFxuICAgICAgcG9pbnQgPSByaW5nW2Nsb3NlZCA/IGkrKyA6IG4gLSAxXSxcbiAgICAgIGxhbWJkYTAsIGxhbWJkYTEgPSBwb2ludFswXSAqIHJhZGlhbnMsXG4gICAgICBwaGkxID0gKHBvaW50WzFdICogcmFkaWFucykgLyAyICsgcXVhcnRlclBpLFxuICAgICAgY29zUGhpMCwgY29zUGhpMSA9IGNvcyhwaGkxKSxcbiAgICAgIHNpblBoaTAsIHNpblBoaTEgPSBzaW4ocGhpMSk7XG5cbiAgZm9yICg7IGkgPCBuOyArK2kpIHtcbiAgICBwb2ludCA9IHJpbmdbaV07XG4gICAgbGFtYmRhMCA9IGxhbWJkYTEsIGxhbWJkYTEgPSBwb2ludFswXSAqIHJhZGlhbnM7XG4gICAgcGhpMSA9IChwb2ludFsxXSAqIHJhZGlhbnMpIC8gMiArIHF1YXJ0ZXJQaTtcbiAgICBjb3NQaGkwID0gY29zUGhpMSwgY29zUGhpMSA9IGNvcyhwaGkxKTtcbiAgICBzaW5QaGkwID0gc2luUGhpMSwgc2luUGhpMSA9IHNpbihwaGkxKTtcblxuICAgIC8vIFNwaGVyaWNhbCBleGNlc3MgRSBmb3IgYSBzcGhlcmljYWwgdHJpYW5nbGUgd2l0aCB2ZXJ0aWNlczogc291dGggcG9sZSxcbiAgICAvLyBwcmV2aW91cyBwb2ludCwgY3VycmVudCBwb2ludC4gIFVzZXMgYSBmb3JtdWxhIGRlcml2ZWQgZnJvbSBDYWdub2xp4oCZc1xuICAgIC8vIHRoZW9yZW0uICBTZWUgVG9kaHVudGVyLCBTcGhlcmljYWwgVHJpZy4gKDE4NzEpLCBTZWMuIDEwMywgRXEuICgyKS5cbiAgICAvLyBTZWUgaHR0cHM6Ly9naXRodWIuY29tL2QzL2QzLWdlby9ibG9iL21hc3Rlci9SRUFETUUubWQjZ2VvQXJlYVxuICAgIHZhciBkTGFtYmRhID0gbGFtYmRhMSAtIGxhbWJkYTAsXG4gICAgICAgIHNkTGFtYmRhID0gZExhbWJkYSA+PSAwID8gMSA6IC0xLFxuICAgICAgICBhZExhbWJkYSA9IHNkTGFtYmRhICogZExhbWJkYSxcbiAgICAgICAgayA9IHNpblBoaTAgKiBzaW5QaGkxLFxuICAgICAgICB1ID0gY29zUGhpMCAqIGNvc1BoaTEgKyBrICogY29zKGFkTGFtYmRhKSxcbiAgICAgICAgdiA9IGsgKiBzZExhbWJkYSAqIHNpbihhZExhbWJkYSk7XG4gICAgc3VtICs9IGF0YW4yKHYsIHUpO1xuICB9XG5cbiAgcmV0dXJuIHN1bTtcbn1cblxuZnVuY3Rpb24gc3BoZXJpY2FsUmluZ0FyZWEocmluZywgaW50ZXJpb3IpIHtcbiAgdmFyIHN1bSA9IGhhbGZBcmVhKHJpbmcsIHRydWUpO1xuICBpZiAoaW50ZXJpb3IpIHN1bSAqPSAtMTtcbiAgcmV0dXJuIChzdW0gPCAwID8gdGF1ICsgc3VtIDogc3VtKSAqIDI7XG59XG5cbmZ1bmN0aW9uIHNwaGVyaWNhbFRyaWFuZ2xlQXJlYSh0KSB7XG4gIHJldHVybiBhYnMoaGFsZkFyZWEodCwgZmFsc2UpKSAqIDI7XG59XG5cbmV4cG9ydHMuZmlsdGVyID0gZmlsdGVyO1xuZXhwb3J0cy5maWx0ZXJBdHRhY2hlZCA9IGZpbHRlckF0dGFjaGVkO1xuZXhwb3J0cy5maWx0ZXJBdHRhY2hlZFdlaWdodCA9IGZpbHRlckF0dGFjaGVkV2VpZ2h0O1xuZXhwb3J0cy5maWx0ZXJXZWlnaHQgPSBmaWx0ZXJXZWlnaHQ7XG5leHBvcnRzLnBsYW5hclJpbmdBcmVhID0gcGxhbmFyUmluZ0FyZWE7XG5leHBvcnRzLnBsYW5hclRyaWFuZ2xlQXJlYSA9IHBsYW5hclRyaWFuZ2xlQXJlYTtcbmV4cG9ydHMucHJlc2ltcGxpZnkgPSBwcmVzaW1wbGlmeTtcbmV4cG9ydHMucXVhbnRpbGUgPSBxdWFudGlsZTtcbmV4cG9ydHMuc2ltcGxpZnkgPSBzaW1wbGlmeTtcbmV4cG9ydHMuc3BoZXJpY2FsUmluZ0FyZWEgPSBzcGhlcmljYWxSaW5nQXJlYTtcbmV4cG9ydHMuc3BoZXJpY2FsVHJpYW5nbGVBcmVhID0gc3BoZXJpY2FsVHJpYW5nbGVBcmVhO1xuXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgJ19fZXNNb2R1bGUnLCB7IHZhbHVlOiB0cnVlIH0pO1xuXG59KSkpO1xuIl19
