/* map-tools.js 2.0.1 MIT License. 2015 Yago Ferrer <yago.ferrer@gmail.com> */
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
                feature.data = { uid: uid };
                feature.forEachProperty(function (key, value) {
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
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJidWlsZC9hZGRGZWF0dXJlLmpzIiwiYnVpbGQvYWRkRmlsdGVyLmpzIiwiYnVpbGQvYWRkTWFwLmpzIiwiYnVpbGQvYWRkTWFya2VyLmpzIiwiYnVpbGQvYWRkUGFuZWwuanMiLCJidWlsZC9jZW50ZXIuanMiLCJidWlsZC9jb25maWcuanMiLCJidWlsZC9maWx0ZXIuanMiLCJidWlsZC9maW5kTWFya2VyQnlJZC5qcyIsImJ1aWxkL2luZm9XaW5kb3cuanMiLCJidWlsZC9sb2NhdGUuanMiLCJidWlsZC9tYXBUb29scy5qcyIsImJ1aWxkL21hcHMuanMiLCJidWlsZC9yZW1vdmVNYXJrZXIuanMiLCJidWlsZC9yZXNldE1hcmtlci5qcyIsImJ1aWxkL3RlbXBsYXRlLmpzIiwiYnVpbGQvdXBkYXRlRmVhdHVyZS5qcyIsImJ1aWxkL3VwZGF0ZU1hcC5qcyIsImJ1aWxkL3VwZGF0ZU1hcmtlci5qcyIsImJ1aWxkL3V0aWxzLmpzIiwibm9kZV9tb2R1bGVzL2Nyb3NzZmlsdGVyL2Nyb3NzZmlsdGVyLmpzIiwibm9kZV9tb2R1bGVzL2Nyb3NzZmlsdGVyL2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL3RvcG9qc29uL3RvcG9qc29uLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMUlBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOUZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDZkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDVkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1RUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25DQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNiQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25IQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDejNDQTtBQUNBOztBQ0RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIi8vLyA8cmVmZXJlbmNlIHBhdGg9XCJ0eXBpbmdzL3RzZC5kLnRzXCIvPlxudmFyIHRvcG9qc29uID0gcmVxdWlyZSgndG9wb2pzb24nKTtcbnZhciB1dGlscyA9IHJlcXVpcmUoJy4vdXRpbHMnKTtcbnZhciBhZGRGaWx0ZXIgPSByZXF1aXJlKCcuL2FkZEZpbHRlcicpO1xudmFyIEFkZEZlYXR1cmUgPSAoZnVuY3Rpb24gKCkge1xuICAgIGZ1bmN0aW9uIEFkZEZlYXR1cmUodGhhdCkge1xuICAgICAgICB0aGlzLnRoYXQgPSB0aGF0O1xuICAgICAgICB2YXIgYWRkRmlsdGVySW5zdGFuY2UgPSBuZXcgYWRkRmlsdGVyKHRoYXQsICdqc29uJyk7XG4gICAgICAgIHRoaXMuYWRkRmlsdGVyID0gZnVuY3Rpb24gKGZpbHRlcnMpIHtcbiAgICAgICAgICAgIHJldHVybiBhZGRGaWx0ZXJJbnN0YW5jZS5hZGRGaWx0ZXIoZmlsdGVycyk7XG4gICAgICAgIH07XG4gICAgfVxuICAgIC8qKlxuICAgICAqIEFkZHMgR2VvSlNPTiBGZWF0dXJlIE9wdGlvbnMgbGlrZTogc3R5bGVcbiAgICAgKiBAcGFyYW0gZmVhdHVyZXNcbiAgICAgKiBAcGFyYW0gb3B0aW9uc1xuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgQWRkRmVhdHVyZS5wcm90b3R5cGUuYWRkRmVhdHVyZU9wdGlvbnMgPSBmdW5jdGlvbiAoZmVhdHVyZXMsIG9wdGlvbnMpIHtcbiAgICAgICAgdmFyIGZlYXR1cmUsIHg7XG4gICAgICAgIGZvciAoeCBpbiBmZWF0dXJlcykge1xuICAgICAgICAgICAgaWYgKGZlYXR1cmVzLmhhc093blByb3BlcnR5KHgpKSB7XG4gICAgICAgICAgICAgICAgZmVhdHVyZSA9IGZlYXR1cmVzW3hdO1xuICAgICAgICAgICAgICAgIHZhciB1aWQgPSB1dGlscy5jcmVhdGVVaWQoKTtcbiAgICAgICAgICAgICAgICBmZWF0dXJlLnVpZCA9IHVpZDtcbiAgICAgICAgICAgICAgICBmZWF0dXJlLmRhdGEgPSB7IHVpZDogdWlkIH07XG4gICAgICAgICAgICAgICAgZmVhdHVyZS5mb3JFYWNoUHJvcGVydHkoZnVuY3Rpb24gKGtleSwgdmFsdWUpIHtcbiAgICAgICAgICAgICAgICAgICAgZmVhdHVyZS5kYXRhW2tleV0gPSB2YWx1ZTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICBpZiAob3B0aW9ucykge1xuICAgICAgICAgICAgICAgICAgICBpZiAob3B0aW9ucy5maWx0ZXJzKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBBZGQgZmlsdGVycyBpZiBub3QgZGVmaW5lZC5cbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICghdGhpcy50aGF0Lmpzb24uZmlsdGVyKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5hZGRGaWx0ZXIob3B0aW9ucy5maWx0ZXJzKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMudGhhdC5qc29uLmNyb3NzZmlsdGVyLmFkZChbZmVhdHVyZV0pO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGlmIChvcHRpb25zLnN0eWxlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnRoYXQuaW5zdGFuY2UuZGF0YS5vdmVycmlkZVN0eWxlKGZlYXR1cmUsIG9wdGlvbnMuc3R5bGUpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHRoaXMudGhhdC5qc29uLmFsbFtmZWF0dXJlLmRhdGEudWlkXSA9IGZlYXR1cmU7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9O1xuICAgIC8qKlxuICAgICAqIEFkZHMgYSBUb3BvIEpTT04gZmlsZSBpbnRvIGEgTWFwXG4gICAgICogQHBhcmFtIGRhdGEgVGhlIHBhcnNlZCBKU09OIEZpbGVcbiAgICAgKiBAcGFyYW0gb3B0aW9uc1xuICAgICAqL1xuICAgIEFkZEZlYXR1cmUucHJvdG90eXBlLmFkZFRvcG9Kc29uID0gZnVuY3Rpb24gKGRhdGEsIG9wdGlvbnMpIHtcbiAgICAgICAgdmFyIGl0ZW0sIGdlb0pzb24sIGZlYXR1cmVzLCB4O1xuICAgICAgICBmb3IgKHggaW4gb3B0aW9ucykge1xuICAgICAgICAgICAgaWYgKG9wdGlvbnMuaGFzT3duUHJvcGVydHkoeCkpIHtcbiAgICAgICAgICAgICAgICBpdGVtID0gb3B0aW9uc1t4XTtcbiAgICAgICAgICAgICAgICBnZW9Kc29uID0gdG9wb2pzb24uZmVhdHVyZShkYXRhLCBkYXRhLm9iamVjdHNbaXRlbS5vYmplY3RdKTtcbiAgICAgICAgICAgICAgICBmZWF0dXJlcyA9IHRoaXMudGhhdC5pbnN0YW5jZS5kYXRhLmFkZEdlb0pzb24oZ2VvSnNvbik7XG4gICAgICAgICAgICAgICAgdGhpcy5hZGRGZWF0dXJlT3B0aW9ucyhmZWF0dXJlcywgaXRlbSk7XG4gICAgICAgICAgICAgICAgbWFwVG9vbHMubWFwc1t0aGlzLnRoYXQuaWRdLmpzb24uYWxsW2l0ZW0ub2JqZWN0XSA9IGZlYXR1cmVzO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBmZWF0dXJlcztcbiAgICB9O1xuICAgIEFkZEZlYXR1cmUucHJvdG90eXBlLmFkZEdlb0pzb24gPSBmdW5jdGlvbiAoZGF0YSwgb3B0aW9ucykge1xuICAgICAgICB2YXIgZmVhdHVyZXMgPSB0aGlzLnRoYXQuaW5zdGFuY2UuZGF0YS5hZGRHZW9Kc29uKGRhdGEsIG9wdGlvbnMpO1xuICAgICAgICB0aGlzLmFkZEZlYXR1cmVPcHRpb25zKGZlYXR1cmVzLCBvcHRpb25zKTtcbiAgICAgICAgcmV0dXJuIGZlYXR1cmVzO1xuICAgIH07XG4gICAgcmV0dXJuIEFkZEZlYXR1cmU7XG59KSgpO1xubW9kdWxlLmV4cG9ydHMgPSBBZGRGZWF0dXJlO1xuIiwiLy8vIDxyZWZlcmVuY2UgcGF0aD1cInR5cGluZ3MvdHNkLmQudHNcIi8+XG52YXIgdXRpbHMgPSByZXF1aXJlKCcuL3V0aWxzJyk7XG52YXIgQWRkRmlsdGVyID0gKGZ1bmN0aW9uICgpIHtcbiAgICBmdW5jdGlvbiBBZGRGaWx0ZXIodGhhdCwgdHlwZSkge1xuICAgICAgICB0aGlzLnRoYXQgPSB0aGF0O1xuICAgICAgICB0aGlzLnR5cGUgPSB0eXBlO1xuICAgIH1cbiAgICBBZGRGaWx0ZXIucHJvdG90eXBlLmFkZEZpbHRlciA9IGZ1bmN0aW9uIChmaWx0ZXJzKSB7XG4gICAgICAgIHRoaXMudGhhdFt0aGlzLnR5cGVdLmNyb3NzZmlsdGVyID0gdGhpcy50aGF0W3RoaXMudHlwZV0uY3Jvc3NmaWx0ZXIgfHwgdGhpcy50aGF0LmNyb3NzZmlsdGVyKFtdKTtcbiAgICAgICAgdGhpcy50aGF0W3RoaXMudHlwZV0uZmlsdGVyID0gdGhpcy50aGF0W3RoaXMudHlwZV0uZmlsdGVyIHx8IHt9O1xuICAgICAgICB2YXIgZGltZW5zaW9uLCBpdGVtO1xuICAgICAgICBpZiAodHlwZW9mIGZpbHRlcnMgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICBmaWx0ZXJzID0gW2ZpbHRlcnNdO1xuICAgICAgICB9XG4gICAgICAgIGZvciAoZGltZW5zaW9uIGluIGZpbHRlcnMpIHtcbiAgICAgICAgICAgIGlmIChmaWx0ZXJzLmhhc093blByb3BlcnR5KGRpbWVuc2lvbikpIHtcbiAgICAgICAgICAgICAgICBpdGVtID0gZmlsdGVyc1tkaW1lbnNpb25dO1xuICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgaXRlbSA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy50aGF0W3RoaXMudHlwZV0uZmlsdGVyW2l0ZW1dID0gdGhpcy50aGF0W3RoaXMudHlwZV0uY3Jvc3NmaWx0ZXIuZGltZW5zaW9uKHV0aWxzLmRlZmF1bHREaW1lbnNpb24oaXRlbSkpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy50aGF0W3RoaXMudHlwZV0uZmlsdGVyW09iamVjdC5rZXlzKGl0ZW0pWzBdXSA9IHRoaXMudGhhdFt0aGlzLnR5cGVdLmNyb3NzZmlsdGVyLmRpbWVuc2lvbihpdGVtW09iamVjdC5rZXlzKGl0ZW0pWzBdXSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfTtcbiAgICByZXR1cm4gQWRkRmlsdGVyO1xufSkoKTtcbm1vZHVsZS5leHBvcnRzID0gQWRkRmlsdGVyO1xuIiwiLy8vIDxyZWZlcmVuY2UgcGF0aD1cInR5cGluZ3MvdHNkLmQudHNcIi8+XG52YXIgbWFwcyA9IHJlcXVpcmUoJy4vbWFwcycpO1xudmFyIGNvbmZpZyA9IHJlcXVpcmUoJy4vY29uZmlnJyk7XG52YXIgQWRkTWFwID0gKGZ1bmN0aW9uICgpIHtcbiAgICBmdW5jdGlvbiBBZGRNYXAodGhhdCkge1xuICAgICAgICB0aGlzLnRoYXQgPSB0aGF0O1xuICAgIH1cbiAgICBBZGRNYXAucHJvdG90eXBlLmdldEVsZW1lbnQgPSBmdW5jdGlvbiAoYXJncykge1xuICAgICAgICBpZiAoYXJncy5lbCkge1xuICAgICAgICAgICAgcmV0dXJuIHdpbmRvdy5kb2N1bWVudC5xdWVyeVNlbGVjdG9yKGFyZ3MuZWwpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChhcmdzLmlkKSB7XG4gICAgICAgICAgICByZXR1cm4gd2luZG93LmRvY3VtZW50LmdldEVsZW1lbnRCeUlkKGFyZ3MuaWQpO1xuICAgICAgICB9XG4gICAgfTtcbiAgICBBZGRNYXAucHJvdG90eXBlLmNyZWF0ZSA9IGZ1bmN0aW9uIChhcmdzLCBjYikge1xuICAgICAgICB2YXIgX3RoaXMgPSB0aGlzO1xuICAgICAgICBjYiA9IGNiIHx8IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgfTtcbiAgICAgICAgdmFyIG1hcE9wdGlvbnMgPSBtYXBzLm1hcE9wdGlvbnMoYXJncyk7XG4gICAgICAgIGFyZ3MuaWQgPSBhcmdzLmlkIHx8IGFyZ3MuZWwuc3Vic3RyaW5nKDEpO1xuICAgICAgICB0aGlzLnRoYXQuaWQgPSBhcmdzLmlkO1xuICAgICAgICB0aGlzLnRoYXQub3B0aW9ucyA9IGFyZ3M7XG4gICAgICAgIHRoaXMudGhhdC5pbnN0YW5jZSA9IG5ldyBnb29nbGUubWFwcy5NYXAodGhpcy5nZXRFbGVtZW50KGFyZ3MpLCBtYXBPcHRpb25zKTtcbiAgICAgICAgdGhpcy50aGF0LmV2ZW50cyA9IFtdO1xuICAgICAgICAvLyBBZGQgRXZlbnRzXG4gICAgICAgIGlmIChhcmdzLm9uKSB7XG4gICAgICAgICAgICB2YXIgaTtcbiAgICAgICAgICAgIGZvciAoaSBpbiBhcmdzLm9uKSB7XG4gICAgICAgICAgICAgICAgaWYgKGFyZ3Mub24uaGFzT3duUHJvcGVydHkoaSkpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGNvbmZpZy5jdXN0b21FdmVudHMuaW5kZXhPZihpKSA+IC0xKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnRoYXQuZXZlbnRzLnB1c2goaSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgZ29vZ2xlLm1hcHMuZXZlbnQuYWRkTGlzdGVuZXIodGhpcy50aGF0Lmluc3RhbmNlLCBpLCBhcmdzLm9uW2ldKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy50aGF0LmluZm9XaW5kb3cgPSBmYWxzZTtcbiAgICAgICAgdGhpcy50aGF0LnRlbXBsYXRlcyA9IHtcbiAgICAgICAgICAgIGluZm9XaW5kb3c6IHt9LFxuICAgICAgICAgICAgcGFuZWw6IHt9XG4gICAgICAgIH07XG4gICAgICAgIHRoaXMudGhhdC51aWQgPSBhcmdzLnVpZDtcbiAgICAgICAgbWFwVG9vbHMubWFwc1t0aGlzLnRoYXQuaWRdLmluc3RhbmNlID0gdGhpcy50aGF0Lmluc3RhbmNlO1xuICAgICAgICBnb29nbGUubWFwcy5ldmVudC5hZGRMaXN0ZW5lck9uY2UodGhpcy50aGF0Lmluc3RhbmNlLCAnaWRsZScsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGNiKGZhbHNlLCBfdGhpcy50aGF0KTtcbiAgICAgICAgfSk7XG4gICAgfTtcbiAgICBBZGRNYXAucHJvdG90eXBlLnZhbGlkT3B0aW9ucyA9IGZ1bmN0aW9uIChvcHRpb25zLCBjYikge1xuICAgICAgICBpZiAoIW9wdGlvbnMgfHwgKG9wdGlvbnMgJiYgdHlwZW9mIG9wdGlvbnMgIT09ICdvYmplY3QnKSkge1xuICAgICAgICAgICAgY2IobmV3IEVycm9yKCdZb3UgbXVzdCBwYXNzIGEgdmFsaWQgZmlyc3QgcGFyYW1ldGVyOiBvcHRpb25zJykpO1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG4gICAgICAgIGlmICghb3B0aW9ucy5pZCAmJiAhb3B0aW9ucy5lbCkge1xuICAgICAgICAgICAgY2IobmV3IEVycm9yKCdZb3UgbXVzdCBwYXNzIGFuIFwiaWRcIiBvciBhIFwiZWxcIiBwcm9wZXJ0eSB2YWx1ZXMnKSk7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCFvcHRpb25zLmxhdCB8fCAhb3B0aW9ucy5sbmcpIHtcbiAgICAgICAgICAgIGNiKG5ldyBFcnJvcignWW91IG11c3QgcGFzcyB2YWxpZCBcImxhdFwiIChsYXRpdHVkZSkgYW5kIFwibG5nXCIgKGxvbmdpdHVkZSkgdmFsdWVzJykpO1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgIH07XG4gICAgQWRkTWFwLnByb3RvdHlwZS5sb2FkID0gZnVuY3Rpb24gKG9wdGlvbnMsIGNiKSB7XG4gICAgICAgIGlmICh0aGlzLnZhbGlkT3B0aW9ucyhvcHRpb25zLCBjYikpIHtcbiAgICAgICAgICAgIHZhciBpZCA9IG9wdGlvbnMuaWQgfHwgb3B0aW9ucy5lbC5zdWJzdHJpbmcoMSk7XG4gICAgICAgICAgICBtYXBUb29scy5tYXBzID0gbWFwVG9vbHMubWFwcyB8fCB7fTtcbiAgICAgICAgICAgIGlmIChtYXBUb29scy5tYXBzW2lkXSkge1xuICAgICAgICAgICAgICAgIHZhciBtc2cgPSAnVGhlcmUgaXMgYWxyZWFkeSBhbm90aGVyIE1hcCB1c2luZyB0aGUgc2FtZSBpZDogJyArIGlkO1xuICAgICAgICAgICAgICAgIGNiKG5ldyBFcnJvcihtc2cpKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB2YXIgdGhhdCA9IHRoaXM7XG4gICAgICAgICAgICBtYXBUb29scy5tYXBzW2lkXSA9IHtcbiAgICAgICAgICAgICAgICBjcmVhdGU6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhhdC5jcmVhdGUodGhpcy5hcmd1bWVudHMsIGNiKTtcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIGFyZ3VtZW50czogb3B0aW9uc1xuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIC8vIFNldCBHbG9iYWwgU3RydWN0dXJlXG4gICAgICAgICAgICBtYXBUb29scy5tYXBzW2lkXS5tYXJrZXJzID0gbWFwVG9vbHMubWFwc1tpZF0ubWFya2VycyB8fCB7IGFsbDoge30sIHRhZ3M6IHt9LCBkYXRhQ2hhbmdlZDogZmFsc2UgfTtcbiAgICAgICAgICAgIG1hcFRvb2xzLm1hcHNbaWRdLmpzb24gPSBtYXBUb29scy5tYXBzW2lkXS5qc29uIHx8IHsgYWxsOiB7fSwgZGF0YUNoYW5nZWQ6IGZhbHNlIH07XG4gICAgICAgICAgICB0aGlzLnRoYXQubWFya2VycyA9IG1hcFRvb2xzLm1hcHNbaWRdLm1hcmtlcnM7XG4gICAgICAgICAgICB0aGlzLnRoYXQuanNvbiA9IG1hcFRvb2xzLm1hcHNbaWRdLmpzb247XG4gICAgICAgICAgICBpZiAob3B0aW9ucy5hc3luYyAhPT0gZmFsc2UgfHwgb3B0aW9ucy5zeW5jID09PSB0cnVlKSB7XG4gICAgICAgICAgICAgICAgbWFwcy5sb2FkKGlkLCBvcHRpb25zKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIG1hcFRvb2xzLm1hcHNbaWRdLmNyZWF0ZSgpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfTtcbiAgICByZXR1cm4gQWRkTWFwO1xufSkoKTtcbm1vZHVsZS5leHBvcnRzID0gQWRkTWFwO1xuIiwiLy8vIDxyZWZlcmVuY2UgcGF0aD1cInR5cGluZ3MvdHNkLmQudHNcIi8+XG52YXIgdXRpbHMgPSByZXF1aXJlKCcuL3V0aWxzJyk7XG52YXIgYWRkRmlsdGVyID0gcmVxdWlyZSgnLi9hZGRGaWx0ZXInKTtcbnZhciBpbmZvV2luZG93ID0gcmVxdWlyZSgnLi9pbmZvV2luZG93Jyk7XG52YXIgQWRkTWFya2VyID0gKGZ1bmN0aW9uICgpIHtcbiAgICBmdW5jdGlvbiBBZGRNYXJrZXIodGhhdCkge1xuICAgICAgICB0aGlzLnRoYXQgPSB0aGF0O1xuICAgICAgICB0aGlzLmluZm9XaW5kb3cgPSB7fTtcbiAgICAgICAgdmFyIGFkZEZpbHRlckluc3RhbmNlID0gbmV3IGFkZEZpbHRlcih0aGF0LCAnbWFya2VycycpO1xuICAgICAgICB0aGlzLmFkZEZpbHRlciA9IGZ1bmN0aW9uIChmaWx0ZXJzKSB7XG4gICAgICAgICAgICByZXR1cm4gYWRkRmlsdGVySW5zdGFuY2UuYWRkRmlsdGVyKGZpbHRlcnMpO1xuICAgICAgICB9O1xuICAgICAgICB2YXIgaW5mb1dpbmRvd0luc3RhbmNlID0gbmV3IGluZm9XaW5kb3codGhhdCk7XG4gICAgICAgIHRoaXMuaW5mb1dpbmRvdy5hZGRFdmVudHMgPSBmdW5jdGlvbiAobWFya2VyLCBvcHRpb25zLCBtYXApIHtcbiAgICAgICAgICAgIGluZm9XaW5kb3dJbnN0YW5jZS5hZGRFdmVudHMobWFya2VyLCBvcHRpb25zLCBtYXApO1xuICAgICAgICB9O1xuICAgIH1cbiAgICBBZGRNYXJrZXIucHJvdG90eXBlLmFkZEV4dHJhT3B0aW9ucyA9IGZ1bmN0aW9uIChtYXJrZXIsIG9wdGlvbnMpIHtcbiAgICAgICAgdmFyIGk7XG4gICAgICAgIGZvciAoaSBpbiBvcHRpb25zKSB7XG4gICAgICAgICAgICBpZiAob3B0aW9ucy5oYXNPd25Qcm9wZXJ0eShpKSkge1xuICAgICAgICAgICAgICAgIGlmICghb3B0aW9ucy5maWx0ZXJzKSB7XG4gICAgICAgICAgICAgICAgICAgIG1hcmtlcltpXSA9IG9wdGlvbnNbaV07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfTtcbiAgICBBZGRNYXJrZXIucHJvdG90eXBlLmFkZE9wdGlvbnMgPSBmdW5jdGlvbiAobWFya2VyLCBpbnN0YW5jZSkge1xuICAgICAgICBpZiAobWFya2VyLm1vdmUpIHtcbiAgICAgICAgICAgIGluc3RhbmNlLnNldEFuaW1hdGlvbihnb29nbGUubWFwcy5BbmltYXRpb25bbWFya2VyLm1vdmUudG9VcHBlckNhc2UoKV0pO1xuICAgICAgICB9XG4gICAgICAgIGlmIChtYXJrZXIuaW5mb1dpbmRvdykge1xuICAgICAgICAgICAgdGhpcy5pbmZvV2luZG93LmFkZEV2ZW50cyhpbnN0YW5jZSwgbWFya2VyLmluZm9XaW5kb3csIHRoaXMudGhhdC5pbnN0YW5jZSk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKG1hcmtlci5vbikge1xuICAgICAgICAgICAgdGhpcy5hZGRFdmVudHMobWFya2VyLCBpbnN0YW5jZSk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKG1hcmtlci5jYWxsYmFjaykge1xuICAgICAgICAgICAgbWFya2VyLmNhbGxiYWNrKGluc3RhbmNlKTtcbiAgICAgICAgfVxuICAgIH07XG4gICAgQWRkTWFya2VyLnByb3RvdHlwZS5fYWRkTWFya2VyID0gZnVuY3Rpb24gKG1hcmtlciwgb3B0aW9ucykge1xuICAgICAgICBtYXJrZXIubWFwID0gdGhpcy50aGF0Lmluc3RhbmNlO1xuICAgICAgICBtYXJrZXIucG9zaXRpb24gPSBuZXcgZ29vZ2xlLm1hcHMuTGF0TG5nKG1hcmtlci5sYXQsIG1hcmtlci5sbmcpO1xuICAgICAgICAvLyBBZGRzIG9wdGlvbnMgc2V0IHZpYSAybmQgcGFyYW1ldGVyLiBPdmVyd3JpdGVzIGFueSBNYXJrZXIgb3B0aW9ucyBhbHJlYWR5IHNldC5cbiAgICAgICAgaWYgKG9wdGlvbnMpIHtcbiAgICAgICAgICAgIHRoaXMuYWRkRXh0cmFPcHRpb25zKG1hcmtlciwgb3B0aW9ucyk7XG4gICAgICAgIH1cbiAgICAgICAgbWFya2VyLmRhdGEgPSBtYXJrZXIuZGF0YSB8fCB7fTtcbiAgICAgICAgbWFya2VyLmRhdGEuX3NlbGYgPSBtYXJrZXI7IC8vIFRoaXMgaGVscHMgbWUgdG8gZG8gbGF0ZXIgcmVzZXRNYXJrZXIoKVxuICAgICAgICB0aGlzLnNldFVpZChtYXJrZXIpO1xuICAgICAgICAvLyBCZWNhdXNlIHdlIGFyZSBub3QgYWxsb3dpbmcgZHVwbGljYXRlc1xuICAgICAgICBpZiAodGhpcy50aGF0Lm1hcmtlcnMuYWxsW21hcmtlci51aWRdKSB7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKG9wdGlvbnMgJiYgb3B0aW9ucy5maWx0ZXJzKSB7XG4gICAgICAgICAgICAvLyBPbmx5IGFkZCBmaWx0ZXJzIGlmIG5vdCBkZWZpbmVkLlxuICAgICAgICAgICAgaWYgKCFtYXBUb29scy5tYXBzW3RoaXMudGhhdC5pZF0ubWFya2Vycy5maWx0ZXIpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmFkZEZpbHRlcihvcHRpb25zLmZpbHRlcnMpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHZhciBpbnN0YW5jZSA9IG5ldyBnb29nbGUubWFwcy5NYXJrZXIobWFya2VyKTtcbiAgICAgICAgdGhpcy50aGF0Lm1hcmtlcnMuY3Jvc3NmaWx0ZXIgPSB0aGlzLnRoYXQubWFya2Vycy5jcm9zc2ZpbHRlciB8fCB0aGlzLnRoYXQuY3Jvc3NmaWx0ZXIoW10pO1xuICAgICAgICB0aGlzLnRoYXQubWFya2Vycy5maWx0ZXIgPSB0aGlzLnRoYXQubWFya2Vycy5maWx0ZXIgfHwge307XG4gICAgICAgIHRoaXMudGhhdC5tYXJrZXJzLmNyb3NzZmlsdGVyLmFkZChbaW5zdGFuY2VdKTtcbiAgICAgICAgdGhpcy5hZGRPcHRpb25zKG1hcmtlciwgaW5zdGFuY2UpO1xuICAgICAgICAvLyBBZGRzIE1hcmtlciBSZWZlcmVuY2Ugb2YgZWFjaCBNYXJrZXIgdG8gXCJtYXJrZXJzLmFsbFwiXG4gICAgICAgIHRoaXMudGhhdC5tYXJrZXJzLmFsbCA9IG1hcFRvb2xzLm1hcHNbdGhpcy50aGF0LmlkXS5tYXJrZXJzLmFsbCB8fCB7fTtcbiAgICAgICAgdGhpcy50aGF0Lm1hcmtlcnMuYWxsW21hcmtlci51aWRdID0gaW5zdGFuY2U7XG4gICAgICAgIGlmIChtYXJrZXIudGFncykge1xuICAgICAgICAgICAgdGhpcy5hZGRNYXJrZXJCeVRhZyhtYXJrZXIsIGluc3RhbmNlKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gaW5zdGFuY2U7XG4gICAgfTtcbiAgICBBZGRNYXJrZXIucHJvdG90eXBlLnNldFVpZCA9IGZ1bmN0aW9uIChtYXJrZXIpIHtcbiAgICAgICAgaWYgKHRoaXMudGhhdC51aWQgJiYgbWFya2VyW3RoaXMudGhhdC51aWRdKSB7XG4gICAgICAgICAgICBtYXJrZXIuZGF0YS51aWQgPSBtYXJrZXJbdGhpcy50aGF0LnVpZF07XG4gICAgICAgICAgICBtYXJrZXIudWlkID0gbWFya2VyLmRhdGEudWlkO1xuICAgICAgICB9XG4gICAgICAgIGlmIChtYXJrZXIuZGF0YS51aWQgJiYgIW1hcmtlci51aWQpIHtcbiAgICAgICAgICAgIG1hcmtlci51aWQgPSBtYXJrZXIuZGF0YS51aWQ7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCFtYXJrZXIudWlkKSB7XG4gICAgICAgICAgICBtYXJrZXIuZGF0YS51aWQgPSB1dGlscy5jcmVhdGVVaWQoKTtcbiAgICAgICAgICAgIG1hcmtlci51aWQgPSBtYXJrZXIuZGF0YS51aWQ7XG4gICAgICAgIH1cbiAgICB9O1xuICAgIEFkZE1hcmtlci5wcm90b3R5cGUuYWRkTWFya2VyQnlUYWcgPSBmdW5jdGlvbiAobWFya2VyLCBpbnN0YW5jZSkge1xuICAgICAgICBpZiAodXRpbHMuaXNBcnJheShtYXJrZXIudGFncykpIHtcbiAgICAgICAgICAgIHZhciBpLCB0YWc7XG4gICAgICAgICAgICBmb3IgKGkgaW4gbWFya2VyLnRhZ3MpIHtcbiAgICAgICAgICAgICAgICBpZiAobWFya2VyLnRhZ3MuaGFzT3duUHJvcGVydHkoaSkpIHtcbiAgICAgICAgICAgICAgICAgICAgdGFnID0gbWFya2VyLnRhZ3NbaV07XG4gICAgICAgICAgICAgICAgICAgIHRoaXMudGhhdC5tYXJrZXJzLnRhZ3NbdGFnXSA9IHRoaXMudGhhdC5tYXJrZXJzLnRhZ3NbdGFnXSB8fCB7fTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy50aGF0Lm1hcmtlcnMudGFnc1t0YWddW2luc3RhbmNlLmRhdGEudWlkXSA9IGluc3RhbmNlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMudGhhdC5tYXJrZXJzLnRhZ3NbbWFya2VyLnRhZ3NdID0gdGhpcy50aGF0Lm1hcmtlcnMudGFnc1ttYXJrZXIudGFnc10gfHwge307XG4gICAgICAgICAgICB0aGlzLnRoYXQubWFya2Vycy50YWdzW21hcmtlci50YWdzXVtpbnN0YW5jZS5kYXRhLnVpZF0gPSBpbnN0YW5jZTtcbiAgICAgICAgfVxuICAgIH07XG4gICAgQWRkTWFya2VyLnByb3RvdHlwZS5hZGRFdmVudHMgPSBmdW5jdGlvbiAobWFya2VyLCBpbnN0YW5jZSkge1xuICAgICAgICB2YXIgaTtcbiAgICAgICAgZm9yIChpIGluIG1hcmtlci5vbikge1xuICAgICAgICAgICAgaWYgKG1hcmtlci5vbi5oYXNPd25Qcm9wZXJ0eShpKSkge1xuICAgICAgICAgICAgICAgIGdvb2dsZS5tYXBzLmV2ZW50LmFkZExpc3RlbmVyKGluc3RhbmNlLCBpLCBtYXJrZXIub25baV0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfTtcbiAgICAvKipcbiAgICAgKiBBZGRzIE1hcmtlcnMgdG8gdGhlIE1hcFxuICAgICAqIEBwYXJhbSBhcmdzIEFycmF5IG9yIE1hcmtlcnNcbiAgICAgKiBAcGFyYW0gb3B0aW9ucyB0aGluZ3MgbGlrZSBncm91cHMgZXRjXG4gICAgICogQHJldHVybnMge0FycmF5fSBhbGwgdGhlIGluc3RhbmNlcyBvZiB0aGUgbWFya2Vycy5cbiAgICAgKi9cbiAgICBBZGRNYXJrZXIucHJvdG90eXBlLmFkZE1hcmtlciA9IGZ1bmN0aW9uIChhcmdzLCBvcHRpb25zKSB7XG4gICAgICAgIGlmICh1dGlscy5pc0FycmF5KGFyZ3MpKSB7XG4gICAgICAgICAgICBpZiAoYXJncy5sZW5ndGggPj0gMSkge1xuICAgICAgICAgICAgICAgIHZhciBtYXJrZXIsIG1hcmtlcnMgPSBbXTtcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBpIGluIGFyZ3MpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGFyZ3MuaGFzT3duUHJvcGVydHkoaSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG1hcmtlciA9IHRoaXMuX2FkZE1hcmtlcihhcmdzW2ldLCBvcHRpb25zKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIG1hcmtlcnMucHVzaChtYXJrZXIpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHRoaXMudGhhdC5tYXJrZXJzLmRhdGFDaGFuZ2VkID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICByZXR1cm4gbWFya2VycztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBbXTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLnRoYXQubWFya2Vycy5kYXRhQ2hhbmdlZCA9IHRydWU7XG4gICAgICAgIHJldHVybiB0aGlzLl9hZGRNYXJrZXIoYXJncywgb3B0aW9ucyk7XG4gICAgfTtcbiAgICByZXR1cm4gQWRkTWFya2VyO1xufSkoKTtcbm1vZHVsZS5leHBvcnRzID0gQWRkTWFya2VyO1xuIiwiLy8vIDxyZWZlcmVuY2UgcGF0aD1cInRlbXBsYXRlLnRzXCIvPlxuLy8vIDxyZWZlcmVuY2UgcGF0aD1cImNvbmZpZy50c1wiLz5cbi8vLyA8cmVmZXJlbmNlIHBhdGg9XCJ0eXBpbmdzL3RzZC5kLnRzXCIvPlxudmFyIGNvbmZpZyA9IHJlcXVpcmUoJy4vY29uZmlnJyk7XG52YXIgdGVtcGxhdGUgPSByZXF1aXJlKCcuL3RlbXBsYXRlJyk7XG52YXIgQWRkUGFuZWwgPSAoZnVuY3Rpb24gKCkge1xuICAgIGZ1bmN0aW9uIEFkZFBhbmVsKHRoYXQpIHtcbiAgICAgICAgdGhpcy50aGF0ID0gdGhhdDtcbiAgICAgICAgdmFyIHRlbXBsYXRlSW5zdGFuY2UgPSBuZXcgdGVtcGxhdGUodGhhdCk7XG4gICAgICAgIHRoaXMudGVtcGxhdGUgPSBmdW5jdGlvbiAodHlwZSwgdXJsLCBjYikge1xuICAgICAgICAgICAgcmV0dXJuIHRlbXBsYXRlSW5zdGFuY2UubG9hZCh0eXBlLCB1cmwsIGNiKTtcbiAgICAgICAgfTtcbiAgICB9XG4gICAgQWRkUGFuZWwucHJvdG90eXBlLmdldFBvc2l0aW9uS2V5ID0gZnVuY3Rpb24gKHBvcykge1xuICAgICAgICByZXR1cm4gcG9zLnRvVXBwZXJDYXNlKCkubWF0Y2goL1xcUysvZykuam9pbignXycpO1xuICAgIH07XG4gICAgQWRkUGFuZWwucHJvdG90eXBlLmh5MmNtbWwgPSBmdW5jdGlvbiAoaykge1xuICAgICAgICByZXR1cm4gay5yZXBsYWNlKC8tKC4pL2csIGZ1bmN0aW9uIChtLCBnKSB7XG4gICAgICAgICAgICByZXR1cm4gZy50b1VwcGVyQ2FzZSgpO1xuICAgICAgICB9KTtcbiAgICB9O1xuICAgIEFkZFBhbmVsLnByb3RvdHlwZS5IVE1MUGFyc2VyID0gZnVuY3Rpb24gKGFIVE1MU3RyaW5nKSB7XG4gICAgICAgIHZhciBjb250YWluZXIgPSB3aW5kb3cuZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgICAgIGNvbnRhaW5lci5pbm5lckhUTUwgPSBhSFRNTFN0cmluZztcbiAgICAgICAgcmV0dXJuIGNvbnRhaW5lcjtcbiAgICB9O1xuICAgIEFkZFBhbmVsLnByb3RvdHlwZS5vblN1Y2Nlc3MgPSBmdW5jdGlvbiAob3B0aW9ucywgcG9zaXRpb24sIHBhbmVsLCBjYikge1xuICAgICAgICB2YXIgZSwgcnVsZTtcbiAgICAgICAgLy8gcG9zaXRpb25pbmcgb3B0aW9uc1xuICAgICAgICBpZiAob3B0aW9ucy5wb3NpdGlvbikge1xuICAgICAgICAgICAgLy8gY29udmVydCB0byBnb29nbGUgQ29udHJvbFBvc2l0aW9uIG1hcCBwb3NpdGlvbiBrZXlzXG4gICAgICAgICAgICBvcHRpb25zLnBvc2l0aW9uID0gdGhpcy5nZXRQb3NpdGlvbktleShvcHRpb25zLnBvc2l0aW9uKTtcbiAgICAgICAgICAgIHBvc2l0aW9uID0gZ29vZ2xlLm1hcHMuQ29udHJvbFBvc2l0aW9uW29wdGlvbnMucG9zaXRpb25dO1xuICAgICAgICB9XG4gICAgICAgIC8vIHN0eWxlIG9wdGlvbnNcbiAgICAgICAgaWYgKHR5cGVvZiBvcHRpb25zLnN0eWxlID09PSAnb2JqZWN0Jykge1xuICAgICAgICAgICAgZm9yIChydWxlIGluIG9wdGlvbnMuc3R5bGUpIHtcbiAgICAgICAgICAgICAgICBpZiAob3B0aW9ucy5zdHlsZS5oYXNPd25Qcm9wZXJ0eShydWxlKSkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgcnVsZUtleSA9IHRoaXMuaHkyY21tbChydWxlKTtcbiAgICAgICAgICAgICAgICAgICAgcGFuZWwuc3R5bGVbcnVsZUtleV0gPSBvcHRpb25zLnN0eWxlW3J1bGVdO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICAvLyBldmVudCBoYW5kbGVyXG4gICAgICAgIGlmIChvcHRpb25zLmV2ZW50cykge1xuICAgICAgICAgICAgZm9yIChlIGluIG9wdGlvbnMuZXZlbnRzKSB7XG4gICAgICAgICAgICAgICAgaWYgKG9wdGlvbnMuZXZlbnRzLmhhc093blByb3BlcnR5KGUpKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBrZXlzID0gZS5tYXRjaCgvXFxTKy9nKTtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGV2ZW50ID0ga2V5cy5zcGxpY2UoLTEpOyAvL2V2ZW50IHR5cGVcbiAgICAgICAgICAgICAgICAgICAgdmFyIHNlbGVjdG9yID0ga2V5cy5qb2luKCcgJyk7IC8vIHNlbGVjdG9yIHN0cmluZ1xuICAgICAgICAgICAgICAgICAgICB2YXIgZWxlbWVudHMgPSBwYW5lbC5xdWVyeVNlbGVjdG9yQWxsKHNlbGVjdG9yKTtcbiAgICAgICAgICAgICAgICAgICAgW10uZm9yRWFjaC5jYWxsKGVsZW1lbnRzLCBmdW5jdGlvbiAoZWxtKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBnb29nbGUubWFwcy5ldmVudC5hZGREb21MaXN0ZW5lcihlbG0sIGV2ZW50LCBvcHRpb25zLmV2ZW50c1tlXSk7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICB0aGlzLnRoYXQuaW5zdGFuY2UuY29udHJvbHNbcG9zaXRpb25dLnB1c2gocGFuZWwpO1xuICAgICAgICB0aGlzLnRoYXQucGFuZWxzID0gdGhpcy50aGF0LnBhbmVscyB8fCB7fTtcbiAgICAgICAgdGhpcy50aGF0LnBhbmVsc1twb3NpdGlvbl0gPSBwYW5lbDtcbiAgICAgICAgY2IoZmFsc2UsIHBhbmVsKTtcbiAgICB9O1xuICAgIEFkZFBhbmVsLnByb3RvdHlwZS5hZGRQYW5lbCA9IGZ1bmN0aW9uIChvcHRpb25zLCBjYikge1xuICAgICAgICB2YXIgX3RoaXMgPSB0aGlzO1xuICAgICAgICBjYiA9IGNiIHx8IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgfTtcbiAgICAgICAgdmFyIHBvc2l0aW9uLCBwYW5lbDtcbiAgICAgICAgLy8gZGVmYXVsdCBwb3NpdGlvblxuICAgICAgICBvcHRpb25zLnBvc2l0aW9uID0gb3B0aW9ucy5wb3NpdGlvbiB8fCBjb25maWcucGFuZWxQb3NpdGlvbjtcbiAgICAgICAgaWYgKG9wdGlvbnMudGVtcGxhdGVVUkwpIHtcbiAgICAgICAgICAgIHRoaXMudGVtcGxhdGUoJ3BhbmVsJywgb3B0aW9ucy50ZW1wbGF0ZVVSTCwgZnVuY3Rpb24gKGVyciwgcmVzcG9uc2UpIHtcbiAgICAgICAgICAgICAgICBpZiAoIWVycikge1xuICAgICAgICAgICAgICAgICAgICBwYW5lbCA9IF90aGlzLkhUTUxQYXJzZXIocmVzcG9uc2UpO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gX3RoaXMub25TdWNjZXNzKG9wdGlvbnMsIHBvc2l0aW9uLCBwYW5lbCwgY2IpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgY2IoZXJyKTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgaWYgKHR5cGVvZiBvcHRpb25zLnRlbXBsYXRlID09PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgICAgIHBhbmVsID0gdGhpcy5IVE1MUGFyc2VyKG9wdGlvbnMudGVtcGxhdGUpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgcGFuZWwgPSBvcHRpb25zLnRlbXBsYXRlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpcy5vblN1Y2Nlc3Mob3B0aW9ucywgcG9zaXRpb24sIHBhbmVsLCBjYik7XG4gICAgICAgIH1cbiAgICB9O1xuICAgIHJldHVybiBBZGRQYW5lbDtcbn0pKCk7XG5tb2R1bGUuZXhwb3J0cyA9IEFkZFBhbmVsO1xuIiwiLy8vIDxyZWZlcmVuY2UgcGF0aD1cInR5cGluZ3MvdHNkLmQudHNcIi8+XG52YXIgQ2VudGVyID0gKGZ1bmN0aW9uICgpIHtcbiAgICBmdW5jdGlvbiBDZW50ZXIoKSB7XG4gICAgfVxuICAgIENlbnRlci5wcm90b3R5cGUucG9zID0gZnVuY3Rpb24gKGxhdCwgbG5nKSB7XG4gICAgICAgIHZhciBwb3NpdGlvbjtcbiAgICAgICAgaWYgKGxhdCAmJiBsbmcpIHtcbiAgICAgICAgICAgIHBvc2l0aW9uID0gbmV3IGdvb2dsZS5tYXBzLkxhdExuZyhsYXQsIGxuZyk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBwb3NpdGlvbiA9IG5ldyBnb29nbGUubWFwcy5MYXRMbmcodGhpcy5vcHRpb25zLmxhdCwgdGhpcy5vcHRpb25zLmxuZyk7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5pbnN0YW5jZS5zZXRDZW50ZXIocG9zaXRpb24pO1xuICAgIH07XG4gICAgcmV0dXJuIENlbnRlcjtcbn0pKCk7XG5tb2R1bGUuZXhwb3J0cyA9IENlbnRlcjtcbiIsIi8vLyA8cmVmZXJlbmNlIHBhdGg9XCJ0eXBpbmdzL3RzZC5kLnRzXCIvPlxudmFyIENvbmZpZyA9IChmdW5jdGlvbiAoKSB7XG4gICAgZnVuY3Rpb24gQ29uZmlnKCkge1xuICAgIH1cbiAgICBDb25maWcudmVyc2lvbiA9ICczLjE4JzsgLy8gUmVsZWFzZWQ6IE1heSAxNSwgMjAxXG4gICAgQ29uZmlnLnVybCA9ICcvL21hcHMuZ29vZ2xlYXBpcy5jb20vbWFwcy9hcGkvanMnO1xuICAgIENvbmZpZy56b29tID0gODtcbiAgICBDb25maWcuY3VzdG9tTWFwT3B0aW9ucyA9IFsnaWQnLCAnbGF0JywgJ2xuZycsICd0eXBlJywgJ3VpZCddO1xuICAgIENvbmZpZy5jdXN0b21NYXJrZXJPcHRpb25zID0gWydsYXQnLCAnbG5nJywgJ21vdmUnLCAnaW5mb1dpbmRvdycsICdvbicsICdjYWxsYmFjaycsICd0YWdzJ107XG4gICAgQ29uZmlnLnBhbmVsUG9zaXRpb24gPSAnVE9QX0xFRlQnO1xuICAgIENvbmZpZy5jdXN0b21JbmZvV2luZG93T3B0aW9ucyA9IFsnb3BlbicsICdjbG9zZSddO1xuICAgIENvbmZpZy5jdXN0b21FdmVudHMgPSBbJ21hcmtlcl92aXNpYmlsaXR5X2NoYW5nZWQnXTtcbiAgICByZXR1cm4gQ29uZmlnO1xufSkoKTtcbm1vZHVsZS5leHBvcnRzID0gQ29uZmlnO1xuIiwiLy8vIDxyZWZlcmVuY2UgcGF0aD1cInR5cGluZ3MvdHNkLmQudHNcIi8+XG52YXIgYWRkRmlsdGVyID0gcmVxdWlyZSgnLi9hZGRGaWx0ZXInKTtcbnZhciBGaWx0ZXIgPSAoZnVuY3Rpb24gKCkge1xuICAgIGZ1bmN0aW9uIEZpbHRlcih0aGF0LCB0eXBlKSB7XG4gICAgICAgIHRoaXMudGhhdCA9IHRoYXQ7XG4gICAgICAgIHRoaXMudHlwZSA9IHR5cGU7XG4gICAgICAgIHRoaXMub3JkZXJMb29rdXAgPSB7XG4gICAgICAgICAgICBBU0M6ICd0b3AnLFxuICAgICAgICAgICAgREVTQzogJ2JvdHRvbSdcbiAgICAgICAgfTtcbiAgICAgICAgdGhpcy51dGlscyA9IHJlcXVpcmUoJy4vdXRpbHMnKTtcbiAgICAgICAgdmFyIGFkZEZpbHRlckluc3RhbmNlID0gbmV3IGFkZEZpbHRlcih0aGF0LCB0eXBlKTtcbiAgICAgICAgdGhpcy5hZGRGaWx0ZXIgPSBmdW5jdGlvbiAoZmlsdGVycykge1xuICAgICAgICAgICAgcmV0dXJuIGFkZEZpbHRlckluc3RhbmNlLmFkZEZpbHRlcihmaWx0ZXJzKTtcbiAgICAgICAgfTtcbiAgICB9XG4gICAgLy8gY2YgaGFzIGl0J3Mgb3duIHN0YXRlLCBmb3IgZWFjaCBkaW1lbnNpb25cbiAgICAvLyBiZWZvcmUgZWFjaCBuZXcgZmlsdGVyaW5nIHdlIG5lZWQgdG8gY2xlYXIgdGhpcyBzdGF0ZVxuICAgIEZpbHRlci5wcm90b3R5cGUuY2xlYXJBbGwgPSBmdW5jdGlvbiAoZGltZW5zaW9uU2V0KSB7XG4gICAgICAgIHZhciBpLCBkaW1lbnNpb247XG4gICAgICAgIGZvciAoaSBpbiBkaW1lbnNpb25TZXQpIHtcbiAgICAgICAgICAgIGlmIChkaW1lbnNpb25TZXQuaGFzT3duUHJvcGVydHkoaSkpIHtcbiAgICAgICAgICAgICAgICBkaW1lbnNpb24gPSBkaW1lbnNpb25TZXRbaV07XG4gICAgICAgICAgICAgICAgaWYgKHRoaXMudGhhdFt0aGlzLnR5cGVdLmRhdGFDaGFuZ2VkID09PSB0cnVlKSB7XG4gICAgICAgICAgICAgICAgICAgIGRpbWVuc2lvbi5kaXNwb3NlKCk7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuYWRkRmlsdGVyKGkpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgZGltZW5zaW9uLmZpbHRlckFsbCgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH07XG4gICAgRmlsdGVyLnByb3RvdHlwZS5maWx0ZXJCeVRhZyA9IGZ1bmN0aW9uIChxdWVyeSkge1xuICAgICAgICAvLyBpZiB0aGUgc2VhcmNoIHF1ZXJ5IGlzIGFuIGFycmF5IHdpdGggb25seSBvbmUgaXRlbSB0aGVuIGp1c3QgdXNlIHRoYXQgc3RyaW5nXG4gICAgICAgIGlmICh0aGlzLnV0aWxzLmlzQXJyYXkocXVlcnkpICYmIHF1ZXJ5Lmxlbmd0aCA9PT0gMSkge1xuICAgICAgICAgICAgcXVlcnkgPSBxdWVyeVswXTtcbiAgICAgICAgfVxuICAgICAgICBpZiAodHlwZW9mIHF1ZXJ5ID09PSBcInN0cmluZ1wiKSB7XG4gICAgICAgICAgICBpZiAodGhpcy50aGF0W3RoaXMudHlwZV0udGFnc1txdWVyeV0pIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy51dGlscy50b0FycmF5KHRoaXMudGhhdFt0aGlzLnR5cGVdLnRhZ3NbcXVlcnldKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIHJldHVybiBbXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHZhciBtYXJrZXJzID0gdGhpcy5mZXRjaEJ5VGFnKHF1ZXJ5KTtcbiAgICAgICAgICAgIGlmICh0eXBlb2YgbWFya2VycyA9PT0gXCJvYmplY3RcIikge1xuICAgICAgICAgICAgICAgIG1hcmtlcnMgPSB0aGlzLnV0aWxzLnRvQXJyYXkobWFya2Vycyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gbWFya2VycztcbiAgICAgICAgfVxuICAgIH07XG4gICAgRmlsdGVyLnByb3RvdHlwZS5mZXRjaEJ5VGFnID0gZnVuY3Rpb24gKHF1ZXJ5KSB7XG4gICAgICAgIHZhciBtYXJrZXJzOyAvLyBzdG9yZSBmaXJzdCBzZXQgb2YgbWFya2VycyB0byBjb21wYXJlXG4gICAgICAgIHZhciBpO1xuICAgICAgICBmb3IgKGkgPSAwOyBpIDwgcXVlcnkubGVuZ3RoIC0gMTsgaSsrKSB7XG4gICAgICAgICAgICB2YXIgdGFnID0gcXVlcnlbaV07XG4gICAgICAgICAgICB2YXIgbmV4dFRhZyA9IHF1ZXJ5W2kgKyAxXTtcbiAgICAgICAgICAgIC8vIG51bGwgY2hlY2sga2lja3MgaW4gd2hlbiB3ZSBnZXQgdG8gdGhlIGVuZCBvZiB0aGUgZm9yIGxvb3BcbiAgICAgICAgICAgIG1hcmtlcnMgPSB0aGlzLnV0aWxzLmdldENvbW1vbk9iamVjdCh0aGlzLnRoYXRbdGhpcy50eXBlXS50YWdzW3RhZ10sIHRoaXMudGhhdFt0aGlzLnR5cGVdLnRhZ3NbbmV4dFRhZ10pO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBtYXJrZXJzO1xuICAgIH07XG4gICAgRmlsdGVyLnByb3RvdHlwZS5maWx0ZXIgPSBmdW5jdGlvbiAoYXJncywgb3B0aW9ucykge1xuICAgICAgICAvLyBSZXR1cm4gQWxsIGl0ZW1zIGlmIG5vIGFyZ3VtZW50cyBhcmUgc3VwcGxpZWRcbiAgICAgICAgaWYgKHR5cGVvZiBhcmdzID09PSAndW5kZWZpbmVkJyAmJiB0eXBlb2Ygb3B0aW9ucyA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLnV0aWxzLnRvQXJyYXkodGhpcy50aGF0W3RoaXMudHlwZV0uYWxsKTtcbiAgICAgICAgfVxuICAgICAgICB2YXIgZGltZW5zaW9uLCBvcmRlciwgbGltaXQsIHF1ZXJ5O1xuICAgICAgICBpZiAodHlwZW9mIGFyZ3MgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICBkaW1lbnNpb24gPSBhcmdzO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgZGltZW5zaW9uID0gT2JqZWN0LmtleXMoYXJncylbMF07XG4gICAgICAgICAgICBxdWVyeSA9IGFyZ3NbZGltZW5zaW9uXTtcbiAgICAgICAgICAgIGlmIChkaW1lbnNpb24gPT09ICd0YWdzJykge1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmZpbHRlckJ5VGFnKHF1ZXJ5KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICB0aGlzLmNsZWFyQWxsKHRoaXMudGhhdFt0aGlzLnR5cGVdLmZpbHRlcik7XG4gICAgICAgIC8vIEFkZCBDcm9zc2ZpbHRlciBEaW1lbnNpb24gaWYgaXQgZG9lcyBub3QgZXhpc3QuXG4gICAgICAgIGlmICghdGhpcy50aGF0W3RoaXMudHlwZV0uZmlsdGVyW2RpbWVuc2lvbl0pIHtcbiAgICAgICAgICAgIHRoaXMuYWRkRmlsdGVyKGRpbWVuc2lvbik7XG4gICAgICAgIH1cbiAgICAgICAgb3JkZXIgPSAob3B0aW9ucyAmJiBvcHRpb25zLm9yZGVyICYmIHRoaXMub3JkZXJMb29rdXBbb3B0aW9ucy5vcmRlcl0pID8gdGhpcy5vcmRlckxvb2t1cFtvcHRpb25zLm9yZGVyXSA6IHRoaXMub3JkZXJMb29rdXBbT2JqZWN0LmtleXModGhpcy5vcmRlckxvb2t1cClbMF1dO1xuICAgICAgICBsaW1pdCA9IChvcHRpb25zICYmIG9wdGlvbnMubGltaXQpID8gb3B0aW9ucy5saW1pdCA6IEluZmluaXR5O1xuICAgICAgICBpZiAodHlwZW9mIHF1ZXJ5ID09PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgcXVlcnkgPSBudWxsO1xuICAgICAgICB9XG4gICAgICAgIHZhciByZXN1bHQgPSB0aGlzLnRoYXRbdGhpcy50eXBlXS5maWx0ZXJbZGltZW5zaW9uXS5maWx0ZXIocXVlcnkpW29yZGVyXShsaW1pdCk7XG4gICAgICAgIHRoaXMudGhhdFt0aGlzLnR5cGVdLmRhdGFDaGFuZ2VkID0gZmFsc2U7XG4gICAgICAgIGlmIChsaW1pdCA9PT0gMSkge1xuICAgICAgICAgICAgcmV0dXJuIHJlc3VsdFswXTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH07XG4gICAgcmV0dXJuIEZpbHRlcjtcbn0pKCk7XG5tb2R1bGUuZXhwb3J0cyA9IEZpbHRlcjtcbiIsIi8vLyA8cmVmZXJlbmNlIHBhdGg9XCJ0eXBpbmdzL3RzZC5kLnRzXCIvPlxudmFyIEZpbmRNYXJrZXJCeUlkID0gKGZ1bmN0aW9uICgpIHtcbiAgICBmdW5jdGlvbiBGaW5kTWFya2VyQnlJZCh0aGF0KSB7XG4gICAgICAgIHRoaXMudGhhdCA9IHRoYXQ7XG4gICAgfVxuICAgIEZpbmRNYXJrZXJCeUlkLnByb3RvdHlwZS5maW5kID0gZnVuY3Rpb24gKG1hcmtlcikge1xuICAgICAgICBpZiAobWFya2VyLmRhdGEgJiYgbWFya2VyLmRhdGEudWlkKSB7XG4gICAgICAgICAgICByZXR1cm4gbWFya2VyO1xuICAgICAgICB9XG4gICAgICAgIGlmIChtYXJrZXIudWlkICYmIG1hcFRvb2xzLm1hcHNbdGhpcy50aGF0LmlkXS5tYXJrZXJzLmFsbFttYXJrZXIudWlkXSkge1xuICAgICAgICAgICAgcmV0dXJuIG1hcFRvb2xzLm1hcHNbdGhpcy50aGF0LmlkXS5tYXJrZXJzLmFsbFttYXJrZXIudWlkXTtcbiAgICAgICAgfVxuICAgIH07XG4gICAgcmV0dXJuIEZpbmRNYXJrZXJCeUlkO1xufSkoKTtcbm1vZHVsZS5leHBvcnRzID0gRmluZE1hcmtlckJ5SWQ7XG4iLCIvLy8gPHJlZmVyZW5jZSBwYXRoPVwidHlwaW5ncy90c2QuZC50c1wiLz5cbnZhciBJbmZvV2luZG93ID0gKGZ1bmN0aW9uICgpIHtcbiAgICBmdW5jdGlvbiBJbmZvV2luZG93KHRoYXQpIHtcbiAgICAgICAgdGhpcy50aGF0ID0gdGhhdDtcbiAgICAgICAgdGhpcy51dGlscyA9IHJlcXVpcmUoJy4vdXRpbHMnKTtcbiAgICAgICAgdGhpcy5jb25maWcgPSByZXF1aXJlKCcuL2NvbmZpZycpO1xuICAgIH1cbiAgICBJbmZvV2luZG93LnByb3RvdHlwZS5pbmZvV2luZG93ID0gZnVuY3Rpb24gKG1hcCwgbWFya2VyLCBhcmdzKSB7XG4gICAgICAgIHZhciBjb250ZW50ID0gZmFsc2U7XG4gICAgICAgIGlmIChtYXJrZXIuaW5mb1dpbmRvdy5jb250ZW50KSB7XG4gICAgICAgICAgICBpZiAobWFya2VyLmluZm9XaW5kb3cuY29udGVudC5pbmRleE9mKCd7JykgPiAtMSkge1xuICAgICAgICAgICAgICAgIGNvbnRlbnQgPSBhcmdzLmNvbnRlbnQucmVwbGFjZSgvXFx7KFxcdyspXFx9L2csIGZ1bmN0aW9uIChtLCB2YXJpYWJsZSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gbWFya2VyLmRhdGFbdmFyaWFibGVdIHx8ICcnO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY29udGVudCA9IGNvbnRlbnQgfHwgbWFya2VyLmluZm9XaW5kb3cuY29udGVudDtcbiAgICAgICAgfVxuICAgICAgICB2YXIgb3B0aW9ucyA9IHRoaXMudXRpbHMuY2xvbmUoYXJncyk7XG4gICAgICAgIG9wdGlvbnMuY29udGVudCA9IGNvbnRlbnQ7XG4gICAgICAgIHRoaXMudGhhdC5pbmZvV2luZG93ID0gbmV3IGdvb2dsZS5tYXBzLkluZm9XaW5kb3cob3B0aW9ucyk7XG4gICAgICAgIHRoaXMudGhhdC5pbmZvV2luZG93Lm9wZW4obWFwLCBtYXJrZXIpO1xuICAgIH07XG4gICAgSW5mb1dpbmRvdy5wcm90b3R5cGUub3BlbiA9IGZ1bmN0aW9uIChtYXAsIG1hcmtlciwgb3B0aW9ucykge1xuICAgICAgICB0aGlzLmNsb3NlKCk7XG4gICAgICAgIHRoaXMuaW5mb1dpbmRvdyhtYXAsIG1hcmtlciwgb3B0aW9ucyk7XG4gICAgfTtcbiAgICBJbmZvV2luZG93LnByb3RvdHlwZS5pc09wZW4gPSBmdW5jdGlvbiAoaW5mb1dpbmRvdykge1xuICAgICAgICB2YXIgbWFwID0gaW5mb1dpbmRvdy5nZXRNYXAoKTtcbiAgICAgICAgcmV0dXJuIChtYXAgIT09IG51bGwgJiYgdHlwZW9mIG1hcCAhPT0gXCJ1bmRlZmluZWRcIik7XG4gICAgfTtcbiAgICBJbmZvV2luZG93LnByb3RvdHlwZS5jbG9zZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgY2xlYXJUaW1lb3V0KHRoaXMudGltZXIpO1xuICAgICAgICBpZiAodGhpcy50aGF0LmluZm9XaW5kb3cgJiYgdGhpcy5pc09wZW4odGhpcy50aGF0LmluZm9XaW5kb3cpKSB7XG4gICAgICAgICAgICB0aGlzLnRoYXQuaW5mb1dpbmRvdy5jbG9zZSgpO1xuICAgICAgICB9XG4gICAgfTtcbiAgICBJbmZvV2luZG93LnByb3RvdHlwZS5hZGRFdmVudHMgPSBmdW5jdGlvbiAobWFya2VyLCBvcHRpb25zLCBtYXApIHtcbiAgICAgICAgdmFyIF90aGlzID0gdGhpcztcbiAgICAgICAgdmFyIGFyZ3MgPSB0aGlzLnV0aWxzLnByZXBhcmVPcHRpb25zKG9wdGlvbnMsIHRoaXMuY29uZmlnLmN1c3RvbUluZm9XaW5kb3dPcHRpb25zKTtcbiAgICAgICAgdmFyIG9wZW5PbiA9IChhcmdzLmN1c3RvbSAmJiBhcmdzLmN1c3RvbS5vcGVuICYmIGFyZ3MuY3VzdG9tLm9wZW4ub24pID8gYXJncy5jdXN0b20ub3Blbi5vbiA6ICdjbGljayc7XG4gICAgICAgIHZhciBjbG9zZU9uID0gKGFyZ3MuY3VzdG9tICYmIGFyZ3MuY3VzdG9tLmNsb3NlICYmIGFyZ3MuY3VzdG9tLmNsb3NlLm9uKSA/IGFyZ3MuY3VzdG9tLmNsb3NlLm9uIDogJ2NsaWNrJztcbiAgICAgICAgLy8gVG9nZ2xlIEVmZmVjdCB3aGVuIHVzaW5nIHRoZSBzYW1lIG1ldGhvZCB0byBPcGVuIGFuZCBDbG9zZS5cbiAgICAgICAgaWYgKG9wZW5PbiA9PT0gY2xvc2VPbikge1xuICAgICAgICAgICAgZ29vZ2xlLm1hcHMuZXZlbnQuYWRkTGlzdGVuZXIobWFya2VyLCBvcGVuT24sIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBpZiAoIV90aGlzLnRoYXQuaW5mb1dpbmRvdyB8fCAhX3RoaXMuaXNPcGVuKF90aGlzLnRoYXQuaW5mb1dpbmRvdykpIHtcbiAgICAgICAgICAgICAgICAgICAgX3RoaXMub3BlbihtYXAsIG1hcmtlciwgYXJncy5kZWZhdWx0cyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBfdGhpcy5jbG9zZSgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgZ29vZ2xlLm1hcHMuZXZlbnQuYWRkTGlzdGVuZXIobWFya2VyLCBvcGVuT24sIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBfdGhpcy5vcGVuKG1hcCwgbWFya2VyLCBhcmdzLmRlZmF1bHRzKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgZ29vZ2xlLm1hcHMuZXZlbnQuYWRkTGlzdGVuZXIobWFya2VyLCBjbG9zZU9uLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgaWYgKGFyZ3MuY3VzdG9tLmNsb3NlLmR1cmF0aW9uKSB7XG4gICAgICAgICAgICAgICAgICAgIF90aGlzLnRpbWVyID0gc2V0VGltZW91dChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBfdGhpcy5jbG9zZSgpO1xuICAgICAgICAgICAgICAgICAgICB9LCBhcmdzLmN1c3RvbS5jbG9zZS5kdXJhdGlvbik7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBfdGhpcy5jbG9zZSgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgfTtcbiAgICByZXR1cm4gSW5mb1dpbmRvdztcbn0pKCk7XG5tb2R1bGUuZXhwb3J0cyA9IEluZm9XaW5kb3c7XG4iLCJ2YXIgTG9jYXRlID0gKGZ1bmN0aW9uICgpIHtcbiAgICBmdW5jdGlvbiBMb2NhdGUoKSB7XG4gICAgfVxuICAgIExvY2F0ZS5wcm90b3R5cGUubG9jYXRlID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgY2VudGVyID0gdGhpcy5pbnN0YW5jZS5nZXRDZW50ZXIoKTtcbiAgICAgICAgcmV0dXJuIHsgbGF0OiBjZW50ZXIubGF0KCksIGxuZzogY2VudGVyLmxuZygpIH07XG4gICAgfTtcbiAgICByZXR1cm4gTG9jYXRlO1xufSkoKTtcbm1vZHVsZS5leHBvcnRzID0gTG9jYXRlO1xuIiwiLy8vIDxyZWZlcmVuY2UgcGF0aD1cInR5cGluZ3MvdHNkLmQudHNcIi8+XG52YXIgYWRkTWFya2VyID0gcmVxdWlyZSgnLi9hZGRNYXJrZXInKTtcbnZhciBhZGRGZWF0dXJlID0gcmVxdWlyZSgnLi9hZGRGZWF0dXJlJyk7XG52YXIgYWRkUGFuZWwgPSByZXF1aXJlKCcuL2FkZFBhbmVsJyk7XG52YXIgY2VudGVyID0gcmVxdWlyZSgnLi9jZW50ZXInKTtcbnZhciBsb2NhdGUgPSByZXF1aXJlKCcuL2xvY2F0ZScpO1xudmFyIHVwZGF0ZU1hcmtlciA9IHJlcXVpcmUoJy4vdXBkYXRlTWFya2VyJyk7XG52YXIgdXBkYXRlTWFwID0gcmVxdWlyZSgnLi91cGRhdGVNYXAnKTtcbnZhciB1cGRhdGVGZWF0dXJlID0gcmVxdWlyZSgnLi91cGRhdGVGZWF0dXJlJyk7XG52YXIgYWRkTWFwID0gcmVxdWlyZSgnLi9hZGRNYXAnKTtcbnZhciByZW1vdmVNYXJrZXIgPSByZXF1aXJlKCcuL3JlbW92ZU1hcmtlcicpO1xudmFyIHJlc2V0TWFya2VyID0gcmVxdWlyZSgnLi9yZXNldE1hcmtlcicpO1xudmFyIGZpbHRlciA9IHJlcXVpcmUoJy4vZmlsdGVyJyk7XG52YXIgbWFwVG9vbHMgPSAoZnVuY3Rpb24gKCkge1xuICAgIGZ1bmN0aW9uIG1hcFRvb2xzKG9wdGlvbnMsIGNiKSB7XG4gICAgICAgIHRoaXMuY3Jvc3NmaWx0ZXIgPSByZXF1aXJlKCdjcm9zc2ZpbHRlcicpO1xuICAgICAgICB2YXIgYWRkTWFya2VySW5zdGFuY2UgPSBuZXcgYWRkTWFya2VyKHRoaXMpO1xuICAgICAgICB0aGlzLmFkZE1hcmtlciA9IGZ1bmN0aW9uIChtYXJrZXIsIG9wdGlvbnMpIHtcbiAgICAgICAgICAgIHJldHVybiBhZGRNYXJrZXJJbnN0YW5jZS5hZGRNYXJrZXIobWFya2VyLCBvcHRpb25zKTtcbiAgICAgICAgfTtcbiAgICAgICAgdmFyIGFkZEZlYXR1cmVJbnN0YW5jZSA9IG5ldyBhZGRGZWF0dXJlKHRoaXMpO1xuICAgICAgICB0aGlzLmFkZFRvcG9Kc29uID0gZnVuY3Rpb24gKGRhdGEsIG9wdGlvbnMpIHtcbiAgICAgICAgICAgIHJldHVybiBhZGRGZWF0dXJlSW5zdGFuY2UuYWRkVG9wb0pzb24oZGF0YSwgb3B0aW9ucyk7XG4gICAgICAgIH07XG4gICAgICAgIHRoaXMuYWRkR2VvSnNvbiA9IGZ1bmN0aW9uIChkYXRhLCBvcHRpb25zKSB7XG4gICAgICAgICAgICByZXR1cm4gYWRkRmVhdHVyZUluc3RhbmNlLmFkZEdlb0pzb24oZGF0YSwgb3B0aW9ucyk7XG4gICAgICAgIH07XG4gICAgICAgIHZhciBhZGRQYW5lbEluc3RhbmNlID0gbmV3IGFkZFBhbmVsKHRoaXMpO1xuICAgICAgICB0aGlzLmFkZFBhbmVsID0gZnVuY3Rpb24gKG9wdGlvbnMsIGNiKSB7XG4gICAgICAgICAgICByZXR1cm4gYWRkUGFuZWxJbnN0YW5jZS5hZGRQYW5lbChvcHRpb25zLCBjYik7XG4gICAgICAgIH07XG4gICAgICAgIHRoaXMuY2VudGVyID0gbmV3IGNlbnRlcigpLnBvcztcbiAgICAgICAgdGhpcy5sb2NhdGUgPSBuZXcgbG9jYXRlKCkubG9jYXRlO1xuICAgICAgICB2YXIgdXBkYXRlTWFya2VySW5zdGFuY2UgPSBuZXcgdXBkYXRlTWFya2VyKHRoaXMpO1xuICAgICAgICB0aGlzLnVwZGF0ZU1hcmtlciA9IGZ1bmN0aW9uIChhcmdzLCBvcHRpb25zKSB7XG4gICAgICAgICAgICByZXR1cm4gdXBkYXRlTWFya2VySW5zdGFuY2UudXBkYXRlKGFyZ3MsIG9wdGlvbnMpO1xuICAgICAgICB9O1xuICAgICAgICB2YXIgdXBkYXRlTWFwSW5zdGFuY2UgPSBuZXcgdXBkYXRlTWFwKHRoaXMpO1xuICAgICAgICB0aGlzLnVwZGF0ZU1hcCA9IGZ1bmN0aW9uIChhcmdzKSB7XG4gICAgICAgICAgICB1cGRhdGVNYXBJbnN0YW5jZS51cGRhdGVNYXAoYXJncyk7XG4gICAgICAgIH07XG4gICAgICAgIHZhciB1cGRhdGVGZWF0dXJlSW5zdGFuY2UgPSBuZXcgdXBkYXRlRmVhdHVyZSh0aGlzKTtcbiAgICAgICAgdGhpcy51cGRhdGVGZWF0dXJlID0gZnVuY3Rpb24gKGFyZ3MsIG9wdGlvbnMpIHtcbiAgICAgICAgICAgIHJldHVybiB1cGRhdGVGZWF0dXJlSW5zdGFuY2UudXBkYXRlKGFyZ3MsIG9wdGlvbnMpO1xuICAgICAgICB9O1xuICAgICAgICB2YXIgcmVtb3ZlTWFya2VySW5zdGFuY2UgPSBuZXcgcmVtb3ZlTWFya2VyKHRoaXMpO1xuICAgICAgICB0aGlzLnJlbW92ZU1hcmtlciA9IGZ1bmN0aW9uIChhcmdzKSB7XG4gICAgICAgICAgICByZXR1cm4gcmVtb3ZlTWFya2VySW5zdGFuY2UucmVtb3ZlTWFya2VyKGFyZ3MpO1xuICAgICAgICB9O1xuICAgICAgICB2YXIgcmVzZXRNYXJrZXJJbnN0YW5jZSA9IG5ldyByZXNldE1hcmtlcih0aGlzKTtcbiAgICAgICAgdGhpcy5yZXNldE1hcmtlciA9IGZ1bmN0aW9uIChhcmdzLCBvcHRpb25zKSB7XG4gICAgICAgICAgICByZXR1cm4gcmVzZXRNYXJrZXJJbnN0YW5jZS5yZXNldE1hcmtlcihhcmdzLCBvcHRpb25zKTtcbiAgICAgICAgfTtcbiAgICAgICAgdmFyIGZpbmRNYXJrZXIgPSBuZXcgZmlsdGVyKHRoaXMsICdtYXJrZXJzJyk7XG4gICAgICAgIHRoaXMuZmluZE1hcmtlciA9IGZ1bmN0aW9uIChhcmdzLCBvcHRpb25zKSB7XG4gICAgICAgICAgICByZXR1cm4gZmluZE1hcmtlci5maWx0ZXIoYXJncywgb3B0aW9ucyk7XG4gICAgICAgIH07XG4gICAgICAgIC8vIFVuaXQgVGVzdHM/XG4gICAgICAgIHZhciBmaW5kRmVhdHVyZSA9IG5ldyBmaWx0ZXIodGhpcywgJ2pzb24nKTtcbiAgICAgICAgdGhpcy5maW5kRmVhdHVyZSA9IGZ1bmN0aW9uIChhcmdzLCBvcHRpb25zKSB7XG4gICAgICAgICAgICByZXR1cm4gZmluZEZlYXR1cmUuZmlsdGVyKGFyZ3MsIG9wdGlvbnMpO1xuICAgICAgICB9O1xuICAgICAgICB2YXIgbWFwID0gbmV3IGFkZE1hcCh0aGlzKTtcbiAgICAgICAgbWFwLmxvYWQob3B0aW9ucywgY2IpO1xuICAgIH1cbiAgICBtYXBUb29scy5wcm90b3R5cGUuem9vbSA9IGZ1bmN0aW9uICh6b29tKSB7XG4gICAgICAgIGlmICh0eXBlb2Ygem9vbSA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmluc3RhbmNlLmdldFpvb20oKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuaW5zdGFuY2Uuc2V0Wm9vbSh6b29tKTtcbiAgICAgICAgfVxuICAgIH07XG4gICAgcmV0dXJuIG1hcFRvb2xzO1xufSkoKTtcbm1vZHVsZS5leHBvcnRzID0gbWFwVG9vbHM7XG4iLCIvLy8gPHJlZmVyZW5jZSBwYXRoPVwidHlwaW5ncy90c2QuZC50c1wiLz5cbnZhciB1dGlscyA9IHJlcXVpcmUoJy4vdXRpbHMnKTtcbnZhciBjb25maWcgPSByZXF1aXJlKCcuL2NvbmZpZycpO1xudmFyIE1hcHMgPSAoZnVuY3Rpb24gKCkge1xuICAgIGZ1bmN0aW9uIE1hcHMoKSB7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIEluamVjdHMgR29vZ2xlIEFQSSBKYXZhc2NyaXB0IEZpbGUgYW5kIGFkZHMgYSBjYWxsYmFjayB0byBsb2FkIHRoZSBHb29nbGUgTWFwcyBBc3luYy5cbiAgICAgKiBAdHlwZSB7e2xvYWQ6IEZ1bmN0aW9ufX1cbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqXG4gICAgICogQHJldHVybnMgdGhlIGVsZW1lbnQgYXBwZW5kZWRcbiAgICAgKi9cbiAgICBNYXBzLmxvYWQgPSBmdW5jdGlvbiAoaWQsIGFyZ3MpIHtcbiAgICAgICAgdmFyIHZlcnNpb24gPSBhcmdzLnZlcnNpb24gfHwgY29uZmlnLnZlcnNpb247XG4gICAgICAgIHZhciBzY3JpcHQgPSB3aW5kb3cuZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc2NyaXB0Jyk7XG4gICAgICAgIHNjcmlwdC50eXBlID0gJ3RleHQvamF2YXNjcmlwdCc7XG4gICAgICAgIHNjcmlwdC5zcmMgPSBjb25maWcudXJsICsgJz92PScgKyB2ZXJzaW9uICsgJyZjYWxsYmFjaz1tYXBUb29scy5tYXBzLicgKyBpZCArICcuY3JlYXRlJztcbiAgICAgICAgcmV0dXJuIHdpbmRvdy5kb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKHNjcmlwdCk7XG4gICAgfTtcbiAgICBNYXBzLm1hcE9wdGlvbnMgPSBmdW5jdGlvbiAoYXJncykge1xuICAgICAgICAvLyBUbyBjbG9uZSBBcmd1bWVudHMgZXhjbHVkaW5nIGN1c3RvbU1hcE9wdGlvbnNcbiAgICAgICAgdmFyIHJlc3VsdCA9IHV0aWxzLmNsb25lKGFyZ3MsIGNvbmZpZy5jdXN0b21NYXBPcHRpb25zKTtcbiAgICAgICAgcmVzdWx0Lnpvb20gPSBhcmdzLnpvb20gfHwgY29uZmlnLnpvb207XG4gICAgICAgIGlmIChhcmdzLmxhdCAmJiBhcmdzLmxuZykge1xuICAgICAgICAgICAgcmVzdWx0LmNlbnRlciA9IG5ldyBnb29nbGUubWFwcy5MYXRMbmcoYXJncy5sYXQsIGFyZ3MubG5nKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoYXJncy50eXBlKSB7XG4gICAgICAgICAgICByZXN1bHQubWFwVHlwZUlkID0gZ29vZ2xlLm1hcHMuTWFwVHlwZUlkW2FyZ3MudHlwZV0gfHwgZmFsc2U7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9O1xuICAgIHJldHVybiBNYXBzO1xufSkoKTtcbm1vZHVsZS5leHBvcnRzID0gTWFwcztcbiIsIi8vLyA8cmVmZXJlbmNlIHBhdGg9XCJ0eXBpbmdzL3RzZC5kLnRzXCIvPlxudmFyIGZpbmRNYXJrZXIgPSByZXF1aXJlKCcuL2ZpbmRNYXJrZXJCeUlkJyk7XG52YXIgUmVtb3ZlTWFya2VyID0gKGZ1bmN0aW9uICgpIHtcbiAgICBmdW5jdGlvbiBSZW1vdmVNYXJrZXIodGhhdCkge1xuICAgICAgICB0aGlzLnRoYXQgPSB0aGF0O1xuICAgICAgICB2YXIgZmluZE1hcmtlckluc3RhbmNlID0gbmV3IGZpbmRNYXJrZXIodGhhdCk7XG4gICAgICAgIHRoaXMuZmluZE1hcmtlciA9IGZ1bmN0aW9uIChtYXJrZXIpIHtcbiAgICAgICAgICAgIHJldHVybiBmaW5kTWFya2VySW5zdGFuY2UuZmluZChtYXJrZXIpO1xuICAgICAgICB9O1xuICAgIH1cbiAgICBSZW1vdmVNYXJrZXIucHJvdG90eXBlLnJlbW92ZUJ1bGsgPSBmdW5jdGlvbiAoYXJncykge1xuICAgICAgICB2YXIgbWFya2VyLCB4O1xuICAgICAgICBmb3IgKHggaW4gYXJncykge1xuICAgICAgICAgICAgaWYgKGFyZ3MuaGFzT3duUHJvcGVydHkoeCkpIHtcbiAgICAgICAgICAgICAgICBtYXJrZXIgPSBhcmdzW3hdO1xuICAgICAgICAgICAgICAgIHRoaXMucmVtb3ZlKHRoaXMuZmluZE1hcmtlcihtYXJrZXIpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH07XG4gICAgUmVtb3ZlTWFya2VyLnByb3RvdHlwZS5yZW1vdmVNYXJrZXIgPSBmdW5jdGlvbiAoYXJncykge1xuICAgICAgICBpZiAodHlwZW9mIGFyZ3MgPT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICB0aGlzLnJlbW92ZUJ1bGsodGhpcy50aGF0Lm1hcmtlcnMuYWxsKTtcbiAgICAgICAgfVxuICAgICAgICB2YXIgdHlwZSA9IE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbChhcmdzKTtcbiAgICAgICAgaWYgKHR5cGUgPT09ICdbb2JqZWN0IE9iamVjdF0nKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5yZW1vdmUodGhpcy5maW5kTWFya2VyKGFyZ3MpKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAodHlwZSA9PT0gJ1tvYmplY3QgQXJyYXldJykge1xuICAgICAgICAgICAgdGhpcy5yZW1vdmVCdWxrKGFyZ3MpO1xuICAgICAgICB9XG4gICAgfTtcbiAgICBSZW1vdmVNYXJrZXIucHJvdG90eXBlLnJlbW92ZSA9IGZ1bmN0aW9uIChtYXJrZXIpIHtcbiAgICAgICAgbWFya2VyLnNldE1hcChudWxsKTtcbiAgICAgICAgZGVsZXRlIG1hcFRvb2xzLm1hcHNbdGhpcy50aGF0LmlkXS5tYXJrZXJzLmFsbFttYXJrZXIuZGF0YS51aWRdO1xuICAgIH07XG4gICAgcmV0dXJuIFJlbW92ZU1hcmtlcjtcbn0pKCk7XG5tb2R1bGUuZXhwb3J0cyA9IFJlbW92ZU1hcmtlcjtcbiIsIi8vLyA8cmVmZXJlbmNlIHBhdGg9XCJ0eXBpbmdzL3RzZC5kLnRzXCIvPlxudmFyIHV0aWxzID0gcmVxdWlyZSgnLi91dGlscycpO1xudmFyIGNvbmZpZyA9IHJlcXVpcmUoJy4vY29uZmlnJyk7XG52YXIgZmluZE1hcmtlciA9IHJlcXVpcmUoJy4vZmluZE1hcmtlckJ5SWQnKTtcbnZhciB1cGRhdGVNYXJrZXIgPSByZXF1aXJlKCcuL3VwZGF0ZU1hcmtlcicpO1xudmFyIFJlc2V0TWFya2VyID0gKGZ1bmN0aW9uICgpIHtcbiAgICBmdW5jdGlvbiBSZXNldE1hcmtlcih0aGF0KSB7XG4gICAgICAgIHRoaXMudGhhdCA9IHRoYXQ7XG4gICAgICAgIHZhciBmaW5kTWFya2VySW5zdGFuY2UgPSBuZXcgZmluZE1hcmtlcih0aGF0KTtcbiAgICAgICAgdGhpcy5maW5kTWFya2VyID0gZnVuY3Rpb24gKG1hcmtlcikge1xuICAgICAgICAgICAgcmV0dXJuIGZpbmRNYXJrZXJJbnN0YW5jZS5maW5kKG1hcmtlcik7XG4gICAgICAgIH07XG4gICAgICAgIHRoaXMudXBkYXRlTWFya2VyID0gbmV3IHVwZGF0ZU1hcmtlcih0aGF0KTtcbiAgICB9XG4gICAgUmVzZXRNYXJrZXIucHJvdG90eXBlLnJlc2V0QnVsayA9IGZ1bmN0aW9uIChtYXJrZXJzLCBvcHRpb25zKSB7XG4gICAgICAgIHZhciB4O1xuICAgICAgICBmb3IgKHggaW4gbWFya2Vycykge1xuICAgICAgICAgICAgaWYgKG1hcmtlcnMuaGFzT3duUHJvcGVydHkoeCkpIHtcbiAgICAgICAgICAgICAgICB0aGlzLnJlc2V0KG1hcmtlcnNbeF0sIG9wdGlvbnMpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfTtcbiAgICBSZXNldE1hcmtlci5wcm90b3R5cGUucmVzZXRNYXJrZXIgPSBmdW5jdGlvbiAoYXJncywgb3B0aW9ucykge1xuICAgICAgICB2YXIgdHlwZSA9IE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbChhcmdzKTtcbiAgICAgICAgdmFyIHJlc3VsdDtcbiAgICAgICAgaWYgKHR5cGUgPT09ICdbb2JqZWN0IE9iamVjdF0nKSB7XG4gICAgICAgICAgICByZXN1bHQgPSB0aGlzLnJlc2V0KHRoaXMuZmluZE1hcmtlcihhcmdzKSwgb3B0aW9ucyk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHR5cGUgPT09ICdbb2JqZWN0IEFycmF5XScpIHtcbiAgICAgICAgICAgIHJlc3VsdCA9IHRoaXMucmVzZXRCdWxrKGFyZ3MsIG9wdGlvbnMpO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMudGhhdC5tYXJrZXJzLmRhdGFDaGFuZ2VkID0gdHJ1ZTtcbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9O1xuICAgIFJlc2V0TWFya2VyLnByb3RvdHlwZS5mb3JtYXRPcHRpb25zID0gZnVuY3Rpb24gKG1hcmtlciwgb3B0aW9ucykge1xuICAgICAgICB2YXIga2V5LCBvcCA9IHt9O1xuICAgICAgICB2YXIgdHlwZSA9IE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbChvcHRpb25zKTtcbiAgICAgICAgaWYgKHR5cGUgPT09ICdbb2JqZWN0IFN0cmluZ10nKSB7XG4gICAgICAgICAgICBvcFtvcHRpb25zXSA9IG1hcmtlci5kYXRhLl9zZWxmW29wdGlvbnNdO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0eXBlID09PSAnW29iamVjdCBBcnJheV0nKSB7XG4gICAgICAgICAgICBmb3IgKGtleSBpbiBvcHRpb25zKSB7XG4gICAgICAgICAgICAgICAgaWYgKG9wdGlvbnMuaGFzT3duUHJvcGVydHkoa2V5KSkge1xuICAgICAgICAgICAgICAgICAgICBvcFtvcHRpb25zW2tleV1dID0gbWFya2VyLmRhdGEuX3NlbGZbb3B0aW9uc1trZXldXTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG9wO1xuICAgIH07XG4gICAgUmVzZXRNYXJrZXIucHJvdG90eXBlLnJlc2V0ID0gZnVuY3Rpb24gKG1hcmtlciwgb3B0aW9ucykge1xuICAgICAgICB2YXIgcHJlcGFyZWRPcHRpb25zID0gdXRpbHMucHJlcGFyZU9wdGlvbnModGhpcy5mb3JtYXRPcHRpb25zKG1hcmtlciwgb3B0aW9ucyksIGNvbmZpZy5jdXN0b21NYXJrZXJPcHRpb25zKTtcbiAgICAgICAgdGhpcy51cGRhdGVNYXJrZXIuY3VzdG9tVXBkYXRlKG1hcmtlciwgcHJlcGFyZWRPcHRpb25zKTtcbiAgICAgICAgcmV0dXJuIG1hcmtlcjtcbiAgICB9O1xuICAgIHJldHVybiBSZXNldE1hcmtlcjtcbn0pKCk7XG5tb2R1bGUuZXhwb3J0cyA9IFJlc2V0TWFya2VyO1xuIiwidmFyIFRlbXBsYXRlID0gKGZ1bmN0aW9uICgpIHtcbiAgICBmdW5jdGlvbiBUZW1wbGF0ZSh0aGF0KSB7XG4gICAgICAgIHRoaXMudGhhdCA9IHRoYXQ7XG4gICAgfVxuICAgIFRlbXBsYXRlLnByb3RvdHlwZS5sb2FkID0gZnVuY3Rpb24gKHR5cGUsIHVybCwgY2IpIHtcbiAgICAgICAgdmFyIF90aGlzID0gdGhpcztcbiAgICAgICAgaWYgKHRoaXMudGhhdC50ZW1wbGF0ZXNbdHlwZV1bdXJsXSkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMudGhhdC50ZW1wbGF0ZXNbdHlwZV1bdXJsXTtcbiAgICAgICAgfVxuICAgICAgICB2YXIgeGhyID0gbmV3IFhNTEh0dHBSZXF1ZXN0KCk7XG4gICAgICAgIHhoci5vcGVuKFwiR0VUXCIsIHVybCk7XG4gICAgICAgIHhoci5vbmxvYWQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBpZiAoeGhyLnJlYWR5U3RhdGUgPT09IDQpIHtcbiAgICAgICAgICAgICAgICBpZiAoeGhyLnN0YXR1cyA9PT0gMjAwKSB7XG4gICAgICAgICAgICAgICAgICAgIF90aGlzLnRoYXQudGVtcGxhdGVzW3R5cGVdW3VybF0gPSB4aHIucmVzcG9uc2VUZXh0O1xuICAgICAgICAgICAgICAgICAgICBjYihmYWxzZSwgeGhyLnJlc3BvbnNlVGV4dCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBjYihuZXcgRXJyb3IoeGhyLnN0YXR1c1RleHQpKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgICAgIHhoci5zZW5kKG51bGwpO1xuICAgIH07XG4gICAgcmV0dXJuIFRlbXBsYXRlO1xufSkoKTtcbm1vZHVsZS5leHBvcnRzID0gVGVtcGxhdGU7XG4iLCIvLy8gPHJlZmVyZW5jZSBwYXRoPVwidHlwaW5ncy90c2QuZC50c1wiLz5cbnZhciBVcGRhdGVGZWF0dXJlID0gKGZ1bmN0aW9uICgpIHtcbiAgICBmdW5jdGlvbiBVcGRhdGVGZWF0dXJlKHRoYXQpIHtcbiAgICAgICAgdGhpcy50aGF0ID0gdGhhdDtcbiAgICB9XG4gICAgVXBkYXRlRmVhdHVyZS5wcm90b3R5cGUudXBkYXRlU3R5bGUgPSBmdW5jdGlvbiAoZiwgc3R5bGUpIHtcbiAgICAgICAgaWYgKHR5cGVvZiBzdHlsZSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgdmFyIHN0eWxlT3B0aW9ucyA9IHN0eWxlLmNhbGwoZik7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy50aGF0Lmluc3RhbmNlLmRhdGEub3ZlcnJpZGVTdHlsZShmLCBzdHlsZU9wdGlvbnMpO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMudGhhdC5pbnN0YW5jZS5kYXRhLm92ZXJyaWRlU3R5bGUoZiwgc3R5bGUpO1xuICAgIH07XG4gICAgVXBkYXRlRmVhdHVyZS5wcm90b3R5cGUuZmluZEFuZFVwZGF0ZSA9IGZ1bmN0aW9uIChhcmdzLCBvcHRpb25zKSB7XG4gICAgICAgIGlmIChhcmdzLmRhdGEgJiYgYXJncy5kYXRhLnVpZCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMudXBkYXRlRmVhdHVyZShhcmdzLCBvcHRpb25zKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoYXJncy51aWQgJiYgbWFwVG9vbHMubWFwc1t0aGlzLnRoYXQuaWRdLmpzb24gJiYgbWFwVG9vbHMubWFwc1t0aGlzLnRoYXQuaWRdLmpzb24uYWxsW2FyZ3MudWlkXSkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMudXBkYXRlRmVhdHVyZShtYXBUb29scy5tYXBzW3RoaXMudGhhdC5pZF0uanNvbi5hbGxbYXJncy51aWRdLCBvcHRpb25zKTtcbiAgICAgICAgfVxuICAgIH07XG4gICAgVXBkYXRlRmVhdHVyZS5wcm90b3R5cGUudXBkYXRlID0gZnVuY3Rpb24gKGFyZ3MsIG9wdGlvbnMpIHtcbiAgICAgICAgdmFyIHR5cGUgPSBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwoYXJncyk7XG4gICAgICAgIGlmICh0eXBlID09PSAnW29iamVjdCBBcnJheV0nKSB7XG4gICAgICAgICAgICB2YXIgZmVhdHVyZSwgeDtcbiAgICAgICAgICAgIGZvciAoeCBpbiBhcmdzKSB7XG4gICAgICAgICAgICAgICAgaWYgKGFyZ3MuaGFzT3duUHJvcGVydHkoeCkpIHtcbiAgICAgICAgICAgICAgICAgICAgZmVhdHVyZSA9IGFyZ3NbeF07XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZmluZEFuZFVwZGF0ZShmZWF0dXJlLCBvcHRpb25zKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHR5cGUgPT09ICdbb2JqZWN0IE9iamVjdF0nKSB7XG4gICAgICAgICAgICB0aGlzLmZpbmRBbmRVcGRhdGUoYXJncywgb3B0aW9ucyk7XG4gICAgICAgIH1cbiAgICB9O1xuICAgIFVwZGF0ZUZlYXR1cmUucHJvdG90eXBlLnVwZGF0ZUZlYXR1cmUgPSBmdW5jdGlvbiAoZmVhdHVyZSwgb3B0aW9ucykge1xuICAgICAgICBpZiAob3B0aW9ucy5zdHlsZSkge1xuICAgICAgICAgICAgdGhpcy51cGRhdGVTdHlsZShmZWF0dXJlLCBvcHRpb25zLnN0eWxlKTtcbiAgICAgICAgfVxuICAgIH07XG4gICAgcmV0dXJuIFVwZGF0ZUZlYXR1cmU7XG59KSgpO1xubW9kdWxlLmV4cG9ydHMgPSBVcGRhdGVGZWF0dXJlO1xuIiwiLy8vIDxyZWZlcmVuY2UgcGF0aD1cIm1hcHMudHNcIi8+XG52YXIgbWFwcyA9IHJlcXVpcmUoJy4vbWFwcycpO1xudmFyIFVwZGF0ZU1hcCA9IChmdW5jdGlvbiAoKSB7XG4gICAgZnVuY3Rpb24gVXBkYXRlTWFwKHRoYXQpIHtcbiAgICAgICAgdGhpcy50aGF0ID0gdGhhdDtcbiAgICB9XG4gICAgVXBkYXRlTWFwLnByb3RvdHlwZS51cGRhdGVNYXAgPSBmdW5jdGlvbiAoYXJncykge1xuICAgICAgICB2YXIgbWFwT3B0aW9ucyA9IG1hcHMubWFwT3B0aW9ucyhhcmdzKTtcbiAgICAgICAgcmV0dXJuIHRoaXMudGhhdC5pbnN0YW5jZS5zZXRPcHRpb25zKG1hcE9wdGlvbnMpO1xuICAgIH07XG4gICAgcmV0dXJuIFVwZGF0ZU1hcDtcbn0pKCk7XG5tb2R1bGUuZXhwb3J0cyA9IFVwZGF0ZU1hcDtcbiIsIi8vLyA8cmVmZXJlbmNlIHBhdGg9XCJ0eXBpbmdzL3RzZC5kLnRzXCIvPlxudmFyIHV0aWxzID0gcmVxdWlyZSgnLi91dGlscycpO1xudmFyIGNvbmZpZyA9IHJlcXVpcmUoJy4vY29uZmlnJyk7XG52YXIgZmluZE1hcmtlciA9IHJlcXVpcmUoJy4vZmluZE1hcmtlckJ5SWQnKTtcbnZhciBmaWx0ZXIgPSByZXF1aXJlKCcuL2ZpbHRlcicpO1xudmFyIFVwZGF0ZU1hcmtlciA9IChmdW5jdGlvbiAoKSB7XG4gICAgZnVuY3Rpb24gVXBkYXRlTWFya2VyKHRoYXQpIHtcbiAgICAgICAgdGhpcy50aGF0ID0gdGhhdDtcbiAgICAgICAgdmFyIGZpbmRNYXJrZXJJbnN0YW5jZSA9IG5ldyBmaW5kTWFya2VyKHRoYXQpO1xuICAgICAgICB0aGlzLmZpbmRNYXJrZXIgPSBmdW5jdGlvbiAobWFya2VyKSB7XG4gICAgICAgICAgICByZXR1cm4gZmluZE1hcmtlckluc3RhbmNlLmZpbmQobWFya2VyKTtcbiAgICAgICAgfTtcbiAgICB9XG4gICAgVXBkYXRlTWFya2VyLnByb3RvdHlwZS5yZW1vdmVUYWdzID0gZnVuY3Rpb24gKG1hcmtlcikge1xuICAgICAgICBpZiAodXRpbHMuaXNBcnJheShtYXJrZXIudGFncykpIHtcbiAgICAgICAgICAgIHZhciBpLCB0YWc7XG4gICAgICAgICAgICBmb3IgKGkgaW4gbWFya2VyLnRhZ3MpIHtcbiAgICAgICAgICAgICAgICBpZiAobWFya2VyLnRhZ3MuaGFzT3duUHJvcGVydHkoaSkpIHtcbiAgICAgICAgICAgICAgICAgICAgdGFnID0gbWFya2VyLnRhZ3NbaV07XG4gICAgICAgICAgICAgICAgICAgIGRlbGV0ZSB0aGlzLnRoYXQubWFya2Vycy50YWdzW3RhZ11bbWFya2VyLmRhdGEudWlkXTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBkZWxldGUgdGhpcy50aGF0Lm1hcmtlcnMudGFnc1ttYXJrZXIudGFnc11bbWFya2VyLmRhdGEudWlkXTtcbiAgICAgICAgfVxuICAgIH07XG4gICAgVXBkYXRlTWFya2VyLnByb3RvdHlwZS5hZGRUYWdzID0gZnVuY3Rpb24gKG1hcmtlciwgb3B0aW9ucykge1xuICAgICAgICBpZiAodXRpbHMuaXNBcnJheShvcHRpb25zLmN1c3RvbS50YWdzKSkge1xuICAgICAgICAgICAgdmFyIGksIHRhZztcbiAgICAgICAgICAgIGZvciAoaSBpbiBvcHRpb25zLmN1c3RvbS50YWdzKSB7XG4gICAgICAgICAgICAgICAgdGFnID0gb3B0aW9ucy5jdXN0b20udGFnc1tpXTtcbiAgICAgICAgICAgICAgICB0aGlzLnRoYXQubWFya2Vycy50YWdzW3RhZ10gPSB0aGlzLnRoYXQubWFya2Vycy50YWdzW3RhZ10gfHwge307XG4gICAgICAgICAgICAgICAgdGhpcy50aGF0Lm1hcmtlcnMudGFnc1t0YWddW21hcmtlci5kYXRhLnVpZF0gPSBtYXJrZXI7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICB0aGlzLnRoYXQubWFya2Vycy50YWdzW29wdGlvbnMuY3VzdG9tLnRhZ3NdID0gdGhpcy50aGF0Lm1hcmtlcnMudGFnc1tvcHRpb25zLmN1c3RvbS50YWdzXSB8fCB7fTtcbiAgICAgICAgICAgIHRoaXMudGhhdC5tYXJrZXJzLnRhZ3Nbb3B0aW9ucy5jdXN0b20udGFnc11bbWFya2VyLmRhdGEudWlkXSA9IG1hcmtlcjtcbiAgICAgICAgfVxuICAgICAgICBtYXJrZXIudGFncyA9IG9wdGlvbnMuY3VzdG9tLnRhZ3M7XG4gICAgfTtcbiAgICBVcGRhdGVNYXJrZXIucHJvdG90eXBlLnVwZGF0ZVRhZyA9IGZ1bmN0aW9uIChtYXJrZXIsIG9wdGlvbnMpIHtcbiAgICAgICAgdGhpcy5yZW1vdmVUYWdzKG1hcmtlcik7XG4gICAgICAgIHRoaXMuYWRkVGFncyhtYXJrZXIsIG9wdGlvbnMpO1xuICAgIH07XG4gICAgVXBkYXRlTWFya2VyLnByb3RvdHlwZS5jdXN0b21VcGRhdGUgPSBmdW5jdGlvbiAobWFya2VyLCBvcHRpb25zKSB7XG4gICAgICAgIGlmIChvcHRpb25zLmN1c3RvbSkge1xuICAgICAgICAgICAgaWYgKG9wdGlvbnMuY3VzdG9tLm1vdmUpIHtcbiAgICAgICAgICAgICAgICBtYXJrZXIuc2V0QW5pbWF0aW9uKGdvb2dsZS5tYXBzLkFuaW1hdGlvbltvcHRpb25zLmN1c3RvbS5tb3ZlLnRvVXBwZXJDYXNlKCldKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChvcHRpb25zLmN1c3RvbS5sYXQgJiYgb3B0aW9ucy5jdXN0b20ubG5nKSB7XG4gICAgICAgICAgICAgICAgbWFya2VyLnNldFBvc2l0aW9uKG5ldyBnb29nbGUubWFwcy5MYXRMbmcob3B0aW9ucy5jdXN0b20ubGF0LCBvcHRpb25zLmN1c3RvbS5sbmcpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChvcHRpb25zLmN1c3RvbS5pbmZvV2luZG93ICYmIG9wdGlvbnMuY3VzdG9tLmluZm9XaW5kb3cuY29udGVudCkge1xuICAgICAgICAgICAgICAgIG1hcmtlci5pbmZvV2luZG93LmNvbnRlbnQgPSBvcHRpb25zLmN1c3RvbS5pbmZvV2luZG93LmNvbnRlbnQ7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAob3B0aW9ucy5jdXN0b20udGFncykge1xuICAgICAgICAgICAgICAgIHRoaXMudXBkYXRlVGFnKG1hcmtlciwgb3B0aW9ucyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgaWYgKG9wdGlvbnMuZGVmYXVsdHMpIHtcbiAgICAgICAgICAgIG1hcmtlci5zZXRPcHRpb25zKG9wdGlvbnMuZGVmYXVsdHMpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBtYXJrZXI7XG4gICAgfTtcbiAgICBVcGRhdGVNYXJrZXIucHJvdG90eXBlLmJ1bGtVcGRhdGUgPSBmdW5jdGlvbiAoYXJncywgb3B0aW9ucykge1xuICAgICAgICB2YXIgbWFya2VyLCByZXN1bHRzID0gW10sIGluc3RhbmNlLCB4O1xuICAgICAgICBmb3IgKHggaW4gYXJncykge1xuICAgICAgICAgICAgaWYgKGFyZ3MuaGFzT3duUHJvcGVydHkoeCkpIHtcbiAgICAgICAgICAgICAgICBtYXJrZXIgPSBhcmdzW3hdO1xuICAgICAgICAgICAgICAgIGluc3RhbmNlID0gdGhpcy5jdXN0b21VcGRhdGUodGhpcy5maW5kTWFya2VyKG1hcmtlciksIG9wdGlvbnMpO1xuICAgICAgICAgICAgICAgIHJlc3VsdHMucHVzaChpbnN0YW5jZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHJlc3VsdHM7XG4gICAgfTtcbiAgICBVcGRhdGVNYXJrZXIucHJvdG90eXBlLmNvdW50VmlzaWJsZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIHgsIGNvdW50ID0gMDtcbiAgICAgICAgZm9yICh4IGluIHRoaXMudGhhdC5tYXJrZXJzLmFsbCkge1xuICAgICAgICAgICAgaWYgKHRoaXMudGhhdC5tYXJrZXJzLmFsbFt4XS52aXNpYmxlKSB7XG4gICAgICAgICAgICAgICAgY291bnQrKztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBnb29nbGUubWFwcy5ldmVudC50cmlnZ2VyKHRoaXMudGhhdC5pbnN0YW5jZSwgJ21hcmtlcl92aXNpYmlsaXR5X2NoYW5nZWQnLCBjb3VudCk7XG4gICAgfTtcbiAgICBVcGRhdGVNYXJrZXIucHJvdG90eXBlLnVwZGF0ZSA9IGZ1bmN0aW9uIChhcmdzLCBvcHRpb25zKSB7XG4gICAgICAgIHZhciB2aXNpYmlsaXR5RmxhZyA9IGZhbHNlO1xuICAgICAgICB2YXIgcHJlcGFyZWRPcHRpb25zID0gdXRpbHMucHJlcGFyZU9wdGlvbnMob3B0aW9ucywgY29uZmlnLmN1c3RvbU1hcmtlck9wdGlvbnMpO1xuICAgICAgICBpZiAocHJlcGFyZWRPcHRpb25zLmRlZmF1bHRzICYmIHByZXBhcmVkT3B0aW9ucy5kZWZhdWx0cy5oYXNPd25Qcm9wZXJ0eSgndmlzaWJsZScpICYmIHRoaXMudGhhdC5ldmVudHMuaW5kZXhPZignbWFya2VyX3Zpc2liaWxpdHlfY2hhbmdlZCcpID4gLTEpIHtcbiAgICAgICAgICAgIHZpc2liaWxpdHlGbGFnID0gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgICB2YXIgcmVzdWx0O1xuICAgICAgICB2YXIgdHlwZSA9IE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbChhcmdzKTtcbiAgICAgICAgaWYgKHR5cGUgPT09ICdbb2JqZWN0IE9iamVjdF0nKSB7XG4gICAgICAgICAgICBpZiAoT2JqZWN0LmtleXMoYXJncykubGVuZ3RoID09PSAxICYmIGFyZ3MudGFncykge1xuICAgICAgICAgICAgICAgIHZhciBmaWx0ZXJJbnN0YW5jZSA9IG5ldyBmaWx0ZXIodGhpcy50aGF0LCAnbWFya2VycycpO1xuICAgICAgICAgICAgICAgIHJlc3VsdCA9IHRoaXMuYnVsa1VwZGF0ZShmaWx0ZXJJbnN0YW5jZS5maWx0ZXIoYXJncyksIHByZXBhcmVkT3B0aW9ucyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICByZXN1bHQgPSB0aGlzLmN1c3RvbVVwZGF0ZSh0aGlzLmZpbmRNYXJrZXIoYXJncyksIHByZXBhcmVkT3B0aW9ucyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHR5cGUgPT09ICdbb2JqZWN0IEFycmF5XScpIHtcbiAgICAgICAgICAgIHJlc3VsdCA9IHRoaXMuYnVsa1VwZGF0ZShhcmdzLCBwcmVwYXJlZE9wdGlvbnMpO1xuICAgICAgICB9XG4gICAgICAgIGlmICh2aXNpYmlsaXR5RmxhZykge1xuICAgICAgICAgICAgdGhpcy5jb3VudFZpc2libGUoKTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLnRoYXQubWFya2Vycy5kYXRhQ2hhbmdlZCA9IHRydWU7XG4gICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfTtcbiAgICByZXR1cm4gVXBkYXRlTWFya2VyO1xufSkoKTtcbm1vZHVsZS5leHBvcnRzID0gVXBkYXRlTWFya2VyO1xuIiwidmFyIFV0aWxzID0gKGZ1bmN0aW9uICgpIHtcbiAgICBmdW5jdGlvbiBVdGlscygpIHtcbiAgICB9XG4gICAgVXRpbHMuY2xvbmUgPSBmdW5jdGlvbiAobywgZXhjZXB0aW9uS2V5cykge1xuICAgICAgICB2YXIgb3V0LCB2LCBrZXk7XG4gICAgICAgIG91dCA9IEFycmF5LmlzQXJyYXkobykgPyBbXSA6IHt9O1xuICAgICAgICBmb3IgKGtleSBpbiBvKSB7XG4gICAgICAgICAgICBpZiAoby5oYXNPd25Qcm9wZXJ0eShrZXkpKSB7XG4gICAgICAgICAgICAgICAgaWYgKCFleGNlcHRpb25LZXlzIHx8IChleGNlcHRpb25LZXlzICYmIGV4Y2VwdGlvbktleXMuaW5kZXhPZihrZXkpID09PSAtMSkpIHtcbiAgICAgICAgICAgICAgICAgICAgdiA9IG9ba2V5XTtcbiAgICAgICAgICAgICAgICAgICAgb3V0W2tleV0gPSAodHlwZW9mIHYgPT09ICdvYmplY3QnKSA/IHRoaXMuY2xvbmUodikgOiB2O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gb3V0O1xuICAgIH07XG4gICAgVXRpbHMuY3JlYXRlVWlkID0gZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gJ3h4eHh4eHh4eHh4eDR4eHh5eHh4eHh4eHh4eHh4eHh4Jy5yZXBsYWNlKC9beHldL2csIGZ1bmN0aW9uIChjKSB7XG4gICAgICAgICAgICB2YXIgciwgdjtcbiAgICAgICAgICAgIHIgPSBNYXRoLnJhbmRvbSgpICogMTYgfCAwO1xuICAgICAgICAgICAgdiA9IGMgPT09ICd4JyA/IHIgOiByICYgMHgzIHwgMHg4O1xuICAgICAgICAgICAgcmV0dXJuIHYudG9TdHJpbmcoMTYpO1xuICAgICAgICB9KTtcbiAgICB9O1xuICAgIFV0aWxzLnByZXBhcmVPcHRpb25zID0gZnVuY3Rpb24gKG9wdGlvbnMsIGN1c3RvbSkge1xuICAgICAgICB2YXIgcmVzdWx0ID0geyBjdXN0b206IHt9LCBkZWZhdWx0czoge30gfSwgb3B0aW9uO1xuICAgICAgICBmb3IgKG9wdGlvbiBpbiBvcHRpb25zKSB7XG4gICAgICAgICAgICBpZiAob3B0aW9ucy5oYXNPd25Qcm9wZXJ0eShvcHRpb24pKSB7XG4gICAgICAgICAgICAgICAgaWYgKGN1c3RvbS5pbmRleE9mKG9wdGlvbikgPiAtMSkge1xuICAgICAgICAgICAgICAgICAgICByZXN1bHQuY3VzdG9tID0gcmVzdWx0LmN1c3RvbSB8fCB7fTtcbiAgICAgICAgICAgICAgICAgICAgcmVzdWx0LmN1c3RvbVtvcHRpb25dID0gb3B0aW9uc1tvcHRpb25dO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgcmVzdWx0LmRlZmF1bHRzID0gcmVzdWx0LmRlZmF1bHRzIHx8IHt9O1xuICAgICAgICAgICAgICAgICAgICByZXN1bHQuZGVmYXVsdHNbb3B0aW9uXSA9IG9wdGlvbnNbb3B0aW9uXTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9O1xuICAgIFV0aWxzLmlzQXJyYXkgPSBmdW5jdGlvbiAoYXJnKSB7XG4gICAgICAgIHJldHVybiBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwoYXJnKSA9PT0gJ1tvYmplY3QgQXJyYXldJztcbiAgICB9O1xuICAgIFV0aWxzLnRvQXJyYXkgPSBmdW5jdGlvbiAob2JqKSB7XG4gICAgICAgIHJldHVybiBPYmplY3Qua2V5cyhvYmopLm1hcChmdW5jdGlvbiAoa2V5KSB7XG4gICAgICAgICAgICByZXR1cm4gb2JqW2tleV07XG4gICAgICAgIH0pO1xuICAgIH07XG4gICAgVXRpbHMuZGVmYXVsdERpbWVuc2lvbiA9IGZ1bmN0aW9uIChpdGVtKSB7XG4gICAgICAgIHJldHVybiBmdW5jdGlvbiAoZCkge1xuICAgICAgICAgICAgaWYgKHR5cGVvZiBkLmRhdGFbaXRlbV0gPT09ICd1bmRlZmluZWQnICYmIHR5cGVvZiBkW2l0ZW1dICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgICAgIHJldHVybiBkW2l0ZW1dO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHR5cGVvZiBkLmRhdGFbaXRlbV0gPT09ICd1bmRlZmluZWQnICYmIHR5cGVvZiBkW2l0ZW1dID09PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIGQuZGF0YVtpdGVtXTtcbiAgICAgICAgfTtcbiAgICB9O1xuICAgIC8vIGNvbXBhcmVzIHR3byBsaXN0cyBhbmQgcmV0dXJucyB0aGUgY29tbW9uIGl0ZW1zXG4gICAgVXRpbHMuZ2V0Q29tbW9uT2JqZWN0ID0gZnVuY3Rpb24gKGxpc3QxLCBsaXN0Mikge1xuICAgICAgICB2YXIgcmVzdWx0ID0ge307XG4gICAgICAgIGZvciAodmFyIHVpZCBpbiBsaXN0MSkge1xuICAgICAgICAgICAgaWYgKGxpc3QxLmhhc093blByb3BlcnR5KHVpZCkpIHtcbiAgICAgICAgICAgICAgICB2YXIgbWF0Y2ggPSBsaXN0Mlt1aWRdO1xuICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgbWF0Y2ggIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICAgICAgICAgIHJlc3VsdFt1aWRdID0gbWF0Y2g7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfTtcbiAgICByZXR1cm4gVXRpbHM7XG59KSgpO1xubW9kdWxlLmV4cG9ydHMgPSBVdGlscztcbiIsIihmdW5jdGlvbihleHBvcnRzKXtcbmNyb3NzZmlsdGVyLnZlcnNpb24gPSBcIjEuMy4xMlwiO1xuZnVuY3Rpb24gY3Jvc3NmaWx0ZXJfaWRlbnRpdHkoZCkge1xuICByZXR1cm4gZDtcbn1cbmNyb3NzZmlsdGVyLnBlcm11dGUgPSBwZXJtdXRlO1xuXG5mdW5jdGlvbiBwZXJtdXRlKGFycmF5LCBpbmRleCkge1xuICBmb3IgKHZhciBpID0gMCwgbiA9IGluZGV4Lmxlbmd0aCwgY29weSA9IG5ldyBBcnJheShuKTsgaSA8IG47ICsraSkge1xuICAgIGNvcHlbaV0gPSBhcnJheVtpbmRleFtpXV07XG4gIH1cbiAgcmV0dXJuIGNvcHk7XG59XG52YXIgYmlzZWN0ID0gY3Jvc3NmaWx0ZXIuYmlzZWN0ID0gYmlzZWN0X2J5KGNyb3NzZmlsdGVyX2lkZW50aXR5KTtcblxuYmlzZWN0LmJ5ID0gYmlzZWN0X2J5O1xuXG5mdW5jdGlvbiBiaXNlY3RfYnkoZikge1xuXG4gIC8vIExvY2F0ZSB0aGUgaW5zZXJ0aW9uIHBvaW50IGZvciB4IGluIGEgdG8gbWFpbnRhaW4gc29ydGVkIG9yZGVyLiBUaGVcbiAgLy8gYXJndW1lbnRzIGxvIGFuZCBoaSBtYXkgYmUgdXNlZCB0byBzcGVjaWZ5IGEgc3Vic2V0IG9mIHRoZSBhcnJheSB3aGljaFxuICAvLyBzaG91bGQgYmUgY29uc2lkZXJlZDsgYnkgZGVmYXVsdCB0aGUgZW50aXJlIGFycmF5IGlzIHVzZWQuIElmIHggaXMgYWxyZWFkeVxuICAvLyBwcmVzZW50IGluIGEsIHRoZSBpbnNlcnRpb24gcG9pbnQgd2lsbCBiZSBiZWZvcmUgKHRvIHRoZSBsZWZ0IG9mKSBhbnlcbiAgLy8gZXhpc3RpbmcgZW50cmllcy4gVGhlIHJldHVybiB2YWx1ZSBpcyBzdWl0YWJsZSBmb3IgdXNlIGFzIHRoZSBmaXJzdFxuICAvLyBhcmd1bWVudCB0byBgYXJyYXkuc3BsaWNlYCBhc3N1bWluZyB0aGF0IGEgaXMgYWxyZWFkeSBzb3J0ZWQuXG4gIC8vXG4gIC8vIFRoZSByZXR1cm5lZCBpbnNlcnRpb24gcG9pbnQgaSBwYXJ0aXRpb25zIHRoZSBhcnJheSBhIGludG8gdHdvIGhhbHZlcyBzb1xuICAvLyB0aGF0IGFsbCB2IDwgeCBmb3IgdiBpbiBhW2xvOmldIGZvciB0aGUgbGVmdCBzaWRlIGFuZCBhbGwgdiA+PSB4IGZvciB2IGluXG4gIC8vIGFbaTpoaV0gZm9yIHRoZSByaWdodCBzaWRlLlxuICBmdW5jdGlvbiBiaXNlY3RMZWZ0KGEsIHgsIGxvLCBoaSkge1xuICAgIHdoaWxlIChsbyA8IGhpKSB7XG4gICAgICB2YXIgbWlkID0gbG8gKyBoaSA+Pj4gMTtcbiAgICAgIGlmIChmKGFbbWlkXSkgPCB4KSBsbyA9IG1pZCArIDE7XG4gICAgICBlbHNlIGhpID0gbWlkO1xuICAgIH1cbiAgICByZXR1cm4gbG87XG4gIH1cblxuICAvLyBTaW1pbGFyIHRvIGJpc2VjdExlZnQsIGJ1dCByZXR1cm5zIGFuIGluc2VydGlvbiBwb2ludCB3aGljaCBjb21lcyBhZnRlciAodG9cbiAgLy8gdGhlIHJpZ2h0IG9mKSBhbnkgZXhpc3RpbmcgZW50cmllcyBvZiB4IGluIGEuXG4gIC8vXG4gIC8vIFRoZSByZXR1cm5lZCBpbnNlcnRpb24gcG9pbnQgaSBwYXJ0aXRpb25zIHRoZSBhcnJheSBpbnRvIHR3byBoYWx2ZXMgc28gdGhhdFxuICAvLyBhbGwgdiA8PSB4IGZvciB2IGluIGFbbG86aV0gZm9yIHRoZSBsZWZ0IHNpZGUgYW5kIGFsbCB2ID4geCBmb3IgdiBpblxuICAvLyBhW2k6aGldIGZvciB0aGUgcmlnaHQgc2lkZS5cbiAgZnVuY3Rpb24gYmlzZWN0UmlnaHQoYSwgeCwgbG8sIGhpKSB7XG4gICAgd2hpbGUgKGxvIDwgaGkpIHtcbiAgICAgIHZhciBtaWQgPSBsbyArIGhpID4+PiAxO1xuICAgICAgaWYgKHggPCBmKGFbbWlkXSkpIGhpID0gbWlkO1xuICAgICAgZWxzZSBsbyA9IG1pZCArIDE7XG4gICAgfVxuICAgIHJldHVybiBsbztcbiAgfVxuXG4gIGJpc2VjdFJpZ2h0LnJpZ2h0ID0gYmlzZWN0UmlnaHQ7XG4gIGJpc2VjdFJpZ2h0LmxlZnQgPSBiaXNlY3RMZWZ0O1xuICByZXR1cm4gYmlzZWN0UmlnaHQ7XG59XG52YXIgaGVhcCA9IGNyb3NzZmlsdGVyLmhlYXAgPSBoZWFwX2J5KGNyb3NzZmlsdGVyX2lkZW50aXR5KTtcblxuaGVhcC5ieSA9IGhlYXBfYnk7XG5cbmZ1bmN0aW9uIGhlYXBfYnkoZikge1xuXG4gIC8vIEJ1aWxkcyBhIGJpbmFyeSBoZWFwIHdpdGhpbiB0aGUgc3BlY2lmaWVkIGFycmF5IGFbbG86aGldLiBUaGUgaGVhcCBoYXMgdGhlXG4gIC8vIHByb3BlcnR5IHN1Y2ggdGhhdCB0aGUgcGFyZW50IGFbbG8raV0gaXMgYWx3YXlzIGxlc3MgdGhhbiBvciBlcXVhbCB0byBpdHNcbiAgLy8gdHdvIGNoaWxkcmVuOiBhW2xvKzIqaSsxXSBhbmQgYVtsbysyKmkrMl0uXG4gIGZ1bmN0aW9uIGhlYXAoYSwgbG8sIGhpKSB7XG4gICAgdmFyIG4gPSBoaSAtIGxvLFxuICAgICAgICBpID0gKG4gPj4+IDEpICsgMTtcbiAgICB3aGlsZSAoLS1pID4gMCkgc2lmdChhLCBpLCBuLCBsbyk7XG4gICAgcmV0dXJuIGE7XG4gIH1cblxuICAvLyBTb3J0cyB0aGUgc3BlY2lmaWVkIGFycmF5IGFbbG86aGldIGluIGRlc2NlbmRpbmcgb3JkZXIsIGFzc3VtaW5nIGl0IGlzXG4gIC8vIGFscmVhZHkgYSBoZWFwLlxuICBmdW5jdGlvbiBzb3J0KGEsIGxvLCBoaSkge1xuICAgIHZhciBuID0gaGkgLSBsbyxcbiAgICAgICAgdDtcbiAgICB3aGlsZSAoLS1uID4gMCkgdCA9IGFbbG9dLCBhW2xvXSA9IGFbbG8gKyBuXSwgYVtsbyArIG5dID0gdCwgc2lmdChhLCAxLCBuLCBsbyk7XG4gICAgcmV0dXJuIGE7XG4gIH1cblxuICAvLyBTaWZ0cyB0aGUgZWxlbWVudCBhW2xvK2ktMV0gZG93biB0aGUgaGVhcCwgd2hlcmUgdGhlIGhlYXAgaXMgdGhlIGNvbnRpZ3VvdXNcbiAgLy8gc2xpY2Ugb2YgYXJyYXkgYVtsbzpsbytuXS4gVGhpcyBtZXRob2QgY2FuIGFsc28gYmUgdXNlZCB0byB1cGRhdGUgdGhlIGhlYXBcbiAgLy8gaW5jcmVtZW50YWxseSwgd2l0aG91dCBpbmN1cnJpbmcgdGhlIGZ1bGwgY29zdCBvZiByZWNvbnN0cnVjdGluZyB0aGUgaGVhcC5cbiAgZnVuY3Rpb24gc2lmdChhLCBpLCBuLCBsbykge1xuICAgIHZhciBkID0gYVstLWxvICsgaV0sXG4gICAgICAgIHggPSBmKGQpLFxuICAgICAgICBjaGlsZDtcbiAgICB3aGlsZSAoKGNoaWxkID0gaSA8PCAxKSA8PSBuKSB7XG4gICAgICBpZiAoY2hpbGQgPCBuICYmIGYoYVtsbyArIGNoaWxkXSkgPiBmKGFbbG8gKyBjaGlsZCArIDFdKSkgY2hpbGQrKztcbiAgICAgIGlmICh4IDw9IGYoYVtsbyArIGNoaWxkXSkpIGJyZWFrO1xuICAgICAgYVtsbyArIGldID0gYVtsbyArIGNoaWxkXTtcbiAgICAgIGkgPSBjaGlsZDtcbiAgICB9XG4gICAgYVtsbyArIGldID0gZDtcbiAgfVxuXG4gIGhlYXAuc29ydCA9IHNvcnQ7XG4gIHJldHVybiBoZWFwO1xufVxudmFyIGhlYXBzZWxlY3QgPSBjcm9zc2ZpbHRlci5oZWFwc2VsZWN0ID0gaGVhcHNlbGVjdF9ieShjcm9zc2ZpbHRlcl9pZGVudGl0eSk7XG5cbmhlYXBzZWxlY3QuYnkgPSBoZWFwc2VsZWN0X2J5O1xuXG5mdW5jdGlvbiBoZWFwc2VsZWN0X2J5KGYpIHtcbiAgdmFyIGhlYXAgPSBoZWFwX2J5KGYpO1xuXG4gIC8vIFJldHVybnMgYSBuZXcgYXJyYXkgY29udGFpbmluZyB0aGUgdG9wIGsgZWxlbWVudHMgaW4gdGhlIGFycmF5IGFbbG86aGldLlxuICAvLyBUaGUgcmV0dXJuZWQgYXJyYXkgaXMgbm90IHNvcnRlZCwgYnV0IG1haW50YWlucyB0aGUgaGVhcCBwcm9wZXJ0eS4gSWYgayBpc1xuICAvLyBncmVhdGVyIHRoYW4gaGkgLSBsbywgdGhlbiBmZXdlciB0aGFuIGsgZWxlbWVudHMgd2lsbCBiZSByZXR1cm5lZC4gVGhlXG4gIC8vIG9yZGVyIG9mIGVsZW1lbnRzIGluIGEgaXMgdW5jaGFuZ2VkIGJ5IHRoaXMgb3BlcmF0aW9uLlxuICBmdW5jdGlvbiBoZWFwc2VsZWN0KGEsIGxvLCBoaSwgaykge1xuICAgIHZhciBxdWV1ZSA9IG5ldyBBcnJheShrID0gTWF0aC5taW4oaGkgLSBsbywgaykpLFxuICAgICAgICBtaW4sXG4gICAgICAgIGksXG4gICAgICAgIHgsXG4gICAgICAgIGQ7XG5cbiAgICBmb3IgKGkgPSAwOyBpIDwgazsgKytpKSBxdWV1ZVtpXSA9IGFbbG8rK107XG4gICAgaGVhcChxdWV1ZSwgMCwgayk7XG5cbiAgICBpZiAobG8gPCBoaSkge1xuICAgICAgbWluID0gZihxdWV1ZVswXSk7XG4gICAgICBkbyB7XG4gICAgICAgIGlmICh4ID0gZihkID0gYVtsb10pID4gbWluKSB7XG4gICAgICAgICAgcXVldWVbMF0gPSBkO1xuICAgICAgICAgIG1pbiA9IGYoaGVhcChxdWV1ZSwgMCwgaylbMF0pO1xuICAgICAgICB9XG4gICAgICB9IHdoaWxlICgrK2xvIDwgaGkpO1xuICAgIH1cblxuICAgIHJldHVybiBxdWV1ZTtcbiAgfVxuXG4gIHJldHVybiBoZWFwc2VsZWN0O1xufVxudmFyIGluc2VydGlvbnNvcnQgPSBjcm9zc2ZpbHRlci5pbnNlcnRpb25zb3J0ID0gaW5zZXJ0aW9uc29ydF9ieShjcm9zc2ZpbHRlcl9pZGVudGl0eSk7XG5cbmluc2VydGlvbnNvcnQuYnkgPSBpbnNlcnRpb25zb3J0X2J5O1xuXG5mdW5jdGlvbiBpbnNlcnRpb25zb3J0X2J5KGYpIHtcblxuICBmdW5jdGlvbiBpbnNlcnRpb25zb3J0KGEsIGxvLCBoaSkge1xuICAgIGZvciAodmFyIGkgPSBsbyArIDE7IGkgPCBoaTsgKytpKSB7XG4gICAgICBmb3IgKHZhciBqID0gaSwgdCA9IGFbaV0sIHggPSBmKHQpOyBqID4gbG8gJiYgZihhW2ogLSAxXSkgPiB4OyAtLWopIHtcbiAgICAgICAgYVtqXSA9IGFbaiAtIDFdO1xuICAgICAgfVxuICAgICAgYVtqXSA9IHQ7XG4gICAgfVxuICAgIHJldHVybiBhO1xuICB9XG5cbiAgcmV0dXJuIGluc2VydGlvbnNvcnQ7XG59XG4vLyBBbGdvcml0aG0gZGVzaWduZWQgYnkgVmxhZGltaXIgWWFyb3NsYXZza2l5LlxuLy8gSW1wbGVtZW50YXRpb24gYmFzZWQgb24gdGhlIERhcnQgcHJvamVjdDsgc2VlIGxpYi9kYXJ0L0xJQ0VOU0UgZm9yIGRldGFpbHMuXG5cbnZhciBxdWlja3NvcnQgPSBjcm9zc2ZpbHRlci5xdWlja3NvcnQgPSBxdWlja3NvcnRfYnkoY3Jvc3NmaWx0ZXJfaWRlbnRpdHkpO1xuXG5xdWlja3NvcnQuYnkgPSBxdWlja3NvcnRfYnk7XG5cbmZ1bmN0aW9uIHF1aWNrc29ydF9ieShmKSB7XG4gIHZhciBpbnNlcnRpb25zb3J0ID0gaW5zZXJ0aW9uc29ydF9ieShmKTtcblxuICBmdW5jdGlvbiBzb3J0KGEsIGxvLCBoaSkge1xuICAgIHJldHVybiAoaGkgLSBsbyA8IHF1aWNrc29ydF9zaXplVGhyZXNob2xkXG4gICAgICAgID8gaW5zZXJ0aW9uc29ydFxuICAgICAgICA6IHF1aWNrc29ydCkoYSwgbG8sIGhpKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHF1aWNrc29ydChhLCBsbywgaGkpIHtcbiAgICAvLyBDb21wdXRlIHRoZSB0d28gcGl2b3RzIGJ5IGxvb2tpbmcgYXQgNSBlbGVtZW50cy5cbiAgICB2YXIgc2l4dGggPSAoaGkgLSBsbykgLyA2IHwgMCxcbiAgICAgICAgaTEgPSBsbyArIHNpeHRoLFxuICAgICAgICBpNSA9IGhpIC0gMSAtIHNpeHRoLFxuICAgICAgICBpMyA9IGxvICsgaGkgLSAxID4+IDEsICAvLyBUaGUgbWlkcG9pbnQuXG4gICAgICAgIGkyID0gaTMgLSBzaXh0aCxcbiAgICAgICAgaTQgPSBpMyArIHNpeHRoO1xuXG4gICAgdmFyIGUxID0gYVtpMV0sIHgxID0gZihlMSksXG4gICAgICAgIGUyID0gYVtpMl0sIHgyID0gZihlMiksXG4gICAgICAgIGUzID0gYVtpM10sIHgzID0gZihlMyksXG4gICAgICAgIGU0ID0gYVtpNF0sIHg0ID0gZihlNCksXG4gICAgICAgIGU1ID0gYVtpNV0sIHg1ID0gZihlNSk7XG5cbiAgICB2YXIgdDtcblxuICAgIC8vIFNvcnQgdGhlIHNlbGVjdGVkIDUgZWxlbWVudHMgdXNpbmcgYSBzb3J0aW5nIG5ldHdvcmsuXG4gICAgaWYgKHgxID4geDIpIHQgPSBlMSwgZTEgPSBlMiwgZTIgPSB0LCB0ID0geDEsIHgxID0geDIsIHgyID0gdDtcbiAgICBpZiAoeDQgPiB4NSkgdCA9IGU0LCBlNCA9IGU1LCBlNSA9IHQsIHQgPSB4NCwgeDQgPSB4NSwgeDUgPSB0O1xuICAgIGlmICh4MSA+IHgzKSB0ID0gZTEsIGUxID0gZTMsIGUzID0gdCwgdCA9IHgxLCB4MSA9IHgzLCB4MyA9IHQ7XG4gICAgaWYgKHgyID4geDMpIHQgPSBlMiwgZTIgPSBlMywgZTMgPSB0LCB0ID0geDIsIHgyID0geDMsIHgzID0gdDtcbiAgICBpZiAoeDEgPiB4NCkgdCA9IGUxLCBlMSA9IGU0LCBlNCA9IHQsIHQgPSB4MSwgeDEgPSB4NCwgeDQgPSB0O1xuICAgIGlmICh4MyA+IHg0KSB0ID0gZTMsIGUzID0gZTQsIGU0ID0gdCwgdCA9IHgzLCB4MyA9IHg0LCB4NCA9IHQ7XG4gICAgaWYgKHgyID4geDUpIHQgPSBlMiwgZTIgPSBlNSwgZTUgPSB0LCB0ID0geDIsIHgyID0geDUsIHg1ID0gdDtcbiAgICBpZiAoeDIgPiB4MykgdCA9IGUyLCBlMiA9IGUzLCBlMyA9IHQsIHQgPSB4MiwgeDIgPSB4MywgeDMgPSB0O1xuICAgIGlmICh4NCA+IHg1KSB0ID0gZTQsIGU0ID0gZTUsIGU1ID0gdCwgdCA9IHg0LCB4NCA9IHg1LCB4NSA9IHQ7XG5cbiAgICB2YXIgcGl2b3QxID0gZTIsIHBpdm90VmFsdWUxID0geDIsXG4gICAgICAgIHBpdm90MiA9IGU0LCBwaXZvdFZhbHVlMiA9IHg0O1xuXG4gICAgLy8gZTIgYW5kIGU0IGhhdmUgYmVlbiBzYXZlZCBpbiB0aGUgcGl2b3QgdmFyaWFibGVzLiBUaGV5IHdpbGwgYmUgd3JpdHRlblxuICAgIC8vIGJhY2ssIG9uY2UgdGhlIHBhcnRpdGlvbmluZyBpcyBmaW5pc2hlZC5cbiAgICBhW2kxXSA9IGUxO1xuICAgIGFbaTJdID0gYVtsb107XG4gICAgYVtpM10gPSBlMztcbiAgICBhW2k0XSA9IGFbaGkgLSAxXTtcbiAgICBhW2k1XSA9IGU1O1xuXG4gICAgdmFyIGxlc3MgPSBsbyArIDEsICAgLy8gRmlyc3QgZWxlbWVudCBpbiB0aGUgbWlkZGxlIHBhcnRpdGlvbi5cbiAgICAgICAgZ3JlYXQgPSBoaSAtIDI7ICAvLyBMYXN0IGVsZW1lbnQgaW4gdGhlIG1pZGRsZSBwYXJ0aXRpb24uXG5cbiAgICAvLyBOb3RlIHRoYXQgZm9yIHZhbHVlIGNvbXBhcmlzb24sIDwsIDw9LCA+PSBhbmQgPiBjb2VyY2UgdG8gYSBwcmltaXRpdmUgdmlhXG4gICAgLy8gT2JqZWN0LnByb3RvdHlwZS52YWx1ZU9mOyA9PSBhbmQgPT09IGRvIG5vdCwgc28gaW4gb3JkZXIgdG8gYmUgY29uc2lzdGVudFxuICAgIC8vIHdpdGggbmF0dXJhbCBvcmRlciAoc3VjaCBhcyBmb3IgRGF0ZSBvYmplY3RzKSwgd2UgbXVzdCBkbyB0d28gY29tcGFyZXMuXG4gICAgdmFyIHBpdm90c0VxdWFsID0gcGl2b3RWYWx1ZTEgPD0gcGl2b3RWYWx1ZTIgJiYgcGl2b3RWYWx1ZTEgPj0gcGl2b3RWYWx1ZTI7XG4gICAgaWYgKHBpdm90c0VxdWFsKSB7XG5cbiAgICAgIC8vIERlZ2VuZXJhdGVkIGNhc2Ugd2hlcmUgdGhlIHBhcnRpdGlvbmluZyBiZWNvbWVzIGEgZHV0Y2ggbmF0aW9uYWwgZmxhZ1xuICAgICAgLy8gcHJvYmxlbS5cbiAgICAgIC8vXG4gICAgICAvLyBbIHwgIDwgcGl2b3QgIHwgPT0gcGl2b3QgfCB1bnBhcnRpdGlvbmVkIHwgPiBwaXZvdCAgfCBdXG4gICAgICAvLyAgXiAgICAgICAgICAgICBeICAgICAgICAgIF4gICAgICAgICAgICAgXiAgICAgICAgICAgIF5cbiAgICAgIC8vIGxlZnQgICAgICAgICBsZXNzICAgICAgICAgayAgICAgICAgICAgZ3JlYXQgICAgICAgICByaWdodFxuICAgICAgLy9cbiAgICAgIC8vIGFbbGVmdF0gYW5kIGFbcmlnaHRdIGFyZSB1bmRlZmluZWQgYW5kIGFyZSBmaWxsZWQgYWZ0ZXIgdGhlXG4gICAgICAvLyBwYXJ0aXRpb25pbmcuXG4gICAgICAvL1xuICAgICAgLy8gSW52YXJpYW50czpcbiAgICAgIC8vICAgMSkgZm9yIHggaW4gXWxlZnQsIGxlc3NbIDogeCA8IHBpdm90LlxuICAgICAgLy8gICAyKSBmb3IgeCBpbiBbbGVzcywga1sgOiB4ID09IHBpdm90LlxuICAgICAgLy8gICAzKSBmb3IgeCBpbiBdZ3JlYXQsIHJpZ2h0WyA6IHggPiBwaXZvdC5cbiAgICAgIGZvciAodmFyIGsgPSBsZXNzOyBrIDw9IGdyZWF0OyArK2spIHtcbiAgICAgICAgdmFyIGVrID0gYVtrXSwgeGsgPSBmKGVrKTtcbiAgICAgICAgaWYgKHhrIDwgcGl2b3RWYWx1ZTEpIHtcbiAgICAgICAgICBpZiAoayAhPT0gbGVzcykge1xuICAgICAgICAgICAgYVtrXSA9IGFbbGVzc107XG4gICAgICAgICAgICBhW2xlc3NdID0gZWs7XG4gICAgICAgICAgfVxuICAgICAgICAgICsrbGVzcztcbiAgICAgICAgfSBlbHNlIGlmICh4ayA+IHBpdm90VmFsdWUxKSB7XG5cbiAgICAgICAgICAvLyBGaW5kIHRoZSBmaXJzdCBlbGVtZW50IDw9IHBpdm90IGluIHRoZSByYW5nZSBbayAtIDEsIGdyZWF0XSBhbmRcbiAgICAgICAgICAvLyBwdXQgWzplazpdIHRoZXJlLiBXZSBrbm93IHRoYXQgc3VjaCBhbiBlbGVtZW50IG11c3QgZXhpc3Q6XG4gICAgICAgICAgLy8gV2hlbiBrID09IGxlc3MsIHRoZW4gZWwzICh3aGljaCBpcyBlcXVhbCB0byBwaXZvdCkgbGllcyBpbiB0aGVcbiAgICAgICAgICAvLyBpbnRlcnZhbC4gT3RoZXJ3aXNlIGFbayAtIDFdID09IHBpdm90IGFuZCB0aGUgc2VhcmNoIHN0b3BzIGF0IGstMS5cbiAgICAgICAgICAvLyBOb3RlIHRoYXQgaW4gdGhlIGxhdHRlciBjYXNlIGludmFyaWFudCAyIHdpbGwgYmUgdmlvbGF0ZWQgZm9yIGFcbiAgICAgICAgICAvLyBzaG9ydCBhbW91bnQgb2YgdGltZS4gVGhlIGludmFyaWFudCB3aWxsIGJlIHJlc3RvcmVkIHdoZW4gdGhlXG4gICAgICAgICAgLy8gcGl2b3RzIGFyZSBwdXQgaW50byB0aGVpciBmaW5hbCBwb3NpdGlvbnMuXG4gICAgICAgICAgd2hpbGUgKHRydWUpIHtcbiAgICAgICAgICAgIHZhciBncmVhdFZhbHVlID0gZihhW2dyZWF0XSk7XG4gICAgICAgICAgICBpZiAoZ3JlYXRWYWx1ZSA+IHBpdm90VmFsdWUxKSB7XG4gICAgICAgICAgICAgIGdyZWF0LS07XG4gICAgICAgICAgICAgIC8vIFRoaXMgaXMgdGhlIG9ubHkgbG9jYXRpb24gaW4gdGhlIHdoaWxlLWxvb3Agd2hlcmUgYSBuZXdcbiAgICAgICAgICAgICAgLy8gaXRlcmF0aW9uIGlzIHN0YXJ0ZWQuXG4gICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgfSBlbHNlIGlmIChncmVhdFZhbHVlIDwgcGl2b3RWYWx1ZTEpIHtcbiAgICAgICAgICAgICAgLy8gVHJpcGxlIGV4Y2hhbmdlLlxuICAgICAgICAgICAgICBhW2tdID0gYVtsZXNzXTtcbiAgICAgICAgICAgICAgYVtsZXNzKytdID0gYVtncmVhdF07XG4gICAgICAgICAgICAgIGFbZ3JlYXQtLV0gPSBlaztcbiAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICBhW2tdID0gYVtncmVhdF07XG4gICAgICAgICAgICAgIGFbZ3JlYXQtLV0gPSBlaztcbiAgICAgICAgICAgICAgLy8gTm90ZTogaWYgZ3JlYXQgPCBrIHRoZW4gd2Ugd2lsbCBleGl0IHRoZSBvdXRlciBsb29wIGFuZCBmaXhcbiAgICAgICAgICAgICAgLy8gaW52YXJpYW50IDIgKHdoaWNoIHdlIGp1c3QgdmlvbGF0ZWQpLlxuICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuXG4gICAgICAvLyBXZSBwYXJ0aXRpb24gdGhlIGxpc3QgaW50byB0aHJlZSBwYXJ0czpcbiAgICAgIC8vICAxLiA8IHBpdm90MVxuICAgICAgLy8gIDIuID49IHBpdm90MSAmJiA8PSBwaXZvdDJcbiAgICAgIC8vICAzLiA+IHBpdm90MlxuICAgICAgLy9cbiAgICAgIC8vIER1cmluZyB0aGUgbG9vcCB3ZSBoYXZlOlxuICAgICAgLy8gWyB8IDwgcGl2b3QxIHwgPj0gcGl2b3QxICYmIDw9IHBpdm90MiB8IHVucGFydGl0aW9uZWQgIHwgPiBwaXZvdDIgIHwgXVxuICAgICAgLy8gIF4gICAgICAgICAgICBeICAgICAgICAgICAgICAgICAgICAgICAgXiAgICAgICAgICAgICAgXiAgICAgICAgICAgICBeXG4gICAgICAvLyBsZWZ0ICAgICAgICAgbGVzcyAgICAgICAgICAgICAgICAgICAgIGsgICAgICAgICAgICAgIGdyZWF0ICAgICAgICByaWdodFxuICAgICAgLy9cbiAgICAgIC8vIGFbbGVmdF0gYW5kIGFbcmlnaHRdIGFyZSB1bmRlZmluZWQgYW5kIGFyZSBmaWxsZWQgYWZ0ZXIgdGhlXG4gICAgICAvLyBwYXJ0aXRpb25pbmcuXG4gICAgICAvL1xuICAgICAgLy8gSW52YXJpYW50czpcbiAgICAgIC8vICAgMS4gZm9yIHggaW4gXWxlZnQsIGxlc3NbIDogeCA8IHBpdm90MVxuICAgICAgLy8gICAyLiBmb3IgeCBpbiBbbGVzcywga1sgOiBwaXZvdDEgPD0geCAmJiB4IDw9IHBpdm90MlxuICAgICAgLy8gICAzLiBmb3IgeCBpbiBdZ3JlYXQsIHJpZ2h0WyA6IHggPiBwaXZvdDJcbiAgICAgIGZvciAodmFyIGsgPSBsZXNzOyBrIDw9IGdyZWF0OyBrKyspIHtcbiAgICAgICAgdmFyIGVrID0gYVtrXSwgeGsgPSBmKGVrKTtcbiAgICAgICAgaWYgKHhrIDwgcGl2b3RWYWx1ZTEpIHtcbiAgICAgICAgICBpZiAoayAhPT0gbGVzcykge1xuICAgICAgICAgICAgYVtrXSA9IGFbbGVzc107XG4gICAgICAgICAgICBhW2xlc3NdID0gZWs7XG4gICAgICAgICAgfVxuICAgICAgICAgICsrbGVzcztcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBpZiAoeGsgPiBwaXZvdFZhbHVlMikge1xuICAgICAgICAgICAgd2hpbGUgKHRydWUpIHtcbiAgICAgICAgICAgICAgdmFyIGdyZWF0VmFsdWUgPSBmKGFbZ3JlYXRdKTtcbiAgICAgICAgICAgICAgaWYgKGdyZWF0VmFsdWUgPiBwaXZvdFZhbHVlMikge1xuICAgICAgICAgICAgICAgIGdyZWF0LS07XG4gICAgICAgICAgICAgICAgaWYgKGdyZWF0IDwgaykgYnJlYWs7XG4gICAgICAgICAgICAgICAgLy8gVGhpcyBpcyB0aGUgb25seSBsb2NhdGlvbiBpbnNpZGUgdGhlIGxvb3Agd2hlcmUgYSBuZXdcbiAgICAgICAgICAgICAgICAvLyBpdGVyYXRpb24gaXMgc3RhcnRlZC5cbiAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAvLyBhW2dyZWF0XSA8PSBwaXZvdDIuXG4gICAgICAgICAgICAgICAgaWYgKGdyZWF0VmFsdWUgPCBwaXZvdFZhbHVlMSkge1xuICAgICAgICAgICAgICAgICAgLy8gVHJpcGxlIGV4Y2hhbmdlLlxuICAgICAgICAgICAgICAgICAgYVtrXSA9IGFbbGVzc107XG4gICAgICAgICAgICAgICAgICBhW2xlc3MrK10gPSBhW2dyZWF0XTtcbiAgICAgICAgICAgICAgICAgIGFbZ3JlYXQtLV0gPSBlaztcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgLy8gYVtncmVhdF0gPj0gcGl2b3QxLlxuICAgICAgICAgICAgICAgICAgYVtrXSA9IGFbZ3JlYXRdO1xuICAgICAgICAgICAgICAgICAgYVtncmVhdC0tXSA9IGVrO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIC8vIE1vdmUgcGl2b3RzIGludG8gdGhlaXIgZmluYWwgcG9zaXRpb25zLlxuICAgIC8vIFdlIHNocnVuayB0aGUgbGlzdCBmcm9tIGJvdGggc2lkZXMgKGFbbGVmdF0gYW5kIGFbcmlnaHRdIGhhdmVcbiAgICAvLyBtZWFuaW5nbGVzcyB2YWx1ZXMgaW4gdGhlbSkgYW5kIG5vdyB3ZSBtb3ZlIGVsZW1lbnRzIGZyb20gdGhlIGZpcnN0XG4gICAgLy8gYW5kIHRoaXJkIHBhcnRpdGlvbiBpbnRvIHRoZXNlIGxvY2F0aW9ucyBzbyB0aGF0IHdlIGNhbiBzdG9yZSB0aGVcbiAgICAvLyBwaXZvdHMuXG4gICAgYVtsb10gPSBhW2xlc3MgLSAxXTtcbiAgICBhW2xlc3MgLSAxXSA9IHBpdm90MTtcbiAgICBhW2hpIC0gMV0gPSBhW2dyZWF0ICsgMV07XG4gICAgYVtncmVhdCArIDFdID0gcGl2b3QyO1xuXG4gICAgLy8gVGhlIGxpc3QgaXMgbm93IHBhcnRpdGlvbmVkIGludG8gdGhyZWUgcGFydGl0aW9uczpcbiAgICAvLyBbIDwgcGl2b3QxICAgfCA+PSBwaXZvdDEgJiYgPD0gcGl2b3QyICAgfCAgPiBwaXZvdDIgICBdXG4gICAgLy8gIF4gICAgICAgICAgICBeICAgICAgICAgICAgICAgICAgICAgICAgXiAgICAgICAgICAgICBeXG4gICAgLy8gbGVmdCAgICAgICAgIGxlc3MgICAgICAgICAgICAgICAgICAgICBncmVhdCAgICAgICAgcmlnaHRcblxuICAgIC8vIFJlY3Vyc2l2ZSBkZXNjZW50LiAoRG9uJ3QgaW5jbHVkZSB0aGUgcGl2b3QgdmFsdWVzLilcbiAgICBzb3J0KGEsIGxvLCBsZXNzIC0gMSk7XG4gICAgc29ydChhLCBncmVhdCArIDIsIGhpKTtcblxuICAgIGlmIChwaXZvdHNFcXVhbCkge1xuICAgICAgLy8gQWxsIGVsZW1lbnRzIGluIHRoZSBzZWNvbmQgcGFydGl0aW9uIGFyZSBlcXVhbCB0byB0aGUgcGl2b3QuIE5vXG4gICAgICAvLyBuZWVkIHRvIHNvcnQgdGhlbS5cbiAgICAgIHJldHVybiBhO1xuICAgIH1cblxuICAgIC8vIEluIHRoZW9yeSBpdCBzaG91bGQgYmUgZW5vdWdoIHRvIGNhbGwgX2RvU29ydCByZWN1cnNpdmVseSBvbiB0aGUgc2Vjb25kXG4gICAgLy8gcGFydGl0aW9uLlxuICAgIC8vIFRoZSBBbmRyb2lkIHNvdXJjZSBob3dldmVyIHJlbW92ZXMgdGhlIHBpdm90IGVsZW1lbnRzIGZyb20gdGhlIHJlY3Vyc2l2ZVxuICAgIC8vIGNhbGwgaWYgdGhlIHNlY29uZCBwYXJ0aXRpb24gaXMgdG9vIGxhcmdlIChtb3JlIHRoYW4gMi8zIG9mIHRoZSBsaXN0KS5cbiAgICBpZiAobGVzcyA8IGkxICYmIGdyZWF0ID4gaTUpIHtcbiAgICAgIHZhciBsZXNzVmFsdWUsIGdyZWF0VmFsdWU7XG4gICAgICB3aGlsZSAoKGxlc3NWYWx1ZSA9IGYoYVtsZXNzXSkpIDw9IHBpdm90VmFsdWUxICYmIGxlc3NWYWx1ZSA+PSBwaXZvdFZhbHVlMSkgKytsZXNzO1xuICAgICAgd2hpbGUgKChncmVhdFZhbHVlID0gZihhW2dyZWF0XSkpIDw9IHBpdm90VmFsdWUyICYmIGdyZWF0VmFsdWUgPj0gcGl2b3RWYWx1ZTIpIC0tZ3JlYXQ7XG5cbiAgICAgIC8vIENvcHkgcGFzdGUgb2YgdGhlIHByZXZpb3VzIDMtd2F5IHBhcnRpdGlvbmluZyB3aXRoIGFkYXB0aW9ucy5cbiAgICAgIC8vXG4gICAgICAvLyBXZSBwYXJ0aXRpb24gdGhlIGxpc3QgaW50byB0aHJlZSBwYXJ0czpcbiAgICAgIC8vICAxLiA9PSBwaXZvdDFcbiAgICAgIC8vICAyLiA+IHBpdm90MSAmJiA8IHBpdm90MlxuICAgICAgLy8gIDMuID09IHBpdm90MlxuICAgICAgLy9cbiAgICAgIC8vIER1cmluZyB0aGUgbG9vcCB3ZSBoYXZlOlxuICAgICAgLy8gWyA9PSBwaXZvdDEgfCA+IHBpdm90MSAmJiA8IHBpdm90MiB8IHVucGFydGl0aW9uZWQgIHwgPT0gcGl2b3QyIF1cbiAgICAgIC8vICAgICAgICAgICAgICBeICAgICAgICAgICAgICAgICAgICAgIF4gICAgICAgICAgICAgIF5cbiAgICAgIC8vICAgICAgICAgICAgbGVzcyAgICAgICAgICAgICAgICAgICAgIGsgICAgICAgICAgICAgIGdyZWF0XG4gICAgICAvL1xuICAgICAgLy8gSW52YXJpYW50czpcbiAgICAgIC8vICAgMS4gZm9yIHggaW4gWyAqLCBsZXNzWyA6IHggPT0gcGl2b3QxXG4gICAgICAvLyAgIDIuIGZvciB4IGluIFtsZXNzLCBrWyA6IHBpdm90MSA8IHggJiYgeCA8IHBpdm90MlxuICAgICAgLy8gICAzLiBmb3IgeCBpbiBdZ3JlYXQsICogXSA6IHggPT0gcGl2b3QyXG4gICAgICBmb3IgKHZhciBrID0gbGVzczsgayA8PSBncmVhdDsgaysrKSB7XG4gICAgICAgIHZhciBlayA9IGFba10sIHhrID0gZihlayk7XG4gICAgICAgIGlmICh4ayA8PSBwaXZvdFZhbHVlMSAmJiB4ayA+PSBwaXZvdFZhbHVlMSkge1xuICAgICAgICAgIGlmIChrICE9PSBsZXNzKSB7XG4gICAgICAgICAgICBhW2tdID0gYVtsZXNzXTtcbiAgICAgICAgICAgIGFbbGVzc10gPSBlaztcbiAgICAgICAgICB9XG4gICAgICAgICAgbGVzcysrO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGlmICh4ayA8PSBwaXZvdFZhbHVlMiAmJiB4ayA+PSBwaXZvdFZhbHVlMikge1xuICAgICAgICAgICAgd2hpbGUgKHRydWUpIHtcbiAgICAgICAgICAgICAgdmFyIGdyZWF0VmFsdWUgPSBmKGFbZ3JlYXRdKTtcbiAgICAgICAgICAgICAgaWYgKGdyZWF0VmFsdWUgPD0gcGl2b3RWYWx1ZTIgJiYgZ3JlYXRWYWx1ZSA+PSBwaXZvdFZhbHVlMikge1xuICAgICAgICAgICAgICAgIGdyZWF0LS07XG4gICAgICAgICAgICAgICAgaWYgKGdyZWF0IDwgaykgYnJlYWs7XG4gICAgICAgICAgICAgICAgLy8gVGhpcyBpcyB0aGUgb25seSBsb2NhdGlvbiBpbnNpZGUgdGhlIGxvb3Agd2hlcmUgYSBuZXdcbiAgICAgICAgICAgICAgICAvLyBpdGVyYXRpb24gaXMgc3RhcnRlZC5cbiAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAvLyBhW2dyZWF0XSA8IHBpdm90Mi5cbiAgICAgICAgICAgICAgICBpZiAoZ3JlYXRWYWx1ZSA8IHBpdm90VmFsdWUxKSB7XG4gICAgICAgICAgICAgICAgICAvLyBUcmlwbGUgZXhjaGFuZ2UuXG4gICAgICAgICAgICAgICAgICBhW2tdID0gYVtsZXNzXTtcbiAgICAgICAgICAgICAgICAgIGFbbGVzcysrXSA9IGFbZ3JlYXRdO1xuICAgICAgICAgICAgICAgICAgYVtncmVhdC0tXSA9IGVrO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAvLyBhW2dyZWF0XSA9PSBwaXZvdDEuXG4gICAgICAgICAgICAgICAgICBhW2tdID0gYVtncmVhdF07XG4gICAgICAgICAgICAgICAgICBhW2dyZWF0LS1dID0gZWs7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gVGhlIHNlY29uZCBwYXJ0aXRpb24gaGFzIG5vdyBiZWVuIGNsZWFyZWQgb2YgcGl2b3QgZWxlbWVudHMgYW5kIGxvb2tzXG4gICAgLy8gYXMgZm9sbG93czpcbiAgICAvLyBbICAqICB8ICA+IHBpdm90MSAmJiA8IHBpdm90MiAgfCAqIF1cbiAgICAvLyAgICAgICAgXiAgICAgICAgICAgICAgICAgICAgICBeXG4gICAgLy8gICAgICAgbGVzcyAgICAgICAgICAgICAgICAgIGdyZWF0XG4gICAgLy8gU29ydCB0aGUgc2Vjb25kIHBhcnRpdGlvbiB1c2luZyByZWN1cnNpdmUgZGVzY2VudC5cblxuICAgIC8vIFRoZSBzZWNvbmQgcGFydGl0aW9uIGxvb2tzIGFzIGZvbGxvd3M6XG4gICAgLy8gWyAgKiAgfCAgPj0gcGl2b3QxICYmIDw9IHBpdm90MiAgfCAqIF1cbiAgICAvLyAgICAgICAgXiAgICAgICAgICAgICAgICAgICAgICAgIF5cbiAgICAvLyAgICAgICBsZXNzICAgICAgICAgICAgICAgICAgICBncmVhdFxuICAgIC8vIFNpbXBseSBzb3J0IGl0IGJ5IHJlY3Vyc2l2ZSBkZXNjZW50LlxuXG4gICAgcmV0dXJuIHNvcnQoYSwgbGVzcywgZ3JlYXQgKyAxKTtcbiAgfVxuXG4gIHJldHVybiBzb3J0O1xufVxuXG52YXIgcXVpY2tzb3J0X3NpemVUaHJlc2hvbGQgPSAzMjtcbnZhciBjcm9zc2ZpbHRlcl9hcnJheTggPSBjcm9zc2ZpbHRlcl9hcnJheVVudHlwZWQsXG4gICAgY3Jvc3NmaWx0ZXJfYXJyYXkxNiA9IGNyb3NzZmlsdGVyX2FycmF5VW50eXBlZCxcbiAgICBjcm9zc2ZpbHRlcl9hcnJheTMyID0gY3Jvc3NmaWx0ZXJfYXJyYXlVbnR5cGVkLFxuICAgIGNyb3NzZmlsdGVyX2FycmF5TGVuZ3RoZW4gPSBjcm9zc2ZpbHRlcl9hcnJheUxlbmd0aGVuVW50eXBlZCxcbiAgICBjcm9zc2ZpbHRlcl9hcnJheVdpZGVuID0gY3Jvc3NmaWx0ZXJfYXJyYXlXaWRlblVudHlwZWQ7XG5cbmlmICh0eXBlb2YgVWludDhBcnJheSAhPT0gXCJ1bmRlZmluZWRcIikge1xuICBjcm9zc2ZpbHRlcl9hcnJheTggPSBmdW5jdGlvbihuKSB7IHJldHVybiBuZXcgVWludDhBcnJheShuKTsgfTtcbiAgY3Jvc3NmaWx0ZXJfYXJyYXkxNiA9IGZ1bmN0aW9uKG4pIHsgcmV0dXJuIG5ldyBVaW50MTZBcnJheShuKTsgfTtcbiAgY3Jvc3NmaWx0ZXJfYXJyYXkzMiA9IGZ1bmN0aW9uKG4pIHsgcmV0dXJuIG5ldyBVaW50MzJBcnJheShuKTsgfTtcblxuICBjcm9zc2ZpbHRlcl9hcnJheUxlbmd0aGVuID0gZnVuY3Rpb24oYXJyYXksIGxlbmd0aCkge1xuICAgIGlmIChhcnJheS5sZW5ndGggPj0gbGVuZ3RoKSByZXR1cm4gYXJyYXk7XG4gICAgdmFyIGNvcHkgPSBuZXcgYXJyYXkuY29uc3RydWN0b3IobGVuZ3RoKTtcbiAgICBjb3B5LnNldChhcnJheSk7XG4gICAgcmV0dXJuIGNvcHk7XG4gIH07XG5cbiAgY3Jvc3NmaWx0ZXJfYXJyYXlXaWRlbiA9IGZ1bmN0aW9uKGFycmF5LCB3aWR0aCkge1xuICAgIHZhciBjb3B5O1xuICAgIHN3aXRjaCAod2lkdGgpIHtcbiAgICAgIGNhc2UgMTY6IGNvcHkgPSBjcm9zc2ZpbHRlcl9hcnJheTE2KGFycmF5Lmxlbmd0aCk7IGJyZWFrO1xuICAgICAgY2FzZSAzMjogY29weSA9IGNyb3NzZmlsdGVyX2FycmF5MzIoYXJyYXkubGVuZ3RoKTsgYnJlYWs7XG4gICAgICBkZWZhdWx0OiB0aHJvdyBuZXcgRXJyb3IoXCJpbnZhbGlkIGFycmF5IHdpZHRoIVwiKTtcbiAgICB9XG4gICAgY29weS5zZXQoYXJyYXkpO1xuICAgIHJldHVybiBjb3B5O1xuICB9O1xufVxuXG5mdW5jdGlvbiBjcm9zc2ZpbHRlcl9hcnJheVVudHlwZWQobikge1xuICB2YXIgYXJyYXkgPSBuZXcgQXJyYXkobiksIGkgPSAtMTtcbiAgd2hpbGUgKCsraSA8IG4pIGFycmF5W2ldID0gMDtcbiAgcmV0dXJuIGFycmF5O1xufVxuXG5mdW5jdGlvbiBjcm9zc2ZpbHRlcl9hcnJheUxlbmd0aGVuVW50eXBlZChhcnJheSwgbGVuZ3RoKSB7XG4gIHZhciBuID0gYXJyYXkubGVuZ3RoO1xuICB3aGlsZSAobiA8IGxlbmd0aCkgYXJyYXlbbisrXSA9IDA7XG4gIHJldHVybiBhcnJheTtcbn1cblxuZnVuY3Rpb24gY3Jvc3NmaWx0ZXJfYXJyYXlXaWRlblVudHlwZWQoYXJyYXksIHdpZHRoKSB7XG4gIGlmICh3aWR0aCA+IDMyKSB0aHJvdyBuZXcgRXJyb3IoXCJpbnZhbGlkIGFycmF5IHdpZHRoIVwiKTtcbiAgcmV0dXJuIGFycmF5O1xufVxuZnVuY3Rpb24gY3Jvc3NmaWx0ZXJfZmlsdGVyRXhhY3QoYmlzZWN0LCB2YWx1ZSkge1xuICByZXR1cm4gZnVuY3Rpb24odmFsdWVzKSB7XG4gICAgdmFyIG4gPSB2YWx1ZXMubGVuZ3RoO1xuICAgIHJldHVybiBbYmlzZWN0LmxlZnQodmFsdWVzLCB2YWx1ZSwgMCwgbiksIGJpc2VjdC5yaWdodCh2YWx1ZXMsIHZhbHVlLCAwLCBuKV07XG4gIH07XG59XG5cbmZ1bmN0aW9uIGNyb3NzZmlsdGVyX2ZpbHRlclJhbmdlKGJpc2VjdCwgcmFuZ2UpIHtcbiAgdmFyIG1pbiA9IHJhbmdlWzBdLFxuICAgICAgbWF4ID0gcmFuZ2VbMV07XG4gIHJldHVybiBmdW5jdGlvbih2YWx1ZXMpIHtcbiAgICB2YXIgbiA9IHZhbHVlcy5sZW5ndGg7XG4gICAgcmV0dXJuIFtiaXNlY3QubGVmdCh2YWx1ZXMsIG1pbiwgMCwgbiksIGJpc2VjdC5sZWZ0KHZhbHVlcywgbWF4LCAwLCBuKV07XG4gIH07XG59XG5cbmZ1bmN0aW9uIGNyb3NzZmlsdGVyX2ZpbHRlckFsbCh2YWx1ZXMpIHtcbiAgcmV0dXJuIFswLCB2YWx1ZXMubGVuZ3RoXTtcbn1cbmZ1bmN0aW9uIGNyb3NzZmlsdGVyX251bGwoKSB7XG4gIHJldHVybiBudWxsO1xufVxuZnVuY3Rpb24gY3Jvc3NmaWx0ZXJfemVybygpIHtcbiAgcmV0dXJuIDA7XG59XG5mdW5jdGlvbiBjcm9zc2ZpbHRlcl9yZWR1Y2VJbmNyZW1lbnQocCkge1xuICByZXR1cm4gcCArIDE7XG59XG5cbmZ1bmN0aW9uIGNyb3NzZmlsdGVyX3JlZHVjZURlY3JlbWVudChwKSB7XG4gIHJldHVybiBwIC0gMTtcbn1cblxuZnVuY3Rpb24gY3Jvc3NmaWx0ZXJfcmVkdWNlQWRkKGYpIHtcbiAgcmV0dXJuIGZ1bmN0aW9uKHAsIHYpIHtcbiAgICByZXR1cm4gcCArICtmKHYpO1xuICB9O1xufVxuXG5mdW5jdGlvbiBjcm9zc2ZpbHRlcl9yZWR1Y2VTdWJ0cmFjdChmKSB7XG4gIHJldHVybiBmdW5jdGlvbihwLCB2KSB7XG4gICAgcmV0dXJuIHAgLSBmKHYpO1xuICB9O1xufVxuZXhwb3J0cy5jcm9zc2ZpbHRlciA9IGNyb3NzZmlsdGVyO1xuXG5mdW5jdGlvbiBjcm9zc2ZpbHRlcigpIHtcbiAgdmFyIGNyb3NzZmlsdGVyID0ge1xuICAgIGFkZDogYWRkLFxuICAgIHJlbW92ZTogcmVtb3ZlRGF0YSxcbiAgICBkaW1lbnNpb246IGRpbWVuc2lvbixcbiAgICBncm91cEFsbDogZ3JvdXBBbGwsXG4gICAgc2l6ZTogc2l6ZVxuICB9O1xuXG4gIHZhciBkYXRhID0gW10sIC8vIHRoZSByZWNvcmRzXG4gICAgICBuID0gMCwgLy8gdGhlIG51bWJlciBvZiByZWNvcmRzOyBkYXRhLmxlbmd0aFxuICAgICAgbSA9IDAsIC8vIGEgYml0IG1hc2sgcmVwcmVzZW50aW5nIHdoaWNoIGRpbWVuc2lvbnMgYXJlIGluIHVzZVxuICAgICAgTSA9IDgsIC8vIG51bWJlciBvZiBkaW1lbnNpb25zIHRoYXQgY2FuIGZpdCBpbiBgZmlsdGVyc2BcbiAgICAgIGZpbHRlcnMgPSBjcm9zc2ZpbHRlcl9hcnJheTgoMCksIC8vIE0gYml0cyBwZXIgcmVjb3JkOyAxIGlzIGZpbHRlcmVkIG91dFxuICAgICAgZmlsdGVyTGlzdGVuZXJzID0gW10sIC8vIHdoZW4gdGhlIGZpbHRlcnMgY2hhbmdlXG4gICAgICBkYXRhTGlzdGVuZXJzID0gW10sIC8vIHdoZW4gZGF0YSBpcyBhZGRlZFxuICAgICAgcmVtb3ZlRGF0YUxpc3RlbmVycyA9IFtdOyAvLyB3aGVuIGRhdGEgaXMgcmVtb3ZlZFxuXG4gIC8vIEFkZHMgdGhlIHNwZWNpZmllZCBuZXcgcmVjb3JkcyB0byB0aGlzIGNyb3NzZmlsdGVyLlxuICBmdW5jdGlvbiBhZGQobmV3RGF0YSkge1xuICAgIHZhciBuMCA9IG4sXG4gICAgICAgIG4xID0gbmV3RGF0YS5sZW5ndGg7XG5cbiAgICAvLyBJZiB0aGVyZSdzIGFjdHVhbGx5IG5ldyBkYXRhIHRvIGFkZOKAplxuICAgIC8vIE1lcmdlIHRoZSBuZXcgZGF0YSBpbnRvIHRoZSBleGlzdGluZyBkYXRhLlxuICAgIC8vIExlbmd0aGVuIHRoZSBmaWx0ZXIgYml0c2V0IHRvIGhhbmRsZSB0aGUgbmV3IHJlY29yZHMuXG4gICAgLy8gTm90aWZ5IGxpc3RlbmVycyAoZGltZW5zaW9ucyBhbmQgZ3JvdXBzKSB0aGF0IG5ldyBkYXRhIGlzIGF2YWlsYWJsZS5cbiAgICBpZiAobjEpIHtcbiAgICAgIGRhdGEgPSBkYXRhLmNvbmNhdChuZXdEYXRhKTtcbiAgICAgIGZpbHRlcnMgPSBjcm9zc2ZpbHRlcl9hcnJheUxlbmd0aGVuKGZpbHRlcnMsIG4gKz0gbjEpO1xuICAgICAgZGF0YUxpc3RlbmVycy5mb3JFYWNoKGZ1bmN0aW9uKGwpIHsgbChuZXdEYXRhLCBuMCwgbjEpOyB9KTtcbiAgICB9XG5cbiAgICByZXR1cm4gY3Jvc3NmaWx0ZXI7XG4gIH1cblxuICAvLyBSZW1vdmVzIGFsbCByZWNvcmRzIHRoYXQgbWF0Y2ggdGhlIGN1cnJlbnQgZmlsdGVycy5cbiAgZnVuY3Rpb24gcmVtb3ZlRGF0YSgpIHtcbiAgICB2YXIgbmV3SW5kZXggPSBjcm9zc2ZpbHRlcl9pbmRleChuLCBuKSxcbiAgICAgICAgcmVtb3ZlZCA9IFtdO1xuICAgIGZvciAodmFyIGkgPSAwLCBqID0gMDsgaSA8IG47ICsraSkge1xuICAgICAgaWYgKGZpbHRlcnNbaV0pIG5ld0luZGV4W2ldID0gaisrO1xuICAgICAgZWxzZSByZW1vdmVkLnB1c2goaSk7XG4gICAgfVxuXG4gICAgLy8gUmVtb3ZlIGFsbCBtYXRjaGluZyByZWNvcmRzIGZyb20gZ3JvdXBzLlxuICAgIGZpbHRlckxpc3RlbmVycy5mb3JFYWNoKGZ1bmN0aW9uKGwpIHsgbCgwLCBbXSwgcmVtb3ZlZCk7IH0pO1xuXG4gICAgLy8gVXBkYXRlIGluZGV4ZXMuXG4gICAgcmVtb3ZlRGF0YUxpc3RlbmVycy5mb3JFYWNoKGZ1bmN0aW9uKGwpIHsgbChuZXdJbmRleCk7IH0pO1xuXG4gICAgLy8gUmVtb3ZlIG9sZCBmaWx0ZXJzIGFuZCBkYXRhIGJ5IG92ZXJ3cml0aW5nLlxuICAgIGZvciAodmFyIGkgPSAwLCBqID0gMCwgazsgaSA8IG47ICsraSkge1xuICAgICAgaWYgKGsgPSBmaWx0ZXJzW2ldKSB7XG4gICAgICAgIGlmIChpICE9PSBqKSBmaWx0ZXJzW2pdID0gaywgZGF0YVtqXSA9IGRhdGFbaV07XG4gICAgICAgICsrajtcbiAgICAgIH1cbiAgICB9XG4gICAgZGF0YS5sZW5ndGggPSBqO1xuICAgIHdoaWxlIChuID4gaikgZmlsdGVyc1stLW5dID0gMDtcbiAgfVxuXG4gIC8vIEFkZHMgYSBuZXcgZGltZW5zaW9uIHdpdGggdGhlIHNwZWNpZmllZCB2YWx1ZSBhY2Nlc3NvciBmdW5jdGlvbi5cbiAgZnVuY3Rpb24gZGltZW5zaW9uKHZhbHVlKSB7XG4gICAgdmFyIGRpbWVuc2lvbiA9IHtcbiAgICAgIGZpbHRlcjogZmlsdGVyLFxuICAgICAgZmlsdGVyRXhhY3Q6IGZpbHRlckV4YWN0LFxuICAgICAgZmlsdGVyUmFuZ2U6IGZpbHRlclJhbmdlLFxuICAgICAgZmlsdGVyRnVuY3Rpb246IGZpbHRlckZ1bmN0aW9uLFxuICAgICAgZmlsdGVyQWxsOiBmaWx0ZXJBbGwsXG4gICAgICB0b3A6IHRvcCxcbiAgICAgIGJvdHRvbTogYm90dG9tLFxuICAgICAgZ3JvdXA6IGdyb3VwLFxuICAgICAgZ3JvdXBBbGw6IGdyb3VwQWxsLFxuICAgICAgZGlzcG9zZTogZGlzcG9zZSxcbiAgICAgIHJlbW92ZTogZGlzcG9zZSAvLyBmb3IgYmFja3dhcmRzLWNvbXBhdGliaWxpdHlcbiAgICB9O1xuXG4gICAgdmFyIG9uZSA9IH5tICYgLX5tLCAvLyBsb3dlc3QgdW5zZXQgYml0IGFzIG1hc2ssIGUuZy4sIDAwMDAxMDAwXG4gICAgICAgIHplcm8gPSB+b25lLCAvLyBpbnZlcnRlZCBvbmUsIGUuZy4sIDExMTEwMTExXG4gICAgICAgIHZhbHVlcywgLy8gc29ydGVkLCBjYWNoZWQgYXJyYXlcbiAgICAgICAgaW5kZXgsIC8vIHZhbHVlIHJhbmsg4oamIG9iamVjdCBpZFxuICAgICAgICBuZXdWYWx1ZXMsIC8vIHRlbXBvcmFyeSBhcnJheSBzdG9yaW5nIG5ld2x5LWFkZGVkIHZhbHVlc1xuICAgICAgICBuZXdJbmRleCwgLy8gdGVtcG9yYXJ5IGFycmF5IHN0b3JpbmcgbmV3bHktYWRkZWQgaW5kZXhcbiAgICAgICAgc29ydCA9IHF1aWNrc29ydF9ieShmdW5jdGlvbihpKSB7IHJldHVybiBuZXdWYWx1ZXNbaV07IH0pLFxuICAgICAgICByZWZpbHRlciA9IGNyb3NzZmlsdGVyX2ZpbHRlckFsbCwgLy8gZm9yIHJlY29tcHV0aW5nIGZpbHRlclxuICAgICAgICByZWZpbHRlckZ1bmN0aW9uLCAvLyB0aGUgY3VzdG9tIGZpbHRlciBmdW5jdGlvbiBpbiB1c2VcbiAgICAgICAgaW5kZXhMaXN0ZW5lcnMgPSBbXSwgLy8gd2hlbiBkYXRhIGlzIGFkZGVkXG4gICAgICAgIGRpbWVuc2lvbkdyb3VwcyA9IFtdLFxuICAgICAgICBsbzAgPSAwLFxuICAgICAgICBoaTAgPSAwO1xuXG4gICAgLy8gVXBkYXRpbmcgYSBkaW1lbnNpb24gaXMgYSB0d28tc3RhZ2UgcHJvY2Vzcy4gRmlyc3QsIHdlIG11c3QgdXBkYXRlIHRoZVxuICAgIC8vIGFzc29jaWF0ZWQgZmlsdGVycyBmb3IgdGhlIG5ld2x5LWFkZGVkIHJlY29yZHMuIE9uY2UgYWxsIGRpbWVuc2lvbnMgaGF2ZVxuICAgIC8vIHVwZGF0ZWQgdGhlaXIgZmlsdGVycywgdGhlIGdyb3VwcyBhcmUgbm90aWZpZWQgdG8gdXBkYXRlLlxuICAgIGRhdGFMaXN0ZW5lcnMudW5zaGlmdChwcmVBZGQpO1xuICAgIGRhdGFMaXN0ZW5lcnMucHVzaChwb3N0QWRkKTtcblxuICAgIHJlbW92ZURhdGFMaXN0ZW5lcnMucHVzaChyZW1vdmVEYXRhKTtcblxuICAgIC8vIEluY29ycG9yYXRlIGFueSBleGlzdGluZyBkYXRhIGludG8gdGhpcyBkaW1lbnNpb24sIGFuZCBtYWtlIHN1cmUgdGhhdCB0aGVcbiAgICAvLyBmaWx0ZXIgYml0c2V0IGlzIHdpZGUgZW5vdWdoIHRvIGhhbmRsZSB0aGUgbmV3IGRpbWVuc2lvbi5cbiAgICBtIHw9IG9uZTtcbiAgICBpZiAoTSA+PSAzMiA/ICFvbmUgOiBtICYgLSgxIDw8IE0pKSB7XG4gICAgICBmaWx0ZXJzID0gY3Jvc3NmaWx0ZXJfYXJyYXlXaWRlbihmaWx0ZXJzLCBNIDw8PSAxKTtcbiAgICB9XG4gICAgcHJlQWRkKGRhdGEsIDAsIG4pO1xuICAgIHBvc3RBZGQoZGF0YSwgMCwgbik7XG5cbiAgICAvLyBJbmNvcnBvcmF0ZXMgdGhlIHNwZWNpZmllZCBuZXcgcmVjb3JkcyBpbnRvIHRoaXMgZGltZW5zaW9uLlxuICAgIC8vIFRoaXMgZnVuY3Rpb24gaXMgcmVzcG9uc2libGUgZm9yIHVwZGF0aW5nIGZpbHRlcnMsIHZhbHVlcywgYW5kIGluZGV4LlxuICAgIGZ1bmN0aW9uIHByZUFkZChuZXdEYXRhLCBuMCwgbjEpIHtcblxuICAgICAgLy8gUGVybXV0ZSBuZXcgdmFsdWVzIGludG8gbmF0dXJhbCBvcmRlciB1c2luZyBhIHNvcnRlZCBpbmRleC5cbiAgICAgIG5ld1ZhbHVlcyA9IG5ld0RhdGEubWFwKHZhbHVlKTtcbiAgICAgIG5ld0luZGV4ID0gc29ydChjcm9zc2ZpbHRlcl9yYW5nZShuMSksIDAsIG4xKTtcbiAgICAgIG5ld1ZhbHVlcyA9IHBlcm11dGUobmV3VmFsdWVzLCBuZXdJbmRleCk7XG5cbiAgICAgIC8vIEJpc2VjdCBuZXdWYWx1ZXMgdG8gZGV0ZXJtaW5lIHdoaWNoIG5ldyByZWNvcmRzIGFyZSBzZWxlY3RlZC5cbiAgICAgIHZhciBib3VuZHMgPSByZWZpbHRlcihuZXdWYWx1ZXMpLCBsbzEgPSBib3VuZHNbMF0sIGhpMSA9IGJvdW5kc1sxXSwgaTtcbiAgICAgIGlmIChyZWZpbHRlckZ1bmN0aW9uKSB7XG4gICAgICAgIGZvciAoaSA9IDA7IGkgPCBuMTsgKytpKSB7XG4gICAgICAgICAgaWYgKCFyZWZpbHRlckZ1bmN0aW9uKG5ld1ZhbHVlc1tpXSwgaSkpIGZpbHRlcnNbbmV3SW5kZXhbaV0gKyBuMF0gfD0gb25lO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBmb3IgKGkgPSAwOyBpIDwgbG8xOyArK2kpIGZpbHRlcnNbbmV3SW5kZXhbaV0gKyBuMF0gfD0gb25lO1xuICAgICAgICBmb3IgKGkgPSBoaTE7IGkgPCBuMTsgKytpKSBmaWx0ZXJzW25ld0luZGV4W2ldICsgbjBdIHw9IG9uZTtcbiAgICAgIH1cblxuICAgICAgLy8gSWYgdGhpcyBkaW1lbnNpb24gcHJldmlvdXNseSBoYWQgbm8gZGF0YSwgdGhlbiB3ZSBkb24ndCBuZWVkIHRvIGRvIHRoZVxuICAgICAgLy8gbW9yZSBleHBlbnNpdmUgbWVyZ2Ugb3BlcmF0aW9uOyB1c2UgdGhlIG5ldyB2YWx1ZXMgYW5kIGluZGV4IGFzLWlzLlxuICAgICAgaWYgKCFuMCkge1xuICAgICAgICB2YWx1ZXMgPSBuZXdWYWx1ZXM7XG4gICAgICAgIGluZGV4ID0gbmV3SW5kZXg7XG4gICAgICAgIGxvMCA9IGxvMTtcbiAgICAgICAgaGkwID0gaGkxO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIHZhciBvbGRWYWx1ZXMgPSB2YWx1ZXMsXG4gICAgICAgICAgb2xkSW5kZXggPSBpbmRleCxcbiAgICAgICAgICBpMCA9IDAsXG4gICAgICAgICAgaTEgPSAwO1xuXG4gICAgICAvLyBPdGhlcndpc2UsIGNyZWF0ZSBuZXcgYXJyYXlzIGludG8gd2hpY2ggdG8gbWVyZ2UgbmV3IGFuZCBvbGQuXG4gICAgICB2YWx1ZXMgPSBuZXcgQXJyYXkobik7XG4gICAgICBpbmRleCA9IGNyb3NzZmlsdGVyX2luZGV4KG4sIG4pO1xuXG4gICAgICAvLyBNZXJnZSB0aGUgb2xkIGFuZCBuZXcgc29ydGVkIHZhbHVlcywgYW5kIG9sZCBhbmQgbmV3IGluZGV4LlxuICAgICAgZm9yIChpID0gMDsgaTAgPCBuMCAmJiBpMSA8IG4xOyArK2kpIHtcbiAgICAgICAgaWYgKG9sZFZhbHVlc1tpMF0gPCBuZXdWYWx1ZXNbaTFdKSB7XG4gICAgICAgICAgdmFsdWVzW2ldID0gb2xkVmFsdWVzW2kwXTtcbiAgICAgICAgICBpbmRleFtpXSA9IG9sZEluZGV4W2kwKytdO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHZhbHVlc1tpXSA9IG5ld1ZhbHVlc1tpMV07XG4gICAgICAgICAgaW5kZXhbaV0gPSBuZXdJbmRleFtpMSsrXSArIG4wO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIC8vIEFkZCBhbnkgcmVtYWluaW5nIG9sZCB2YWx1ZXMuXG4gICAgICBmb3IgKDsgaTAgPCBuMDsgKytpMCwgKytpKSB7XG4gICAgICAgIHZhbHVlc1tpXSA9IG9sZFZhbHVlc1tpMF07XG4gICAgICAgIGluZGV4W2ldID0gb2xkSW5kZXhbaTBdO1xuICAgICAgfVxuXG4gICAgICAvLyBBZGQgYW55IHJlbWFpbmluZyBuZXcgdmFsdWVzLlxuICAgICAgZm9yICg7IGkxIDwgbjE7ICsraTEsICsraSkge1xuICAgICAgICB2YWx1ZXNbaV0gPSBuZXdWYWx1ZXNbaTFdO1xuICAgICAgICBpbmRleFtpXSA9IG5ld0luZGV4W2kxXSArIG4wO1xuICAgICAgfVxuXG4gICAgICAvLyBCaXNlY3QgYWdhaW4gdG8gcmVjb21wdXRlIGxvMCBhbmQgaGkwLlxuICAgICAgYm91bmRzID0gcmVmaWx0ZXIodmFsdWVzKSwgbG8wID0gYm91bmRzWzBdLCBoaTAgPSBib3VuZHNbMV07XG4gICAgfVxuXG4gICAgLy8gV2hlbiBhbGwgZmlsdGVycyBoYXZlIHVwZGF0ZWQsIG5vdGlmeSBpbmRleCBsaXN0ZW5lcnMgb2YgdGhlIG5ldyB2YWx1ZXMuXG4gICAgZnVuY3Rpb24gcG9zdEFkZChuZXdEYXRhLCBuMCwgbjEpIHtcbiAgICAgIGluZGV4TGlzdGVuZXJzLmZvckVhY2goZnVuY3Rpb24obCkgeyBsKG5ld1ZhbHVlcywgbmV3SW5kZXgsIG4wLCBuMSk7IH0pO1xuICAgICAgbmV3VmFsdWVzID0gbmV3SW5kZXggPSBudWxsO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHJlbW92ZURhdGEocmVJbmRleCkge1xuICAgICAgZm9yICh2YXIgaSA9IDAsIGogPSAwLCBrOyBpIDwgbjsgKytpKSB7XG4gICAgICAgIGlmIChmaWx0ZXJzW2sgPSBpbmRleFtpXV0pIHtcbiAgICAgICAgICBpZiAoaSAhPT0gaikgdmFsdWVzW2pdID0gdmFsdWVzW2ldO1xuICAgICAgICAgIGluZGV4W2pdID0gcmVJbmRleFtrXTtcbiAgICAgICAgICArK2o7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHZhbHVlcy5sZW5ndGggPSBqO1xuICAgICAgd2hpbGUgKGogPCBuKSBpbmRleFtqKytdID0gMDtcblxuICAgICAgLy8gQmlzZWN0IGFnYWluIHRvIHJlY29tcHV0ZSBsbzAgYW5kIGhpMC5cbiAgICAgIHZhciBib3VuZHMgPSByZWZpbHRlcih2YWx1ZXMpO1xuICAgICAgbG8wID0gYm91bmRzWzBdLCBoaTAgPSBib3VuZHNbMV07XG4gICAgfVxuXG4gICAgLy8gVXBkYXRlcyB0aGUgc2VsZWN0ZWQgdmFsdWVzIGJhc2VkIG9uIHRoZSBzcGVjaWZpZWQgYm91bmRzIFtsbywgaGldLlxuICAgIC8vIFRoaXMgaW1wbGVtZW50YXRpb24gaXMgdXNlZCBieSBhbGwgdGhlIHB1YmxpYyBmaWx0ZXIgbWV0aG9kcy5cbiAgICBmdW5jdGlvbiBmaWx0ZXJJbmRleEJvdW5kcyhib3VuZHMpIHtcbiAgICAgIHZhciBsbzEgPSBib3VuZHNbMF0sXG4gICAgICAgICAgaGkxID0gYm91bmRzWzFdO1xuXG4gICAgICBpZiAocmVmaWx0ZXJGdW5jdGlvbikge1xuICAgICAgICByZWZpbHRlckZ1bmN0aW9uID0gbnVsbDtcbiAgICAgICAgZmlsdGVySW5kZXhGdW5jdGlvbihmdW5jdGlvbihkLCBpKSB7IHJldHVybiBsbzEgPD0gaSAmJiBpIDwgaGkxOyB9KTtcbiAgICAgICAgbG8wID0gbG8xO1xuICAgICAgICBoaTAgPSBoaTE7XG4gICAgICAgIHJldHVybiBkaW1lbnNpb247XG4gICAgICB9XG5cbiAgICAgIHZhciBpLFxuICAgICAgICAgIGosXG4gICAgICAgICAgayxcbiAgICAgICAgICBhZGRlZCA9IFtdLFxuICAgICAgICAgIHJlbW92ZWQgPSBbXTtcblxuICAgICAgLy8gRmFzdCBpbmNyZW1lbnRhbCB1cGRhdGUgYmFzZWQgb24gcHJldmlvdXMgbG8gaW5kZXguXG4gICAgICBpZiAobG8xIDwgbG8wKSB7XG4gICAgICAgIGZvciAoaSA9IGxvMSwgaiA9IE1hdGgubWluKGxvMCwgaGkxKTsgaSA8IGo7ICsraSkge1xuICAgICAgICAgIGZpbHRlcnNbayA9IGluZGV4W2ldXSBePSBvbmU7XG4gICAgICAgICAgYWRkZWQucHVzaChrKTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIGlmIChsbzEgPiBsbzApIHtcbiAgICAgICAgZm9yIChpID0gbG8wLCBqID0gTWF0aC5taW4obG8xLCBoaTApOyBpIDwgajsgKytpKSB7XG4gICAgICAgICAgZmlsdGVyc1trID0gaW5kZXhbaV1dIF49IG9uZTtcbiAgICAgICAgICByZW1vdmVkLnB1c2goayk7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgLy8gRmFzdCBpbmNyZW1lbnRhbCB1cGRhdGUgYmFzZWQgb24gcHJldmlvdXMgaGkgaW5kZXguXG4gICAgICBpZiAoaGkxID4gaGkwKSB7XG4gICAgICAgIGZvciAoaSA9IE1hdGgubWF4KGxvMSwgaGkwKSwgaiA9IGhpMTsgaSA8IGo7ICsraSkge1xuICAgICAgICAgIGZpbHRlcnNbayA9IGluZGV4W2ldXSBePSBvbmU7XG4gICAgICAgICAgYWRkZWQucHVzaChrKTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIGlmIChoaTEgPCBoaTApIHtcbiAgICAgICAgZm9yIChpID0gTWF0aC5tYXgobG8wLCBoaTEpLCBqID0gaGkwOyBpIDwgajsgKytpKSB7XG4gICAgICAgICAgZmlsdGVyc1trID0gaW5kZXhbaV1dIF49IG9uZTtcbiAgICAgICAgICByZW1vdmVkLnB1c2goayk7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgbG8wID0gbG8xO1xuICAgICAgaGkwID0gaGkxO1xuICAgICAgZmlsdGVyTGlzdGVuZXJzLmZvckVhY2goZnVuY3Rpb24obCkgeyBsKG9uZSwgYWRkZWQsIHJlbW92ZWQpOyB9KTtcbiAgICAgIHJldHVybiBkaW1lbnNpb247XG4gICAgfVxuXG4gICAgLy8gRmlsdGVycyB0aGlzIGRpbWVuc2lvbiB1c2luZyB0aGUgc3BlY2lmaWVkIHJhbmdlLCB2YWx1ZSwgb3IgbnVsbC5cbiAgICAvLyBJZiB0aGUgcmFuZ2UgaXMgbnVsbCwgdGhpcyBpcyBlcXVpdmFsZW50IHRvIGZpbHRlckFsbC5cbiAgICAvLyBJZiB0aGUgcmFuZ2UgaXMgYW4gYXJyYXksIHRoaXMgaXMgZXF1aXZhbGVudCB0byBmaWx0ZXJSYW5nZS5cbiAgICAvLyBPdGhlcndpc2UsIHRoaXMgaXMgZXF1aXZhbGVudCB0byBmaWx0ZXJFeGFjdC5cbiAgICBmdW5jdGlvbiBmaWx0ZXIocmFuZ2UpIHtcbiAgICAgIHJldHVybiByYW5nZSA9PSBudWxsXG4gICAgICAgICAgPyBmaWx0ZXJBbGwoKSA6IEFycmF5LmlzQXJyYXkocmFuZ2UpXG4gICAgICAgICAgPyBmaWx0ZXJSYW5nZShyYW5nZSkgOiB0eXBlb2YgcmFuZ2UgPT09IFwiZnVuY3Rpb25cIlxuICAgICAgICAgID8gZmlsdGVyRnVuY3Rpb24ocmFuZ2UpXG4gICAgICAgICAgOiBmaWx0ZXJFeGFjdChyYW5nZSk7XG4gICAgfVxuXG4gICAgLy8gRmlsdGVycyB0aGlzIGRpbWVuc2lvbiB0byBzZWxlY3QgdGhlIGV4YWN0IHZhbHVlLlxuICAgIGZ1bmN0aW9uIGZpbHRlckV4YWN0KHZhbHVlKSB7XG4gICAgICByZXR1cm4gZmlsdGVySW5kZXhCb3VuZHMoKHJlZmlsdGVyID0gY3Jvc3NmaWx0ZXJfZmlsdGVyRXhhY3QoYmlzZWN0LCB2YWx1ZSkpKHZhbHVlcykpO1xuICAgIH1cblxuICAgIC8vIEZpbHRlcnMgdGhpcyBkaW1lbnNpb24gdG8gc2VsZWN0IHRoZSBzcGVjaWZpZWQgcmFuZ2UgW2xvLCBoaV0uXG4gICAgLy8gVGhlIGxvd2VyIGJvdW5kIGlzIGluY2x1c2l2ZSwgYW5kIHRoZSB1cHBlciBib3VuZCBpcyBleGNsdXNpdmUuXG4gICAgZnVuY3Rpb24gZmlsdGVyUmFuZ2UocmFuZ2UpIHtcbiAgICAgIHJldHVybiBmaWx0ZXJJbmRleEJvdW5kcygocmVmaWx0ZXIgPSBjcm9zc2ZpbHRlcl9maWx0ZXJSYW5nZShiaXNlY3QsIHJhbmdlKSkodmFsdWVzKSk7XG4gICAgfVxuXG4gICAgLy8gQ2xlYXJzIGFueSBmaWx0ZXJzIG9uIHRoaXMgZGltZW5zaW9uLlxuICAgIGZ1bmN0aW9uIGZpbHRlckFsbCgpIHtcbiAgICAgIHJldHVybiBmaWx0ZXJJbmRleEJvdW5kcygocmVmaWx0ZXIgPSBjcm9zc2ZpbHRlcl9maWx0ZXJBbGwpKHZhbHVlcykpO1xuICAgIH1cblxuICAgIC8vIEZpbHRlcnMgdGhpcyBkaW1lbnNpb24gdXNpbmcgYW4gYXJiaXRyYXJ5IGZ1bmN0aW9uLlxuICAgIGZ1bmN0aW9uIGZpbHRlckZ1bmN0aW9uKGYpIHtcbiAgICAgIHJlZmlsdGVyID0gY3Jvc3NmaWx0ZXJfZmlsdGVyQWxsO1xuXG4gICAgICBmaWx0ZXJJbmRleEZ1bmN0aW9uKHJlZmlsdGVyRnVuY3Rpb24gPSBmKTtcblxuICAgICAgbG8wID0gMDtcbiAgICAgIGhpMCA9IG47XG5cbiAgICAgIHJldHVybiBkaW1lbnNpb247XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZmlsdGVySW5kZXhGdW5jdGlvbihmKSB7XG4gICAgICB2YXIgaSxcbiAgICAgICAgICBrLFxuICAgICAgICAgIHgsXG4gICAgICAgICAgYWRkZWQgPSBbXSxcbiAgICAgICAgICByZW1vdmVkID0gW107XG5cbiAgICAgIGZvciAoaSA9IDA7IGkgPCBuOyArK2kpIHtcbiAgICAgICAgaWYgKCEoZmlsdGVyc1trID0gaW5kZXhbaV1dICYgb25lKSBeICEhKHggPSBmKHZhbHVlc1tpXSwgaSkpKSB7XG4gICAgICAgICAgaWYgKHgpIGZpbHRlcnNba10gJj0gemVybywgYWRkZWQucHVzaChrKTtcbiAgICAgICAgICBlbHNlIGZpbHRlcnNba10gfD0gb25lLCByZW1vdmVkLnB1c2goayk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGZpbHRlckxpc3RlbmVycy5mb3JFYWNoKGZ1bmN0aW9uKGwpIHsgbChvbmUsIGFkZGVkLCByZW1vdmVkKTsgfSk7XG4gICAgfVxuXG4gICAgLy8gUmV0dXJucyB0aGUgdG9wIEsgc2VsZWN0ZWQgcmVjb3JkcyBiYXNlZCBvbiB0aGlzIGRpbWVuc2lvbidzIG9yZGVyLlxuICAgIC8vIE5vdGU6IG9ic2VydmVzIHRoaXMgZGltZW5zaW9uJ3MgZmlsdGVyLCB1bmxpa2UgZ3JvdXAgYW5kIGdyb3VwQWxsLlxuICAgIGZ1bmN0aW9uIHRvcChrKSB7XG4gICAgICB2YXIgYXJyYXkgPSBbXSxcbiAgICAgICAgICBpID0gaGkwLFxuICAgICAgICAgIGo7XG5cbiAgICAgIHdoaWxlICgtLWkgPj0gbG8wICYmIGsgPiAwKSB7XG4gICAgICAgIGlmICghZmlsdGVyc1tqID0gaW5kZXhbaV1dKSB7XG4gICAgICAgICAgYXJyYXkucHVzaChkYXRhW2pdKTtcbiAgICAgICAgICAtLWs7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgcmV0dXJuIGFycmF5O1xuICAgIH1cblxuICAgIC8vIFJldHVybnMgdGhlIGJvdHRvbSBLIHNlbGVjdGVkIHJlY29yZHMgYmFzZWQgb24gdGhpcyBkaW1lbnNpb24ncyBvcmRlci5cbiAgICAvLyBOb3RlOiBvYnNlcnZlcyB0aGlzIGRpbWVuc2lvbidzIGZpbHRlciwgdW5saWtlIGdyb3VwIGFuZCBncm91cEFsbC5cbiAgICBmdW5jdGlvbiBib3R0b20oaykge1xuICAgICAgdmFyIGFycmF5ID0gW10sXG4gICAgICAgICAgaSA9IGxvMCxcbiAgICAgICAgICBqO1xuXG4gICAgICB3aGlsZSAoaSA8IGhpMCAmJiBrID4gMCkge1xuICAgICAgICBpZiAoIWZpbHRlcnNbaiA9IGluZGV4W2ldXSkge1xuICAgICAgICAgIGFycmF5LnB1c2goZGF0YVtqXSk7XG4gICAgICAgICAgLS1rO1xuICAgICAgICB9XG4gICAgICAgIGkrKztcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIGFycmF5O1xuICAgIH1cblxuICAgIC8vIEFkZHMgYSBuZXcgZ3JvdXAgdG8gdGhpcyBkaW1lbnNpb24sIHVzaW5nIHRoZSBzcGVjaWZpZWQga2V5IGZ1bmN0aW9uLlxuICAgIGZ1bmN0aW9uIGdyb3VwKGtleSkge1xuICAgICAgdmFyIGdyb3VwID0ge1xuICAgICAgICB0b3A6IHRvcCxcbiAgICAgICAgYWxsOiBhbGwsXG4gICAgICAgIHJlZHVjZTogcmVkdWNlLFxuICAgICAgICByZWR1Y2VDb3VudDogcmVkdWNlQ291bnQsXG4gICAgICAgIHJlZHVjZVN1bTogcmVkdWNlU3VtLFxuICAgICAgICBvcmRlcjogb3JkZXIsXG4gICAgICAgIG9yZGVyTmF0dXJhbDogb3JkZXJOYXR1cmFsLFxuICAgICAgICBzaXplOiBzaXplLFxuICAgICAgICBkaXNwb3NlOiBkaXNwb3NlLFxuICAgICAgICByZW1vdmU6IGRpc3Bvc2UgLy8gZm9yIGJhY2t3YXJkcy1jb21wYXRpYmlsaXR5XG4gICAgICB9O1xuXG4gICAgICAvLyBFbnN1cmUgdGhhdCB0aGlzIGdyb3VwIHdpbGwgYmUgcmVtb3ZlZCB3aGVuIHRoZSBkaW1lbnNpb24gaXMgcmVtb3ZlZC5cbiAgICAgIGRpbWVuc2lvbkdyb3Vwcy5wdXNoKGdyb3VwKTtcblxuICAgICAgdmFyIGdyb3VwcywgLy8gYXJyYXkgb2Yge2tleSwgdmFsdWV9XG4gICAgICAgICAgZ3JvdXBJbmRleCwgLy8gb2JqZWN0IGlkIOKGpiBncm91cCBpZFxuICAgICAgICAgIGdyb3VwV2lkdGggPSA4LFxuICAgICAgICAgIGdyb3VwQ2FwYWNpdHkgPSBjcm9zc2ZpbHRlcl9jYXBhY2l0eShncm91cFdpZHRoKSxcbiAgICAgICAgICBrID0gMCwgLy8gY2FyZGluYWxpdHlcbiAgICAgICAgICBzZWxlY3QsXG4gICAgICAgICAgaGVhcCxcbiAgICAgICAgICByZWR1Y2VBZGQsXG4gICAgICAgICAgcmVkdWNlUmVtb3ZlLFxuICAgICAgICAgIHJlZHVjZUluaXRpYWwsXG4gICAgICAgICAgdXBkYXRlID0gY3Jvc3NmaWx0ZXJfbnVsbCxcbiAgICAgICAgICByZXNldCA9IGNyb3NzZmlsdGVyX251bGwsXG4gICAgICAgICAgcmVzZXROZWVkZWQgPSB0cnVlLFxuICAgICAgICAgIGdyb3VwQWxsID0ga2V5ID09PSBjcm9zc2ZpbHRlcl9udWxsO1xuXG4gICAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA8IDEpIGtleSA9IGNyb3NzZmlsdGVyX2lkZW50aXR5O1xuXG4gICAgICAvLyBUaGUgZ3JvdXAgbGlzdGVucyB0byB0aGUgY3Jvc3NmaWx0ZXIgZm9yIHdoZW4gYW55IGRpbWVuc2lvbiBjaGFuZ2VzLCBzb1xuICAgICAgLy8gdGhhdCBpdCBjYW4gdXBkYXRlIHRoZSBhc3NvY2lhdGVkIHJlZHVjZSB2YWx1ZXMuIEl0IG11c3QgYWxzbyBsaXN0ZW4gdG9cbiAgICAgIC8vIHRoZSBwYXJlbnQgZGltZW5zaW9uIGZvciB3aGVuIGRhdGEgaXMgYWRkZWQsIGFuZCBjb21wdXRlIG5ldyBrZXlzLlxuICAgICAgZmlsdGVyTGlzdGVuZXJzLnB1c2godXBkYXRlKTtcbiAgICAgIGluZGV4TGlzdGVuZXJzLnB1c2goYWRkKTtcbiAgICAgIHJlbW92ZURhdGFMaXN0ZW5lcnMucHVzaChyZW1vdmVEYXRhKTtcblxuICAgICAgLy8gSW5jb3Jwb3JhdGUgYW55IGV4aXN0aW5nIGRhdGEgaW50byB0aGUgZ3JvdXBpbmcuXG4gICAgICBhZGQodmFsdWVzLCBpbmRleCwgMCwgbik7XG5cbiAgICAgIC8vIEluY29ycG9yYXRlcyB0aGUgc3BlY2lmaWVkIG5ldyB2YWx1ZXMgaW50byB0aGlzIGdyb3VwLlxuICAgICAgLy8gVGhpcyBmdW5jdGlvbiBpcyByZXNwb25zaWJsZSBmb3IgdXBkYXRpbmcgZ3JvdXBzIGFuZCBncm91cEluZGV4LlxuICAgICAgZnVuY3Rpb24gYWRkKG5ld1ZhbHVlcywgbmV3SW5kZXgsIG4wLCBuMSkge1xuICAgICAgICB2YXIgb2xkR3JvdXBzID0gZ3JvdXBzLFxuICAgICAgICAgICAgcmVJbmRleCA9IGNyb3NzZmlsdGVyX2luZGV4KGssIGdyb3VwQ2FwYWNpdHkpLFxuICAgICAgICAgICAgYWRkID0gcmVkdWNlQWRkLFxuICAgICAgICAgICAgaW5pdGlhbCA9IHJlZHVjZUluaXRpYWwsXG4gICAgICAgICAgICBrMCA9IGssIC8vIG9sZCBjYXJkaW5hbGl0eVxuICAgICAgICAgICAgaTAgPSAwLCAvLyBpbmRleCBvZiBvbGQgZ3JvdXBcbiAgICAgICAgICAgIGkxID0gMCwgLy8gaW5kZXggb2YgbmV3IHJlY29yZFxuICAgICAgICAgICAgaiwgLy8gb2JqZWN0IGlkXG4gICAgICAgICAgICBnMCwgLy8gb2xkIGdyb3VwXG4gICAgICAgICAgICB4MCwgLy8gb2xkIGtleVxuICAgICAgICAgICAgeDEsIC8vIG5ldyBrZXlcbiAgICAgICAgICAgIGcsIC8vIGdyb3VwIHRvIGFkZFxuICAgICAgICAgICAgeDsgLy8ga2V5IG9mIGdyb3VwIHRvIGFkZFxuXG4gICAgICAgIC8vIElmIGEgcmVzZXQgaXMgbmVlZGVkLCB3ZSBkb24ndCBuZWVkIHRvIHVwZGF0ZSB0aGUgcmVkdWNlIHZhbHVlcy5cbiAgICAgICAgaWYgKHJlc2V0TmVlZGVkKSBhZGQgPSBpbml0aWFsID0gY3Jvc3NmaWx0ZXJfbnVsbDtcblxuICAgICAgICAvLyBSZXNldCB0aGUgbmV3IGdyb3VwcyAoayBpcyBhIGxvd2VyIGJvdW5kKS5cbiAgICAgICAgLy8gQWxzbywgbWFrZSBzdXJlIHRoYXQgZ3JvdXBJbmRleCBleGlzdHMgYW5kIGlzIGxvbmcgZW5vdWdoLlxuICAgICAgICBncm91cHMgPSBuZXcgQXJyYXkoayksIGsgPSAwO1xuICAgICAgICBncm91cEluZGV4ID0gazAgPiAxID8gY3Jvc3NmaWx0ZXJfYXJyYXlMZW5ndGhlbihncm91cEluZGV4LCBuKSA6IGNyb3NzZmlsdGVyX2luZGV4KG4sIGdyb3VwQ2FwYWNpdHkpO1xuXG4gICAgICAgIC8vIEdldCB0aGUgZmlyc3Qgb2xkIGtleSAoeDAgb2YgZzApLCBpZiBpdCBleGlzdHMuXG4gICAgICAgIGlmIChrMCkgeDAgPSAoZzAgPSBvbGRHcm91cHNbMF0pLmtleTtcblxuICAgICAgICAvLyBGaW5kIHRoZSBmaXJzdCBuZXcga2V5ICh4MSksIHNraXBwaW5nIE5hTiBrZXlzLlxuICAgICAgICB3aGlsZSAoaTEgPCBuMSAmJiAhKCh4MSA9IGtleShuZXdWYWx1ZXNbaTFdKSkgPj0geDEpKSArK2kxO1xuXG4gICAgICAgIC8vIFdoaWxlIG5ldyBrZXlzIHJlbWFpbuKAplxuICAgICAgICB3aGlsZSAoaTEgPCBuMSkge1xuXG4gICAgICAgICAgLy8gRGV0ZXJtaW5lIHRoZSBsZXNzZXIgb2YgdGhlIHR3byBjdXJyZW50IGtleXM7IG5ldyBhbmQgb2xkLlxuICAgICAgICAgIC8vIElmIHRoZXJlIGFyZSBubyBvbGQga2V5cyByZW1haW5pbmcsIHRoZW4gYWx3YXlzIGFkZCB0aGUgbmV3IGtleS5cbiAgICAgICAgICBpZiAoZzAgJiYgeDAgPD0geDEpIHtcbiAgICAgICAgICAgIGcgPSBnMCwgeCA9IHgwO1xuXG4gICAgICAgICAgICAvLyBSZWNvcmQgdGhlIG5ldyBpbmRleCBvZiB0aGUgb2xkIGdyb3VwLlxuICAgICAgICAgICAgcmVJbmRleFtpMF0gPSBrO1xuXG4gICAgICAgICAgICAvLyBSZXRyaWV2ZSB0aGUgbmV4dCBvbGQga2V5LlxuICAgICAgICAgICAgaWYgKGcwID0gb2xkR3JvdXBzWysraTBdKSB4MCA9IGcwLmtleTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgZyA9IHtrZXk6IHgxLCB2YWx1ZTogaW5pdGlhbCgpfSwgeCA9IHgxO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIC8vIEFkZCB0aGUgbGVzc2VyIGdyb3VwLlxuICAgICAgICAgIGdyb3Vwc1trXSA9IGc7XG5cbiAgICAgICAgICAvLyBBZGQgYW55IHNlbGVjdGVkIHJlY29yZHMgYmVsb25naW5nIHRvIHRoZSBhZGRlZCBncm91cCwgd2hpbGVcbiAgICAgICAgICAvLyBhZHZhbmNpbmcgdGhlIG5ldyBrZXkgYW5kIHBvcHVsYXRpbmcgdGhlIGFzc29jaWF0ZWQgZ3JvdXAgaW5kZXguXG4gICAgICAgICAgd2hpbGUgKCEoeDEgPiB4KSkge1xuICAgICAgICAgICAgZ3JvdXBJbmRleFtqID0gbmV3SW5kZXhbaTFdICsgbjBdID0gaztcbiAgICAgICAgICAgIGlmICghKGZpbHRlcnNbal0gJiB6ZXJvKSkgZy52YWx1ZSA9IGFkZChnLnZhbHVlLCBkYXRhW2pdKTtcbiAgICAgICAgICAgIGlmICgrK2kxID49IG4xKSBicmVhaztcbiAgICAgICAgICAgIHgxID0ga2V5KG5ld1ZhbHVlc1tpMV0pO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGdyb3VwSW5jcmVtZW50KCk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBBZGQgYW55IHJlbWFpbmluZyBvbGQgZ3JvdXBzIHRoYXQgd2VyZSBncmVhdGVyIHRoYW4gYWxsIG5ldyBrZXlzLlxuICAgICAgICAvLyBObyBpbmNyZW1lbnRhbCByZWR1Y2UgaXMgbmVlZGVkOyB0aGVzZSBncm91cHMgaGF2ZSBubyBuZXcgcmVjb3Jkcy5cbiAgICAgICAgLy8gQWxzbyByZWNvcmQgdGhlIG5ldyBpbmRleCBvZiB0aGUgb2xkIGdyb3VwLlxuICAgICAgICB3aGlsZSAoaTAgPCBrMCkge1xuICAgICAgICAgIGdyb3Vwc1tyZUluZGV4W2kwXSA9IGtdID0gb2xkR3JvdXBzW2kwKytdO1xuICAgICAgICAgIGdyb3VwSW5jcmVtZW50KCk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBJZiB3ZSBhZGRlZCBhbnkgbmV3IGdyb3VwcyBiZWZvcmUgYW55IG9sZCBncm91cHMsXG4gICAgICAgIC8vIHVwZGF0ZSB0aGUgZ3JvdXAgaW5kZXggb2YgYWxsIHRoZSBvbGQgcmVjb3Jkcy5cbiAgICAgICAgaWYgKGsgPiBpMCkgZm9yIChpMCA9IDA7IGkwIDwgbjA7ICsraTApIHtcbiAgICAgICAgICBncm91cEluZGV4W2kwXSA9IHJlSW5kZXhbZ3JvdXBJbmRleFtpMF1dO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gTW9kaWZ5IHRoZSB1cGRhdGUgYW5kIHJlc2V0IGJlaGF2aW9yIGJhc2VkIG9uIHRoZSBjYXJkaW5hbGl0eS5cbiAgICAgICAgLy8gSWYgdGhlIGNhcmRpbmFsaXR5IGlzIGxlc3MgdGhhbiBvciBlcXVhbCB0byBvbmUsIHRoZW4gdGhlIGdyb3VwSW5kZXhcbiAgICAgICAgLy8gaXMgbm90IG5lZWRlZC4gSWYgdGhlIGNhcmRpbmFsaXR5IGlzIHplcm8sIHRoZW4gdGhlcmUgYXJlIG5vIHJlY29yZHNcbiAgICAgICAgLy8gYW5kIHRoZXJlZm9yZSBubyBncm91cHMgdG8gdXBkYXRlIG9yIHJlc2V0LiBOb3RlIHRoYXQgd2UgYWxzbyBtdXN0XG4gICAgICAgIC8vIGNoYW5nZSB0aGUgcmVnaXN0ZXJlZCBsaXN0ZW5lciB0byBwb2ludCB0byB0aGUgbmV3IG1ldGhvZC5cbiAgICAgICAgaiA9IGZpbHRlckxpc3RlbmVycy5pbmRleE9mKHVwZGF0ZSk7XG4gICAgICAgIGlmIChrID4gMSkge1xuICAgICAgICAgIHVwZGF0ZSA9IHVwZGF0ZU1hbnk7XG4gICAgICAgICAgcmVzZXQgPSByZXNldE1hbnk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgaWYgKCFrICYmIGdyb3VwQWxsKSB7XG4gICAgICAgICAgICBrID0gMTtcbiAgICAgICAgICAgIGdyb3VwcyA9IFt7a2V5OiBudWxsLCB2YWx1ZTogaW5pdGlhbCgpfV07XG4gICAgICAgICAgfVxuICAgICAgICAgIGlmIChrID09PSAxKSB7XG4gICAgICAgICAgICB1cGRhdGUgPSB1cGRhdGVPbmU7XG4gICAgICAgICAgICByZXNldCA9IHJlc2V0T25lO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB1cGRhdGUgPSBjcm9zc2ZpbHRlcl9udWxsO1xuICAgICAgICAgICAgcmVzZXQgPSBjcm9zc2ZpbHRlcl9udWxsO1xuICAgICAgICAgIH1cbiAgICAgICAgICBncm91cEluZGV4ID0gbnVsbDtcbiAgICAgICAgfVxuICAgICAgICBmaWx0ZXJMaXN0ZW5lcnNbal0gPSB1cGRhdGU7XG5cbiAgICAgICAgLy8gQ291bnQgdGhlIG51bWJlciBvZiBhZGRlZCBncm91cHMsXG4gICAgICAgIC8vIGFuZCB3aWRlbiB0aGUgZ3JvdXAgaW5kZXggYXMgbmVlZGVkLlxuICAgICAgICBmdW5jdGlvbiBncm91cEluY3JlbWVudCgpIHtcbiAgICAgICAgICBpZiAoKytrID09PSBncm91cENhcGFjaXR5KSB7XG4gICAgICAgICAgICByZUluZGV4ID0gY3Jvc3NmaWx0ZXJfYXJyYXlXaWRlbihyZUluZGV4LCBncm91cFdpZHRoIDw8PSAxKTtcbiAgICAgICAgICAgIGdyb3VwSW5kZXggPSBjcm9zc2ZpbHRlcl9hcnJheVdpZGVuKGdyb3VwSW5kZXgsIGdyb3VwV2lkdGgpO1xuICAgICAgICAgICAgZ3JvdXBDYXBhY2l0eSA9IGNyb3NzZmlsdGVyX2NhcGFjaXR5KGdyb3VwV2lkdGgpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBmdW5jdGlvbiByZW1vdmVEYXRhKCkge1xuICAgICAgICBpZiAoayA+IDEpIHtcbiAgICAgICAgICB2YXIgb2xkSyA9IGssXG4gICAgICAgICAgICAgIG9sZEdyb3VwcyA9IGdyb3VwcyxcbiAgICAgICAgICAgICAgc2Vlbkdyb3VwcyA9IGNyb3NzZmlsdGVyX2luZGV4KG9sZEssIG9sZEspO1xuXG4gICAgICAgICAgLy8gRmlsdGVyIG91dCBub24tbWF0Y2hlcyBieSBjb3B5aW5nIG1hdGNoaW5nIGdyb3VwIGluZGV4IGVudHJpZXMgdG9cbiAgICAgICAgICAvLyB0aGUgYmVnaW5uaW5nIG9mIHRoZSBhcnJheS5cbiAgICAgICAgICBmb3IgKHZhciBpID0gMCwgaiA9IDA7IGkgPCBuOyArK2kpIHtcbiAgICAgICAgICAgIGlmIChmaWx0ZXJzW2ldKSB7XG4gICAgICAgICAgICAgIHNlZW5Hcm91cHNbZ3JvdXBJbmRleFtqXSA9IGdyb3VwSW5kZXhbaV1dID0gMTtcbiAgICAgICAgICAgICAgKytqO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cblxuICAgICAgICAgIC8vIFJlYXNzZW1ibGUgZ3JvdXBzIGluY2x1ZGluZyBvbmx5IHRob3NlIGdyb3VwcyB0aGF0IHdlcmUgcmVmZXJyZWRcbiAgICAgICAgICAvLyB0byBieSBtYXRjaGluZyBncm91cCBpbmRleCBlbnRyaWVzLiAgTm90ZSB0aGUgbmV3IGdyb3VwIGluZGV4IGluXG4gICAgICAgICAgLy8gc2Vlbkdyb3Vwcy5cbiAgICAgICAgICBncm91cHMgPSBbXSwgayA9IDA7XG4gICAgICAgICAgZm9yIChpID0gMDsgaSA8IG9sZEs7ICsraSkge1xuICAgICAgICAgICAgaWYgKHNlZW5Hcm91cHNbaV0pIHtcbiAgICAgICAgICAgICAgc2Vlbkdyb3Vwc1tpXSA9IGsrKztcbiAgICAgICAgICAgICAgZ3JvdXBzLnB1c2gob2xkR3JvdXBzW2ldKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG5cbiAgICAgICAgICBpZiAoayA+IDEpIHtcbiAgICAgICAgICAgIC8vIFJlaW5kZXggdGhlIGdyb3VwIGluZGV4IHVzaW5nIHNlZW5Hcm91cHMgdG8gZmluZCB0aGUgbmV3IGluZGV4LlxuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBqOyArK2kpIGdyb3VwSW5kZXhbaV0gPSBzZWVuR3JvdXBzW2dyb3VwSW5kZXhbaV1dO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBncm91cEluZGV4ID0gbnVsbDtcbiAgICAgICAgICB9XG4gICAgICAgICAgZmlsdGVyTGlzdGVuZXJzW2ZpbHRlckxpc3RlbmVycy5pbmRleE9mKHVwZGF0ZSldID0gayA+IDFcbiAgICAgICAgICAgICAgPyAocmVzZXQgPSByZXNldE1hbnksIHVwZGF0ZSA9IHVwZGF0ZU1hbnkpXG4gICAgICAgICAgICAgIDogayA9PT0gMSA/IChyZXNldCA9IHJlc2V0T25lLCB1cGRhdGUgPSB1cGRhdGVPbmUpXG4gICAgICAgICAgICAgIDogcmVzZXQgPSB1cGRhdGUgPSBjcm9zc2ZpbHRlcl9udWxsO1xuICAgICAgICB9IGVsc2UgaWYgKGsgPT09IDEpIHtcbiAgICAgICAgICBpZiAoZ3JvdXBBbGwpIHJldHVybjtcbiAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IG47ICsraSkgaWYgKGZpbHRlcnNbaV0pIHJldHVybjtcbiAgICAgICAgICBncm91cHMgPSBbXSwgayA9IDA7XG4gICAgICAgICAgZmlsdGVyTGlzdGVuZXJzW2ZpbHRlckxpc3RlbmVycy5pbmRleE9mKHVwZGF0ZSldID1cbiAgICAgICAgICB1cGRhdGUgPSByZXNldCA9IGNyb3NzZmlsdGVyX251bGw7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgLy8gUmVkdWNlcyB0aGUgc3BlY2lmaWVkIHNlbGVjdGVkIG9yIGRlc2VsZWN0ZWQgcmVjb3Jkcy5cbiAgICAgIC8vIFRoaXMgZnVuY3Rpb24gaXMgb25seSB1c2VkIHdoZW4gdGhlIGNhcmRpbmFsaXR5IGlzIGdyZWF0ZXIgdGhhbiAxLlxuICAgICAgZnVuY3Rpb24gdXBkYXRlTWFueShmaWx0ZXJPbmUsIGFkZGVkLCByZW1vdmVkKSB7XG4gICAgICAgIGlmIChmaWx0ZXJPbmUgPT09IG9uZSB8fCByZXNldE5lZWRlZCkgcmV0dXJuO1xuXG4gICAgICAgIHZhciBpLFxuICAgICAgICAgICAgayxcbiAgICAgICAgICAgIG4sXG4gICAgICAgICAgICBnO1xuXG4gICAgICAgIC8vIEFkZCB0aGUgYWRkZWQgdmFsdWVzLlxuICAgICAgICBmb3IgKGkgPSAwLCBuID0gYWRkZWQubGVuZ3RoOyBpIDwgbjsgKytpKSB7XG4gICAgICAgICAgaWYgKCEoZmlsdGVyc1trID0gYWRkZWRbaV1dICYgemVybykpIHtcbiAgICAgICAgICAgIGcgPSBncm91cHNbZ3JvdXBJbmRleFtrXV07XG4gICAgICAgICAgICBnLnZhbHVlID0gcmVkdWNlQWRkKGcudmFsdWUsIGRhdGFba10pO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFJlbW92ZSB0aGUgcmVtb3ZlZCB2YWx1ZXMuXG4gICAgICAgIGZvciAoaSA9IDAsIG4gPSByZW1vdmVkLmxlbmd0aDsgaSA8IG47ICsraSkge1xuICAgICAgICAgIGlmICgoZmlsdGVyc1trID0gcmVtb3ZlZFtpXV0gJiB6ZXJvKSA9PT0gZmlsdGVyT25lKSB7XG4gICAgICAgICAgICBnID0gZ3JvdXBzW2dyb3VwSW5kZXhba11dO1xuICAgICAgICAgICAgZy52YWx1ZSA9IHJlZHVjZVJlbW92ZShnLnZhbHVlLCBkYXRhW2tdKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgLy8gUmVkdWNlcyB0aGUgc3BlY2lmaWVkIHNlbGVjdGVkIG9yIGRlc2VsZWN0ZWQgcmVjb3Jkcy5cbiAgICAgIC8vIFRoaXMgZnVuY3Rpb24gaXMgb25seSB1c2VkIHdoZW4gdGhlIGNhcmRpbmFsaXR5IGlzIDEuXG4gICAgICBmdW5jdGlvbiB1cGRhdGVPbmUoZmlsdGVyT25lLCBhZGRlZCwgcmVtb3ZlZCkge1xuICAgICAgICBpZiAoZmlsdGVyT25lID09PSBvbmUgfHwgcmVzZXROZWVkZWQpIHJldHVybjtcblxuICAgICAgICB2YXIgaSxcbiAgICAgICAgICAgIGssXG4gICAgICAgICAgICBuLFxuICAgICAgICAgICAgZyA9IGdyb3Vwc1swXTtcblxuICAgICAgICAvLyBBZGQgdGhlIGFkZGVkIHZhbHVlcy5cbiAgICAgICAgZm9yIChpID0gMCwgbiA9IGFkZGVkLmxlbmd0aDsgaSA8IG47ICsraSkge1xuICAgICAgICAgIGlmICghKGZpbHRlcnNbayA9IGFkZGVkW2ldXSAmIHplcm8pKSB7XG4gICAgICAgICAgICBnLnZhbHVlID0gcmVkdWNlQWRkKGcudmFsdWUsIGRhdGFba10pO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFJlbW92ZSB0aGUgcmVtb3ZlZCB2YWx1ZXMuXG4gICAgICAgIGZvciAoaSA9IDAsIG4gPSByZW1vdmVkLmxlbmd0aDsgaSA8IG47ICsraSkge1xuICAgICAgICAgIGlmICgoZmlsdGVyc1trID0gcmVtb3ZlZFtpXV0gJiB6ZXJvKSA9PT0gZmlsdGVyT25lKSB7XG4gICAgICAgICAgICBnLnZhbHVlID0gcmVkdWNlUmVtb3ZlKGcudmFsdWUsIGRhdGFba10pO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICAvLyBSZWNvbXB1dGVzIHRoZSBncm91cCByZWR1Y2UgdmFsdWVzIGZyb20gc2NyYXRjaC5cbiAgICAgIC8vIFRoaXMgZnVuY3Rpb24gaXMgb25seSB1c2VkIHdoZW4gdGhlIGNhcmRpbmFsaXR5IGlzIGdyZWF0ZXIgdGhhbiAxLlxuICAgICAgZnVuY3Rpb24gcmVzZXRNYW55KCkge1xuICAgICAgICB2YXIgaSxcbiAgICAgICAgICAgIGc7XG5cbiAgICAgICAgLy8gUmVzZXQgYWxsIGdyb3VwIHZhbHVlcy5cbiAgICAgICAgZm9yIChpID0gMDsgaSA8IGs7ICsraSkge1xuICAgICAgICAgIGdyb3Vwc1tpXS52YWx1ZSA9IHJlZHVjZUluaXRpYWwoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIEFkZCBhbnkgc2VsZWN0ZWQgcmVjb3Jkcy5cbiAgICAgICAgZm9yIChpID0gMDsgaSA8IG47ICsraSkge1xuICAgICAgICAgIGlmICghKGZpbHRlcnNbaV0gJiB6ZXJvKSkge1xuICAgICAgICAgICAgZyA9IGdyb3Vwc1tncm91cEluZGV4W2ldXTtcbiAgICAgICAgICAgIGcudmFsdWUgPSByZWR1Y2VBZGQoZy52YWx1ZSwgZGF0YVtpXSk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIC8vIFJlY29tcHV0ZXMgdGhlIGdyb3VwIHJlZHVjZSB2YWx1ZXMgZnJvbSBzY3JhdGNoLlxuICAgICAgLy8gVGhpcyBmdW5jdGlvbiBpcyBvbmx5IHVzZWQgd2hlbiB0aGUgY2FyZGluYWxpdHkgaXMgMS5cbiAgICAgIGZ1bmN0aW9uIHJlc2V0T25lKCkge1xuICAgICAgICB2YXIgaSxcbiAgICAgICAgICAgIGcgPSBncm91cHNbMF07XG5cbiAgICAgICAgLy8gUmVzZXQgdGhlIHNpbmdsZXRvbiBncm91cCB2YWx1ZXMuXG4gICAgICAgIGcudmFsdWUgPSByZWR1Y2VJbml0aWFsKCk7XG5cbiAgICAgICAgLy8gQWRkIGFueSBzZWxlY3RlZCByZWNvcmRzLlxuICAgICAgICBmb3IgKGkgPSAwOyBpIDwgbjsgKytpKSB7XG4gICAgICAgICAgaWYgKCEoZmlsdGVyc1tpXSAmIHplcm8pKSB7XG4gICAgICAgICAgICBnLnZhbHVlID0gcmVkdWNlQWRkKGcudmFsdWUsIGRhdGFbaV0pO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICAvLyBSZXR1cm5zIHRoZSBhcnJheSBvZiBncm91cCB2YWx1ZXMsIGluIHRoZSBkaW1lbnNpb24ncyBuYXR1cmFsIG9yZGVyLlxuICAgICAgZnVuY3Rpb24gYWxsKCkge1xuICAgICAgICBpZiAocmVzZXROZWVkZWQpIHJlc2V0KCksIHJlc2V0TmVlZGVkID0gZmFsc2U7XG4gICAgICAgIHJldHVybiBncm91cHM7XG4gICAgICB9XG5cbiAgICAgIC8vIFJldHVybnMgYSBuZXcgYXJyYXkgY29udGFpbmluZyB0aGUgdG9wIEsgZ3JvdXAgdmFsdWVzLCBpbiByZWR1Y2Ugb3JkZXIuXG4gICAgICBmdW5jdGlvbiB0b3Aoaykge1xuICAgICAgICB2YXIgdG9wID0gc2VsZWN0KGFsbCgpLCAwLCBncm91cHMubGVuZ3RoLCBrKTtcbiAgICAgICAgcmV0dXJuIGhlYXAuc29ydCh0b3AsIDAsIHRvcC5sZW5ndGgpO1xuICAgICAgfVxuXG4gICAgICAvLyBTZXRzIHRoZSByZWR1Y2UgYmVoYXZpb3IgZm9yIHRoaXMgZ3JvdXAgdG8gdXNlIHRoZSBzcGVjaWZpZWQgZnVuY3Rpb25zLlxuICAgICAgLy8gVGhpcyBtZXRob2QgbGF6aWx5IHJlY29tcHV0ZXMgdGhlIHJlZHVjZSB2YWx1ZXMsIHdhaXRpbmcgdW50aWwgbmVlZGVkLlxuICAgICAgZnVuY3Rpb24gcmVkdWNlKGFkZCwgcmVtb3ZlLCBpbml0aWFsKSB7XG4gICAgICAgIHJlZHVjZUFkZCA9IGFkZDtcbiAgICAgICAgcmVkdWNlUmVtb3ZlID0gcmVtb3ZlO1xuICAgICAgICByZWR1Y2VJbml0aWFsID0gaW5pdGlhbDtcbiAgICAgICAgcmVzZXROZWVkZWQgPSB0cnVlO1xuICAgICAgICByZXR1cm4gZ3JvdXA7XG4gICAgICB9XG5cbiAgICAgIC8vIEEgY29udmVuaWVuY2UgbWV0aG9kIGZvciByZWR1Y2luZyBieSBjb3VudC5cbiAgICAgIGZ1bmN0aW9uIHJlZHVjZUNvdW50KCkge1xuICAgICAgICByZXR1cm4gcmVkdWNlKGNyb3NzZmlsdGVyX3JlZHVjZUluY3JlbWVudCwgY3Jvc3NmaWx0ZXJfcmVkdWNlRGVjcmVtZW50LCBjcm9zc2ZpbHRlcl96ZXJvKTtcbiAgICAgIH1cblxuICAgICAgLy8gQSBjb252ZW5pZW5jZSBtZXRob2QgZm9yIHJlZHVjaW5nIGJ5IHN1bSh2YWx1ZSkuXG4gICAgICBmdW5jdGlvbiByZWR1Y2VTdW0odmFsdWUpIHtcbiAgICAgICAgcmV0dXJuIHJlZHVjZShjcm9zc2ZpbHRlcl9yZWR1Y2VBZGQodmFsdWUpLCBjcm9zc2ZpbHRlcl9yZWR1Y2VTdWJ0cmFjdCh2YWx1ZSksIGNyb3NzZmlsdGVyX3plcm8pO1xuICAgICAgfVxuXG4gICAgICAvLyBTZXRzIHRoZSByZWR1Y2Ugb3JkZXIsIHVzaW5nIHRoZSBzcGVjaWZpZWQgYWNjZXNzb3IuXG4gICAgICBmdW5jdGlvbiBvcmRlcih2YWx1ZSkge1xuICAgICAgICBzZWxlY3QgPSBoZWFwc2VsZWN0X2J5KHZhbHVlT2YpO1xuICAgICAgICBoZWFwID0gaGVhcF9ieSh2YWx1ZU9mKTtcbiAgICAgICAgZnVuY3Rpb24gdmFsdWVPZihkKSB7IHJldHVybiB2YWx1ZShkLnZhbHVlKTsgfVxuICAgICAgICByZXR1cm4gZ3JvdXA7XG4gICAgICB9XG5cbiAgICAgIC8vIEEgY29udmVuaWVuY2UgbWV0aG9kIGZvciBuYXR1cmFsIG9yZGVyaW5nIGJ5IHJlZHVjZSB2YWx1ZS5cbiAgICAgIGZ1bmN0aW9uIG9yZGVyTmF0dXJhbCgpIHtcbiAgICAgICAgcmV0dXJuIG9yZGVyKGNyb3NzZmlsdGVyX2lkZW50aXR5KTtcbiAgICAgIH1cblxuICAgICAgLy8gUmV0dXJucyB0aGUgY2FyZGluYWxpdHkgb2YgdGhpcyBncm91cCwgaXJyZXNwZWN0aXZlIG9mIGFueSBmaWx0ZXJzLlxuICAgICAgZnVuY3Rpb24gc2l6ZSgpIHtcbiAgICAgICAgcmV0dXJuIGs7XG4gICAgICB9XG5cbiAgICAgIC8vIFJlbW92ZXMgdGhpcyBncm91cCBhbmQgYXNzb2NpYXRlZCBldmVudCBsaXN0ZW5lcnMuXG4gICAgICBmdW5jdGlvbiBkaXNwb3NlKCkge1xuICAgICAgICB2YXIgaSA9IGZpbHRlckxpc3RlbmVycy5pbmRleE9mKHVwZGF0ZSk7XG4gICAgICAgIGlmIChpID49IDApIGZpbHRlckxpc3RlbmVycy5zcGxpY2UoaSwgMSk7XG4gICAgICAgIGkgPSBpbmRleExpc3RlbmVycy5pbmRleE9mKGFkZCk7XG4gICAgICAgIGlmIChpID49IDApIGluZGV4TGlzdGVuZXJzLnNwbGljZShpLCAxKTtcbiAgICAgICAgaSA9IHJlbW92ZURhdGFMaXN0ZW5lcnMuaW5kZXhPZihyZW1vdmVEYXRhKTtcbiAgICAgICAgaWYgKGkgPj0gMCkgcmVtb3ZlRGF0YUxpc3RlbmVycy5zcGxpY2UoaSwgMSk7XG4gICAgICAgIHJldHVybiBncm91cDtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIHJlZHVjZUNvdW50KCkub3JkZXJOYXR1cmFsKCk7XG4gICAgfVxuXG4gICAgLy8gQSBjb252ZW5pZW5jZSBmdW5jdGlvbiBmb3IgZ2VuZXJhdGluZyBhIHNpbmdsZXRvbiBncm91cC5cbiAgICBmdW5jdGlvbiBncm91cEFsbCgpIHtcbiAgICAgIHZhciBnID0gZ3JvdXAoY3Jvc3NmaWx0ZXJfbnVsbCksIGFsbCA9IGcuYWxsO1xuICAgICAgZGVsZXRlIGcuYWxsO1xuICAgICAgZGVsZXRlIGcudG9wO1xuICAgICAgZGVsZXRlIGcub3JkZXI7XG4gICAgICBkZWxldGUgZy5vcmRlck5hdHVyYWw7XG4gICAgICBkZWxldGUgZy5zaXplO1xuICAgICAgZy52YWx1ZSA9IGZ1bmN0aW9uKCkgeyByZXR1cm4gYWxsKClbMF0udmFsdWU7IH07XG4gICAgICByZXR1cm4gZztcbiAgICB9XG5cbiAgICAvLyBSZW1vdmVzIHRoaXMgZGltZW5zaW9uIGFuZCBhc3NvY2lhdGVkIGdyb3VwcyBhbmQgZXZlbnQgbGlzdGVuZXJzLlxuICAgIGZ1bmN0aW9uIGRpc3Bvc2UoKSB7XG4gICAgICBkaW1lbnNpb25Hcm91cHMuZm9yRWFjaChmdW5jdGlvbihncm91cCkgeyBncm91cC5kaXNwb3NlKCk7IH0pO1xuICAgICAgdmFyIGkgPSBkYXRhTGlzdGVuZXJzLmluZGV4T2YocHJlQWRkKTtcbiAgICAgIGlmIChpID49IDApIGRhdGFMaXN0ZW5lcnMuc3BsaWNlKGksIDEpO1xuICAgICAgaSA9IGRhdGFMaXN0ZW5lcnMuaW5kZXhPZihwb3N0QWRkKTtcbiAgICAgIGlmIChpID49IDApIGRhdGFMaXN0ZW5lcnMuc3BsaWNlKGksIDEpO1xuICAgICAgaSA9IHJlbW92ZURhdGFMaXN0ZW5lcnMuaW5kZXhPZihyZW1vdmVEYXRhKTtcbiAgICAgIGlmIChpID49IDApIHJlbW92ZURhdGFMaXN0ZW5lcnMuc3BsaWNlKGksIDEpO1xuICAgICAgbSAmPSB6ZXJvO1xuICAgICAgcmV0dXJuIGZpbHRlckFsbCgpO1xuICAgIH1cblxuICAgIHJldHVybiBkaW1lbnNpb247XG4gIH1cblxuICAvLyBBIGNvbnZlbmllbmNlIG1ldGhvZCBmb3IgZ3JvdXBBbGwgb24gYSBkdW1teSBkaW1lbnNpb24uXG4gIC8vIFRoaXMgaW1wbGVtZW50YXRpb24gY2FuIGJlIG9wdGltaXplZCBzaW5jZSBpdCBhbHdheXMgaGFzIGNhcmRpbmFsaXR5IDEuXG4gIGZ1bmN0aW9uIGdyb3VwQWxsKCkge1xuICAgIHZhciBncm91cCA9IHtcbiAgICAgIHJlZHVjZTogcmVkdWNlLFxuICAgICAgcmVkdWNlQ291bnQ6IHJlZHVjZUNvdW50LFxuICAgICAgcmVkdWNlU3VtOiByZWR1Y2VTdW0sXG4gICAgICB2YWx1ZTogdmFsdWUsXG4gICAgICBkaXNwb3NlOiBkaXNwb3NlLFxuICAgICAgcmVtb3ZlOiBkaXNwb3NlIC8vIGZvciBiYWNrd2FyZHMtY29tcGF0aWJpbGl0eVxuICAgIH07XG5cbiAgICB2YXIgcmVkdWNlVmFsdWUsXG4gICAgICAgIHJlZHVjZUFkZCxcbiAgICAgICAgcmVkdWNlUmVtb3ZlLFxuICAgICAgICByZWR1Y2VJbml0aWFsLFxuICAgICAgICByZXNldE5lZWRlZCA9IHRydWU7XG5cbiAgICAvLyBUaGUgZ3JvdXAgbGlzdGVucyB0byB0aGUgY3Jvc3NmaWx0ZXIgZm9yIHdoZW4gYW55IGRpbWVuc2lvbiBjaGFuZ2VzLCBzb1xuICAgIC8vIHRoYXQgaXQgY2FuIHVwZGF0ZSB0aGUgcmVkdWNlIHZhbHVlLiBJdCBtdXN0IGFsc28gbGlzdGVuIHRvIHRoZSBwYXJlbnRcbiAgICAvLyBkaW1lbnNpb24gZm9yIHdoZW4gZGF0YSBpcyBhZGRlZC5cbiAgICBmaWx0ZXJMaXN0ZW5lcnMucHVzaCh1cGRhdGUpO1xuICAgIGRhdGFMaXN0ZW5lcnMucHVzaChhZGQpO1xuXG4gICAgLy8gRm9yIGNvbnNpc3RlbmN5OyBhY3R1YWxseSBhIG5vLW9wIHNpbmNlIHJlc2V0TmVlZGVkIGlzIHRydWUuXG4gICAgYWRkKGRhdGEsIDAsIG4pO1xuXG4gICAgLy8gSW5jb3Jwb3JhdGVzIHRoZSBzcGVjaWZpZWQgbmV3IHZhbHVlcyBpbnRvIHRoaXMgZ3JvdXAuXG4gICAgZnVuY3Rpb24gYWRkKG5ld0RhdGEsIG4wKSB7XG4gICAgICB2YXIgaTtcblxuICAgICAgaWYgKHJlc2V0TmVlZGVkKSByZXR1cm47XG5cbiAgICAgIC8vIEFkZCB0aGUgYWRkZWQgdmFsdWVzLlxuICAgICAgZm9yIChpID0gbjA7IGkgPCBuOyArK2kpIHtcbiAgICAgICAgaWYgKCFmaWx0ZXJzW2ldKSB7XG4gICAgICAgICAgcmVkdWNlVmFsdWUgPSByZWR1Y2VBZGQocmVkdWNlVmFsdWUsIGRhdGFbaV0pO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gUmVkdWNlcyB0aGUgc3BlY2lmaWVkIHNlbGVjdGVkIG9yIGRlc2VsZWN0ZWQgcmVjb3Jkcy5cbiAgICBmdW5jdGlvbiB1cGRhdGUoZmlsdGVyT25lLCBhZGRlZCwgcmVtb3ZlZCkge1xuICAgICAgdmFyIGksXG4gICAgICAgICAgayxcbiAgICAgICAgICBuO1xuXG4gICAgICBpZiAocmVzZXROZWVkZWQpIHJldHVybjtcblxuICAgICAgLy8gQWRkIHRoZSBhZGRlZCB2YWx1ZXMuXG4gICAgICBmb3IgKGkgPSAwLCBuID0gYWRkZWQubGVuZ3RoOyBpIDwgbjsgKytpKSB7XG4gICAgICAgIGlmICghZmlsdGVyc1trID0gYWRkZWRbaV1dKSB7XG4gICAgICAgICAgcmVkdWNlVmFsdWUgPSByZWR1Y2VBZGQocmVkdWNlVmFsdWUsIGRhdGFba10pO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIC8vIFJlbW92ZSB0aGUgcmVtb3ZlZCB2YWx1ZXMuXG4gICAgICBmb3IgKGkgPSAwLCBuID0gcmVtb3ZlZC5sZW5ndGg7IGkgPCBuOyArK2kpIHtcbiAgICAgICAgaWYgKGZpbHRlcnNbayA9IHJlbW92ZWRbaV1dID09PSBmaWx0ZXJPbmUpIHtcbiAgICAgICAgICByZWR1Y2VWYWx1ZSA9IHJlZHVjZVJlbW92ZShyZWR1Y2VWYWx1ZSwgZGF0YVtrXSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBSZWNvbXB1dGVzIHRoZSBncm91cCByZWR1Y2UgdmFsdWUgZnJvbSBzY3JhdGNoLlxuICAgIGZ1bmN0aW9uIHJlc2V0KCkge1xuICAgICAgdmFyIGk7XG5cbiAgICAgIHJlZHVjZVZhbHVlID0gcmVkdWNlSW5pdGlhbCgpO1xuXG4gICAgICBmb3IgKGkgPSAwOyBpIDwgbjsgKytpKSB7XG4gICAgICAgIGlmICghZmlsdGVyc1tpXSkge1xuICAgICAgICAgIHJlZHVjZVZhbHVlID0gcmVkdWNlQWRkKHJlZHVjZVZhbHVlLCBkYXRhW2ldKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIC8vIFNldHMgdGhlIHJlZHVjZSBiZWhhdmlvciBmb3IgdGhpcyBncm91cCB0byB1c2UgdGhlIHNwZWNpZmllZCBmdW5jdGlvbnMuXG4gICAgLy8gVGhpcyBtZXRob2QgbGF6aWx5IHJlY29tcHV0ZXMgdGhlIHJlZHVjZSB2YWx1ZSwgd2FpdGluZyB1bnRpbCBuZWVkZWQuXG4gICAgZnVuY3Rpb24gcmVkdWNlKGFkZCwgcmVtb3ZlLCBpbml0aWFsKSB7XG4gICAgICByZWR1Y2VBZGQgPSBhZGQ7XG4gICAgICByZWR1Y2VSZW1vdmUgPSByZW1vdmU7XG4gICAgICByZWR1Y2VJbml0aWFsID0gaW5pdGlhbDtcbiAgICAgIHJlc2V0TmVlZGVkID0gdHJ1ZTtcbiAgICAgIHJldHVybiBncm91cDtcbiAgICB9XG5cbiAgICAvLyBBIGNvbnZlbmllbmNlIG1ldGhvZCBmb3IgcmVkdWNpbmcgYnkgY291bnQuXG4gICAgZnVuY3Rpb24gcmVkdWNlQ291bnQoKSB7XG4gICAgICByZXR1cm4gcmVkdWNlKGNyb3NzZmlsdGVyX3JlZHVjZUluY3JlbWVudCwgY3Jvc3NmaWx0ZXJfcmVkdWNlRGVjcmVtZW50LCBjcm9zc2ZpbHRlcl96ZXJvKTtcbiAgICB9XG5cbiAgICAvLyBBIGNvbnZlbmllbmNlIG1ldGhvZCBmb3IgcmVkdWNpbmcgYnkgc3VtKHZhbHVlKS5cbiAgICBmdW5jdGlvbiByZWR1Y2VTdW0odmFsdWUpIHtcbiAgICAgIHJldHVybiByZWR1Y2UoY3Jvc3NmaWx0ZXJfcmVkdWNlQWRkKHZhbHVlKSwgY3Jvc3NmaWx0ZXJfcmVkdWNlU3VidHJhY3QodmFsdWUpLCBjcm9zc2ZpbHRlcl96ZXJvKTtcbiAgICB9XG5cbiAgICAvLyBSZXR1cm5zIHRoZSBjb21wdXRlZCByZWR1Y2UgdmFsdWUuXG4gICAgZnVuY3Rpb24gdmFsdWUoKSB7XG4gICAgICBpZiAocmVzZXROZWVkZWQpIHJlc2V0KCksIHJlc2V0TmVlZGVkID0gZmFsc2U7XG4gICAgICByZXR1cm4gcmVkdWNlVmFsdWU7XG4gICAgfVxuXG4gICAgLy8gUmVtb3ZlcyB0aGlzIGdyb3VwIGFuZCBhc3NvY2lhdGVkIGV2ZW50IGxpc3RlbmVycy5cbiAgICBmdW5jdGlvbiBkaXNwb3NlKCkge1xuICAgICAgdmFyIGkgPSBmaWx0ZXJMaXN0ZW5lcnMuaW5kZXhPZih1cGRhdGUpO1xuICAgICAgaWYgKGkgPj0gMCkgZmlsdGVyTGlzdGVuZXJzLnNwbGljZShpKTtcbiAgICAgIGkgPSBkYXRhTGlzdGVuZXJzLmluZGV4T2YoYWRkKTtcbiAgICAgIGlmIChpID49IDApIGRhdGFMaXN0ZW5lcnMuc3BsaWNlKGkpO1xuICAgICAgcmV0dXJuIGdyb3VwO1xuICAgIH1cblxuICAgIHJldHVybiByZWR1Y2VDb3VudCgpO1xuICB9XG5cbiAgLy8gUmV0dXJucyB0aGUgbnVtYmVyIG9mIHJlY29yZHMgaW4gdGhpcyBjcm9zc2ZpbHRlciwgaXJyZXNwZWN0aXZlIG9mIGFueSBmaWx0ZXJzLlxuICBmdW5jdGlvbiBzaXplKCkge1xuICAgIHJldHVybiBuO1xuICB9XG5cbiAgcmV0dXJuIGFyZ3VtZW50cy5sZW5ndGhcbiAgICAgID8gYWRkKGFyZ3VtZW50c1swXSlcbiAgICAgIDogY3Jvc3NmaWx0ZXI7XG59XG5cbi8vIFJldHVybnMgYW4gYXJyYXkgb2Ygc2l6ZSBuLCBiaWcgZW5vdWdoIHRvIHN0b3JlIGlkcyB1cCB0byBtLlxuZnVuY3Rpb24gY3Jvc3NmaWx0ZXJfaW5kZXgobiwgbSkge1xuICByZXR1cm4gKG0gPCAweDEwMVxuICAgICAgPyBjcm9zc2ZpbHRlcl9hcnJheTggOiBtIDwgMHgxMDAwMVxuICAgICAgPyBjcm9zc2ZpbHRlcl9hcnJheTE2XG4gICAgICA6IGNyb3NzZmlsdGVyX2FycmF5MzIpKG4pO1xufVxuXG4vLyBDb25zdHJ1Y3RzIGEgbmV3IGFycmF5IG9mIHNpemUgbiwgd2l0aCBzZXF1ZW50aWFsIHZhbHVlcyBmcm9tIDAgdG8gbiAtIDEuXG5mdW5jdGlvbiBjcm9zc2ZpbHRlcl9yYW5nZShuKSB7XG4gIHZhciByYW5nZSA9IGNyb3NzZmlsdGVyX2luZGV4KG4sIG4pO1xuICBmb3IgKHZhciBpID0gLTE7ICsraSA8IG47KSByYW5nZVtpXSA9IGk7XG4gIHJldHVybiByYW5nZTtcbn1cblxuZnVuY3Rpb24gY3Jvc3NmaWx0ZXJfY2FwYWNpdHkodykge1xuICByZXR1cm4gdyA9PT0gOFxuICAgICAgPyAweDEwMCA6IHcgPT09IDE2XG4gICAgICA/IDB4MTAwMDBcbiAgICAgIDogMHgxMDAwMDAwMDA7XG59XG59KSh0eXBlb2YgZXhwb3J0cyAhPT0gJ3VuZGVmaW5lZCcgJiYgZXhwb3J0cyB8fCB0aGlzKTtcbiIsIm1vZHVsZS5leHBvcnRzID0gcmVxdWlyZShcIi4vY3Jvc3NmaWx0ZXJcIikuY3Jvc3NmaWx0ZXI7XG4iLCIhZnVuY3Rpb24oKSB7XG4gIHZhciB0b3BvanNvbiA9IHtcbiAgICB2ZXJzaW9uOiBcIjEuNi4xOVwiLFxuICAgIG1lc2g6IGZ1bmN0aW9uKHRvcG9sb2d5KSB7IHJldHVybiBvYmplY3QodG9wb2xvZ3ksIG1lc2hBcmNzLmFwcGx5KHRoaXMsIGFyZ3VtZW50cykpOyB9LFxuICAgIG1lc2hBcmNzOiBtZXNoQXJjcyxcbiAgICBtZXJnZTogZnVuY3Rpb24odG9wb2xvZ3kpIHsgcmV0dXJuIG9iamVjdCh0b3BvbG9neSwgbWVyZ2VBcmNzLmFwcGx5KHRoaXMsIGFyZ3VtZW50cykpOyB9LFxuICAgIG1lcmdlQXJjczogbWVyZ2VBcmNzLFxuICAgIGZlYXR1cmU6IGZlYXR1cmVPckNvbGxlY3Rpb24sXG4gICAgbmVpZ2hib3JzOiBuZWlnaGJvcnMsXG4gICAgcHJlc2ltcGxpZnk6IHByZXNpbXBsaWZ5XG4gIH07XG5cbiAgZnVuY3Rpb24gc3RpdGNoQXJjcyh0b3BvbG9neSwgYXJjcykge1xuICAgIHZhciBzdGl0Y2hlZEFyY3MgPSB7fSxcbiAgICAgICAgZnJhZ21lbnRCeVN0YXJ0ID0ge30sXG4gICAgICAgIGZyYWdtZW50QnlFbmQgPSB7fSxcbiAgICAgICAgZnJhZ21lbnRzID0gW10sXG4gICAgICAgIGVtcHR5SW5kZXggPSAtMTtcblxuICAgIC8vIFN0aXRjaCBlbXB0eSBhcmNzIGZpcnN0LCBzaW5jZSB0aGV5IG1heSBiZSBzdWJzdW1lZCBieSBvdGhlciBhcmNzLlxuICAgIGFyY3MuZm9yRWFjaChmdW5jdGlvbihpLCBqKSB7XG4gICAgICB2YXIgYXJjID0gdG9wb2xvZ3kuYXJjc1tpIDwgMCA/IH5pIDogaV0sIHQ7XG4gICAgICBpZiAoYXJjLmxlbmd0aCA8IDMgJiYgIWFyY1sxXVswXSAmJiAhYXJjWzFdWzFdKSB7XG4gICAgICAgIHQgPSBhcmNzWysrZW1wdHlJbmRleF0sIGFyY3NbZW1wdHlJbmRleF0gPSBpLCBhcmNzW2pdID0gdDtcbiAgICAgIH1cbiAgICB9KTtcblxuICAgIGFyY3MuZm9yRWFjaChmdW5jdGlvbihpKSB7XG4gICAgICB2YXIgZSA9IGVuZHMoaSksXG4gICAgICAgICAgc3RhcnQgPSBlWzBdLFxuICAgICAgICAgIGVuZCA9IGVbMV0sXG4gICAgICAgICAgZiwgZztcblxuICAgICAgaWYgKGYgPSBmcmFnbWVudEJ5RW5kW3N0YXJ0XSkge1xuICAgICAgICBkZWxldGUgZnJhZ21lbnRCeUVuZFtmLmVuZF07XG4gICAgICAgIGYucHVzaChpKTtcbiAgICAgICAgZi5lbmQgPSBlbmQ7XG4gICAgICAgIGlmIChnID0gZnJhZ21lbnRCeVN0YXJ0W2VuZF0pIHtcbiAgICAgICAgICBkZWxldGUgZnJhZ21lbnRCeVN0YXJ0W2cuc3RhcnRdO1xuICAgICAgICAgIHZhciBmZyA9IGcgPT09IGYgPyBmIDogZi5jb25jYXQoZyk7XG4gICAgICAgICAgZnJhZ21lbnRCeVN0YXJ0W2ZnLnN0YXJ0ID0gZi5zdGFydF0gPSBmcmFnbWVudEJ5RW5kW2ZnLmVuZCA9IGcuZW5kXSA9IGZnO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGZyYWdtZW50QnlTdGFydFtmLnN0YXJ0XSA9IGZyYWdtZW50QnlFbmRbZi5lbmRdID0gZjtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIGlmIChmID0gZnJhZ21lbnRCeVN0YXJ0W2VuZF0pIHtcbiAgICAgICAgZGVsZXRlIGZyYWdtZW50QnlTdGFydFtmLnN0YXJ0XTtcbiAgICAgICAgZi51bnNoaWZ0KGkpO1xuICAgICAgICBmLnN0YXJ0ID0gc3RhcnQ7XG4gICAgICAgIGlmIChnID0gZnJhZ21lbnRCeUVuZFtzdGFydF0pIHtcbiAgICAgICAgICBkZWxldGUgZnJhZ21lbnRCeUVuZFtnLmVuZF07XG4gICAgICAgICAgdmFyIGdmID0gZyA9PT0gZiA/IGYgOiBnLmNvbmNhdChmKTtcbiAgICAgICAgICBmcmFnbWVudEJ5U3RhcnRbZ2Yuc3RhcnQgPSBnLnN0YXJ0XSA9IGZyYWdtZW50QnlFbmRbZ2YuZW5kID0gZi5lbmRdID0gZ2Y7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgZnJhZ21lbnRCeVN0YXJ0W2Yuc3RhcnRdID0gZnJhZ21lbnRCeUVuZFtmLmVuZF0gPSBmO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBmID0gW2ldO1xuICAgICAgICBmcmFnbWVudEJ5U3RhcnRbZi5zdGFydCA9IHN0YXJ0XSA9IGZyYWdtZW50QnlFbmRbZi5lbmQgPSBlbmRdID0gZjtcbiAgICAgIH1cbiAgICB9KTtcblxuICAgIGZ1bmN0aW9uIGVuZHMoaSkge1xuICAgICAgdmFyIGFyYyA9IHRvcG9sb2d5LmFyY3NbaSA8IDAgPyB+aSA6IGldLCBwMCA9IGFyY1swXSwgcDE7XG4gICAgICBpZiAodG9wb2xvZ3kudHJhbnNmb3JtKSBwMSA9IFswLCAwXSwgYXJjLmZvckVhY2goZnVuY3Rpb24oZHApIHsgcDFbMF0gKz0gZHBbMF0sIHAxWzFdICs9IGRwWzFdOyB9KTtcbiAgICAgIGVsc2UgcDEgPSBhcmNbYXJjLmxlbmd0aCAtIDFdO1xuICAgICAgcmV0dXJuIGkgPCAwID8gW3AxLCBwMF0gOiBbcDAsIHAxXTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBmbHVzaChmcmFnbWVudEJ5RW5kLCBmcmFnbWVudEJ5U3RhcnQpIHtcbiAgICAgIGZvciAodmFyIGsgaW4gZnJhZ21lbnRCeUVuZCkge1xuICAgICAgICB2YXIgZiA9IGZyYWdtZW50QnlFbmRba107XG4gICAgICAgIGRlbGV0ZSBmcmFnbWVudEJ5U3RhcnRbZi5zdGFydF07XG4gICAgICAgIGRlbGV0ZSBmLnN0YXJ0O1xuICAgICAgICBkZWxldGUgZi5lbmQ7XG4gICAgICAgIGYuZm9yRWFjaChmdW5jdGlvbihpKSB7IHN0aXRjaGVkQXJjc1tpIDwgMCA/IH5pIDogaV0gPSAxOyB9KTtcbiAgICAgICAgZnJhZ21lbnRzLnB1c2goZik7XG4gICAgICB9XG4gICAgfVxuXG4gICAgZmx1c2goZnJhZ21lbnRCeUVuZCwgZnJhZ21lbnRCeVN0YXJ0KTtcbiAgICBmbHVzaChmcmFnbWVudEJ5U3RhcnQsIGZyYWdtZW50QnlFbmQpO1xuICAgIGFyY3MuZm9yRWFjaChmdW5jdGlvbihpKSB7IGlmICghc3RpdGNoZWRBcmNzW2kgPCAwID8gfmkgOiBpXSkgZnJhZ21lbnRzLnB1c2goW2ldKTsgfSk7XG5cbiAgICByZXR1cm4gZnJhZ21lbnRzO1xuICB9XG5cbiAgZnVuY3Rpb24gbWVzaEFyY3ModG9wb2xvZ3ksIG8sIGZpbHRlcikge1xuICAgIHZhciBhcmNzID0gW107XG5cbiAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA+IDEpIHtcbiAgICAgIHZhciBnZW9tc0J5QXJjID0gW10sXG4gICAgICAgICAgZ2VvbTtcblxuICAgICAgZnVuY3Rpb24gYXJjKGkpIHtcbiAgICAgICAgdmFyIGogPSBpIDwgMCA/IH5pIDogaTtcbiAgICAgICAgKGdlb21zQnlBcmNbal0gfHwgKGdlb21zQnlBcmNbal0gPSBbXSkpLnB1c2goe2k6IGksIGc6IGdlb219KTtcbiAgICAgIH1cblxuICAgICAgZnVuY3Rpb24gbGluZShhcmNzKSB7XG4gICAgICAgIGFyY3MuZm9yRWFjaChhcmMpO1xuICAgICAgfVxuXG4gICAgICBmdW5jdGlvbiBwb2x5Z29uKGFyY3MpIHtcbiAgICAgICAgYXJjcy5mb3JFYWNoKGxpbmUpO1xuICAgICAgfVxuXG4gICAgICBmdW5jdGlvbiBnZW9tZXRyeShvKSB7XG4gICAgICAgIGlmIChvLnR5cGUgPT09IFwiR2VvbWV0cnlDb2xsZWN0aW9uXCIpIG8uZ2VvbWV0cmllcy5mb3JFYWNoKGdlb21ldHJ5KTtcbiAgICAgICAgZWxzZSBpZiAoby50eXBlIGluIGdlb21ldHJ5VHlwZSkgZ2VvbSA9IG8sIGdlb21ldHJ5VHlwZVtvLnR5cGVdKG8uYXJjcyk7XG4gICAgICB9XG5cbiAgICAgIHZhciBnZW9tZXRyeVR5cGUgPSB7XG4gICAgICAgIExpbmVTdHJpbmc6IGxpbmUsXG4gICAgICAgIE11bHRpTGluZVN0cmluZzogcG9seWdvbixcbiAgICAgICAgUG9seWdvbjogcG9seWdvbixcbiAgICAgICAgTXVsdGlQb2x5Z29uOiBmdW5jdGlvbihhcmNzKSB7IGFyY3MuZm9yRWFjaChwb2x5Z29uKTsgfVxuICAgICAgfTtcblxuICAgICAgZ2VvbWV0cnkobyk7XG5cbiAgICAgIGdlb21zQnlBcmMuZm9yRWFjaChhcmd1bWVudHMubGVuZ3RoIDwgM1xuICAgICAgICAgID8gZnVuY3Rpb24oZ2VvbXMpIHsgYXJjcy5wdXNoKGdlb21zWzBdLmkpOyB9XG4gICAgICAgICAgOiBmdW5jdGlvbihnZW9tcykgeyBpZiAoZmlsdGVyKGdlb21zWzBdLmcsIGdlb21zW2dlb21zLmxlbmd0aCAtIDFdLmcpKSBhcmNzLnB1c2goZ2VvbXNbMF0uaSk7IH0pO1xuICAgIH0gZWxzZSB7XG4gICAgICBmb3IgKHZhciBpID0gMCwgbiA9IHRvcG9sb2d5LmFyY3MubGVuZ3RoOyBpIDwgbjsgKytpKSBhcmNzLnB1c2goaSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHt0eXBlOiBcIk11bHRpTGluZVN0cmluZ1wiLCBhcmNzOiBzdGl0Y2hBcmNzKHRvcG9sb2d5LCBhcmNzKX07XG4gIH1cblxuICBmdW5jdGlvbiBtZXJnZUFyY3ModG9wb2xvZ3ksIG9iamVjdHMpIHtcbiAgICB2YXIgcG9seWdvbnNCeUFyYyA9IHt9LFxuICAgICAgICBwb2x5Z29ucyA9IFtdLFxuICAgICAgICBjb21wb25lbnRzID0gW107XG5cbiAgICBvYmplY3RzLmZvckVhY2goZnVuY3Rpb24obykge1xuICAgICAgaWYgKG8udHlwZSA9PT0gXCJQb2x5Z29uXCIpIHJlZ2lzdGVyKG8uYXJjcyk7XG4gICAgICBlbHNlIGlmIChvLnR5cGUgPT09IFwiTXVsdGlQb2x5Z29uXCIpIG8uYXJjcy5mb3JFYWNoKHJlZ2lzdGVyKTtcbiAgICB9KTtcblxuICAgIGZ1bmN0aW9uIHJlZ2lzdGVyKHBvbHlnb24pIHtcbiAgICAgIHBvbHlnb24uZm9yRWFjaChmdW5jdGlvbihyaW5nKSB7XG4gICAgICAgIHJpbmcuZm9yRWFjaChmdW5jdGlvbihhcmMpIHtcbiAgICAgICAgICAocG9seWdvbnNCeUFyY1thcmMgPSBhcmMgPCAwID8gfmFyYyA6IGFyY10gfHwgKHBvbHlnb25zQnlBcmNbYXJjXSA9IFtdKSkucHVzaChwb2x5Z29uKTtcbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICAgIHBvbHlnb25zLnB1c2gocG9seWdvbik7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZXh0ZXJpb3IocmluZykge1xuICAgICAgcmV0dXJuIGNhcnRlc2lhblJpbmdBcmVhKG9iamVjdCh0b3BvbG9neSwge3R5cGU6IFwiUG9seWdvblwiLCBhcmNzOiBbcmluZ119KS5jb29yZGluYXRlc1swXSkgPiAwOyAvLyBUT0RPIGFsbG93IHNwaGVyaWNhbD9cbiAgICB9XG5cbiAgICBwb2x5Z29ucy5mb3JFYWNoKGZ1bmN0aW9uKHBvbHlnb24pIHtcbiAgICAgIGlmICghcG9seWdvbi5fKSB7XG4gICAgICAgIHZhciBjb21wb25lbnQgPSBbXSxcbiAgICAgICAgICAgIG5laWdoYm9ycyA9IFtwb2x5Z29uXTtcbiAgICAgICAgcG9seWdvbi5fID0gMTtcbiAgICAgICAgY29tcG9uZW50cy5wdXNoKGNvbXBvbmVudCk7XG4gICAgICAgIHdoaWxlIChwb2x5Z29uID0gbmVpZ2hib3JzLnBvcCgpKSB7XG4gICAgICAgICAgY29tcG9uZW50LnB1c2gocG9seWdvbik7XG4gICAgICAgICAgcG9seWdvbi5mb3JFYWNoKGZ1bmN0aW9uKHJpbmcpIHtcbiAgICAgICAgICAgIHJpbmcuZm9yRWFjaChmdW5jdGlvbihhcmMpIHtcbiAgICAgICAgICAgICAgcG9seWdvbnNCeUFyY1thcmMgPCAwID8gfmFyYyA6IGFyY10uZm9yRWFjaChmdW5jdGlvbihwb2x5Z29uKSB7XG4gICAgICAgICAgICAgICAgaWYgKCFwb2x5Z29uLl8pIHtcbiAgICAgICAgICAgICAgICAgIHBvbHlnb24uXyA9IDE7XG4gICAgICAgICAgICAgICAgICBuZWlnaGJvcnMucHVzaChwb2x5Z29uKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9KTtcblxuICAgIHBvbHlnb25zLmZvckVhY2goZnVuY3Rpb24ocG9seWdvbikge1xuICAgICAgZGVsZXRlIHBvbHlnb24uXztcbiAgICB9KTtcblxuICAgIHJldHVybiB7XG4gICAgICB0eXBlOiBcIk11bHRpUG9seWdvblwiLFxuICAgICAgYXJjczogY29tcG9uZW50cy5tYXAoZnVuY3Rpb24ocG9seWdvbnMpIHtcbiAgICAgICAgdmFyIGFyY3MgPSBbXTtcblxuICAgICAgICAvLyBFeHRyYWN0IHRoZSBleHRlcmlvciAodW5pcXVlKSBhcmNzLlxuICAgICAgICBwb2x5Z29ucy5mb3JFYWNoKGZ1bmN0aW9uKHBvbHlnb24pIHtcbiAgICAgICAgICBwb2x5Z29uLmZvckVhY2goZnVuY3Rpb24ocmluZykge1xuICAgICAgICAgICAgcmluZy5mb3JFYWNoKGZ1bmN0aW9uKGFyYykge1xuICAgICAgICAgICAgICBpZiAocG9seWdvbnNCeUFyY1thcmMgPCAwID8gfmFyYyA6IGFyY10ubGVuZ3RoIDwgMikge1xuICAgICAgICAgICAgICAgIGFyY3MucHVzaChhcmMpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgLy8gU3RpdGNoIHRoZSBhcmNzIGludG8gb25lIG9yIG1vcmUgcmluZ3MuXG4gICAgICAgIGFyY3MgPSBzdGl0Y2hBcmNzKHRvcG9sb2d5LCBhcmNzKTtcblxuICAgICAgICAvLyBJZiBtb3JlIHRoYW4gb25lIHJpbmcgaXMgcmV0dXJuZWQsXG4gICAgICAgIC8vIGF0IG1vc3Qgb25lIG9mIHRoZXNlIHJpbmdzIGNhbiBiZSB0aGUgZXh0ZXJpb3I7XG4gICAgICAgIC8vIHRoaXMgZXh0ZXJpb3IgcmluZyBoYXMgdGhlIHNhbWUgd2luZGluZyBvcmRlclxuICAgICAgICAvLyBhcyBhbnkgZXh0ZXJpb3IgcmluZyBpbiB0aGUgb3JpZ2luYWwgcG9seWdvbnMuXG4gICAgICAgIGlmICgobiA9IGFyY3MubGVuZ3RoKSA+IDEpIHtcbiAgICAgICAgICB2YXIgc2duID0gZXh0ZXJpb3IocG9seWdvbnNbMF1bMF0pO1xuICAgICAgICAgIGZvciAodmFyIGkgPSAwLCB0OyBpIDwgbjsgKytpKSB7XG4gICAgICAgICAgICBpZiAoc2duID09PSBleHRlcmlvcihhcmNzW2ldKSkge1xuICAgICAgICAgICAgICB0ID0gYXJjc1swXSwgYXJjc1swXSA9IGFyY3NbaV0sIGFyY3NbaV0gPSB0O1xuICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gYXJjcztcbiAgICAgIH0pXG4gICAgfTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGZlYXR1cmVPckNvbGxlY3Rpb24odG9wb2xvZ3ksIG8pIHtcbiAgICByZXR1cm4gby50eXBlID09PSBcIkdlb21ldHJ5Q29sbGVjdGlvblwiID8ge1xuICAgICAgdHlwZTogXCJGZWF0dXJlQ29sbGVjdGlvblwiLFxuICAgICAgZmVhdHVyZXM6IG8uZ2VvbWV0cmllcy5tYXAoZnVuY3Rpb24obykgeyByZXR1cm4gZmVhdHVyZSh0b3BvbG9neSwgbyk7IH0pXG4gICAgfSA6IGZlYXR1cmUodG9wb2xvZ3ksIG8pO1xuICB9XG5cbiAgZnVuY3Rpb24gZmVhdHVyZSh0b3BvbG9neSwgbykge1xuICAgIHZhciBmID0ge1xuICAgICAgdHlwZTogXCJGZWF0dXJlXCIsXG4gICAgICBpZDogby5pZCxcbiAgICAgIHByb3BlcnRpZXM6IG8ucHJvcGVydGllcyB8fCB7fSxcbiAgICAgIGdlb21ldHJ5OiBvYmplY3QodG9wb2xvZ3ksIG8pXG4gICAgfTtcbiAgICBpZiAoby5pZCA9PSBudWxsKSBkZWxldGUgZi5pZDtcbiAgICByZXR1cm4gZjtcbiAgfVxuXG4gIGZ1bmN0aW9uIG9iamVjdCh0b3BvbG9neSwgbykge1xuICAgIHZhciBhYnNvbHV0ZSA9IHRyYW5zZm9ybUFic29sdXRlKHRvcG9sb2d5LnRyYW5zZm9ybSksXG4gICAgICAgIGFyY3MgPSB0b3BvbG9neS5hcmNzO1xuXG4gICAgZnVuY3Rpb24gYXJjKGksIHBvaW50cykge1xuICAgICAgaWYgKHBvaW50cy5sZW5ndGgpIHBvaW50cy5wb3AoKTtcbiAgICAgIGZvciAodmFyIGEgPSBhcmNzW2kgPCAwID8gfmkgOiBpXSwgayA9IDAsIG4gPSBhLmxlbmd0aCwgcDsgayA8IG47ICsraykge1xuICAgICAgICBwb2ludHMucHVzaChwID0gYVtrXS5zbGljZSgpKTtcbiAgICAgICAgYWJzb2x1dGUocCwgayk7XG4gICAgICB9XG4gICAgICBpZiAoaSA8IDApIHJldmVyc2UocG9pbnRzLCBuKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBwb2ludChwKSB7XG4gICAgICBwID0gcC5zbGljZSgpO1xuICAgICAgYWJzb2x1dGUocCwgMCk7XG4gICAgICByZXR1cm4gcDtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBsaW5lKGFyY3MpIHtcbiAgICAgIHZhciBwb2ludHMgPSBbXTtcbiAgICAgIGZvciAodmFyIGkgPSAwLCBuID0gYXJjcy5sZW5ndGg7IGkgPCBuOyArK2kpIGFyYyhhcmNzW2ldLCBwb2ludHMpO1xuICAgICAgaWYgKHBvaW50cy5sZW5ndGggPCAyKSBwb2ludHMucHVzaChwb2ludHNbMF0uc2xpY2UoKSk7XG4gICAgICByZXR1cm4gcG9pbnRzO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHJpbmcoYXJjcykge1xuICAgICAgdmFyIHBvaW50cyA9IGxpbmUoYXJjcyk7XG4gICAgICB3aGlsZSAocG9pbnRzLmxlbmd0aCA8IDQpIHBvaW50cy5wdXNoKHBvaW50c1swXS5zbGljZSgpKTtcbiAgICAgIHJldHVybiBwb2ludHM7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gcG9seWdvbihhcmNzKSB7XG4gICAgICByZXR1cm4gYXJjcy5tYXAocmluZyk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZ2VvbWV0cnkobykge1xuICAgICAgdmFyIHQgPSBvLnR5cGU7XG4gICAgICByZXR1cm4gdCA9PT0gXCJHZW9tZXRyeUNvbGxlY3Rpb25cIiA/IHt0eXBlOiB0LCBnZW9tZXRyaWVzOiBvLmdlb21ldHJpZXMubWFwKGdlb21ldHJ5KX1cbiAgICAgICAgICA6IHQgaW4gZ2VvbWV0cnlUeXBlID8ge3R5cGU6IHQsIGNvb3JkaW5hdGVzOiBnZW9tZXRyeVR5cGVbdF0obyl9XG4gICAgICAgICAgOiBudWxsO1xuICAgIH1cblxuICAgIHZhciBnZW9tZXRyeVR5cGUgPSB7XG4gICAgICBQb2ludDogZnVuY3Rpb24obykgeyByZXR1cm4gcG9pbnQoby5jb29yZGluYXRlcyk7IH0sXG4gICAgICBNdWx0aVBvaW50OiBmdW5jdGlvbihvKSB7IHJldHVybiBvLmNvb3JkaW5hdGVzLm1hcChwb2ludCk7IH0sXG4gICAgICBMaW5lU3RyaW5nOiBmdW5jdGlvbihvKSB7IHJldHVybiBsaW5lKG8uYXJjcyk7IH0sXG4gICAgICBNdWx0aUxpbmVTdHJpbmc6IGZ1bmN0aW9uKG8pIHsgcmV0dXJuIG8uYXJjcy5tYXAobGluZSk7IH0sXG4gICAgICBQb2x5Z29uOiBmdW5jdGlvbihvKSB7IHJldHVybiBwb2x5Z29uKG8uYXJjcyk7IH0sXG4gICAgICBNdWx0aVBvbHlnb246IGZ1bmN0aW9uKG8pIHsgcmV0dXJuIG8uYXJjcy5tYXAocG9seWdvbik7IH1cbiAgICB9O1xuXG4gICAgcmV0dXJuIGdlb21ldHJ5KG8pO1xuICB9XG5cbiAgZnVuY3Rpb24gcmV2ZXJzZShhcnJheSwgbikge1xuICAgIHZhciB0LCBqID0gYXJyYXkubGVuZ3RoLCBpID0gaiAtIG47IHdoaWxlIChpIDwgLS1qKSB0ID0gYXJyYXlbaV0sIGFycmF5W2krK10gPSBhcnJheVtqXSwgYXJyYXlbal0gPSB0O1xuICB9XG5cbiAgZnVuY3Rpb24gYmlzZWN0KGEsIHgpIHtcbiAgICB2YXIgbG8gPSAwLCBoaSA9IGEubGVuZ3RoO1xuICAgIHdoaWxlIChsbyA8IGhpKSB7XG4gICAgICB2YXIgbWlkID0gbG8gKyBoaSA+Pj4gMTtcbiAgICAgIGlmIChhW21pZF0gPCB4KSBsbyA9IG1pZCArIDE7XG4gICAgICBlbHNlIGhpID0gbWlkO1xuICAgIH1cbiAgICByZXR1cm4gbG87XG4gIH1cblxuICBmdW5jdGlvbiBuZWlnaGJvcnMob2JqZWN0cykge1xuICAgIHZhciBpbmRleGVzQnlBcmMgPSB7fSwgLy8gYXJjIGluZGV4IC0+IGFycmF5IG9mIG9iamVjdCBpbmRleGVzXG4gICAgICAgIG5laWdoYm9ycyA9IG9iamVjdHMubWFwKGZ1bmN0aW9uKCkgeyByZXR1cm4gW107IH0pO1xuXG4gICAgZnVuY3Rpb24gbGluZShhcmNzLCBpKSB7XG4gICAgICBhcmNzLmZvckVhY2goZnVuY3Rpb24oYSkge1xuICAgICAgICBpZiAoYSA8IDApIGEgPSB+YTtcbiAgICAgICAgdmFyIG8gPSBpbmRleGVzQnlBcmNbYV07XG4gICAgICAgIGlmIChvKSBvLnB1c2goaSk7XG4gICAgICAgIGVsc2UgaW5kZXhlc0J5QXJjW2FdID0gW2ldO1xuICAgICAgfSk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gcG9seWdvbihhcmNzLCBpKSB7XG4gICAgICBhcmNzLmZvckVhY2goZnVuY3Rpb24oYXJjKSB7IGxpbmUoYXJjLCBpKTsgfSk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZ2VvbWV0cnkobywgaSkge1xuICAgICAgaWYgKG8udHlwZSA9PT0gXCJHZW9tZXRyeUNvbGxlY3Rpb25cIikgby5nZW9tZXRyaWVzLmZvckVhY2goZnVuY3Rpb24obykgeyBnZW9tZXRyeShvLCBpKTsgfSk7XG4gICAgICBlbHNlIGlmIChvLnR5cGUgaW4gZ2VvbWV0cnlUeXBlKSBnZW9tZXRyeVR5cGVbby50eXBlXShvLmFyY3MsIGkpO1xuICAgIH1cblxuICAgIHZhciBnZW9tZXRyeVR5cGUgPSB7XG4gICAgICBMaW5lU3RyaW5nOiBsaW5lLFxuICAgICAgTXVsdGlMaW5lU3RyaW5nOiBwb2x5Z29uLFxuICAgICAgUG9seWdvbjogcG9seWdvbixcbiAgICAgIE11bHRpUG9seWdvbjogZnVuY3Rpb24oYXJjcywgaSkgeyBhcmNzLmZvckVhY2goZnVuY3Rpb24oYXJjKSB7IHBvbHlnb24oYXJjLCBpKTsgfSk7IH1cbiAgICB9O1xuXG4gICAgb2JqZWN0cy5mb3JFYWNoKGdlb21ldHJ5KTtcblxuICAgIGZvciAodmFyIGkgaW4gaW5kZXhlc0J5QXJjKSB7XG4gICAgICBmb3IgKHZhciBpbmRleGVzID0gaW5kZXhlc0J5QXJjW2ldLCBtID0gaW5kZXhlcy5sZW5ndGgsIGogPSAwOyBqIDwgbTsgKytqKSB7XG4gICAgICAgIGZvciAodmFyIGsgPSBqICsgMTsgayA8IG07ICsraykge1xuICAgICAgICAgIHZhciBpaiA9IGluZGV4ZXNbal0sIGlrID0gaW5kZXhlc1trXSwgbjtcbiAgICAgICAgICBpZiAoKG4gPSBuZWlnaGJvcnNbaWpdKVtpID0gYmlzZWN0KG4sIGlrKV0gIT09IGlrKSBuLnNwbGljZShpLCAwLCBpayk7XG4gICAgICAgICAgaWYgKChuID0gbmVpZ2hib3JzW2lrXSlbaSA9IGJpc2VjdChuLCBpaildICE9PSBpaikgbi5zcGxpY2UoaSwgMCwgaWopO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIG5laWdoYm9ycztcbiAgfVxuXG4gIGZ1bmN0aW9uIHByZXNpbXBsaWZ5KHRvcG9sb2d5LCB0cmlhbmdsZUFyZWEpIHtcbiAgICB2YXIgYWJzb2x1dGUgPSB0cmFuc2Zvcm1BYnNvbHV0ZSh0b3BvbG9neS50cmFuc2Zvcm0pLFxuICAgICAgICByZWxhdGl2ZSA9IHRyYW5zZm9ybVJlbGF0aXZlKHRvcG9sb2d5LnRyYW5zZm9ybSksXG4gICAgICAgIGhlYXAgPSBtaW5BcmVhSGVhcCgpO1xuXG4gICAgaWYgKCF0cmlhbmdsZUFyZWEpIHRyaWFuZ2xlQXJlYSA9IGNhcnRlc2lhblRyaWFuZ2xlQXJlYTtcblxuICAgIHRvcG9sb2d5LmFyY3MuZm9yRWFjaChmdW5jdGlvbihhcmMpIHtcbiAgICAgIHZhciB0cmlhbmdsZXMgPSBbXSxcbiAgICAgICAgICBtYXhBcmVhID0gMCxcbiAgICAgICAgICB0cmlhbmdsZTtcblxuICAgICAgLy8gVG8gc3RvcmUgZWFjaCBwb2ludOKAmXMgZWZmZWN0aXZlIGFyZWEsIHdlIGNyZWF0ZSBhIG5ldyBhcnJheSByYXRoZXIgdGhhblxuICAgICAgLy8gZXh0ZW5kaW5nIHRoZSBwYXNzZWQtaW4gcG9pbnQgdG8gd29ya2Fyb3VuZCBhIENocm9tZS9WOCBidWcgKGdldHRpbmdcbiAgICAgIC8vIHN0dWNrIGluIHNtaSBtb2RlKS4gRm9yIG1pZHBvaW50cywgdGhlIGluaXRpYWwgZWZmZWN0aXZlIGFyZWEgb2ZcbiAgICAgIC8vIEluZmluaXR5IHdpbGwgYmUgY29tcHV0ZWQgaW4gdGhlIG5leHQgc3RlcC5cbiAgICAgIGZvciAodmFyIGkgPSAwLCBuID0gYXJjLmxlbmd0aCwgcDsgaSA8IG47ICsraSkge1xuICAgICAgICBwID0gYXJjW2ldO1xuICAgICAgICBhYnNvbHV0ZShhcmNbaV0gPSBbcFswXSwgcFsxXSwgSW5maW5pdHldLCBpKTtcbiAgICAgIH1cblxuICAgICAgZm9yICh2YXIgaSA9IDEsIG4gPSBhcmMubGVuZ3RoIC0gMTsgaSA8IG47ICsraSkge1xuICAgICAgICB0cmlhbmdsZSA9IGFyYy5zbGljZShpIC0gMSwgaSArIDIpO1xuICAgICAgICB0cmlhbmdsZVsxXVsyXSA9IHRyaWFuZ2xlQXJlYSh0cmlhbmdsZSk7XG4gICAgICAgIHRyaWFuZ2xlcy5wdXNoKHRyaWFuZ2xlKTtcbiAgICAgICAgaGVhcC5wdXNoKHRyaWFuZ2xlKTtcbiAgICAgIH1cblxuICAgICAgZm9yICh2YXIgaSA9IDAsIG4gPSB0cmlhbmdsZXMubGVuZ3RoOyBpIDwgbjsgKytpKSB7XG4gICAgICAgIHRyaWFuZ2xlID0gdHJpYW5nbGVzW2ldO1xuICAgICAgICB0cmlhbmdsZS5wcmV2aW91cyA9IHRyaWFuZ2xlc1tpIC0gMV07XG4gICAgICAgIHRyaWFuZ2xlLm5leHQgPSB0cmlhbmdsZXNbaSArIDFdO1xuICAgICAgfVxuXG4gICAgICB3aGlsZSAodHJpYW5nbGUgPSBoZWFwLnBvcCgpKSB7XG4gICAgICAgIHZhciBwcmV2aW91cyA9IHRyaWFuZ2xlLnByZXZpb3VzLFxuICAgICAgICAgICAgbmV4dCA9IHRyaWFuZ2xlLm5leHQ7XG5cbiAgICAgICAgLy8gSWYgdGhlIGFyZWEgb2YgdGhlIGN1cnJlbnQgcG9pbnQgaXMgbGVzcyB0aGFuIHRoYXQgb2YgdGhlIHByZXZpb3VzIHBvaW50XG4gICAgICAgIC8vIHRvIGJlIGVsaW1pbmF0ZWQsIHVzZSB0aGUgbGF0dGVyJ3MgYXJlYSBpbnN0ZWFkLiBUaGlzIGVuc3VyZXMgdGhhdCB0aGVcbiAgICAgICAgLy8gY3VycmVudCBwb2ludCBjYW5ub3QgYmUgZWxpbWluYXRlZCB3aXRob3V0IGVsaW1pbmF0aW5nIHByZXZpb3VzbHktXG4gICAgICAgIC8vIGVsaW1pbmF0ZWQgcG9pbnRzLlxuICAgICAgICBpZiAodHJpYW5nbGVbMV1bMl0gPCBtYXhBcmVhKSB0cmlhbmdsZVsxXVsyXSA9IG1heEFyZWE7XG4gICAgICAgIGVsc2UgbWF4QXJlYSA9IHRyaWFuZ2xlWzFdWzJdO1xuXG4gICAgICAgIGlmIChwcmV2aW91cykge1xuICAgICAgICAgIHByZXZpb3VzLm5leHQgPSBuZXh0O1xuICAgICAgICAgIHByZXZpb3VzWzJdID0gdHJpYW5nbGVbMl07XG4gICAgICAgICAgdXBkYXRlKHByZXZpb3VzKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChuZXh0KSB7XG4gICAgICAgICAgbmV4dC5wcmV2aW91cyA9IHByZXZpb3VzO1xuICAgICAgICAgIG5leHRbMF0gPSB0cmlhbmdsZVswXTtcbiAgICAgICAgICB1cGRhdGUobmV4dCk7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgYXJjLmZvckVhY2gocmVsYXRpdmUpO1xuICAgIH0pO1xuXG4gICAgZnVuY3Rpb24gdXBkYXRlKHRyaWFuZ2xlKSB7XG4gICAgICBoZWFwLnJlbW92ZSh0cmlhbmdsZSk7XG4gICAgICB0cmlhbmdsZVsxXVsyXSA9IHRyaWFuZ2xlQXJlYSh0cmlhbmdsZSk7XG4gICAgICBoZWFwLnB1c2godHJpYW5nbGUpO1xuICAgIH1cblxuICAgIHJldHVybiB0b3BvbG9neTtcbiAgfTtcblxuICBmdW5jdGlvbiBjYXJ0ZXNpYW5SaW5nQXJlYShyaW5nKSB7XG4gICAgdmFyIGkgPSAtMSxcbiAgICAgICAgbiA9IHJpbmcubGVuZ3RoLFxuICAgICAgICBhLFxuICAgICAgICBiID0gcmluZ1tuIC0gMV0sXG4gICAgICAgIGFyZWEgPSAwO1xuXG4gICAgd2hpbGUgKCsraSA8IG4pIHtcbiAgICAgIGEgPSBiO1xuICAgICAgYiA9IHJpbmdbaV07XG4gICAgICBhcmVhICs9IGFbMF0gKiBiWzFdIC0gYVsxXSAqIGJbMF07XG4gICAgfVxuXG4gICAgcmV0dXJuIGFyZWEgKiAuNTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGNhcnRlc2lhblRyaWFuZ2xlQXJlYSh0cmlhbmdsZSkge1xuICAgIHZhciBhID0gdHJpYW5nbGVbMF0sIGIgPSB0cmlhbmdsZVsxXSwgYyA9IHRyaWFuZ2xlWzJdO1xuICAgIHJldHVybiBNYXRoLmFicygoYVswXSAtIGNbMF0pICogKGJbMV0gLSBhWzFdKSAtIChhWzBdIC0gYlswXSkgKiAoY1sxXSAtIGFbMV0pKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGNvbXBhcmVBcmVhKGEsIGIpIHtcbiAgICByZXR1cm4gYVsxXVsyXSAtIGJbMV1bMl07XG4gIH1cblxuICBmdW5jdGlvbiBtaW5BcmVhSGVhcCgpIHtcbiAgICB2YXIgaGVhcCA9IHt9LFxuICAgICAgICBhcnJheSA9IFtdLFxuICAgICAgICBzaXplID0gMDtcblxuICAgIGhlYXAucHVzaCA9IGZ1bmN0aW9uKG9iamVjdCkge1xuICAgICAgdXAoYXJyYXlbb2JqZWN0Ll8gPSBzaXplXSA9IG9iamVjdCwgc2l6ZSsrKTtcbiAgICAgIHJldHVybiBzaXplO1xuICAgIH07XG5cbiAgICBoZWFwLnBvcCA9IGZ1bmN0aW9uKCkge1xuICAgICAgaWYgKHNpemUgPD0gMCkgcmV0dXJuO1xuICAgICAgdmFyIHJlbW92ZWQgPSBhcnJheVswXSwgb2JqZWN0O1xuICAgICAgaWYgKC0tc2l6ZSA+IDApIG9iamVjdCA9IGFycmF5W3NpemVdLCBkb3duKGFycmF5W29iamVjdC5fID0gMF0gPSBvYmplY3QsIDApO1xuICAgICAgcmV0dXJuIHJlbW92ZWQ7XG4gICAgfTtcblxuICAgIGhlYXAucmVtb3ZlID0gZnVuY3Rpb24ocmVtb3ZlZCkge1xuICAgICAgdmFyIGkgPSByZW1vdmVkLl8sIG9iamVjdDtcbiAgICAgIGlmIChhcnJheVtpXSAhPT0gcmVtb3ZlZCkgcmV0dXJuOyAvLyBpbnZhbGlkIHJlcXVlc3RcbiAgICAgIGlmIChpICE9PSAtLXNpemUpIG9iamVjdCA9IGFycmF5W3NpemVdLCAoY29tcGFyZUFyZWEob2JqZWN0LCByZW1vdmVkKSA8IDAgPyB1cCA6IGRvd24pKGFycmF5W29iamVjdC5fID0gaV0gPSBvYmplY3QsIGkpO1xuICAgICAgcmV0dXJuIGk7XG4gICAgfTtcblxuICAgIGZ1bmN0aW9uIHVwKG9iamVjdCwgaSkge1xuICAgICAgd2hpbGUgKGkgPiAwKSB7XG4gICAgICAgIHZhciBqID0gKChpICsgMSkgPj4gMSkgLSAxLFxuICAgICAgICAgICAgcGFyZW50ID0gYXJyYXlbal07XG4gICAgICAgIGlmIChjb21wYXJlQXJlYShvYmplY3QsIHBhcmVudCkgPj0gMCkgYnJlYWs7XG4gICAgICAgIGFycmF5W3BhcmVudC5fID0gaV0gPSBwYXJlbnQ7XG4gICAgICAgIGFycmF5W29iamVjdC5fID0gaSA9IGpdID0gb2JqZWN0O1xuICAgICAgfVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIGRvd24ob2JqZWN0LCBpKSB7XG4gICAgICB3aGlsZSAodHJ1ZSkge1xuICAgICAgICB2YXIgciA9IChpICsgMSkgPDwgMSxcbiAgICAgICAgICAgIGwgPSByIC0gMSxcbiAgICAgICAgICAgIGogPSBpLFxuICAgICAgICAgICAgY2hpbGQgPSBhcnJheVtqXTtcbiAgICAgICAgaWYgKGwgPCBzaXplICYmIGNvbXBhcmVBcmVhKGFycmF5W2xdLCBjaGlsZCkgPCAwKSBjaGlsZCA9IGFycmF5W2ogPSBsXTtcbiAgICAgICAgaWYgKHIgPCBzaXplICYmIGNvbXBhcmVBcmVhKGFycmF5W3JdLCBjaGlsZCkgPCAwKSBjaGlsZCA9IGFycmF5W2ogPSByXTtcbiAgICAgICAgaWYgKGogPT09IGkpIGJyZWFrO1xuICAgICAgICBhcnJheVtjaGlsZC5fID0gaV0gPSBjaGlsZDtcbiAgICAgICAgYXJyYXlbb2JqZWN0Ll8gPSBpID0gal0gPSBvYmplY3Q7XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIGhlYXA7XG4gIH1cblxuICBmdW5jdGlvbiB0cmFuc2Zvcm1BYnNvbHV0ZSh0cmFuc2Zvcm0pIHtcbiAgICBpZiAoIXRyYW5zZm9ybSkgcmV0dXJuIG5vb3A7XG4gICAgdmFyIHgwLFxuICAgICAgICB5MCxcbiAgICAgICAga3ggPSB0cmFuc2Zvcm0uc2NhbGVbMF0sXG4gICAgICAgIGt5ID0gdHJhbnNmb3JtLnNjYWxlWzFdLFxuICAgICAgICBkeCA9IHRyYW5zZm9ybS50cmFuc2xhdGVbMF0sXG4gICAgICAgIGR5ID0gdHJhbnNmb3JtLnRyYW5zbGF0ZVsxXTtcbiAgICByZXR1cm4gZnVuY3Rpb24ocG9pbnQsIGkpIHtcbiAgICAgIGlmICghaSkgeDAgPSB5MCA9IDA7XG4gICAgICBwb2ludFswXSA9ICh4MCArPSBwb2ludFswXSkgKiBreCArIGR4O1xuICAgICAgcG9pbnRbMV0gPSAoeTAgKz0gcG9pbnRbMV0pICoga3kgKyBkeTtcbiAgICB9O1xuICB9XG5cbiAgZnVuY3Rpb24gdHJhbnNmb3JtUmVsYXRpdmUodHJhbnNmb3JtKSB7XG4gICAgaWYgKCF0cmFuc2Zvcm0pIHJldHVybiBub29wO1xuICAgIHZhciB4MCxcbiAgICAgICAgeTAsXG4gICAgICAgIGt4ID0gdHJhbnNmb3JtLnNjYWxlWzBdLFxuICAgICAgICBreSA9IHRyYW5zZm9ybS5zY2FsZVsxXSxcbiAgICAgICAgZHggPSB0cmFuc2Zvcm0udHJhbnNsYXRlWzBdLFxuICAgICAgICBkeSA9IHRyYW5zZm9ybS50cmFuc2xhdGVbMV07XG4gICAgcmV0dXJuIGZ1bmN0aW9uKHBvaW50LCBpKSB7XG4gICAgICBpZiAoIWkpIHgwID0geTAgPSAwO1xuICAgICAgdmFyIHgxID0gKHBvaW50WzBdIC0gZHgpIC8ga3ggfCAwLFxuICAgICAgICAgIHkxID0gKHBvaW50WzFdIC0gZHkpIC8ga3kgfCAwO1xuICAgICAgcG9pbnRbMF0gPSB4MSAtIHgwO1xuICAgICAgcG9pbnRbMV0gPSB5MSAtIHkwO1xuICAgICAgeDAgPSB4MTtcbiAgICAgIHkwID0geTE7XG4gICAgfTtcbiAgfVxuXG4gIGZ1bmN0aW9uIG5vb3AoKSB7fVxuXG4gIGlmICh0eXBlb2YgZGVmaW5lID09PSBcImZ1bmN0aW9uXCIgJiYgZGVmaW5lLmFtZCkgZGVmaW5lKHRvcG9qc29uKTtcbiAgZWxzZSBpZiAodHlwZW9mIG1vZHVsZSA9PT0gXCJvYmplY3RcIiAmJiBtb2R1bGUuZXhwb3J0cykgbW9kdWxlLmV4cG9ydHMgPSB0b3BvanNvbjtcbiAgZWxzZSB0aGlzLnRvcG9qc29uID0gdG9wb2pzb247XG59KCk7XG4iXX0=
