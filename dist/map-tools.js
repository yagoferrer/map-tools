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
    Config.version = '3.39';
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

//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJidWlsZC9hZGRGZWF0dXJlLmpzIiwiYnVpbGQvYWRkRmlsdGVyLmpzIiwiYnVpbGQvYWRkTWFwLmpzIiwiYnVpbGQvYWRkTWFya2VyLmpzIiwiYnVpbGQvYWRkUGFuZWwuanMiLCJidWlsZC9jZW50ZXIuanMiLCJidWlsZC9jb25maWcuanMiLCJidWlsZC9maWx0ZXIuanMiLCJidWlsZC9maW5kTWFya2VyQnlJZC5qcyIsImJ1aWxkL2luZm9XaW5kb3cuanMiLCJidWlsZC9sb2NhdGUuanMiLCJidWlsZC9tYXBUb29scy5qcyIsImJ1aWxkL21hcHMuanMiLCJidWlsZC9yZW1vdmVNYXJrZXIuanMiLCJidWlsZC9yZXNldE1hcmtlci5qcyIsImJ1aWxkL3RlbXBsYXRlLmpzIiwiYnVpbGQvdXBkYXRlRmVhdHVyZS5qcyIsImJ1aWxkL3VwZGF0ZU1hcC5qcyIsImJ1aWxkL3VwZGF0ZU1hcmtlci5qcyIsImJ1aWxkL3V0aWxzLmpzIiwibm9kZV9tb2R1bGVzL2Nyb3NzZmlsdGVyL2Nyb3NzZmlsdGVyLmpzIiwibm9kZV9tb2R1bGVzL2Nyb3NzZmlsdGVyL2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL3RvcG9qc29uL2Rpc3QvdG9wb2pzb24ubm9kZS5qcyIsIm5vZGVfbW9kdWxlcy90b3BvanNvbi9ub2RlX21vZHVsZXMvdG9wb2pzb24tY2xpZW50L2Rpc3QvdG9wb2pzb24tY2xpZW50LmpzIiwibm9kZV9tb2R1bGVzL3RvcG9qc29uL25vZGVfbW9kdWxlcy90b3BvanNvbi1zZXJ2ZXIvZGlzdC90b3BvanNvbi1zZXJ2ZXIuanMiLCJub2RlX21vZHVsZXMvdG9wb2pzb24vbm9kZV9tb2R1bGVzL3RvcG9qc29uLXNpbXBsaWZ5L2Rpc3QvdG9wb2pzb24tc2ltcGxpZnkuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQy9GQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxSUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5RkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNmQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDckdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2RUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNWQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzVFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbkNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDekRBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbkhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6M0NBO0FBQ0E7O0FDREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNiQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pmQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcDBCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiLy8vIDxyZWZlcmVuY2UgcGF0aD1cInR5cGluZ3MvdHNkLmQudHNcIi8+XG52YXIgdG9wb2pzb24gPSByZXF1aXJlKCd0b3BvanNvbicpO1xudmFyIHV0aWxzID0gcmVxdWlyZSgnLi91dGlscycpO1xudmFyIGFkZEZpbHRlciA9IHJlcXVpcmUoJy4vYWRkRmlsdGVyJyk7XG52YXIgQWRkRmVhdHVyZSA9IChmdW5jdGlvbiAoKSB7XG4gICAgZnVuY3Rpb24gQWRkRmVhdHVyZSh0aGF0KSB7XG4gICAgICAgIHRoaXMudGhhdCA9IHRoYXQ7XG4gICAgICAgIHZhciBhZGRGaWx0ZXJJbnN0YW5jZSA9IG5ldyBhZGRGaWx0ZXIodGhhdCwgJ2pzb24nKTtcbiAgICAgICAgdGhpcy5hZGRGaWx0ZXIgPSBmdW5jdGlvbiAoZmlsdGVycykge1xuICAgICAgICAgICAgcmV0dXJuIGFkZEZpbHRlckluc3RhbmNlLmFkZEZpbHRlcihmaWx0ZXJzKTtcbiAgICAgICAgfTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogQWRkcyBHZW9KU09OIEZlYXR1cmUgT3B0aW9ucyBsaWtlOiBzdHlsZVxuICAgICAqIEBwYXJhbSBmZWF0dXJlc1xuICAgICAqIEBwYXJhbSBvcHRpb25zXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBBZGRGZWF0dXJlLnByb3RvdHlwZS5hZGRGZWF0dXJlT3B0aW9ucyA9IGZ1bmN0aW9uIChmZWF0dXJlcywgb3B0aW9ucykge1xuICAgICAgICB2YXIgZmVhdHVyZSwgeDtcbiAgICAgICAgZm9yICh4IGluIGZlYXR1cmVzKSB7XG4gICAgICAgICAgICBpZiAoZmVhdHVyZXMuaGFzT3duUHJvcGVydHkoeCkpIHtcbiAgICAgICAgICAgICAgICBmZWF0dXJlID0gZmVhdHVyZXNbeF07XG4gICAgICAgICAgICAgICAgdmFyIHVpZCA9IHV0aWxzLmNyZWF0ZVVpZCgpO1xuICAgICAgICAgICAgICAgIGZlYXR1cmUudWlkID0gdWlkO1xuICAgICAgICAgICAgICAgIGZlYXR1cmUuZGF0YSA9IHsgdWlkOiB1aWQgfTtcbiAgICAgICAgICAgICAgICBmZWF0dXJlLmZvckVhY2hQcm9wZXJ0eShmdW5jdGlvbiAodmFsdWUsIGtleSkge1xuICAgICAgICAgICAgICAgICAgICBmZWF0dXJlLmRhdGFba2V5XSA9IHZhbHVlO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIGlmIChvcHRpb25zKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChvcHRpb25zLmZpbHRlcnMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIEFkZCBmaWx0ZXJzIGlmIG5vdCBkZWZpbmVkLlxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCF0aGlzLnRoYXQuanNvbi5maWx0ZXIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmFkZEZpbHRlcihvcHRpb25zLmZpbHRlcnMpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy50aGF0Lmpzb24uY3Jvc3NmaWx0ZXIuYWRkKFtmZWF0dXJlXSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgaWYgKG9wdGlvbnMuc3R5bGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMudGhhdC5pbnN0YW5jZS5kYXRhLm92ZXJyaWRlU3R5bGUoZmVhdHVyZSwgb3B0aW9ucy5zdHlsZSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgdGhpcy50aGF0Lmpzb24uYWxsW2ZlYXR1cmUuZGF0YS51aWRdID0gZmVhdHVyZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH07XG4gICAgLyoqXG4gICAgICogQWRkcyBhIFRvcG8gSlNPTiBmaWxlIGludG8gYSBNYXBcbiAgICAgKiBAcGFyYW0gZGF0YSBUaGUgcGFyc2VkIEpTT04gRmlsZVxuICAgICAqIEBwYXJhbSBvcHRpb25zXG4gICAgICovXG4gICAgQWRkRmVhdHVyZS5wcm90b3R5cGUuYWRkVG9wb0pzb24gPSBmdW5jdGlvbiAoZGF0YSwgb3B0aW9ucykge1xuICAgICAgICB2YXIgaXRlbSwgZ2VvSnNvbiwgZmVhdHVyZXMsIHg7XG4gICAgICAgIGZvciAoeCBpbiBvcHRpb25zKSB7XG4gICAgICAgICAgICBpZiAob3B0aW9ucy5oYXNPd25Qcm9wZXJ0eSh4KSkge1xuICAgICAgICAgICAgICAgIGl0ZW0gPSBvcHRpb25zW3hdO1xuICAgICAgICAgICAgICAgIGdlb0pzb24gPSB0b3BvanNvbi5mZWF0dXJlKGRhdGEsIGRhdGEub2JqZWN0c1tpdGVtLm9iamVjdF0pO1xuICAgICAgICAgICAgICAgIGZlYXR1cmVzID0gdGhpcy50aGF0Lmluc3RhbmNlLmRhdGEuYWRkR2VvSnNvbihnZW9Kc29uKTtcbiAgICAgICAgICAgICAgICB0aGlzLmFkZEZlYXR1cmVPcHRpb25zKGZlYXR1cmVzLCBpdGVtKTtcbiAgICAgICAgICAgICAgICBtYXBUb29scy5tYXBzW3RoaXMudGhhdC5pZF0uanNvbi5hbGxbaXRlbS5vYmplY3RdID0gZmVhdHVyZXM7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGZlYXR1cmVzO1xuICAgIH07XG4gICAgQWRkRmVhdHVyZS5wcm90b3R5cGUuYWRkR2VvSnNvbiA9IGZ1bmN0aW9uIChkYXRhLCBvcHRpb25zKSB7XG4gICAgICAgIHZhciBmZWF0dXJlcyA9IHRoaXMudGhhdC5pbnN0YW5jZS5kYXRhLmFkZEdlb0pzb24oZGF0YSwgb3B0aW9ucyk7XG4gICAgICAgIHRoaXMuYWRkRmVhdHVyZU9wdGlvbnMoZmVhdHVyZXMsIG9wdGlvbnMpO1xuICAgICAgICByZXR1cm4gZmVhdHVyZXM7XG4gICAgfTtcbiAgICByZXR1cm4gQWRkRmVhdHVyZTtcbn0pKCk7XG5tb2R1bGUuZXhwb3J0cyA9IEFkZEZlYXR1cmU7XG4iLCIvLy8gPHJlZmVyZW5jZSBwYXRoPVwidHlwaW5ncy90c2QuZC50c1wiLz5cbnZhciB1dGlscyA9IHJlcXVpcmUoJy4vdXRpbHMnKTtcbnZhciBBZGRGaWx0ZXIgPSAoZnVuY3Rpb24gKCkge1xuICAgIGZ1bmN0aW9uIEFkZEZpbHRlcih0aGF0LCB0eXBlKSB7XG4gICAgICAgIHRoaXMudGhhdCA9IHRoYXQ7XG4gICAgICAgIHRoaXMudHlwZSA9IHR5cGU7XG4gICAgfVxuICAgIEFkZEZpbHRlci5wcm90b3R5cGUuYWRkRmlsdGVyID0gZnVuY3Rpb24gKGZpbHRlcnMpIHtcbiAgICAgICAgdGhpcy50aGF0W3RoaXMudHlwZV0uY3Jvc3NmaWx0ZXIgPSB0aGlzLnRoYXRbdGhpcy50eXBlXS5jcm9zc2ZpbHRlciB8fCB0aGlzLnRoYXQuY3Jvc3NmaWx0ZXIoW10pO1xuICAgICAgICB0aGlzLnRoYXRbdGhpcy50eXBlXS5maWx0ZXIgPSB0aGlzLnRoYXRbdGhpcy50eXBlXS5maWx0ZXIgfHwge307XG4gICAgICAgIHZhciBkaW1lbnNpb24sIGl0ZW07XG4gICAgICAgIGlmICh0eXBlb2YgZmlsdGVycyA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgIGZpbHRlcnMgPSBbZmlsdGVyc107XG4gICAgICAgIH1cbiAgICAgICAgZm9yIChkaW1lbnNpb24gaW4gZmlsdGVycykge1xuICAgICAgICAgICAgaWYgKGZpbHRlcnMuaGFzT3duUHJvcGVydHkoZGltZW5zaW9uKSkge1xuICAgICAgICAgICAgICAgIGl0ZW0gPSBmaWx0ZXJzW2RpbWVuc2lvbl07XG4gICAgICAgICAgICAgICAgaWYgKHR5cGVvZiBpdGVtID09PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnRoYXRbdGhpcy50eXBlXS5maWx0ZXJbaXRlbV0gPSB0aGlzLnRoYXRbdGhpcy50eXBlXS5jcm9zc2ZpbHRlci5kaW1lbnNpb24odXRpbHMuZGVmYXVsdERpbWVuc2lvbihpdGVtKSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnRoYXRbdGhpcy50eXBlXS5maWx0ZXJbT2JqZWN0LmtleXMoaXRlbSlbMF1dID0gdGhpcy50aGF0W3RoaXMudHlwZV0uY3Jvc3NmaWx0ZXIuZGltZW5zaW9uKGl0ZW1bT2JqZWN0LmtleXMoaXRlbSlbMF1dKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9O1xuICAgIHJldHVybiBBZGRGaWx0ZXI7XG59KSgpO1xubW9kdWxlLmV4cG9ydHMgPSBBZGRGaWx0ZXI7XG4iLCIvLy8gPHJlZmVyZW5jZSBwYXRoPVwidHlwaW5ncy90c2QuZC50c1wiLz5cbnZhciBtYXBzID0gcmVxdWlyZSgnLi9tYXBzJyk7XG52YXIgY29uZmlnID0gcmVxdWlyZSgnLi9jb25maWcnKTtcbnZhciBBZGRNYXAgPSAoZnVuY3Rpb24gKCkge1xuICAgIGZ1bmN0aW9uIEFkZE1hcCh0aGF0KSB7XG4gICAgICAgIHRoaXMudGhhdCA9IHRoYXQ7XG4gICAgfVxuICAgIEFkZE1hcC5wcm90b3R5cGUuZ2V0RWxlbWVudCA9IGZ1bmN0aW9uIChhcmdzKSB7XG4gICAgICAgIGlmIChhcmdzLmVsKSB7XG4gICAgICAgICAgICByZXR1cm4gd2luZG93LmRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoYXJncy5lbCk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGFyZ3MuaWQpIHtcbiAgICAgICAgICAgIHJldHVybiB3aW5kb3cuZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoYXJncy5pZCk7XG4gICAgICAgIH1cbiAgICB9O1xuICAgIEFkZE1hcC5wcm90b3R5cGUuY3JlYXRlID0gZnVuY3Rpb24gKGFyZ3MsIGNiKSB7XG4gICAgICAgIHZhciBfdGhpcyA9IHRoaXM7XG4gICAgICAgIGNiID0gY2IgfHwgZnVuY3Rpb24gKCkge1xuICAgICAgICB9O1xuICAgICAgICB2YXIgbWFwT3B0aW9ucyA9IG1hcHMubWFwT3B0aW9ucyhhcmdzKTtcbiAgICAgICAgYXJncy5pZCA9IGFyZ3MuaWQgfHwgYXJncy5lbC5zdWJzdHJpbmcoMSk7XG4gICAgICAgIHRoaXMudGhhdC5pZCA9IGFyZ3MuaWQ7XG4gICAgICAgIHRoaXMudGhhdC5vcHRpb25zID0gYXJncztcbiAgICAgICAgdGhpcy50aGF0Lmluc3RhbmNlID0gbmV3IGdvb2dsZS5tYXBzLk1hcCh0aGlzLmdldEVsZW1lbnQoYXJncyksIG1hcE9wdGlvbnMpO1xuICAgICAgICB0aGlzLnRoYXQuZXZlbnRzID0gW107XG4gICAgICAgIC8vIEFkZCBFdmVudHNcbiAgICAgICAgaWYgKGFyZ3Mub24pIHtcbiAgICAgICAgICAgIHZhciBpO1xuICAgICAgICAgICAgZm9yIChpIGluIGFyZ3Mub24pIHtcbiAgICAgICAgICAgICAgICBpZiAoYXJncy5vbi5oYXNPd25Qcm9wZXJ0eShpKSkge1xuICAgICAgICAgICAgICAgICAgICBpZiAoY29uZmlnLmN1c3RvbUV2ZW50cy5pbmRleE9mKGkpID4gLTEpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMudGhhdC5ldmVudHMucHVzaChpKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBnb29nbGUubWFwcy5ldmVudC5hZGRMaXN0ZW5lcih0aGlzLnRoYXQuaW5zdGFuY2UsIGksIGFyZ3Mub25baV0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICB0aGlzLnRoYXQuaW5mb1dpbmRvdyA9IGZhbHNlO1xuICAgICAgICB0aGlzLnRoYXQudGVtcGxhdGVzID0ge1xuICAgICAgICAgICAgaW5mb1dpbmRvdzoge30sXG4gICAgICAgICAgICBwYW5lbDoge31cbiAgICAgICAgfTtcbiAgICAgICAgdGhpcy50aGF0LnVpZCA9IGFyZ3MudWlkO1xuICAgICAgICBtYXBUb29scy5tYXBzW3RoaXMudGhhdC5pZF0uaW5zdGFuY2UgPSB0aGlzLnRoYXQuaW5zdGFuY2U7XG4gICAgICAgIGdvb2dsZS5tYXBzLmV2ZW50LmFkZExpc3RlbmVyT25jZSh0aGlzLnRoYXQuaW5zdGFuY2UsICdpZGxlJywgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgY2IoZmFsc2UsIF90aGlzLnRoYXQpO1xuICAgICAgICB9KTtcbiAgICB9O1xuICAgIEFkZE1hcC5wcm90b3R5cGUudmFsaWRPcHRpb25zID0gZnVuY3Rpb24gKG9wdGlvbnMsIGNiKSB7XG4gICAgICAgIGlmICghb3B0aW9ucyB8fCAob3B0aW9ucyAmJiB0eXBlb2Ygb3B0aW9ucyAhPT0gJ29iamVjdCcpKSB7XG4gICAgICAgICAgICBjYihuZXcgRXJyb3IoJ1lvdSBtdXN0IHBhc3MgYSB2YWxpZCBmaXJzdCBwYXJhbWV0ZXI6IG9wdGlvbnMnKSk7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCFvcHRpb25zLmlkICYmICFvcHRpb25zLmVsKSB7XG4gICAgICAgICAgICBjYihuZXcgRXJyb3IoJ1lvdSBtdXN0IHBhc3MgYW4gXCJpZFwiIG9yIGEgXCJlbFwiIHByb3BlcnR5IHZhbHVlcycpKTtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoIW9wdGlvbnMubGF0IHx8ICFvcHRpb25zLmxuZykge1xuICAgICAgICAgICAgY2IobmV3IEVycm9yKCdZb3UgbXVzdCBwYXNzIHZhbGlkIFwibGF0XCIgKGxhdGl0dWRlKSBhbmQgXCJsbmdcIiAobG9uZ2l0dWRlKSB2YWx1ZXMnKSk7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfTtcbiAgICBBZGRNYXAucHJvdG90eXBlLmxvYWQgPSBmdW5jdGlvbiAob3B0aW9ucywgY2IpIHtcbiAgICAgICAgaWYgKHRoaXMudmFsaWRPcHRpb25zKG9wdGlvbnMsIGNiKSkge1xuICAgICAgICAgICAgdmFyIGlkID0gb3B0aW9ucy5pZCB8fCBvcHRpb25zLmVsLnN1YnN0cmluZygxKTtcbiAgICAgICAgICAgIG1hcFRvb2xzLm1hcHMgPSBtYXBUb29scy5tYXBzIHx8IHt9O1xuICAgICAgICAgICAgaWYgKG1hcFRvb2xzLm1hcHNbaWRdKSB7XG4gICAgICAgICAgICAgICAgdmFyIG1zZyA9ICdUaGVyZSBpcyBhbHJlYWR5IGFub3RoZXIgTWFwIHVzaW5nIHRoZSBzYW1lIGlkOiAnICsgaWQ7XG4gICAgICAgICAgICAgICAgY2IobmV3IEVycm9yKG1zZykpO1xuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHZhciB0aGF0ID0gdGhpcztcbiAgICAgICAgICAgIG1hcFRvb2xzLm1hcHNbaWRdID0ge1xuICAgICAgICAgICAgICAgIGNyZWF0ZTogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICB0aGF0LmNyZWF0ZSh0aGlzLmFyZ3VtZW50cywgY2IpO1xuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgYXJndW1lbnRzOiBvcHRpb25zXG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgLy8gU2V0IEdsb2JhbCBTdHJ1Y3R1cmVcbiAgICAgICAgICAgIG1hcFRvb2xzLm1hcHNbaWRdLm1hcmtlcnMgPSBtYXBUb29scy5tYXBzW2lkXS5tYXJrZXJzIHx8IHsgYWxsOiB7fSwgdGFnczoge30sIGRhdGFDaGFuZ2VkOiBmYWxzZSB9O1xuICAgICAgICAgICAgbWFwVG9vbHMubWFwc1tpZF0uanNvbiA9IG1hcFRvb2xzLm1hcHNbaWRdLmpzb24gfHwgeyBhbGw6IHt9LCBkYXRhQ2hhbmdlZDogZmFsc2UgfTtcbiAgICAgICAgICAgIHRoaXMudGhhdC5tYXJrZXJzID0gbWFwVG9vbHMubWFwc1tpZF0ubWFya2VycztcbiAgICAgICAgICAgIHRoaXMudGhhdC5qc29uID0gbWFwVG9vbHMubWFwc1tpZF0uanNvbjtcbiAgICAgICAgICAgIGlmIChvcHRpb25zLmFzeW5jICE9PSBmYWxzZSB8fCBvcHRpb25zLnN5bmMgPT09IHRydWUpIHtcbiAgICAgICAgICAgICAgICBtYXBzLmxvYWQoaWQsIG9wdGlvbnMpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgbWFwVG9vbHMubWFwc1tpZF0uY3JlYXRlKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9O1xuICAgIHJldHVybiBBZGRNYXA7XG59KSgpO1xubW9kdWxlLmV4cG9ydHMgPSBBZGRNYXA7XG4iLCIvLy8gPHJlZmVyZW5jZSBwYXRoPVwidHlwaW5ncy90c2QuZC50c1wiLz5cbnZhciB1dGlscyA9IHJlcXVpcmUoJy4vdXRpbHMnKTtcbnZhciBhZGRGaWx0ZXIgPSByZXF1aXJlKCcuL2FkZEZpbHRlcicpO1xudmFyIGluZm9XaW5kb3cgPSByZXF1aXJlKCcuL2luZm9XaW5kb3cnKTtcbnZhciBBZGRNYXJrZXIgPSAoZnVuY3Rpb24gKCkge1xuICAgIGZ1bmN0aW9uIEFkZE1hcmtlcih0aGF0KSB7XG4gICAgICAgIHRoaXMudGhhdCA9IHRoYXQ7XG4gICAgICAgIHRoaXMuaW5mb1dpbmRvdyA9IHt9O1xuICAgICAgICB2YXIgYWRkRmlsdGVySW5zdGFuY2UgPSBuZXcgYWRkRmlsdGVyKHRoYXQsICdtYXJrZXJzJyk7XG4gICAgICAgIHRoaXMuYWRkRmlsdGVyID0gZnVuY3Rpb24gKGZpbHRlcnMpIHtcbiAgICAgICAgICAgIHJldHVybiBhZGRGaWx0ZXJJbnN0YW5jZS5hZGRGaWx0ZXIoZmlsdGVycyk7XG4gICAgICAgIH07XG4gICAgICAgIHZhciBpbmZvV2luZG93SW5zdGFuY2UgPSBuZXcgaW5mb1dpbmRvdyh0aGF0KTtcbiAgICAgICAgdGhpcy5pbmZvV2luZG93LmFkZEV2ZW50cyA9IGZ1bmN0aW9uIChtYXJrZXIsIG9wdGlvbnMsIG1hcCkge1xuICAgICAgICAgICAgaW5mb1dpbmRvd0luc3RhbmNlLmFkZEV2ZW50cyhtYXJrZXIsIG9wdGlvbnMsIG1hcCk7XG4gICAgICAgIH07XG4gICAgfVxuICAgIEFkZE1hcmtlci5wcm90b3R5cGUuYWRkRXh0cmFPcHRpb25zID0gZnVuY3Rpb24gKG1hcmtlciwgb3B0aW9ucykge1xuICAgICAgICB2YXIgaTtcbiAgICAgICAgZm9yIChpIGluIG9wdGlvbnMpIHtcbiAgICAgICAgICAgIGlmIChvcHRpb25zLmhhc093blByb3BlcnR5KGkpKSB7XG4gICAgICAgICAgICAgICAgaWYgKCFvcHRpb25zLmZpbHRlcnMpIHtcbiAgICAgICAgICAgICAgICAgICAgbWFya2VyW2ldID0gb3B0aW9uc1tpXTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9O1xuICAgIEFkZE1hcmtlci5wcm90b3R5cGUuYWRkT3B0aW9ucyA9IGZ1bmN0aW9uIChtYXJrZXIsIGluc3RhbmNlKSB7XG4gICAgICAgIGlmIChtYXJrZXIubW92ZSkge1xuICAgICAgICAgICAgaW5zdGFuY2Uuc2V0QW5pbWF0aW9uKGdvb2dsZS5tYXBzLkFuaW1hdGlvblttYXJrZXIubW92ZS50b1VwcGVyQ2FzZSgpXSk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKG1hcmtlci5pbmZvV2luZG93KSB7XG4gICAgICAgICAgICB0aGlzLmluZm9XaW5kb3cuYWRkRXZlbnRzKGluc3RhbmNlLCBtYXJrZXIuaW5mb1dpbmRvdywgdGhpcy50aGF0Lmluc3RhbmNlKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAobWFya2VyLm9uKSB7XG4gICAgICAgICAgICB0aGlzLmFkZEV2ZW50cyhtYXJrZXIsIGluc3RhbmNlKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAobWFya2VyLmNhbGxiYWNrKSB7XG4gICAgICAgICAgICBtYXJrZXIuY2FsbGJhY2soaW5zdGFuY2UpO1xuICAgICAgICB9XG4gICAgfTtcbiAgICBBZGRNYXJrZXIucHJvdG90eXBlLl9hZGRNYXJrZXIgPSBmdW5jdGlvbiAobWFya2VyLCBvcHRpb25zKSB7XG4gICAgICAgIG1hcmtlci5tYXAgPSB0aGlzLnRoYXQuaW5zdGFuY2U7XG4gICAgICAgIG1hcmtlci5wb3NpdGlvbiA9IG5ldyBnb29nbGUubWFwcy5MYXRMbmcobWFya2VyLmxhdCwgbWFya2VyLmxuZyk7XG4gICAgICAgIC8vIEFkZHMgb3B0aW9ucyBzZXQgdmlhIDJuZCBwYXJhbWV0ZXIuIE92ZXJ3cml0ZXMgYW55IE1hcmtlciBvcHRpb25zIGFscmVhZHkgc2V0LlxuICAgICAgICBpZiAob3B0aW9ucykge1xuICAgICAgICAgICAgdGhpcy5hZGRFeHRyYU9wdGlvbnMobWFya2VyLCBvcHRpb25zKTtcbiAgICAgICAgfVxuICAgICAgICBtYXJrZXIuZGF0YSA9IG1hcmtlci5kYXRhIHx8IHt9O1xuICAgICAgICBtYXJrZXIuZGF0YS5fc2VsZiA9IG1hcmtlcjsgLy8gVGhpcyBoZWxwcyBtZSB0byBkbyBsYXRlciByZXNldE1hcmtlcigpXG4gICAgICAgIHRoaXMuc2V0VWlkKG1hcmtlcik7XG4gICAgICAgIC8vIEJlY2F1c2Ugd2UgYXJlIG5vdCBhbGxvd2luZyBkdXBsaWNhdGVzXG4gICAgICAgIGlmICh0aGlzLnRoYXQubWFya2Vycy5hbGxbbWFya2VyLnVpZF0pIHtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgICBpZiAob3B0aW9ucyAmJiBvcHRpb25zLmZpbHRlcnMpIHtcbiAgICAgICAgICAgIC8vIE9ubHkgYWRkIGZpbHRlcnMgaWYgbm90IGRlZmluZWQuXG4gICAgICAgICAgICBpZiAoIW1hcFRvb2xzLm1hcHNbdGhpcy50aGF0LmlkXS5tYXJrZXJzLmZpbHRlcikge1xuICAgICAgICAgICAgICAgIHRoaXMuYWRkRmlsdGVyKG9wdGlvbnMuZmlsdGVycyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgdmFyIGluc3RhbmNlID0gbmV3IGdvb2dsZS5tYXBzLk1hcmtlcihtYXJrZXIpO1xuICAgICAgICB0aGlzLnRoYXQubWFya2Vycy5jcm9zc2ZpbHRlciA9IHRoaXMudGhhdC5tYXJrZXJzLmNyb3NzZmlsdGVyIHx8IHRoaXMudGhhdC5jcm9zc2ZpbHRlcihbXSk7XG4gICAgICAgIHRoaXMudGhhdC5tYXJrZXJzLmZpbHRlciA9IHRoaXMudGhhdC5tYXJrZXJzLmZpbHRlciB8fCB7fTtcbiAgICAgICAgdGhpcy50aGF0Lm1hcmtlcnMuY3Jvc3NmaWx0ZXIuYWRkKFtpbnN0YW5jZV0pO1xuICAgICAgICB0aGlzLmFkZE9wdGlvbnMobWFya2VyLCBpbnN0YW5jZSk7XG4gICAgICAgIC8vIEFkZHMgTWFya2VyIFJlZmVyZW5jZSBvZiBlYWNoIE1hcmtlciB0byBcIm1hcmtlcnMuYWxsXCJcbiAgICAgICAgdGhpcy50aGF0Lm1hcmtlcnMuYWxsID0gbWFwVG9vbHMubWFwc1t0aGlzLnRoYXQuaWRdLm1hcmtlcnMuYWxsIHx8IHt9O1xuICAgICAgICB0aGlzLnRoYXQubWFya2Vycy5hbGxbbWFya2VyLnVpZF0gPSBpbnN0YW5jZTtcbiAgICAgICAgaWYgKG1hcmtlci50YWdzKSB7XG4gICAgICAgICAgICB0aGlzLmFkZE1hcmtlckJ5VGFnKG1hcmtlciwgaW5zdGFuY2UpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBpbnN0YW5jZTtcbiAgICB9O1xuICAgIEFkZE1hcmtlci5wcm90b3R5cGUuc2V0VWlkID0gZnVuY3Rpb24gKG1hcmtlcikge1xuICAgICAgICBpZiAodGhpcy50aGF0LnVpZCAmJiBtYXJrZXJbdGhpcy50aGF0LnVpZF0pIHtcbiAgICAgICAgICAgIG1hcmtlci5kYXRhLnVpZCA9IG1hcmtlclt0aGlzLnRoYXQudWlkXTtcbiAgICAgICAgICAgIG1hcmtlci51aWQgPSBtYXJrZXIuZGF0YS51aWQ7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKG1hcmtlci5kYXRhLnVpZCAmJiAhbWFya2VyLnVpZCkge1xuICAgICAgICAgICAgbWFya2VyLnVpZCA9IG1hcmtlci5kYXRhLnVpZDtcbiAgICAgICAgfVxuICAgICAgICBpZiAoIW1hcmtlci51aWQpIHtcbiAgICAgICAgICAgIG1hcmtlci5kYXRhLnVpZCA9IHV0aWxzLmNyZWF0ZVVpZCgpO1xuICAgICAgICAgICAgbWFya2VyLnVpZCA9IG1hcmtlci5kYXRhLnVpZDtcbiAgICAgICAgfVxuICAgIH07XG4gICAgQWRkTWFya2VyLnByb3RvdHlwZS5hZGRNYXJrZXJCeVRhZyA9IGZ1bmN0aW9uIChtYXJrZXIsIGluc3RhbmNlKSB7XG4gICAgICAgIGlmICh1dGlscy5pc0FycmF5KG1hcmtlci50YWdzKSkge1xuICAgICAgICAgICAgdmFyIGksIHRhZztcbiAgICAgICAgICAgIGZvciAoaSBpbiBtYXJrZXIudGFncykge1xuICAgICAgICAgICAgICAgIGlmIChtYXJrZXIudGFncy5oYXNPd25Qcm9wZXJ0eShpKSkge1xuICAgICAgICAgICAgICAgICAgICB0YWcgPSBtYXJrZXIudGFnc1tpXTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy50aGF0Lm1hcmtlcnMudGFnc1t0YWddID0gdGhpcy50aGF0Lm1hcmtlcnMudGFnc1t0YWddIHx8IHt9O1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnRoYXQubWFya2Vycy50YWdzW3RhZ11baW5zdGFuY2UuZGF0YS51aWRdID0gaW5zdGFuY2U7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgdGhpcy50aGF0Lm1hcmtlcnMudGFnc1ttYXJrZXIudGFnc10gPSB0aGlzLnRoYXQubWFya2Vycy50YWdzW21hcmtlci50YWdzXSB8fCB7fTtcbiAgICAgICAgICAgIHRoaXMudGhhdC5tYXJrZXJzLnRhZ3NbbWFya2VyLnRhZ3NdW2luc3RhbmNlLmRhdGEudWlkXSA9IGluc3RhbmNlO1xuICAgICAgICB9XG4gICAgfTtcbiAgICBBZGRNYXJrZXIucHJvdG90eXBlLmFkZEV2ZW50cyA9IGZ1bmN0aW9uIChtYXJrZXIsIGluc3RhbmNlKSB7XG4gICAgICAgIHZhciBpO1xuICAgICAgICBmb3IgKGkgaW4gbWFya2VyLm9uKSB7XG4gICAgICAgICAgICBpZiAobWFya2VyLm9uLmhhc093blByb3BlcnR5KGkpKSB7XG4gICAgICAgICAgICAgICAgZ29vZ2xlLm1hcHMuZXZlbnQuYWRkTGlzdGVuZXIoaW5zdGFuY2UsIGksIG1hcmtlci5vbltpXSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9O1xuICAgIC8qKlxuICAgICAqIEFkZHMgTWFya2VycyB0byB0aGUgTWFwXG4gICAgICogQHBhcmFtIGFyZ3MgQXJyYXkgb3IgTWFya2Vyc1xuICAgICAqIEBwYXJhbSBvcHRpb25zIHRoaW5ncyBsaWtlIGdyb3VwcyBldGNcbiAgICAgKiBAcmV0dXJucyB7QXJyYXl9IGFsbCB0aGUgaW5zdGFuY2VzIG9mIHRoZSBtYXJrZXJzLlxuICAgICAqL1xuICAgIEFkZE1hcmtlci5wcm90b3R5cGUuYWRkTWFya2VyID0gZnVuY3Rpb24gKGFyZ3MsIG9wdGlvbnMpIHtcbiAgICAgICAgaWYgKHV0aWxzLmlzQXJyYXkoYXJncykpIHtcbiAgICAgICAgICAgIGlmIChhcmdzLmxlbmd0aCA+PSAxKSB7XG4gICAgICAgICAgICAgICAgdmFyIG1hcmtlciwgbWFya2VycyA9IFtdO1xuICAgICAgICAgICAgICAgIGZvciAodmFyIGkgaW4gYXJncykge1xuICAgICAgICAgICAgICAgICAgICBpZiAoYXJncy5oYXNPd25Qcm9wZXJ0eShpKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgbWFya2VyID0gdGhpcy5fYWRkTWFya2VyKGFyZ3NbaV0sIG9wdGlvbnMpO1xuICAgICAgICAgICAgICAgICAgICAgICAgbWFya2Vycy5wdXNoKG1hcmtlcik7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgdGhpcy50aGF0Lm1hcmtlcnMuZGF0YUNoYW5nZWQgPSB0cnVlO1xuICAgICAgICAgICAgICAgIHJldHVybiBtYXJrZXJzO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIFtdO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMudGhhdC5tYXJrZXJzLmRhdGFDaGFuZ2VkID0gdHJ1ZTtcbiAgICAgICAgcmV0dXJuIHRoaXMuX2FkZE1hcmtlcihhcmdzLCBvcHRpb25zKTtcbiAgICB9O1xuICAgIHJldHVybiBBZGRNYXJrZXI7XG59KSgpO1xubW9kdWxlLmV4cG9ydHMgPSBBZGRNYXJrZXI7XG4iLCIvLy8gPHJlZmVyZW5jZSBwYXRoPVwidGVtcGxhdGUudHNcIi8+XG4vLy8gPHJlZmVyZW5jZSBwYXRoPVwiY29uZmlnLnRzXCIvPlxuLy8vIDxyZWZlcmVuY2UgcGF0aD1cInR5cGluZ3MvdHNkLmQudHNcIi8+XG52YXIgY29uZmlnID0gcmVxdWlyZSgnLi9jb25maWcnKTtcbnZhciB0ZW1wbGF0ZSA9IHJlcXVpcmUoJy4vdGVtcGxhdGUnKTtcbnZhciBBZGRQYW5lbCA9IChmdW5jdGlvbiAoKSB7XG4gICAgZnVuY3Rpb24gQWRkUGFuZWwodGhhdCkge1xuICAgICAgICB0aGlzLnRoYXQgPSB0aGF0O1xuICAgICAgICB2YXIgdGVtcGxhdGVJbnN0YW5jZSA9IG5ldyB0ZW1wbGF0ZSh0aGF0KTtcbiAgICAgICAgdGhpcy50ZW1wbGF0ZSA9IGZ1bmN0aW9uICh0eXBlLCB1cmwsIGNiKSB7XG4gICAgICAgICAgICByZXR1cm4gdGVtcGxhdGVJbnN0YW5jZS5sb2FkKHR5cGUsIHVybCwgY2IpO1xuICAgICAgICB9O1xuICAgIH1cbiAgICBBZGRQYW5lbC5wcm90b3R5cGUuZ2V0UG9zaXRpb25LZXkgPSBmdW5jdGlvbiAocG9zKSB7XG4gICAgICAgIHJldHVybiBwb3MudG9VcHBlckNhc2UoKS5tYXRjaCgvXFxTKy9nKS5qb2luKCdfJyk7XG4gICAgfTtcbiAgICBBZGRQYW5lbC5wcm90b3R5cGUuaHkyY21tbCA9IGZ1bmN0aW9uIChrKSB7XG4gICAgICAgIHJldHVybiBrLnJlcGxhY2UoLy0oLikvZywgZnVuY3Rpb24gKG0sIGcpIHtcbiAgICAgICAgICAgIHJldHVybiBnLnRvVXBwZXJDYXNlKCk7XG4gICAgICAgIH0pO1xuICAgIH07XG4gICAgQWRkUGFuZWwucHJvdG90eXBlLkhUTUxQYXJzZXIgPSBmdW5jdGlvbiAoYUhUTUxTdHJpbmcpIHtcbiAgICAgICAgdmFyIGNvbnRhaW5lciA9IHdpbmRvdy5kb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICAgICAgY29udGFpbmVyLmlubmVySFRNTCA9IGFIVE1MU3RyaW5nO1xuICAgICAgICByZXR1cm4gY29udGFpbmVyO1xuICAgIH07XG4gICAgQWRkUGFuZWwucHJvdG90eXBlLm9uU3VjY2VzcyA9IGZ1bmN0aW9uIChvcHRpb25zLCBwb3NpdGlvbiwgcGFuZWwsIGNiKSB7XG4gICAgICAgIHZhciBlLCBydWxlO1xuICAgICAgICAvLyBwb3NpdGlvbmluZyBvcHRpb25zXG4gICAgICAgIGlmIChvcHRpb25zLnBvc2l0aW9uKSB7XG4gICAgICAgICAgICAvLyBjb252ZXJ0IHRvIGdvb2dsZSBDb250cm9sUG9zaXRpb24gbWFwIHBvc2l0aW9uIGtleXNcbiAgICAgICAgICAgIG9wdGlvbnMucG9zaXRpb24gPSB0aGlzLmdldFBvc2l0aW9uS2V5KG9wdGlvbnMucG9zaXRpb24pO1xuICAgICAgICAgICAgcG9zaXRpb24gPSBnb29nbGUubWFwcy5Db250cm9sUG9zaXRpb25bb3B0aW9ucy5wb3NpdGlvbl07XG4gICAgICAgIH1cbiAgICAgICAgLy8gc3R5bGUgb3B0aW9uc1xuICAgICAgICBpZiAodHlwZW9mIG9wdGlvbnMuc3R5bGUgPT09ICdvYmplY3QnKSB7XG4gICAgICAgICAgICBmb3IgKHJ1bGUgaW4gb3B0aW9ucy5zdHlsZSkge1xuICAgICAgICAgICAgICAgIGlmIChvcHRpb25zLnN0eWxlLmhhc093blByb3BlcnR5KHJ1bGUpKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBydWxlS2V5ID0gdGhpcy5oeTJjbW1sKHJ1bGUpO1xuICAgICAgICAgICAgICAgICAgICBwYW5lbC5zdHlsZVtydWxlS2V5XSA9IG9wdGlvbnMuc3R5bGVbcnVsZV07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIC8vIGV2ZW50IGhhbmRsZXJcbiAgICAgICAgaWYgKG9wdGlvbnMuZXZlbnRzKSB7XG4gICAgICAgICAgICBmb3IgKGUgaW4gb3B0aW9ucy5ldmVudHMpIHtcbiAgICAgICAgICAgICAgICBpZiAob3B0aW9ucy5ldmVudHMuaGFzT3duUHJvcGVydHkoZSkpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGtleXMgPSBlLm1hdGNoKC9cXFMrL2cpO1xuICAgICAgICAgICAgICAgICAgICB2YXIgZXZlbnQgPSBrZXlzLnNwbGljZSgtMSk7IC8vZXZlbnQgdHlwZVxuICAgICAgICAgICAgICAgICAgICB2YXIgc2VsZWN0b3IgPSBrZXlzLmpvaW4oJyAnKTsgLy8gc2VsZWN0b3Igc3RyaW5nXG4gICAgICAgICAgICAgICAgICAgIHZhciBlbGVtZW50cyA9IHBhbmVsLnF1ZXJ5U2VsZWN0b3JBbGwoc2VsZWN0b3IpO1xuICAgICAgICAgICAgICAgICAgICBbXS5mb3JFYWNoLmNhbGwoZWxlbWVudHMsIGZ1bmN0aW9uIChlbG0pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGdvb2dsZS5tYXBzLmV2ZW50LmFkZERvbUxpc3RlbmVyKGVsbSwgZXZlbnQsIG9wdGlvbnMuZXZlbnRzW2VdKTtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHRoaXMudGhhdC5pbnN0YW5jZS5jb250cm9sc1twb3NpdGlvbl0ucHVzaChwYW5lbCk7XG4gICAgICAgIHRoaXMudGhhdC5wYW5lbHMgPSB0aGlzLnRoYXQucGFuZWxzIHx8IHt9O1xuICAgICAgICB0aGlzLnRoYXQucGFuZWxzW3Bvc2l0aW9uXSA9IHBhbmVsO1xuICAgICAgICBjYihmYWxzZSwgcGFuZWwpO1xuICAgIH07XG4gICAgQWRkUGFuZWwucHJvdG90eXBlLmFkZFBhbmVsID0gZnVuY3Rpb24gKG9wdGlvbnMsIGNiKSB7XG4gICAgICAgIHZhciBfdGhpcyA9IHRoaXM7XG4gICAgICAgIGNiID0gY2IgfHwgZnVuY3Rpb24gKCkge1xuICAgICAgICB9O1xuICAgICAgICB2YXIgcG9zaXRpb24sIHBhbmVsO1xuICAgICAgICAvLyBkZWZhdWx0IHBvc2l0aW9uXG4gICAgICAgIG9wdGlvbnMucG9zaXRpb24gPSBvcHRpb25zLnBvc2l0aW9uIHx8IGNvbmZpZy5wYW5lbFBvc2l0aW9uO1xuICAgICAgICBpZiAob3B0aW9ucy50ZW1wbGF0ZVVSTCkge1xuICAgICAgICAgICAgdGhpcy50ZW1wbGF0ZSgncGFuZWwnLCBvcHRpb25zLnRlbXBsYXRlVVJMLCBmdW5jdGlvbiAoZXJyLCByZXNwb25zZSkge1xuICAgICAgICAgICAgICAgIGlmICghZXJyKSB7XG4gICAgICAgICAgICAgICAgICAgIHBhbmVsID0gX3RoaXMuSFRNTFBhcnNlcihyZXNwb25zZSk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBfdGhpcy5vblN1Y2Nlc3Mob3B0aW9ucywgcG9zaXRpb24sIHBhbmVsLCBjYik7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBjYihlcnIpO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBpZiAodHlwZW9mIG9wdGlvbnMudGVtcGxhdGUgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICAgICAgcGFuZWwgPSB0aGlzLkhUTUxQYXJzZXIob3B0aW9ucy50ZW1wbGF0ZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICBwYW5lbCA9IG9wdGlvbnMudGVtcGxhdGU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aGlzLm9uU3VjY2VzcyhvcHRpb25zLCBwb3NpdGlvbiwgcGFuZWwsIGNiKTtcbiAgICAgICAgfVxuICAgIH07XG4gICAgcmV0dXJuIEFkZFBhbmVsO1xufSkoKTtcbm1vZHVsZS5leHBvcnRzID0gQWRkUGFuZWw7XG4iLCIvLy8gPHJlZmVyZW5jZSBwYXRoPVwidHlwaW5ncy90c2QuZC50c1wiLz5cbnZhciBDZW50ZXIgPSAoZnVuY3Rpb24gKCkge1xuICAgIGZ1bmN0aW9uIENlbnRlcigpIHtcbiAgICB9XG4gICAgQ2VudGVyLnByb3RvdHlwZS5wb3MgPSBmdW5jdGlvbiAobGF0LCBsbmcpIHtcbiAgICAgICAgdmFyIHBvc2l0aW9uO1xuICAgICAgICBpZiAobGF0ICYmIGxuZykge1xuICAgICAgICAgICAgcG9zaXRpb24gPSBuZXcgZ29vZ2xlLm1hcHMuTGF0TG5nKGxhdCwgbG5nKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHBvc2l0aW9uID0gbmV3IGdvb2dsZS5tYXBzLkxhdExuZyh0aGlzLm9wdGlvbnMubGF0LCB0aGlzLm9wdGlvbnMubG5nKTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLmluc3RhbmNlLnNldENlbnRlcihwb3NpdGlvbik7XG4gICAgfTtcbiAgICByZXR1cm4gQ2VudGVyO1xufSkoKTtcbm1vZHVsZS5leHBvcnRzID0gQ2VudGVyO1xuIiwiLy8vIDxyZWZlcmVuY2UgcGF0aD1cInR5cGluZ3MvdHNkLmQudHNcIi8+XG52YXIgQ29uZmlnID0gKGZ1bmN0aW9uICgpIHtcbiAgICBmdW5jdGlvbiBDb25maWcoKSB7XG4gICAgfVxuICAgIENvbmZpZy52ZXJzaW9uID0gJzMuMzknO1xuICAgIENvbmZpZy51cmwgPSAnLy9tYXBzLmdvb2dsZWFwaXMuY29tL21hcHMvYXBpL2pzJztcbiAgICBDb25maWcuem9vbSA9IDg7XG4gICAgQ29uZmlnLmN1c3RvbU1hcE9wdGlvbnMgPSBbJ2lkJywgJ2xhdCcsICdsbmcnLCAndHlwZScsICd1aWQnXTtcbiAgICBDb25maWcuY3VzdG9tTWFya2VyT3B0aW9ucyA9IFsnbGF0JywgJ2xuZycsICdtb3ZlJywgJ2luZm9XaW5kb3cnLCAnb24nLCAnY2FsbGJhY2snLCAndGFncyddO1xuICAgIENvbmZpZy5wYW5lbFBvc2l0aW9uID0gJ1RPUF9MRUZUJztcbiAgICBDb25maWcuY3VzdG9tSW5mb1dpbmRvd09wdGlvbnMgPSBbJ29wZW4nLCAnY2xvc2UnXTtcbiAgICBDb25maWcuY3VzdG9tRXZlbnRzID0gWydtYXJrZXJfdmlzaWJpbGl0eV9jaGFuZ2VkJ107XG4gICAgcmV0dXJuIENvbmZpZztcbn0pKCk7XG5tb2R1bGUuZXhwb3J0cyA9IENvbmZpZztcbiIsIi8vLyA8cmVmZXJlbmNlIHBhdGg9XCJ0eXBpbmdzL3RzZC5kLnRzXCIvPlxudmFyIGFkZEZpbHRlciA9IHJlcXVpcmUoJy4vYWRkRmlsdGVyJyk7XG52YXIgRmlsdGVyID0gKGZ1bmN0aW9uICgpIHtcbiAgICBmdW5jdGlvbiBGaWx0ZXIodGhhdCwgdHlwZSkge1xuICAgICAgICB0aGlzLnRoYXQgPSB0aGF0O1xuICAgICAgICB0aGlzLnR5cGUgPSB0eXBlO1xuICAgICAgICB0aGlzLm9yZGVyTG9va3VwID0ge1xuICAgICAgICAgICAgQVNDOiAndG9wJyxcbiAgICAgICAgICAgIERFU0M6ICdib3R0b20nXG4gICAgICAgIH07XG4gICAgICAgIHRoaXMudXRpbHMgPSByZXF1aXJlKCcuL3V0aWxzJyk7XG4gICAgICAgIHZhciBhZGRGaWx0ZXJJbnN0YW5jZSA9IG5ldyBhZGRGaWx0ZXIodGhhdCwgdHlwZSk7XG4gICAgICAgIHRoaXMuYWRkRmlsdGVyID0gZnVuY3Rpb24gKGZpbHRlcnMpIHtcbiAgICAgICAgICAgIHJldHVybiBhZGRGaWx0ZXJJbnN0YW5jZS5hZGRGaWx0ZXIoZmlsdGVycyk7XG4gICAgICAgIH07XG4gICAgfVxuICAgIC8vIGNmIGhhcyBpdCdzIG93biBzdGF0ZSwgZm9yIGVhY2ggZGltZW5zaW9uXG4gICAgLy8gYmVmb3JlIGVhY2ggbmV3IGZpbHRlcmluZyB3ZSBuZWVkIHRvIGNsZWFyIHRoaXMgc3RhdGVcbiAgICBGaWx0ZXIucHJvdG90eXBlLmNsZWFyQWxsID0gZnVuY3Rpb24gKGRpbWVuc2lvblNldCkge1xuICAgICAgICB2YXIgaSwgZGltZW5zaW9uO1xuICAgICAgICBmb3IgKGkgaW4gZGltZW5zaW9uU2V0KSB7XG4gICAgICAgICAgICBpZiAoZGltZW5zaW9uU2V0Lmhhc093blByb3BlcnR5KGkpKSB7XG4gICAgICAgICAgICAgICAgZGltZW5zaW9uID0gZGltZW5zaW9uU2V0W2ldO1xuICAgICAgICAgICAgICAgIGlmICh0aGlzLnRoYXRbdGhpcy50eXBlXS5kYXRhQ2hhbmdlZCA9PT0gdHJ1ZSkge1xuICAgICAgICAgICAgICAgICAgICBkaW1lbnNpb24uZGlzcG9zZSgpO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmFkZEZpbHRlcihpKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGRpbWVuc2lvbi5maWx0ZXJBbGwoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9O1xuICAgIEZpbHRlci5wcm90b3R5cGUuZmlsdGVyQnlUYWcgPSBmdW5jdGlvbiAocXVlcnkpIHtcbiAgICAgICAgLy8gaWYgdGhlIHNlYXJjaCBxdWVyeSBpcyBhbiBhcnJheSB3aXRoIG9ubHkgb25lIGl0ZW0gdGhlbiBqdXN0IHVzZSB0aGF0IHN0cmluZ1xuICAgICAgICBpZiAodGhpcy51dGlscy5pc0FycmF5KHF1ZXJ5KSAmJiBxdWVyeS5sZW5ndGggPT09IDEpIHtcbiAgICAgICAgICAgIHF1ZXJ5ID0gcXVlcnlbMF07XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHR5cGVvZiBxdWVyeSA9PT0gXCJzdHJpbmdcIikge1xuICAgICAgICAgICAgaWYgKHRoaXMudGhhdFt0aGlzLnR5cGVdLnRhZ3NbcXVlcnldKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMudXRpbHMudG9BcnJheSh0aGlzLnRoYXRbdGhpcy50eXBlXS50YWdzW3F1ZXJ5XSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gW107XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICB2YXIgbWFya2VycyA9IHRoaXMuZmV0Y2hCeVRhZyhxdWVyeSk7XG4gICAgICAgICAgICBpZiAodHlwZW9mIG1hcmtlcnMgPT09IFwib2JqZWN0XCIpIHtcbiAgICAgICAgICAgICAgICBtYXJrZXJzID0gdGhpcy51dGlscy50b0FycmF5KG1hcmtlcnMpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIG1hcmtlcnM7XG4gICAgICAgIH1cbiAgICB9O1xuICAgIEZpbHRlci5wcm90b3R5cGUuZmV0Y2hCeVRhZyA9IGZ1bmN0aW9uIChxdWVyeSkge1xuICAgICAgICB2YXIgbWFya2VyczsgLy8gc3RvcmUgZmlyc3Qgc2V0IG9mIG1hcmtlcnMgdG8gY29tcGFyZVxuICAgICAgICB2YXIgaTtcbiAgICAgICAgZm9yIChpID0gMDsgaSA8IHF1ZXJ5Lmxlbmd0aCAtIDE7IGkrKykge1xuICAgICAgICAgICAgdmFyIHRhZyA9IHF1ZXJ5W2ldO1xuICAgICAgICAgICAgdmFyIG5leHRUYWcgPSBxdWVyeVtpICsgMV07XG4gICAgICAgICAgICAvLyBudWxsIGNoZWNrIGtpY2tzIGluIHdoZW4gd2UgZ2V0IHRvIHRoZSBlbmQgb2YgdGhlIGZvciBsb29wXG4gICAgICAgICAgICBtYXJrZXJzID0gdGhpcy51dGlscy5nZXRDb21tb25PYmplY3QodGhpcy50aGF0W3RoaXMudHlwZV0udGFnc1t0YWddLCB0aGlzLnRoYXRbdGhpcy50eXBlXS50YWdzW25leHRUYWddKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gbWFya2VycztcbiAgICB9O1xuICAgIEZpbHRlci5wcm90b3R5cGUuZmlsdGVyID0gZnVuY3Rpb24gKGFyZ3MsIG9wdGlvbnMpIHtcbiAgICAgICAgLy8gUmV0dXJuIEFsbCBpdGVtcyBpZiBubyBhcmd1bWVudHMgYXJlIHN1cHBsaWVkXG4gICAgICAgIGlmICh0eXBlb2YgYXJncyA9PT0gJ3VuZGVmaW5lZCcgJiYgdHlwZW9mIG9wdGlvbnMgPT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy51dGlscy50b0FycmF5KHRoaXMudGhhdFt0aGlzLnR5cGVdLmFsbCk7XG4gICAgICAgIH1cbiAgICAgICAgdmFyIGRpbWVuc2lvbiwgb3JkZXIsIGxpbWl0LCBxdWVyeTtcbiAgICAgICAgaWYgKHR5cGVvZiBhcmdzID09PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgZGltZW5zaW9uID0gYXJncztcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIGRpbWVuc2lvbiA9IE9iamVjdC5rZXlzKGFyZ3MpWzBdO1xuICAgICAgICAgICAgcXVlcnkgPSBhcmdzW2RpbWVuc2lvbl07XG4gICAgICAgICAgICBpZiAoZGltZW5zaW9uID09PSAndGFncycpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5maWx0ZXJCeVRhZyhxdWVyeSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5jbGVhckFsbCh0aGlzLnRoYXRbdGhpcy50eXBlXS5maWx0ZXIpO1xuICAgICAgICAvLyBBZGQgQ3Jvc3NmaWx0ZXIgRGltZW5zaW9uIGlmIGl0IGRvZXMgbm90IGV4aXN0LlxuICAgICAgICBpZiAoIXRoaXMudGhhdFt0aGlzLnR5cGVdLmZpbHRlcltkaW1lbnNpb25dKSB7XG4gICAgICAgICAgICB0aGlzLmFkZEZpbHRlcihkaW1lbnNpb24pO1xuICAgICAgICB9XG4gICAgICAgIG9yZGVyID0gKG9wdGlvbnMgJiYgb3B0aW9ucy5vcmRlciAmJiB0aGlzLm9yZGVyTG9va3VwW29wdGlvbnMub3JkZXJdKSA/IHRoaXMub3JkZXJMb29rdXBbb3B0aW9ucy5vcmRlcl0gOiB0aGlzLm9yZGVyTG9va3VwW09iamVjdC5rZXlzKHRoaXMub3JkZXJMb29rdXApWzBdXTtcbiAgICAgICAgbGltaXQgPSAob3B0aW9ucyAmJiBvcHRpb25zLmxpbWl0KSA/IG9wdGlvbnMubGltaXQgOiBJbmZpbml0eTtcbiAgICAgICAgaWYgKHR5cGVvZiBxdWVyeSA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgIHF1ZXJ5ID0gbnVsbDtcbiAgICAgICAgfVxuICAgICAgICB2YXIgcmVzdWx0ID0gdGhpcy50aGF0W3RoaXMudHlwZV0uZmlsdGVyW2RpbWVuc2lvbl0uZmlsdGVyKHF1ZXJ5KVtvcmRlcl0obGltaXQpO1xuICAgICAgICB0aGlzLnRoYXRbdGhpcy50eXBlXS5kYXRhQ2hhbmdlZCA9IGZhbHNlO1xuICAgICAgICBpZiAobGltaXQgPT09IDEpIHtcbiAgICAgICAgICAgIHJldHVybiByZXN1bHRbMF07XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9O1xuICAgIHJldHVybiBGaWx0ZXI7XG59KSgpO1xubW9kdWxlLmV4cG9ydHMgPSBGaWx0ZXI7XG4iLCIvLy8gPHJlZmVyZW5jZSBwYXRoPVwidHlwaW5ncy90c2QuZC50c1wiLz5cbnZhciBGaW5kTWFya2VyQnlJZCA9IChmdW5jdGlvbiAoKSB7XG4gICAgZnVuY3Rpb24gRmluZE1hcmtlckJ5SWQodGhhdCkge1xuICAgICAgICB0aGlzLnRoYXQgPSB0aGF0O1xuICAgIH1cbiAgICBGaW5kTWFya2VyQnlJZC5wcm90b3R5cGUuZmluZCA9IGZ1bmN0aW9uIChtYXJrZXIpIHtcbiAgICAgICAgaWYgKG1hcmtlci5kYXRhICYmIG1hcmtlci5kYXRhLnVpZCkge1xuICAgICAgICAgICAgcmV0dXJuIG1hcmtlcjtcbiAgICAgICAgfVxuICAgICAgICBpZiAobWFya2VyLnVpZCAmJiBtYXBUb29scy5tYXBzW3RoaXMudGhhdC5pZF0ubWFya2Vycy5hbGxbbWFya2VyLnVpZF0pIHtcbiAgICAgICAgICAgIHJldHVybiBtYXBUb29scy5tYXBzW3RoaXMudGhhdC5pZF0ubWFya2Vycy5hbGxbbWFya2VyLnVpZF07XG4gICAgICAgIH1cbiAgICB9O1xuICAgIHJldHVybiBGaW5kTWFya2VyQnlJZDtcbn0pKCk7XG5tb2R1bGUuZXhwb3J0cyA9IEZpbmRNYXJrZXJCeUlkO1xuIiwiLy8vIDxyZWZlcmVuY2UgcGF0aD1cInR5cGluZ3MvdHNkLmQudHNcIi8+XG52YXIgSW5mb1dpbmRvdyA9IChmdW5jdGlvbiAoKSB7XG4gICAgZnVuY3Rpb24gSW5mb1dpbmRvdyh0aGF0KSB7XG4gICAgICAgIHRoaXMudGhhdCA9IHRoYXQ7XG4gICAgICAgIHRoaXMudXRpbHMgPSByZXF1aXJlKCcuL3V0aWxzJyk7XG4gICAgICAgIHRoaXMuY29uZmlnID0gcmVxdWlyZSgnLi9jb25maWcnKTtcbiAgICB9XG4gICAgSW5mb1dpbmRvdy5wcm90b3R5cGUuaW5mb1dpbmRvdyA9IGZ1bmN0aW9uIChtYXAsIG1hcmtlciwgYXJncykge1xuICAgICAgICB2YXIgY29udGVudCA9IGZhbHNlO1xuICAgICAgICBpZiAobWFya2VyLmluZm9XaW5kb3cuY29udGVudCkge1xuICAgICAgICAgICAgaWYgKG1hcmtlci5pbmZvV2luZG93LmNvbnRlbnQuaW5kZXhPZigneycpID4gLTEpIHtcbiAgICAgICAgICAgICAgICBjb250ZW50ID0gYXJncy5jb250ZW50LnJlcGxhY2UoL1xceyhcXHcrKVxcfS9nLCBmdW5jdGlvbiAobSwgdmFyaWFibGUpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG1hcmtlci5kYXRhW3ZhcmlhYmxlXSB8fCAnJztcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNvbnRlbnQgPSBjb250ZW50IHx8IG1hcmtlci5pbmZvV2luZG93LmNvbnRlbnQ7XG4gICAgICAgIH1cbiAgICAgICAgdmFyIG9wdGlvbnMgPSB0aGlzLnV0aWxzLmNsb25lKGFyZ3MpO1xuICAgICAgICBvcHRpb25zLmNvbnRlbnQgPSBjb250ZW50O1xuICAgICAgICB0aGlzLnRoYXQuaW5mb1dpbmRvdyA9IG5ldyBnb29nbGUubWFwcy5JbmZvV2luZG93KG9wdGlvbnMpO1xuICAgICAgICB0aGlzLnRoYXQuaW5mb1dpbmRvdy5vcGVuKG1hcCwgbWFya2VyKTtcbiAgICB9O1xuICAgIEluZm9XaW5kb3cucHJvdG90eXBlLm9wZW4gPSBmdW5jdGlvbiAobWFwLCBtYXJrZXIsIG9wdGlvbnMpIHtcbiAgICAgICAgdGhpcy5jbG9zZSgpO1xuICAgICAgICB0aGlzLmluZm9XaW5kb3cobWFwLCBtYXJrZXIsIG9wdGlvbnMpO1xuICAgIH07XG4gICAgSW5mb1dpbmRvdy5wcm90b3R5cGUuaXNPcGVuID0gZnVuY3Rpb24gKGluZm9XaW5kb3cpIHtcbiAgICAgICAgdmFyIG1hcCA9IGluZm9XaW5kb3cuZ2V0TWFwKCk7XG4gICAgICAgIHJldHVybiAobWFwICE9PSBudWxsICYmIHR5cGVvZiBtYXAgIT09IFwidW5kZWZpbmVkXCIpO1xuICAgIH07XG4gICAgSW5mb1dpbmRvdy5wcm90b3R5cGUuY2xvc2UgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGNsZWFyVGltZW91dCh0aGlzLnRpbWVyKTtcbiAgICAgICAgaWYgKHRoaXMudGhhdC5pbmZvV2luZG93ICYmIHRoaXMuaXNPcGVuKHRoaXMudGhhdC5pbmZvV2luZG93KSkge1xuICAgICAgICAgICAgdGhpcy50aGF0LmluZm9XaW5kb3cuY2xvc2UoKTtcbiAgICAgICAgfVxuICAgIH07XG4gICAgSW5mb1dpbmRvdy5wcm90b3R5cGUuYWRkRXZlbnRzID0gZnVuY3Rpb24gKG1hcmtlciwgb3B0aW9ucywgbWFwKSB7XG4gICAgICAgIHZhciBfdGhpcyA9IHRoaXM7XG4gICAgICAgIHZhciBhcmdzID0gdGhpcy51dGlscy5wcmVwYXJlT3B0aW9ucyhvcHRpb25zLCB0aGlzLmNvbmZpZy5jdXN0b21JbmZvV2luZG93T3B0aW9ucyk7XG4gICAgICAgIHZhciBvcGVuT24gPSAoYXJncy5jdXN0b20gJiYgYXJncy5jdXN0b20ub3BlbiAmJiBhcmdzLmN1c3RvbS5vcGVuLm9uKSA/IGFyZ3MuY3VzdG9tLm9wZW4ub24gOiAnY2xpY2snO1xuICAgICAgICB2YXIgY2xvc2VPbiA9IChhcmdzLmN1c3RvbSAmJiBhcmdzLmN1c3RvbS5jbG9zZSAmJiBhcmdzLmN1c3RvbS5jbG9zZS5vbikgPyBhcmdzLmN1c3RvbS5jbG9zZS5vbiA6ICdjbGljayc7XG4gICAgICAgIC8vIFRvZ2dsZSBFZmZlY3Qgd2hlbiB1c2luZyB0aGUgc2FtZSBtZXRob2QgdG8gT3BlbiBhbmQgQ2xvc2UuXG4gICAgICAgIGlmIChvcGVuT24gPT09IGNsb3NlT24pIHtcbiAgICAgICAgICAgIGdvb2dsZS5tYXBzLmV2ZW50LmFkZExpc3RlbmVyKG1hcmtlciwgb3Blbk9uLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgaWYgKCFfdGhpcy50aGF0LmluZm9XaW5kb3cgfHwgIV90aGlzLmlzT3BlbihfdGhpcy50aGF0LmluZm9XaW5kb3cpKSB7XG4gICAgICAgICAgICAgICAgICAgIF90aGlzLm9wZW4obWFwLCBtYXJrZXIsIGFyZ3MuZGVmYXVsdHMpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgX3RoaXMuY2xvc2UoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIGdvb2dsZS5tYXBzLmV2ZW50LmFkZExpc3RlbmVyKG1hcmtlciwgb3Blbk9uLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgX3RoaXMub3BlbihtYXAsIG1hcmtlciwgYXJncy5kZWZhdWx0cyk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIGdvb2dsZS5tYXBzLmV2ZW50LmFkZExpc3RlbmVyKG1hcmtlciwgY2xvc2VPbiwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIGlmIChhcmdzLmN1c3RvbS5jbG9zZS5kdXJhdGlvbikge1xuICAgICAgICAgICAgICAgICAgICBfdGhpcy50aW1lciA9IHNldFRpbWVvdXQoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgX3RoaXMuY2xvc2UoKTtcbiAgICAgICAgICAgICAgICAgICAgfSwgYXJncy5jdXN0b20uY2xvc2UuZHVyYXRpb24pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgX3RoaXMuY2xvc2UoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgIH07XG4gICAgcmV0dXJuIEluZm9XaW5kb3c7XG59KSgpO1xubW9kdWxlLmV4cG9ydHMgPSBJbmZvV2luZG93O1xuIiwidmFyIExvY2F0ZSA9IChmdW5jdGlvbiAoKSB7XG4gICAgZnVuY3Rpb24gTG9jYXRlKCkge1xuICAgIH1cbiAgICBMb2NhdGUucHJvdG90eXBlLmxvY2F0ZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIGNlbnRlciA9IHRoaXMuaW5zdGFuY2UuZ2V0Q2VudGVyKCk7XG4gICAgICAgIHJldHVybiB7IGxhdDogY2VudGVyLmxhdCgpLCBsbmc6IGNlbnRlci5sbmcoKSB9O1xuICAgIH07XG4gICAgcmV0dXJuIExvY2F0ZTtcbn0pKCk7XG5tb2R1bGUuZXhwb3J0cyA9IExvY2F0ZTtcbiIsIi8vLyA8cmVmZXJlbmNlIHBhdGg9XCJ0eXBpbmdzL3RzZC5kLnRzXCIvPlxudmFyIGFkZE1hcmtlciA9IHJlcXVpcmUoJy4vYWRkTWFya2VyJyk7XG52YXIgYWRkRmVhdHVyZSA9IHJlcXVpcmUoJy4vYWRkRmVhdHVyZScpO1xudmFyIGFkZFBhbmVsID0gcmVxdWlyZSgnLi9hZGRQYW5lbCcpO1xudmFyIGNlbnRlciA9IHJlcXVpcmUoJy4vY2VudGVyJyk7XG52YXIgbG9jYXRlID0gcmVxdWlyZSgnLi9sb2NhdGUnKTtcbnZhciB1cGRhdGVNYXJrZXIgPSByZXF1aXJlKCcuL3VwZGF0ZU1hcmtlcicpO1xudmFyIHVwZGF0ZU1hcCA9IHJlcXVpcmUoJy4vdXBkYXRlTWFwJyk7XG52YXIgdXBkYXRlRmVhdHVyZSA9IHJlcXVpcmUoJy4vdXBkYXRlRmVhdHVyZScpO1xudmFyIGFkZE1hcCA9IHJlcXVpcmUoJy4vYWRkTWFwJyk7XG52YXIgcmVtb3ZlTWFya2VyID0gcmVxdWlyZSgnLi9yZW1vdmVNYXJrZXInKTtcbnZhciByZXNldE1hcmtlciA9IHJlcXVpcmUoJy4vcmVzZXRNYXJrZXInKTtcbnZhciBmaWx0ZXIgPSByZXF1aXJlKCcuL2ZpbHRlcicpO1xudmFyIG1hcFRvb2xzID0gKGZ1bmN0aW9uICgpIHtcbiAgICBmdW5jdGlvbiBtYXBUb29scyhvcHRpb25zLCBjYikge1xuICAgICAgICB0aGlzLmNyb3NzZmlsdGVyID0gcmVxdWlyZSgnY3Jvc3NmaWx0ZXInKTtcbiAgICAgICAgdmFyIGFkZE1hcmtlckluc3RhbmNlID0gbmV3IGFkZE1hcmtlcih0aGlzKTtcbiAgICAgICAgdGhpcy5hZGRNYXJrZXIgPSBmdW5jdGlvbiAobWFya2VyLCBvcHRpb25zKSB7XG4gICAgICAgICAgICByZXR1cm4gYWRkTWFya2VySW5zdGFuY2UuYWRkTWFya2VyKG1hcmtlciwgb3B0aW9ucyk7XG4gICAgICAgIH07XG4gICAgICAgIHZhciBhZGRGZWF0dXJlSW5zdGFuY2UgPSBuZXcgYWRkRmVhdHVyZSh0aGlzKTtcbiAgICAgICAgdGhpcy5hZGRUb3BvSnNvbiA9IGZ1bmN0aW9uIChkYXRhLCBvcHRpb25zKSB7XG4gICAgICAgICAgICByZXR1cm4gYWRkRmVhdHVyZUluc3RhbmNlLmFkZFRvcG9Kc29uKGRhdGEsIG9wdGlvbnMpO1xuICAgICAgICB9O1xuICAgICAgICB0aGlzLmFkZEdlb0pzb24gPSBmdW5jdGlvbiAoZGF0YSwgb3B0aW9ucykge1xuICAgICAgICAgICAgcmV0dXJuIGFkZEZlYXR1cmVJbnN0YW5jZS5hZGRHZW9Kc29uKGRhdGEsIG9wdGlvbnMpO1xuICAgICAgICB9O1xuICAgICAgICB2YXIgYWRkUGFuZWxJbnN0YW5jZSA9IG5ldyBhZGRQYW5lbCh0aGlzKTtcbiAgICAgICAgdGhpcy5hZGRQYW5lbCA9IGZ1bmN0aW9uIChvcHRpb25zLCBjYikge1xuICAgICAgICAgICAgcmV0dXJuIGFkZFBhbmVsSW5zdGFuY2UuYWRkUGFuZWwob3B0aW9ucywgY2IpO1xuICAgICAgICB9O1xuICAgICAgICB0aGlzLmNlbnRlciA9IG5ldyBjZW50ZXIoKS5wb3M7XG4gICAgICAgIHRoaXMubG9jYXRlID0gbmV3IGxvY2F0ZSgpLmxvY2F0ZTtcbiAgICAgICAgdmFyIHVwZGF0ZU1hcmtlckluc3RhbmNlID0gbmV3IHVwZGF0ZU1hcmtlcih0aGlzKTtcbiAgICAgICAgdGhpcy51cGRhdGVNYXJrZXIgPSBmdW5jdGlvbiAoYXJncywgb3B0aW9ucykge1xuICAgICAgICAgICAgcmV0dXJuIHVwZGF0ZU1hcmtlckluc3RhbmNlLnVwZGF0ZShhcmdzLCBvcHRpb25zKTtcbiAgICAgICAgfTtcbiAgICAgICAgdmFyIHVwZGF0ZU1hcEluc3RhbmNlID0gbmV3IHVwZGF0ZU1hcCh0aGlzKTtcbiAgICAgICAgdGhpcy51cGRhdGVNYXAgPSBmdW5jdGlvbiAoYXJncykge1xuICAgICAgICAgICAgdXBkYXRlTWFwSW5zdGFuY2UudXBkYXRlTWFwKGFyZ3MpO1xuICAgICAgICB9O1xuICAgICAgICB2YXIgdXBkYXRlRmVhdHVyZUluc3RhbmNlID0gbmV3IHVwZGF0ZUZlYXR1cmUodGhpcyk7XG4gICAgICAgIHRoaXMudXBkYXRlRmVhdHVyZSA9IGZ1bmN0aW9uIChhcmdzLCBvcHRpb25zKSB7XG4gICAgICAgICAgICByZXR1cm4gdXBkYXRlRmVhdHVyZUluc3RhbmNlLnVwZGF0ZShhcmdzLCBvcHRpb25zKTtcbiAgICAgICAgfTtcbiAgICAgICAgdmFyIHJlbW92ZU1hcmtlckluc3RhbmNlID0gbmV3IHJlbW92ZU1hcmtlcih0aGlzKTtcbiAgICAgICAgdGhpcy5yZW1vdmVNYXJrZXIgPSBmdW5jdGlvbiAoYXJncykge1xuICAgICAgICAgICAgcmV0dXJuIHJlbW92ZU1hcmtlckluc3RhbmNlLnJlbW92ZU1hcmtlcihhcmdzKTtcbiAgICAgICAgfTtcbiAgICAgICAgdmFyIHJlc2V0TWFya2VySW5zdGFuY2UgPSBuZXcgcmVzZXRNYXJrZXIodGhpcyk7XG4gICAgICAgIHRoaXMucmVzZXRNYXJrZXIgPSBmdW5jdGlvbiAoYXJncywgb3B0aW9ucykge1xuICAgICAgICAgICAgcmV0dXJuIHJlc2V0TWFya2VySW5zdGFuY2UucmVzZXRNYXJrZXIoYXJncywgb3B0aW9ucyk7XG4gICAgICAgIH07XG4gICAgICAgIHZhciBmaW5kTWFya2VyID0gbmV3IGZpbHRlcih0aGlzLCAnbWFya2VycycpO1xuICAgICAgICB0aGlzLmZpbmRNYXJrZXIgPSBmdW5jdGlvbiAoYXJncywgb3B0aW9ucykge1xuICAgICAgICAgICAgcmV0dXJuIGZpbmRNYXJrZXIuZmlsdGVyKGFyZ3MsIG9wdGlvbnMpO1xuICAgICAgICB9O1xuICAgICAgICAvLyBVbml0IFRlc3RzP1xuICAgICAgICB2YXIgZmluZEZlYXR1cmUgPSBuZXcgZmlsdGVyKHRoaXMsICdqc29uJyk7XG4gICAgICAgIHRoaXMuZmluZEZlYXR1cmUgPSBmdW5jdGlvbiAoYXJncywgb3B0aW9ucykge1xuICAgICAgICAgICAgcmV0dXJuIGZpbmRGZWF0dXJlLmZpbHRlcihhcmdzLCBvcHRpb25zKTtcbiAgICAgICAgfTtcbiAgICAgICAgdmFyIG1hcCA9IG5ldyBhZGRNYXAodGhpcyk7XG4gICAgICAgIG1hcC5sb2FkKG9wdGlvbnMsIGNiKTtcbiAgICB9XG4gICAgbWFwVG9vbHMucHJvdG90eXBlLnpvb20gPSBmdW5jdGlvbiAoem9vbSkge1xuICAgICAgICBpZiAodHlwZW9mIHpvb20gPT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5pbnN0YW5jZS5nZXRab29tKCk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICB0aGlzLmluc3RhbmNlLnNldFpvb20oem9vbSk7XG4gICAgICAgIH1cbiAgICB9O1xuICAgIHJldHVybiBtYXBUb29scztcbn0pKCk7XG5tb2R1bGUuZXhwb3J0cyA9IG1hcFRvb2xzO1xuIiwiLy8vIDxyZWZlcmVuY2UgcGF0aD1cInR5cGluZ3MvdHNkLmQudHNcIi8+XG52YXIgdXRpbHMgPSByZXF1aXJlKCcuL3V0aWxzJyk7XG52YXIgY29uZmlnID0gcmVxdWlyZSgnLi9jb25maWcnKTtcbnZhciBNYXBzID0gKGZ1bmN0aW9uICgpIHtcbiAgICBmdW5jdGlvbiBNYXBzKCkge1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBJbmplY3RzIEdvb2dsZSBBUEkgSmF2YXNjcmlwdCBGaWxlIGFuZCBhZGRzIGEgY2FsbGJhY2sgdG8gbG9hZCB0aGUgR29vZ2xlIE1hcHMgQXN5bmMuXG4gICAgICogQHR5cGUge3tsb2FkOiBGdW5jdGlvbn19XG4gICAgICogQHByaXZhdGVcbiAgICAgKlxuICAgICAqIEByZXR1cm5zIHRoZSBlbGVtZW50IGFwcGVuZGVkXG4gICAgICovXG4gICAgTWFwcy5sb2FkID0gZnVuY3Rpb24gKGlkLCBhcmdzKSB7XG4gICAgICAgIHZhciB2ZXJzaW9uID0gYXJncy52ZXJzaW9uIHx8IGNvbmZpZy52ZXJzaW9uO1xuICAgICAgICB2YXIgc2NyaXB0ID0gd2luZG93LmRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3NjcmlwdCcpO1xuICAgICAgICBzY3JpcHQudHlwZSA9ICd0ZXh0L2phdmFzY3JpcHQnO1xuICAgICAgICBzY3JpcHQuc3JjID0gXCJcIiArIGNvbmZpZy51cmwgKyBcIj92PVwiICsgdmVyc2lvbiArIFwiJmtleT1cIiArIGFyZ3Mua2V5ICsgXCImY2FsbGJhY2s9bWFwVG9vbHMubWFwcy5cIiArIGlkICsgXCIuY3JlYXRlXCI7XG4gICAgICAgIHJldHVybiB3aW5kb3cuZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZChzY3JpcHQpO1xuICAgIH07XG4gICAgTWFwcy5tYXBPcHRpb25zID0gZnVuY3Rpb24gKGFyZ3MpIHtcbiAgICAgICAgLy8gVG8gY2xvbmUgQXJndW1lbnRzIGV4Y2x1ZGluZyBjdXN0b21NYXBPcHRpb25zXG4gICAgICAgIHZhciByZXN1bHQgPSB1dGlscy5jbG9uZShhcmdzLCBjb25maWcuY3VzdG9tTWFwT3B0aW9ucyk7XG4gICAgICAgIHJlc3VsdC56b29tID0gYXJncy56b29tIHx8IGNvbmZpZy56b29tO1xuICAgICAgICBpZiAoYXJncy5sYXQgJiYgYXJncy5sbmcpIHtcbiAgICAgICAgICAgIHJlc3VsdC5jZW50ZXIgPSBuZXcgZ29vZ2xlLm1hcHMuTGF0TG5nKGFyZ3MubGF0LCBhcmdzLmxuZyk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGFyZ3MudHlwZSkge1xuICAgICAgICAgICAgcmVzdWx0Lm1hcFR5cGVJZCA9IGdvb2dsZS5tYXBzLk1hcFR5cGVJZFthcmdzLnR5cGVdIHx8IGZhbHNlO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfTtcbiAgICByZXR1cm4gTWFwcztcbn0pKCk7XG5tb2R1bGUuZXhwb3J0cyA9IE1hcHM7XG4iLCIvLy8gPHJlZmVyZW5jZSBwYXRoPVwidHlwaW5ncy90c2QuZC50c1wiLz5cbnZhciBmaW5kTWFya2VyID0gcmVxdWlyZSgnLi9maW5kTWFya2VyQnlJZCcpO1xudmFyIFJlbW92ZU1hcmtlciA9IChmdW5jdGlvbiAoKSB7XG4gICAgZnVuY3Rpb24gUmVtb3ZlTWFya2VyKHRoYXQpIHtcbiAgICAgICAgdGhpcy50aGF0ID0gdGhhdDtcbiAgICAgICAgdmFyIGZpbmRNYXJrZXJJbnN0YW5jZSA9IG5ldyBmaW5kTWFya2VyKHRoYXQpO1xuICAgICAgICB0aGlzLmZpbmRNYXJrZXIgPSBmdW5jdGlvbiAobWFya2VyKSB7XG4gICAgICAgICAgICByZXR1cm4gZmluZE1hcmtlckluc3RhbmNlLmZpbmQobWFya2VyKTtcbiAgICAgICAgfTtcbiAgICB9XG4gICAgUmVtb3ZlTWFya2VyLnByb3RvdHlwZS5yZW1vdmVCdWxrID0gZnVuY3Rpb24gKGFyZ3MpIHtcbiAgICAgICAgdmFyIG1hcmtlciwgeDtcbiAgICAgICAgZm9yICh4IGluIGFyZ3MpIHtcbiAgICAgICAgICAgIGlmIChhcmdzLmhhc093blByb3BlcnR5KHgpKSB7XG4gICAgICAgICAgICAgICAgbWFya2VyID0gYXJnc1t4XTtcbiAgICAgICAgICAgICAgICB0aGlzLnJlbW92ZSh0aGlzLmZpbmRNYXJrZXIobWFya2VyKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9O1xuICAgIFJlbW92ZU1hcmtlci5wcm90b3R5cGUucmVtb3ZlTWFya2VyID0gZnVuY3Rpb24gKGFyZ3MpIHtcbiAgICAgICAgaWYgKHR5cGVvZiBhcmdzID09PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgdGhpcy5yZW1vdmVCdWxrKHRoaXMudGhhdC5tYXJrZXJzLmFsbCk7XG4gICAgICAgIH1cbiAgICAgICAgdmFyIHR5cGUgPSBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwoYXJncyk7XG4gICAgICAgIGlmICh0eXBlID09PSAnW29iamVjdCBPYmplY3RdJykge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMucmVtb3ZlKHRoaXMuZmluZE1hcmtlcihhcmdzKSk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHR5cGUgPT09ICdbb2JqZWN0IEFycmF5XScpIHtcbiAgICAgICAgICAgIHRoaXMucmVtb3ZlQnVsayhhcmdzKTtcbiAgICAgICAgfVxuICAgIH07XG4gICAgUmVtb3ZlTWFya2VyLnByb3RvdHlwZS5yZW1vdmUgPSBmdW5jdGlvbiAobWFya2VyKSB7XG4gICAgICAgIG1hcmtlci5zZXRNYXAobnVsbCk7XG4gICAgICAgIGRlbGV0ZSBtYXBUb29scy5tYXBzW3RoaXMudGhhdC5pZF0ubWFya2Vycy5hbGxbbWFya2VyLmRhdGEudWlkXTtcbiAgICB9O1xuICAgIHJldHVybiBSZW1vdmVNYXJrZXI7XG59KSgpO1xubW9kdWxlLmV4cG9ydHMgPSBSZW1vdmVNYXJrZXI7XG4iLCIvLy8gPHJlZmVyZW5jZSBwYXRoPVwidHlwaW5ncy90c2QuZC50c1wiLz5cbnZhciB1dGlscyA9IHJlcXVpcmUoJy4vdXRpbHMnKTtcbnZhciBjb25maWcgPSByZXF1aXJlKCcuL2NvbmZpZycpO1xudmFyIGZpbmRNYXJrZXIgPSByZXF1aXJlKCcuL2ZpbmRNYXJrZXJCeUlkJyk7XG52YXIgdXBkYXRlTWFya2VyID0gcmVxdWlyZSgnLi91cGRhdGVNYXJrZXInKTtcbnZhciBSZXNldE1hcmtlciA9IChmdW5jdGlvbiAoKSB7XG4gICAgZnVuY3Rpb24gUmVzZXRNYXJrZXIodGhhdCkge1xuICAgICAgICB0aGlzLnRoYXQgPSB0aGF0O1xuICAgICAgICB2YXIgZmluZE1hcmtlckluc3RhbmNlID0gbmV3IGZpbmRNYXJrZXIodGhhdCk7XG4gICAgICAgIHRoaXMuZmluZE1hcmtlciA9IGZ1bmN0aW9uIChtYXJrZXIpIHtcbiAgICAgICAgICAgIHJldHVybiBmaW5kTWFya2VySW5zdGFuY2UuZmluZChtYXJrZXIpO1xuICAgICAgICB9O1xuICAgICAgICB0aGlzLnVwZGF0ZU1hcmtlciA9IG5ldyB1cGRhdGVNYXJrZXIodGhhdCk7XG4gICAgfVxuICAgIFJlc2V0TWFya2VyLnByb3RvdHlwZS5yZXNldEJ1bGsgPSBmdW5jdGlvbiAobWFya2Vycywgb3B0aW9ucykge1xuICAgICAgICB2YXIgeDtcbiAgICAgICAgZm9yICh4IGluIG1hcmtlcnMpIHtcbiAgICAgICAgICAgIGlmIChtYXJrZXJzLmhhc093blByb3BlcnR5KHgpKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5yZXNldChtYXJrZXJzW3hdLCBvcHRpb25zKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH07XG4gICAgUmVzZXRNYXJrZXIucHJvdG90eXBlLnJlc2V0TWFya2VyID0gZnVuY3Rpb24gKGFyZ3MsIG9wdGlvbnMpIHtcbiAgICAgICAgdmFyIHR5cGUgPSBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwoYXJncyk7XG4gICAgICAgIHZhciByZXN1bHQ7XG4gICAgICAgIGlmICh0eXBlID09PSAnW29iamVjdCBPYmplY3RdJykge1xuICAgICAgICAgICAgcmVzdWx0ID0gdGhpcy5yZXNldCh0aGlzLmZpbmRNYXJrZXIoYXJncyksIG9wdGlvbnMpO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0eXBlID09PSAnW29iamVjdCBBcnJheV0nKSB7XG4gICAgICAgICAgICByZXN1bHQgPSB0aGlzLnJlc2V0QnVsayhhcmdzLCBvcHRpb25zKTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLnRoYXQubWFya2Vycy5kYXRhQ2hhbmdlZCA9IHRydWU7XG4gICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfTtcbiAgICBSZXNldE1hcmtlci5wcm90b3R5cGUuZm9ybWF0T3B0aW9ucyA9IGZ1bmN0aW9uIChtYXJrZXIsIG9wdGlvbnMpIHtcbiAgICAgICAgdmFyIGtleSwgb3AgPSB7fTtcbiAgICAgICAgdmFyIHR5cGUgPSBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwob3B0aW9ucyk7XG4gICAgICAgIGlmICh0eXBlID09PSAnW29iamVjdCBTdHJpbmddJykge1xuICAgICAgICAgICAgb3Bbb3B0aW9uc10gPSBtYXJrZXIuZGF0YS5fc2VsZltvcHRpb25zXTtcbiAgICAgICAgfVxuICAgICAgICBpZiAodHlwZSA9PT0gJ1tvYmplY3QgQXJyYXldJykge1xuICAgICAgICAgICAgZm9yIChrZXkgaW4gb3B0aW9ucykge1xuICAgICAgICAgICAgICAgIGlmIChvcHRpb25zLmhhc093blByb3BlcnR5KGtleSkpIHtcbiAgICAgICAgICAgICAgICAgICAgb3Bbb3B0aW9uc1trZXldXSA9IG1hcmtlci5kYXRhLl9zZWxmW29wdGlvbnNba2V5XV07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBvcDtcbiAgICB9O1xuICAgIFJlc2V0TWFya2VyLnByb3RvdHlwZS5yZXNldCA9IGZ1bmN0aW9uIChtYXJrZXIsIG9wdGlvbnMpIHtcbiAgICAgICAgdmFyIHByZXBhcmVkT3B0aW9ucyA9IHV0aWxzLnByZXBhcmVPcHRpb25zKHRoaXMuZm9ybWF0T3B0aW9ucyhtYXJrZXIsIG9wdGlvbnMpLCBjb25maWcuY3VzdG9tTWFya2VyT3B0aW9ucyk7XG4gICAgICAgIHRoaXMudXBkYXRlTWFya2VyLmN1c3RvbVVwZGF0ZShtYXJrZXIsIHByZXBhcmVkT3B0aW9ucyk7XG4gICAgICAgIHJldHVybiBtYXJrZXI7XG4gICAgfTtcbiAgICByZXR1cm4gUmVzZXRNYXJrZXI7XG59KSgpO1xubW9kdWxlLmV4cG9ydHMgPSBSZXNldE1hcmtlcjtcbiIsInZhciBUZW1wbGF0ZSA9IChmdW5jdGlvbiAoKSB7XG4gICAgZnVuY3Rpb24gVGVtcGxhdGUodGhhdCkge1xuICAgICAgICB0aGlzLnRoYXQgPSB0aGF0O1xuICAgIH1cbiAgICBUZW1wbGF0ZS5wcm90b3R5cGUubG9hZCA9IGZ1bmN0aW9uICh0eXBlLCB1cmwsIGNiKSB7XG4gICAgICAgIHZhciBfdGhpcyA9IHRoaXM7XG4gICAgICAgIGlmICh0aGlzLnRoYXQudGVtcGxhdGVzW3R5cGVdW3VybF0pIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLnRoYXQudGVtcGxhdGVzW3R5cGVdW3VybF07XG4gICAgICAgIH1cbiAgICAgICAgdmFyIHhociA9IG5ldyBYTUxIdHRwUmVxdWVzdCgpO1xuICAgICAgICB4aHIub3BlbihcIkdFVFwiLCB1cmwpO1xuICAgICAgICB4aHIub25sb2FkID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgaWYgKHhoci5yZWFkeVN0YXRlID09PSA0KSB7XG4gICAgICAgICAgICAgICAgaWYgKHhoci5zdGF0dXMgPT09IDIwMCkge1xuICAgICAgICAgICAgICAgICAgICBfdGhpcy50aGF0LnRlbXBsYXRlc1t0eXBlXVt1cmxdID0geGhyLnJlc3BvbnNlVGV4dDtcbiAgICAgICAgICAgICAgICAgICAgY2IoZmFsc2UsIHhoci5yZXNwb25zZVRleHQpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgY2IobmV3IEVycm9yKHhoci5zdGF0dXNUZXh0KSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgICAgICB4aHIuc2VuZChudWxsKTtcbiAgICB9O1xuICAgIHJldHVybiBUZW1wbGF0ZTtcbn0pKCk7XG5tb2R1bGUuZXhwb3J0cyA9IFRlbXBsYXRlO1xuIiwiLy8vIDxyZWZlcmVuY2UgcGF0aD1cInR5cGluZ3MvdHNkLmQudHNcIi8+XG52YXIgVXBkYXRlRmVhdHVyZSA9IChmdW5jdGlvbiAoKSB7XG4gICAgZnVuY3Rpb24gVXBkYXRlRmVhdHVyZSh0aGF0KSB7XG4gICAgICAgIHRoaXMudGhhdCA9IHRoYXQ7XG4gICAgfVxuICAgIFVwZGF0ZUZlYXR1cmUucHJvdG90eXBlLnVwZGF0ZVN0eWxlID0gZnVuY3Rpb24gKGYsIHN0eWxlKSB7XG4gICAgICAgIGlmICh0eXBlb2Ygc3R5bGUgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgIHZhciBzdHlsZU9wdGlvbnMgPSBzdHlsZS5jYWxsKGYpO1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMudGhhdC5pbnN0YW5jZS5kYXRhLm92ZXJyaWRlU3R5bGUoZiwgc3R5bGVPcHRpb25zKTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLnRoYXQuaW5zdGFuY2UuZGF0YS5vdmVycmlkZVN0eWxlKGYsIHN0eWxlKTtcbiAgICB9O1xuICAgIFVwZGF0ZUZlYXR1cmUucHJvdG90eXBlLmZpbmRBbmRVcGRhdGUgPSBmdW5jdGlvbiAoYXJncywgb3B0aW9ucykge1xuICAgICAgICBpZiAoYXJncy5kYXRhICYmIGFyZ3MuZGF0YS51aWQpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLnVwZGF0ZUZlYXR1cmUoYXJncywgb3B0aW9ucyk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGFyZ3MudWlkICYmIG1hcFRvb2xzLm1hcHNbdGhpcy50aGF0LmlkXS5qc29uICYmIG1hcFRvb2xzLm1hcHNbdGhpcy50aGF0LmlkXS5qc29uLmFsbFthcmdzLnVpZF0pIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLnVwZGF0ZUZlYXR1cmUobWFwVG9vbHMubWFwc1t0aGlzLnRoYXQuaWRdLmpzb24uYWxsW2FyZ3MudWlkXSwgb3B0aW9ucyk7XG4gICAgICAgIH1cbiAgICB9O1xuICAgIFVwZGF0ZUZlYXR1cmUucHJvdG90eXBlLnVwZGF0ZSA9IGZ1bmN0aW9uIChhcmdzLCBvcHRpb25zKSB7XG4gICAgICAgIHZhciB0eXBlID0gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKGFyZ3MpO1xuICAgICAgICBpZiAodHlwZSA9PT0gJ1tvYmplY3QgQXJyYXldJykge1xuICAgICAgICAgICAgdmFyIGZlYXR1cmUsIHg7XG4gICAgICAgICAgICBmb3IgKHggaW4gYXJncykge1xuICAgICAgICAgICAgICAgIGlmIChhcmdzLmhhc093blByb3BlcnR5KHgpKSB7XG4gICAgICAgICAgICAgICAgICAgIGZlYXR1cmUgPSBhcmdzW3hdO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmZpbmRBbmRVcGRhdGUoZmVhdHVyZSwgb3B0aW9ucyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGlmICh0eXBlID09PSAnW29iamVjdCBPYmplY3RdJykge1xuICAgICAgICAgICAgdGhpcy5maW5kQW5kVXBkYXRlKGFyZ3MsIG9wdGlvbnMpO1xuICAgICAgICB9XG4gICAgfTtcbiAgICBVcGRhdGVGZWF0dXJlLnByb3RvdHlwZS51cGRhdGVGZWF0dXJlID0gZnVuY3Rpb24gKGZlYXR1cmUsIG9wdGlvbnMpIHtcbiAgICAgICAgaWYgKG9wdGlvbnMuc3R5bGUpIHtcbiAgICAgICAgICAgIHRoaXMudXBkYXRlU3R5bGUoZmVhdHVyZSwgb3B0aW9ucy5zdHlsZSk7XG4gICAgICAgIH1cbiAgICB9O1xuICAgIHJldHVybiBVcGRhdGVGZWF0dXJlO1xufSkoKTtcbm1vZHVsZS5leHBvcnRzID0gVXBkYXRlRmVhdHVyZTtcbiIsIi8vLyA8cmVmZXJlbmNlIHBhdGg9XCJtYXBzLnRzXCIvPlxudmFyIG1hcHMgPSByZXF1aXJlKCcuL21hcHMnKTtcbnZhciBVcGRhdGVNYXAgPSAoZnVuY3Rpb24gKCkge1xuICAgIGZ1bmN0aW9uIFVwZGF0ZU1hcCh0aGF0KSB7XG4gICAgICAgIHRoaXMudGhhdCA9IHRoYXQ7XG4gICAgfVxuICAgIFVwZGF0ZU1hcC5wcm90b3R5cGUudXBkYXRlTWFwID0gZnVuY3Rpb24gKGFyZ3MpIHtcbiAgICAgICAgdmFyIG1hcE9wdGlvbnMgPSBtYXBzLm1hcE9wdGlvbnMoYXJncyk7XG4gICAgICAgIHJldHVybiB0aGlzLnRoYXQuaW5zdGFuY2Uuc2V0T3B0aW9ucyhtYXBPcHRpb25zKTtcbiAgICB9O1xuICAgIHJldHVybiBVcGRhdGVNYXA7XG59KSgpO1xubW9kdWxlLmV4cG9ydHMgPSBVcGRhdGVNYXA7XG4iLCIvLy8gPHJlZmVyZW5jZSBwYXRoPVwidHlwaW5ncy90c2QuZC50c1wiLz5cbnZhciB1dGlscyA9IHJlcXVpcmUoJy4vdXRpbHMnKTtcbnZhciBjb25maWcgPSByZXF1aXJlKCcuL2NvbmZpZycpO1xudmFyIGZpbmRNYXJrZXIgPSByZXF1aXJlKCcuL2ZpbmRNYXJrZXJCeUlkJyk7XG52YXIgZmlsdGVyID0gcmVxdWlyZSgnLi9maWx0ZXInKTtcbnZhciBVcGRhdGVNYXJrZXIgPSAoZnVuY3Rpb24gKCkge1xuICAgIGZ1bmN0aW9uIFVwZGF0ZU1hcmtlcih0aGF0KSB7XG4gICAgICAgIHRoaXMudGhhdCA9IHRoYXQ7XG4gICAgICAgIHZhciBmaW5kTWFya2VySW5zdGFuY2UgPSBuZXcgZmluZE1hcmtlcih0aGF0KTtcbiAgICAgICAgdGhpcy5maW5kTWFya2VyID0gZnVuY3Rpb24gKG1hcmtlcikge1xuICAgICAgICAgICAgcmV0dXJuIGZpbmRNYXJrZXJJbnN0YW5jZS5maW5kKG1hcmtlcik7XG4gICAgICAgIH07XG4gICAgfVxuICAgIFVwZGF0ZU1hcmtlci5wcm90b3R5cGUucmVtb3ZlVGFncyA9IGZ1bmN0aW9uIChtYXJrZXIpIHtcbiAgICAgICAgaWYgKHV0aWxzLmlzQXJyYXkobWFya2VyLnRhZ3MpKSB7XG4gICAgICAgICAgICB2YXIgaSwgdGFnO1xuICAgICAgICAgICAgZm9yIChpIGluIG1hcmtlci50YWdzKSB7XG4gICAgICAgICAgICAgICAgaWYgKG1hcmtlci50YWdzLmhhc093blByb3BlcnR5KGkpKSB7XG4gICAgICAgICAgICAgICAgICAgIHRhZyA9IG1hcmtlci50YWdzW2ldO1xuICAgICAgICAgICAgICAgICAgICBkZWxldGUgdGhpcy50aGF0Lm1hcmtlcnMudGFnc1t0YWddW21hcmtlci5kYXRhLnVpZF07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgZGVsZXRlIHRoaXMudGhhdC5tYXJrZXJzLnRhZ3NbbWFya2VyLnRhZ3NdW21hcmtlci5kYXRhLnVpZF07XG4gICAgICAgIH1cbiAgICB9O1xuICAgIFVwZGF0ZU1hcmtlci5wcm90b3R5cGUuYWRkVGFncyA9IGZ1bmN0aW9uIChtYXJrZXIsIG9wdGlvbnMpIHtcbiAgICAgICAgaWYgKHV0aWxzLmlzQXJyYXkob3B0aW9ucy5jdXN0b20udGFncykpIHtcbiAgICAgICAgICAgIHZhciBpLCB0YWc7XG4gICAgICAgICAgICBmb3IgKGkgaW4gb3B0aW9ucy5jdXN0b20udGFncykge1xuICAgICAgICAgICAgICAgIHRhZyA9IG9wdGlvbnMuY3VzdG9tLnRhZ3NbaV07XG4gICAgICAgICAgICAgICAgdGhpcy50aGF0Lm1hcmtlcnMudGFnc1t0YWddID0gdGhpcy50aGF0Lm1hcmtlcnMudGFnc1t0YWddIHx8IHt9O1xuICAgICAgICAgICAgICAgIHRoaXMudGhhdC5tYXJrZXJzLnRhZ3NbdGFnXVttYXJrZXIuZGF0YS51aWRdID0gbWFya2VyO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgdGhpcy50aGF0Lm1hcmtlcnMudGFnc1tvcHRpb25zLmN1c3RvbS50YWdzXSA9IHRoaXMudGhhdC5tYXJrZXJzLnRhZ3Nbb3B0aW9ucy5jdXN0b20udGFnc10gfHwge307XG4gICAgICAgICAgICB0aGlzLnRoYXQubWFya2Vycy50YWdzW29wdGlvbnMuY3VzdG9tLnRhZ3NdW21hcmtlci5kYXRhLnVpZF0gPSBtYXJrZXI7XG4gICAgICAgIH1cbiAgICAgICAgbWFya2VyLnRhZ3MgPSBvcHRpb25zLmN1c3RvbS50YWdzO1xuICAgIH07XG4gICAgVXBkYXRlTWFya2VyLnByb3RvdHlwZS51cGRhdGVUYWcgPSBmdW5jdGlvbiAobWFya2VyLCBvcHRpb25zKSB7XG4gICAgICAgIHRoaXMucmVtb3ZlVGFncyhtYXJrZXIpO1xuICAgICAgICB0aGlzLmFkZFRhZ3MobWFya2VyLCBvcHRpb25zKTtcbiAgICB9O1xuICAgIFVwZGF0ZU1hcmtlci5wcm90b3R5cGUuY3VzdG9tVXBkYXRlID0gZnVuY3Rpb24gKG1hcmtlciwgb3B0aW9ucykge1xuICAgICAgICBpZiAob3B0aW9ucy5jdXN0b20pIHtcbiAgICAgICAgICAgIGlmIChvcHRpb25zLmN1c3RvbS5tb3ZlKSB7XG4gICAgICAgICAgICAgICAgbWFya2VyLnNldEFuaW1hdGlvbihnb29nbGUubWFwcy5BbmltYXRpb25bb3B0aW9ucy5jdXN0b20ubW92ZS50b1VwcGVyQ2FzZSgpXSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAob3B0aW9ucy5jdXN0b20ubGF0ICYmIG9wdGlvbnMuY3VzdG9tLmxuZykge1xuICAgICAgICAgICAgICAgIG1hcmtlci5zZXRQb3NpdGlvbihuZXcgZ29vZ2xlLm1hcHMuTGF0TG5nKG9wdGlvbnMuY3VzdG9tLmxhdCwgb3B0aW9ucy5jdXN0b20ubG5nKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAob3B0aW9ucy5jdXN0b20uaW5mb1dpbmRvdyAmJiBvcHRpb25zLmN1c3RvbS5pbmZvV2luZG93LmNvbnRlbnQpIHtcbiAgICAgICAgICAgICAgICBtYXJrZXIuaW5mb1dpbmRvdy5jb250ZW50ID0gb3B0aW9ucy5jdXN0b20uaW5mb1dpbmRvdy5jb250ZW50O1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKG9wdGlvbnMuY3VzdG9tLnRhZ3MpIHtcbiAgICAgICAgICAgICAgICB0aGlzLnVwZGF0ZVRhZyhtYXJrZXIsIG9wdGlvbnMpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGlmIChvcHRpb25zLmRlZmF1bHRzKSB7XG4gICAgICAgICAgICBtYXJrZXIuc2V0T3B0aW9ucyhvcHRpb25zLmRlZmF1bHRzKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gbWFya2VyO1xuICAgIH07XG4gICAgVXBkYXRlTWFya2VyLnByb3RvdHlwZS5idWxrVXBkYXRlID0gZnVuY3Rpb24gKGFyZ3MsIG9wdGlvbnMpIHtcbiAgICAgICAgdmFyIG1hcmtlciwgcmVzdWx0cyA9IFtdLCBpbnN0YW5jZSwgeDtcbiAgICAgICAgZm9yICh4IGluIGFyZ3MpIHtcbiAgICAgICAgICAgIGlmIChhcmdzLmhhc093blByb3BlcnR5KHgpKSB7XG4gICAgICAgICAgICAgICAgbWFya2VyID0gYXJnc1t4XTtcbiAgICAgICAgICAgICAgICBpbnN0YW5jZSA9IHRoaXMuY3VzdG9tVXBkYXRlKHRoaXMuZmluZE1hcmtlcihtYXJrZXIpLCBvcHRpb25zKTtcbiAgICAgICAgICAgICAgICByZXN1bHRzLnB1c2goaW5zdGFuY2UpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiByZXN1bHRzO1xuICAgIH07XG4gICAgVXBkYXRlTWFya2VyLnByb3RvdHlwZS5jb3VudFZpc2libGUgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciB4LCBjb3VudCA9IDA7XG4gICAgICAgIGZvciAoeCBpbiB0aGlzLnRoYXQubWFya2Vycy5hbGwpIHtcbiAgICAgICAgICAgIGlmICh0aGlzLnRoYXQubWFya2Vycy5hbGxbeF0udmlzaWJsZSkge1xuICAgICAgICAgICAgICAgIGNvdW50Kys7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgZ29vZ2xlLm1hcHMuZXZlbnQudHJpZ2dlcih0aGlzLnRoYXQuaW5zdGFuY2UsICdtYXJrZXJfdmlzaWJpbGl0eV9jaGFuZ2VkJywgY291bnQpO1xuICAgIH07XG4gICAgVXBkYXRlTWFya2VyLnByb3RvdHlwZS51cGRhdGUgPSBmdW5jdGlvbiAoYXJncywgb3B0aW9ucykge1xuICAgICAgICB2YXIgdmlzaWJpbGl0eUZsYWcgPSBmYWxzZTtcbiAgICAgICAgdmFyIHByZXBhcmVkT3B0aW9ucyA9IHV0aWxzLnByZXBhcmVPcHRpb25zKG9wdGlvbnMsIGNvbmZpZy5jdXN0b21NYXJrZXJPcHRpb25zKTtcbiAgICAgICAgaWYgKHByZXBhcmVkT3B0aW9ucy5kZWZhdWx0cyAmJiBwcmVwYXJlZE9wdGlvbnMuZGVmYXVsdHMuaGFzT3duUHJvcGVydHkoJ3Zpc2libGUnKSAmJiB0aGlzLnRoYXQuZXZlbnRzLmluZGV4T2YoJ21hcmtlcl92aXNpYmlsaXR5X2NoYW5nZWQnKSA+IC0xKSB7XG4gICAgICAgICAgICB2aXNpYmlsaXR5RmxhZyA9IHRydWU7XG4gICAgICAgIH1cbiAgICAgICAgdmFyIHJlc3VsdDtcbiAgICAgICAgdmFyIHR5cGUgPSBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwoYXJncyk7XG4gICAgICAgIGlmICh0eXBlID09PSAnW29iamVjdCBPYmplY3RdJykge1xuICAgICAgICAgICAgaWYgKE9iamVjdC5rZXlzKGFyZ3MpLmxlbmd0aCA9PT0gMSAmJiBhcmdzLnRhZ3MpIHtcbiAgICAgICAgICAgICAgICB2YXIgZmlsdGVySW5zdGFuY2UgPSBuZXcgZmlsdGVyKHRoaXMudGhhdCwgJ21hcmtlcnMnKTtcbiAgICAgICAgICAgICAgICByZXN1bHQgPSB0aGlzLmJ1bGtVcGRhdGUoZmlsdGVySW5zdGFuY2UuZmlsdGVyKGFyZ3MpLCBwcmVwYXJlZE9wdGlvbnMpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgcmVzdWx0ID0gdGhpcy5jdXN0b21VcGRhdGUodGhpcy5maW5kTWFya2VyKGFyZ3MpLCBwcmVwYXJlZE9wdGlvbnMpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGlmICh0eXBlID09PSAnW29iamVjdCBBcnJheV0nKSB7XG4gICAgICAgICAgICByZXN1bHQgPSB0aGlzLmJ1bGtVcGRhdGUoYXJncywgcHJlcGFyZWRPcHRpb25zKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAodmlzaWJpbGl0eUZsYWcpIHtcbiAgICAgICAgICAgIHRoaXMuY291bnRWaXNpYmxlKCk7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy50aGF0Lm1hcmtlcnMuZGF0YUNoYW5nZWQgPSB0cnVlO1xuICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH07XG4gICAgcmV0dXJuIFVwZGF0ZU1hcmtlcjtcbn0pKCk7XG5tb2R1bGUuZXhwb3J0cyA9IFVwZGF0ZU1hcmtlcjtcbiIsInZhciBVdGlscyA9IChmdW5jdGlvbiAoKSB7XG4gICAgZnVuY3Rpb24gVXRpbHMoKSB7XG4gICAgfVxuICAgIFV0aWxzLmNsb25lID0gZnVuY3Rpb24gKG8sIGV4Y2VwdGlvbktleXMpIHtcbiAgICAgICAgdmFyIG91dCwgdiwga2V5O1xuICAgICAgICBvdXQgPSBBcnJheS5pc0FycmF5KG8pID8gW10gOiB7fTtcbiAgICAgICAgZm9yIChrZXkgaW4gbykge1xuICAgICAgICAgICAgaWYgKG8uaGFzT3duUHJvcGVydHkoa2V5KSkge1xuICAgICAgICAgICAgICAgIGlmICghZXhjZXB0aW9uS2V5cyB8fCAoZXhjZXB0aW9uS2V5cyAmJiBleGNlcHRpb25LZXlzLmluZGV4T2Yoa2V5KSA9PT0gLTEpKSB7XG4gICAgICAgICAgICAgICAgICAgIHYgPSBvW2tleV07XG4gICAgICAgICAgICAgICAgICAgIG91dFtrZXldID0gKHR5cGVvZiB2ID09PSAnb2JqZWN0JykgPyB0aGlzLmNsb25lKHYpIDogdjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG91dDtcbiAgICB9O1xuICAgIFV0aWxzLmNyZWF0ZVVpZCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuICd4eHh4eHh4eHh4eHg0eHh4eXh4eHh4eHh4eHh4eHh4eCcucmVwbGFjZSgvW3h5XS9nLCBmdW5jdGlvbiAoYykge1xuICAgICAgICAgICAgdmFyIHIsIHY7XG4gICAgICAgICAgICByID0gTWF0aC5yYW5kb20oKSAqIDE2IHwgMDtcbiAgICAgICAgICAgIHYgPSBjID09PSAneCcgPyByIDogciAmIDB4MyB8IDB4ODtcbiAgICAgICAgICAgIHJldHVybiB2LnRvU3RyaW5nKDE2KTtcbiAgICAgICAgfSk7XG4gICAgfTtcbiAgICBVdGlscy5wcmVwYXJlT3B0aW9ucyA9IGZ1bmN0aW9uIChvcHRpb25zLCBjdXN0b20pIHtcbiAgICAgICAgdmFyIHJlc3VsdCA9IHsgY3VzdG9tOiB7fSwgZGVmYXVsdHM6IHt9IH0sIG9wdGlvbjtcbiAgICAgICAgZm9yIChvcHRpb24gaW4gb3B0aW9ucykge1xuICAgICAgICAgICAgaWYgKG9wdGlvbnMuaGFzT3duUHJvcGVydHkob3B0aW9uKSkge1xuICAgICAgICAgICAgICAgIGlmIChjdXN0b20uaW5kZXhPZihvcHRpb24pID4gLTEpIHtcbiAgICAgICAgICAgICAgICAgICAgcmVzdWx0LmN1c3RvbSA9IHJlc3VsdC5jdXN0b20gfHwge307XG4gICAgICAgICAgICAgICAgICAgIHJlc3VsdC5jdXN0b21bb3B0aW9uXSA9IG9wdGlvbnNbb3B0aW9uXTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHJlc3VsdC5kZWZhdWx0cyA9IHJlc3VsdC5kZWZhdWx0cyB8fCB7fTtcbiAgICAgICAgICAgICAgICAgICAgcmVzdWx0LmRlZmF1bHRzW29wdGlvbl0gPSBvcHRpb25zW29wdGlvbl07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfTtcbiAgICBVdGlscy5pc0FycmF5ID0gZnVuY3Rpb24gKGFyZykge1xuICAgICAgICByZXR1cm4gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKGFyZykgPT09ICdbb2JqZWN0IEFycmF5XSc7XG4gICAgfTtcbiAgICBVdGlscy50b0FycmF5ID0gZnVuY3Rpb24gKG9iaikge1xuICAgICAgICByZXR1cm4gT2JqZWN0LmtleXMob2JqKS5tYXAoZnVuY3Rpb24gKGtleSkge1xuICAgICAgICAgICAgcmV0dXJuIG9ialtrZXldO1xuICAgICAgICB9KTtcbiAgICB9O1xuICAgIFV0aWxzLmRlZmF1bHREaW1lbnNpb24gPSBmdW5jdGlvbiAoaXRlbSkge1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24gKGQpIHtcbiAgICAgICAgICAgIGlmICh0eXBlb2YgZC5kYXRhW2l0ZW1dID09PSAndW5kZWZpbmVkJyAmJiB0eXBlb2YgZFtpdGVtXSAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZFtpdGVtXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICh0eXBlb2YgZC5kYXRhW2l0ZW1dID09PSAndW5kZWZpbmVkJyAmJiB0eXBlb2YgZFtpdGVtXSA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBkLmRhdGFbaXRlbV07XG4gICAgICAgIH07XG4gICAgfTtcbiAgICAvLyBjb21wYXJlcyB0d28gbGlzdHMgYW5kIHJldHVybnMgdGhlIGNvbW1vbiBpdGVtc1xuICAgIFV0aWxzLmdldENvbW1vbk9iamVjdCA9IGZ1bmN0aW9uIChsaXN0MSwgbGlzdDIpIHtcbiAgICAgICAgdmFyIHJlc3VsdCA9IHt9O1xuICAgICAgICBmb3IgKHZhciB1aWQgaW4gbGlzdDEpIHtcbiAgICAgICAgICAgIGlmIChsaXN0MS5oYXNPd25Qcm9wZXJ0eSh1aWQpKSB7XG4gICAgICAgICAgICAgICAgdmFyIG1hdGNoID0gbGlzdDJbdWlkXTtcbiAgICAgICAgICAgICAgICBpZiAodHlwZW9mIG1hdGNoICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgICAgICAgICByZXN1bHRbdWlkXSA9IG1hdGNoO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH07XG4gICAgcmV0dXJuIFV0aWxzO1xufSkoKTtcbm1vZHVsZS5leHBvcnRzID0gVXRpbHM7XG4iLCIoZnVuY3Rpb24oZXhwb3J0cyl7XG5jcm9zc2ZpbHRlci52ZXJzaW9uID0gXCIxLjMuMTJcIjtcbmZ1bmN0aW9uIGNyb3NzZmlsdGVyX2lkZW50aXR5KGQpIHtcbiAgcmV0dXJuIGQ7XG59XG5jcm9zc2ZpbHRlci5wZXJtdXRlID0gcGVybXV0ZTtcblxuZnVuY3Rpb24gcGVybXV0ZShhcnJheSwgaW5kZXgpIHtcbiAgZm9yICh2YXIgaSA9IDAsIG4gPSBpbmRleC5sZW5ndGgsIGNvcHkgPSBuZXcgQXJyYXkobik7IGkgPCBuOyArK2kpIHtcbiAgICBjb3B5W2ldID0gYXJyYXlbaW5kZXhbaV1dO1xuICB9XG4gIHJldHVybiBjb3B5O1xufVxudmFyIGJpc2VjdCA9IGNyb3NzZmlsdGVyLmJpc2VjdCA9IGJpc2VjdF9ieShjcm9zc2ZpbHRlcl9pZGVudGl0eSk7XG5cbmJpc2VjdC5ieSA9IGJpc2VjdF9ieTtcblxuZnVuY3Rpb24gYmlzZWN0X2J5KGYpIHtcblxuICAvLyBMb2NhdGUgdGhlIGluc2VydGlvbiBwb2ludCBmb3IgeCBpbiBhIHRvIG1haW50YWluIHNvcnRlZCBvcmRlci4gVGhlXG4gIC8vIGFyZ3VtZW50cyBsbyBhbmQgaGkgbWF5IGJlIHVzZWQgdG8gc3BlY2lmeSBhIHN1YnNldCBvZiB0aGUgYXJyYXkgd2hpY2hcbiAgLy8gc2hvdWxkIGJlIGNvbnNpZGVyZWQ7IGJ5IGRlZmF1bHQgdGhlIGVudGlyZSBhcnJheSBpcyB1c2VkLiBJZiB4IGlzIGFscmVhZHlcbiAgLy8gcHJlc2VudCBpbiBhLCB0aGUgaW5zZXJ0aW9uIHBvaW50IHdpbGwgYmUgYmVmb3JlICh0byB0aGUgbGVmdCBvZikgYW55XG4gIC8vIGV4aXN0aW5nIGVudHJpZXMuIFRoZSByZXR1cm4gdmFsdWUgaXMgc3VpdGFibGUgZm9yIHVzZSBhcyB0aGUgZmlyc3RcbiAgLy8gYXJndW1lbnQgdG8gYGFycmF5LnNwbGljZWAgYXNzdW1pbmcgdGhhdCBhIGlzIGFscmVhZHkgc29ydGVkLlxuICAvL1xuICAvLyBUaGUgcmV0dXJuZWQgaW5zZXJ0aW9uIHBvaW50IGkgcGFydGl0aW9ucyB0aGUgYXJyYXkgYSBpbnRvIHR3byBoYWx2ZXMgc29cbiAgLy8gdGhhdCBhbGwgdiA8IHggZm9yIHYgaW4gYVtsbzppXSBmb3IgdGhlIGxlZnQgc2lkZSBhbmQgYWxsIHYgPj0geCBmb3IgdiBpblxuICAvLyBhW2k6aGldIGZvciB0aGUgcmlnaHQgc2lkZS5cbiAgZnVuY3Rpb24gYmlzZWN0TGVmdChhLCB4LCBsbywgaGkpIHtcbiAgICB3aGlsZSAobG8gPCBoaSkge1xuICAgICAgdmFyIG1pZCA9IGxvICsgaGkgPj4+IDE7XG4gICAgICBpZiAoZihhW21pZF0pIDwgeCkgbG8gPSBtaWQgKyAxO1xuICAgICAgZWxzZSBoaSA9IG1pZDtcbiAgICB9XG4gICAgcmV0dXJuIGxvO1xuICB9XG5cbiAgLy8gU2ltaWxhciB0byBiaXNlY3RMZWZ0LCBidXQgcmV0dXJucyBhbiBpbnNlcnRpb24gcG9pbnQgd2hpY2ggY29tZXMgYWZ0ZXIgKHRvXG4gIC8vIHRoZSByaWdodCBvZikgYW55IGV4aXN0aW5nIGVudHJpZXMgb2YgeCBpbiBhLlxuICAvL1xuICAvLyBUaGUgcmV0dXJuZWQgaW5zZXJ0aW9uIHBvaW50IGkgcGFydGl0aW9ucyB0aGUgYXJyYXkgaW50byB0d28gaGFsdmVzIHNvIHRoYXRcbiAgLy8gYWxsIHYgPD0geCBmb3IgdiBpbiBhW2xvOmldIGZvciB0aGUgbGVmdCBzaWRlIGFuZCBhbGwgdiA+IHggZm9yIHYgaW5cbiAgLy8gYVtpOmhpXSBmb3IgdGhlIHJpZ2h0IHNpZGUuXG4gIGZ1bmN0aW9uIGJpc2VjdFJpZ2h0KGEsIHgsIGxvLCBoaSkge1xuICAgIHdoaWxlIChsbyA8IGhpKSB7XG4gICAgICB2YXIgbWlkID0gbG8gKyBoaSA+Pj4gMTtcbiAgICAgIGlmICh4IDwgZihhW21pZF0pKSBoaSA9IG1pZDtcbiAgICAgIGVsc2UgbG8gPSBtaWQgKyAxO1xuICAgIH1cbiAgICByZXR1cm4gbG87XG4gIH1cblxuICBiaXNlY3RSaWdodC5yaWdodCA9IGJpc2VjdFJpZ2h0O1xuICBiaXNlY3RSaWdodC5sZWZ0ID0gYmlzZWN0TGVmdDtcbiAgcmV0dXJuIGJpc2VjdFJpZ2h0O1xufVxudmFyIGhlYXAgPSBjcm9zc2ZpbHRlci5oZWFwID0gaGVhcF9ieShjcm9zc2ZpbHRlcl9pZGVudGl0eSk7XG5cbmhlYXAuYnkgPSBoZWFwX2J5O1xuXG5mdW5jdGlvbiBoZWFwX2J5KGYpIHtcblxuICAvLyBCdWlsZHMgYSBiaW5hcnkgaGVhcCB3aXRoaW4gdGhlIHNwZWNpZmllZCBhcnJheSBhW2xvOmhpXS4gVGhlIGhlYXAgaGFzIHRoZVxuICAvLyBwcm9wZXJ0eSBzdWNoIHRoYXQgdGhlIHBhcmVudCBhW2xvK2ldIGlzIGFsd2F5cyBsZXNzIHRoYW4gb3IgZXF1YWwgdG8gaXRzXG4gIC8vIHR3byBjaGlsZHJlbjogYVtsbysyKmkrMV0gYW5kIGFbbG8rMippKzJdLlxuICBmdW5jdGlvbiBoZWFwKGEsIGxvLCBoaSkge1xuICAgIHZhciBuID0gaGkgLSBsbyxcbiAgICAgICAgaSA9IChuID4+PiAxKSArIDE7XG4gICAgd2hpbGUgKC0taSA+IDApIHNpZnQoYSwgaSwgbiwgbG8pO1xuICAgIHJldHVybiBhO1xuICB9XG5cbiAgLy8gU29ydHMgdGhlIHNwZWNpZmllZCBhcnJheSBhW2xvOmhpXSBpbiBkZXNjZW5kaW5nIG9yZGVyLCBhc3N1bWluZyBpdCBpc1xuICAvLyBhbHJlYWR5IGEgaGVhcC5cbiAgZnVuY3Rpb24gc29ydChhLCBsbywgaGkpIHtcbiAgICB2YXIgbiA9IGhpIC0gbG8sXG4gICAgICAgIHQ7XG4gICAgd2hpbGUgKC0tbiA+IDApIHQgPSBhW2xvXSwgYVtsb10gPSBhW2xvICsgbl0sIGFbbG8gKyBuXSA9IHQsIHNpZnQoYSwgMSwgbiwgbG8pO1xuICAgIHJldHVybiBhO1xuICB9XG5cbiAgLy8gU2lmdHMgdGhlIGVsZW1lbnQgYVtsbytpLTFdIGRvd24gdGhlIGhlYXAsIHdoZXJlIHRoZSBoZWFwIGlzIHRoZSBjb250aWd1b3VzXG4gIC8vIHNsaWNlIG9mIGFycmF5IGFbbG86bG8rbl0uIFRoaXMgbWV0aG9kIGNhbiBhbHNvIGJlIHVzZWQgdG8gdXBkYXRlIHRoZSBoZWFwXG4gIC8vIGluY3JlbWVudGFsbHksIHdpdGhvdXQgaW5jdXJyaW5nIHRoZSBmdWxsIGNvc3Qgb2YgcmVjb25zdHJ1Y3RpbmcgdGhlIGhlYXAuXG4gIGZ1bmN0aW9uIHNpZnQoYSwgaSwgbiwgbG8pIHtcbiAgICB2YXIgZCA9IGFbLS1sbyArIGldLFxuICAgICAgICB4ID0gZihkKSxcbiAgICAgICAgY2hpbGQ7XG4gICAgd2hpbGUgKChjaGlsZCA9IGkgPDwgMSkgPD0gbikge1xuICAgICAgaWYgKGNoaWxkIDwgbiAmJiBmKGFbbG8gKyBjaGlsZF0pID4gZihhW2xvICsgY2hpbGQgKyAxXSkpIGNoaWxkKys7XG4gICAgICBpZiAoeCA8PSBmKGFbbG8gKyBjaGlsZF0pKSBicmVhaztcbiAgICAgIGFbbG8gKyBpXSA9IGFbbG8gKyBjaGlsZF07XG4gICAgICBpID0gY2hpbGQ7XG4gICAgfVxuICAgIGFbbG8gKyBpXSA9IGQ7XG4gIH1cblxuICBoZWFwLnNvcnQgPSBzb3J0O1xuICByZXR1cm4gaGVhcDtcbn1cbnZhciBoZWFwc2VsZWN0ID0gY3Jvc3NmaWx0ZXIuaGVhcHNlbGVjdCA9IGhlYXBzZWxlY3RfYnkoY3Jvc3NmaWx0ZXJfaWRlbnRpdHkpO1xuXG5oZWFwc2VsZWN0LmJ5ID0gaGVhcHNlbGVjdF9ieTtcblxuZnVuY3Rpb24gaGVhcHNlbGVjdF9ieShmKSB7XG4gIHZhciBoZWFwID0gaGVhcF9ieShmKTtcblxuICAvLyBSZXR1cm5zIGEgbmV3IGFycmF5IGNvbnRhaW5pbmcgdGhlIHRvcCBrIGVsZW1lbnRzIGluIHRoZSBhcnJheSBhW2xvOmhpXS5cbiAgLy8gVGhlIHJldHVybmVkIGFycmF5IGlzIG5vdCBzb3J0ZWQsIGJ1dCBtYWludGFpbnMgdGhlIGhlYXAgcHJvcGVydHkuIElmIGsgaXNcbiAgLy8gZ3JlYXRlciB0aGFuIGhpIC0gbG8sIHRoZW4gZmV3ZXIgdGhhbiBrIGVsZW1lbnRzIHdpbGwgYmUgcmV0dXJuZWQuIFRoZVxuICAvLyBvcmRlciBvZiBlbGVtZW50cyBpbiBhIGlzIHVuY2hhbmdlZCBieSB0aGlzIG9wZXJhdGlvbi5cbiAgZnVuY3Rpb24gaGVhcHNlbGVjdChhLCBsbywgaGksIGspIHtcbiAgICB2YXIgcXVldWUgPSBuZXcgQXJyYXkoayA9IE1hdGgubWluKGhpIC0gbG8sIGspKSxcbiAgICAgICAgbWluLFxuICAgICAgICBpLFxuICAgICAgICB4LFxuICAgICAgICBkO1xuXG4gICAgZm9yIChpID0gMDsgaSA8IGs7ICsraSkgcXVldWVbaV0gPSBhW2xvKytdO1xuICAgIGhlYXAocXVldWUsIDAsIGspO1xuXG4gICAgaWYgKGxvIDwgaGkpIHtcbiAgICAgIG1pbiA9IGYocXVldWVbMF0pO1xuICAgICAgZG8ge1xuICAgICAgICBpZiAoeCA9IGYoZCA9IGFbbG9dKSA+IG1pbikge1xuICAgICAgICAgIHF1ZXVlWzBdID0gZDtcbiAgICAgICAgICBtaW4gPSBmKGhlYXAocXVldWUsIDAsIGspWzBdKTtcbiAgICAgICAgfVxuICAgICAgfSB3aGlsZSAoKytsbyA8IGhpKTtcbiAgICB9XG5cbiAgICByZXR1cm4gcXVldWU7XG4gIH1cblxuICByZXR1cm4gaGVhcHNlbGVjdDtcbn1cbnZhciBpbnNlcnRpb25zb3J0ID0gY3Jvc3NmaWx0ZXIuaW5zZXJ0aW9uc29ydCA9IGluc2VydGlvbnNvcnRfYnkoY3Jvc3NmaWx0ZXJfaWRlbnRpdHkpO1xuXG5pbnNlcnRpb25zb3J0LmJ5ID0gaW5zZXJ0aW9uc29ydF9ieTtcblxuZnVuY3Rpb24gaW5zZXJ0aW9uc29ydF9ieShmKSB7XG5cbiAgZnVuY3Rpb24gaW5zZXJ0aW9uc29ydChhLCBsbywgaGkpIHtcbiAgICBmb3IgKHZhciBpID0gbG8gKyAxOyBpIDwgaGk7ICsraSkge1xuICAgICAgZm9yICh2YXIgaiA9IGksIHQgPSBhW2ldLCB4ID0gZih0KTsgaiA+IGxvICYmIGYoYVtqIC0gMV0pID4geDsgLS1qKSB7XG4gICAgICAgIGFbal0gPSBhW2ogLSAxXTtcbiAgICAgIH1cbiAgICAgIGFbal0gPSB0O1xuICAgIH1cbiAgICByZXR1cm4gYTtcbiAgfVxuXG4gIHJldHVybiBpbnNlcnRpb25zb3J0O1xufVxuLy8gQWxnb3JpdGhtIGRlc2lnbmVkIGJ5IFZsYWRpbWlyIFlhcm9zbGF2c2tpeS5cbi8vIEltcGxlbWVudGF0aW9uIGJhc2VkIG9uIHRoZSBEYXJ0IHByb2plY3Q7IHNlZSBsaWIvZGFydC9MSUNFTlNFIGZvciBkZXRhaWxzLlxuXG52YXIgcXVpY2tzb3J0ID0gY3Jvc3NmaWx0ZXIucXVpY2tzb3J0ID0gcXVpY2tzb3J0X2J5KGNyb3NzZmlsdGVyX2lkZW50aXR5KTtcblxucXVpY2tzb3J0LmJ5ID0gcXVpY2tzb3J0X2J5O1xuXG5mdW5jdGlvbiBxdWlja3NvcnRfYnkoZikge1xuICB2YXIgaW5zZXJ0aW9uc29ydCA9IGluc2VydGlvbnNvcnRfYnkoZik7XG5cbiAgZnVuY3Rpb24gc29ydChhLCBsbywgaGkpIHtcbiAgICByZXR1cm4gKGhpIC0gbG8gPCBxdWlja3NvcnRfc2l6ZVRocmVzaG9sZFxuICAgICAgICA/IGluc2VydGlvbnNvcnRcbiAgICAgICAgOiBxdWlja3NvcnQpKGEsIGxvLCBoaSk7XG4gIH1cblxuICBmdW5jdGlvbiBxdWlja3NvcnQoYSwgbG8sIGhpKSB7XG4gICAgLy8gQ29tcHV0ZSB0aGUgdHdvIHBpdm90cyBieSBsb29raW5nIGF0IDUgZWxlbWVudHMuXG4gICAgdmFyIHNpeHRoID0gKGhpIC0gbG8pIC8gNiB8IDAsXG4gICAgICAgIGkxID0gbG8gKyBzaXh0aCxcbiAgICAgICAgaTUgPSBoaSAtIDEgLSBzaXh0aCxcbiAgICAgICAgaTMgPSBsbyArIGhpIC0gMSA+PiAxLCAgLy8gVGhlIG1pZHBvaW50LlxuICAgICAgICBpMiA9IGkzIC0gc2l4dGgsXG4gICAgICAgIGk0ID0gaTMgKyBzaXh0aDtcblxuICAgIHZhciBlMSA9IGFbaTFdLCB4MSA9IGYoZTEpLFxuICAgICAgICBlMiA9IGFbaTJdLCB4MiA9IGYoZTIpLFxuICAgICAgICBlMyA9IGFbaTNdLCB4MyA9IGYoZTMpLFxuICAgICAgICBlNCA9IGFbaTRdLCB4NCA9IGYoZTQpLFxuICAgICAgICBlNSA9IGFbaTVdLCB4NSA9IGYoZTUpO1xuXG4gICAgdmFyIHQ7XG5cbiAgICAvLyBTb3J0IHRoZSBzZWxlY3RlZCA1IGVsZW1lbnRzIHVzaW5nIGEgc29ydGluZyBuZXR3b3JrLlxuICAgIGlmICh4MSA+IHgyKSB0ID0gZTEsIGUxID0gZTIsIGUyID0gdCwgdCA9IHgxLCB4MSA9IHgyLCB4MiA9IHQ7XG4gICAgaWYgKHg0ID4geDUpIHQgPSBlNCwgZTQgPSBlNSwgZTUgPSB0LCB0ID0geDQsIHg0ID0geDUsIHg1ID0gdDtcbiAgICBpZiAoeDEgPiB4MykgdCA9IGUxLCBlMSA9IGUzLCBlMyA9IHQsIHQgPSB4MSwgeDEgPSB4MywgeDMgPSB0O1xuICAgIGlmICh4MiA+IHgzKSB0ID0gZTIsIGUyID0gZTMsIGUzID0gdCwgdCA9IHgyLCB4MiA9IHgzLCB4MyA9IHQ7XG4gICAgaWYgKHgxID4geDQpIHQgPSBlMSwgZTEgPSBlNCwgZTQgPSB0LCB0ID0geDEsIHgxID0geDQsIHg0ID0gdDtcbiAgICBpZiAoeDMgPiB4NCkgdCA9IGUzLCBlMyA9IGU0LCBlNCA9IHQsIHQgPSB4MywgeDMgPSB4NCwgeDQgPSB0O1xuICAgIGlmICh4MiA+IHg1KSB0ID0gZTIsIGUyID0gZTUsIGU1ID0gdCwgdCA9IHgyLCB4MiA9IHg1LCB4NSA9IHQ7XG4gICAgaWYgKHgyID4geDMpIHQgPSBlMiwgZTIgPSBlMywgZTMgPSB0LCB0ID0geDIsIHgyID0geDMsIHgzID0gdDtcbiAgICBpZiAoeDQgPiB4NSkgdCA9IGU0LCBlNCA9IGU1LCBlNSA9IHQsIHQgPSB4NCwgeDQgPSB4NSwgeDUgPSB0O1xuXG4gICAgdmFyIHBpdm90MSA9IGUyLCBwaXZvdFZhbHVlMSA9IHgyLFxuICAgICAgICBwaXZvdDIgPSBlNCwgcGl2b3RWYWx1ZTIgPSB4NDtcblxuICAgIC8vIGUyIGFuZCBlNCBoYXZlIGJlZW4gc2F2ZWQgaW4gdGhlIHBpdm90IHZhcmlhYmxlcy4gVGhleSB3aWxsIGJlIHdyaXR0ZW5cbiAgICAvLyBiYWNrLCBvbmNlIHRoZSBwYXJ0aXRpb25pbmcgaXMgZmluaXNoZWQuXG4gICAgYVtpMV0gPSBlMTtcbiAgICBhW2kyXSA9IGFbbG9dO1xuICAgIGFbaTNdID0gZTM7XG4gICAgYVtpNF0gPSBhW2hpIC0gMV07XG4gICAgYVtpNV0gPSBlNTtcblxuICAgIHZhciBsZXNzID0gbG8gKyAxLCAgIC8vIEZpcnN0IGVsZW1lbnQgaW4gdGhlIG1pZGRsZSBwYXJ0aXRpb24uXG4gICAgICAgIGdyZWF0ID0gaGkgLSAyOyAgLy8gTGFzdCBlbGVtZW50IGluIHRoZSBtaWRkbGUgcGFydGl0aW9uLlxuXG4gICAgLy8gTm90ZSB0aGF0IGZvciB2YWx1ZSBjb21wYXJpc29uLCA8LCA8PSwgPj0gYW5kID4gY29lcmNlIHRvIGEgcHJpbWl0aXZlIHZpYVxuICAgIC8vIE9iamVjdC5wcm90b3R5cGUudmFsdWVPZjsgPT0gYW5kID09PSBkbyBub3QsIHNvIGluIG9yZGVyIHRvIGJlIGNvbnNpc3RlbnRcbiAgICAvLyB3aXRoIG5hdHVyYWwgb3JkZXIgKHN1Y2ggYXMgZm9yIERhdGUgb2JqZWN0cyksIHdlIG11c3QgZG8gdHdvIGNvbXBhcmVzLlxuICAgIHZhciBwaXZvdHNFcXVhbCA9IHBpdm90VmFsdWUxIDw9IHBpdm90VmFsdWUyICYmIHBpdm90VmFsdWUxID49IHBpdm90VmFsdWUyO1xuICAgIGlmIChwaXZvdHNFcXVhbCkge1xuXG4gICAgICAvLyBEZWdlbmVyYXRlZCBjYXNlIHdoZXJlIHRoZSBwYXJ0aXRpb25pbmcgYmVjb21lcyBhIGR1dGNoIG5hdGlvbmFsIGZsYWdcbiAgICAgIC8vIHByb2JsZW0uXG4gICAgICAvL1xuICAgICAgLy8gWyB8ICA8IHBpdm90ICB8ID09IHBpdm90IHwgdW5wYXJ0aXRpb25lZCB8ID4gcGl2b3QgIHwgXVxuICAgICAgLy8gIF4gICAgICAgICAgICAgXiAgICAgICAgICBeICAgICAgICAgICAgIF4gICAgICAgICAgICBeXG4gICAgICAvLyBsZWZ0ICAgICAgICAgbGVzcyAgICAgICAgIGsgICAgICAgICAgIGdyZWF0ICAgICAgICAgcmlnaHRcbiAgICAgIC8vXG4gICAgICAvLyBhW2xlZnRdIGFuZCBhW3JpZ2h0XSBhcmUgdW5kZWZpbmVkIGFuZCBhcmUgZmlsbGVkIGFmdGVyIHRoZVxuICAgICAgLy8gcGFydGl0aW9uaW5nLlxuICAgICAgLy9cbiAgICAgIC8vIEludmFyaWFudHM6XG4gICAgICAvLyAgIDEpIGZvciB4IGluIF1sZWZ0LCBsZXNzWyA6IHggPCBwaXZvdC5cbiAgICAgIC8vICAgMikgZm9yIHggaW4gW2xlc3MsIGtbIDogeCA9PSBwaXZvdC5cbiAgICAgIC8vICAgMykgZm9yIHggaW4gXWdyZWF0LCByaWdodFsgOiB4ID4gcGl2b3QuXG4gICAgICBmb3IgKHZhciBrID0gbGVzczsgayA8PSBncmVhdDsgKytrKSB7XG4gICAgICAgIHZhciBlayA9IGFba10sIHhrID0gZihlayk7XG4gICAgICAgIGlmICh4ayA8IHBpdm90VmFsdWUxKSB7XG4gICAgICAgICAgaWYgKGsgIT09IGxlc3MpIHtcbiAgICAgICAgICAgIGFba10gPSBhW2xlc3NdO1xuICAgICAgICAgICAgYVtsZXNzXSA9IGVrO1xuICAgICAgICAgIH1cbiAgICAgICAgICArK2xlc3M7XG4gICAgICAgIH0gZWxzZSBpZiAoeGsgPiBwaXZvdFZhbHVlMSkge1xuXG4gICAgICAgICAgLy8gRmluZCB0aGUgZmlyc3QgZWxlbWVudCA8PSBwaXZvdCBpbiB0aGUgcmFuZ2UgW2sgLSAxLCBncmVhdF0gYW5kXG4gICAgICAgICAgLy8gcHV0IFs6ZWs6XSB0aGVyZS4gV2Uga25vdyB0aGF0IHN1Y2ggYW4gZWxlbWVudCBtdXN0IGV4aXN0OlxuICAgICAgICAgIC8vIFdoZW4gayA9PSBsZXNzLCB0aGVuIGVsMyAod2hpY2ggaXMgZXF1YWwgdG8gcGl2b3QpIGxpZXMgaW4gdGhlXG4gICAgICAgICAgLy8gaW50ZXJ2YWwuIE90aGVyd2lzZSBhW2sgLSAxXSA9PSBwaXZvdCBhbmQgdGhlIHNlYXJjaCBzdG9wcyBhdCBrLTEuXG4gICAgICAgICAgLy8gTm90ZSB0aGF0IGluIHRoZSBsYXR0ZXIgY2FzZSBpbnZhcmlhbnQgMiB3aWxsIGJlIHZpb2xhdGVkIGZvciBhXG4gICAgICAgICAgLy8gc2hvcnQgYW1vdW50IG9mIHRpbWUuIFRoZSBpbnZhcmlhbnQgd2lsbCBiZSByZXN0b3JlZCB3aGVuIHRoZVxuICAgICAgICAgIC8vIHBpdm90cyBhcmUgcHV0IGludG8gdGhlaXIgZmluYWwgcG9zaXRpb25zLlxuICAgICAgICAgIHdoaWxlICh0cnVlKSB7XG4gICAgICAgICAgICB2YXIgZ3JlYXRWYWx1ZSA9IGYoYVtncmVhdF0pO1xuICAgICAgICAgICAgaWYgKGdyZWF0VmFsdWUgPiBwaXZvdFZhbHVlMSkge1xuICAgICAgICAgICAgICBncmVhdC0tO1xuICAgICAgICAgICAgICAvLyBUaGlzIGlzIHRoZSBvbmx5IGxvY2F0aW9uIGluIHRoZSB3aGlsZS1sb29wIHdoZXJlIGEgbmV3XG4gICAgICAgICAgICAgIC8vIGl0ZXJhdGlvbiBpcyBzdGFydGVkLlxuICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoZ3JlYXRWYWx1ZSA8IHBpdm90VmFsdWUxKSB7XG4gICAgICAgICAgICAgIC8vIFRyaXBsZSBleGNoYW5nZS5cbiAgICAgICAgICAgICAgYVtrXSA9IGFbbGVzc107XG4gICAgICAgICAgICAgIGFbbGVzcysrXSA9IGFbZ3JlYXRdO1xuICAgICAgICAgICAgICBhW2dyZWF0LS1dID0gZWs7XG4gICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgYVtrXSA9IGFbZ3JlYXRdO1xuICAgICAgICAgICAgICBhW2dyZWF0LS1dID0gZWs7XG4gICAgICAgICAgICAgIC8vIE5vdGU6IGlmIGdyZWF0IDwgayB0aGVuIHdlIHdpbGwgZXhpdCB0aGUgb3V0ZXIgbG9vcCBhbmQgZml4XG4gICAgICAgICAgICAgIC8vIGludmFyaWFudCAyICh3aGljaCB3ZSBqdXN0IHZpb2xhdGVkKS5cbiAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfSBlbHNlIHtcblxuICAgICAgLy8gV2UgcGFydGl0aW9uIHRoZSBsaXN0IGludG8gdGhyZWUgcGFydHM6XG4gICAgICAvLyAgMS4gPCBwaXZvdDFcbiAgICAgIC8vICAyLiA+PSBwaXZvdDEgJiYgPD0gcGl2b3QyXG4gICAgICAvLyAgMy4gPiBwaXZvdDJcbiAgICAgIC8vXG4gICAgICAvLyBEdXJpbmcgdGhlIGxvb3Agd2UgaGF2ZTpcbiAgICAgIC8vIFsgfCA8IHBpdm90MSB8ID49IHBpdm90MSAmJiA8PSBwaXZvdDIgfCB1bnBhcnRpdGlvbmVkICB8ID4gcGl2b3QyICB8IF1cbiAgICAgIC8vICBeICAgICAgICAgICAgXiAgICAgICAgICAgICAgICAgICAgICAgIF4gICAgICAgICAgICAgIF4gICAgICAgICAgICAgXlxuICAgICAgLy8gbGVmdCAgICAgICAgIGxlc3MgICAgICAgICAgICAgICAgICAgICBrICAgICAgICAgICAgICBncmVhdCAgICAgICAgcmlnaHRcbiAgICAgIC8vXG4gICAgICAvLyBhW2xlZnRdIGFuZCBhW3JpZ2h0XSBhcmUgdW5kZWZpbmVkIGFuZCBhcmUgZmlsbGVkIGFmdGVyIHRoZVxuICAgICAgLy8gcGFydGl0aW9uaW5nLlxuICAgICAgLy9cbiAgICAgIC8vIEludmFyaWFudHM6XG4gICAgICAvLyAgIDEuIGZvciB4IGluIF1sZWZ0LCBsZXNzWyA6IHggPCBwaXZvdDFcbiAgICAgIC8vICAgMi4gZm9yIHggaW4gW2xlc3MsIGtbIDogcGl2b3QxIDw9IHggJiYgeCA8PSBwaXZvdDJcbiAgICAgIC8vICAgMy4gZm9yIHggaW4gXWdyZWF0LCByaWdodFsgOiB4ID4gcGl2b3QyXG4gICAgICBmb3IgKHZhciBrID0gbGVzczsgayA8PSBncmVhdDsgaysrKSB7XG4gICAgICAgIHZhciBlayA9IGFba10sIHhrID0gZihlayk7XG4gICAgICAgIGlmICh4ayA8IHBpdm90VmFsdWUxKSB7XG4gICAgICAgICAgaWYgKGsgIT09IGxlc3MpIHtcbiAgICAgICAgICAgIGFba10gPSBhW2xlc3NdO1xuICAgICAgICAgICAgYVtsZXNzXSA9IGVrO1xuICAgICAgICAgIH1cbiAgICAgICAgICArK2xlc3M7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgaWYgKHhrID4gcGl2b3RWYWx1ZTIpIHtcbiAgICAgICAgICAgIHdoaWxlICh0cnVlKSB7XG4gICAgICAgICAgICAgIHZhciBncmVhdFZhbHVlID0gZihhW2dyZWF0XSk7XG4gICAgICAgICAgICAgIGlmIChncmVhdFZhbHVlID4gcGl2b3RWYWx1ZTIpIHtcbiAgICAgICAgICAgICAgICBncmVhdC0tO1xuICAgICAgICAgICAgICAgIGlmIChncmVhdCA8IGspIGJyZWFrO1xuICAgICAgICAgICAgICAgIC8vIFRoaXMgaXMgdGhlIG9ubHkgbG9jYXRpb24gaW5zaWRlIHRoZSBsb29wIHdoZXJlIGEgbmV3XG4gICAgICAgICAgICAgICAgLy8gaXRlcmF0aW9uIGlzIHN0YXJ0ZWQuXG4gICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgLy8gYVtncmVhdF0gPD0gcGl2b3QyLlxuICAgICAgICAgICAgICAgIGlmIChncmVhdFZhbHVlIDwgcGl2b3RWYWx1ZTEpIHtcbiAgICAgICAgICAgICAgICAgIC8vIFRyaXBsZSBleGNoYW5nZS5cbiAgICAgICAgICAgICAgICAgIGFba10gPSBhW2xlc3NdO1xuICAgICAgICAgICAgICAgICAgYVtsZXNzKytdID0gYVtncmVhdF07XG4gICAgICAgICAgICAgICAgICBhW2dyZWF0LS1dID0gZWs7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgIC8vIGFbZ3JlYXRdID49IHBpdm90MS5cbiAgICAgICAgICAgICAgICAgIGFba10gPSBhW2dyZWF0XTtcbiAgICAgICAgICAgICAgICAgIGFbZ3JlYXQtLV0gPSBlaztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBNb3ZlIHBpdm90cyBpbnRvIHRoZWlyIGZpbmFsIHBvc2l0aW9ucy5cbiAgICAvLyBXZSBzaHJ1bmsgdGhlIGxpc3QgZnJvbSBib3RoIHNpZGVzIChhW2xlZnRdIGFuZCBhW3JpZ2h0XSBoYXZlXG4gICAgLy8gbWVhbmluZ2xlc3MgdmFsdWVzIGluIHRoZW0pIGFuZCBub3cgd2UgbW92ZSBlbGVtZW50cyBmcm9tIHRoZSBmaXJzdFxuICAgIC8vIGFuZCB0aGlyZCBwYXJ0aXRpb24gaW50byB0aGVzZSBsb2NhdGlvbnMgc28gdGhhdCB3ZSBjYW4gc3RvcmUgdGhlXG4gICAgLy8gcGl2b3RzLlxuICAgIGFbbG9dID0gYVtsZXNzIC0gMV07XG4gICAgYVtsZXNzIC0gMV0gPSBwaXZvdDE7XG4gICAgYVtoaSAtIDFdID0gYVtncmVhdCArIDFdO1xuICAgIGFbZ3JlYXQgKyAxXSA9IHBpdm90MjtcblxuICAgIC8vIFRoZSBsaXN0IGlzIG5vdyBwYXJ0aXRpb25lZCBpbnRvIHRocmVlIHBhcnRpdGlvbnM6XG4gICAgLy8gWyA8IHBpdm90MSAgIHwgPj0gcGl2b3QxICYmIDw9IHBpdm90MiAgIHwgID4gcGl2b3QyICAgXVxuICAgIC8vICBeICAgICAgICAgICAgXiAgICAgICAgICAgICAgICAgICAgICAgIF4gICAgICAgICAgICAgXlxuICAgIC8vIGxlZnQgICAgICAgICBsZXNzICAgICAgICAgICAgICAgICAgICAgZ3JlYXQgICAgICAgIHJpZ2h0XG5cbiAgICAvLyBSZWN1cnNpdmUgZGVzY2VudC4gKERvbid0IGluY2x1ZGUgdGhlIHBpdm90IHZhbHVlcy4pXG4gICAgc29ydChhLCBsbywgbGVzcyAtIDEpO1xuICAgIHNvcnQoYSwgZ3JlYXQgKyAyLCBoaSk7XG5cbiAgICBpZiAocGl2b3RzRXF1YWwpIHtcbiAgICAgIC8vIEFsbCBlbGVtZW50cyBpbiB0aGUgc2Vjb25kIHBhcnRpdGlvbiBhcmUgZXF1YWwgdG8gdGhlIHBpdm90LiBOb1xuICAgICAgLy8gbmVlZCB0byBzb3J0IHRoZW0uXG4gICAgICByZXR1cm4gYTtcbiAgICB9XG5cbiAgICAvLyBJbiB0aGVvcnkgaXQgc2hvdWxkIGJlIGVub3VnaCB0byBjYWxsIF9kb1NvcnQgcmVjdXJzaXZlbHkgb24gdGhlIHNlY29uZFxuICAgIC8vIHBhcnRpdGlvbi5cbiAgICAvLyBUaGUgQW5kcm9pZCBzb3VyY2UgaG93ZXZlciByZW1vdmVzIHRoZSBwaXZvdCBlbGVtZW50cyBmcm9tIHRoZSByZWN1cnNpdmVcbiAgICAvLyBjYWxsIGlmIHRoZSBzZWNvbmQgcGFydGl0aW9uIGlzIHRvbyBsYXJnZSAobW9yZSB0aGFuIDIvMyBvZiB0aGUgbGlzdCkuXG4gICAgaWYgKGxlc3MgPCBpMSAmJiBncmVhdCA+IGk1KSB7XG4gICAgICB2YXIgbGVzc1ZhbHVlLCBncmVhdFZhbHVlO1xuICAgICAgd2hpbGUgKChsZXNzVmFsdWUgPSBmKGFbbGVzc10pKSA8PSBwaXZvdFZhbHVlMSAmJiBsZXNzVmFsdWUgPj0gcGl2b3RWYWx1ZTEpICsrbGVzcztcbiAgICAgIHdoaWxlICgoZ3JlYXRWYWx1ZSA9IGYoYVtncmVhdF0pKSA8PSBwaXZvdFZhbHVlMiAmJiBncmVhdFZhbHVlID49IHBpdm90VmFsdWUyKSAtLWdyZWF0O1xuXG4gICAgICAvLyBDb3B5IHBhc3RlIG9mIHRoZSBwcmV2aW91cyAzLXdheSBwYXJ0aXRpb25pbmcgd2l0aCBhZGFwdGlvbnMuXG4gICAgICAvL1xuICAgICAgLy8gV2UgcGFydGl0aW9uIHRoZSBsaXN0IGludG8gdGhyZWUgcGFydHM6XG4gICAgICAvLyAgMS4gPT0gcGl2b3QxXG4gICAgICAvLyAgMi4gPiBwaXZvdDEgJiYgPCBwaXZvdDJcbiAgICAgIC8vICAzLiA9PSBwaXZvdDJcbiAgICAgIC8vXG4gICAgICAvLyBEdXJpbmcgdGhlIGxvb3Agd2UgaGF2ZTpcbiAgICAgIC8vIFsgPT0gcGl2b3QxIHwgPiBwaXZvdDEgJiYgPCBwaXZvdDIgfCB1bnBhcnRpdGlvbmVkICB8ID09IHBpdm90MiBdXG4gICAgICAvLyAgICAgICAgICAgICAgXiAgICAgICAgICAgICAgICAgICAgICBeICAgICAgICAgICAgICBeXG4gICAgICAvLyAgICAgICAgICAgIGxlc3MgICAgICAgICAgICAgICAgICAgICBrICAgICAgICAgICAgICBncmVhdFxuICAgICAgLy9cbiAgICAgIC8vIEludmFyaWFudHM6XG4gICAgICAvLyAgIDEuIGZvciB4IGluIFsgKiwgbGVzc1sgOiB4ID09IHBpdm90MVxuICAgICAgLy8gICAyLiBmb3IgeCBpbiBbbGVzcywga1sgOiBwaXZvdDEgPCB4ICYmIHggPCBwaXZvdDJcbiAgICAgIC8vICAgMy4gZm9yIHggaW4gXWdyZWF0LCAqIF0gOiB4ID09IHBpdm90MlxuICAgICAgZm9yICh2YXIgayA9IGxlc3M7IGsgPD0gZ3JlYXQ7IGsrKykge1xuICAgICAgICB2YXIgZWsgPSBhW2tdLCB4ayA9IGYoZWspO1xuICAgICAgICBpZiAoeGsgPD0gcGl2b3RWYWx1ZTEgJiYgeGsgPj0gcGl2b3RWYWx1ZTEpIHtcbiAgICAgICAgICBpZiAoayAhPT0gbGVzcykge1xuICAgICAgICAgICAgYVtrXSA9IGFbbGVzc107XG4gICAgICAgICAgICBhW2xlc3NdID0gZWs7XG4gICAgICAgICAgfVxuICAgICAgICAgIGxlc3MrKztcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBpZiAoeGsgPD0gcGl2b3RWYWx1ZTIgJiYgeGsgPj0gcGl2b3RWYWx1ZTIpIHtcbiAgICAgICAgICAgIHdoaWxlICh0cnVlKSB7XG4gICAgICAgICAgICAgIHZhciBncmVhdFZhbHVlID0gZihhW2dyZWF0XSk7XG4gICAgICAgICAgICAgIGlmIChncmVhdFZhbHVlIDw9IHBpdm90VmFsdWUyICYmIGdyZWF0VmFsdWUgPj0gcGl2b3RWYWx1ZTIpIHtcbiAgICAgICAgICAgICAgICBncmVhdC0tO1xuICAgICAgICAgICAgICAgIGlmIChncmVhdCA8IGspIGJyZWFrO1xuICAgICAgICAgICAgICAgIC8vIFRoaXMgaXMgdGhlIG9ubHkgbG9jYXRpb24gaW5zaWRlIHRoZSBsb29wIHdoZXJlIGEgbmV3XG4gICAgICAgICAgICAgICAgLy8gaXRlcmF0aW9uIGlzIHN0YXJ0ZWQuXG4gICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgLy8gYVtncmVhdF0gPCBwaXZvdDIuXG4gICAgICAgICAgICAgICAgaWYgKGdyZWF0VmFsdWUgPCBwaXZvdFZhbHVlMSkge1xuICAgICAgICAgICAgICAgICAgLy8gVHJpcGxlIGV4Y2hhbmdlLlxuICAgICAgICAgICAgICAgICAgYVtrXSA9IGFbbGVzc107XG4gICAgICAgICAgICAgICAgICBhW2xlc3MrK10gPSBhW2dyZWF0XTtcbiAgICAgICAgICAgICAgICAgIGFbZ3JlYXQtLV0gPSBlaztcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgLy8gYVtncmVhdF0gPT0gcGl2b3QxLlxuICAgICAgICAgICAgICAgICAgYVtrXSA9IGFbZ3JlYXRdO1xuICAgICAgICAgICAgICAgICAgYVtncmVhdC0tXSA9IGVrO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIC8vIFRoZSBzZWNvbmQgcGFydGl0aW9uIGhhcyBub3cgYmVlbiBjbGVhcmVkIG9mIHBpdm90IGVsZW1lbnRzIGFuZCBsb29rc1xuICAgIC8vIGFzIGZvbGxvd3M6XG4gICAgLy8gWyAgKiAgfCAgPiBwaXZvdDEgJiYgPCBwaXZvdDIgIHwgKiBdXG4gICAgLy8gICAgICAgIF4gICAgICAgICAgICAgICAgICAgICAgXlxuICAgIC8vICAgICAgIGxlc3MgICAgICAgICAgICAgICAgICBncmVhdFxuICAgIC8vIFNvcnQgdGhlIHNlY29uZCBwYXJ0aXRpb24gdXNpbmcgcmVjdXJzaXZlIGRlc2NlbnQuXG5cbiAgICAvLyBUaGUgc2Vjb25kIHBhcnRpdGlvbiBsb29rcyBhcyBmb2xsb3dzOlxuICAgIC8vIFsgICogIHwgID49IHBpdm90MSAmJiA8PSBwaXZvdDIgIHwgKiBdXG4gICAgLy8gICAgICAgIF4gICAgICAgICAgICAgICAgICAgICAgICBeXG4gICAgLy8gICAgICAgbGVzcyAgICAgICAgICAgICAgICAgICAgZ3JlYXRcbiAgICAvLyBTaW1wbHkgc29ydCBpdCBieSByZWN1cnNpdmUgZGVzY2VudC5cblxuICAgIHJldHVybiBzb3J0KGEsIGxlc3MsIGdyZWF0ICsgMSk7XG4gIH1cblxuICByZXR1cm4gc29ydDtcbn1cblxudmFyIHF1aWNrc29ydF9zaXplVGhyZXNob2xkID0gMzI7XG52YXIgY3Jvc3NmaWx0ZXJfYXJyYXk4ID0gY3Jvc3NmaWx0ZXJfYXJyYXlVbnR5cGVkLFxuICAgIGNyb3NzZmlsdGVyX2FycmF5MTYgPSBjcm9zc2ZpbHRlcl9hcnJheVVudHlwZWQsXG4gICAgY3Jvc3NmaWx0ZXJfYXJyYXkzMiA9IGNyb3NzZmlsdGVyX2FycmF5VW50eXBlZCxcbiAgICBjcm9zc2ZpbHRlcl9hcnJheUxlbmd0aGVuID0gY3Jvc3NmaWx0ZXJfYXJyYXlMZW5ndGhlblVudHlwZWQsXG4gICAgY3Jvc3NmaWx0ZXJfYXJyYXlXaWRlbiA9IGNyb3NzZmlsdGVyX2FycmF5V2lkZW5VbnR5cGVkO1xuXG5pZiAodHlwZW9mIFVpbnQ4QXJyYXkgIT09IFwidW5kZWZpbmVkXCIpIHtcbiAgY3Jvc3NmaWx0ZXJfYXJyYXk4ID0gZnVuY3Rpb24obikgeyByZXR1cm4gbmV3IFVpbnQ4QXJyYXkobik7IH07XG4gIGNyb3NzZmlsdGVyX2FycmF5MTYgPSBmdW5jdGlvbihuKSB7IHJldHVybiBuZXcgVWludDE2QXJyYXkobik7IH07XG4gIGNyb3NzZmlsdGVyX2FycmF5MzIgPSBmdW5jdGlvbihuKSB7IHJldHVybiBuZXcgVWludDMyQXJyYXkobik7IH07XG5cbiAgY3Jvc3NmaWx0ZXJfYXJyYXlMZW5ndGhlbiA9IGZ1bmN0aW9uKGFycmF5LCBsZW5ndGgpIHtcbiAgICBpZiAoYXJyYXkubGVuZ3RoID49IGxlbmd0aCkgcmV0dXJuIGFycmF5O1xuICAgIHZhciBjb3B5ID0gbmV3IGFycmF5LmNvbnN0cnVjdG9yKGxlbmd0aCk7XG4gICAgY29weS5zZXQoYXJyYXkpO1xuICAgIHJldHVybiBjb3B5O1xuICB9O1xuXG4gIGNyb3NzZmlsdGVyX2FycmF5V2lkZW4gPSBmdW5jdGlvbihhcnJheSwgd2lkdGgpIHtcbiAgICB2YXIgY29weTtcbiAgICBzd2l0Y2ggKHdpZHRoKSB7XG4gICAgICBjYXNlIDE2OiBjb3B5ID0gY3Jvc3NmaWx0ZXJfYXJyYXkxNihhcnJheS5sZW5ndGgpOyBicmVhaztcbiAgICAgIGNhc2UgMzI6IGNvcHkgPSBjcm9zc2ZpbHRlcl9hcnJheTMyKGFycmF5Lmxlbmd0aCk7IGJyZWFrO1xuICAgICAgZGVmYXVsdDogdGhyb3cgbmV3IEVycm9yKFwiaW52YWxpZCBhcnJheSB3aWR0aCFcIik7XG4gICAgfVxuICAgIGNvcHkuc2V0KGFycmF5KTtcbiAgICByZXR1cm4gY29weTtcbiAgfTtcbn1cblxuZnVuY3Rpb24gY3Jvc3NmaWx0ZXJfYXJyYXlVbnR5cGVkKG4pIHtcbiAgdmFyIGFycmF5ID0gbmV3IEFycmF5KG4pLCBpID0gLTE7XG4gIHdoaWxlICgrK2kgPCBuKSBhcnJheVtpXSA9IDA7XG4gIHJldHVybiBhcnJheTtcbn1cblxuZnVuY3Rpb24gY3Jvc3NmaWx0ZXJfYXJyYXlMZW5ndGhlblVudHlwZWQoYXJyYXksIGxlbmd0aCkge1xuICB2YXIgbiA9IGFycmF5Lmxlbmd0aDtcbiAgd2hpbGUgKG4gPCBsZW5ndGgpIGFycmF5W24rK10gPSAwO1xuICByZXR1cm4gYXJyYXk7XG59XG5cbmZ1bmN0aW9uIGNyb3NzZmlsdGVyX2FycmF5V2lkZW5VbnR5cGVkKGFycmF5LCB3aWR0aCkge1xuICBpZiAod2lkdGggPiAzMikgdGhyb3cgbmV3IEVycm9yKFwiaW52YWxpZCBhcnJheSB3aWR0aCFcIik7XG4gIHJldHVybiBhcnJheTtcbn1cbmZ1bmN0aW9uIGNyb3NzZmlsdGVyX2ZpbHRlckV4YWN0KGJpc2VjdCwgdmFsdWUpIHtcbiAgcmV0dXJuIGZ1bmN0aW9uKHZhbHVlcykge1xuICAgIHZhciBuID0gdmFsdWVzLmxlbmd0aDtcbiAgICByZXR1cm4gW2Jpc2VjdC5sZWZ0KHZhbHVlcywgdmFsdWUsIDAsIG4pLCBiaXNlY3QucmlnaHQodmFsdWVzLCB2YWx1ZSwgMCwgbildO1xuICB9O1xufVxuXG5mdW5jdGlvbiBjcm9zc2ZpbHRlcl9maWx0ZXJSYW5nZShiaXNlY3QsIHJhbmdlKSB7XG4gIHZhciBtaW4gPSByYW5nZVswXSxcbiAgICAgIG1heCA9IHJhbmdlWzFdO1xuICByZXR1cm4gZnVuY3Rpb24odmFsdWVzKSB7XG4gICAgdmFyIG4gPSB2YWx1ZXMubGVuZ3RoO1xuICAgIHJldHVybiBbYmlzZWN0LmxlZnQodmFsdWVzLCBtaW4sIDAsIG4pLCBiaXNlY3QubGVmdCh2YWx1ZXMsIG1heCwgMCwgbildO1xuICB9O1xufVxuXG5mdW5jdGlvbiBjcm9zc2ZpbHRlcl9maWx0ZXJBbGwodmFsdWVzKSB7XG4gIHJldHVybiBbMCwgdmFsdWVzLmxlbmd0aF07XG59XG5mdW5jdGlvbiBjcm9zc2ZpbHRlcl9udWxsKCkge1xuICByZXR1cm4gbnVsbDtcbn1cbmZ1bmN0aW9uIGNyb3NzZmlsdGVyX3plcm8oKSB7XG4gIHJldHVybiAwO1xufVxuZnVuY3Rpb24gY3Jvc3NmaWx0ZXJfcmVkdWNlSW5jcmVtZW50KHApIHtcbiAgcmV0dXJuIHAgKyAxO1xufVxuXG5mdW5jdGlvbiBjcm9zc2ZpbHRlcl9yZWR1Y2VEZWNyZW1lbnQocCkge1xuICByZXR1cm4gcCAtIDE7XG59XG5cbmZ1bmN0aW9uIGNyb3NzZmlsdGVyX3JlZHVjZUFkZChmKSB7XG4gIHJldHVybiBmdW5jdGlvbihwLCB2KSB7XG4gICAgcmV0dXJuIHAgKyArZih2KTtcbiAgfTtcbn1cblxuZnVuY3Rpb24gY3Jvc3NmaWx0ZXJfcmVkdWNlU3VidHJhY3QoZikge1xuICByZXR1cm4gZnVuY3Rpb24ocCwgdikge1xuICAgIHJldHVybiBwIC0gZih2KTtcbiAgfTtcbn1cbmV4cG9ydHMuY3Jvc3NmaWx0ZXIgPSBjcm9zc2ZpbHRlcjtcblxuZnVuY3Rpb24gY3Jvc3NmaWx0ZXIoKSB7XG4gIHZhciBjcm9zc2ZpbHRlciA9IHtcbiAgICBhZGQ6IGFkZCxcbiAgICByZW1vdmU6IHJlbW92ZURhdGEsXG4gICAgZGltZW5zaW9uOiBkaW1lbnNpb24sXG4gICAgZ3JvdXBBbGw6IGdyb3VwQWxsLFxuICAgIHNpemU6IHNpemVcbiAgfTtcblxuICB2YXIgZGF0YSA9IFtdLCAvLyB0aGUgcmVjb3Jkc1xuICAgICAgbiA9IDAsIC8vIHRoZSBudW1iZXIgb2YgcmVjb3JkczsgZGF0YS5sZW5ndGhcbiAgICAgIG0gPSAwLCAvLyBhIGJpdCBtYXNrIHJlcHJlc2VudGluZyB3aGljaCBkaW1lbnNpb25zIGFyZSBpbiB1c2VcbiAgICAgIE0gPSA4LCAvLyBudW1iZXIgb2YgZGltZW5zaW9ucyB0aGF0IGNhbiBmaXQgaW4gYGZpbHRlcnNgXG4gICAgICBmaWx0ZXJzID0gY3Jvc3NmaWx0ZXJfYXJyYXk4KDApLCAvLyBNIGJpdHMgcGVyIHJlY29yZDsgMSBpcyBmaWx0ZXJlZCBvdXRcbiAgICAgIGZpbHRlckxpc3RlbmVycyA9IFtdLCAvLyB3aGVuIHRoZSBmaWx0ZXJzIGNoYW5nZVxuICAgICAgZGF0YUxpc3RlbmVycyA9IFtdLCAvLyB3aGVuIGRhdGEgaXMgYWRkZWRcbiAgICAgIHJlbW92ZURhdGFMaXN0ZW5lcnMgPSBbXTsgLy8gd2hlbiBkYXRhIGlzIHJlbW92ZWRcblxuICAvLyBBZGRzIHRoZSBzcGVjaWZpZWQgbmV3IHJlY29yZHMgdG8gdGhpcyBjcm9zc2ZpbHRlci5cbiAgZnVuY3Rpb24gYWRkKG5ld0RhdGEpIHtcbiAgICB2YXIgbjAgPSBuLFxuICAgICAgICBuMSA9IG5ld0RhdGEubGVuZ3RoO1xuXG4gICAgLy8gSWYgdGhlcmUncyBhY3R1YWxseSBuZXcgZGF0YSB0byBhZGTigKZcbiAgICAvLyBNZXJnZSB0aGUgbmV3IGRhdGEgaW50byB0aGUgZXhpc3RpbmcgZGF0YS5cbiAgICAvLyBMZW5ndGhlbiB0aGUgZmlsdGVyIGJpdHNldCB0byBoYW5kbGUgdGhlIG5ldyByZWNvcmRzLlxuICAgIC8vIE5vdGlmeSBsaXN0ZW5lcnMgKGRpbWVuc2lvbnMgYW5kIGdyb3VwcykgdGhhdCBuZXcgZGF0YSBpcyBhdmFpbGFibGUuXG4gICAgaWYgKG4xKSB7XG4gICAgICBkYXRhID0gZGF0YS5jb25jYXQobmV3RGF0YSk7XG4gICAgICBmaWx0ZXJzID0gY3Jvc3NmaWx0ZXJfYXJyYXlMZW5ndGhlbihmaWx0ZXJzLCBuICs9IG4xKTtcbiAgICAgIGRhdGFMaXN0ZW5lcnMuZm9yRWFjaChmdW5jdGlvbihsKSB7IGwobmV3RGF0YSwgbjAsIG4xKTsgfSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIGNyb3NzZmlsdGVyO1xuICB9XG5cbiAgLy8gUmVtb3ZlcyBhbGwgcmVjb3JkcyB0aGF0IG1hdGNoIHRoZSBjdXJyZW50IGZpbHRlcnMuXG4gIGZ1bmN0aW9uIHJlbW92ZURhdGEoKSB7XG4gICAgdmFyIG5ld0luZGV4ID0gY3Jvc3NmaWx0ZXJfaW5kZXgobiwgbiksXG4gICAgICAgIHJlbW92ZWQgPSBbXTtcbiAgICBmb3IgKHZhciBpID0gMCwgaiA9IDA7IGkgPCBuOyArK2kpIHtcbiAgICAgIGlmIChmaWx0ZXJzW2ldKSBuZXdJbmRleFtpXSA9IGorKztcbiAgICAgIGVsc2UgcmVtb3ZlZC5wdXNoKGkpO1xuICAgIH1cblxuICAgIC8vIFJlbW92ZSBhbGwgbWF0Y2hpbmcgcmVjb3JkcyBmcm9tIGdyb3Vwcy5cbiAgICBmaWx0ZXJMaXN0ZW5lcnMuZm9yRWFjaChmdW5jdGlvbihsKSB7IGwoMCwgW10sIHJlbW92ZWQpOyB9KTtcblxuICAgIC8vIFVwZGF0ZSBpbmRleGVzLlxuICAgIHJlbW92ZURhdGFMaXN0ZW5lcnMuZm9yRWFjaChmdW5jdGlvbihsKSB7IGwobmV3SW5kZXgpOyB9KTtcblxuICAgIC8vIFJlbW92ZSBvbGQgZmlsdGVycyBhbmQgZGF0YSBieSBvdmVyd3JpdGluZy5cbiAgICBmb3IgKHZhciBpID0gMCwgaiA9IDAsIGs7IGkgPCBuOyArK2kpIHtcbiAgICAgIGlmIChrID0gZmlsdGVyc1tpXSkge1xuICAgICAgICBpZiAoaSAhPT0gaikgZmlsdGVyc1tqXSA9IGssIGRhdGFbal0gPSBkYXRhW2ldO1xuICAgICAgICArK2o7XG4gICAgICB9XG4gICAgfVxuICAgIGRhdGEubGVuZ3RoID0gajtcbiAgICB3aGlsZSAobiA+IGopIGZpbHRlcnNbLS1uXSA9IDA7XG4gIH1cblxuICAvLyBBZGRzIGEgbmV3IGRpbWVuc2lvbiB3aXRoIHRoZSBzcGVjaWZpZWQgdmFsdWUgYWNjZXNzb3IgZnVuY3Rpb24uXG4gIGZ1bmN0aW9uIGRpbWVuc2lvbih2YWx1ZSkge1xuICAgIHZhciBkaW1lbnNpb24gPSB7XG4gICAgICBmaWx0ZXI6IGZpbHRlcixcbiAgICAgIGZpbHRlckV4YWN0OiBmaWx0ZXJFeGFjdCxcbiAgICAgIGZpbHRlclJhbmdlOiBmaWx0ZXJSYW5nZSxcbiAgICAgIGZpbHRlckZ1bmN0aW9uOiBmaWx0ZXJGdW5jdGlvbixcbiAgICAgIGZpbHRlckFsbDogZmlsdGVyQWxsLFxuICAgICAgdG9wOiB0b3AsXG4gICAgICBib3R0b206IGJvdHRvbSxcbiAgICAgIGdyb3VwOiBncm91cCxcbiAgICAgIGdyb3VwQWxsOiBncm91cEFsbCxcbiAgICAgIGRpc3Bvc2U6IGRpc3Bvc2UsXG4gICAgICByZW1vdmU6IGRpc3Bvc2UgLy8gZm9yIGJhY2t3YXJkcy1jb21wYXRpYmlsaXR5XG4gICAgfTtcblxuICAgIHZhciBvbmUgPSB+bSAmIC1+bSwgLy8gbG93ZXN0IHVuc2V0IGJpdCBhcyBtYXNrLCBlLmcuLCAwMDAwMTAwMFxuICAgICAgICB6ZXJvID0gfm9uZSwgLy8gaW52ZXJ0ZWQgb25lLCBlLmcuLCAxMTExMDExMVxuICAgICAgICB2YWx1ZXMsIC8vIHNvcnRlZCwgY2FjaGVkIGFycmF5XG4gICAgICAgIGluZGV4LCAvLyB2YWx1ZSByYW5rIOKGpiBvYmplY3QgaWRcbiAgICAgICAgbmV3VmFsdWVzLCAvLyB0ZW1wb3JhcnkgYXJyYXkgc3RvcmluZyBuZXdseS1hZGRlZCB2YWx1ZXNcbiAgICAgICAgbmV3SW5kZXgsIC8vIHRlbXBvcmFyeSBhcnJheSBzdG9yaW5nIG5ld2x5LWFkZGVkIGluZGV4XG4gICAgICAgIHNvcnQgPSBxdWlja3NvcnRfYnkoZnVuY3Rpb24oaSkgeyByZXR1cm4gbmV3VmFsdWVzW2ldOyB9KSxcbiAgICAgICAgcmVmaWx0ZXIgPSBjcm9zc2ZpbHRlcl9maWx0ZXJBbGwsIC8vIGZvciByZWNvbXB1dGluZyBmaWx0ZXJcbiAgICAgICAgcmVmaWx0ZXJGdW5jdGlvbiwgLy8gdGhlIGN1c3RvbSBmaWx0ZXIgZnVuY3Rpb24gaW4gdXNlXG4gICAgICAgIGluZGV4TGlzdGVuZXJzID0gW10sIC8vIHdoZW4gZGF0YSBpcyBhZGRlZFxuICAgICAgICBkaW1lbnNpb25Hcm91cHMgPSBbXSxcbiAgICAgICAgbG8wID0gMCxcbiAgICAgICAgaGkwID0gMDtcblxuICAgIC8vIFVwZGF0aW5nIGEgZGltZW5zaW9uIGlzIGEgdHdvLXN0YWdlIHByb2Nlc3MuIEZpcnN0LCB3ZSBtdXN0IHVwZGF0ZSB0aGVcbiAgICAvLyBhc3NvY2lhdGVkIGZpbHRlcnMgZm9yIHRoZSBuZXdseS1hZGRlZCByZWNvcmRzLiBPbmNlIGFsbCBkaW1lbnNpb25zIGhhdmVcbiAgICAvLyB1cGRhdGVkIHRoZWlyIGZpbHRlcnMsIHRoZSBncm91cHMgYXJlIG5vdGlmaWVkIHRvIHVwZGF0ZS5cbiAgICBkYXRhTGlzdGVuZXJzLnVuc2hpZnQocHJlQWRkKTtcbiAgICBkYXRhTGlzdGVuZXJzLnB1c2gocG9zdEFkZCk7XG5cbiAgICByZW1vdmVEYXRhTGlzdGVuZXJzLnB1c2gocmVtb3ZlRGF0YSk7XG5cbiAgICAvLyBJbmNvcnBvcmF0ZSBhbnkgZXhpc3RpbmcgZGF0YSBpbnRvIHRoaXMgZGltZW5zaW9uLCBhbmQgbWFrZSBzdXJlIHRoYXQgdGhlXG4gICAgLy8gZmlsdGVyIGJpdHNldCBpcyB3aWRlIGVub3VnaCB0byBoYW5kbGUgdGhlIG5ldyBkaW1lbnNpb24uXG4gICAgbSB8PSBvbmU7XG4gICAgaWYgKE0gPj0gMzIgPyAhb25lIDogbSAmIC0oMSA8PCBNKSkge1xuICAgICAgZmlsdGVycyA9IGNyb3NzZmlsdGVyX2FycmF5V2lkZW4oZmlsdGVycywgTSA8PD0gMSk7XG4gICAgfVxuICAgIHByZUFkZChkYXRhLCAwLCBuKTtcbiAgICBwb3N0QWRkKGRhdGEsIDAsIG4pO1xuXG4gICAgLy8gSW5jb3Jwb3JhdGVzIHRoZSBzcGVjaWZpZWQgbmV3IHJlY29yZHMgaW50byB0aGlzIGRpbWVuc2lvbi5cbiAgICAvLyBUaGlzIGZ1bmN0aW9uIGlzIHJlc3BvbnNpYmxlIGZvciB1cGRhdGluZyBmaWx0ZXJzLCB2YWx1ZXMsIGFuZCBpbmRleC5cbiAgICBmdW5jdGlvbiBwcmVBZGQobmV3RGF0YSwgbjAsIG4xKSB7XG5cbiAgICAgIC8vIFBlcm11dGUgbmV3IHZhbHVlcyBpbnRvIG5hdHVyYWwgb3JkZXIgdXNpbmcgYSBzb3J0ZWQgaW5kZXguXG4gICAgICBuZXdWYWx1ZXMgPSBuZXdEYXRhLm1hcCh2YWx1ZSk7XG4gICAgICBuZXdJbmRleCA9IHNvcnQoY3Jvc3NmaWx0ZXJfcmFuZ2UobjEpLCAwLCBuMSk7XG4gICAgICBuZXdWYWx1ZXMgPSBwZXJtdXRlKG5ld1ZhbHVlcywgbmV3SW5kZXgpO1xuXG4gICAgICAvLyBCaXNlY3QgbmV3VmFsdWVzIHRvIGRldGVybWluZSB3aGljaCBuZXcgcmVjb3JkcyBhcmUgc2VsZWN0ZWQuXG4gICAgICB2YXIgYm91bmRzID0gcmVmaWx0ZXIobmV3VmFsdWVzKSwgbG8xID0gYm91bmRzWzBdLCBoaTEgPSBib3VuZHNbMV0sIGk7XG4gICAgICBpZiAocmVmaWx0ZXJGdW5jdGlvbikge1xuICAgICAgICBmb3IgKGkgPSAwOyBpIDwgbjE7ICsraSkge1xuICAgICAgICAgIGlmICghcmVmaWx0ZXJGdW5jdGlvbihuZXdWYWx1ZXNbaV0sIGkpKSBmaWx0ZXJzW25ld0luZGV4W2ldICsgbjBdIHw9IG9uZTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgZm9yIChpID0gMDsgaSA8IGxvMTsgKytpKSBmaWx0ZXJzW25ld0luZGV4W2ldICsgbjBdIHw9IG9uZTtcbiAgICAgICAgZm9yIChpID0gaGkxOyBpIDwgbjE7ICsraSkgZmlsdGVyc1tuZXdJbmRleFtpXSArIG4wXSB8PSBvbmU7XG4gICAgICB9XG5cbiAgICAgIC8vIElmIHRoaXMgZGltZW5zaW9uIHByZXZpb3VzbHkgaGFkIG5vIGRhdGEsIHRoZW4gd2UgZG9uJ3QgbmVlZCB0byBkbyB0aGVcbiAgICAgIC8vIG1vcmUgZXhwZW5zaXZlIG1lcmdlIG9wZXJhdGlvbjsgdXNlIHRoZSBuZXcgdmFsdWVzIGFuZCBpbmRleCBhcy1pcy5cbiAgICAgIGlmICghbjApIHtcbiAgICAgICAgdmFsdWVzID0gbmV3VmFsdWVzO1xuICAgICAgICBpbmRleCA9IG5ld0luZGV4O1xuICAgICAgICBsbzAgPSBsbzE7XG4gICAgICAgIGhpMCA9IGhpMTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICB2YXIgb2xkVmFsdWVzID0gdmFsdWVzLFxuICAgICAgICAgIG9sZEluZGV4ID0gaW5kZXgsXG4gICAgICAgICAgaTAgPSAwLFxuICAgICAgICAgIGkxID0gMDtcblxuICAgICAgLy8gT3RoZXJ3aXNlLCBjcmVhdGUgbmV3IGFycmF5cyBpbnRvIHdoaWNoIHRvIG1lcmdlIG5ldyBhbmQgb2xkLlxuICAgICAgdmFsdWVzID0gbmV3IEFycmF5KG4pO1xuICAgICAgaW5kZXggPSBjcm9zc2ZpbHRlcl9pbmRleChuLCBuKTtcblxuICAgICAgLy8gTWVyZ2UgdGhlIG9sZCBhbmQgbmV3IHNvcnRlZCB2YWx1ZXMsIGFuZCBvbGQgYW5kIG5ldyBpbmRleC5cbiAgICAgIGZvciAoaSA9IDA7IGkwIDwgbjAgJiYgaTEgPCBuMTsgKytpKSB7XG4gICAgICAgIGlmIChvbGRWYWx1ZXNbaTBdIDwgbmV3VmFsdWVzW2kxXSkge1xuICAgICAgICAgIHZhbHVlc1tpXSA9IG9sZFZhbHVlc1tpMF07XG4gICAgICAgICAgaW5kZXhbaV0gPSBvbGRJbmRleFtpMCsrXTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB2YWx1ZXNbaV0gPSBuZXdWYWx1ZXNbaTFdO1xuICAgICAgICAgIGluZGV4W2ldID0gbmV3SW5kZXhbaTErK10gKyBuMDtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICAvLyBBZGQgYW55IHJlbWFpbmluZyBvbGQgdmFsdWVzLlxuICAgICAgZm9yICg7IGkwIDwgbjA7ICsraTAsICsraSkge1xuICAgICAgICB2YWx1ZXNbaV0gPSBvbGRWYWx1ZXNbaTBdO1xuICAgICAgICBpbmRleFtpXSA9IG9sZEluZGV4W2kwXTtcbiAgICAgIH1cblxuICAgICAgLy8gQWRkIGFueSByZW1haW5pbmcgbmV3IHZhbHVlcy5cbiAgICAgIGZvciAoOyBpMSA8IG4xOyArK2kxLCArK2kpIHtcbiAgICAgICAgdmFsdWVzW2ldID0gbmV3VmFsdWVzW2kxXTtcbiAgICAgICAgaW5kZXhbaV0gPSBuZXdJbmRleFtpMV0gKyBuMDtcbiAgICAgIH1cblxuICAgICAgLy8gQmlzZWN0IGFnYWluIHRvIHJlY29tcHV0ZSBsbzAgYW5kIGhpMC5cbiAgICAgIGJvdW5kcyA9IHJlZmlsdGVyKHZhbHVlcyksIGxvMCA9IGJvdW5kc1swXSwgaGkwID0gYm91bmRzWzFdO1xuICAgIH1cblxuICAgIC8vIFdoZW4gYWxsIGZpbHRlcnMgaGF2ZSB1cGRhdGVkLCBub3RpZnkgaW5kZXggbGlzdGVuZXJzIG9mIHRoZSBuZXcgdmFsdWVzLlxuICAgIGZ1bmN0aW9uIHBvc3RBZGQobmV3RGF0YSwgbjAsIG4xKSB7XG4gICAgICBpbmRleExpc3RlbmVycy5mb3JFYWNoKGZ1bmN0aW9uKGwpIHsgbChuZXdWYWx1ZXMsIG5ld0luZGV4LCBuMCwgbjEpOyB9KTtcbiAgICAgIG5ld1ZhbHVlcyA9IG5ld0luZGV4ID0gbnVsbDtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiByZW1vdmVEYXRhKHJlSW5kZXgpIHtcbiAgICAgIGZvciAodmFyIGkgPSAwLCBqID0gMCwgazsgaSA8IG47ICsraSkge1xuICAgICAgICBpZiAoZmlsdGVyc1trID0gaW5kZXhbaV1dKSB7XG4gICAgICAgICAgaWYgKGkgIT09IGopIHZhbHVlc1tqXSA9IHZhbHVlc1tpXTtcbiAgICAgICAgICBpbmRleFtqXSA9IHJlSW5kZXhba107XG4gICAgICAgICAgKytqO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICB2YWx1ZXMubGVuZ3RoID0gajtcbiAgICAgIHdoaWxlIChqIDwgbikgaW5kZXhbaisrXSA9IDA7XG5cbiAgICAgIC8vIEJpc2VjdCBhZ2FpbiB0byByZWNvbXB1dGUgbG8wIGFuZCBoaTAuXG4gICAgICB2YXIgYm91bmRzID0gcmVmaWx0ZXIodmFsdWVzKTtcbiAgICAgIGxvMCA9IGJvdW5kc1swXSwgaGkwID0gYm91bmRzWzFdO1xuICAgIH1cblxuICAgIC8vIFVwZGF0ZXMgdGhlIHNlbGVjdGVkIHZhbHVlcyBiYXNlZCBvbiB0aGUgc3BlY2lmaWVkIGJvdW5kcyBbbG8sIGhpXS5cbiAgICAvLyBUaGlzIGltcGxlbWVudGF0aW9uIGlzIHVzZWQgYnkgYWxsIHRoZSBwdWJsaWMgZmlsdGVyIG1ldGhvZHMuXG4gICAgZnVuY3Rpb24gZmlsdGVySW5kZXhCb3VuZHMoYm91bmRzKSB7XG4gICAgICB2YXIgbG8xID0gYm91bmRzWzBdLFxuICAgICAgICAgIGhpMSA9IGJvdW5kc1sxXTtcblxuICAgICAgaWYgKHJlZmlsdGVyRnVuY3Rpb24pIHtcbiAgICAgICAgcmVmaWx0ZXJGdW5jdGlvbiA9IG51bGw7XG4gICAgICAgIGZpbHRlckluZGV4RnVuY3Rpb24oZnVuY3Rpb24oZCwgaSkgeyByZXR1cm4gbG8xIDw9IGkgJiYgaSA8IGhpMTsgfSk7XG4gICAgICAgIGxvMCA9IGxvMTtcbiAgICAgICAgaGkwID0gaGkxO1xuICAgICAgICByZXR1cm4gZGltZW5zaW9uO1xuICAgICAgfVxuXG4gICAgICB2YXIgaSxcbiAgICAgICAgICBqLFxuICAgICAgICAgIGssXG4gICAgICAgICAgYWRkZWQgPSBbXSxcbiAgICAgICAgICByZW1vdmVkID0gW107XG5cbiAgICAgIC8vIEZhc3QgaW5jcmVtZW50YWwgdXBkYXRlIGJhc2VkIG9uIHByZXZpb3VzIGxvIGluZGV4LlxuICAgICAgaWYgKGxvMSA8IGxvMCkge1xuICAgICAgICBmb3IgKGkgPSBsbzEsIGogPSBNYXRoLm1pbihsbzAsIGhpMSk7IGkgPCBqOyArK2kpIHtcbiAgICAgICAgICBmaWx0ZXJzW2sgPSBpbmRleFtpXV0gXj0gb25lO1xuICAgICAgICAgIGFkZGVkLnB1c2goayk7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSBpZiAobG8xID4gbG8wKSB7XG4gICAgICAgIGZvciAoaSA9IGxvMCwgaiA9IE1hdGgubWluKGxvMSwgaGkwKTsgaSA8IGo7ICsraSkge1xuICAgICAgICAgIGZpbHRlcnNbayA9IGluZGV4W2ldXSBePSBvbmU7XG4gICAgICAgICAgcmVtb3ZlZC5wdXNoKGspO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIC8vIEZhc3QgaW5jcmVtZW50YWwgdXBkYXRlIGJhc2VkIG9uIHByZXZpb3VzIGhpIGluZGV4LlxuICAgICAgaWYgKGhpMSA+IGhpMCkge1xuICAgICAgICBmb3IgKGkgPSBNYXRoLm1heChsbzEsIGhpMCksIGogPSBoaTE7IGkgPCBqOyArK2kpIHtcbiAgICAgICAgICBmaWx0ZXJzW2sgPSBpbmRleFtpXV0gXj0gb25lO1xuICAgICAgICAgIGFkZGVkLnB1c2goayk7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSBpZiAoaGkxIDwgaGkwKSB7XG4gICAgICAgIGZvciAoaSA9IE1hdGgubWF4KGxvMCwgaGkxKSwgaiA9IGhpMDsgaSA8IGo7ICsraSkge1xuICAgICAgICAgIGZpbHRlcnNbayA9IGluZGV4W2ldXSBePSBvbmU7XG4gICAgICAgICAgcmVtb3ZlZC5wdXNoKGspO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGxvMCA9IGxvMTtcbiAgICAgIGhpMCA9IGhpMTtcbiAgICAgIGZpbHRlckxpc3RlbmVycy5mb3JFYWNoKGZ1bmN0aW9uKGwpIHsgbChvbmUsIGFkZGVkLCByZW1vdmVkKTsgfSk7XG4gICAgICByZXR1cm4gZGltZW5zaW9uO1xuICAgIH1cblxuICAgIC8vIEZpbHRlcnMgdGhpcyBkaW1lbnNpb24gdXNpbmcgdGhlIHNwZWNpZmllZCByYW5nZSwgdmFsdWUsIG9yIG51bGwuXG4gICAgLy8gSWYgdGhlIHJhbmdlIGlzIG51bGwsIHRoaXMgaXMgZXF1aXZhbGVudCB0byBmaWx0ZXJBbGwuXG4gICAgLy8gSWYgdGhlIHJhbmdlIGlzIGFuIGFycmF5LCB0aGlzIGlzIGVxdWl2YWxlbnQgdG8gZmlsdGVyUmFuZ2UuXG4gICAgLy8gT3RoZXJ3aXNlLCB0aGlzIGlzIGVxdWl2YWxlbnQgdG8gZmlsdGVyRXhhY3QuXG4gICAgZnVuY3Rpb24gZmlsdGVyKHJhbmdlKSB7XG4gICAgICByZXR1cm4gcmFuZ2UgPT0gbnVsbFxuICAgICAgICAgID8gZmlsdGVyQWxsKCkgOiBBcnJheS5pc0FycmF5KHJhbmdlKVxuICAgICAgICAgID8gZmlsdGVyUmFuZ2UocmFuZ2UpIDogdHlwZW9mIHJhbmdlID09PSBcImZ1bmN0aW9uXCJcbiAgICAgICAgICA/IGZpbHRlckZ1bmN0aW9uKHJhbmdlKVxuICAgICAgICAgIDogZmlsdGVyRXhhY3QocmFuZ2UpO1xuICAgIH1cblxuICAgIC8vIEZpbHRlcnMgdGhpcyBkaW1lbnNpb24gdG8gc2VsZWN0IHRoZSBleGFjdCB2YWx1ZS5cbiAgICBmdW5jdGlvbiBmaWx0ZXJFeGFjdCh2YWx1ZSkge1xuICAgICAgcmV0dXJuIGZpbHRlckluZGV4Qm91bmRzKChyZWZpbHRlciA9IGNyb3NzZmlsdGVyX2ZpbHRlckV4YWN0KGJpc2VjdCwgdmFsdWUpKSh2YWx1ZXMpKTtcbiAgICB9XG5cbiAgICAvLyBGaWx0ZXJzIHRoaXMgZGltZW5zaW9uIHRvIHNlbGVjdCB0aGUgc3BlY2lmaWVkIHJhbmdlIFtsbywgaGldLlxuICAgIC8vIFRoZSBsb3dlciBib3VuZCBpcyBpbmNsdXNpdmUsIGFuZCB0aGUgdXBwZXIgYm91bmQgaXMgZXhjbHVzaXZlLlxuICAgIGZ1bmN0aW9uIGZpbHRlclJhbmdlKHJhbmdlKSB7XG4gICAgICByZXR1cm4gZmlsdGVySW5kZXhCb3VuZHMoKHJlZmlsdGVyID0gY3Jvc3NmaWx0ZXJfZmlsdGVyUmFuZ2UoYmlzZWN0LCByYW5nZSkpKHZhbHVlcykpO1xuICAgIH1cblxuICAgIC8vIENsZWFycyBhbnkgZmlsdGVycyBvbiB0aGlzIGRpbWVuc2lvbi5cbiAgICBmdW5jdGlvbiBmaWx0ZXJBbGwoKSB7XG4gICAgICByZXR1cm4gZmlsdGVySW5kZXhCb3VuZHMoKHJlZmlsdGVyID0gY3Jvc3NmaWx0ZXJfZmlsdGVyQWxsKSh2YWx1ZXMpKTtcbiAgICB9XG5cbiAgICAvLyBGaWx0ZXJzIHRoaXMgZGltZW5zaW9uIHVzaW5nIGFuIGFyYml0cmFyeSBmdW5jdGlvbi5cbiAgICBmdW5jdGlvbiBmaWx0ZXJGdW5jdGlvbihmKSB7XG4gICAgICByZWZpbHRlciA9IGNyb3NzZmlsdGVyX2ZpbHRlckFsbDtcblxuICAgICAgZmlsdGVySW5kZXhGdW5jdGlvbihyZWZpbHRlckZ1bmN0aW9uID0gZik7XG5cbiAgICAgIGxvMCA9IDA7XG4gICAgICBoaTAgPSBuO1xuXG4gICAgICByZXR1cm4gZGltZW5zaW9uO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGZpbHRlckluZGV4RnVuY3Rpb24oZikge1xuICAgICAgdmFyIGksXG4gICAgICAgICAgayxcbiAgICAgICAgICB4LFxuICAgICAgICAgIGFkZGVkID0gW10sXG4gICAgICAgICAgcmVtb3ZlZCA9IFtdO1xuXG4gICAgICBmb3IgKGkgPSAwOyBpIDwgbjsgKytpKSB7XG4gICAgICAgIGlmICghKGZpbHRlcnNbayA9IGluZGV4W2ldXSAmIG9uZSkgXiAhISh4ID0gZih2YWx1ZXNbaV0sIGkpKSkge1xuICAgICAgICAgIGlmICh4KSBmaWx0ZXJzW2tdICY9IHplcm8sIGFkZGVkLnB1c2goayk7XG4gICAgICAgICAgZWxzZSBmaWx0ZXJzW2tdIHw9IG9uZSwgcmVtb3ZlZC5wdXNoKGspO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBmaWx0ZXJMaXN0ZW5lcnMuZm9yRWFjaChmdW5jdGlvbihsKSB7IGwob25lLCBhZGRlZCwgcmVtb3ZlZCk7IH0pO1xuICAgIH1cblxuICAgIC8vIFJldHVybnMgdGhlIHRvcCBLIHNlbGVjdGVkIHJlY29yZHMgYmFzZWQgb24gdGhpcyBkaW1lbnNpb24ncyBvcmRlci5cbiAgICAvLyBOb3RlOiBvYnNlcnZlcyB0aGlzIGRpbWVuc2lvbidzIGZpbHRlciwgdW5saWtlIGdyb3VwIGFuZCBncm91cEFsbC5cbiAgICBmdW5jdGlvbiB0b3Aoaykge1xuICAgICAgdmFyIGFycmF5ID0gW10sXG4gICAgICAgICAgaSA9IGhpMCxcbiAgICAgICAgICBqO1xuXG4gICAgICB3aGlsZSAoLS1pID49IGxvMCAmJiBrID4gMCkge1xuICAgICAgICBpZiAoIWZpbHRlcnNbaiA9IGluZGV4W2ldXSkge1xuICAgICAgICAgIGFycmF5LnB1c2goZGF0YVtqXSk7XG4gICAgICAgICAgLS1rO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBhcnJheTtcbiAgICB9XG5cbiAgICAvLyBSZXR1cm5zIHRoZSBib3R0b20gSyBzZWxlY3RlZCByZWNvcmRzIGJhc2VkIG9uIHRoaXMgZGltZW5zaW9uJ3Mgb3JkZXIuXG4gICAgLy8gTm90ZTogb2JzZXJ2ZXMgdGhpcyBkaW1lbnNpb24ncyBmaWx0ZXIsIHVubGlrZSBncm91cCBhbmQgZ3JvdXBBbGwuXG4gICAgZnVuY3Rpb24gYm90dG9tKGspIHtcbiAgICAgIHZhciBhcnJheSA9IFtdLFxuICAgICAgICAgIGkgPSBsbzAsXG4gICAgICAgICAgajtcblxuICAgICAgd2hpbGUgKGkgPCBoaTAgJiYgayA+IDApIHtcbiAgICAgICAgaWYgKCFmaWx0ZXJzW2ogPSBpbmRleFtpXV0pIHtcbiAgICAgICAgICBhcnJheS5wdXNoKGRhdGFbal0pO1xuICAgICAgICAgIC0taztcbiAgICAgICAgfVxuICAgICAgICBpKys7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBhcnJheTtcbiAgICB9XG5cbiAgICAvLyBBZGRzIGEgbmV3IGdyb3VwIHRvIHRoaXMgZGltZW5zaW9uLCB1c2luZyB0aGUgc3BlY2lmaWVkIGtleSBmdW5jdGlvbi5cbiAgICBmdW5jdGlvbiBncm91cChrZXkpIHtcbiAgICAgIHZhciBncm91cCA9IHtcbiAgICAgICAgdG9wOiB0b3AsXG4gICAgICAgIGFsbDogYWxsLFxuICAgICAgICByZWR1Y2U6IHJlZHVjZSxcbiAgICAgICAgcmVkdWNlQ291bnQ6IHJlZHVjZUNvdW50LFxuICAgICAgICByZWR1Y2VTdW06IHJlZHVjZVN1bSxcbiAgICAgICAgb3JkZXI6IG9yZGVyLFxuICAgICAgICBvcmRlck5hdHVyYWw6IG9yZGVyTmF0dXJhbCxcbiAgICAgICAgc2l6ZTogc2l6ZSxcbiAgICAgICAgZGlzcG9zZTogZGlzcG9zZSxcbiAgICAgICAgcmVtb3ZlOiBkaXNwb3NlIC8vIGZvciBiYWNrd2FyZHMtY29tcGF0aWJpbGl0eVxuICAgICAgfTtcblxuICAgICAgLy8gRW5zdXJlIHRoYXQgdGhpcyBncm91cCB3aWxsIGJlIHJlbW92ZWQgd2hlbiB0aGUgZGltZW5zaW9uIGlzIHJlbW92ZWQuXG4gICAgICBkaW1lbnNpb25Hcm91cHMucHVzaChncm91cCk7XG5cbiAgICAgIHZhciBncm91cHMsIC8vIGFycmF5IG9mIHtrZXksIHZhbHVlfVxuICAgICAgICAgIGdyb3VwSW5kZXgsIC8vIG9iamVjdCBpZCDihqYgZ3JvdXAgaWRcbiAgICAgICAgICBncm91cFdpZHRoID0gOCxcbiAgICAgICAgICBncm91cENhcGFjaXR5ID0gY3Jvc3NmaWx0ZXJfY2FwYWNpdHkoZ3JvdXBXaWR0aCksXG4gICAgICAgICAgayA9IDAsIC8vIGNhcmRpbmFsaXR5XG4gICAgICAgICAgc2VsZWN0LFxuICAgICAgICAgIGhlYXAsXG4gICAgICAgICAgcmVkdWNlQWRkLFxuICAgICAgICAgIHJlZHVjZVJlbW92ZSxcbiAgICAgICAgICByZWR1Y2VJbml0aWFsLFxuICAgICAgICAgIHVwZGF0ZSA9IGNyb3NzZmlsdGVyX251bGwsXG4gICAgICAgICAgcmVzZXQgPSBjcm9zc2ZpbHRlcl9udWxsLFxuICAgICAgICAgIHJlc2V0TmVlZGVkID0gdHJ1ZSxcbiAgICAgICAgICBncm91cEFsbCA9IGtleSA9PT0gY3Jvc3NmaWx0ZXJfbnVsbDtcblxuICAgICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPCAxKSBrZXkgPSBjcm9zc2ZpbHRlcl9pZGVudGl0eTtcblxuICAgICAgLy8gVGhlIGdyb3VwIGxpc3RlbnMgdG8gdGhlIGNyb3NzZmlsdGVyIGZvciB3aGVuIGFueSBkaW1lbnNpb24gY2hhbmdlcywgc29cbiAgICAgIC8vIHRoYXQgaXQgY2FuIHVwZGF0ZSB0aGUgYXNzb2NpYXRlZCByZWR1Y2UgdmFsdWVzLiBJdCBtdXN0IGFsc28gbGlzdGVuIHRvXG4gICAgICAvLyB0aGUgcGFyZW50IGRpbWVuc2lvbiBmb3Igd2hlbiBkYXRhIGlzIGFkZGVkLCBhbmQgY29tcHV0ZSBuZXcga2V5cy5cbiAgICAgIGZpbHRlckxpc3RlbmVycy5wdXNoKHVwZGF0ZSk7XG4gICAgICBpbmRleExpc3RlbmVycy5wdXNoKGFkZCk7XG4gICAgICByZW1vdmVEYXRhTGlzdGVuZXJzLnB1c2gocmVtb3ZlRGF0YSk7XG5cbiAgICAgIC8vIEluY29ycG9yYXRlIGFueSBleGlzdGluZyBkYXRhIGludG8gdGhlIGdyb3VwaW5nLlxuICAgICAgYWRkKHZhbHVlcywgaW5kZXgsIDAsIG4pO1xuXG4gICAgICAvLyBJbmNvcnBvcmF0ZXMgdGhlIHNwZWNpZmllZCBuZXcgdmFsdWVzIGludG8gdGhpcyBncm91cC5cbiAgICAgIC8vIFRoaXMgZnVuY3Rpb24gaXMgcmVzcG9uc2libGUgZm9yIHVwZGF0aW5nIGdyb3VwcyBhbmQgZ3JvdXBJbmRleC5cbiAgICAgIGZ1bmN0aW9uIGFkZChuZXdWYWx1ZXMsIG5ld0luZGV4LCBuMCwgbjEpIHtcbiAgICAgICAgdmFyIG9sZEdyb3VwcyA9IGdyb3VwcyxcbiAgICAgICAgICAgIHJlSW5kZXggPSBjcm9zc2ZpbHRlcl9pbmRleChrLCBncm91cENhcGFjaXR5KSxcbiAgICAgICAgICAgIGFkZCA9IHJlZHVjZUFkZCxcbiAgICAgICAgICAgIGluaXRpYWwgPSByZWR1Y2VJbml0aWFsLFxuICAgICAgICAgICAgazAgPSBrLCAvLyBvbGQgY2FyZGluYWxpdHlcbiAgICAgICAgICAgIGkwID0gMCwgLy8gaW5kZXggb2Ygb2xkIGdyb3VwXG4gICAgICAgICAgICBpMSA9IDAsIC8vIGluZGV4IG9mIG5ldyByZWNvcmRcbiAgICAgICAgICAgIGosIC8vIG9iamVjdCBpZFxuICAgICAgICAgICAgZzAsIC8vIG9sZCBncm91cFxuICAgICAgICAgICAgeDAsIC8vIG9sZCBrZXlcbiAgICAgICAgICAgIHgxLCAvLyBuZXcga2V5XG4gICAgICAgICAgICBnLCAvLyBncm91cCB0byBhZGRcbiAgICAgICAgICAgIHg7IC8vIGtleSBvZiBncm91cCB0byBhZGRcblxuICAgICAgICAvLyBJZiBhIHJlc2V0IGlzIG5lZWRlZCwgd2UgZG9uJ3QgbmVlZCB0byB1cGRhdGUgdGhlIHJlZHVjZSB2YWx1ZXMuXG4gICAgICAgIGlmIChyZXNldE5lZWRlZCkgYWRkID0gaW5pdGlhbCA9IGNyb3NzZmlsdGVyX251bGw7XG5cbiAgICAgICAgLy8gUmVzZXQgdGhlIG5ldyBncm91cHMgKGsgaXMgYSBsb3dlciBib3VuZCkuXG4gICAgICAgIC8vIEFsc28sIG1ha2Ugc3VyZSB0aGF0IGdyb3VwSW5kZXggZXhpc3RzIGFuZCBpcyBsb25nIGVub3VnaC5cbiAgICAgICAgZ3JvdXBzID0gbmV3IEFycmF5KGspLCBrID0gMDtcbiAgICAgICAgZ3JvdXBJbmRleCA9IGswID4gMSA/IGNyb3NzZmlsdGVyX2FycmF5TGVuZ3RoZW4oZ3JvdXBJbmRleCwgbikgOiBjcm9zc2ZpbHRlcl9pbmRleChuLCBncm91cENhcGFjaXR5KTtcblxuICAgICAgICAvLyBHZXQgdGhlIGZpcnN0IG9sZCBrZXkgKHgwIG9mIGcwKSwgaWYgaXQgZXhpc3RzLlxuICAgICAgICBpZiAoazApIHgwID0gKGcwID0gb2xkR3JvdXBzWzBdKS5rZXk7XG5cbiAgICAgICAgLy8gRmluZCB0aGUgZmlyc3QgbmV3IGtleSAoeDEpLCBza2lwcGluZyBOYU4ga2V5cy5cbiAgICAgICAgd2hpbGUgKGkxIDwgbjEgJiYgISgoeDEgPSBrZXkobmV3VmFsdWVzW2kxXSkpID49IHgxKSkgKytpMTtcblxuICAgICAgICAvLyBXaGlsZSBuZXcga2V5cyByZW1haW7igKZcbiAgICAgICAgd2hpbGUgKGkxIDwgbjEpIHtcblxuICAgICAgICAgIC8vIERldGVybWluZSB0aGUgbGVzc2VyIG9mIHRoZSB0d28gY3VycmVudCBrZXlzOyBuZXcgYW5kIG9sZC5cbiAgICAgICAgICAvLyBJZiB0aGVyZSBhcmUgbm8gb2xkIGtleXMgcmVtYWluaW5nLCB0aGVuIGFsd2F5cyBhZGQgdGhlIG5ldyBrZXkuXG4gICAgICAgICAgaWYgKGcwICYmIHgwIDw9IHgxKSB7XG4gICAgICAgICAgICBnID0gZzAsIHggPSB4MDtcblxuICAgICAgICAgICAgLy8gUmVjb3JkIHRoZSBuZXcgaW5kZXggb2YgdGhlIG9sZCBncm91cC5cbiAgICAgICAgICAgIHJlSW5kZXhbaTBdID0gaztcblxuICAgICAgICAgICAgLy8gUmV0cmlldmUgdGhlIG5leHQgb2xkIGtleS5cbiAgICAgICAgICAgIGlmIChnMCA9IG9sZEdyb3Vwc1srK2kwXSkgeDAgPSBnMC5rZXk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGcgPSB7a2V5OiB4MSwgdmFsdWU6IGluaXRpYWwoKX0sIHggPSB4MTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICAvLyBBZGQgdGhlIGxlc3NlciBncm91cC5cbiAgICAgICAgICBncm91cHNba10gPSBnO1xuXG4gICAgICAgICAgLy8gQWRkIGFueSBzZWxlY3RlZCByZWNvcmRzIGJlbG9uZ2luZyB0byB0aGUgYWRkZWQgZ3JvdXAsIHdoaWxlXG4gICAgICAgICAgLy8gYWR2YW5jaW5nIHRoZSBuZXcga2V5IGFuZCBwb3B1bGF0aW5nIHRoZSBhc3NvY2lhdGVkIGdyb3VwIGluZGV4LlxuICAgICAgICAgIHdoaWxlICghKHgxID4geCkpIHtcbiAgICAgICAgICAgIGdyb3VwSW5kZXhbaiA9IG5ld0luZGV4W2kxXSArIG4wXSA9IGs7XG4gICAgICAgICAgICBpZiAoIShmaWx0ZXJzW2pdICYgemVybykpIGcudmFsdWUgPSBhZGQoZy52YWx1ZSwgZGF0YVtqXSk7XG4gICAgICAgICAgICBpZiAoKytpMSA+PSBuMSkgYnJlYWs7XG4gICAgICAgICAgICB4MSA9IGtleShuZXdWYWx1ZXNbaTFdKTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBncm91cEluY3JlbWVudCgpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gQWRkIGFueSByZW1haW5pbmcgb2xkIGdyb3VwcyB0aGF0IHdlcmUgZ3JlYXRlciB0aGFuIGFsbCBuZXcga2V5cy5cbiAgICAgICAgLy8gTm8gaW5jcmVtZW50YWwgcmVkdWNlIGlzIG5lZWRlZDsgdGhlc2UgZ3JvdXBzIGhhdmUgbm8gbmV3IHJlY29yZHMuXG4gICAgICAgIC8vIEFsc28gcmVjb3JkIHRoZSBuZXcgaW5kZXggb2YgdGhlIG9sZCBncm91cC5cbiAgICAgICAgd2hpbGUgKGkwIDwgazApIHtcbiAgICAgICAgICBncm91cHNbcmVJbmRleFtpMF0gPSBrXSA9IG9sZEdyb3Vwc1tpMCsrXTtcbiAgICAgICAgICBncm91cEluY3JlbWVudCgpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gSWYgd2UgYWRkZWQgYW55IG5ldyBncm91cHMgYmVmb3JlIGFueSBvbGQgZ3JvdXBzLFxuICAgICAgICAvLyB1cGRhdGUgdGhlIGdyb3VwIGluZGV4IG9mIGFsbCB0aGUgb2xkIHJlY29yZHMuXG4gICAgICAgIGlmIChrID4gaTApIGZvciAoaTAgPSAwOyBpMCA8IG4wOyArK2kwKSB7XG4gICAgICAgICAgZ3JvdXBJbmRleFtpMF0gPSByZUluZGV4W2dyb3VwSW5kZXhbaTBdXTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIE1vZGlmeSB0aGUgdXBkYXRlIGFuZCByZXNldCBiZWhhdmlvciBiYXNlZCBvbiB0aGUgY2FyZGluYWxpdHkuXG4gICAgICAgIC8vIElmIHRoZSBjYXJkaW5hbGl0eSBpcyBsZXNzIHRoYW4gb3IgZXF1YWwgdG8gb25lLCB0aGVuIHRoZSBncm91cEluZGV4XG4gICAgICAgIC8vIGlzIG5vdCBuZWVkZWQuIElmIHRoZSBjYXJkaW5hbGl0eSBpcyB6ZXJvLCB0aGVuIHRoZXJlIGFyZSBubyByZWNvcmRzXG4gICAgICAgIC8vIGFuZCB0aGVyZWZvcmUgbm8gZ3JvdXBzIHRvIHVwZGF0ZSBvciByZXNldC4gTm90ZSB0aGF0IHdlIGFsc28gbXVzdFxuICAgICAgICAvLyBjaGFuZ2UgdGhlIHJlZ2lzdGVyZWQgbGlzdGVuZXIgdG8gcG9pbnQgdG8gdGhlIG5ldyBtZXRob2QuXG4gICAgICAgIGogPSBmaWx0ZXJMaXN0ZW5lcnMuaW5kZXhPZih1cGRhdGUpO1xuICAgICAgICBpZiAoayA+IDEpIHtcbiAgICAgICAgICB1cGRhdGUgPSB1cGRhdGVNYW55O1xuICAgICAgICAgIHJlc2V0ID0gcmVzZXRNYW55O1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGlmICghayAmJiBncm91cEFsbCkge1xuICAgICAgICAgICAgayA9IDE7XG4gICAgICAgICAgICBncm91cHMgPSBbe2tleTogbnVsbCwgdmFsdWU6IGluaXRpYWwoKX1dO1xuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAoayA9PT0gMSkge1xuICAgICAgICAgICAgdXBkYXRlID0gdXBkYXRlT25lO1xuICAgICAgICAgICAgcmVzZXQgPSByZXNldE9uZTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdXBkYXRlID0gY3Jvc3NmaWx0ZXJfbnVsbDtcbiAgICAgICAgICAgIHJlc2V0ID0gY3Jvc3NmaWx0ZXJfbnVsbDtcbiAgICAgICAgICB9XG4gICAgICAgICAgZ3JvdXBJbmRleCA9IG51bGw7XG4gICAgICAgIH1cbiAgICAgICAgZmlsdGVyTGlzdGVuZXJzW2pdID0gdXBkYXRlO1xuXG4gICAgICAgIC8vIENvdW50IHRoZSBudW1iZXIgb2YgYWRkZWQgZ3JvdXBzLFxuICAgICAgICAvLyBhbmQgd2lkZW4gdGhlIGdyb3VwIGluZGV4IGFzIG5lZWRlZC5cbiAgICAgICAgZnVuY3Rpb24gZ3JvdXBJbmNyZW1lbnQoKSB7XG4gICAgICAgICAgaWYgKCsrayA9PT0gZ3JvdXBDYXBhY2l0eSkge1xuICAgICAgICAgICAgcmVJbmRleCA9IGNyb3NzZmlsdGVyX2FycmF5V2lkZW4ocmVJbmRleCwgZ3JvdXBXaWR0aCA8PD0gMSk7XG4gICAgICAgICAgICBncm91cEluZGV4ID0gY3Jvc3NmaWx0ZXJfYXJyYXlXaWRlbihncm91cEluZGV4LCBncm91cFdpZHRoKTtcbiAgICAgICAgICAgIGdyb3VwQ2FwYWNpdHkgPSBjcm9zc2ZpbHRlcl9jYXBhY2l0eShncm91cFdpZHRoKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgZnVuY3Rpb24gcmVtb3ZlRGF0YSgpIHtcbiAgICAgICAgaWYgKGsgPiAxKSB7XG4gICAgICAgICAgdmFyIG9sZEsgPSBrLFxuICAgICAgICAgICAgICBvbGRHcm91cHMgPSBncm91cHMsXG4gICAgICAgICAgICAgIHNlZW5Hcm91cHMgPSBjcm9zc2ZpbHRlcl9pbmRleChvbGRLLCBvbGRLKTtcblxuICAgICAgICAgIC8vIEZpbHRlciBvdXQgbm9uLW1hdGNoZXMgYnkgY29weWluZyBtYXRjaGluZyBncm91cCBpbmRleCBlbnRyaWVzIHRvXG4gICAgICAgICAgLy8gdGhlIGJlZ2lubmluZyBvZiB0aGUgYXJyYXkuXG4gICAgICAgICAgZm9yICh2YXIgaSA9IDAsIGogPSAwOyBpIDwgbjsgKytpKSB7XG4gICAgICAgICAgICBpZiAoZmlsdGVyc1tpXSkge1xuICAgICAgICAgICAgICBzZWVuR3JvdXBzW2dyb3VwSW5kZXhbal0gPSBncm91cEluZGV4W2ldXSA9IDE7XG4gICAgICAgICAgICAgICsrajtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG5cbiAgICAgICAgICAvLyBSZWFzc2VtYmxlIGdyb3VwcyBpbmNsdWRpbmcgb25seSB0aG9zZSBncm91cHMgdGhhdCB3ZXJlIHJlZmVycmVkXG4gICAgICAgICAgLy8gdG8gYnkgbWF0Y2hpbmcgZ3JvdXAgaW5kZXggZW50cmllcy4gIE5vdGUgdGhlIG5ldyBncm91cCBpbmRleCBpblxuICAgICAgICAgIC8vIHNlZW5Hcm91cHMuXG4gICAgICAgICAgZ3JvdXBzID0gW10sIGsgPSAwO1xuICAgICAgICAgIGZvciAoaSA9IDA7IGkgPCBvbGRLOyArK2kpIHtcbiAgICAgICAgICAgIGlmIChzZWVuR3JvdXBzW2ldKSB7XG4gICAgICAgICAgICAgIHNlZW5Hcm91cHNbaV0gPSBrKys7XG4gICAgICAgICAgICAgIGdyb3Vwcy5wdXNoKG9sZEdyb3Vwc1tpXSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgaWYgKGsgPiAxKSB7XG4gICAgICAgICAgICAvLyBSZWluZGV4IHRoZSBncm91cCBpbmRleCB1c2luZyBzZWVuR3JvdXBzIHRvIGZpbmQgdGhlIG5ldyBpbmRleC5cbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgajsgKytpKSBncm91cEluZGV4W2ldID0gc2Vlbkdyb3Vwc1tncm91cEluZGV4W2ldXTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgZ3JvdXBJbmRleCA9IG51bGw7XG4gICAgICAgICAgfVxuICAgICAgICAgIGZpbHRlckxpc3RlbmVyc1tmaWx0ZXJMaXN0ZW5lcnMuaW5kZXhPZih1cGRhdGUpXSA9IGsgPiAxXG4gICAgICAgICAgICAgID8gKHJlc2V0ID0gcmVzZXRNYW55LCB1cGRhdGUgPSB1cGRhdGVNYW55KVxuICAgICAgICAgICAgICA6IGsgPT09IDEgPyAocmVzZXQgPSByZXNldE9uZSwgdXBkYXRlID0gdXBkYXRlT25lKVxuICAgICAgICAgICAgICA6IHJlc2V0ID0gdXBkYXRlID0gY3Jvc3NmaWx0ZXJfbnVsbDtcbiAgICAgICAgfSBlbHNlIGlmIChrID09PSAxKSB7XG4gICAgICAgICAgaWYgKGdyb3VwQWxsKSByZXR1cm47XG4gICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBuOyArK2kpIGlmIChmaWx0ZXJzW2ldKSByZXR1cm47XG4gICAgICAgICAgZ3JvdXBzID0gW10sIGsgPSAwO1xuICAgICAgICAgIGZpbHRlckxpc3RlbmVyc1tmaWx0ZXJMaXN0ZW5lcnMuaW5kZXhPZih1cGRhdGUpXSA9XG4gICAgICAgICAgdXBkYXRlID0gcmVzZXQgPSBjcm9zc2ZpbHRlcl9udWxsO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIC8vIFJlZHVjZXMgdGhlIHNwZWNpZmllZCBzZWxlY3RlZCBvciBkZXNlbGVjdGVkIHJlY29yZHMuXG4gICAgICAvLyBUaGlzIGZ1bmN0aW9uIGlzIG9ubHkgdXNlZCB3aGVuIHRoZSBjYXJkaW5hbGl0eSBpcyBncmVhdGVyIHRoYW4gMS5cbiAgICAgIGZ1bmN0aW9uIHVwZGF0ZU1hbnkoZmlsdGVyT25lLCBhZGRlZCwgcmVtb3ZlZCkge1xuICAgICAgICBpZiAoZmlsdGVyT25lID09PSBvbmUgfHwgcmVzZXROZWVkZWQpIHJldHVybjtcblxuICAgICAgICB2YXIgaSxcbiAgICAgICAgICAgIGssXG4gICAgICAgICAgICBuLFxuICAgICAgICAgICAgZztcblxuICAgICAgICAvLyBBZGQgdGhlIGFkZGVkIHZhbHVlcy5cbiAgICAgICAgZm9yIChpID0gMCwgbiA9IGFkZGVkLmxlbmd0aDsgaSA8IG47ICsraSkge1xuICAgICAgICAgIGlmICghKGZpbHRlcnNbayA9IGFkZGVkW2ldXSAmIHplcm8pKSB7XG4gICAgICAgICAgICBnID0gZ3JvdXBzW2dyb3VwSW5kZXhba11dO1xuICAgICAgICAgICAgZy52YWx1ZSA9IHJlZHVjZUFkZChnLnZhbHVlLCBkYXRhW2tdKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICAvLyBSZW1vdmUgdGhlIHJlbW92ZWQgdmFsdWVzLlxuICAgICAgICBmb3IgKGkgPSAwLCBuID0gcmVtb3ZlZC5sZW5ndGg7IGkgPCBuOyArK2kpIHtcbiAgICAgICAgICBpZiAoKGZpbHRlcnNbayA9IHJlbW92ZWRbaV1dICYgemVybykgPT09IGZpbHRlck9uZSkge1xuICAgICAgICAgICAgZyA9IGdyb3Vwc1tncm91cEluZGV4W2tdXTtcbiAgICAgICAgICAgIGcudmFsdWUgPSByZWR1Y2VSZW1vdmUoZy52YWx1ZSwgZGF0YVtrXSk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIC8vIFJlZHVjZXMgdGhlIHNwZWNpZmllZCBzZWxlY3RlZCBvciBkZXNlbGVjdGVkIHJlY29yZHMuXG4gICAgICAvLyBUaGlzIGZ1bmN0aW9uIGlzIG9ubHkgdXNlZCB3aGVuIHRoZSBjYXJkaW5hbGl0eSBpcyAxLlxuICAgICAgZnVuY3Rpb24gdXBkYXRlT25lKGZpbHRlck9uZSwgYWRkZWQsIHJlbW92ZWQpIHtcbiAgICAgICAgaWYgKGZpbHRlck9uZSA9PT0gb25lIHx8IHJlc2V0TmVlZGVkKSByZXR1cm47XG5cbiAgICAgICAgdmFyIGksXG4gICAgICAgICAgICBrLFxuICAgICAgICAgICAgbixcbiAgICAgICAgICAgIGcgPSBncm91cHNbMF07XG5cbiAgICAgICAgLy8gQWRkIHRoZSBhZGRlZCB2YWx1ZXMuXG4gICAgICAgIGZvciAoaSA9IDAsIG4gPSBhZGRlZC5sZW5ndGg7IGkgPCBuOyArK2kpIHtcbiAgICAgICAgICBpZiAoIShmaWx0ZXJzW2sgPSBhZGRlZFtpXV0gJiB6ZXJvKSkge1xuICAgICAgICAgICAgZy52YWx1ZSA9IHJlZHVjZUFkZChnLnZhbHVlLCBkYXRhW2tdKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICAvLyBSZW1vdmUgdGhlIHJlbW92ZWQgdmFsdWVzLlxuICAgICAgICBmb3IgKGkgPSAwLCBuID0gcmVtb3ZlZC5sZW5ndGg7IGkgPCBuOyArK2kpIHtcbiAgICAgICAgICBpZiAoKGZpbHRlcnNbayA9IHJlbW92ZWRbaV1dICYgemVybykgPT09IGZpbHRlck9uZSkge1xuICAgICAgICAgICAgZy52YWx1ZSA9IHJlZHVjZVJlbW92ZShnLnZhbHVlLCBkYXRhW2tdKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgLy8gUmVjb21wdXRlcyB0aGUgZ3JvdXAgcmVkdWNlIHZhbHVlcyBmcm9tIHNjcmF0Y2guXG4gICAgICAvLyBUaGlzIGZ1bmN0aW9uIGlzIG9ubHkgdXNlZCB3aGVuIHRoZSBjYXJkaW5hbGl0eSBpcyBncmVhdGVyIHRoYW4gMS5cbiAgICAgIGZ1bmN0aW9uIHJlc2V0TWFueSgpIHtcbiAgICAgICAgdmFyIGksXG4gICAgICAgICAgICBnO1xuXG4gICAgICAgIC8vIFJlc2V0IGFsbCBncm91cCB2YWx1ZXMuXG4gICAgICAgIGZvciAoaSA9IDA7IGkgPCBrOyArK2kpIHtcbiAgICAgICAgICBncm91cHNbaV0udmFsdWUgPSByZWR1Y2VJbml0aWFsKCk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBBZGQgYW55IHNlbGVjdGVkIHJlY29yZHMuXG4gICAgICAgIGZvciAoaSA9IDA7IGkgPCBuOyArK2kpIHtcbiAgICAgICAgICBpZiAoIShmaWx0ZXJzW2ldICYgemVybykpIHtcbiAgICAgICAgICAgIGcgPSBncm91cHNbZ3JvdXBJbmRleFtpXV07XG4gICAgICAgICAgICBnLnZhbHVlID0gcmVkdWNlQWRkKGcudmFsdWUsIGRhdGFbaV0pO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICAvLyBSZWNvbXB1dGVzIHRoZSBncm91cCByZWR1Y2UgdmFsdWVzIGZyb20gc2NyYXRjaC5cbiAgICAgIC8vIFRoaXMgZnVuY3Rpb24gaXMgb25seSB1c2VkIHdoZW4gdGhlIGNhcmRpbmFsaXR5IGlzIDEuXG4gICAgICBmdW5jdGlvbiByZXNldE9uZSgpIHtcbiAgICAgICAgdmFyIGksXG4gICAgICAgICAgICBnID0gZ3JvdXBzWzBdO1xuXG4gICAgICAgIC8vIFJlc2V0IHRoZSBzaW5nbGV0b24gZ3JvdXAgdmFsdWVzLlxuICAgICAgICBnLnZhbHVlID0gcmVkdWNlSW5pdGlhbCgpO1xuXG4gICAgICAgIC8vIEFkZCBhbnkgc2VsZWN0ZWQgcmVjb3Jkcy5cbiAgICAgICAgZm9yIChpID0gMDsgaSA8IG47ICsraSkge1xuICAgICAgICAgIGlmICghKGZpbHRlcnNbaV0gJiB6ZXJvKSkge1xuICAgICAgICAgICAgZy52YWx1ZSA9IHJlZHVjZUFkZChnLnZhbHVlLCBkYXRhW2ldKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgLy8gUmV0dXJucyB0aGUgYXJyYXkgb2YgZ3JvdXAgdmFsdWVzLCBpbiB0aGUgZGltZW5zaW9uJ3MgbmF0dXJhbCBvcmRlci5cbiAgICAgIGZ1bmN0aW9uIGFsbCgpIHtcbiAgICAgICAgaWYgKHJlc2V0TmVlZGVkKSByZXNldCgpLCByZXNldE5lZWRlZCA9IGZhbHNlO1xuICAgICAgICByZXR1cm4gZ3JvdXBzO1xuICAgICAgfVxuXG4gICAgICAvLyBSZXR1cm5zIGEgbmV3IGFycmF5IGNvbnRhaW5pbmcgdGhlIHRvcCBLIGdyb3VwIHZhbHVlcywgaW4gcmVkdWNlIG9yZGVyLlxuICAgICAgZnVuY3Rpb24gdG9wKGspIHtcbiAgICAgICAgdmFyIHRvcCA9IHNlbGVjdChhbGwoKSwgMCwgZ3JvdXBzLmxlbmd0aCwgayk7XG4gICAgICAgIHJldHVybiBoZWFwLnNvcnQodG9wLCAwLCB0b3AubGVuZ3RoKTtcbiAgICAgIH1cblxuICAgICAgLy8gU2V0cyB0aGUgcmVkdWNlIGJlaGF2aW9yIGZvciB0aGlzIGdyb3VwIHRvIHVzZSB0aGUgc3BlY2lmaWVkIGZ1bmN0aW9ucy5cbiAgICAgIC8vIFRoaXMgbWV0aG9kIGxhemlseSByZWNvbXB1dGVzIHRoZSByZWR1Y2UgdmFsdWVzLCB3YWl0aW5nIHVudGlsIG5lZWRlZC5cbiAgICAgIGZ1bmN0aW9uIHJlZHVjZShhZGQsIHJlbW92ZSwgaW5pdGlhbCkge1xuICAgICAgICByZWR1Y2VBZGQgPSBhZGQ7XG4gICAgICAgIHJlZHVjZVJlbW92ZSA9IHJlbW92ZTtcbiAgICAgICAgcmVkdWNlSW5pdGlhbCA9IGluaXRpYWw7XG4gICAgICAgIHJlc2V0TmVlZGVkID0gdHJ1ZTtcbiAgICAgICAgcmV0dXJuIGdyb3VwO1xuICAgICAgfVxuXG4gICAgICAvLyBBIGNvbnZlbmllbmNlIG1ldGhvZCBmb3IgcmVkdWNpbmcgYnkgY291bnQuXG4gICAgICBmdW5jdGlvbiByZWR1Y2VDb3VudCgpIHtcbiAgICAgICAgcmV0dXJuIHJlZHVjZShjcm9zc2ZpbHRlcl9yZWR1Y2VJbmNyZW1lbnQsIGNyb3NzZmlsdGVyX3JlZHVjZURlY3JlbWVudCwgY3Jvc3NmaWx0ZXJfemVybyk7XG4gICAgICB9XG5cbiAgICAgIC8vIEEgY29udmVuaWVuY2UgbWV0aG9kIGZvciByZWR1Y2luZyBieSBzdW0odmFsdWUpLlxuICAgICAgZnVuY3Rpb24gcmVkdWNlU3VtKHZhbHVlKSB7XG4gICAgICAgIHJldHVybiByZWR1Y2UoY3Jvc3NmaWx0ZXJfcmVkdWNlQWRkKHZhbHVlKSwgY3Jvc3NmaWx0ZXJfcmVkdWNlU3VidHJhY3QodmFsdWUpLCBjcm9zc2ZpbHRlcl96ZXJvKTtcbiAgICAgIH1cblxuICAgICAgLy8gU2V0cyB0aGUgcmVkdWNlIG9yZGVyLCB1c2luZyB0aGUgc3BlY2lmaWVkIGFjY2Vzc29yLlxuICAgICAgZnVuY3Rpb24gb3JkZXIodmFsdWUpIHtcbiAgICAgICAgc2VsZWN0ID0gaGVhcHNlbGVjdF9ieSh2YWx1ZU9mKTtcbiAgICAgICAgaGVhcCA9IGhlYXBfYnkodmFsdWVPZik7XG4gICAgICAgIGZ1bmN0aW9uIHZhbHVlT2YoZCkgeyByZXR1cm4gdmFsdWUoZC52YWx1ZSk7IH1cbiAgICAgICAgcmV0dXJuIGdyb3VwO1xuICAgICAgfVxuXG4gICAgICAvLyBBIGNvbnZlbmllbmNlIG1ldGhvZCBmb3IgbmF0dXJhbCBvcmRlcmluZyBieSByZWR1Y2UgdmFsdWUuXG4gICAgICBmdW5jdGlvbiBvcmRlck5hdHVyYWwoKSB7XG4gICAgICAgIHJldHVybiBvcmRlcihjcm9zc2ZpbHRlcl9pZGVudGl0eSk7XG4gICAgICB9XG5cbiAgICAgIC8vIFJldHVybnMgdGhlIGNhcmRpbmFsaXR5IG9mIHRoaXMgZ3JvdXAsIGlycmVzcGVjdGl2ZSBvZiBhbnkgZmlsdGVycy5cbiAgICAgIGZ1bmN0aW9uIHNpemUoKSB7XG4gICAgICAgIHJldHVybiBrO1xuICAgICAgfVxuXG4gICAgICAvLyBSZW1vdmVzIHRoaXMgZ3JvdXAgYW5kIGFzc29jaWF0ZWQgZXZlbnQgbGlzdGVuZXJzLlxuICAgICAgZnVuY3Rpb24gZGlzcG9zZSgpIHtcbiAgICAgICAgdmFyIGkgPSBmaWx0ZXJMaXN0ZW5lcnMuaW5kZXhPZih1cGRhdGUpO1xuICAgICAgICBpZiAoaSA+PSAwKSBmaWx0ZXJMaXN0ZW5lcnMuc3BsaWNlKGksIDEpO1xuICAgICAgICBpID0gaW5kZXhMaXN0ZW5lcnMuaW5kZXhPZihhZGQpO1xuICAgICAgICBpZiAoaSA+PSAwKSBpbmRleExpc3RlbmVycy5zcGxpY2UoaSwgMSk7XG4gICAgICAgIGkgPSByZW1vdmVEYXRhTGlzdGVuZXJzLmluZGV4T2YocmVtb3ZlRGF0YSk7XG4gICAgICAgIGlmIChpID49IDApIHJlbW92ZURhdGFMaXN0ZW5lcnMuc3BsaWNlKGksIDEpO1xuICAgICAgICByZXR1cm4gZ3JvdXA7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiByZWR1Y2VDb3VudCgpLm9yZGVyTmF0dXJhbCgpO1xuICAgIH1cblxuICAgIC8vIEEgY29udmVuaWVuY2UgZnVuY3Rpb24gZm9yIGdlbmVyYXRpbmcgYSBzaW5nbGV0b24gZ3JvdXAuXG4gICAgZnVuY3Rpb24gZ3JvdXBBbGwoKSB7XG4gICAgICB2YXIgZyA9IGdyb3VwKGNyb3NzZmlsdGVyX251bGwpLCBhbGwgPSBnLmFsbDtcbiAgICAgIGRlbGV0ZSBnLmFsbDtcbiAgICAgIGRlbGV0ZSBnLnRvcDtcbiAgICAgIGRlbGV0ZSBnLm9yZGVyO1xuICAgICAgZGVsZXRlIGcub3JkZXJOYXR1cmFsO1xuICAgICAgZGVsZXRlIGcuc2l6ZTtcbiAgICAgIGcudmFsdWUgPSBmdW5jdGlvbigpIHsgcmV0dXJuIGFsbCgpWzBdLnZhbHVlOyB9O1xuICAgICAgcmV0dXJuIGc7XG4gICAgfVxuXG4gICAgLy8gUmVtb3ZlcyB0aGlzIGRpbWVuc2lvbiBhbmQgYXNzb2NpYXRlZCBncm91cHMgYW5kIGV2ZW50IGxpc3RlbmVycy5cbiAgICBmdW5jdGlvbiBkaXNwb3NlKCkge1xuICAgICAgZGltZW5zaW9uR3JvdXBzLmZvckVhY2goZnVuY3Rpb24oZ3JvdXApIHsgZ3JvdXAuZGlzcG9zZSgpOyB9KTtcbiAgICAgIHZhciBpID0gZGF0YUxpc3RlbmVycy5pbmRleE9mKHByZUFkZCk7XG4gICAgICBpZiAoaSA+PSAwKSBkYXRhTGlzdGVuZXJzLnNwbGljZShpLCAxKTtcbiAgICAgIGkgPSBkYXRhTGlzdGVuZXJzLmluZGV4T2YocG9zdEFkZCk7XG4gICAgICBpZiAoaSA+PSAwKSBkYXRhTGlzdGVuZXJzLnNwbGljZShpLCAxKTtcbiAgICAgIGkgPSByZW1vdmVEYXRhTGlzdGVuZXJzLmluZGV4T2YocmVtb3ZlRGF0YSk7XG4gICAgICBpZiAoaSA+PSAwKSByZW1vdmVEYXRhTGlzdGVuZXJzLnNwbGljZShpLCAxKTtcbiAgICAgIG0gJj0gemVybztcbiAgICAgIHJldHVybiBmaWx0ZXJBbGwoKTtcbiAgICB9XG5cbiAgICByZXR1cm4gZGltZW5zaW9uO1xuICB9XG5cbiAgLy8gQSBjb252ZW5pZW5jZSBtZXRob2QgZm9yIGdyb3VwQWxsIG9uIGEgZHVtbXkgZGltZW5zaW9uLlxuICAvLyBUaGlzIGltcGxlbWVudGF0aW9uIGNhbiBiZSBvcHRpbWl6ZWQgc2luY2UgaXQgYWx3YXlzIGhhcyBjYXJkaW5hbGl0eSAxLlxuICBmdW5jdGlvbiBncm91cEFsbCgpIHtcbiAgICB2YXIgZ3JvdXAgPSB7XG4gICAgICByZWR1Y2U6IHJlZHVjZSxcbiAgICAgIHJlZHVjZUNvdW50OiByZWR1Y2VDb3VudCxcbiAgICAgIHJlZHVjZVN1bTogcmVkdWNlU3VtLFxuICAgICAgdmFsdWU6IHZhbHVlLFxuICAgICAgZGlzcG9zZTogZGlzcG9zZSxcbiAgICAgIHJlbW92ZTogZGlzcG9zZSAvLyBmb3IgYmFja3dhcmRzLWNvbXBhdGliaWxpdHlcbiAgICB9O1xuXG4gICAgdmFyIHJlZHVjZVZhbHVlLFxuICAgICAgICByZWR1Y2VBZGQsXG4gICAgICAgIHJlZHVjZVJlbW92ZSxcbiAgICAgICAgcmVkdWNlSW5pdGlhbCxcbiAgICAgICAgcmVzZXROZWVkZWQgPSB0cnVlO1xuXG4gICAgLy8gVGhlIGdyb3VwIGxpc3RlbnMgdG8gdGhlIGNyb3NzZmlsdGVyIGZvciB3aGVuIGFueSBkaW1lbnNpb24gY2hhbmdlcywgc29cbiAgICAvLyB0aGF0IGl0IGNhbiB1cGRhdGUgdGhlIHJlZHVjZSB2YWx1ZS4gSXQgbXVzdCBhbHNvIGxpc3RlbiB0byB0aGUgcGFyZW50XG4gICAgLy8gZGltZW5zaW9uIGZvciB3aGVuIGRhdGEgaXMgYWRkZWQuXG4gICAgZmlsdGVyTGlzdGVuZXJzLnB1c2godXBkYXRlKTtcbiAgICBkYXRhTGlzdGVuZXJzLnB1c2goYWRkKTtcblxuICAgIC8vIEZvciBjb25zaXN0ZW5jeTsgYWN0dWFsbHkgYSBuby1vcCBzaW5jZSByZXNldE5lZWRlZCBpcyB0cnVlLlxuICAgIGFkZChkYXRhLCAwLCBuKTtcblxuICAgIC8vIEluY29ycG9yYXRlcyB0aGUgc3BlY2lmaWVkIG5ldyB2YWx1ZXMgaW50byB0aGlzIGdyb3VwLlxuICAgIGZ1bmN0aW9uIGFkZChuZXdEYXRhLCBuMCkge1xuICAgICAgdmFyIGk7XG5cbiAgICAgIGlmIChyZXNldE5lZWRlZCkgcmV0dXJuO1xuXG4gICAgICAvLyBBZGQgdGhlIGFkZGVkIHZhbHVlcy5cbiAgICAgIGZvciAoaSA9IG4wOyBpIDwgbjsgKytpKSB7XG4gICAgICAgIGlmICghZmlsdGVyc1tpXSkge1xuICAgICAgICAgIHJlZHVjZVZhbHVlID0gcmVkdWNlQWRkKHJlZHVjZVZhbHVlLCBkYXRhW2ldKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIC8vIFJlZHVjZXMgdGhlIHNwZWNpZmllZCBzZWxlY3RlZCBvciBkZXNlbGVjdGVkIHJlY29yZHMuXG4gICAgZnVuY3Rpb24gdXBkYXRlKGZpbHRlck9uZSwgYWRkZWQsIHJlbW92ZWQpIHtcbiAgICAgIHZhciBpLFxuICAgICAgICAgIGssXG4gICAgICAgICAgbjtcblxuICAgICAgaWYgKHJlc2V0TmVlZGVkKSByZXR1cm47XG5cbiAgICAgIC8vIEFkZCB0aGUgYWRkZWQgdmFsdWVzLlxuICAgICAgZm9yIChpID0gMCwgbiA9IGFkZGVkLmxlbmd0aDsgaSA8IG47ICsraSkge1xuICAgICAgICBpZiAoIWZpbHRlcnNbayA9IGFkZGVkW2ldXSkge1xuICAgICAgICAgIHJlZHVjZVZhbHVlID0gcmVkdWNlQWRkKHJlZHVjZVZhbHVlLCBkYXRhW2tdKTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICAvLyBSZW1vdmUgdGhlIHJlbW92ZWQgdmFsdWVzLlxuICAgICAgZm9yIChpID0gMCwgbiA9IHJlbW92ZWQubGVuZ3RoOyBpIDwgbjsgKytpKSB7XG4gICAgICAgIGlmIChmaWx0ZXJzW2sgPSByZW1vdmVkW2ldXSA9PT0gZmlsdGVyT25lKSB7XG4gICAgICAgICAgcmVkdWNlVmFsdWUgPSByZWR1Y2VSZW1vdmUocmVkdWNlVmFsdWUsIGRhdGFba10pO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gUmVjb21wdXRlcyB0aGUgZ3JvdXAgcmVkdWNlIHZhbHVlIGZyb20gc2NyYXRjaC5cbiAgICBmdW5jdGlvbiByZXNldCgpIHtcbiAgICAgIHZhciBpO1xuXG4gICAgICByZWR1Y2VWYWx1ZSA9IHJlZHVjZUluaXRpYWwoKTtcblxuICAgICAgZm9yIChpID0gMDsgaSA8IG47ICsraSkge1xuICAgICAgICBpZiAoIWZpbHRlcnNbaV0pIHtcbiAgICAgICAgICByZWR1Y2VWYWx1ZSA9IHJlZHVjZUFkZChyZWR1Y2VWYWx1ZSwgZGF0YVtpXSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBTZXRzIHRoZSByZWR1Y2UgYmVoYXZpb3IgZm9yIHRoaXMgZ3JvdXAgdG8gdXNlIHRoZSBzcGVjaWZpZWQgZnVuY3Rpb25zLlxuICAgIC8vIFRoaXMgbWV0aG9kIGxhemlseSByZWNvbXB1dGVzIHRoZSByZWR1Y2UgdmFsdWUsIHdhaXRpbmcgdW50aWwgbmVlZGVkLlxuICAgIGZ1bmN0aW9uIHJlZHVjZShhZGQsIHJlbW92ZSwgaW5pdGlhbCkge1xuICAgICAgcmVkdWNlQWRkID0gYWRkO1xuICAgICAgcmVkdWNlUmVtb3ZlID0gcmVtb3ZlO1xuICAgICAgcmVkdWNlSW5pdGlhbCA9IGluaXRpYWw7XG4gICAgICByZXNldE5lZWRlZCA9IHRydWU7XG4gICAgICByZXR1cm4gZ3JvdXA7XG4gICAgfVxuXG4gICAgLy8gQSBjb252ZW5pZW5jZSBtZXRob2QgZm9yIHJlZHVjaW5nIGJ5IGNvdW50LlxuICAgIGZ1bmN0aW9uIHJlZHVjZUNvdW50KCkge1xuICAgICAgcmV0dXJuIHJlZHVjZShjcm9zc2ZpbHRlcl9yZWR1Y2VJbmNyZW1lbnQsIGNyb3NzZmlsdGVyX3JlZHVjZURlY3JlbWVudCwgY3Jvc3NmaWx0ZXJfemVybyk7XG4gICAgfVxuXG4gICAgLy8gQSBjb252ZW5pZW5jZSBtZXRob2QgZm9yIHJlZHVjaW5nIGJ5IHN1bSh2YWx1ZSkuXG4gICAgZnVuY3Rpb24gcmVkdWNlU3VtKHZhbHVlKSB7XG4gICAgICByZXR1cm4gcmVkdWNlKGNyb3NzZmlsdGVyX3JlZHVjZUFkZCh2YWx1ZSksIGNyb3NzZmlsdGVyX3JlZHVjZVN1YnRyYWN0KHZhbHVlKSwgY3Jvc3NmaWx0ZXJfemVybyk7XG4gICAgfVxuXG4gICAgLy8gUmV0dXJucyB0aGUgY29tcHV0ZWQgcmVkdWNlIHZhbHVlLlxuICAgIGZ1bmN0aW9uIHZhbHVlKCkge1xuICAgICAgaWYgKHJlc2V0TmVlZGVkKSByZXNldCgpLCByZXNldE5lZWRlZCA9IGZhbHNlO1xuICAgICAgcmV0dXJuIHJlZHVjZVZhbHVlO1xuICAgIH1cblxuICAgIC8vIFJlbW92ZXMgdGhpcyBncm91cCBhbmQgYXNzb2NpYXRlZCBldmVudCBsaXN0ZW5lcnMuXG4gICAgZnVuY3Rpb24gZGlzcG9zZSgpIHtcbiAgICAgIHZhciBpID0gZmlsdGVyTGlzdGVuZXJzLmluZGV4T2YodXBkYXRlKTtcbiAgICAgIGlmIChpID49IDApIGZpbHRlckxpc3RlbmVycy5zcGxpY2UoaSk7XG4gICAgICBpID0gZGF0YUxpc3RlbmVycy5pbmRleE9mKGFkZCk7XG4gICAgICBpZiAoaSA+PSAwKSBkYXRhTGlzdGVuZXJzLnNwbGljZShpKTtcbiAgICAgIHJldHVybiBncm91cDtcbiAgICB9XG5cbiAgICByZXR1cm4gcmVkdWNlQ291bnQoKTtcbiAgfVxuXG4gIC8vIFJldHVybnMgdGhlIG51bWJlciBvZiByZWNvcmRzIGluIHRoaXMgY3Jvc3NmaWx0ZXIsIGlycmVzcGVjdGl2ZSBvZiBhbnkgZmlsdGVycy5cbiAgZnVuY3Rpb24gc2l6ZSgpIHtcbiAgICByZXR1cm4gbjtcbiAgfVxuXG4gIHJldHVybiBhcmd1bWVudHMubGVuZ3RoXG4gICAgICA/IGFkZChhcmd1bWVudHNbMF0pXG4gICAgICA6IGNyb3NzZmlsdGVyO1xufVxuXG4vLyBSZXR1cm5zIGFuIGFycmF5IG9mIHNpemUgbiwgYmlnIGVub3VnaCB0byBzdG9yZSBpZHMgdXAgdG8gbS5cbmZ1bmN0aW9uIGNyb3NzZmlsdGVyX2luZGV4KG4sIG0pIHtcbiAgcmV0dXJuIChtIDwgMHgxMDFcbiAgICAgID8gY3Jvc3NmaWx0ZXJfYXJyYXk4IDogbSA8IDB4MTAwMDFcbiAgICAgID8gY3Jvc3NmaWx0ZXJfYXJyYXkxNlxuICAgICAgOiBjcm9zc2ZpbHRlcl9hcnJheTMyKShuKTtcbn1cblxuLy8gQ29uc3RydWN0cyBhIG5ldyBhcnJheSBvZiBzaXplIG4sIHdpdGggc2VxdWVudGlhbCB2YWx1ZXMgZnJvbSAwIHRvIG4gLSAxLlxuZnVuY3Rpb24gY3Jvc3NmaWx0ZXJfcmFuZ2Uobikge1xuICB2YXIgcmFuZ2UgPSBjcm9zc2ZpbHRlcl9pbmRleChuLCBuKTtcbiAgZm9yICh2YXIgaSA9IC0xOyArK2kgPCBuOykgcmFuZ2VbaV0gPSBpO1xuICByZXR1cm4gcmFuZ2U7XG59XG5cbmZ1bmN0aW9uIGNyb3NzZmlsdGVyX2NhcGFjaXR5KHcpIHtcbiAgcmV0dXJuIHcgPT09IDhcbiAgICAgID8gMHgxMDAgOiB3ID09PSAxNlxuICAgICAgPyAweDEwMDAwXG4gICAgICA6IDB4MTAwMDAwMDAwO1xufVxufSkodHlwZW9mIGV4cG9ydHMgIT09ICd1bmRlZmluZWQnICYmIGV4cG9ydHMgfHwgdGhpcyk7XG4iLCJtb2R1bGUuZXhwb3J0cyA9IHJlcXVpcmUoXCIuL2Nyb3NzZmlsdGVyXCIpLmNyb3NzZmlsdGVyO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgJ19fZXNNb2R1bGUnLCB7IHZhbHVlOiB0cnVlIH0pO1xuXG52YXIgdG9wb2pzb25DbGllbnQgPSByZXF1aXJlKCd0b3BvanNvbi1jbGllbnQnKTtcbnZhciB0b3BvanNvblNlcnZlciA9IHJlcXVpcmUoJ3RvcG9qc29uLXNlcnZlcicpO1xudmFyIHRvcG9qc29uU2ltcGxpZnkgPSByZXF1aXJlKCd0b3BvanNvbi1zaW1wbGlmeScpO1xuXG5cblxuT2JqZWN0LmtleXModG9wb2pzb25DbGllbnQpLmZvckVhY2goZnVuY3Rpb24gKGtleSkgeyBleHBvcnRzW2tleV0gPSB0b3BvanNvbkNsaWVudFtrZXldOyB9KTtcbk9iamVjdC5rZXlzKHRvcG9qc29uU2VydmVyKS5mb3JFYWNoKGZ1bmN0aW9uIChrZXkpIHsgZXhwb3J0c1trZXldID0gdG9wb2pzb25TZXJ2ZXJba2V5XTsgfSk7XG5PYmplY3Qua2V5cyh0b3BvanNvblNpbXBsaWZ5KS5mb3JFYWNoKGZ1bmN0aW9uIChrZXkpIHsgZXhwb3J0c1trZXldID0gdG9wb2pzb25TaW1wbGlmeVtrZXldOyB9KTtcbiIsIi8vIGh0dHBzOi8vZ2l0aHViLmNvbS90b3BvanNvbi90b3BvanNvbi1jbGllbnQgVmVyc2lvbiAzLjAuMC4gQ29weXJpZ2h0IDIwMTcgTWlrZSBCb3N0b2NrLlxuKGZ1bmN0aW9uIChnbG9iYWwsIGZhY3RvcnkpIHtcblx0dHlwZW9mIGV4cG9ydHMgPT09ICdvYmplY3QnICYmIHR5cGVvZiBtb2R1bGUgIT09ICd1bmRlZmluZWQnID8gZmFjdG9yeShleHBvcnRzKSA6XG5cdHR5cGVvZiBkZWZpbmUgPT09ICdmdW5jdGlvbicgJiYgZGVmaW5lLmFtZCA/IGRlZmluZShbJ2V4cG9ydHMnXSwgZmFjdG9yeSkgOlxuXHQoZmFjdG9yeSgoZ2xvYmFsLnRvcG9qc29uID0gZ2xvYmFsLnRvcG9qc29uIHx8IHt9KSkpO1xufSh0aGlzLCAoZnVuY3Rpb24gKGV4cG9ydHMpIHsgJ3VzZSBzdHJpY3QnO1xuXG52YXIgaWRlbnRpdHkgPSBmdW5jdGlvbih4KSB7XG4gIHJldHVybiB4O1xufTtcblxudmFyIHRyYW5zZm9ybSA9IGZ1bmN0aW9uKHRyYW5zZm9ybSkge1xuICBpZiAodHJhbnNmb3JtID09IG51bGwpIHJldHVybiBpZGVudGl0eTtcbiAgdmFyIHgwLFxuICAgICAgeTAsXG4gICAgICBreCA9IHRyYW5zZm9ybS5zY2FsZVswXSxcbiAgICAgIGt5ID0gdHJhbnNmb3JtLnNjYWxlWzFdLFxuICAgICAgZHggPSB0cmFuc2Zvcm0udHJhbnNsYXRlWzBdLFxuICAgICAgZHkgPSB0cmFuc2Zvcm0udHJhbnNsYXRlWzFdO1xuICByZXR1cm4gZnVuY3Rpb24oaW5wdXQsIGkpIHtcbiAgICBpZiAoIWkpIHgwID0geTAgPSAwO1xuICAgIHZhciBqID0gMiwgbiA9IGlucHV0Lmxlbmd0aCwgb3V0cHV0ID0gbmV3IEFycmF5KG4pO1xuICAgIG91dHB1dFswXSA9ICh4MCArPSBpbnB1dFswXSkgKiBreCArIGR4O1xuICAgIG91dHB1dFsxXSA9ICh5MCArPSBpbnB1dFsxXSkgKiBreSArIGR5O1xuICAgIHdoaWxlIChqIDwgbikgb3V0cHV0W2pdID0gaW5wdXRbal0sICsrajtcbiAgICByZXR1cm4gb3V0cHV0O1xuICB9O1xufTtcblxudmFyIGJib3ggPSBmdW5jdGlvbih0b3BvbG9neSkge1xuICB2YXIgdCA9IHRyYW5zZm9ybSh0b3BvbG9neS50cmFuc2Zvcm0pLCBrZXksXG4gICAgICB4MCA9IEluZmluaXR5LCB5MCA9IHgwLCB4MSA9IC14MCwgeTEgPSAteDA7XG5cbiAgZnVuY3Rpb24gYmJveFBvaW50KHApIHtcbiAgICBwID0gdChwKTtcbiAgICBpZiAocFswXSA8IHgwKSB4MCA9IHBbMF07XG4gICAgaWYgKHBbMF0gPiB4MSkgeDEgPSBwWzBdO1xuICAgIGlmIChwWzFdIDwgeTApIHkwID0gcFsxXTtcbiAgICBpZiAocFsxXSA+IHkxKSB5MSA9IHBbMV07XG4gIH1cblxuICBmdW5jdGlvbiBiYm94R2VvbWV0cnkobykge1xuICAgIHN3aXRjaCAoby50eXBlKSB7XG4gICAgICBjYXNlIFwiR2VvbWV0cnlDb2xsZWN0aW9uXCI6IG8uZ2VvbWV0cmllcy5mb3JFYWNoKGJib3hHZW9tZXRyeSk7IGJyZWFrO1xuICAgICAgY2FzZSBcIlBvaW50XCI6IGJib3hQb2ludChvLmNvb3JkaW5hdGVzKTsgYnJlYWs7XG4gICAgICBjYXNlIFwiTXVsdGlQb2ludFwiOiBvLmNvb3JkaW5hdGVzLmZvckVhY2goYmJveFBvaW50KTsgYnJlYWs7XG4gICAgfVxuICB9XG5cbiAgdG9wb2xvZ3kuYXJjcy5mb3JFYWNoKGZ1bmN0aW9uKGFyYykge1xuICAgIHZhciBpID0gLTEsIG4gPSBhcmMubGVuZ3RoLCBwO1xuICAgIHdoaWxlICgrK2kgPCBuKSB7XG4gICAgICBwID0gdChhcmNbaV0sIGkpO1xuICAgICAgaWYgKHBbMF0gPCB4MCkgeDAgPSBwWzBdO1xuICAgICAgaWYgKHBbMF0gPiB4MSkgeDEgPSBwWzBdO1xuICAgICAgaWYgKHBbMV0gPCB5MCkgeTAgPSBwWzFdO1xuICAgICAgaWYgKHBbMV0gPiB5MSkgeTEgPSBwWzFdO1xuICAgIH1cbiAgfSk7XG5cbiAgZm9yIChrZXkgaW4gdG9wb2xvZ3kub2JqZWN0cykge1xuICAgIGJib3hHZW9tZXRyeSh0b3BvbG9neS5vYmplY3RzW2tleV0pO1xuICB9XG5cbiAgcmV0dXJuIFt4MCwgeTAsIHgxLCB5MV07XG59O1xuXG52YXIgcmV2ZXJzZSA9IGZ1bmN0aW9uKGFycmF5LCBuKSB7XG4gIHZhciB0LCBqID0gYXJyYXkubGVuZ3RoLCBpID0gaiAtIG47XG4gIHdoaWxlIChpIDwgLS1qKSB0ID0gYXJyYXlbaV0sIGFycmF5W2krK10gPSBhcnJheVtqXSwgYXJyYXlbal0gPSB0O1xufTtcblxudmFyIGZlYXR1cmUgPSBmdW5jdGlvbih0b3BvbG9neSwgbykge1xuICByZXR1cm4gby50eXBlID09PSBcIkdlb21ldHJ5Q29sbGVjdGlvblwiXG4gICAgICA/IHt0eXBlOiBcIkZlYXR1cmVDb2xsZWN0aW9uXCIsIGZlYXR1cmVzOiBvLmdlb21ldHJpZXMubWFwKGZ1bmN0aW9uKG8pIHsgcmV0dXJuIGZlYXR1cmUkMSh0b3BvbG9neSwgbyk7IH0pfVxuICAgICAgOiBmZWF0dXJlJDEodG9wb2xvZ3ksIG8pO1xufTtcblxuZnVuY3Rpb24gZmVhdHVyZSQxKHRvcG9sb2d5LCBvKSB7XG4gIHZhciBpZCA9IG8uaWQsXG4gICAgICBiYm94ID0gby5iYm94LFxuICAgICAgcHJvcGVydGllcyA9IG8ucHJvcGVydGllcyA9PSBudWxsID8ge30gOiBvLnByb3BlcnRpZXMsXG4gICAgICBnZW9tZXRyeSA9IG9iamVjdCh0b3BvbG9neSwgbyk7XG4gIHJldHVybiBpZCA9PSBudWxsICYmIGJib3ggPT0gbnVsbCA/IHt0eXBlOiBcIkZlYXR1cmVcIiwgcHJvcGVydGllczogcHJvcGVydGllcywgZ2VvbWV0cnk6IGdlb21ldHJ5fVxuICAgICAgOiBiYm94ID09IG51bGwgPyB7dHlwZTogXCJGZWF0dXJlXCIsIGlkOiBpZCwgcHJvcGVydGllczogcHJvcGVydGllcywgZ2VvbWV0cnk6IGdlb21ldHJ5fVxuICAgICAgOiB7dHlwZTogXCJGZWF0dXJlXCIsIGlkOiBpZCwgYmJveDogYmJveCwgcHJvcGVydGllczogcHJvcGVydGllcywgZ2VvbWV0cnk6IGdlb21ldHJ5fTtcbn1cblxuZnVuY3Rpb24gb2JqZWN0KHRvcG9sb2d5LCBvKSB7XG4gIHZhciB0cmFuc2Zvcm1Qb2ludCA9IHRyYW5zZm9ybSh0b3BvbG9neS50cmFuc2Zvcm0pLFxuICAgICAgYXJjcyA9IHRvcG9sb2d5LmFyY3M7XG5cbiAgZnVuY3Rpb24gYXJjKGksIHBvaW50cykge1xuICAgIGlmIChwb2ludHMubGVuZ3RoKSBwb2ludHMucG9wKCk7XG4gICAgZm9yICh2YXIgYSA9IGFyY3NbaSA8IDAgPyB+aSA6IGldLCBrID0gMCwgbiA9IGEubGVuZ3RoOyBrIDwgbjsgKytrKSB7XG4gICAgICBwb2ludHMucHVzaCh0cmFuc2Zvcm1Qb2ludChhW2tdLCBrKSk7XG4gICAgfVxuICAgIGlmIChpIDwgMCkgcmV2ZXJzZShwb2ludHMsIG4pO1xuICB9XG5cbiAgZnVuY3Rpb24gcG9pbnQocCkge1xuICAgIHJldHVybiB0cmFuc2Zvcm1Qb2ludChwKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGxpbmUoYXJjcykge1xuICAgIHZhciBwb2ludHMgPSBbXTtcbiAgICBmb3IgKHZhciBpID0gMCwgbiA9IGFyY3MubGVuZ3RoOyBpIDwgbjsgKytpKSBhcmMoYXJjc1tpXSwgcG9pbnRzKTtcbiAgICBpZiAocG9pbnRzLmxlbmd0aCA8IDIpIHBvaW50cy5wdXNoKHBvaW50c1swXSk7IC8vIFRoaXMgc2hvdWxkIG5ldmVyIGhhcHBlbiBwZXIgdGhlIHNwZWNpZmljYXRpb24uXG4gICAgcmV0dXJuIHBvaW50cztcbiAgfVxuXG4gIGZ1bmN0aW9uIHJpbmcoYXJjcykge1xuICAgIHZhciBwb2ludHMgPSBsaW5lKGFyY3MpO1xuICAgIHdoaWxlIChwb2ludHMubGVuZ3RoIDwgNCkgcG9pbnRzLnB1c2gocG9pbnRzWzBdKTsgLy8gVGhpcyBtYXkgaGFwcGVuIGlmIGFuIGFyYyBoYXMgb25seSB0d28gcG9pbnRzLlxuICAgIHJldHVybiBwb2ludHM7XG4gIH1cblxuICBmdW5jdGlvbiBwb2x5Z29uKGFyY3MpIHtcbiAgICByZXR1cm4gYXJjcy5tYXAocmluZyk7XG4gIH1cblxuICBmdW5jdGlvbiBnZW9tZXRyeShvKSB7XG4gICAgdmFyIHR5cGUgPSBvLnR5cGUsIGNvb3JkaW5hdGVzO1xuICAgIHN3aXRjaCAodHlwZSkge1xuICAgICAgY2FzZSBcIkdlb21ldHJ5Q29sbGVjdGlvblwiOiByZXR1cm4ge3R5cGU6IHR5cGUsIGdlb21ldHJpZXM6IG8uZ2VvbWV0cmllcy5tYXAoZ2VvbWV0cnkpfTtcbiAgICAgIGNhc2UgXCJQb2ludFwiOiBjb29yZGluYXRlcyA9IHBvaW50KG8uY29vcmRpbmF0ZXMpOyBicmVhaztcbiAgICAgIGNhc2UgXCJNdWx0aVBvaW50XCI6IGNvb3JkaW5hdGVzID0gby5jb29yZGluYXRlcy5tYXAocG9pbnQpOyBicmVhaztcbiAgICAgIGNhc2UgXCJMaW5lU3RyaW5nXCI6IGNvb3JkaW5hdGVzID0gbGluZShvLmFyY3MpOyBicmVhaztcbiAgICAgIGNhc2UgXCJNdWx0aUxpbmVTdHJpbmdcIjogY29vcmRpbmF0ZXMgPSBvLmFyY3MubWFwKGxpbmUpOyBicmVhaztcbiAgICAgIGNhc2UgXCJQb2x5Z29uXCI6IGNvb3JkaW5hdGVzID0gcG9seWdvbihvLmFyY3MpOyBicmVhaztcbiAgICAgIGNhc2UgXCJNdWx0aVBvbHlnb25cIjogY29vcmRpbmF0ZXMgPSBvLmFyY3MubWFwKHBvbHlnb24pOyBicmVhaztcbiAgICAgIGRlZmF1bHQ6IHJldHVybiBudWxsO1xuICAgIH1cbiAgICByZXR1cm4ge3R5cGU6IHR5cGUsIGNvb3JkaW5hdGVzOiBjb29yZGluYXRlc307XG4gIH1cblxuICByZXR1cm4gZ2VvbWV0cnkobyk7XG59XG5cbnZhciBzdGl0Y2ggPSBmdW5jdGlvbih0b3BvbG9neSwgYXJjcykge1xuICB2YXIgc3RpdGNoZWRBcmNzID0ge30sXG4gICAgICBmcmFnbWVudEJ5U3RhcnQgPSB7fSxcbiAgICAgIGZyYWdtZW50QnlFbmQgPSB7fSxcbiAgICAgIGZyYWdtZW50cyA9IFtdLFxuICAgICAgZW1wdHlJbmRleCA9IC0xO1xuXG4gIC8vIFN0aXRjaCBlbXB0eSBhcmNzIGZpcnN0LCBzaW5jZSB0aGV5IG1heSBiZSBzdWJzdW1lZCBieSBvdGhlciBhcmNzLlxuICBhcmNzLmZvckVhY2goZnVuY3Rpb24oaSwgaikge1xuICAgIHZhciBhcmMgPSB0b3BvbG9neS5hcmNzW2kgPCAwID8gfmkgOiBpXSwgdDtcbiAgICBpZiAoYXJjLmxlbmd0aCA8IDMgJiYgIWFyY1sxXVswXSAmJiAhYXJjWzFdWzFdKSB7XG4gICAgICB0ID0gYXJjc1srK2VtcHR5SW5kZXhdLCBhcmNzW2VtcHR5SW5kZXhdID0gaSwgYXJjc1tqXSA9IHQ7XG4gICAgfVxuICB9KTtcblxuICBhcmNzLmZvckVhY2goZnVuY3Rpb24oaSkge1xuICAgIHZhciBlID0gZW5kcyhpKSxcbiAgICAgICAgc3RhcnQgPSBlWzBdLFxuICAgICAgICBlbmQgPSBlWzFdLFxuICAgICAgICBmLCBnO1xuXG4gICAgaWYgKGYgPSBmcmFnbWVudEJ5RW5kW3N0YXJ0XSkge1xuICAgICAgZGVsZXRlIGZyYWdtZW50QnlFbmRbZi5lbmRdO1xuICAgICAgZi5wdXNoKGkpO1xuICAgICAgZi5lbmQgPSBlbmQ7XG4gICAgICBpZiAoZyA9IGZyYWdtZW50QnlTdGFydFtlbmRdKSB7XG4gICAgICAgIGRlbGV0ZSBmcmFnbWVudEJ5U3RhcnRbZy5zdGFydF07XG4gICAgICAgIHZhciBmZyA9IGcgPT09IGYgPyBmIDogZi5jb25jYXQoZyk7XG4gICAgICAgIGZyYWdtZW50QnlTdGFydFtmZy5zdGFydCA9IGYuc3RhcnRdID0gZnJhZ21lbnRCeUVuZFtmZy5lbmQgPSBnLmVuZF0gPSBmZztcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGZyYWdtZW50QnlTdGFydFtmLnN0YXJ0XSA9IGZyYWdtZW50QnlFbmRbZi5lbmRdID0gZjtcbiAgICAgIH1cbiAgICB9IGVsc2UgaWYgKGYgPSBmcmFnbWVudEJ5U3RhcnRbZW5kXSkge1xuICAgICAgZGVsZXRlIGZyYWdtZW50QnlTdGFydFtmLnN0YXJ0XTtcbiAgICAgIGYudW5zaGlmdChpKTtcbiAgICAgIGYuc3RhcnQgPSBzdGFydDtcbiAgICAgIGlmIChnID0gZnJhZ21lbnRCeUVuZFtzdGFydF0pIHtcbiAgICAgICAgZGVsZXRlIGZyYWdtZW50QnlFbmRbZy5lbmRdO1xuICAgICAgICB2YXIgZ2YgPSBnID09PSBmID8gZiA6IGcuY29uY2F0KGYpO1xuICAgICAgICBmcmFnbWVudEJ5U3RhcnRbZ2Yuc3RhcnQgPSBnLnN0YXJ0XSA9IGZyYWdtZW50QnlFbmRbZ2YuZW5kID0gZi5lbmRdID0gZ2Y7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBmcmFnbWVudEJ5U3RhcnRbZi5zdGFydF0gPSBmcmFnbWVudEJ5RW5kW2YuZW5kXSA9IGY7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIGYgPSBbaV07XG4gICAgICBmcmFnbWVudEJ5U3RhcnRbZi5zdGFydCA9IHN0YXJ0XSA9IGZyYWdtZW50QnlFbmRbZi5lbmQgPSBlbmRdID0gZjtcbiAgICB9XG4gIH0pO1xuXG4gIGZ1bmN0aW9uIGVuZHMoaSkge1xuICAgIHZhciBhcmMgPSB0b3BvbG9neS5hcmNzW2kgPCAwID8gfmkgOiBpXSwgcDAgPSBhcmNbMF0sIHAxO1xuICAgIGlmICh0b3BvbG9neS50cmFuc2Zvcm0pIHAxID0gWzAsIDBdLCBhcmMuZm9yRWFjaChmdW5jdGlvbihkcCkgeyBwMVswXSArPSBkcFswXSwgcDFbMV0gKz0gZHBbMV07IH0pO1xuICAgIGVsc2UgcDEgPSBhcmNbYXJjLmxlbmd0aCAtIDFdO1xuICAgIHJldHVybiBpIDwgMCA/IFtwMSwgcDBdIDogW3AwLCBwMV07XG4gIH1cblxuICBmdW5jdGlvbiBmbHVzaChmcmFnbWVudEJ5RW5kLCBmcmFnbWVudEJ5U3RhcnQpIHtcbiAgICBmb3IgKHZhciBrIGluIGZyYWdtZW50QnlFbmQpIHtcbiAgICAgIHZhciBmID0gZnJhZ21lbnRCeUVuZFtrXTtcbiAgICAgIGRlbGV0ZSBmcmFnbWVudEJ5U3RhcnRbZi5zdGFydF07XG4gICAgICBkZWxldGUgZi5zdGFydDtcbiAgICAgIGRlbGV0ZSBmLmVuZDtcbiAgICAgIGYuZm9yRWFjaChmdW5jdGlvbihpKSB7IHN0aXRjaGVkQXJjc1tpIDwgMCA/IH5pIDogaV0gPSAxOyB9KTtcbiAgICAgIGZyYWdtZW50cy5wdXNoKGYpO1xuICAgIH1cbiAgfVxuXG4gIGZsdXNoKGZyYWdtZW50QnlFbmQsIGZyYWdtZW50QnlTdGFydCk7XG4gIGZsdXNoKGZyYWdtZW50QnlTdGFydCwgZnJhZ21lbnRCeUVuZCk7XG4gIGFyY3MuZm9yRWFjaChmdW5jdGlvbihpKSB7IGlmICghc3RpdGNoZWRBcmNzW2kgPCAwID8gfmkgOiBpXSkgZnJhZ21lbnRzLnB1c2goW2ldKTsgfSk7XG5cbiAgcmV0dXJuIGZyYWdtZW50cztcbn07XG5cbnZhciBtZXNoID0gZnVuY3Rpb24odG9wb2xvZ3kpIHtcbiAgcmV0dXJuIG9iamVjdCh0b3BvbG9neSwgbWVzaEFyY3MuYXBwbHkodGhpcywgYXJndW1lbnRzKSk7XG59O1xuXG5mdW5jdGlvbiBtZXNoQXJjcyh0b3BvbG9neSwgb2JqZWN0JCQxLCBmaWx0ZXIpIHtcbiAgdmFyIGFyY3MsIGksIG47XG4gIGlmIChhcmd1bWVudHMubGVuZ3RoID4gMSkgYXJjcyA9IGV4dHJhY3RBcmNzKHRvcG9sb2d5LCBvYmplY3QkJDEsIGZpbHRlcik7XG4gIGVsc2UgZm9yIChpID0gMCwgYXJjcyA9IG5ldyBBcnJheShuID0gdG9wb2xvZ3kuYXJjcy5sZW5ndGgpOyBpIDwgbjsgKytpKSBhcmNzW2ldID0gaTtcbiAgcmV0dXJuIHt0eXBlOiBcIk11bHRpTGluZVN0cmluZ1wiLCBhcmNzOiBzdGl0Y2godG9wb2xvZ3ksIGFyY3MpfTtcbn1cblxuZnVuY3Rpb24gZXh0cmFjdEFyY3ModG9wb2xvZ3ksIG9iamVjdCQkMSwgZmlsdGVyKSB7XG4gIHZhciBhcmNzID0gW10sXG4gICAgICBnZW9tc0J5QXJjID0gW10sXG4gICAgICBnZW9tO1xuXG4gIGZ1bmN0aW9uIGV4dHJhY3QwKGkpIHtcbiAgICB2YXIgaiA9IGkgPCAwID8gfmkgOiBpO1xuICAgIChnZW9tc0J5QXJjW2pdIHx8IChnZW9tc0J5QXJjW2pdID0gW10pKS5wdXNoKHtpOiBpLCBnOiBnZW9tfSk7XG4gIH1cblxuICBmdW5jdGlvbiBleHRyYWN0MShhcmNzKSB7XG4gICAgYXJjcy5mb3JFYWNoKGV4dHJhY3QwKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGV4dHJhY3QyKGFyY3MpIHtcbiAgICBhcmNzLmZvckVhY2goZXh0cmFjdDEpO1xuICB9XG5cbiAgZnVuY3Rpb24gZXh0cmFjdDMoYXJjcykge1xuICAgIGFyY3MuZm9yRWFjaChleHRyYWN0Mik7XG4gIH1cblxuICBmdW5jdGlvbiBnZW9tZXRyeShvKSB7XG4gICAgc3dpdGNoIChnZW9tID0gbywgby50eXBlKSB7XG4gICAgICBjYXNlIFwiR2VvbWV0cnlDb2xsZWN0aW9uXCI6IG8uZ2VvbWV0cmllcy5mb3JFYWNoKGdlb21ldHJ5KTsgYnJlYWs7XG4gICAgICBjYXNlIFwiTGluZVN0cmluZ1wiOiBleHRyYWN0MShvLmFyY3MpOyBicmVhaztcbiAgICAgIGNhc2UgXCJNdWx0aUxpbmVTdHJpbmdcIjogY2FzZSBcIlBvbHlnb25cIjogZXh0cmFjdDIoby5hcmNzKTsgYnJlYWs7XG4gICAgICBjYXNlIFwiTXVsdGlQb2x5Z29uXCI6IGV4dHJhY3QzKG8uYXJjcyk7IGJyZWFrO1xuICAgIH1cbiAgfVxuXG4gIGdlb21ldHJ5KG9iamVjdCQkMSk7XG5cbiAgZ2VvbXNCeUFyYy5mb3JFYWNoKGZpbHRlciA9PSBudWxsXG4gICAgICA/IGZ1bmN0aW9uKGdlb21zKSB7IGFyY3MucHVzaChnZW9tc1swXS5pKTsgfVxuICAgICAgOiBmdW5jdGlvbihnZW9tcykgeyBpZiAoZmlsdGVyKGdlb21zWzBdLmcsIGdlb21zW2dlb21zLmxlbmd0aCAtIDFdLmcpKSBhcmNzLnB1c2goZ2VvbXNbMF0uaSk7IH0pO1xuXG4gIHJldHVybiBhcmNzO1xufVxuXG5mdW5jdGlvbiBwbGFuYXJSaW5nQXJlYShyaW5nKSB7XG4gIHZhciBpID0gLTEsIG4gPSByaW5nLmxlbmd0aCwgYSwgYiA9IHJpbmdbbiAtIDFdLCBhcmVhID0gMDtcbiAgd2hpbGUgKCsraSA8IG4pIGEgPSBiLCBiID0gcmluZ1tpXSwgYXJlYSArPSBhWzBdICogYlsxXSAtIGFbMV0gKiBiWzBdO1xuICByZXR1cm4gTWF0aC5hYnMoYXJlYSk7IC8vIE5vdGU6IGRvdWJsZWQgYXJlYSFcbn1cblxudmFyIG1lcmdlID0gZnVuY3Rpb24odG9wb2xvZ3kpIHtcbiAgcmV0dXJuIG9iamVjdCh0b3BvbG9neSwgbWVyZ2VBcmNzLmFwcGx5KHRoaXMsIGFyZ3VtZW50cykpO1xufTtcblxuZnVuY3Rpb24gbWVyZ2VBcmNzKHRvcG9sb2d5LCBvYmplY3RzKSB7XG4gIHZhciBwb2x5Z29uc0J5QXJjID0ge30sXG4gICAgICBwb2x5Z29ucyA9IFtdLFxuICAgICAgZ3JvdXBzID0gW107XG5cbiAgb2JqZWN0cy5mb3JFYWNoKGdlb21ldHJ5KTtcblxuICBmdW5jdGlvbiBnZW9tZXRyeShvKSB7XG4gICAgc3dpdGNoIChvLnR5cGUpIHtcbiAgICAgIGNhc2UgXCJHZW9tZXRyeUNvbGxlY3Rpb25cIjogby5nZW9tZXRyaWVzLmZvckVhY2goZ2VvbWV0cnkpOyBicmVhaztcbiAgICAgIGNhc2UgXCJQb2x5Z29uXCI6IGV4dHJhY3Qoby5hcmNzKTsgYnJlYWs7XG4gICAgICBjYXNlIFwiTXVsdGlQb2x5Z29uXCI6IG8uYXJjcy5mb3JFYWNoKGV4dHJhY3QpOyBicmVhaztcbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiBleHRyYWN0KHBvbHlnb24pIHtcbiAgICBwb2x5Z29uLmZvckVhY2goZnVuY3Rpb24ocmluZykge1xuICAgICAgcmluZy5mb3JFYWNoKGZ1bmN0aW9uKGFyYykge1xuICAgICAgICAocG9seWdvbnNCeUFyY1thcmMgPSBhcmMgPCAwID8gfmFyYyA6IGFyY10gfHwgKHBvbHlnb25zQnlBcmNbYXJjXSA9IFtdKSkucHVzaChwb2x5Z29uKTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICAgIHBvbHlnb25zLnB1c2gocG9seWdvbik7XG4gIH1cblxuICBmdW5jdGlvbiBhcmVhKHJpbmcpIHtcbiAgICByZXR1cm4gcGxhbmFyUmluZ0FyZWEob2JqZWN0KHRvcG9sb2d5LCB7dHlwZTogXCJQb2x5Z29uXCIsIGFyY3M6IFtyaW5nXX0pLmNvb3JkaW5hdGVzWzBdKTtcbiAgfVxuXG4gIHBvbHlnb25zLmZvckVhY2goZnVuY3Rpb24ocG9seWdvbikge1xuICAgIGlmICghcG9seWdvbi5fKSB7XG4gICAgICB2YXIgZ3JvdXAgPSBbXSxcbiAgICAgICAgICBuZWlnaGJvcnMgPSBbcG9seWdvbl07XG4gICAgICBwb2x5Z29uLl8gPSAxO1xuICAgICAgZ3JvdXBzLnB1c2goZ3JvdXApO1xuICAgICAgd2hpbGUgKHBvbHlnb24gPSBuZWlnaGJvcnMucG9wKCkpIHtcbiAgICAgICAgZ3JvdXAucHVzaChwb2x5Z29uKTtcbiAgICAgICAgcG9seWdvbi5mb3JFYWNoKGZ1bmN0aW9uKHJpbmcpIHtcbiAgICAgICAgICByaW5nLmZvckVhY2goZnVuY3Rpb24oYXJjKSB7XG4gICAgICAgICAgICBwb2x5Z29uc0J5QXJjW2FyYyA8IDAgPyB+YXJjIDogYXJjXS5mb3JFYWNoKGZ1bmN0aW9uKHBvbHlnb24pIHtcbiAgICAgICAgICAgICAgaWYgKCFwb2x5Z29uLl8pIHtcbiAgICAgICAgICAgICAgICBwb2x5Z29uLl8gPSAxO1xuICAgICAgICAgICAgICAgIG5laWdoYm9ycy5wdXNoKHBvbHlnb24pO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfVxuICB9KTtcblxuICBwb2x5Z29ucy5mb3JFYWNoKGZ1bmN0aW9uKHBvbHlnb24pIHtcbiAgICBkZWxldGUgcG9seWdvbi5fO1xuICB9KTtcblxuICByZXR1cm4ge1xuICAgIHR5cGU6IFwiTXVsdGlQb2x5Z29uXCIsXG4gICAgYXJjczogZ3JvdXBzLm1hcChmdW5jdGlvbihwb2x5Z29ucykge1xuICAgICAgdmFyIGFyY3MgPSBbXSwgbjtcblxuICAgICAgLy8gRXh0cmFjdCB0aGUgZXh0ZXJpb3IgKHVuaXF1ZSkgYXJjcy5cbiAgICAgIHBvbHlnb25zLmZvckVhY2goZnVuY3Rpb24ocG9seWdvbikge1xuICAgICAgICBwb2x5Z29uLmZvckVhY2goZnVuY3Rpb24ocmluZykge1xuICAgICAgICAgIHJpbmcuZm9yRWFjaChmdW5jdGlvbihhcmMpIHtcbiAgICAgICAgICAgIGlmIChwb2x5Z29uc0J5QXJjW2FyYyA8IDAgPyB+YXJjIDogYXJjXS5sZW5ndGggPCAyKSB7XG4gICAgICAgICAgICAgIGFyY3MucHVzaChhcmMpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuXG4gICAgICAvLyBTdGl0Y2ggdGhlIGFyY3MgaW50byBvbmUgb3IgbW9yZSByaW5ncy5cbiAgICAgIGFyY3MgPSBzdGl0Y2godG9wb2xvZ3ksIGFyY3MpO1xuXG4gICAgICAvLyBJZiBtb3JlIHRoYW4gb25lIHJpbmcgaXMgcmV0dXJuZWQsXG4gICAgICAvLyBhdCBtb3N0IG9uZSBvZiB0aGVzZSByaW5ncyBjYW4gYmUgdGhlIGV4dGVyaW9yO1xuICAgICAgLy8gY2hvb3NlIHRoZSBvbmUgd2l0aCB0aGUgZ3JlYXRlc3QgYWJzb2x1dGUgYXJlYS5cbiAgICAgIGlmICgobiA9IGFyY3MubGVuZ3RoKSA+IDEpIHtcbiAgICAgICAgZm9yICh2YXIgaSA9IDEsIGsgPSBhcmVhKGFyY3NbMF0pLCBraSwgdDsgaSA8IG47ICsraSkge1xuICAgICAgICAgIGlmICgoa2kgPSBhcmVhKGFyY3NbaV0pKSA+IGspIHtcbiAgICAgICAgICAgIHQgPSBhcmNzWzBdLCBhcmNzWzBdID0gYXJjc1tpXSwgYXJjc1tpXSA9IHQsIGsgPSBraTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgcmV0dXJuIGFyY3M7XG4gICAgfSlcbiAgfTtcbn1cblxudmFyIGJpc2VjdCA9IGZ1bmN0aW9uKGEsIHgpIHtcbiAgdmFyIGxvID0gMCwgaGkgPSBhLmxlbmd0aDtcbiAgd2hpbGUgKGxvIDwgaGkpIHtcbiAgICB2YXIgbWlkID0gbG8gKyBoaSA+Pj4gMTtcbiAgICBpZiAoYVttaWRdIDwgeCkgbG8gPSBtaWQgKyAxO1xuICAgIGVsc2UgaGkgPSBtaWQ7XG4gIH1cbiAgcmV0dXJuIGxvO1xufTtcblxudmFyIG5laWdoYm9ycyA9IGZ1bmN0aW9uKG9iamVjdHMpIHtcbiAgdmFyIGluZGV4ZXNCeUFyYyA9IHt9LCAvLyBhcmMgaW5kZXggLT4gYXJyYXkgb2Ygb2JqZWN0IGluZGV4ZXNcbiAgICAgIG5laWdoYm9ycyA9IG9iamVjdHMubWFwKGZ1bmN0aW9uKCkgeyByZXR1cm4gW107IH0pO1xuXG4gIGZ1bmN0aW9uIGxpbmUoYXJjcywgaSkge1xuICAgIGFyY3MuZm9yRWFjaChmdW5jdGlvbihhKSB7XG4gICAgICBpZiAoYSA8IDApIGEgPSB+YTtcbiAgICAgIHZhciBvID0gaW5kZXhlc0J5QXJjW2FdO1xuICAgICAgaWYgKG8pIG8ucHVzaChpKTtcbiAgICAgIGVsc2UgaW5kZXhlc0J5QXJjW2FdID0gW2ldO1xuICAgIH0pO1xuICB9XG5cbiAgZnVuY3Rpb24gcG9seWdvbihhcmNzLCBpKSB7XG4gICAgYXJjcy5mb3JFYWNoKGZ1bmN0aW9uKGFyYykgeyBsaW5lKGFyYywgaSk7IH0pO1xuICB9XG5cbiAgZnVuY3Rpb24gZ2VvbWV0cnkobywgaSkge1xuICAgIGlmIChvLnR5cGUgPT09IFwiR2VvbWV0cnlDb2xsZWN0aW9uXCIpIG8uZ2VvbWV0cmllcy5mb3JFYWNoKGZ1bmN0aW9uKG8pIHsgZ2VvbWV0cnkobywgaSk7IH0pO1xuICAgIGVsc2UgaWYgKG8udHlwZSBpbiBnZW9tZXRyeVR5cGUpIGdlb21ldHJ5VHlwZVtvLnR5cGVdKG8uYXJjcywgaSk7XG4gIH1cblxuICB2YXIgZ2VvbWV0cnlUeXBlID0ge1xuICAgIExpbmVTdHJpbmc6IGxpbmUsXG4gICAgTXVsdGlMaW5lU3RyaW5nOiBwb2x5Z29uLFxuICAgIFBvbHlnb246IHBvbHlnb24sXG4gICAgTXVsdGlQb2x5Z29uOiBmdW5jdGlvbihhcmNzLCBpKSB7IGFyY3MuZm9yRWFjaChmdW5jdGlvbihhcmMpIHsgcG9seWdvbihhcmMsIGkpOyB9KTsgfVxuICB9O1xuXG4gIG9iamVjdHMuZm9yRWFjaChnZW9tZXRyeSk7XG5cbiAgZm9yICh2YXIgaSBpbiBpbmRleGVzQnlBcmMpIHtcbiAgICBmb3IgKHZhciBpbmRleGVzID0gaW5kZXhlc0J5QXJjW2ldLCBtID0gaW5kZXhlcy5sZW5ndGgsIGogPSAwOyBqIDwgbTsgKytqKSB7XG4gICAgICBmb3IgKHZhciBrID0gaiArIDE7IGsgPCBtOyArK2spIHtcbiAgICAgICAgdmFyIGlqID0gaW5kZXhlc1tqXSwgaWsgPSBpbmRleGVzW2tdLCBuO1xuICAgICAgICBpZiAoKG4gPSBuZWlnaGJvcnNbaWpdKVtpID0gYmlzZWN0KG4sIGlrKV0gIT09IGlrKSBuLnNwbGljZShpLCAwLCBpayk7XG4gICAgICAgIGlmICgobiA9IG5laWdoYm9yc1tpa10pW2kgPSBiaXNlY3QobiwgaWopXSAhPT0gaWopIG4uc3BsaWNlKGksIDAsIGlqKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICByZXR1cm4gbmVpZ2hib3JzO1xufTtcblxudmFyIHVudHJhbnNmb3JtID0gZnVuY3Rpb24odHJhbnNmb3JtKSB7XG4gIGlmICh0cmFuc2Zvcm0gPT0gbnVsbCkgcmV0dXJuIGlkZW50aXR5O1xuICB2YXIgeDAsXG4gICAgICB5MCxcbiAgICAgIGt4ID0gdHJhbnNmb3JtLnNjYWxlWzBdLFxuICAgICAga3kgPSB0cmFuc2Zvcm0uc2NhbGVbMV0sXG4gICAgICBkeCA9IHRyYW5zZm9ybS50cmFuc2xhdGVbMF0sXG4gICAgICBkeSA9IHRyYW5zZm9ybS50cmFuc2xhdGVbMV07XG4gIHJldHVybiBmdW5jdGlvbihpbnB1dCwgaSkge1xuICAgIGlmICghaSkgeDAgPSB5MCA9IDA7XG4gICAgdmFyIGogPSAyLFxuICAgICAgICBuID0gaW5wdXQubGVuZ3RoLFxuICAgICAgICBvdXRwdXQgPSBuZXcgQXJyYXkobiksXG4gICAgICAgIHgxID0gTWF0aC5yb3VuZCgoaW5wdXRbMF0gLSBkeCkgLyBreCksXG4gICAgICAgIHkxID0gTWF0aC5yb3VuZCgoaW5wdXRbMV0gLSBkeSkgLyBreSk7XG4gICAgb3V0cHV0WzBdID0geDEgLSB4MCwgeDAgPSB4MTtcbiAgICBvdXRwdXRbMV0gPSB5MSAtIHkwLCB5MCA9IHkxO1xuICAgIHdoaWxlIChqIDwgbikgb3V0cHV0W2pdID0gaW5wdXRbal0sICsrajtcbiAgICByZXR1cm4gb3V0cHV0O1xuICB9O1xufTtcblxudmFyIHF1YW50aXplID0gZnVuY3Rpb24odG9wb2xvZ3ksIHRyYW5zZm9ybSkge1xuICBpZiAodG9wb2xvZ3kudHJhbnNmb3JtKSB0aHJvdyBuZXcgRXJyb3IoXCJhbHJlYWR5IHF1YW50aXplZFwiKTtcblxuICBpZiAoIXRyYW5zZm9ybSB8fCAhdHJhbnNmb3JtLnNjYWxlKSB7XG4gICAgaWYgKCEoKG4gPSBNYXRoLmZsb29yKHRyYW5zZm9ybSkpID49IDIpKSB0aHJvdyBuZXcgRXJyb3IoXCJuIG11c3QgYmUg4omlMlwiKTtcbiAgICBib3ggPSB0b3BvbG9neS5iYm94IHx8IGJib3godG9wb2xvZ3kpO1xuICAgIHZhciB4MCA9IGJveFswXSwgeTAgPSBib3hbMV0sIHgxID0gYm94WzJdLCB5MSA9IGJveFszXSwgbjtcbiAgICB0cmFuc2Zvcm0gPSB7c2NhbGU6IFt4MSAtIHgwID8gKHgxIC0geDApIC8gKG4gLSAxKSA6IDEsIHkxIC0geTAgPyAoeTEgLSB5MCkgLyAobiAtIDEpIDogMV0sIHRyYW5zbGF0ZTogW3gwLCB5MF19O1xuICB9IGVsc2Uge1xuICAgIGJveCA9IHRvcG9sb2d5LmJib3g7XG4gIH1cblxuICB2YXIgdCA9IHVudHJhbnNmb3JtKHRyYW5zZm9ybSksIGJveCwga2V5LCBpbnB1dHMgPSB0b3BvbG9neS5vYmplY3RzLCBvdXRwdXRzID0ge307XG5cbiAgZnVuY3Rpb24gcXVhbnRpemVQb2ludChwb2ludCkge1xuICAgIHJldHVybiB0KHBvaW50KTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHF1YW50aXplR2VvbWV0cnkoaW5wdXQpIHtcbiAgICB2YXIgb3V0cHV0O1xuICAgIHN3aXRjaCAoaW5wdXQudHlwZSkge1xuICAgICAgY2FzZSBcIkdlb21ldHJ5Q29sbGVjdGlvblwiOiBvdXRwdXQgPSB7dHlwZTogXCJHZW9tZXRyeUNvbGxlY3Rpb25cIiwgZ2VvbWV0cmllczogaW5wdXQuZ2VvbWV0cmllcy5tYXAocXVhbnRpemVHZW9tZXRyeSl9OyBicmVhaztcbiAgICAgIGNhc2UgXCJQb2ludFwiOiBvdXRwdXQgPSB7dHlwZTogXCJQb2ludFwiLCBjb29yZGluYXRlczogcXVhbnRpemVQb2ludChpbnB1dC5jb29yZGluYXRlcyl9OyBicmVhaztcbiAgICAgIGNhc2UgXCJNdWx0aVBvaW50XCI6IG91dHB1dCA9IHt0eXBlOiBcIk11bHRpUG9pbnRcIiwgY29vcmRpbmF0ZXM6IGlucHV0LmNvb3JkaW5hdGVzLm1hcChxdWFudGl6ZVBvaW50KX07IGJyZWFrO1xuICAgICAgZGVmYXVsdDogcmV0dXJuIGlucHV0O1xuICAgIH1cbiAgICBpZiAoaW5wdXQuaWQgIT0gbnVsbCkgb3V0cHV0LmlkID0gaW5wdXQuaWQ7XG4gICAgaWYgKGlucHV0LmJib3ggIT0gbnVsbCkgb3V0cHV0LmJib3ggPSBpbnB1dC5iYm94O1xuICAgIGlmIChpbnB1dC5wcm9wZXJ0aWVzICE9IG51bGwpIG91dHB1dC5wcm9wZXJ0aWVzID0gaW5wdXQucHJvcGVydGllcztcbiAgICByZXR1cm4gb3V0cHV0O1xuICB9XG5cbiAgZnVuY3Rpb24gcXVhbnRpemVBcmMoaW5wdXQpIHtcbiAgICB2YXIgaSA9IDAsIGogPSAxLCBuID0gaW5wdXQubGVuZ3RoLCBwLCBvdXRwdXQgPSBuZXcgQXJyYXkobik7IC8vIHBlc3NpbWlzdGljXG4gICAgb3V0cHV0WzBdID0gdChpbnB1dFswXSwgMCk7XG4gICAgd2hpbGUgKCsraSA8IG4pIGlmICgocCA9IHQoaW5wdXRbaV0sIGkpKVswXSB8fCBwWzFdKSBvdXRwdXRbaisrXSA9IHA7IC8vIG5vbi1jb2luY2lkZW50IHBvaW50c1xuICAgIGlmIChqID09PSAxKSBvdXRwdXRbaisrXSA9IFswLCAwXTsgLy8gYW4gYXJjIG11c3QgaGF2ZSBhdCBsZWFzdCB0d28gcG9pbnRzXG4gICAgb3V0cHV0Lmxlbmd0aCA9IGo7XG4gICAgcmV0dXJuIG91dHB1dDtcbiAgfVxuXG4gIGZvciAoa2V5IGluIGlucHV0cykgb3V0cHV0c1trZXldID0gcXVhbnRpemVHZW9tZXRyeShpbnB1dHNba2V5XSk7XG5cbiAgcmV0dXJuIHtcbiAgICB0eXBlOiBcIlRvcG9sb2d5XCIsXG4gICAgYmJveDogYm94LFxuICAgIHRyYW5zZm9ybTogdHJhbnNmb3JtLFxuICAgIG9iamVjdHM6IG91dHB1dHMsXG4gICAgYXJjczogdG9wb2xvZ3kuYXJjcy5tYXAocXVhbnRpemVBcmMpXG4gIH07XG59O1xuXG5leHBvcnRzLmJib3ggPSBiYm94O1xuZXhwb3J0cy5mZWF0dXJlID0gZmVhdHVyZTtcbmV4cG9ydHMubWVzaCA9IG1lc2g7XG5leHBvcnRzLm1lc2hBcmNzID0gbWVzaEFyY3M7XG5leHBvcnRzLm1lcmdlID0gbWVyZ2U7XG5leHBvcnRzLm1lcmdlQXJjcyA9IG1lcmdlQXJjcztcbmV4cG9ydHMubmVpZ2hib3JzID0gbmVpZ2hib3JzO1xuZXhwb3J0cy5xdWFudGl6ZSA9IHF1YW50aXplO1xuZXhwb3J0cy50cmFuc2Zvcm0gPSB0cmFuc2Zvcm07XG5leHBvcnRzLnVudHJhbnNmb3JtID0gdW50cmFuc2Zvcm07XG5cbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCAnX19lc01vZHVsZScsIHsgdmFsdWU6IHRydWUgfSk7XG5cbn0pKSk7XG4iLCIvLyBodHRwczovL2dpdGh1Yi5jb20vdG9wb2pzb24vdG9wb2pzb24tc2VydmVyIFZlcnNpb24gMy4wLjAuIENvcHlyaWdodCAyMDE3IE1pa2UgQm9zdG9jay5cbihmdW5jdGlvbiAoZ2xvYmFsLCBmYWN0b3J5KSB7XG5cdHR5cGVvZiBleHBvcnRzID09PSAnb2JqZWN0JyAmJiB0eXBlb2YgbW9kdWxlICE9PSAndW5kZWZpbmVkJyA/IGZhY3RvcnkoZXhwb3J0cykgOlxuXHR0eXBlb2YgZGVmaW5lID09PSAnZnVuY3Rpb24nICYmIGRlZmluZS5hbWQgPyBkZWZpbmUoWydleHBvcnRzJ10sIGZhY3RvcnkpIDpcblx0KGZhY3RvcnkoKGdsb2JhbC50b3BvanNvbiA9IGdsb2JhbC50b3BvanNvbiB8fCB7fSkpKTtcbn0odGhpcywgKGZ1bmN0aW9uIChleHBvcnRzKSB7ICd1c2Ugc3RyaWN0JztcblxuLy8gQ29tcHV0ZXMgdGhlIGJvdW5kaW5nIGJveCBvZiB0aGUgc3BlY2lmaWVkIGhhc2ggb2YgR2VvSlNPTiBvYmplY3RzLlxudmFyIGJvdW5kcyA9IGZ1bmN0aW9uKG9iamVjdHMpIHtcbiAgdmFyIHgwID0gSW5maW5pdHksXG4gICAgICB5MCA9IEluZmluaXR5LFxuICAgICAgeDEgPSAtSW5maW5pdHksXG4gICAgICB5MSA9IC1JbmZpbml0eTtcblxuICBmdW5jdGlvbiBib3VuZEdlb21ldHJ5KGdlb21ldHJ5KSB7XG4gICAgaWYgKGdlb21ldHJ5ICE9IG51bGwgJiYgYm91bmRHZW9tZXRyeVR5cGUuaGFzT3duUHJvcGVydHkoZ2VvbWV0cnkudHlwZSkpIGJvdW5kR2VvbWV0cnlUeXBlW2dlb21ldHJ5LnR5cGVdKGdlb21ldHJ5KTtcbiAgfVxuXG4gIHZhciBib3VuZEdlb21ldHJ5VHlwZSA9IHtcbiAgICBHZW9tZXRyeUNvbGxlY3Rpb246IGZ1bmN0aW9uKG8pIHsgby5nZW9tZXRyaWVzLmZvckVhY2goYm91bmRHZW9tZXRyeSk7IH0sXG4gICAgUG9pbnQ6IGZ1bmN0aW9uKG8pIHsgYm91bmRQb2ludChvLmNvb3JkaW5hdGVzKTsgfSxcbiAgICBNdWx0aVBvaW50OiBmdW5jdGlvbihvKSB7IG8uY29vcmRpbmF0ZXMuZm9yRWFjaChib3VuZFBvaW50KTsgfSxcbiAgICBMaW5lU3RyaW5nOiBmdW5jdGlvbihvKSB7IGJvdW5kTGluZShvLmFyY3MpOyB9LFxuICAgIE11bHRpTGluZVN0cmluZzogZnVuY3Rpb24obykgeyBvLmFyY3MuZm9yRWFjaChib3VuZExpbmUpOyB9LFxuICAgIFBvbHlnb246IGZ1bmN0aW9uKG8pIHsgby5hcmNzLmZvckVhY2goYm91bmRMaW5lKTsgfSxcbiAgICBNdWx0aVBvbHlnb246IGZ1bmN0aW9uKG8pIHsgby5hcmNzLmZvckVhY2goYm91bmRNdWx0aUxpbmUpOyB9XG4gIH07XG5cbiAgZnVuY3Rpb24gYm91bmRQb2ludChjb29yZGluYXRlcykge1xuICAgIHZhciB4ID0gY29vcmRpbmF0ZXNbMF0sXG4gICAgICAgIHkgPSBjb29yZGluYXRlc1sxXTtcbiAgICBpZiAoeCA8IHgwKSB4MCA9IHg7XG4gICAgaWYgKHggPiB4MSkgeDEgPSB4O1xuICAgIGlmICh5IDwgeTApIHkwID0geTtcbiAgICBpZiAoeSA+IHkxKSB5MSA9IHk7XG4gIH1cblxuICBmdW5jdGlvbiBib3VuZExpbmUoY29vcmRpbmF0ZXMpIHtcbiAgICBjb29yZGluYXRlcy5mb3JFYWNoKGJvdW5kUG9pbnQpO1xuICB9XG5cbiAgZnVuY3Rpb24gYm91bmRNdWx0aUxpbmUoY29vcmRpbmF0ZXMpIHtcbiAgICBjb29yZGluYXRlcy5mb3JFYWNoKGJvdW5kTGluZSk7XG4gIH1cblxuICBmb3IgKHZhciBrZXkgaW4gb2JqZWN0cykge1xuICAgIGJvdW5kR2VvbWV0cnkob2JqZWN0c1trZXldKTtcbiAgfVxuXG4gIHJldHVybiB4MSA+PSB4MCAmJiB5MSA+PSB5MCA/IFt4MCwgeTAsIHgxLCB5MV0gOiB1bmRlZmluZWQ7XG59O1xuXG52YXIgaGFzaHNldCA9IGZ1bmN0aW9uKHNpemUsIGhhc2gsIGVxdWFsLCB0eXBlLCBlbXB0eSkge1xuICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMykge1xuICAgIHR5cGUgPSBBcnJheTtcbiAgICBlbXB0eSA9IG51bGw7XG4gIH1cblxuICB2YXIgc3RvcmUgPSBuZXcgdHlwZShzaXplID0gMSA8PCBNYXRoLm1heCg0LCBNYXRoLmNlaWwoTWF0aC5sb2coc2l6ZSkgLyBNYXRoLkxOMikpKSxcbiAgICAgIG1hc2sgPSBzaXplIC0gMTtcblxuICBmb3IgKHZhciBpID0gMDsgaSA8IHNpemU7ICsraSkge1xuICAgIHN0b3JlW2ldID0gZW1wdHk7XG4gIH1cblxuICBmdW5jdGlvbiBhZGQodmFsdWUpIHtcbiAgICB2YXIgaW5kZXggPSBoYXNoKHZhbHVlKSAmIG1hc2ssXG4gICAgICAgIG1hdGNoID0gc3RvcmVbaW5kZXhdLFxuICAgICAgICBjb2xsaXNpb25zID0gMDtcbiAgICB3aGlsZSAobWF0Y2ggIT0gZW1wdHkpIHtcbiAgICAgIGlmIChlcXVhbChtYXRjaCwgdmFsdWUpKSByZXR1cm4gdHJ1ZTtcbiAgICAgIGlmICgrK2NvbGxpc2lvbnMgPj0gc2l6ZSkgdGhyb3cgbmV3IEVycm9yKFwiZnVsbCBoYXNoc2V0XCIpO1xuICAgICAgbWF0Y2ggPSBzdG9yZVtpbmRleCA9IChpbmRleCArIDEpICYgbWFza107XG4gICAgfVxuICAgIHN0b3JlW2luZGV4XSA9IHZhbHVlO1xuICAgIHJldHVybiB0cnVlO1xuICB9XG5cbiAgZnVuY3Rpb24gaGFzKHZhbHVlKSB7XG4gICAgdmFyIGluZGV4ID0gaGFzaCh2YWx1ZSkgJiBtYXNrLFxuICAgICAgICBtYXRjaCA9IHN0b3JlW2luZGV4XSxcbiAgICAgICAgY29sbGlzaW9ucyA9IDA7XG4gICAgd2hpbGUgKG1hdGNoICE9IGVtcHR5KSB7XG4gICAgICBpZiAoZXF1YWwobWF0Y2gsIHZhbHVlKSkgcmV0dXJuIHRydWU7XG4gICAgICBpZiAoKytjb2xsaXNpb25zID49IHNpemUpIGJyZWFrO1xuICAgICAgbWF0Y2ggPSBzdG9yZVtpbmRleCA9IChpbmRleCArIDEpICYgbWFza107XG4gICAgfVxuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHZhbHVlcygpIHtcbiAgICB2YXIgdmFsdWVzID0gW107XG4gICAgZm9yICh2YXIgaSA9IDAsIG4gPSBzdG9yZS5sZW5ndGg7IGkgPCBuOyArK2kpIHtcbiAgICAgIHZhciBtYXRjaCA9IHN0b3JlW2ldO1xuICAgICAgaWYgKG1hdGNoICE9IGVtcHR5KSB2YWx1ZXMucHVzaChtYXRjaCk7XG4gICAgfVxuICAgIHJldHVybiB2YWx1ZXM7XG4gIH1cblxuICByZXR1cm4ge1xuICAgIGFkZDogYWRkLFxuICAgIGhhczogaGFzLFxuICAgIHZhbHVlczogdmFsdWVzXG4gIH07XG59O1xuXG52YXIgaGFzaG1hcCA9IGZ1bmN0aW9uKHNpemUsIGhhc2gsIGVxdWFsLCBrZXlUeXBlLCBrZXlFbXB0eSwgdmFsdWVUeXBlKSB7XG4gIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAzKSB7XG4gICAga2V5VHlwZSA9IHZhbHVlVHlwZSA9IEFycmF5O1xuICAgIGtleUVtcHR5ID0gbnVsbDtcbiAgfVxuXG4gIHZhciBrZXlzdG9yZSA9IG5ldyBrZXlUeXBlKHNpemUgPSAxIDw8IE1hdGgubWF4KDQsIE1hdGguY2VpbChNYXRoLmxvZyhzaXplKSAvIE1hdGguTE4yKSkpLFxuICAgICAgdmFsc3RvcmUgPSBuZXcgdmFsdWVUeXBlKHNpemUpLFxuICAgICAgbWFzayA9IHNpemUgLSAxO1xuXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgc2l6ZTsgKytpKSB7XG4gICAga2V5c3RvcmVbaV0gPSBrZXlFbXB0eTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHNldChrZXksIHZhbHVlKSB7XG4gICAgdmFyIGluZGV4ID0gaGFzaChrZXkpICYgbWFzayxcbiAgICAgICAgbWF0Y2hLZXkgPSBrZXlzdG9yZVtpbmRleF0sXG4gICAgICAgIGNvbGxpc2lvbnMgPSAwO1xuICAgIHdoaWxlIChtYXRjaEtleSAhPSBrZXlFbXB0eSkge1xuICAgICAgaWYgKGVxdWFsKG1hdGNoS2V5LCBrZXkpKSByZXR1cm4gdmFsc3RvcmVbaW5kZXhdID0gdmFsdWU7XG4gICAgICBpZiAoKytjb2xsaXNpb25zID49IHNpemUpIHRocm93IG5ldyBFcnJvcihcImZ1bGwgaGFzaG1hcFwiKTtcbiAgICAgIG1hdGNoS2V5ID0ga2V5c3RvcmVbaW5kZXggPSAoaW5kZXggKyAxKSAmIG1hc2tdO1xuICAgIH1cbiAgICBrZXlzdG9yZVtpbmRleF0gPSBrZXk7XG4gICAgdmFsc3RvcmVbaW5kZXhdID0gdmFsdWU7XG4gICAgcmV0dXJuIHZhbHVlO1xuICB9XG5cbiAgZnVuY3Rpb24gbWF5YmVTZXQoa2V5LCB2YWx1ZSkge1xuICAgIHZhciBpbmRleCA9IGhhc2goa2V5KSAmIG1hc2ssXG4gICAgICAgIG1hdGNoS2V5ID0ga2V5c3RvcmVbaW5kZXhdLFxuICAgICAgICBjb2xsaXNpb25zID0gMDtcbiAgICB3aGlsZSAobWF0Y2hLZXkgIT0ga2V5RW1wdHkpIHtcbiAgICAgIGlmIChlcXVhbChtYXRjaEtleSwga2V5KSkgcmV0dXJuIHZhbHN0b3JlW2luZGV4XTtcbiAgICAgIGlmICgrK2NvbGxpc2lvbnMgPj0gc2l6ZSkgdGhyb3cgbmV3IEVycm9yKFwiZnVsbCBoYXNobWFwXCIpO1xuICAgICAgbWF0Y2hLZXkgPSBrZXlzdG9yZVtpbmRleCA9IChpbmRleCArIDEpICYgbWFza107XG4gICAgfVxuICAgIGtleXN0b3JlW2luZGV4XSA9IGtleTtcbiAgICB2YWxzdG9yZVtpbmRleF0gPSB2YWx1ZTtcbiAgICByZXR1cm4gdmFsdWU7XG4gIH1cblxuICBmdW5jdGlvbiBnZXQoa2V5LCBtaXNzaW5nVmFsdWUpIHtcbiAgICB2YXIgaW5kZXggPSBoYXNoKGtleSkgJiBtYXNrLFxuICAgICAgICBtYXRjaEtleSA9IGtleXN0b3JlW2luZGV4XSxcbiAgICAgICAgY29sbGlzaW9ucyA9IDA7XG4gICAgd2hpbGUgKG1hdGNoS2V5ICE9IGtleUVtcHR5KSB7XG4gICAgICBpZiAoZXF1YWwobWF0Y2hLZXksIGtleSkpIHJldHVybiB2YWxzdG9yZVtpbmRleF07XG4gICAgICBpZiAoKytjb2xsaXNpb25zID49IHNpemUpIGJyZWFrO1xuICAgICAgbWF0Y2hLZXkgPSBrZXlzdG9yZVtpbmRleCA9IChpbmRleCArIDEpICYgbWFza107XG4gICAgfVxuICAgIHJldHVybiBtaXNzaW5nVmFsdWU7XG4gIH1cblxuICBmdW5jdGlvbiBrZXlzKCkge1xuICAgIHZhciBrZXlzID0gW107XG4gICAgZm9yICh2YXIgaSA9IDAsIG4gPSBrZXlzdG9yZS5sZW5ndGg7IGkgPCBuOyArK2kpIHtcbiAgICAgIHZhciBtYXRjaEtleSA9IGtleXN0b3JlW2ldO1xuICAgICAgaWYgKG1hdGNoS2V5ICE9IGtleUVtcHR5KSBrZXlzLnB1c2gobWF0Y2hLZXkpO1xuICAgIH1cbiAgICByZXR1cm4ga2V5cztcbiAgfVxuXG4gIHJldHVybiB7XG4gICAgc2V0OiBzZXQsXG4gICAgbWF5YmVTZXQ6IG1heWJlU2V0LCAvLyBzZXQgaWYgdW5zZXRcbiAgICBnZXQ6IGdldCxcbiAgICBrZXlzOiBrZXlzXG4gIH07XG59O1xuXG52YXIgZXF1YWxQb2ludCA9IGZ1bmN0aW9uKHBvaW50QSwgcG9pbnRCKSB7XG4gIHJldHVybiBwb2ludEFbMF0gPT09IHBvaW50QlswXSAmJiBwb2ludEFbMV0gPT09IHBvaW50QlsxXTtcbn07XG5cbi8vIFRPRE8gaWYgcXVhbnRpemVkLCB1c2Ugc2ltcGxlciBJbnQzMiBoYXNoaW5nP1xuXG52YXIgYnVmZmVyID0gbmV3IEFycmF5QnVmZmVyKDE2KTtcbnZhciBmbG9hdHMgPSBuZXcgRmxvYXQ2NEFycmF5KGJ1ZmZlcik7XG52YXIgdWludHMgPSBuZXcgVWludDMyQXJyYXkoYnVmZmVyKTtcblxudmFyIGhhc2hQb2ludCA9IGZ1bmN0aW9uKHBvaW50KSB7XG4gIGZsb2F0c1swXSA9IHBvaW50WzBdO1xuICBmbG9hdHNbMV0gPSBwb2ludFsxXTtcbiAgdmFyIGhhc2ggPSB1aW50c1swXSBeIHVpbnRzWzFdO1xuICBoYXNoID0gaGFzaCA8PCA1IF4gaGFzaCA+PiA3IF4gdWludHNbMl0gXiB1aW50c1szXTtcbiAgcmV0dXJuIGhhc2ggJiAweDdmZmZmZmZmO1xufTtcblxuLy8gR2l2ZW4gYW4gZXh0cmFjdGVkIChwcmUtKXRvcG9sb2d5LCBpZGVudGlmaWVzIGFsbCBvZiB0aGUganVuY3Rpb25zLiBUaGVzZSBhcmVcbi8vIHRoZSBwb2ludHMgYXQgd2hpY2ggYXJjcyAobGluZXMgb3IgcmluZ3MpIHdpbGwgbmVlZCB0byBiZSBjdXQgc28gdGhhdCBlYWNoXG4vLyBhcmMgaXMgcmVwcmVzZW50ZWQgdW5pcXVlbHkuXG4vL1xuLy8gQSBqdW5jdGlvbiBpcyBhIHBvaW50IHdoZXJlIGF0IGxlYXN0IG9uZSBhcmMgZGV2aWF0ZXMgZnJvbSBhbm90aGVyIGFyYyBnb2luZ1xuLy8gdGhyb3VnaCB0aGUgc2FtZSBwb2ludC4gRm9yIGV4YW1wbGUsIGNvbnNpZGVyIHRoZSBwb2ludCBCLiBJZiB0aGVyZSBpcyBhIGFyY1xuLy8gdGhyb3VnaCBBQkMgYW5kIGFub3RoZXIgYXJjIHRocm91Z2ggQ0JBLCB0aGVuIEIgaXMgbm90IGEganVuY3Rpb24gYmVjYXVzZSBpblxuLy8gYm90aCBjYXNlcyB0aGUgYWRqYWNlbnQgcG9pbnQgcGFpcnMgYXJlIHtBLEN9LiBIb3dldmVyLCBpZiB0aGVyZSBpcyBhblxuLy8gYWRkaXRpb25hbCBhcmMgQUJELCB0aGVuIHtBLER9ICE9IHtBLEN9LCBhbmQgdGh1cyBCIGJlY29tZXMgYSBqdW5jdGlvbi5cbi8vXG4vLyBGb3IgYSBjbG9zZWQgcmluZyBBQkNBLCB0aGUgZmlyc3QgcG9pbnQgQeKAmXMgYWRqYWNlbnQgcG9pbnRzIGFyZSB0aGUgc2Vjb25kXG4vLyBhbmQgbGFzdCBwb2ludCB7QixDfS4gRm9yIGEgbGluZSwgdGhlIGZpcnN0IGFuZCBsYXN0IHBvaW50IGFyZSBhbHdheXNcbi8vIGNvbnNpZGVyZWQganVuY3Rpb25zLCBldmVuIGlmIHRoZSBsaW5lIGlzIGNsb3NlZDsgdGhpcyBlbnN1cmVzIHRoYXQgYSBjbG9zZWRcbi8vIGxpbmUgaXMgbmV2ZXIgcm90YXRlZC5cbnZhciBqb2luID0gZnVuY3Rpb24odG9wb2xvZ3kpIHtcbiAgdmFyIGNvb3JkaW5hdGVzID0gdG9wb2xvZ3kuY29vcmRpbmF0ZXMsXG4gICAgICBsaW5lcyA9IHRvcG9sb2d5LmxpbmVzLFxuICAgICAgcmluZ3MgPSB0b3BvbG9neS5yaW5ncyxcbiAgICAgIGluZGV4ZXMgPSBpbmRleCgpLFxuICAgICAgdmlzaXRlZEJ5SW5kZXggPSBuZXcgSW50MzJBcnJheShjb29yZGluYXRlcy5sZW5ndGgpLFxuICAgICAgbGVmdEJ5SW5kZXggPSBuZXcgSW50MzJBcnJheShjb29yZGluYXRlcy5sZW5ndGgpLFxuICAgICAgcmlnaHRCeUluZGV4ID0gbmV3IEludDMyQXJyYXkoY29vcmRpbmF0ZXMubGVuZ3RoKSxcbiAgICAgIGp1bmN0aW9uQnlJbmRleCA9IG5ldyBJbnQ4QXJyYXkoY29vcmRpbmF0ZXMubGVuZ3RoKSxcbiAgICAgIGp1bmN0aW9uQ291bnQgPSAwLCAvLyB1cHBlciBib3VuZCBvbiBudW1iZXIgb2YganVuY3Rpb25zXG4gICAgICBpLCBuLFxuICAgICAgcHJldmlvdXNJbmRleCxcbiAgICAgIGN1cnJlbnRJbmRleCxcbiAgICAgIG5leHRJbmRleDtcblxuICBmb3IgKGkgPSAwLCBuID0gY29vcmRpbmF0ZXMubGVuZ3RoOyBpIDwgbjsgKytpKSB7XG4gICAgdmlzaXRlZEJ5SW5kZXhbaV0gPSBsZWZ0QnlJbmRleFtpXSA9IHJpZ2h0QnlJbmRleFtpXSA9IC0xO1xuICB9XG5cbiAgZm9yIChpID0gMCwgbiA9IGxpbmVzLmxlbmd0aDsgaSA8IG47ICsraSkge1xuICAgIHZhciBsaW5lID0gbGluZXNbaV0sXG4gICAgICAgIGxpbmVTdGFydCA9IGxpbmVbMF0sXG4gICAgICAgIGxpbmVFbmQgPSBsaW5lWzFdO1xuICAgIGN1cnJlbnRJbmRleCA9IGluZGV4ZXNbbGluZVN0YXJ0XTtcbiAgICBuZXh0SW5kZXggPSBpbmRleGVzWysrbGluZVN0YXJ0XTtcbiAgICArK2p1bmN0aW9uQ291bnQsIGp1bmN0aW9uQnlJbmRleFtjdXJyZW50SW5kZXhdID0gMTsgLy8gc3RhcnRcbiAgICB3aGlsZSAoKytsaW5lU3RhcnQgPD0gbGluZUVuZCkge1xuICAgICAgc2VxdWVuY2UoaSwgcHJldmlvdXNJbmRleCA9IGN1cnJlbnRJbmRleCwgY3VycmVudEluZGV4ID0gbmV4dEluZGV4LCBuZXh0SW5kZXggPSBpbmRleGVzW2xpbmVTdGFydF0pO1xuICAgIH1cbiAgICArK2p1bmN0aW9uQ291bnQsIGp1bmN0aW9uQnlJbmRleFtuZXh0SW5kZXhdID0gMTsgLy8gZW5kXG4gIH1cblxuICBmb3IgKGkgPSAwLCBuID0gY29vcmRpbmF0ZXMubGVuZ3RoOyBpIDwgbjsgKytpKSB7XG4gICAgdmlzaXRlZEJ5SW5kZXhbaV0gPSAtMTtcbiAgfVxuXG4gIGZvciAoaSA9IDAsIG4gPSByaW5ncy5sZW5ndGg7IGkgPCBuOyArK2kpIHtcbiAgICB2YXIgcmluZyA9IHJpbmdzW2ldLFxuICAgICAgICByaW5nU3RhcnQgPSByaW5nWzBdICsgMSxcbiAgICAgICAgcmluZ0VuZCA9IHJpbmdbMV07XG4gICAgcHJldmlvdXNJbmRleCA9IGluZGV4ZXNbcmluZ0VuZCAtIDFdO1xuICAgIGN1cnJlbnRJbmRleCA9IGluZGV4ZXNbcmluZ1N0YXJ0IC0gMV07XG4gICAgbmV4dEluZGV4ID0gaW5kZXhlc1tyaW5nU3RhcnRdO1xuICAgIHNlcXVlbmNlKGksIHByZXZpb3VzSW5kZXgsIGN1cnJlbnRJbmRleCwgbmV4dEluZGV4KTtcbiAgICB3aGlsZSAoKytyaW5nU3RhcnQgPD0gcmluZ0VuZCkge1xuICAgICAgc2VxdWVuY2UoaSwgcHJldmlvdXNJbmRleCA9IGN1cnJlbnRJbmRleCwgY3VycmVudEluZGV4ID0gbmV4dEluZGV4LCBuZXh0SW5kZXggPSBpbmRleGVzW3JpbmdTdGFydF0pO1xuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIHNlcXVlbmNlKGksIHByZXZpb3VzSW5kZXgsIGN1cnJlbnRJbmRleCwgbmV4dEluZGV4KSB7XG4gICAgaWYgKHZpc2l0ZWRCeUluZGV4W2N1cnJlbnRJbmRleF0gPT09IGkpIHJldHVybjsgLy8gaWdub3JlIHNlbGYtaW50ZXJzZWN0aW9uXG4gICAgdmlzaXRlZEJ5SW5kZXhbY3VycmVudEluZGV4XSA9IGk7XG4gICAgdmFyIGxlZnRJbmRleCA9IGxlZnRCeUluZGV4W2N1cnJlbnRJbmRleF07XG4gICAgaWYgKGxlZnRJbmRleCA+PSAwKSB7XG4gICAgICB2YXIgcmlnaHRJbmRleCA9IHJpZ2h0QnlJbmRleFtjdXJyZW50SW5kZXhdO1xuICAgICAgaWYgKChsZWZ0SW5kZXggIT09IHByZXZpb3VzSW5kZXggfHwgcmlnaHRJbmRleCAhPT0gbmV4dEluZGV4KVxuICAgICAgICAmJiAobGVmdEluZGV4ICE9PSBuZXh0SW5kZXggfHwgcmlnaHRJbmRleCAhPT0gcHJldmlvdXNJbmRleCkpIHtcbiAgICAgICAgKytqdW5jdGlvbkNvdW50LCBqdW5jdGlvbkJ5SW5kZXhbY3VycmVudEluZGV4XSA9IDE7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIGxlZnRCeUluZGV4W2N1cnJlbnRJbmRleF0gPSBwcmV2aW91c0luZGV4O1xuICAgICAgcmlnaHRCeUluZGV4W2N1cnJlbnRJbmRleF0gPSBuZXh0SW5kZXg7XG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gaW5kZXgoKSB7XG4gICAgdmFyIGluZGV4QnlQb2ludCA9IGhhc2htYXAoY29vcmRpbmF0ZXMubGVuZ3RoICogMS40LCBoYXNoSW5kZXgsIGVxdWFsSW5kZXgsIEludDMyQXJyYXksIC0xLCBJbnQzMkFycmF5KSxcbiAgICAgICAgaW5kZXhlcyA9IG5ldyBJbnQzMkFycmF5KGNvb3JkaW5hdGVzLmxlbmd0aCk7XG5cbiAgICBmb3IgKHZhciBpID0gMCwgbiA9IGNvb3JkaW5hdGVzLmxlbmd0aDsgaSA8IG47ICsraSkge1xuICAgICAgaW5kZXhlc1tpXSA9IGluZGV4QnlQb2ludC5tYXliZVNldChpLCBpKTtcbiAgICB9XG5cbiAgICByZXR1cm4gaW5kZXhlcztcbiAgfVxuXG4gIGZ1bmN0aW9uIGhhc2hJbmRleChpKSB7XG4gICAgcmV0dXJuIGhhc2hQb2ludChjb29yZGluYXRlc1tpXSk7XG4gIH1cblxuICBmdW5jdGlvbiBlcXVhbEluZGV4KGksIGopIHtcbiAgICByZXR1cm4gZXF1YWxQb2ludChjb29yZGluYXRlc1tpXSwgY29vcmRpbmF0ZXNbal0pO1xuICB9XG5cbiAgdmlzaXRlZEJ5SW5kZXggPSBsZWZ0QnlJbmRleCA9IHJpZ2h0QnlJbmRleCA9IG51bGw7XG5cbiAgdmFyIGp1bmN0aW9uQnlQb2ludCA9IGhhc2hzZXQoanVuY3Rpb25Db3VudCAqIDEuNCwgaGFzaFBvaW50LCBlcXVhbFBvaW50KSwgajtcblxuICAvLyBDb252ZXJ0IGJhY2sgdG8gYSBzdGFuZGFyZCBoYXNoc2V0IGJ5IHBvaW50IGZvciBjYWxsZXIgY29udmVuaWVuY2UuXG4gIGZvciAoaSA9IDAsIG4gPSBjb29yZGluYXRlcy5sZW5ndGg7IGkgPCBuOyArK2kpIHtcbiAgICBpZiAoanVuY3Rpb25CeUluZGV4W2ogPSBpbmRleGVzW2ldXSkge1xuICAgICAganVuY3Rpb25CeVBvaW50LmFkZChjb29yZGluYXRlc1tqXSk7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIGp1bmN0aW9uQnlQb2ludDtcbn07XG5cbi8vIEdpdmVuIGFuIGV4dHJhY3RlZCAocHJlLSl0b3BvbG9neSwgY3V0cyAob3Igcm90YXRlcykgYXJjcyBzbyB0aGF0IGFsbCBzaGFyZWRcbi8vIHBvaW50IHNlcXVlbmNlcyBhcmUgaWRlbnRpZmllZC4gVGhlIHRvcG9sb2d5IGNhbiB0aGVuIGJlIHN1YnNlcXVlbnRseSBkZWR1cGVkXG4vLyB0byByZW1vdmUgZXhhY3QgZHVwbGljYXRlIGFyY3MuXG52YXIgY3V0ID0gZnVuY3Rpb24odG9wb2xvZ3kpIHtcbiAgdmFyIGp1bmN0aW9ucyA9IGpvaW4odG9wb2xvZ3kpLFxuICAgICAgY29vcmRpbmF0ZXMgPSB0b3BvbG9neS5jb29yZGluYXRlcyxcbiAgICAgIGxpbmVzID0gdG9wb2xvZ3kubGluZXMsXG4gICAgICByaW5ncyA9IHRvcG9sb2d5LnJpbmdzLFxuICAgICAgbmV4dCxcbiAgICAgIGksIG47XG5cbiAgZm9yIChpID0gMCwgbiA9IGxpbmVzLmxlbmd0aDsgaSA8IG47ICsraSkge1xuICAgIHZhciBsaW5lID0gbGluZXNbaV0sXG4gICAgICAgIGxpbmVNaWQgPSBsaW5lWzBdLFxuICAgICAgICBsaW5lRW5kID0gbGluZVsxXTtcbiAgICB3aGlsZSAoKytsaW5lTWlkIDwgbGluZUVuZCkge1xuICAgICAgaWYgKGp1bmN0aW9ucy5oYXMoY29vcmRpbmF0ZXNbbGluZU1pZF0pKSB7XG4gICAgICAgIG5leHQgPSB7MDogbGluZU1pZCwgMTogbGluZVsxXX07XG4gICAgICAgIGxpbmVbMV0gPSBsaW5lTWlkO1xuICAgICAgICBsaW5lID0gbGluZS5uZXh0ID0gbmV4dDtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBmb3IgKGkgPSAwLCBuID0gcmluZ3MubGVuZ3RoOyBpIDwgbjsgKytpKSB7XG4gICAgdmFyIHJpbmcgPSByaW5nc1tpXSxcbiAgICAgICAgcmluZ1N0YXJ0ID0gcmluZ1swXSxcbiAgICAgICAgcmluZ01pZCA9IHJpbmdTdGFydCxcbiAgICAgICAgcmluZ0VuZCA9IHJpbmdbMV0sXG4gICAgICAgIHJpbmdGaXhlZCA9IGp1bmN0aW9ucy5oYXMoY29vcmRpbmF0ZXNbcmluZ1N0YXJ0XSk7XG4gICAgd2hpbGUgKCsrcmluZ01pZCA8IHJpbmdFbmQpIHtcbiAgICAgIGlmIChqdW5jdGlvbnMuaGFzKGNvb3JkaW5hdGVzW3JpbmdNaWRdKSkge1xuICAgICAgICBpZiAocmluZ0ZpeGVkKSB7XG4gICAgICAgICAgbmV4dCA9IHswOiByaW5nTWlkLCAxOiByaW5nWzFdfTtcbiAgICAgICAgICByaW5nWzFdID0gcmluZ01pZDtcbiAgICAgICAgICByaW5nID0gcmluZy5uZXh0ID0gbmV4dDtcbiAgICAgICAgfSBlbHNlIHsgLy8gRm9yIHRoZSBmaXJzdCBqdW5jdGlvbiwgd2UgY2FuIHJvdGF0ZSByYXRoZXIgdGhhbiBjdXQuXG4gICAgICAgICAgcm90YXRlQXJyYXkoY29vcmRpbmF0ZXMsIHJpbmdTdGFydCwgcmluZ0VuZCwgcmluZ0VuZCAtIHJpbmdNaWQpO1xuICAgICAgICAgIGNvb3JkaW5hdGVzW3JpbmdFbmRdID0gY29vcmRpbmF0ZXNbcmluZ1N0YXJ0XTtcbiAgICAgICAgICByaW5nRml4ZWQgPSB0cnVlO1xuICAgICAgICAgIHJpbmdNaWQgPSByaW5nU3RhcnQ7IC8vIHJlc3RhcnQ7IHdlIG1heSBoYXZlIHNraXBwZWQganVuY3Rpb25zXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICByZXR1cm4gdG9wb2xvZ3k7XG59O1xuXG5mdW5jdGlvbiByb3RhdGVBcnJheShhcnJheSwgc3RhcnQsIGVuZCwgb2Zmc2V0KSB7XG4gIHJldmVyc2UoYXJyYXksIHN0YXJ0LCBlbmQpO1xuICByZXZlcnNlKGFycmF5LCBzdGFydCwgc3RhcnQgKyBvZmZzZXQpO1xuICByZXZlcnNlKGFycmF5LCBzdGFydCArIG9mZnNldCwgZW5kKTtcbn1cblxuZnVuY3Rpb24gcmV2ZXJzZShhcnJheSwgc3RhcnQsIGVuZCkge1xuICBmb3IgKHZhciBtaWQgPSBzdGFydCArICgoZW5kLS0gLSBzdGFydCkgPj4gMSksIHQ7IHN0YXJ0IDwgbWlkOyArK3N0YXJ0LCAtLWVuZCkge1xuICAgIHQgPSBhcnJheVtzdGFydF0sIGFycmF5W3N0YXJ0XSA9IGFycmF5W2VuZF0sIGFycmF5W2VuZF0gPSB0O1xuICB9XG59XG5cbi8vIEdpdmVuIGEgY3V0IHRvcG9sb2d5LCBjb21iaW5lcyBkdXBsaWNhdGUgYXJjcy5cbnZhciBkZWR1cCA9IGZ1bmN0aW9uKHRvcG9sb2d5KSB7XG4gIHZhciBjb29yZGluYXRlcyA9IHRvcG9sb2d5LmNvb3JkaW5hdGVzLFxuICAgICAgbGluZXMgPSB0b3BvbG9neS5saW5lcywgbGluZSxcbiAgICAgIHJpbmdzID0gdG9wb2xvZ3kucmluZ3MsIHJpbmcsXG4gICAgICBhcmNDb3VudCA9IGxpbmVzLmxlbmd0aCArIHJpbmdzLmxlbmd0aCxcbiAgICAgIGksIG47XG5cbiAgZGVsZXRlIHRvcG9sb2d5LmxpbmVzO1xuICBkZWxldGUgdG9wb2xvZ3kucmluZ3M7XG5cbiAgLy8gQ291bnQgdGhlIG51bWJlciBvZiAobm9uLXVuaXF1ZSkgYXJjcyB0byBpbml0aWFsaXplIHRoZSBoYXNobWFwIHNhZmVseS5cbiAgZm9yIChpID0gMCwgbiA9IGxpbmVzLmxlbmd0aDsgaSA8IG47ICsraSkge1xuICAgIGxpbmUgPSBsaW5lc1tpXTsgd2hpbGUgKGxpbmUgPSBsaW5lLm5leHQpICsrYXJjQ291bnQ7XG4gIH1cbiAgZm9yIChpID0gMCwgbiA9IHJpbmdzLmxlbmd0aDsgaSA8IG47ICsraSkge1xuICAgIHJpbmcgPSByaW5nc1tpXTsgd2hpbGUgKHJpbmcgPSByaW5nLm5leHQpICsrYXJjQ291bnQ7XG4gIH1cblxuICB2YXIgYXJjc0J5RW5kID0gaGFzaG1hcChhcmNDb3VudCAqIDIgKiAxLjQsIGhhc2hQb2ludCwgZXF1YWxQb2ludCksXG4gICAgICBhcmNzID0gdG9wb2xvZ3kuYXJjcyA9IFtdO1xuXG4gIGZvciAoaSA9IDAsIG4gPSBsaW5lcy5sZW5ndGg7IGkgPCBuOyArK2kpIHtcbiAgICBsaW5lID0gbGluZXNbaV07XG4gICAgZG8ge1xuICAgICAgZGVkdXBMaW5lKGxpbmUpO1xuICAgIH0gd2hpbGUgKGxpbmUgPSBsaW5lLm5leHQpO1xuICB9XG5cbiAgZm9yIChpID0gMCwgbiA9IHJpbmdzLmxlbmd0aDsgaSA8IG47ICsraSkge1xuICAgIHJpbmcgPSByaW5nc1tpXTtcbiAgICBpZiAocmluZy5uZXh0KSB7IC8vIGFyYyBpcyBubyBsb25nZXIgY2xvc2VkXG4gICAgICBkbyB7XG4gICAgICAgIGRlZHVwTGluZShyaW5nKTtcbiAgICAgIH0gd2hpbGUgKHJpbmcgPSByaW5nLm5leHQpO1xuICAgIH0gZWxzZSB7XG4gICAgICBkZWR1cFJpbmcocmluZyk7XG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gZGVkdXBMaW5lKGFyYykge1xuICAgIHZhciBzdGFydFBvaW50LFxuICAgICAgICBlbmRQb2ludCxcbiAgICAgICAgc3RhcnRBcmNzLCBzdGFydEFyYyxcbiAgICAgICAgZW5kQXJjcywgZW5kQXJjLFxuICAgICAgICBpLCBuO1xuXG4gICAgLy8gRG9lcyB0aGlzIGFyYyBtYXRjaCBhbiBleGlzdGluZyBhcmMgaW4gb3JkZXI/XG4gICAgaWYgKHN0YXJ0QXJjcyA9IGFyY3NCeUVuZC5nZXQoc3RhcnRQb2ludCA9IGNvb3JkaW5hdGVzW2FyY1swXV0pKSB7XG4gICAgICBmb3IgKGkgPSAwLCBuID0gc3RhcnRBcmNzLmxlbmd0aDsgaSA8IG47ICsraSkge1xuICAgICAgICBzdGFydEFyYyA9IHN0YXJ0QXJjc1tpXTtcbiAgICAgICAgaWYgKGVxdWFsTGluZShzdGFydEFyYywgYXJjKSkge1xuICAgICAgICAgIGFyY1swXSA9IHN0YXJ0QXJjWzBdO1xuICAgICAgICAgIGFyY1sxXSA9IHN0YXJ0QXJjWzFdO1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIC8vIERvZXMgdGhpcyBhcmMgbWF0Y2ggYW4gZXhpc3RpbmcgYXJjIGluIHJldmVyc2Ugb3JkZXI/XG4gICAgaWYgKGVuZEFyY3MgPSBhcmNzQnlFbmQuZ2V0KGVuZFBvaW50ID0gY29vcmRpbmF0ZXNbYXJjWzFdXSkpIHtcbiAgICAgIGZvciAoaSA9IDAsIG4gPSBlbmRBcmNzLmxlbmd0aDsgaSA8IG47ICsraSkge1xuICAgICAgICBlbmRBcmMgPSBlbmRBcmNzW2ldO1xuICAgICAgICBpZiAocmV2ZXJzZUVxdWFsTGluZShlbmRBcmMsIGFyYykpIHtcbiAgICAgICAgICBhcmNbMV0gPSBlbmRBcmNbMF07XG4gICAgICAgICAgYXJjWzBdID0gZW5kQXJjWzFdO1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIGlmIChzdGFydEFyY3MpIHN0YXJ0QXJjcy5wdXNoKGFyYyk7IGVsc2UgYXJjc0J5RW5kLnNldChzdGFydFBvaW50LCBbYXJjXSk7XG4gICAgaWYgKGVuZEFyY3MpIGVuZEFyY3MucHVzaChhcmMpOyBlbHNlIGFyY3NCeUVuZC5zZXQoZW5kUG9pbnQsIFthcmNdKTtcbiAgICBhcmNzLnB1c2goYXJjKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGRlZHVwUmluZyhhcmMpIHtcbiAgICB2YXIgZW5kUG9pbnQsXG4gICAgICAgIGVuZEFyY3MsXG4gICAgICAgIGVuZEFyYyxcbiAgICAgICAgaSwgbjtcblxuICAgIC8vIERvZXMgdGhpcyBhcmMgbWF0Y2ggYW4gZXhpc3RpbmcgbGluZSBpbiBvcmRlciwgb3IgcmV2ZXJzZSBvcmRlcj9cbiAgICAvLyBSaW5ncyBhcmUgY2xvc2VkLCBzbyB0aGVpciBzdGFydCBwb2ludCBhbmQgZW5kIHBvaW50IGlzIHRoZSBzYW1lLlxuICAgIGlmIChlbmRBcmNzID0gYXJjc0J5RW5kLmdldChlbmRQb2ludCA9IGNvb3JkaW5hdGVzW2FyY1swXV0pKSB7XG4gICAgICBmb3IgKGkgPSAwLCBuID0gZW5kQXJjcy5sZW5ndGg7IGkgPCBuOyArK2kpIHtcbiAgICAgICAgZW5kQXJjID0gZW5kQXJjc1tpXTtcbiAgICAgICAgaWYgKGVxdWFsUmluZyhlbmRBcmMsIGFyYykpIHtcbiAgICAgICAgICBhcmNbMF0gPSBlbmRBcmNbMF07XG4gICAgICAgICAgYXJjWzFdID0gZW5kQXJjWzFdO1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBpZiAocmV2ZXJzZUVxdWFsUmluZyhlbmRBcmMsIGFyYykpIHtcbiAgICAgICAgICBhcmNbMF0gPSBlbmRBcmNbMV07XG4gICAgICAgICAgYXJjWzFdID0gZW5kQXJjWzBdO1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIC8vIE90aGVyd2lzZSwgZG9lcyB0aGlzIGFyYyBtYXRjaCBhbiBleGlzdGluZyByaW5nIGluIG9yZGVyLCBvciByZXZlcnNlIG9yZGVyP1xuICAgIGlmIChlbmRBcmNzID0gYXJjc0J5RW5kLmdldChlbmRQb2ludCA9IGNvb3JkaW5hdGVzW2FyY1swXSArIGZpbmRNaW5pbXVtT2Zmc2V0KGFyYyldKSkge1xuICAgICAgZm9yIChpID0gMCwgbiA9IGVuZEFyY3MubGVuZ3RoOyBpIDwgbjsgKytpKSB7XG4gICAgICAgIGVuZEFyYyA9IGVuZEFyY3NbaV07XG4gICAgICAgIGlmIChlcXVhbFJpbmcoZW5kQXJjLCBhcmMpKSB7XG4gICAgICAgICAgYXJjWzBdID0gZW5kQXJjWzBdO1xuICAgICAgICAgIGFyY1sxXSA9IGVuZEFyY1sxXTtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHJldmVyc2VFcXVhbFJpbmcoZW5kQXJjLCBhcmMpKSB7XG4gICAgICAgICAgYXJjWzBdID0gZW5kQXJjWzFdO1xuICAgICAgICAgIGFyY1sxXSA9IGVuZEFyY1swXTtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAoZW5kQXJjcykgZW5kQXJjcy5wdXNoKGFyYyk7IGVsc2UgYXJjc0J5RW5kLnNldChlbmRQb2ludCwgW2FyY10pO1xuICAgIGFyY3MucHVzaChhcmMpO1xuICB9XG5cbiAgZnVuY3Rpb24gZXF1YWxMaW5lKGFyY0EsIGFyY0IpIHtcbiAgICB2YXIgaWEgPSBhcmNBWzBdLCBpYiA9IGFyY0JbMF0sXG4gICAgICAgIGphID0gYXJjQVsxXSwgamIgPSBhcmNCWzFdO1xuICAgIGlmIChpYSAtIGphICE9PSBpYiAtIGpiKSByZXR1cm4gZmFsc2U7XG4gICAgZm9yICg7IGlhIDw9IGphOyArK2lhLCArK2liKSBpZiAoIWVxdWFsUG9pbnQoY29vcmRpbmF0ZXNbaWFdLCBjb29yZGluYXRlc1tpYl0pKSByZXR1cm4gZmFsc2U7XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cblxuICBmdW5jdGlvbiByZXZlcnNlRXF1YWxMaW5lKGFyY0EsIGFyY0IpIHtcbiAgICB2YXIgaWEgPSBhcmNBWzBdLCBpYiA9IGFyY0JbMF0sXG4gICAgICAgIGphID0gYXJjQVsxXSwgamIgPSBhcmNCWzFdO1xuICAgIGlmIChpYSAtIGphICE9PSBpYiAtIGpiKSByZXR1cm4gZmFsc2U7XG4gICAgZm9yICg7IGlhIDw9IGphOyArK2lhLCAtLWpiKSBpZiAoIWVxdWFsUG9pbnQoY29vcmRpbmF0ZXNbaWFdLCBjb29yZGluYXRlc1tqYl0pKSByZXR1cm4gZmFsc2U7XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cblxuICBmdW5jdGlvbiBlcXVhbFJpbmcoYXJjQSwgYXJjQikge1xuICAgIHZhciBpYSA9IGFyY0FbMF0sIGliID0gYXJjQlswXSxcbiAgICAgICAgamEgPSBhcmNBWzFdLCBqYiA9IGFyY0JbMV0sXG4gICAgICAgIG4gPSBqYSAtIGlhO1xuICAgIGlmIChuICE9PSBqYiAtIGliKSByZXR1cm4gZmFsc2U7XG4gICAgdmFyIGthID0gZmluZE1pbmltdW1PZmZzZXQoYXJjQSksXG4gICAgICAgIGtiID0gZmluZE1pbmltdW1PZmZzZXQoYXJjQik7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBuOyArK2kpIHtcbiAgICAgIGlmICghZXF1YWxQb2ludChjb29yZGluYXRlc1tpYSArIChpICsga2EpICUgbl0sIGNvb3JkaW5hdGVzW2liICsgKGkgKyBrYikgJSBuXSkpIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cblxuICBmdW5jdGlvbiByZXZlcnNlRXF1YWxSaW5nKGFyY0EsIGFyY0IpIHtcbiAgICB2YXIgaWEgPSBhcmNBWzBdLCBpYiA9IGFyY0JbMF0sXG4gICAgICAgIGphID0gYXJjQVsxXSwgamIgPSBhcmNCWzFdLFxuICAgICAgICBuID0gamEgLSBpYTtcbiAgICBpZiAobiAhPT0gamIgLSBpYikgcmV0dXJuIGZhbHNlO1xuICAgIHZhciBrYSA9IGZpbmRNaW5pbXVtT2Zmc2V0KGFyY0EpLFxuICAgICAgICBrYiA9IG4gLSBmaW5kTWluaW11bU9mZnNldChhcmNCKTtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IG47ICsraSkge1xuICAgICAgaWYgKCFlcXVhbFBvaW50KGNvb3JkaW5hdGVzW2lhICsgKGkgKyBrYSkgJSBuXSwgY29vcmRpbmF0ZXNbamIgLSAoaSArIGtiKSAlIG5dKSkgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuXG4gIC8vIFJpbmdzIGFyZSByb3RhdGVkIHRvIGEgY29uc2lzdGVudCwgYnV0IGFyYml0cmFyeSwgc3RhcnQgcG9pbnQuXG4gIC8vIFRoaXMgaXMgbmVjZXNzYXJ5IHRvIGRldGVjdCB3aGVuIGEgcmluZyBhbmQgYSByb3RhdGVkIGNvcHkgYXJlIGR1cGVzLlxuICBmdW5jdGlvbiBmaW5kTWluaW11bU9mZnNldChhcmMpIHtcbiAgICB2YXIgc3RhcnQgPSBhcmNbMF0sXG4gICAgICAgIGVuZCA9IGFyY1sxXSxcbiAgICAgICAgbWlkID0gc3RhcnQsXG4gICAgICAgIG1pbmltdW0gPSBtaWQsXG4gICAgICAgIG1pbmltdW1Qb2ludCA9IGNvb3JkaW5hdGVzW21pZF07XG4gICAgd2hpbGUgKCsrbWlkIDwgZW5kKSB7XG4gICAgICB2YXIgcG9pbnQgPSBjb29yZGluYXRlc1ttaWRdO1xuICAgICAgaWYgKHBvaW50WzBdIDwgbWluaW11bVBvaW50WzBdIHx8IHBvaW50WzBdID09PSBtaW5pbXVtUG9pbnRbMF0gJiYgcG9pbnRbMV0gPCBtaW5pbXVtUG9pbnRbMV0pIHtcbiAgICAgICAgbWluaW11bSA9IG1pZDtcbiAgICAgICAgbWluaW11bVBvaW50ID0gcG9pbnQ7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBtaW5pbXVtIC0gc3RhcnQ7XG4gIH1cblxuICByZXR1cm4gdG9wb2xvZ3k7XG59O1xuXG4vLyBHaXZlbiBhbiBhcnJheSBvZiBhcmNzIGluIGFic29sdXRlIChidXQgYWxyZWFkeSBxdWFudGl6ZWQhKSBjb29yZGluYXRlcyxcbi8vIGNvbnZlcnRzIHRvIGZpeGVkLXBvaW50IGRlbHRhIGVuY29kaW5nLlxuLy8gVGhpcyBpcyBhIGRlc3RydWN0aXZlIG9wZXJhdGlvbiB0aGF0IG1vZGlmaWVzIHRoZSBnaXZlbiBhcmNzIVxudmFyIGRlbHRhID0gZnVuY3Rpb24oYXJjcykge1xuICB2YXIgaSA9IC0xLFxuICAgICAgbiA9IGFyY3MubGVuZ3RoO1xuXG4gIHdoaWxlICgrK2kgPCBuKSB7XG4gICAgdmFyIGFyYyA9IGFyY3NbaV0sXG4gICAgICAgIGogPSAwLFxuICAgICAgICBrID0gMSxcbiAgICAgICAgbSA9IGFyYy5sZW5ndGgsXG4gICAgICAgIHBvaW50ID0gYXJjWzBdLFxuICAgICAgICB4MCA9IHBvaW50WzBdLFxuICAgICAgICB5MCA9IHBvaW50WzFdLFxuICAgICAgICB4MSxcbiAgICAgICAgeTE7XG5cbiAgICB3aGlsZSAoKytqIDwgbSkge1xuICAgICAgcG9pbnQgPSBhcmNbal0sIHgxID0gcG9pbnRbMF0sIHkxID0gcG9pbnRbMV07XG4gICAgICBpZiAoeDEgIT09IHgwIHx8IHkxICE9PSB5MCkgYXJjW2srK10gPSBbeDEgLSB4MCwgeTEgLSB5MF0sIHgwID0geDEsIHkwID0geTE7XG4gICAgfVxuXG4gICAgaWYgKGsgPT09IDEpIGFyY1trKytdID0gWzAsIDBdOyAvLyBFYWNoIGFyYyBtdXN0IGJlIGFuIGFycmF5IG9mIHR3byBvciBtb3JlIHBvc2l0aW9ucy5cblxuICAgIGFyYy5sZW5ndGggPSBrO1xuICB9XG5cbiAgcmV0dXJuIGFyY3M7XG59O1xuXG4vLyBFeHRyYWN0cyB0aGUgbGluZXMgYW5kIHJpbmdzIGZyb20gdGhlIHNwZWNpZmllZCBoYXNoIG9mIGdlb21ldHJ5IG9iamVjdHMuXG4vL1xuLy8gUmV0dXJucyBhbiBvYmplY3Qgd2l0aCB0aHJlZSBwcm9wZXJ0aWVzOlxuLy9cbi8vICogY29vcmRpbmF0ZXMgLSBzaGFyZWQgYnVmZmVyIG9mIFt4LCB5XSBjb29yZGluYXRlc1xuLy8gKiBsaW5lcyAtIGxpbmVzIGV4dHJhY3RlZCBmcm9tIHRoZSBoYXNoLCBvZiB0aGUgZm9ybSBbc3RhcnQsIGVuZF1cbi8vICogcmluZ3MgLSByaW5ncyBleHRyYWN0ZWQgZnJvbSB0aGUgaGFzaCwgb2YgdGhlIGZvcm0gW3N0YXJ0LCBlbmRdXG4vL1xuLy8gRm9yIGVhY2ggcmluZyBvciBsaW5lLCBzdGFydCBhbmQgZW5kIHJlcHJlc2VudCBpbmNsdXNpdmUgaW5kZXhlcyBpbnRvIHRoZVxuLy8gY29vcmRpbmF0ZXMgYnVmZmVyLiBGb3IgcmluZ3MgKGFuZCBjbG9zZWQgbGluZXMpLCBjb29yZGluYXRlc1tzdGFydF0gZXF1YWxzXG4vLyBjb29yZGluYXRlc1tlbmRdLlxuLy9cbi8vIEZvciBlYWNoIGxpbmUgb3IgcG9seWdvbiBnZW9tZXRyeSBpbiB0aGUgaW5wdXQgaGFzaCwgaW5jbHVkaW5nIG5lc3RlZFxuLy8gZ2VvbWV0cmllcyBhcyBpbiBnZW9tZXRyeSBjb2xsZWN0aW9ucywgdGhlIGBjb29yZGluYXRlc2AgYXJyYXkgaXMgcmVwbGFjZWRcbi8vIHdpdGggYW4gZXF1aXZhbGVudCBgYXJjc2AgYXJyYXkgdGhhdCwgZm9yIGVhY2ggbGluZSAoZm9yIGxpbmUgc3RyaW5nXG4vLyBnZW9tZXRyaWVzKSBvciByaW5nIChmb3IgcG9seWdvbiBnZW9tZXRyaWVzKSwgcG9pbnRzIHRvIG9uZSBvZiB0aGUgYWJvdmVcbi8vIGxpbmVzIG9yIHJpbmdzLlxudmFyIGV4dHJhY3QgPSBmdW5jdGlvbihvYmplY3RzKSB7XG4gIHZhciBpbmRleCA9IC0xLFxuICAgICAgbGluZXMgPSBbXSxcbiAgICAgIHJpbmdzID0gW10sXG4gICAgICBjb29yZGluYXRlcyA9IFtdO1xuXG4gIGZ1bmN0aW9uIGV4dHJhY3RHZW9tZXRyeShnZW9tZXRyeSkge1xuICAgIGlmIChnZW9tZXRyeSAmJiBleHRyYWN0R2VvbWV0cnlUeXBlLmhhc093blByb3BlcnR5KGdlb21ldHJ5LnR5cGUpKSBleHRyYWN0R2VvbWV0cnlUeXBlW2dlb21ldHJ5LnR5cGVdKGdlb21ldHJ5KTtcbiAgfVxuXG4gIHZhciBleHRyYWN0R2VvbWV0cnlUeXBlID0ge1xuICAgIEdlb21ldHJ5Q29sbGVjdGlvbjogZnVuY3Rpb24obykgeyBvLmdlb21ldHJpZXMuZm9yRWFjaChleHRyYWN0R2VvbWV0cnkpOyB9LFxuICAgIExpbmVTdHJpbmc6IGZ1bmN0aW9uKG8pIHsgby5hcmNzID0gZXh0cmFjdExpbmUoby5hcmNzKTsgfSxcbiAgICBNdWx0aUxpbmVTdHJpbmc6IGZ1bmN0aW9uKG8pIHsgby5hcmNzID0gby5hcmNzLm1hcChleHRyYWN0TGluZSk7IH0sXG4gICAgUG9seWdvbjogZnVuY3Rpb24obykgeyBvLmFyY3MgPSBvLmFyY3MubWFwKGV4dHJhY3RSaW5nKTsgfSxcbiAgICBNdWx0aVBvbHlnb246IGZ1bmN0aW9uKG8pIHsgby5hcmNzID0gby5hcmNzLm1hcChleHRyYWN0TXVsdGlSaW5nKTsgfVxuICB9O1xuXG4gIGZ1bmN0aW9uIGV4dHJhY3RMaW5lKGxpbmUpIHtcbiAgICBmb3IgKHZhciBpID0gMCwgbiA9IGxpbmUubGVuZ3RoOyBpIDwgbjsgKytpKSBjb29yZGluYXRlc1srK2luZGV4XSA9IGxpbmVbaV07XG4gICAgdmFyIGFyYyA9IHswOiBpbmRleCAtIG4gKyAxLCAxOiBpbmRleH07XG4gICAgbGluZXMucHVzaChhcmMpO1xuICAgIHJldHVybiBhcmM7XG4gIH1cblxuICBmdW5jdGlvbiBleHRyYWN0UmluZyhyaW5nKSB7XG4gICAgZm9yICh2YXIgaSA9IDAsIG4gPSByaW5nLmxlbmd0aDsgaSA8IG47ICsraSkgY29vcmRpbmF0ZXNbKytpbmRleF0gPSByaW5nW2ldO1xuICAgIHZhciBhcmMgPSB7MDogaW5kZXggLSBuICsgMSwgMTogaW5kZXh9O1xuICAgIHJpbmdzLnB1c2goYXJjKTtcbiAgICByZXR1cm4gYXJjO1xuICB9XG5cbiAgZnVuY3Rpb24gZXh0cmFjdE11bHRpUmluZyhyaW5ncykge1xuICAgIHJldHVybiByaW5ncy5tYXAoZXh0cmFjdFJpbmcpO1xuICB9XG5cbiAgZm9yICh2YXIga2V5IGluIG9iamVjdHMpIHtcbiAgICBleHRyYWN0R2VvbWV0cnkob2JqZWN0c1trZXldKTtcbiAgfVxuXG4gIHJldHVybiB7XG4gICAgdHlwZTogXCJUb3BvbG9neVwiLFxuICAgIGNvb3JkaW5hdGVzOiBjb29yZGluYXRlcyxcbiAgICBsaW5lczogbGluZXMsXG4gICAgcmluZ3M6IHJpbmdzLFxuICAgIG9iamVjdHM6IG9iamVjdHNcbiAgfTtcbn07XG5cbi8vIEdpdmVuIGEgaGFzaCBvZiBHZW9KU09OIG9iamVjdHMsIHJldHVybnMgYSBoYXNoIG9mIEdlb0pTT04gZ2VvbWV0cnkgb2JqZWN0cy5cbi8vIEFueSBudWxsIGlucHV0IGdlb21ldHJ5IG9iamVjdHMgYXJlIHJlcHJlc2VudGVkIGFzIHt0eXBlOiBudWxsfSBpbiB0aGUgb3V0cHV0LlxuLy8gQW55IGZlYXR1cmUue2lkLHByb3BlcnRpZXMsYmJveH0gYXJlIHRyYW5zZmVycmVkIHRvIHRoZSBvdXRwdXQgZ2VvbWV0cnkgb2JqZWN0LlxuLy8gRWFjaCBvdXRwdXQgZ2VvbWV0cnkgb2JqZWN0IGlzIGEgc2hhbGxvdyBjb3B5IG9mIHRoZSBpbnB1dCAoZS5nLiwgcHJvcGVydGllcywgY29vcmRpbmF0ZXMpIVxudmFyIGdlb21ldHJ5ID0gZnVuY3Rpb24oaW5wdXRzKSB7XG4gIHZhciBvdXRwdXRzID0ge30sIGtleTtcbiAgZm9yIChrZXkgaW4gaW5wdXRzKSBvdXRwdXRzW2tleV0gPSBnZW9taWZ5T2JqZWN0KGlucHV0c1trZXldKTtcbiAgcmV0dXJuIG91dHB1dHM7XG59O1xuXG5mdW5jdGlvbiBnZW9taWZ5T2JqZWN0KGlucHV0KSB7XG4gIHJldHVybiBpbnB1dCA9PSBudWxsID8ge3R5cGU6IG51bGx9XG4gICAgICA6IChpbnB1dC50eXBlID09PSBcIkZlYXR1cmVDb2xsZWN0aW9uXCIgPyBnZW9taWZ5RmVhdHVyZUNvbGxlY3Rpb25cbiAgICAgIDogaW5wdXQudHlwZSA9PT0gXCJGZWF0dXJlXCIgPyBnZW9taWZ5RmVhdHVyZVxuICAgICAgOiBnZW9taWZ5R2VvbWV0cnkpKGlucHV0KTtcbn1cblxuZnVuY3Rpb24gZ2VvbWlmeUZlYXR1cmVDb2xsZWN0aW9uKGlucHV0KSB7XG4gIHZhciBvdXRwdXQgPSB7dHlwZTogXCJHZW9tZXRyeUNvbGxlY3Rpb25cIiwgZ2VvbWV0cmllczogaW5wdXQuZmVhdHVyZXMubWFwKGdlb21pZnlGZWF0dXJlKX07XG4gIGlmIChpbnB1dC5iYm94ICE9IG51bGwpIG91dHB1dC5iYm94ID0gaW5wdXQuYmJveDtcbiAgcmV0dXJuIG91dHB1dDtcbn1cblxuZnVuY3Rpb24gZ2VvbWlmeUZlYXR1cmUoaW5wdXQpIHtcbiAgdmFyIG91dHB1dCA9IGdlb21pZnlHZW9tZXRyeShpbnB1dC5nZW9tZXRyeSksIGtleTsgLy8gZXNsaW50LWRpc2FibGUtbGluZSBuby11bnVzZWQtdmFyc1xuICBpZiAoaW5wdXQuaWQgIT0gbnVsbCkgb3V0cHV0LmlkID0gaW5wdXQuaWQ7XG4gIGlmIChpbnB1dC5iYm94ICE9IG51bGwpIG91dHB1dC5iYm94ID0gaW5wdXQuYmJveDtcbiAgZm9yIChrZXkgaW4gaW5wdXQucHJvcGVydGllcykgeyBvdXRwdXQucHJvcGVydGllcyA9IGlucHV0LnByb3BlcnRpZXM7IGJyZWFrOyB9XG4gIHJldHVybiBvdXRwdXQ7XG59XG5cbmZ1bmN0aW9uIGdlb21pZnlHZW9tZXRyeShpbnB1dCkge1xuICBpZiAoaW5wdXQgPT0gbnVsbCkgcmV0dXJuIHt0eXBlOiBudWxsfTtcbiAgdmFyIG91dHB1dCA9IGlucHV0LnR5cGUgPT09IFwiR2VvbWV0cnlDb2xsZWN0aW9uXCIgPyB7dHlwZTogXCJHZW9tZXRyeUNvbGxlY3Rpb25cIiwgZ2VvbWV0cmllczogaW5wdXQuZ2VvbWV0cmllcy5tYXAoZ2VvbWlmeUdlb21ldHJ5KX1cbiAgICAgIDogaW5wdXQudHlwZSA9PT0gXCJQb2ludFwiIHx8IGlucHV0LnR5cGUgPT09IFwiTXVsdGlQb2ludFwiID8ge3R5cGU6IGlucHV0LnR5cGUsIGNvb3JkaW5hdGVzOiBpbnB1dC5jb29yZGluYXRlc31cbiAgICAgIDoge3R5cGU6IGlucHV0LnR5cGUsIGFyY3M6IGlucHV0LmNvb3JkaW5hdGVzfTsgLy8gVE9ETyBDaGVjayBmb3IgdW5rbm93biB0eXBlcz9cbiAgaWYgKGlucHV0LmJib3ggIT0gbnVsbCkgb3V0cHV0LmJib3ggPSBpbnB1dC5iYm94O1xuICByZXR1cm4gb3V0cHV0O1xufVxuXG52YXIgcHJlcXVhbnRpemUgPSBmdW5jdGlvbihvYmplY3RzLCBiYm94LCBuKSB7XG4gIHZhciB4MCA9IGJib3hbMF0sXG4gICAgICB5MCA9IGJib3hbMV0sXG4gICAgICB4MSA9IGJib3hbMl0sXG4gICAgICB5MSA9IGJib3hbM10sXG4gICAgICBreCA9IHgxIC0geDAgPyAobiAtIDEpIC8gKHgxIC0geDApIDogMSxcbiAgICAgIGt5ID0geTEgLSB5MCA/IChuIC0gMSkgLyAoeTEgLSB5MCkgOiAxO1xuXG4gIGZ1bmN0aW9uIHF1YW50aXplUG9pbnQoaW5wdXQpIHtcbiAgICByZXR1cm4gW01hdGgucm91bmQoKGlucHV0WzBdIC0geDApICoga3gpLCBNYXRoLnJvdW5kKChpbnB1dFsxXSAtIHkwKSAqIGt5KV07XG4gIH1cblxuICBmdW5jdGlvbiBxdWFudGl6ZVBvaW50cyhpbnB1dCwgbSkge1xuICAgIHZhciBpID0gLTEsXG4gICAgICAgIGogPSAwLFxuICAgICAgICBuID0gaW5wdXQubGVuZ3RoLFxuICAgICAgICBvdXRwdXQgPSBuZXcgQXJyYXkobiksIC8vIHBlc3NpbWlzdGljXG4gICAgICAgIHBpLFxuICAgICAgICBweCxcbiAgICAgICAgcHksXG4gICAgICAgIHgsXG4gICAgICAgIHk7XG5cbiAgICB3aGlsZSAoKytpIDwgbikge1xuICAgICAgcGkgPSBpbnB1dFtpXTtcbiAgICAgIHggPSBNYXRoLnJvdW5kKChwaVswXSAtIHgwKSAqIGt4KTtcbiAgICAgIHkgPSBNYXRoLnJvdW5kKChwaVsxXSAtIHkwKSAqIGt5KTtcbiAgICAgIGlmICh4ICE9PSBweCB8fCB5ICE9PSBweSkgb3V0cHV0W2orK10gPSBbcHggPSB4LCBweSA9IHldOyAvLyBub24tY29pbmNpZGVudCBwb2ludHNcbiAgICB9XG5cbiAgICBvdXRwdXQubGVuZ3RoID0gajtcbiAgICB3aGlsZSAoaiA8IG0pIGogPSBvdXRwdXQucHVzaChbb3V0cHV0WzBdWzBdLCBvdXRwdXRbMF1bMV1dKTtcbiAgICByZXR1cm4gb3V0cHV0O1xuICB9XG5cbiAgZnVuY3Rpb24gcXVhbnRpemVMaW5lKGlucHV0KSB7XG4gICAgcmV0dXJuIHF1YW50aXplUG9pbnRzKGlucHV0LCAyKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHF1YW50aXplUmluZyhpbnB1dCkge1xuICAgIHJldHVybiBxdWFudGl6ZVBvaW50cyhpbnB1dCwgNCk7XG4gIH1cblxuICBmdW5jdGlvbiBxdWFudGl6ZVBvbHlnb24oaW5wdXQpIHtcbiAgICByZXR1cm4gaW5wdXQubWFwKHF1YW50aXplUmluZyk7XG4gIH1cblxuICBmdW5jdGlvbiBxdWFudGl6ZUdlb21ldHJ5KG8pIHtcbiAgICBpZiAobyAhPSBudWxsICYmIHF1YW50aXplR2VvbWV0cnlUeXBlLmhhc093blByb3BlcnR5KG8udHlwZSkpIHF1YW50aXplR2VvbWV0cnlUeXBlW28udHlwZV0obyk7XG4gIH1cblxuICB2YXIgcXVhbnRpemVHZW9tZXRyeVR5cGUgPSB7XG4gICAgR2VvbWV0cnlDb2xsZWN0aW9uOiBmdW5jdGlvbihvKSB7IG8uZ2VvbWV0cmllcy5mb3JFYWNoKHF1YW50aXplR2VvbWV0cnkpOyB9LFxuICAgIFBvaW50OiBmdW5jdGlvbihvKSB7IG8uY29vcmRpbmF0ZXMgPSBxdWFudGl6ZVBvaW50KG8uY29vcmRpbmF0ZXMpOyB9LFxuICAgIE11bHRpUG9pbnQ6IGZ1bmN0aW9uKG8pIHsgby5jb29yZGluYXRlcyA9IG8uY29vcmRpbmF0ZXMubWFwKHF1YW50aXplUG9pbnQpOyB9LFxuICAgIExpbmVTdHJpbmc6IGZ1bmN0aW9uKG8pIHsgby5hcmNzID0gcXVhbnRpemVMaW5lKG8uYXJjcyk7IH0sXG4gICAgTXVsdGlMaW5lU3RyaW5nOiBmdW5jdGlvbihvKSB7IG8uYXJjcyA9IG8uYXJjcy5tYXAocXVhbnRpemVMaW5lKTsgfSxcbiAgICBQb2x5Z29uOiBmdW5jdGlvbihvKSB7IG8uYXJjcyA9IHF1YW50aXplUG9seWdvbihvLmFyY3MpOyB9LFxuICAgIE11bHRpUG9seWdvbjogZnVuY3Rpb24obykgeyBvLmFyY3MgPSBvLmFyY3MubWFwKHF1YW50aXplUG9seWdvbik7IH1cbiAgfTtcblxuICBmb3IgKHZhciBrZXkgaW4gb2JqZWN0cykge1xuICAgIHF1YW50aXplR2VvbWV0cnkob2JqZWN0c1trZXldKTtcbiAgfVxuXG4gIHJldHVybiB7XG4gICAgc2NhbGU6IFsxIC8ga3gsIDEgLyBreV0sXG4gICAgdHJhbnNsYXRlOiBbeDAsIHkwXVxuICB9O1xufTtcblxuLy8gQ29uc3RydWN0cyB0aGUgVG9wb0pTT04gVG9wb2xvZ3kgZm9yIHRoZSBzcGVjaWZpZWQgaGFzaCBvZiBmZWF0dXJlcy5cbi8vIEVhY2ggb2JqZWN0IGluIHRoZSBzcGVjaWZpZWQgaGFzaCBtdXN0IGJlIGEgR2VvSlNPTiBvYmplY3QsXG4vLyBtZWFuaW5nIEZlYXR1cmVDb2xsZWN0aW9uLCBhIEZlYXR1cmUgb3IgYSBnZW9tZXRyeSBvYmplY3QuXG52YXIgdG9wb2xvZ3kgPSBmdW5jdGlvbihvYmplY3RzLCBxdWFudGl6YXRpb24pIHtcbiAgdmFyIGJib3ggPSBib3VuZHMob2JqZWN0cyA9IGdlb21ldHJ5KG9iamVjdHMpKSxcbiAgICAgIHRyYW5zZm9ybSA9IHF1YW50aXphdGlvbiA+IDAgJiYgYmJveCAmJiBwcmVxdWFudGl6ZShvYmplY3RzLCBiYm94LCBxdWFudGl6YXRpb24pLFxuICAgICAgdG9wb2xvZ3kgPSBkZWR1cChjdXQoZXh0cmFjdChvYmplY3RzKSkpLFxuICAgICAgY29vcmRpbmF0ZXMgPSB0b3BvbG9neS5jb29yZGluYXRlcyxcbiAgICAgIGluZGV4QnlBcmMgPSBoYXNobWFwKHRvcG9sb2d5LmFyY3MubGVuZ3RoICogMS40LCBoYXNoQXJjLCBlcXVhbEFyYyk7XG5cbiAgb2JqZWN0cyA9IHRvcG9sb2d5Lm9iamVjdHM7IC8vIGZvciBnYXJiYWdlIGNvbGxlY3Rpb25cbiAgdG9wb2xvZ3kuYmJveCA9IGJib3g7XG4gIHRvcG9sb2d5LmFyY3MgPSB0b3BvbG9neS5hcmNzLm1hcChmdW5jdGlvbihhcmMsIGkpIHtcbiAgICBpbmRleEJ5QXJjLnNldChhcmMsIGkpO1xuICAgIHJldHVybiBjb29yZGluYXRlcy5zbGljZShhcmNbMF0sIGFyY1sxXSArIDEpO1xuICB9KTtcblxuICBkZWxldGUgdG9wb2xvZ3kuY29vcmRpbmF0ZXM7XG4gIGNvb3JkaW5hdGVzID0gbnVsbDtcblxuICBmdW5jdGlvbiBpbmRleEdlb21ldHJ5KGdlb21ldHJ5JCQxKSB7XG4gICAgaWYgKGdlb21ldHJ5JCQxICYmIGluZGV4R2VvbWV0cnlUeXBlLmhhc093blByb3BlcnR5KGdlb21ldHJ5JCQxLnR5cGUpKSBpbmRleEdlb21ldHJ5VHlwZVtnZW9tZXRyeSQkMS50eXBlXShnZW9tZXRyeSQkMSk7XG4gIH1cblxuICB2YXIgaW5kZXhHZW9tZXRyeVR5cGUgPSB7XG4gICAgR2VvbWV0cnlDb2xsZWN0aW9uOiBmdW5jdGlvbihvKSB7IG8uZ2VvbWV0cmllcy5mb3JFYWNoKGluZGV4R2VvbWV0cnkpOyB9LFxuICAgIExpbmVTdHJpbmc6IGZ1bmN0aW9uKG8pIHsgby5hcmNzID0gaW5kZXhBcmNzKG8uYXJjcyk7IH0sXG4gICAgTXVsdGlMaW5lU3RyaW5nOiBmdW5jdGlvbihvKSB7IG8uYXJjcyA9IG8uYXJjcy5tYXAoaW5kZXhBcmNzKTsgfSxcbiAgICBQb2x5Z29uOiBmdW5jdGlvbihvKSB7IG8uYXJjcyA9IG8uYXJjcy5tYXAoaW5kZXhBcmNzKTsgfSxcbiAgICBNdWx0aVBvbHlnb246IGZ1bmN0aW9uKG8pIHsgby5hcmNzID0gby5hcmNzLm1hcChpbmRleE11bHRpQXJjcyk7IH1cbiAgfTtcblxuICBmdW5jdGlvbiBpbmRleEFyY3MoYXJjKSB7XG4gICAgdmFyIGluZGV4ZXMgPSBbXTtcbiAgICBkbyB7XG4gICAgICB2YXIgaW5kZXggPSBpbmRleEJ5QXJjLmdldChhcmMpO1xuICAgICAgaW5kZXhlcy5wdXNoKGFyY1swXSA8IGFyY1sxXSA/IGluZGV4IDogfmluZGV4KTtcbiAgICB9IHdoaWxlIChhcmMgPSBhcmMubmV4dCk7XG4gICAgcmV0dXJuIGluZGV4ZXM7XG4gIH1cblxuICBmdW5jdGlvbiBpbmRleE11bHRpQXJjcyhhcmNzKSB7XG4gICAgcmV0dXJuIGFyY3MubWFwKGluZGV4QXJjcyk7XG4gIH1cblxuICBmb3IgKHZhciBrZXkgaW4gb2JqZWN0cykge1xuICAgIGluZGV4R2VvbWV0cnkob2JqZWN0c1trZXldKTtcbiAgfVxuXG4gIGlmICh0cmFuc2Zvcm0pIHtcbiAgICB0b3BvbG9neS50cmFuc2Zvcm0gPSB0cmFuc2Zvcm07XG4gICAgdG9wb2xvZ3kuYXJjcyA9IGRlbHRhKHRvcG9sb2d5LmFyY3MpO1xuICB9XG5cbiAgcmV0dXJuIHRvcG9sb2d5O1xufTtcblxuZnVuY3Rpb24gaGFzaEFyYyhhcmMpIHtcbiAgdmFyIGkgPSBhcmNbMF0sIGogPSBhcmNbMV0sIHQ7XG4gIGlmIChqIDwgaSkgdCA9IGksIGkgPSBqLCBqID0gdDtcbiAgcmV0dXJuIGkgKyAzMSAqIGo7XG59XG5cbmZ1bmN0aW9uIGVxdWFsQXJjKGFyY0EsIGFyY0IpIHtcbiAgdmFyIGlhID0gYXJjQVswXSwgamEgPSBhcmNBWzFdLFxuICAgICAgaWIgPSBhcmNCWzBdLCBqYiA9IGFyY0JbMV0sIHQ7XG4gIGlmIChqYSA8IGlhKSB0ID0gaWEsIGlhID0gamEsIGphID0gdDtcbiAgaWYgKGpiIDwgaWIpIHQgPSBpYiwgaWIgPSBqYiwgamIgPSB0O1xuICByZXR1cm4gaWEgPT09IGliICYmIGphID09PSBqYjtcbn1cblxuZXhwb3J0cy50b3BvbG9neSA9IHRvcG9sb2d5O1xuXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgJ19fZXNNb2R1bGUnLCB7IHZhbHVlOiB0cnVlIH0pO1xuXG59KSkpO1xuIiwiLy8gaHR0cHM6Ly9naXRodWIuY29tL3RvcG9qc29uL3RvcG9qc29uLXNpbXBsaWZ5IFZlcnNpb24gMy4wLjIuIENvcHlyaWdodCAyMDE3IE1pa2UgQm9zdG9jay5cbihmdW5jdGlvbiAoZ2xvYmFsLCBmYWN0b3J5KSB7XG5cdHR5cGVvZiBleHBvcnRzID09PSAnb2JqZWN0JyAmJiB0eXBlb2YgbW9kdWxlICE9PSAndW5kZWZpbmVkJyA/IGZhY3RvcnkoZXhwb3J0cywgcmVxdWlyZSgndG9wb2pzb24tY2xpZW50JykpIDpcblx0dHlwZW9mIGRlZmluZSA9PT0gJ2Z1bmN0aW9uJyAmJiBkZWZpbmUuYW1kID8gZGVmaW5lKFsnZXhwb3J0cycsICd0b3BvanNvbi1jbGllbnQnXSwgZmFjdG9yeSkgOlxuXHQoZmFjdG9yeSgoZ2xvYmFsLnRvcG9qc29uID0gZ2xvYmFsLnRvcG9qc29uIHx8IHt9KSxnbG9iYWwudG9wb2pzb24pKTtcbn0odGhpcywgKGZ1bmN0aW9uIChleHBvcnRzLHRvcG9qc29uQ2xpZW50KSB7ICd1c2Ugc3RyaWN0JztcblxudmFyIHBydW5lID0gZnVuY3Rpb24odG9wb2xvZ3kpIHtcbiAgdmFyIG9sZE9iamVjdHMgPSB0b3BvbG9neS5vYmplY3RzLFxuICAgICAgbmV3T2JqZWN0cyA9IHt9LFxuICAgICAgb2xkQXJjcyA9IHRvcG9sb2d5LmFyY3MsXG4gICAgICBvbGRBcmNzTGVuZ3RoID0gb2xkQXJjcy5sZW5ndGgsXG4gICAgICBvbGRJbmRleCA9IC0xLFxuICAgICAgbmV3SW5kZXhCeU9sZEluZGV4ID0gbmV3IEFycmF5KG9sZEFyY3NMZW5ndGgpLFxuICAgICAgbmV3QXJjc0xlbmd0aCA9IDAsXG4gICAgICBuZXdBcmNzLFxuICAgICAgbmV3SW5kZXggPSAtMSxcbiAgICAgIGtleTtcblxuICBmdW5jdGlvbiBzY2FuR2VvbWV0cnkoaW5wdXQpIHtcbiAgICBzd2l0Y2ggKGlucHV0LnR5cGUpIHtcbiAgICAgIGNhc2UgXCJHZW9tZXRyeUNvbGxlY3Rpb25cIjogaW5wdXQuZ2VvbWV0cmllcy5mb3JFYWNoKHNjYW5HZW9tZXRyeSk7IGJyZWFrO1xuICAgICAgY2FzZSBcIkxpbmVTdHJpbmdcIjogc2NhbkFyY3MoaW5wdXQuYXJjcyk7IGJyZWFrO1xuICAgICAgY2FzZSBcIk11bHRpTGluZVN0cmluZ1wiOiBpbnB1dC5hcmNzLmZvckVhY2goc2NhbkFyY3MpOyBicmVhaztcbiAgICAgIGNhc2UgXCJQb2x5Z29uXCI6IGlucHV0LmFyY3MuZm9yRWFjaChzY2FuQXJjcyk7IGJyZWFrO1xuICAgICAgY2FzZSBcIk11bHRpUG9seWdvblwiOiBpbnB1dC5hcmNzLmZvckVhY2goc2Nhbk11bHRpQXJjcyk7IGJyZWFrO1xuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIHNjYW5BcmMoaW5kZXgpIHtcbiAgICBpZiAoaW5kZXggPCAwKSBpbmRleCA9IH5pbmRleDtcbiAgICBpZiAoIW5ld0luZGV4QnlPbGRJbmRleFtpbmRleF0pIG5ld0luZGV4QnlPbGRJbmRleFtpbmRleF0gPSAxLCArK25ld0FyY3NMZW5ndGg7XG4gIH1cblxuICBmdW5jdGlvbiBzY2FuQXJjcyhhcmNzKSB7XG4gICAgYXJjcy5mb3JFYWNoKHNjYW5BcmMpO1xuICB9XG5cbiAgZnVuY3Rpb24gc2Nhbk11bHRpQXJjcyhhcmNzKSB7XG4gICAgYXJjcy5mb3JFYWNoKHNjYW5BcmNzKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHJlaW5kZXhHZW9tZXRyeShpbnB1dCkge1xuICAgIHZhciBvdXRwdXQ7XG4gICAgc3dpdGNoIChpbnB1dC50eXBlKSB7XG4gICAgICBjYXNlIFwiR2VvbWV0cnlDb2xsZWN0aW9uXCI6IG91dHB1dCA9IHt0eXBlOiBcIkdlb21ldHJ5Q29sbGVjdGlvblwiLCBnZW9tZXRyaWVzOiBpbnB1dC5nZW9tZXRyaWVzLm1hcChyZWluZGV4R2VvbWV0cnkpfTsgYnJlYWs7XG4gICAgICBjYXNlIFwiTGluZVN0cmluZ1wiOiBvdXRwdXQgPSB7dHlwZTogXCJMaW5lU3RyaW5nXCIsIGFyY3M6IHJlaW5kZXhBcmNzKGlucHV0LmFyY3MpfTsgYnJlYWs7XG4gICAgICBjYXNlIFwiTXVsdGlMaW5lU3RyaW5nXCI6IG91dHB1dCA9IHt0eXBlOiBcIk11bHRpTGluZVN0cmluZ1wiLCBhcmNzOiBpbnB1dC5hcmNzLm1hcChyZWluZGV4QXJjcyl9OyBicmVhaztcbiAgICAgIGNhc2UgXCJQb2x5Z29uXCI6IG91dHB1dCA9IHt0eXBlOiBcIlBvbHlnb25cIiwgYXJjczogaW5wdXQuYXJjcy5tYXAocmVpbmRleEFyY3MpfTsgYnJlYWs7XG4gICAgICBjYXNlIFwiTXVsdGlQb2x5Z29uXCI6IG91dHB1dCA9IHt0eXBlOiBcIk11bHRpUG9seWdvblwiLCBhcmNzOiBpbnB1dC5hcmNzLm1hcChyZWluZGV4TXVsdGlBcmNzKX07IGJyZWFrO1xuICAgICAgZGVmYXVsdDogcmV0dXJuIGlucHV0O1xuICAgIH1cbiAgICBpZiAoaW5wdXQuaWQgIT0gbnVsbCkgb3V0cHV0LmlkID0gaW5wdXQuaWQ7XG4gICAgaWYgKGlucHV0LmJib3ggIT0gbnVsbCkgb3V0cHV0LmJib3ggPSBpbnB1dC5iYm94O1xuICAgIGlmIChpbnB1dC5wcm9wZXJ0aWVzICE9IG51bGwpIG91dHB1dC5wcm9wZXJ0aWVzID0gaW5wdXQucHJvcGVydGllcztcbiAgICByZXR1cm4gb3V0cHV0O1xuICB9XG5cbiAgZnVuY3Rpb24gcmVpbmRleEFyYyhvbGRJbmRleCkge1xuICAgIHJldHVybiBvbGRJbmRleCA8IDAgPyB+bmV3SW5kZXhCeU9sZEluZGV4W35vbGRJbmRleF0gOiBuZXdJbmRleEJ5T2xkSW5kZXhbb2xkSW5kZXhdO1xuICB9XG5cbiAgZnVuY3Rpb24gcmVpbmRleEFyY3MoYXJjcykge1xuICAgIHJldHVybiBhcmNzLm1hcChyZWluZGV4QXJjKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHJlaW5kZXhNdWx0aUFyY3MoYXJjcykge1xuICAgIHJldHVybiBhcmNzLm1hcChyZWluZGV4QXJjcyk7XG4gIH1cblxuICBmb3IgKGtleSBpbiBvbGRPYmplY3RzKSB7XG4gICAgc2Nhbkdlb21ldHJ5KG9sZE9iamVjdHNba2V5XSk7XG4gIH1cblxuICBuZXdBcmNzID0gbmV3IEFycmF5KG5ld0FyY3NMZW5ndGgpO1xuXG4gIHdoaWxlICgrK29sZEluZGV4IDwgb2xkQXJjc0xlbmd0aCkge1xuICAgIGlmIChuZXdJbmRleEJ5T2xkSW5kZXhbb2xkSW5kZXhdKSB7XG4gICAgICBuZXdJbmRleEJ5T2xkSW5kZXhbb2xkSW5kZXhdID0gKytuZXdJbmRleDtcbiAgICAgIG5ld0FyY3NbbmV3SW5kZXhdID0gb2xkQXJjc1tvbGRJbmRleF07XG4gICAgfVxuICB9XG5cbiAgZm9yIChrZXkgaW4gb2xkT2JqZWN0cykge1xuICAgIG5ld09iamVjdHNba2V5XSA9IHJlaW5kZXhHZW9tZXRyeShvbGRPYmplY3RzW2tleV0pO1xuICB9XG5cbiAgcmV0dXJuIHtcbiAgICB0eXBlOiBcIlRvcG9sb2d5XCIsXG4gICAgYmJveDogdG9wb2xvZ3kuYmJveCxcbiAgICB0cmFuc2Zvcm06IHRvcG9sb2d5LnRyYW5zZm9ybSxcbiAgICBvYmplY3RzOiBuZXdPYmplY3RzLFxuICAgIGFyY3M6IG5ld0FyY3NcbiAgfTtcbn07XG5cbnZhciBmaWx0ZXIgPSBmdW5jdGlvbih0b3BvbG9neSwgZmlsdGVyKSB7XG4gIHZhciBvbGRPYmplY3RzID0gdG9wb2xvZ3kub2JqZWN0cyxcbiAgICAgIG5ld09iamVjdHMgPSB7fSxcbiAgICAgIGtleTtcblxuICBpZiAoZmlsdGVyID09IG51bGwpIGZpbHRlciA9IGZpbHRlclRydWU7XG5cbiAgZnVuY3Rpb24gZmlsdGVyR2VvbWV0cnkoaW5wdXQpIHtcbiAgICB2YXIgb3V0cHV0LCBhcmNzO1xuICAgIHN3aXRjaCAoaW5wdXQudHlwZSkge1xuICAgICAgY2FzZSBcIlBvbHlnb25cIjoge1xuICAgICAgICBhcmNzID0gZmlsdGVyUmluZ3MoaW5wdXQuYXJjcyk7XG4gICAgICAgIG91dHB1dCA9IGFyY3MgPyB7dHlwZTogXCJQb2x5Z29uXCIsIGFyY3M6IGFyY3N9IDoge3R5cGU6IG51bGx9O1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICAgIGNhc2UgXCJNdWx0aVBvbHlnb25cIjoge1xuICAgICAgICBhcmNzID0gaW5wdXQuYXJjcy5tYXAoZmlsdGVyUmluZ3MpLmZpbHRlcihmaWx0ZXJJZGVudGl0eSk7XG4gICAgICAgIG91dHB1dCA9IGFyY3MubGVuZ3RoID8ge3R5cGU6IFwiTXVsdGlQb2x5Z29uXCIsIGFyY3M6IGFyY3N9IDoge3R5cGU6IG51bGx9O1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICAgIGNhc2UgXCJHZW9tZXRyeUNvbGxlY3Rpb25cIjoge1xuICAgICAgICBhcmNzID0gaW5wdXQuZ2VvbWV0cmllcy5tYXAoZmlsdGVyR2VvbWV0cnkpLmZpbHRlcihmaWx0ZXJOb3ROdWxsKTtcbiAgICAgICAgb3V0cHV0ID0gYXJjcy5sZW5ndGggPyB7dHlwZTogXCJHZW9tZXRyeUNvbGxlY3Rpb25cIiwgZ2VvbWV0cmllczogYXJjc30gOiB7dHlwZTogbnVsbH07XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgICAgZGVmYXVsdDogcmV0dXJuIGlucHV0O1xuICAgIH1cbiAgICBpZiAoaW5wdXQuaWQgIT0gbnVsbCkgb3V0cHV0LmlkID0gaW5wdXQuaWQ7XG4gICAgaWYgKGlucHV0LmJib3ggIT0gbnVsbCkgb3V0cHV0LmJib3ggPSBpbnB1dC5iYm94O1xuICAgIGlmIChpbnB1dC5wcm9wZXJ0aWVzICE9IG51bGwpIG91dHB1dC5wcm9wZXJ0aWVzID0gaW5wdXQucHJvcGVydGllcztcbiAgICByZXR1cm4gb3V0cHV0O1xuICB9XG5cbiAgZnVuY3Rpb24gZmlsdGVyUmluZ3MoYXJjcykge1xuICAgIHJldHVybiBhcmNzLmxlbmd0aCAmJiBmaWx0ZXJFeHRlcmlvclJpbmcoYXJjc1swXSkgLy8gaWYgdGhlIGV4dGVyaW9yIGlzIHNtYWxsLCBpZ25vcmUgYW55IGhvbGVzXG4gICAgICAgID8gW2FyY3NbMF1dLmNvbmNhdChhcmNzLnNsaWNlKDEpLmZpbHRlcihmaWx0ZXJJbnRlcmlvclJpbmcpKVxuICAgICAgICA6IG51bGw7XG4gIH1cblxuICBmdW5jdGlvbiBmaWx0ZXJFeHRlcmlvclJpbmcocmluZykge1xuICAgIHJldHVybiBmaWx0ZXIocmluZywgZmFsc2UpO1xuICB9XG5cbiAgZnVuY3Rpb24gZmlsdGVySW50ZXJpb3JSaW5nKHJpbmcpIHtcbiAgICByZXR1cm4gZmlsdGVyKHJpbmcsIHRydWUpO1xuICB9XG5cbiAgZm9yIChrZXkgaW4gb2xkT2JqZWN0cykge1xuICAgIG5ld09iamVjdHNba2V5XSA9IGZpbHRlckdlb21ldHJ5KG9sZE9iamVjdHNba2V5XSk7XG4gIH1cblxuICByZXR1cm4gcHJ1bmUoe1xuICAgIHR5cGU6IFwiVG9wb2xvZ3lcIixcbiAgICBiYm94OiB0b3BvbG9neS5iYm94LFxuICAgIHRyYW5zZm9ybTogdG9wb2xvZ3kudHJhbnNmb3JtLFxuICAgIG9iamVjdHM6IG5ld09iamVjdHMsXG4gICAgYXJjczogdG9wb2xvZ3kuYXJjc1xuICB9KTtcbn07XG5cbmZ1bmN0aW9uIGZpbHRlclRydWUoKSB7XG4gIHJldHVybiB0cnVlO1xufVxuXG5mdW5jdGlvbiBmaWx0ZXJJZGVudGl0eSh4KSB7XG4gIHJldHVybiB4O1xufVxuXG5mdW5jdGlvbiBmaWx0ZXJOb3ROdWxsKGdlb21ldHJ5KSB7XG4gIHJldHVybiBnZW9tZXRyeS50eXBlICE9IG51bGw7XG59XG5cbnZhciBmaWx0ZXJBdHRhY2hlZCA9IGZ1bmN0aW9uKHRvcG9sb2d5KSB7XG4gIHZhciBvd25lckJ5QXJjID0gbmV3IEFycmF5KHRvcG9sb2d5LmFyY3MubGVuZ3RoKSwgLy8gYXJjIGluZGV4IC0+IGluZGV4IG9mIHVuaXF1ZSBhc3NvY2lhdGVkIHJpbmcsIG9yIC0xIGlmIHVzZWQgYnkgbXVsdGlwbGUgcmluZ3NcbiAgICAgIG93bmVySW5kZXggPSAwLFxuICAgICAga2V5O1xuXG4gIGZ1bmN0aW9uIHRlc3RHZW9tZXRyeShvKSB7XG4gICAgc3dpdGNoIChvLnR5cGUpIHtcbiAgICAgIGNhc2UgXCJHZW9tZXRyeUNvbGxlY3Rpb25cIjogby5nZW9tZXRyaWVzLmZvckVhY2godGVzdEdlb21ldHJ5KTsgYnJlYWs7XG4gICAgICBjYXNlIFwiUG9seWdvblwiOiB0ZXN0QXJjcyhvLmFyY3MpOyBicmVhaztcbiAgICAgIGNhc2UgXCJNdWx0aVBvbHlnb25cIjogby5hcmNzLmZvckVhY2godGVzdEFyY3MpOyBicmVhaztcbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiB0ZXN0QXJjcyhhcmNzKSB7XG4gICAgZm9yICh2YXIgaSA9IDAsIG4gPSBhcmNzLmxlbmd0aDsgaSA8IG47ICsraSwgKytvd25lckluZGV4KSB7XG4gICAgICBmb3IgKHZhciByaW5nID0gYXJjc1tpXSwgaiA9IDAsIG0gPSByaW5nLmxlbmd0aDsgaiA8IG07ICsraikge1xuICAgICAgICB2YXIgYXJjID0gcmluZ1tqXTtcbiAgICAgICAgaWYgKGFyYyA8IDApIGFyYyA9IH5hcmM7XG4gICAgICAgIHZhciBvd25lciA9IG93bmVyQnlBcmNbYXJjXTtcbiAgICAgICAgaWYgKG93bmVyID09IG51bGwpIG93bmVyQnlBcmNbYXJjXSA9IG93bmVySW5kZXg7XG4gICAgICAgIGVsc2UgaWYgKG93bmVyICE9PSBvd25lckluZGV4KSBvd25lckJ5QXJjW2FyY10gPSAtMTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBmb3IgKGtleSBpbiB0b3BvbG9neS5vYmplY3RzKSB7XG4gICAgdGVzdEdlb21ldHJ5KHRvcG9sb2d5Lm9iamVjdHNba2V5XSk7XG4gIH1cblxuICByZXR1cm4gZnVuY3Rpb24ocmluZykge1xuICAgIGZvciAodmFyIGogPSAwLCBtID0gcmluZy5sZW5ndGgsIGFyYzsgaiA8IG07ICsraikge1xuICAgICAgaWYgKG93bmVyQnlBcmNbKGFyYyA9IHJpbmdbal0pIDwgMCA/IH5hcmMgOiBhcmNdID09PSAtMSkge1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9O1xufTtcblxuZnVuY3Rpb24gcGxhbmFyVHJpYW5nbGVBcmVhKHRyaWFuZ2xlKSB7XG4gIHZhciBhID0gdHJpYW5nbGVbMF0sIGIgPSB0cmlhbmdsZVsxXSwgYyA9IHRyaWFuZ2xlWzJdO1xuICByZXR1cm4gTWF0aC5hYnMoKGFbMF0gLSBjWzBdKSAqIChiWzFdIC0gYVsxXSkgLSAoYVswXSAtIGJbMF0pICogKGNbMV0gLSBhWzFdKSkgLyAyO1xufVxuXG5mdW5jdGlvbiBwbGFuYXJSaW5nQXJlYShyaW5nKSB7XG4gIHZhciBpID0gLTEsIG4gPSByaW5nLmxlbmd0aCwgYSwgYiA9IHJpbmdbbiAtIDFdLCBhcmVhID0gMDtcbiAgd2hpbGUgKCsraSA8IG4pIGEgPSBiLCBiID0gcmluZ1tpXSwgYXJlYSArPSBhWzBdICogYlsxXSAtIGFbMV0gKiBiWzBdO1xuICByZXR1cm4gTWF0aC5hYnMoYXJlYSkgLyAyO1xufVxuXG52YXIgZmlsdGVyV2VpZ2h0ID0gZnVuY3Rpb24odG9wb2xvZ3ksIG1pbldlaWdodCwgd2VpZ2h0KSB7XG4gIG1pbldlaWdodCA9IG1pbldlaWdodCA9PSBudWxsID8gTnVtYmVyLk1JTl9WQUxVRSA6ICttaW5XZWlnaHQ7XG5cbiAgaWYgKHdlaWdodCA9PSBudWxsKSB3ZWlnaHQgPSBwbGFuYXJSaW5nQXJlYTtcblxuICByZXR1cm4gZnVuY3Rpb24ocmluZywgaW50ZXJpb3IpIHtcbiAgICByZXR1cm4gd2VpZ2h0KHRvcG9qc29uQ2xpZW50LmZlYXR1cmUodG9wb2xvZ3ksIHt0eXBlOiBcIlBvbHlnb25cIiwgYXJjczogW3JpbmddfSkuZ2VvbWV0cnkuY29vcmRpbmF0ZXNbMF0sIGludGVyaW9yKSA+PSBtaW5XZWlnaHQ7XG4gIH07XG59O1xuXG52YXIgZmlsdGVyQXR0YWNoZWRXZWlnaHQgPSBmdW5jdGlvbih0b3BvbG9neSwgbWluV2VpZ2h0LCB3ZWlnaHQpIHtcbiAgdmFyIGEgPSBmaWx0ZXJBdHRhY2hlZCh0b3BvbG9neSksXG4gICAgICB3ID0gZmlsdGVyV2VpZ2h0KHRvcG9sb2d5LCBtaW5XZWlnaHQsIHdlaWdodCk7XG4gIHJldHVybiBmdW5jdGlvbihyaW5nLCBpbnRlcmlvcikge1xuICAgIHJldHVybiBhKHJpbmcsIGludGVyaW9yKSB8fCB3KHJpbmcsIGludGVyaW9yKTtcbiAgfTtcbn07XG5cbmZ1bmN0aW9uIGNvbXBhcmUoYSwgYikge1xuICByZXR1cm4gYVsxXVsyXSAtIGJbMV1bMl07XG59XG5cbnZhciBuZXdIZWFwID0gZnVuY3Rpb24oKSB7XG4gIHZhciBoZWFwID0ge30sXG4gICAgICBhcnJheSA9IFtdLFxuICAgICAgc2l6ZSA9IDA7XG5cbiAgaGVhcC5wdXNoID0gZnVuY3Rpb24ob2JqZWN0KSB7XG4gICAgdXAoYXJyYXlbb2JqZWN0Ll8gPSBzaXplXSA9IG9iamVjdCwgc2l6ZSsrKTtcbiAgICByZXR1cm4gc2l6ZTtcbiAgfTtcblxuICBoZWFwLnBvcCA9IGZ1bmN0aW9uKCkge1xuICAgIGlmIChzaXplIDw9IDApIHJldHVybjtcbiAgICB2YXIgcmVtb3ZlZCA9IGFycmF5WzBdLCBvYmplY3Q7XG4gICAgaWYgKC0tc2l6ZSA+IDApIG9iamVjdCA9IGFycmF5W3NpemVdLCBkb3duKGFycmF5W29iamVjdC5fID0gMF0gPSBvYmplY3QsIDApO1xuICAgIHJldHVybiByZW1vdmVkO1xuICB9O1xuXG4gIGhlYXAucmVtb3ZlID0gZnVuY3Rpb24ocmVtb3ZlZCkge1xuICAgIHZhciBpID0gcmVtb3ZlZC5fLCBvYmplY3Q7XG4gICAgaWYgKGFycmF5W2ldICE9PSByZW1vdmVkKSByZXR1cm47IC8vIGludmFsaWQgcmVxdWVzdFxuICAgIGlmIChpICE9PSAtLXNpemUpIG9iamVjdCA9IGFycmF5W3NpemVdLCAoY29tcGFyZShvYmplY3QsIHJlbW92ZWQpIDwgMCA/IHVwIDogZG93bikoYXJyYXlbb2JqZWN0Ll8gPSBpXSA9IG9iamVjdCwgaSk7XG4gICAgcmV0dXJuIGk7XG4gIH07XG5cbiAgZnVuY3Rpb24gdXAob2JqZWN0LCBpKSB7XG4gICAgd2hpbGUgKGkgPiAwKSB7XG4gICAgICB2YXIgaiA9ICgoaSArIDEpID4+IDEpIC0gMSxcbiAgICAgICAgICBwYXJlbnQgPSBhcnJheVtqXTtcbiAgICAgIGlmIChjb21wYXJlKG9iamVjdCwgcGFyZW50KSA+PSAwKSBicmVhaztcbiAgICAgIGFycmF5W3BhcmVudC5fID0gaV0gPSBwYXJlbnQ7XG4gICAgICBhcnJheVtvYmplY3QuXyA9IGkgPSBqXSA9IG9iamVjdDtcbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiBkb3duKG9iamVjdCwgaSkge1xuICAgIHdoaWxlICh0cnVlKSB7XG4gICAgICB2YXIgciA9IChpICsgMSkgPDwgMSxcbiAgICAgICAgICBsID0gciAtIDEsXG4gICAgICAgICAgaiA9IGksXG4gICAgICAgICAgY2hpbGQgPSBhcnJheVtqXTtcbiAgICAgIGlmIChsIDwgc2l6ZSAmJiBjb21wYXJlKGFycmF5W2xdLCBjaGlsZCkgPCAwKSBjaGlsZCA9IGFycmF5W2ogPSBsXTtcbiAgICAgIGlmIChyIDwgc2l6ZSAmJiBjb21wYXJlKGFycmF5W3JdLCBjaGlsZCkgPCAwKSBjaGlsZCA9IGFycmF5W2ogPSByXTtcbiAgICAgIGlmIChqID09PSBpKSBicmVhaztcbiAgICAgIGFycmF5W2NoaWxkLl8gPSBpXSA9IGNoaWxkO1xuICAgICAgYXJyYXlbb2JqZWN0Ll8gPSBpID0gal0gPSBvYmplY3Q7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIGhlYXA7XG59O1xuXG5mdW5jdGlvbiBjb3B5KHBvaW50KSB7XG4gIHJldHVybiBbcG9pbnRbMF0sIHBvaW50WzFdLCAwXTtcbn1cblxudmFyIHByZXNpbXBsaWZ5ID0gZnVuY3Rpb24odG9wb2xvZ3ksIHdlaWdodCkge1xuICB2YXIgcG9pbnQgPSB0b3BvbG9neS50cmFuc2Zvcm0gPyB0b3BvanNvbkNsaWVudC50cmFuc2Zvcm0odG9wb2xvZ3kudHJhbnNmb3JtKSA6IGNvcHksXG4gICAgICBoZWFwID0gbmV3SGVhcCgpO1xuXG4gIGlmICh3ZWlnaHQgPT0gbnVsbCkgd2VpZ2h0ID0gcGxhbmFyVHJpYW5nbGVBcmVhO1xuXG4gIHZhciBhcmNzID0gdG9wb2xvZ3kuYXJjcy5tYXAoZnVuY3Rpb24oYXJjKSB7XG4gICAgdmFyIHRyaWFuZ2xlcyA9IFtdLFxuICAgICAgICBtYXhXZWlnaHQgPSAwLFxuICAgICAgICB0cmlhbmdsZSxcbiAgICAgICAgaSxcbiAgICAgICAgbjtcblxuICAgIGFyYyA9IGFyYy5tYXAocG9pbnQpO1xuXG4gICAgZm9yIChpID0gMSwgbiA9IGFyYy5sZW5ndGggLSAxOyBpIDwgbjsgKytpKSB7XG4gICAgICB0cmlhbmdsZSA9IFthcmNbaSAtIDFdLCBhcmNbaV0sIGFyY1tpICsgMV1dO1xuICAgICAgdHJpYW5nbGVbMV1bMl0gPSB3ZWlnaHQodHJpYW5nbGUpO1xuICAgICAgdHJpYW5nbGVzLnB1c2godHJpYW5nbGUpO1xuICAgICAgaGVhcC5wdXNoKHRyaWFuZ2xlKTtcbiAgICB9XG5cbiAgICAvLyBBbHdheXMga2VlcCB0aGUgYXJjIGVuZHBvaW50cyFcbiAgICBhcmNbMF1bMl0gPSBhcmNbbl1bMl0gPSBJbmZpbml0eTtcblxuICAgIGZvciAoaSA9IDAsIG4gPSB0cmlhbmdsZXMubGVuZ3RoOyBpIDwgbjsgKytpKSB7XG4gICAgICB0cmlhbmdsZSA9IHRyaWFuZ2xlc1tpXTtcbiAgICAgIHRyaWFuZ2xlLnByZXZpb3VzID0gdHJpYW5nbGVzW2kgLSAxXTtcbiAgICAgIHRyaWFuZ2xlLm5leHQgPSB0cmlhbmdsZXNbaSArIDFdO1xuICAgIH1cblxuICAgIHdoaWxlICh0cmlhbmdsZSA9IGhlYXAucG9wKCkpIHtcbiAgICAgIHZhciBwcmV2aW91cyA9IHRyaWFuZ2xlLnByZXZpb3VzLFxuICAgICAgICAgIG5leHQgPSB0cmlhbmdsZS5uZXh0O1xuXG4gICAgICAvLyBJZiB0aGUgd2VpZ2h0IG9mIHRoZSBjdXJyZW50IHBvaW50IGlzIGxlc3MgdGhhbiB0aGF0IG9mIHRoZSBwcmV2aW91c1xuICAgICAgLy8gcG9pbnQgdG8gYmUgZWxpbWluYXRlZCwgdXNlIHRoZSBsYXR0ZXLigJlzIHdlaWdodCBpbnN0ZWFkLiBUaGlzIGVuc3VyZXNcbiAgICAgIC8vIHRoYXQgdGhlIGN1cnJlbnQgcG9pbnQgY2Fubm90IGJlIGVsaW1pbmF0ZWQgd2l0aG91dCBlbGltaW5hdGluZ1xuICAgICAgLy8gcHJldmlvdXNseS0gZWxpbWluYXRlZCBwb2ludHMuXG4gICAgICBpZiAodHJpYW5nbGVbMV1bMl0gPCBtYXhXZWlnaHQpIHRyaWFuZ2xlWzFdWzJdID0gbWF4V2VpZ2h0O1xuICAgICAgZWxzZSBtYXhXZWlnaHQgPSB0cmlhbmdsZVsxXVsyXTtcblxuICAgICAgaWYgKHByZXZpb3VzKSB7XG4gICAgICAgIHByZXZpb3VzLm5leHQgPSBuZXh0O1xuICAgICAgICBwcmV2aW91c1syXSA9IHRyaWFuZ2xlWzJdO1xuICAgICAgICB1cGRhdGUocHJldmlvdXMpO1xuICAgICAgfVxuXG4gICAgICBpZiAobmV4dCkge1xuICAgICAgICBuZXh0LnByZXZpb3VzID0gcHJldmlvdXM7XG4gICAgICAgIG5leHRbMF0gPSB0cmlhbmdsZVswXTtcbiAgICAgICAgdXBkYXRlKG5leHQpO1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBhcmM7XG4gIH0pO1xuXG4gIGZ1bmN0aW9uIHVwZGF0ZSh0cmlhbmdsZSkge1xuICAgIGhlYXAucmVtb3ZlKHRyaWFuZ2xlKTtcbiAgICB0cmlhbmdsZVsxXVsyXSA9IHdlaWdodCh0cmlhbmdsZSk7XG4gICAgaGVhcC5wdXNoKHRyaWFuZ2xlKTtcbiAgfVxuXG4gIHJldHVybiB7XG4gICAgdHlwZTogXCJUb3BvbG9neVwiLFxuICAgIGJib3g6IHRvcG9sb2d5LmJib3gsXG4gICAgb2JqZWN0czogdG9wb2xvZ3kub2JqZWN0cyxcbiAgICBhcmNzOiBhcmNzXG4gIH07XG59O1xuXG52YXIgcXVhbnRpbGUgPSBmdW5jdGlvbih0b3BvbG9neSwgcCkge1xuICB2YXIgYXJyYXkgPSBbXTtcblxuICB0b3BvbG9neS5hcmNzLmZvckVhY2goZnVuY3Rpb24oYXJjKSB7XG4gICAgYXJjLmZvckVhY2goZnVuY3Rpb24ocG9pbnQpIHtcbiAgICAgIGlmIChpc0Zpbml0ZShwb2ludFsyXSkpIHsgLy8gSWdub3JlIGVuZHBvaW50cywgd2hvc2Ugd2VpZ2h0IGlzIEluZmluaXR5LlxuICAgICAgICBhcnJheS5wdXNoKHBvaW50WzJdKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfSk7XG5cbiAgcmV0dXJuIGFycmF5Lmxlbmd0aCAmJiBxdWFudGlsZSQxKGFycmF5LnNvcnQoZGVzY2VuZGluZyksIHApO1xufTtcblxuZnVuY3Rpb24gcXVhbnRpbGUkMShhcnJheSwgcCkge1xuICBpZiAoIShuID0gYXJyYXkubGVuZ3RoKSkgcmV0dXJuO1xuICBpZiAoKHAgPSArcCkgPD0gMCB8fCBuIDwgMikgcmV0dXJuIGFycmF5WzBdO1xuICBpZiAocCA+PSAxKSByZXR1cm4gYXJyYXlbbiAtIDFdO1xuICB2YXIgbixcbiAgICAgIGggPSAobiAtIDEpICogcCxcbiAgICAgIGkgPSBNYXRoLmZsb29yKGgpLFxuICAgICAgYSA9IGFycmF5W2ldLFxuICAgICAgYiA9IGFycmF5W2kgKyAxXTtcbiAgcmV0dXJuIGEgKyAoYiAtIGEpICogKGggLSBpKTtcbn1cblxuZnVuY3Rpb24gZGVzY2VuZGluZyhhLCBiKSB7XG4gIHJldHVybiBiIC0gYTtcbn1cblxudmFyIHNpbXBsaWZ5ID0gZnVuY3Rpb24odG9wb2xvZ3ksIG1pbldlaWdodCkge1xuICBtaW5XZWlnaHQgPSBtaW5XZWlnaHQgPT0gbnVsbCA/IE51bWJlci5NSU5fVkFMVUUgOiArbWluV2VpZ2h0O1xuXG4gIC8vIFJlbW92ZSBwb2ludHMgd2hvc2Ugd2VpZ2h0IGlzIGxlc3MgdGhhbiB0aGUgbWluaW11bSB3ZWlnaHQuXG4gIHZhciBhcmNzID0gdG9wb2xvZ3kuYXJjcy5tYXAoZnVuY3Rpb24oaW5wdXQpIHtcbiAgICB2YXIgaSA9IC0xLFxuICAgICAgICBqID0gMCxcbiAgICAgICAgbiA9IGlucHV0Lmxlbmd0aCxcbiAgICAgICAgb3V0cHV0ID0gbmV3IEFycmF5KG4pLCAvLyBwZXNzaW1pc3RpY1xuICAgICAgICBwb2ludDtcblxuICAgIHdoaWxlICgrK2kgPCBuKSB7XG4gICAgICBpZiAoKHBvaW50ID0gaW5wdXRbaV0pWzJdID49IG1pbldlaWdodCkge1xuICAgICAgICBvdXRwdXRbaisrXSA9IFtwb2ludFswXSwgcG9pbnRbMV1dO1xuICAgICAgfVxuICAgIH1cblxuICAgIG91dHB1dC5sZW5ndGggPSBqO1xuICAgIHJldHVybiBvdXRwdXQ7XG4gIH0pO1xuXG4gIHJldHVybiB7XG4gICAgdHlwZTogXCJUb3BvbG9neVwiLFxuICAgIHRyYW5zZm9ybTogdG9wb2xvZ3kudHJhbnNmb3JtLFxuICAgIGJib3g6IHRvcG9sb2d5LmJib3gsXG4gICAgb2JqZWN0czogdG9wb2xvZ3kub2JqZWN0cyxcbiAgICBhcmNzOiBhcmNzXG4gIH07XG59O1xuXG52YXIgcGkgPSBNYXRoLlBJO1xudmFyIHRhdSA9IDIgKiBwaTtcbnZhciBxdWFydGVyUGkgPSBwaSAvIDQ7XG52YXIgcmFkaWFucyA9IHBpIC8gMTgwO1xudmFyIGFicyA9IE1hdGguYWJzO1xudmFyIGF0YW4yID0gTWF0aC5hdGFuMjtcbnZhciBjb3MgPSBNYXRoLmNvcztcbnZhciBzaW4gPSBNYXRoLnNpbjtcblxuZnVuY3Rpb24gaGFsZkFyZWEocmluZywgY2xvc2VkKSB7XG4gIHZhciBpID0gMCxcbiAgICAgIG4gPSByaW5nLmxlbmd0aCxcbiAgICAgIHN1bSA9IDAsXG4gICAgICBwb2ludCA9IHJpbmdbY2xvc2VkID8gaSsrIDogbiAtIDFdLFxuICAgICAgbGFtYmRhMCwgbGFtYmRhMSA9IHBvaW50WzBdICogcmFkaWFucyxcbiAgICAgIHBoaTEgPSAocG9pbnRbMV0gKiByYWRpYW5zKSAvIDIgKyBxdWFydGVyUGksXG4gICAgICBjb3NQaGkwLCBjb3NQaGkxID0gY29zKHBoaTEpLFxuICAgICAgc2luUGhpMCwgc2luUGhpMSA9IHNpbihwaGkxKTtcblxuICBmb3IgKDsgaSA8IG47ICsraSkge1xuICAgIHBvaW50ID0gcmluZ1tpXTtcbiAgICBsYW1iZGEwID0gbGFtYmRhMSwgbGFtYmRhMSA9IHBvaW50WzBdICogcmFkaWFucztcbiAgICBwaGkxID0gKHBvaW50WzFdICogcmFkaWFucykgLyAyICsgcXVhcnRlclBpO1xuICAgIGNvc1BoaTAgPSBjb3NQaGkxLCBjb3NQaGkxID0gY29zKHBoaTEpO1xuICAgIHNpblBoaTAgPSBzaW5QaGkxLCBzaW5QaGkxID0gc2luKHBoaTEpO1xuXG4gICAgLy8gU3BoZXJpY2FsIGV4Y2VzcyBFIGZvciBhIHNwaGVyaWNhbCB0cmlhbmdsZSB3aXRoIHZlcnRpY2VzOiBzb3V0aCBwb2xlLFxuICAgIC8vIHByZXZpb3VzIHBvaW50LCBjdXJyZW50IHBvaW50LiAgVXNlcyBhIGZvcm11bGEgZGVyaXZlZCBmcm9tIENhZ25vbGnigJlzXG4gICAgLy8gdGhlb3JlbS4gIFNlZSBUb2RodW50ZXIsIFNwaGVyaWNhbCBUcmlnLiAoMTg3MSksIFNlYy4gMTAzLCBFcS4gKDIpLlxuICAgIC8vIFNlZSBodHRwczovL2dpdGh1Yi5jb20vZDMvZDMtZ2VvL2Jsb2IvbWFzdGVyL1JFQURNRS5tZCNnZW9BcmVhXG4gICAgdmFyIGRMYW1iZGEgPSBsYW1iZGExIC0gbGFtYmRhMCxcbiAgICAgICAgc2RMYW1iZGEgPSBkTGFtYmRhID49IDAgPyAxIDogLTEsXG4gICAgICAgIGFkTGFtYmRhID0gc2RMYW1iZGEgKiBkTGFtYmRhLFxuICAgICAgICBrID0gc2luUGhpMCAqIHNpblBoaTEsXG4gICAgICAgIHUgPSBjb3NQaGkwICogY29zUGhpMSArIGsgKiBjb3MoYWRMYW1iZGEpLFxuICAgICAgICB2ID0gayAqIHNkTGFtYmRhICogc2luKGFkTGFtYmRhKTtcbiAgICBzdW0gKz0gYXRhbjIodiwgdSk7XG4gIH1cblxuICByZXR1cm4gc3VtO1xufVxuXG5mdW5jdGlvbiBzcGhlcmljYWxSaW5nQXJlYShyaW5nLCBpbnRlcmlvcikge1xuICB2YXIgc3VtID0gaGFsZkFyZWEocmluZywgdHJ1ZSk7XG4gIGlmIChpbnRlcmlvcikgc3VtICo9IC0xO1xuICByZXR1cm4gKHN1bSA8IDAgPyB0YXUgKyBzdW0gOiBzdW0pICogMjtcbn1cblxuZnVuY3Rpb24gc3BoZXJpY2FsVHJpYW5nbGVBcmVhKHQpIHtcbiAgcmV0dXJuIGFicyhoYWxmQXJlYSh0LCBmYWxzZSkpICogMjtcbn1cblxuZXhwb3J0cy5maWx0ZXIgPSBmaWx0ZXI7XG5leHBvcnRzLmZpbHRlckF0dGFjaGVkID0gZmlsdGVyQXR0YWNoZWQ7XG5leHBvcnRzLmZpbHRlckF0dGFjaGVkV2VpZ2h0ID0gZmlsdGVyQXR0YWNoZWRXZWlnaHQ7XG5leHBvcnRzLmZpbHRlcldlaWdodCA9IGZpbHRlcldlaWdodDtcbmV4cG9ydHMucGxhbmFyUmluZ0FyZWEgPSBwbGFuYXJSaW5nQXJlYTtcbmV4cG9ydHMucGxhbmFyVHJpYW5nbGVBcmVhID0gcGxhbmFyVHJpYW5nbGVBcmVhO1xuZXhwb3J0cy5wcmVzaW1wbGlmeSA9IHByZXNpbXBsaWZ5O1xuZXhwb3J0cy5xdWFudGlsZSA9IHF1YW50aWxlO1xuZXhwb3J0cy5zaW1wbGlmeSA9IHNpbXBsaWZ5O1xuZXhwb3J0cy5zcGhlcmljYWxSaW5nQXJlYSA9IHNwaGVyaWNhbFJpbmdBcmVhO1xuZXhwb3J0cy5zcGhlcmljYWxUcmlhbmdsZUFyZWEgPSBzcGhlcmljYWxUcmlhbmdsZUFyZWE7XG5cbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCAnX19lc01vZHVsZScsIHsgdmFsdWU6IHRydWUgfSk7XG5cbn0pKSk7XG4iXX0=
