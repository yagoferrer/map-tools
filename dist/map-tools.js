(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.mapTools = f()}})(function(){var define,module,exports;return (function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
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

//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJidWlsZC9hZGRGZWF0dXJlLmpzIiwiYnVpbGQvYWRkRmlsdGVyLmpzIiwiYnVpbGQvYWRkTWFwLmpzIiwiYnVpbGQvYWRkTWFya2VyLmpzIiwiYnVpbGQvYWRkUGFuZWwuanMiLCJidWlsZC9jZW50ZXIuanMiLCJidWlsZC9jb25maWcuanMiLCJidWlsZC9maWx0ZXIuanMiLCJidWlsZC9maW5kTWFya2VyQnlJZC5qcyIsImJ1aWxkL2luZm9XaW5kb3cuanMiLCJidWlsZC9sb2NhdGUuanMiLCJidWlsZC9tYXBUb29scy5qcyIsImJ1aWxkL21hcHMuanMiLCJidWlsZC9yZW1vdmVNYXJrZXIuanMiLCJidWlsZC9yZXNldE1hcmtlci5qcyIsImJ1aWxkL3RlbXBsYXRlLmpzIiwiYnVpbGQvdXBkYXRlRmVhdHVyZS5qcyIsImJ1aWxkL3VwZGF0ZU1hcC5qcyIsImJ1aWxkL3VwZGF0ZU1hcmtlci5qcyIsImJ1aWxkL3V0aWxzLmpzIiwibm9kZV9tb2R1bGVzL2Nyb3NzZmlsdGVyL2Nyb3NzZmlsdGVyLmpzIiwibm9kZV9tb2R1bGVzL2Nyb3NzZmlsdGVyL2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL3RvcG9qc29uL2Rpc3QvdG9wb2pzb24ubm9kZS5qcyIsIm5vZGVfbW9kdWxlcy90b3BvanNvbi9ub2RlX21vZHVsZXMvdG9wb2pzb24tY2xpZW50L2Rpc3QvdG9wb2pzb24tY2xpZW50LmpzIiwibm9kZV9tb2R1bGVzL3RvcG9qc29uL25vZGVfbW9kdWxlcy90b3BvanNvbi1zZXJ2ZXIvZGlzdC90b3BvanNvbi1zZXJ2ZXIuanMiLCJub2RlX21vZHVsZXMvdG9wb2pzb24vbm9kZV9tb2R1bGVzL3RvcG9qc29uLXNpbXBsaWZ5L2Rpc3QvdG9wb2pzb24tc2ltcGxpZnkuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQy9GQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxSUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5RkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNmQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDckdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2RUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNWQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzVFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbkNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDekRBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbkhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6M0NBO0FBQ0E7O0FDREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNiQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pmQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcDBCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbigpe2Z1bmN0aW9uIHIoZSxuLHQpe2Z1bmN0aW9uIG8oaSxmKXtpZighbltpXSl7aWYoIWVbaV0pe3ZhciBjPVwiZnVuY3Rpb25cIj09dHlwZW9mIHJlcXVpcmUmJnJlcXVpcmU7aWYoIWYmJmMpcmV0dXJuIGMoaSwhMCk7aWYodSlyZXR1cm4gdShpLCEwKTt2YXIgYT1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK2krXCInXCIpO3Rocm93IGEuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixhfXZhciBwPW5baV09e2V4cG9ydHM6e319O2VbaV1bMF0uY2FsbChwLmV4cG9ydHMsZnVuY3Rpb24ocil7dmFyIG49ZVtpXVsxXVtyXTtyZXR1cm4gbyhufHxyKX0scCxwLmV4cG9ydHMscixlLG4sdCl9cmV0dXJuIG5baV0uZXhwb3J0c31mb3IodmFyIHU9XCJmdW5jdGlvblwiPT10eXBlb2YgcmVxdWlyZSYmcmVxdWlyZSxpPTA7aTx0Lmxlbmd0aDtpKyspbyh0W2ldKTtyZXR1cm4gb31yZXR1cm4gcn0pKCkiLCIvLy8gPHJlZmVyZW5jZSBwYXRoPVwidHlwaW5ncy90c2QuZC50c1wiLz5cbnZhciB0b3BvanNvbiA9IHJlcXVpcmUoJ3RvcG9qc29uJyk7XG52YXIgdXRpbHMgPSByZXF1aXJlKCcuL3V0aWxzJyk7XG52YXIgYWRkRmlsdGVyID0gcmVxdWlyZSgnLi9hZGRGaWx0ZXInKTtcbnZhciBBZGRGZWF0dXJlID0gKGZ1bmN0aW9uICgpIHtcbiAgICBmdW5jdGlvbiBBZGRGZWF0dXJlKHRoYXQpIHtcbiAgICAgICAgdGhpcy50aGF0ID0gdGhhdDtcbiAgICAgICAgdmFyIGFkZEZpbHRlckluc3RhbmNlID0gbmV3IGFkZEZpbHRlcih0aGF0LCAnanNvbicpO1xuICAgICAgICB0aGlzLmFkZEZpbHRlciA9IGZ1bmN0aW9uIChmaWx0ZXJzKSB7XG4gICAgICAgICAgICByZXR1cm4gYWRkRmlsdGVySW5zdGFuY2UuYWRkRmlsdGVyKGZpbHRlcnMpO1xuICAgICAgICB9O1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBBZGRzIEdlb0pTT04gRmVhdHVyZSBPcHRpb25zIGxpa2U6IHN0eWxlXG4gICAgICogQHBhcmFtIGZlYXR1cmVzXG4gICAgICogQHBhcmFtIG9wdGlvbnNcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIEFkZEZlYXR1cmUucHJvdG90eXBlLmFkZEZlYXR1cmVPcHRpb25zID0gZnVuY3Rpb24gKGZlYXR1cmVzLCBvcHRpb25zKSB7XG4gICAgICAgIHZhciBmZWF0dXJlLCB4O1xuICAgICAgICBmb3IgKHggaW4gZmVhdHVyZXMpIHtcbiAgICAgICAgICAgIGlmIChmZWF0dXJlcy5oYXNPd25Qcm9wZXJ0eSh4KSkge1xuICAgICAgICAgICAgICAgIGZlYXR1cmUgPSBmZWF0dXJlc1t4XTtcbiAgICAgICAgICAgICAgICB2YXIgdWlkID0gdXRpbHMuY3JlYXRlVWlkKCk7XG4gICAgICAgICAgICAgICAgZmVhdHVyZS51aWQgPSB1aWQ7XG4gICAgICAgICAgICAgICAgZmVhdHVyZS5kYXRhID0geyB1aWQ6IHVpZCB9O1xuICAgICAgICAgICAgICAgIGZlYXR1cmUuZm9yRWFjaFByb3BlcnR5KGZ1bmN0aW9uICh2YWx1ZSwga2V5KSB7XG4gICAgICAgICAgICAgICAgICAgIGZlYXR1cmUuZGF0YVtrZXldID0gdmFsdWU7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgaWYgKG9wdGlvbnMpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKG9wdGlvbnMuZmlsdGVycykge1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gQWRkIGZpbHRlcnMgaWYgbm90IGRlZmluZWQuXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoIXRoaXMudGhhdC5qc29uLmZpbHRlcikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuYWRkRmlsdGVyKG9wdGlvbnMuZmlsdGVycyk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnRoYXQuanNvbi5jcm9zc2ZpbHRlci5hZGQoW2ZlYXR1cmVdKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBpZiAob3B0aW9ucy5zdHlsZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy50aGF0Lmluc3RhbmNlLmRhdGEub3ZlcnJpZGVTdHlsZShmZWF0dXJlLCBvcHRpb25zLnN0eWxlKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB0aGlzLnRoYXQuanNvbi5hbGxbZmVhdHVyZS5kYXRhLnVpZF0gPSBmZWF0dXJlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfTtcbiAgICAvKipcbiAgICAgKiBBZGRzIGEgVG9wbyBKU09OIGZpbGUgaW50byBhIE1hcFxuICAgICAqIEBwYXJhbSBkYXRhIFRoZSBwYXJzZWQgSlNPTiBGaWxlXG4gICAgICogQHBhcmFtIG9wdGlvbnNcbiAgICAgKi9cbiAgICBBZGRGZWF0dXJlLnByb3RvdHlwZS5hZGRUb3BvSnNvbiA9IGZ1bmN0aW9uIChkYXRhLCBvcHRpb25zKSB7XG4gICAgICAgIHZhciBpdGVtLCBnZW9Kc29uLCBmZWF0dXJlcywgeDtcbiAgICAgICAgZm9yICh4IGluIG9wdGlvbnMpIHtcbiAgICAgICAgICAgIGlmIChvcHRpb25zLmhhc093blByb3BlcnR5KHgpKSB7XG4gICAgICAgICAgICAgICAgaXRlbSA9IG9wdGlvbnNbeF07XG4gICAgICAgICAgICAgICAgZ2VvSnNvbiA9IHRvcG9qc29uLmZlYXR1cmUoZGF0YSwgZGF0YS5vYmplY3RzW2l0ZW0ub2JqZWN0XSk7XG4gICAgICAgICAgICAgICAgZmVhdHVyZXMgPSB0aGlzLnRoYXQuaW5zdGFuY2UuZGF0YS5hZGRHZW9Kc29uKGdlb0pzb24pO1xuICAgICAgICAgICAgICAgIHRoaXMuYWRkRmVhdHVyZU9wdGlvbnMoZmVhdHVyZXMsIGl0ZW0pO1xuICAgICAgICAgICAgICAgIG1hcFRvb2xzLm1hcHNbdGhpcy50aGF0LmlkXS5qc29uLmFsbFtpdGVtLm9iamVjdF0gPSBmZWF0dXJlcztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gZmVhdHVyZXM7XG4gICAgfTtcbiAgICBBZGRGZWF0dXJlLnByb3RvdHlwZS5hZGRHZW9Kc29uID0gZnVuY3Rpb24gKGRhdGEsIG9wdGlvbnMpIHtcbiAgICAgICAgdmFyIGZlYXR1cmVzID0gdGhpcy50aGF0Lmluc3RhbmNlLmRhdGEuYWRkR2VvSnNvbihkYXRhLCBvcHRpb25zKTtcbiAgICAgICAgdGhpcy5hZGRGZWF0dXJlT3B0aW9ucyhmZWF0dXJlcywgb3B0aW9ucyk7XG4gICAgICAgIHJldHVybiBmZWF0dXJlcztcbiAgICB9O1xuICAgIHJldHVybiBBZGRGZWF0dXJlO1xufSkoKTtcbm1vZHVsZS5leHBvcnRzID0gQWRkRmVhdHVyZTtcbiIsIi8vLyA8cmVmZXJlbmNlIHBhdGg9XCJ0eXBpbmdzL3RzZC5kLnRzXCIvPlxudmFyIHV0aWxzID0gcmVxdWlyZSgnLi91dGlscycpO1xudmFyIEFkZEZpbHRlciA9IChmdW5jdGlvbiAoKSB7XG4gICAgZnVuY3Rpb24gQWRkRmlsdGVyKHRoYXQsIHR5cGUpIHtcbiAgICAgICAgdGhpcy50aGF0ID0gdGhhdDtcbiAgICAgICAgdGhpcy50eXBlID0gdHlwZTtcbiAgICB9XG4gICAgQWRkRmlsdGVyLnByb3RvdHlwZS5hZGRGaWx0ZXIgPSBmdW5jdGlvbiAoZmlsdGVycykge1xuICAgICAgICB0aGlzLnRoYXRbdGhpcy50eXBlXS5jcm9zc2ZpbHRlciA9IHRoaXMudGhhdFt0aGlzLnR5cGVdLmNyb3NzZmlsdGVyIHx8IHRoaXMudGhhdC5jcm9zc2ZpbHRlcihbXSk7XG4gICAgICAgIHRoaXMudGhhdFt0aGlzLnR5cGVdLmZpbHRlciA9IHRoaXMudGhhdFt0aGlzLnR5cGVdLmZpbHRlciB8fCB7fTtcbiAgICAgICAgdmFyIGRpbWVuc2lvbiwgaXRlbTtcbiAgICAgICAgaWYgKHR5cGVvZiBmaWx0ZXJzID09PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgZmlsdGVycyA9IFtmaWx0ZXJzXTtcbiAgICAgICAgfVxuICAgICAgICBmb3IgKGRpbWVuc2lvbiBpbiBmaWx0ZXJzKSB7XG4gICAgICAgICAgICBpZiAoZmlsdGVycy5oYXNPd25Qcm9wZXJ0eShkaW1lbnNpb24pKSB7XG4gICAgICAgICAgICAgICAgaXRlbSA9IGZpbHRlcnNbZGltZW5zaW9uXTtcbiAgICAgICAgICAgICAgICBpZiAodHlwZW9mIGl0ZW0gPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMudGhhdFt0aGlzLnR5cGVdLmZpbHRlcltpdGVtXSA9IHRoaXMudGhhdFt0aGlzLnR5cGVdLmNyb3NzZmlsdGVyLmRpbWVuc2lvbih1dGlscy5kZWZhdWx0RGltZW5zaW9uKGl0ZW0pKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMudGhhdFt0aGlzLnR5cGVdLmZpbHRlcltPYmplY3Qua2V5cyhpdGVtKVswXV0gPSB0aGlzLnRoYXRbdGhpcy50eXBlXS5jcm9zc2ZpbHRlci5kaW1lbnNpb24oaXRlbVtPYmplY3Qua2V5cyhpdGVtKVswXV0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH07XG4gICAgcmV0dXJuIEFkZEZpbHRlcjtcbn0pKCk7XG5tb2R1bGUuZXhwb3J0cyA9IEFkZEZpbHRlcjtcbiIsIi8vLyA8cmVmZXJlbmNlIHBhdGg9XCJ0eXBpbmdzL3RzZC5kLnRzXCIvPlxudmFyIG1hcHMgPSByZXF1aXJlKCcuL21hcHMnKTtcbnZhciBjb25maWcgPSByZXF1aXJlKCcuL2NvbmZpZycpO1xudmFyIEFkZE1hcCA9IChmdW5jdGlvbiAoKSB7XG4gICAgZnVuY3Rpb24gQWRkTWFwKHRoYXQpIHtcbiAgICAgICAgdGhpcy50aGF0ID0gdGhhdDtcbiAgICB9XG4gICAgQWRkTWFwLnByb3RvdHlwZS5nZXRFbGVtZW50ID0gZnVuY3Rpb24gKGFyZ3MpIHtcbiAgICAgICAgaWYgKGFyZ3MuZWwpIHtcbiAgICAgICAgICAgIHJldHVybiB3aW5kb3cuZG9jdW1lbnQucXVlcnlTZWxlY3RvcihhcmdzLmVsKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoYXJncy5pZCkge1xuICAgICAgICAgICAgcmV0dXJuIHdpbmRvdy5kb2N1bWVudC5nZXRFbGVtZW50QnlJZChhcmdzLmlkKTtcbiAgICAgICAgfVxuICAgIH07XG4gICAgQWRkTWFwLnByb3RvdHlwZS5jcmVhdGUgPSBmdW5jdGlvbiAoYXJncywgY2IpIHtcbiAgICAgICAgdmFyIF90aGlzID0gdGhpcztcbiAgICAgICAgY2IgPSBjYiB8fCBmdW5jdGlvbiAoKSB7XG4gICAgICAgIH07XG4gICAgICAgIHZhciBtYXBPcHRpb25zID0gbWFwcy5tYXBPcHRpb25zKGFyZ3MpO1xuICAgICAgICBhcmdzLmlkID0gYXJncy5pZCB8fCBhcmdzLmVsLnN1YnN0cmluZygxKTtcbiAgICAgICAgdGhpcy50aGF0LmlkID0gYXJncy5pZDtcbiAgICAgICAgdGhpcy50aGF0Lm9wdGlvbnMgPSBhcmdzO1xuICAgICAgICB0aGlzLnRoYXQuaW5zdGFuY2UgPSBuZXcgZ29vZ2xlLm1hcHMuTWFwKHRoaXMuZ2V0RWxlbWVudChhcmdzKSwgbWFwT3B0aW9ucyk7XG4gICAgICAgIHRoaXMudGhhdC5ldmVudHMgPSBbXTtcbiAgICAgICAgLy8gQWRkIEV2ZW50c1xuICAgICAgICBpZiAoYXJncy5vbikge1xuICAgICAgICAgICAgdmFyIGk7XG4gICAgICAgICAgICBmb3IgKGkgaW4gYXJncy5vbikge1xuICAgICAgICAgICAgICAgIGlmIChhcmdzLm9uLmhhc093blByb3BlcnR5KGkpKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChjb25maWcuY3VzdG9tRXZlbnRzLmluZGV4T2YoaSkgPiAtMSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy50aGF0LmV2ZW50cy5wdXNoKGkpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGdvb2dsZS5tYXBzLmV2ZW50LmFkZExpc3RlbmVyKHRoaXMudGhhdC5pbnN0YW5jZSwgaSwgYXJncy5vbltpXSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHRoaXMudGhhdC5pbmZvV2luZG93ID0gZmFsc2U7XG4gICAgICAgIHRoaXMudGhhdC50ZW1wbGF0ZXMgPSB7XG4gICAgICAgICAgICBpbmZvV2luZG93OiB7fSxcbiAgICAgICAgICAgIHBhbmVsOiB7fVxuICAgICAgICB9O1xuICAgICAgICB0aGlzLnRoYXQudWlkID0gYXJncy51aWQ7XG4gICAgICAgIG1hcFRvb2xzLm1hcHNbdGhpcy50aGF0LmlkXS5pbnN0YW5jZSA9IHRoaXMudGhhdC5pbnN0YW5jZTtcbiAgICAgICAgZ29vZ2xlLm1hcHMuZXZlbnQuYWRkTGlzdGVuZXJPbmNlKHRoaXMudGhhdC5pbnN0YW5jZSwgJ2lkbGUnLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBjYihmYWxzZSwgX3RoaXMudGhhdCk7XG4gICAgICAgIH0pO1xuICAgIH07XG4gICAgQWRkTWFwLnByb3RvdHlwZS52YWxpZE9wdGlvbnMgPSBmdW5jdGlvbiAob3B0aW9ucywgY2IpIHtcbiAgICAgICAgaWYgKCFvcHRpb25zIHx8IChvcHRpb25zICYmIHR5cGVvZiBvcHRpb25zICE9PSAnb2JqZWN0JykpIHtcbiAgICAgICAgICAgIGNiKG5ldyBFcnJvcignWW91IG11c3QgcGFzcyBhIHZhbGlkIGZpcnN0IHBhcmFtZXRlcjogb3B0aW9ucycpKTtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoIW9wdGlvbnMuaWQgJiYgIW9wdGlvbnMuZWwpIHtcbiAgICAgICAgICAgIGNiKG5ldyBFcnJvcignWW91IG11c3QgcGFzcyBhbiBcImlkXCIgb3IgYSBcImVsXCIgcHJvcGVydHkgdmFsdWVzJykpO1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG4gICAgICAgIGlmICghb3B0aW9ucy5sYXQgfHwgIW9wdGlvbnMubG5nKSB7XG4gICAgICAgICAgICBjYihuZXcgRXJyb3IoJ1lvdSBtdXN0IHBhc3MgdmFsaWQgXCJsYXRcIiAobGF0aXR1ZGUpIGFuZCBcImxuZ1wiIChsb25naXR1ZGUpIHZhbHVlcycpKTtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9O1xuICAgIEFkZE1hcC5wcm90b3R5cGUubG9hZCA9IGZ1bmN0aW9uIChvcHRpb25zLCBjYikge1xuICAgICAgICBpZiAodGhpcy52YWxpZE9wdGlvbnMob3B0aW9ucywgY2IpKSB7XG4gICAgICAgICAgICB2YXIgaWQgPSBvcHRpb25zLmlkIHx8IG9wdGlvbnMuZWwuc3Vic3RyaW5nKDEpO1xuICAgICAgICAgICAgbWFwVG9vbHMubWFwcyA9IG1hcFRvb2xzLm1hcHMgfHwge307XG4gICAgICAgICAgICBpZiAobWFwVG9vbHMubWFwc1tpZF0pIHtcbiAgICAgICAgICAgICAgICB2YXIgbXNnID0gJ1RoZXJlIGlzIGFscmVhZHkgYW5vdGhlciBNYXAgdXNpbmcgdGhlIHNhbWUgaWQ6ICcgKyBpZDtcbiAgICAgICAgICAgICAgICBjYihuZXcgRXJyb3IobXNnKSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdmFyIHRoYXQgPSB0aGlzO1xuICAgICAgICAgICAgbWFwVG9vbHMubWFwc1tpZF0gPSB7XG4gICAgICAgICAgICAgICAgY3JlYXRlOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoYXQuY3JlYXRlKHRoaXMuYXJndW1lbnRzLCBjYik7XG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBhcmd1bWVudHM6IG9wdGlvbnNcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICAvLyBTZXQgR2xvYmFsIFN0cnVjdHVyZVxuICAgICAgICAgICAgbWFwVG9vbHMubWFwc1tpZF0ubWFya2VycyA9IG1hcFRvb2xzLm1hcHNbaWRdLm1hcmtlcnMgfHwgeyBhbGw6IHt9LCB0YWdzOiB7fSwgZGF0YUNoYW5nZWQ6IGZhbHNlIH07XG4gICAgICAgICAgICBtYXBUb29scy5tYXBzW2lkXS5qc29uID0gbWFwVG9vbHMubWFwc1tpZF0uanNvbiB8fCB7IGFsbDoge30sIGRhdGFDaGFuZ2VkOiBmYWxzZSB9O1xuICAgICAgICAgICAgdGhpcy50aGF0Lm1hcmtlcnMgPSBtYXBUb29scy5tYXBzW2lkXS5tYXJrZXJzO1xuICAgICAgICAgICAgdGhpcy50aGF0Lmpzb24gPSBtYXBUb29scy5tYXBzW2lkXS5qc29uO1xuICAgICAgICAgICAgaWYgKG9wdGlvbnMuYXN5bmMgIT09IGZhbHNlIHx8IG9wdGlvbnMuc3luYyA9PT0gdHJ1ZSkge1xuICAgICAgICAgICAgICAgIG1hcHMubG9hZChpZCwgb3B0aW9ucyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICBtYXBUb29scy5tYXBzW2lkXS5jcmVhdGUoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH07XG4gICAgcmV0dXJuIEFkZE1hcDtcbn0pKCk7XG5tb2R1bGUuZXhwb3J0cyA9IEFkZE1hcDtcbiIsIi8vLyA8cmVmZXJlbmNlIHBhdGg9XCJ0eXBpbmdzL3RzZC5kLnRzXCIvPlxudmFyIHV0aWxzID0gcmVxdWlyZSgnLi91dGlscycpO1xudmFyIGFkZEZpbHRlciA9IHJlcXVpcmUoJy4vYWRkRmlsdGVyJyk7XG52YXIgaW5mb1dpbmRvdyA9IHJlcXVpcmUoJy4vaW5mb1dpbmRvdycpO1xudmFyIEFkZE1hcmtlciA9IChmdW5jdGlvbiAoKSB7XG4gICAgZnVuY3Rpb24gQWRkTWFya2VyKHRoYXQpIHtcbiAgICAgICAgdGhpcy50aGF0ID0gdGhhdDtcbiAgICAgICAgdGhpcy5pbmZvV2luZG93ID0ge307XG4gICAgICAgIHZhciBhZGRGaWx0ZXJJbnN0YW5jZSA9IG5ldyBhZGRGaWx0ZXIodGhhdCwgJ21hcmtlcnMnKTtcbiAgICAgICAgdGhpcy5hZGRGaWx0ZXIgPSBmdW5jdGlvbiAoZmlsdGVycykge1xuICAgICAgICAgICAgcmV0dXJuIGFkZEZpbHRlckluc3RhbmNlLmFkZEZpbHRlcihmaWx0ZXJzKTtcbiAgICAgICAgfTtcbiAgICAgICAgdmFyIGluZm9XaW5kb3dJbnN0YW5jZSA9IG5ldyBpbmZvV2luZG93KHRoYXQpO1xuICAgICAgICB0aGlzLmluZm9XaW5kb3cuYWRkRXZlbnRzID0gZnVuY3Rpb24gKG1hcmtlciwgb3B0aW9ucywgbWFwKSB7XG4gICAgICAgICAgICBpbmZvV2luZG93SW5zdGFuY2UuYWRkRXZlbnRzKG1hcmtlciwgb3B0aW9ucywgbWFwKTtcbiAgICAgICAgfTtcbiAgICB9XG4gICAgQWRkTWFya2VyLnByb3RvdHlwZS5hZGRFeHRyYU9wdGlvbnMgPSBmdW5jdGlvbiAobWFya2VyLCBvcHRpb25zKSB7XG4gICAgICAgIHZhciBpO1xuICAgICAgICBmb3IgKGkgaW4gb3B0aW9ucykge1xuICAgICAgICAgICAgaWYgKG9wdGlvbnMuaGFzT3duUHJvcGVydHkoaSkpIHtcbiAgICAgICAgICAgICAgICBpZiAoIW9wdGlvbnMuZmlsdGVycykge1xuICAgICAgICAgICAgICAgICAgICBtYXJrZXJbaV0gPSBvcHRpb25zW2ldO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH07XG4gICAgQWRkTWFya2VyLnByb3RvdHlwZS5hZGRPcHRpb25zID0gZnVuY3Rpb24gKG1hcmtlciwgaW5zdGFuY2UpIHtcbiAgICAgICAgaWYgKG1hcmtlci5tb3ZlKSB7XG4gICAgICAgICAgICBpbnN0YW5jZS5zZXRBbmltYXRpb24oZ29vZ2xlLm1hcHMuQW5pbWF0aW9uW21hcmtlci5tb3ZlLnRvVXBwZXJDYXNlKCldKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAobWFya2VyLmluZm9XaW5kb3cpIHtcbiAgICAgICAgICAgIHRoaXMuaW5mb1dpbmRvdy5hZGRFdmVudHMoaW5zdGFuY2UsIG1hcmtlci5pbmZvV2luZG93LCB0aGlzLnRoYXQuaW5zdGFuY2UpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChtYXJrZXIub24pIHtcbiAgICAgICAgICAgIHRoaXMuYWRkRXZlbnRzKG1hcmtlciwgaW5zdGFuY2UpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChtYXJrZXIuY2FsbGJhY2spIHtcbiAgICAgICAgICAgIG1hcmtlci5jYWxsYmFjayhpbnN0YW5jZSk7XG4gICAgICAgIH1cbiAgICB9O1xuICAgIEFkZE1hcmtlci5wcm90b3R5cGUuX2FkZE1hcmtlciA9IGZ1bmN0aW9uIChtYXJrZXIsIG9wdGlvbnMpIHtcbiAgICAgICAgbWFya2VyLm1hcCA9IHRoaXMudGhhdC5pbnN0YW5jZTtcbiAgICAgICAgbWFya2VyLnBvc2l0aW9uID0gbmV3IGdvb2dsZS5tYXBzLkxhdExuZyhtYXJrZXIubGF0LCBtYXJrZXIubG5nKTtcbiAgICAgICAgLy8gQWRkcyBvcHRpb25zIHNldCB2aWEgMm5kIHBhcmFtZXRlci4gT3ZlcndyaXRlcyBhbnkgTWFya2VyIG9wdGlvbnMgYWxyZWFkeSBzZXQuXG4gICAgICAgIGlmIChvcHRpb25zKSB7XG4gICAgICAgICAgICB0aGlzLmFkZEV4dHJhT3B0aW9ucyhtYXJrZXIsIG9wdGlvbnMpO1xuICAgICAgICB9XG4gICAgICAgIG1hcmtlci5kYXRhID0gbWFya2VyLmRhdGEgfHwge307XG4gICAgICAgIG1hcmtlci5kYXRhLl9zZWxmID0gbWFya2VyOyAvLyBUaGlzIGhlbHBzIG1lIHRvIGRvIGxhdGVyIHJlc2V0TWFya2VyKClcbiAgICAgICAgdGhpcy5zZXRVaWQobWFya2VyKTtcbiAgICAgICAgLy8gQmVjYXVzZSB3ZSBhcmUgbm90IGFsbG93aW5nIGR1cGxpY2F0ZXNcbiAgICAgICAgaWYgKHRoaXMudGhhdC5tYXJrZXJzLmFsbFttYXJrZXIudWlkXSkge1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG4gICAgICAgIGlmIChvcHRpb25zICYmIG9wdGlvbnMuZmlsdGVycykge1xuICAgICAgICAgICAgLy8gT25seSBhZGQgZmlsdGVycyBpZiBub3QgZGVmaW5lZC5cbiAgICAgICAgICAgIGlmICghbWFwVG9vbHMubWFwc1t0aGlzLnRoYXQuaWRdLm1hcmtlcnMuZmlsdGVyKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5hZGRGaWx0ZXIob3B0aW9ucy5maWx0ZXJzKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICB2YXIgaW5zdGFuY2UgPSBuZXcgZ29vZ2xlLm1hcHMuTWFya2VyKG1hcmtlcik7XG4gICAgICAgIHRoaXMudGhhdC5tYXJrZXJzLmNyb3NzZmlsdGVyID0gdGhpcy50aGF0Lm1hcmtlcnMuY3Jvc3NmaWx0ZXIgfHwgdGhpcy50aGF0LmNyb3NzZmlsdGVyKFtdKTtcbiAgICAgICAgdGhpcy50aGF0Lm1hcmtlcnMuZmlsdGVyID0gdGhpcy50aGF0Lm1hcmtlcnMuZmlsdGVyIHx8IHt9O1xuICAgICAgICB0aGlzLnRoYXQubWFya2Vycy5jcm9zc2ZpbHRlci5hZGQoW2luc3RhbmNlXSk7XG4gICAgICAgIHRoaXMuYWRkT3B0aW9ucyhtYXJrZXIsIGluc3RhbmNlKTtcbiAgICAgICAgLy8gQWRkcyBNYXJrZXIgUmVmZXJlbmNlIG9mIGVhY2ggTWFya2VyIHRvIFwibWFya2Vycy5hbGxcIlxuICAgICAgICB0aGlzLnRoYXQubWFya2Vycy5hbGwgPSBtYXBUb29scy5tYXBzW3RoaXMudGhhdC5pZF0ubWFya2Vycy5hbGwgfHwge307XG4gICAgICAgIHRoaXMudGhhdC5tYXJrZXJzLmFsbFttYXJrZXIudWlkXSA9IGluc3RhbmNlO1xuICAgICAgICBpZiAobWFya2VyLnRhZ3MpIHtcbiAgICAgICAgICAgIHRoaXMuYWRkTWFya2VyQnlUYWcobWFya2VyLCBpbnN0YW5jZSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGluc3RhbmNlO1xuICAgIH07XG4gICAgQWRkTWFya2VyLnByb3RvdHlwZS5zZXRVaWQgPSBmdW5jdGlvbiAobWFya2VyKSB7XG4gICAgICAgIGlmICh0aGlzLnRoYXQudWlkICYmIG1hcmtlclt0aGlzLnRoYXQudWlkXSkge1xuICAgICAgICAgICAgbWFya2VyLmRhdGEudWlkID0gbWFya2VyW3RoaXMudGhhdC51aWRdO1xuICAgICAgICAgICAgbWFya2VyLnVpZCA9IG1hcmtlci5kYXRhLnVpZDtcbiAgICAgICAgfVxuICAgICAgICBpZiAobWFya2VyLmRhdGEudWlkICYmICFtYXJrZXIudWlkKSB7XG4gICAgICAgICAgICBtYXJrZXIudWlkID0gbWFya2VyLmRhdGEudWlkO1xuICAgICAgICB9XG4gICAgICAgIGlmICghbWFya2VyLnVpZCkge1xuICAgICAgICAgICAgbWFya2VyLmRhdGEudWlkID0gdXRpbHMuY3JlYXRlVWlkKCk7XG4gICAgICAgICAgICBtYXJrZXIudWlkID0gbWFya2VyLmRhdGEudWlkO1xuICAgICAgICB9XG4gICAgfTtcbiAgICBBZGRNYXJrZXIucHJvdG90eXBlLmFkZE1hcmtlckJ5VGFnID0gZnVuY3Rpb24gKG1hcmtlciwgaW5zdGFuY2UpIHtcbiAgICAgICAgaWYgKHV0aWxzLmlzQXJyYXkobWFya2VyLnRhZ3MpKSB7XG4gICAgICAgICAgICB2YXIgaSwgdGFnO1xuICAgICAgICAgICAgZm9yIChpIGluIG1hcmtlci50YWdzKSB7XG4gICAgICAgICAgICAgICAgaWYgKG1hcmtlci50YWdzLmhhc093blByb3BlcnR5KGkpKSB7XG4gICAgICAgICAgICAgICAgICAgIHRhZyA9IG1hcmtlci50YWdzW2ldO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnRoYXQubWFya2Vycy50YWdzW3RhZ10gPSB0aGlzLnRoYXQubWFya2Vycy50YWdzW3RhZ10gfHwge307XG4gICAgICAgICAgICAgICAgICAgIHRoaXMudGhhdC5tYXJrZXJzLnRhZ3NbdGFnXVtpbnN0YW5jZS5kYXRhLnVpZF0gPSBpbnN0YW5jZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICB0aGlzLnRoYXQubWFya2Vycy50YWdzW21hcmtlci50YWdzXSA9IHRoaXMudGhhdC5tYXJrZXJzLnRhZ3NbbWFya2VyLnRhZ3NdIHx8IHt9O1xuICAgICAgICAgICAgdGhpcy50aGF0Lm1hcmtlcnMudGFnc1ttYXJrZXIudGFnc11baW5zdGFuY2UuZGF0YS51aWRdID0gaW5zdGFuY2U7XG4gICAgICAgIH1cbiAgICB9O1xuICAgIEFkZE1hcmtlci5wcm90b3R5cGUuYWRkRXZlbnRzID0gZnVuY3Rpb24gKG1hcmtlciwgaW5zdGFuY2UpIHtcbiAgICAgICAgdmFyIGk7XG4gICAgICAgIGZvciAoaSBpbiBtYXJrZXIub24pIHtcbiAgICAgICAgICAgIGlmIChtYXJrZXIub24uaGFzT3duUHJvcGVydHkoaSkpIHtcbiAgICAgICAgICAgICAgICBnb29nbGUubWFwcy5ldmVudC5hZGRMaXN0ZW5lcihpbnN0YW5jZSwgaSwgbWFya2VyLm9uW2ldKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH07XG4gICAgLyoqXG4gICAgICogQWRkcyBNYXJrZXJzIHRvIHRoZSBNYXBcbiAgICAgKiBAcGFyYW0gYXJncyBBcnJheSBvciBNYXJrZXJzXG4gICAgICogQHBhcmFtIG9wdGlvbnMgdGhpbmdzIGxpa2UgZ3JvdXBzIGV0Y1xuICAgICAqIEByZXR1cm5zIHtBcnJheX0gYWxsIHRoZSBpbnN0YW5jZXMgb2YgdGhlIG1hcmtlcnMuXG4gICAgICovXG4gICAgQWRkTWFya2VyLnByb3RvdHlwZS5hZGRNYXJrZXIgPSBmdW5jdGlvbiAoYXJncywgb3B0aW9ucykge1xuICAgICAgICBpZiAodXRpbHMuaXNBcnJheShhcmdzKSkge1xuICAgICAgICAgICAgaWYgKGFyZ3MubGVuZ3RoID49IDEpIHtcbiAgICAgICAgICAgICAgICB2YXIgbWFya2VyLCBtYXJrZXJzID0gW107XG4gICAgICAgICAgICAgICAgZm9yICh2YXIgaSBpbiBhcmdzKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChhcmdzLmhhc093blByb3BlcnR5KGkpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBtYXJrZXIgPSB0aGlzLl9hZGRNYXJrZXIoYXJnc1tpXSwgb3B0aW9ucyk7XG4gICAgICAgICAgICAgICAgICAgICAgICBtYXJrZXJzLnB1c2gobWFya2VyKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB0aGlzLnRoYXQubWFya2Vycy5kYXRhQ2hhbmdlZCA9IHRydWU7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG1hcmtlcnM7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gW107XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy50aGF0Lm1hcmtlcnMuZGF0YUNoYW5nZWQgPSB0cnVlO1xuICAgICAgICByZXR1cm4gdGhpcy5fYWRkTWFya2VyKGFyZ3MsIG9wdGlvbnMpO1xuICAgIH07XG4gICAgcmV0dXJuIEFkZE1hcmtlcjtcbn0pKCk7XG5tb2R1bGUuZXhwb3J0cyA9IEFkZE1hcmtlcjtcbiIsIi8vLyA8cmVmZXJlbmNlIHBhdGg9XCJ0ZW1wbGF0ZS50c1wiLz5cbi8vLyA8cmVmZXJlbmNlIHBhdGg9XCJjb25maWcudHNcIi8+XG4vLy8gPHJlZmVyZW5jZSBwYXRoPVwidHlwaW5ncy90c2QuZC50c1wiLz5cbnZhciBjb25maWcgPSByZXF1aXJlKCcuL2NvbmZpZycpO1xudmFyIHRlbXBsYXRlID0gcmVxdWlyZSgnLi90ZW1wbGF0ZScpO1xudmFyIEFkZFBhbmVsID0gKGZ1bmN0aW9uICgpIHtcbiAgICBmdW5jdGlvbiBBZGRQYW5lbCh0aGF0KSB7XG4gICAgICAgIHRoaXMudGhhdCA9IHRoYXQ7XG4gICAgICAgIHZhciB0ZW1wbGF0ZUluc3RhbmNlID0gbmV3IHRlbXBsYXRlKHRoYXQpO1xuICAgICAgICB0aGlzLnRlbXBsYXRlID0gZnVuY3Rpb24gKHR5cGUsIHVybCwgY2IpIHtcbiAgICAgICAgICAgIHJldHVybiB0ZW1wbGF0ZUluc3RhbmNlLmxvYWQodHlwZSwgdXJsLCBjYik7XG4gICAgICAgIH07XG4gICAgfVxuICAgIEFkZFBhbmVsLnByb3RvdHlwZS5nZXRQb3NpdGlvbktleSA9IGZ1bmN0aW9uIChwb3MpIHtcbiAgICAgICAgcmV0dXJuIHBvcy50b1VwcGVyQ2FzZSgpLm1hdGNoKC9cXFMrL2cpLmpvaW4oJ18nKTtcbiAgICB9O1xuICAgIEFkZFBhbmVsLnByb3RvdHlwZS5oeTJjbW1sID0gZnVuY3Rpb24gKGspIHtcbiAgICAgICAgcmV0dXJuIGsucmVwbGFjZSgvLSguKS9nLCBmdW5jdGlvbiAobSwgZykge1xuICAgICAgICAgICAgcmV0dXJuIGcudG9VcHBlckNhc2UoKTtcbiAgICAgICAgfSk7XG4gICAgfTtcbiAgICBBZGRQYW5lbC5wcm90b3R5cGUuSFRNTFBhcnNlciA9IGZ1bmN0aW9uIChhSFRNTFN0cmluZykge1xuICAgICAgICB2YXIgY29udGFpbmVyID0gd2luZG93LmRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgICAgICBjb250YWluZXIuaW5uZXJIVE1MID0gYUhUTUxTdHJpbmc7XG4gICAgICAgIHJldHVybiBjb250YWluZXI7XG4gICAgfTtcbiAgICBBZGRQYW5lbC5wcm90b3R5cGUub25TdWNjZXNzID0gZnVuY3Rpb24gKG9wdGlvbnMsIHBvc2l0aW9uLCBwYW5lbCwgY2IpIHtcbiAgICAgICAgdmFyIGUsIHJ1bGU7XG4gICAgICAgIC8vIHBvc2l0aW9uaW5nIG9wdGlvbnNcbiAgICAgICAgaWYgKG9wdGlvbnMucG9zaXRpb24pIHtcbiAgICAgICAgICAgIC8vIGNvbnZlcnQgdG8gZ29vZ2xlIENvbnRyb2xQb3NpdGlvbiBtYXAgcG9zaXRpb24ga2V5c1xuICAgICAgICAgICAgb3B0aW9ucy5wb3NpdGlvbiA9IHRoaXMuZ2V0UG9zaXRpb25LZXkob3B0aW9ucy5wb3NpdGlvbik7XG4gICAgICAgICAgICBwb3NpdGlvbiA9IGdvb2dsZS5tYXBzLkNvbnRyb2xQb3NpdGlvbltvcHRpb25zLnBvc2l0aW9uXTtcbiAgICAgICAgfVxuICAgICAgICAvLyBzdHlsZSBvcHRpb25zXG4gICAgICAgIGlmICh0eXBlb2Ygb3B0aW9ucy5zdHlsZSA9PT0gJ29iamVjdCcpIHtcbiAgICAgICAgICAgIGZvciAocnVsZSBpbiBvcHRpb25zLnN0eWxlKSB7XG4gICAgICAgICAgICAgICAgaWYgKG9wdGlvbnMuc3R5bGUuaGFzT3duUHJvcGVydHkocnVsZSkpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHJ1bGVLZXkgPSB0aGlzLmh5MmNtbWwocnVsZSk7XG4gICAgICAgICAgICAgICAgICAgIHBhbmVsLnN0eWxlW3J1bGVLZXldID0gb3B0aW9ucy5zdHlsZVtydWxlXTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgLy8gZXZlbnQgaGFuZGxlclxuICAgICAgICBpZiAob3B0aW9ucy5ldmVudHMpIHtcbiAgICAgICAgICAgIGZvciAoZSBpbiBvcHRpb25zLmV2ZW50cykge1xuICAgICAgICAgICAgICAgIGlmIChvcHRpb25zLmV2ZW50cy5oYXNPd25Qcm9wZXJ0eShlKSkge1xuICAgICAgICAgICAgICAgICAgICB2YXIga2V5cyA9IGUubWF0Y2goL1xcUysvZyk7XG4gICAgICAgICAgICAgICAgICAgIHZhciBldmVudCA9IGtleXMuc3BsaWNlKC0xKTsgLy9ldmVudCB0eXBlXG4gICAgICAgICAgICAgICAgICAgIHZhciBzZWxlY3RvciA9IGtleXMuam9pbignICcpOyAvLyBzZWxlY3RvciBzdHJpbmdcbiAgICAgICAgICAgICAgICAgICAgdmFyIGVsZW1lbnRzID0gcGFuZWwucXVlcnlTZWxlY3RvckFsbChzZWxlY3Rvcik7XG4gICAgICAgICAgICAgICAgICAgIFtdLmZvckVhY2guY2FsbChlbGVtZW50cywgZnVuY3Rpb24gKGVsbSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgZ29vZ2xlLm1hcHMuZXZlbnQuYWRkRG9tTGlzdGVuZXIoZWxtLCBldmVudCwgb3B0aW9ucy5ldmVudHNbZV0pO1xuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy50aGF0Lmluc3RhbmNlLmNvbnRyb2xzW3Bvc2l0aW9uXS5wdXNoKHBhbmVsKTtcbiAgICAgICAgdGhpcy50aGF0LnBhbmVscyA9IHRoaXMudGhhdC5wYW5lbHMgfHwge307XG4gICAgICAgIHRoaXMudGhhdC5wYW5lbHNbcG9zaXRpb25dID0gcGFuZWw7XG4gICAgICAgIGNiKGZhbHNlLCBwYW5lbCk7XG4gICAgfTtcbiAgICBBZGRQYW5lbC5wcm90b3R5cGUuYWRkUGFuZWwgPSBmdW5jdGlvbiAob3B0aW9ucywgY2IpIHtcbiAgICAgICAgdmFyIF90aGlzID0gdGhpcztcbiAgICAgICAgY2IgPSBjYiB8fCBmdW5jdGlvbiAoKSB7XG4gICAgICAgIH07XG4gICAgICAgIHZhciBwb3NpdGlvbiwgcGFuZWw7XG4gICAgICAgIC8vIGRlZmF1bHQgcG9zaXRpb25cbiAgICAgICAgb3B0aW9ucy5wb3NpdGlvbiA9IG9wdGlvbnMucG9zaXRpb24gfHwgY29uZmlnLnBhbmVsUG9zaXRpb247XG4gICAgICAgIGlmIChvcHRpb25zLnRlbXBsYXRlVVJMKSB7XG4gICAgICAgICAgICB0aGlzLnRlbXBsYXRlKCdwYW5lbCcsIG9wdGlvbnMudGVtcGxhdGVVUkwsIGZ1bmN0aW9uIChlcnIsIHJlc3BvbnNlKSB7XG4gICAgICAgICAgICAgICAgaWYgKCFlcnIpIHtcbiAgICAgICAgICAgICAgICAgICAgcGFuZWwgPSBfdGhpcy5IVE1MUGFyc2VyKHJlc3BvbnNlKTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIF90aGlzLm9uU3VjY2VzcyhvcHRpb25zLCBwb3NpdGlvbiwgcGFuZWwsIGNiKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGNiKGVycik7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIGlmICh0eXBlb2Ygb3B0aW9ucy50ZW1wbGF0ZSA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgICAgICBwYW5lbCA9IHRoaXMuSFRNTFBhcnNlcihvcHRpb25zLnRlbXBsYXRlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIHBhbmVsID0gb3B0aW9ucy50ZW1wbGF0ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRoaXMub25TdWNjZXNzKG9wdGlvbnMsIHBvc2l0aW9uLCBwYW5lbCwgY2IpO1xuICAgICAgICB9XG4gICAgfTtcbiAgICByZXR1cm4gQWRkUGFuZWw7XG59KSgpO1xubW9kdWxlLmV4cG9ydHMgPSBBZGRQYW5lbDtcbiIsIi8vLyA8cmVmZXJlbmNlIHBhdGg9XCJ0eXBpbmdzL3RzZC5kLnRzXCIvPlxudmFyIENlbnRlciA9IChmdW5jdGlvbiAoKSB7XG4gICAgZnVuY3Rpb24gQ2VudGVyKCkge1xuICAgIH1cbiAgICBDZW50ZXIucHJvdG90eXBlLnBvcyA9IGZ1bmN0aW9uIChsYXQsIGxuZykge1xuICAgICAgICB2YXIgcG9zaXRpb247XG4gICAgICAgIGlmIChsYXQgJiYgbG5nKSB7XG4gICAgICAgICAgICBwb3NpdGlvbiA9IG5ldyBnb29nbGUubWFwcy5MYXRMbmcobGF0LCBsbmcpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgcG9zaXRpb24gPSBuZXcgZ29vZ2xlLm1hcHMuTGF0TG5nKHRoaXMub3B0aW9ucy5sYXQsIHRoaXMub3B0aW9ucy5sbmcpO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuaW5zdGFuY2Uuc2V0Q2VudGVyKHBvc2l0aW9uKTtcbiAgICB9O1xuICAgIHJldHVybiBDZW50ZXI7XG59KSgpO1xubW9kdWxlLmV4cG9ydHMgPSBDZW50ZXI7XG4iLCIvLy8gPHJlZmVyZW5jZSBwYXRoPVwidHlwaW5ncy90c2QuZC50c1wiLz5cbnZhciBDb25maWcgPSAoZnVuY3Rpb24gKCkge1xuICAgIGZ1bmN0aW9uIENvbmZpZygpIHtcbiAgICB9XG4gICAgQ29uZmlnLnZlcnNpb24gPSAnMy4zOSc7XG4gICAgQ29uZmlnLnVybCA9ICcvL21hcHMuZ29vZ2xlYXBpcy5jb20vbWFwcy9hcGkvanMnO1xuICAgIENvbmZpZy56b29tID0gODtcbiAgICBDb25maWcuY3VzdG9tTWFwT3B0aW9ucyA9IFsnaWQnLCAnbGF0JywgJ2xuZycsICd0eXBlJywgJ3VpZCddO1xuICAgIENvbmZpZy5jdXN0b21NYXJrZXJPcHRpb25zID0gWydsYXQnLCAnbG5nJywgJ21vdmUnLCAnaW5mb1dpbmRvdycsICdvbicsICdjYWxsYmFjaycsICd0YWdzJ107XG4gICAgQ29uZmlnLnBhbmVsUG9zaXRpb24gPSAnVE9QX0xFRlQnO1xuICAgIENvbmZpZy5jdXN0b21JbmZvV2luZG93T3B0aW9ucyA9IFsnb3BlbicsICdjbG9zZSddO1xuICAgIENvbmZpZy5jdXN0b21FdmVudHMgPSBbJ21hcmtlcl92aXNpYmlsaXR5X2NoYW5nZWQnXTtcbiAgICByZXR1cm4gQ29uZmlnO1xufSkoKTtcbm1vZHVsZS5leHBvcnRzID0gQ29uZmlnO1xuIiwiLy8vIDxyZWZlcmVuY2UgcGF0aD1cInR5cGluZ3MvdHNkLmQudHNcIi8+XG52YXIgYWRkRmlsdGVyID0gcmVxdWlyZSgnLi9hZGRGaWx0ZXInKTtcbnZhciBGaWx0ZXIgPSAoZnVuY3Rpb24gKCkge1xuICAgIGZ1bmN0aW9uIEZpbHRlcih0aGF0LCB0eXBlKSB7XG4gICAgICAgIHRoaXMudGhhdCA9IHRoYXQ7XG4gICAgICAgIHRoaXMudHlwZSA9IHR5cGU7XG4gICAgICAgIHRoaXMub3JkZXJMb29rdXAgPSB7XG4gICAgICAgICAgICBBU0M6ICd0b3AnLFxuICAgICAgICAgICAgREVTQzogJ2JvdHRvbSdcbiAgICAgICAgfTtcbiAgICAgICAgdGhpcy51dGlscyA9IHJlcXVpcmUoJy4vdXRpbHMnKTtcbiAgICAgICAgdmFyIGFkZEZpbHRlckluc3RhbmNlID0gbmV3IGFkZEZpbHRlcih0aGF0LCB0eXBlKTtcbiAgICAgICAgdGhpcy5hZGRGaWx0ZXIgPSBmdW5jdGlvbiAoZmlsdGVycykge1xuICAgICAgICAgICAgcmV0dXJuIGFkZEZpbHRlckluc3RhbmNlLmFkZEZpbHRlcihmaWx0ZXJzKTtcbiAgICAgICAgfTtcbiAgICB9XG4gICAgLy8gY2YgaGFzIGl0J3Mgb3duIHN0YXRlLCBmb3IgZWFjaCBkaW1lbnNpb25cbiAgICAvLyBiZWZvcmUgZWFjaCBuZXcgZmlsdGVyaW5nIHdlIG5lZWQgdG8gY2xlYXIgdGhpcyBzdGF0ZVxuICAgIEZpbHRlci5wcm90b3R5cGUuY2xlYXJBbGwgPSBmdW5jdGlvbiAoZGltZW5zaW9uU2V0KSB7XG4gICAgICAgIHZhciBpLCBkaW1lbnNpb247XG4gICAgICAgIGZvciAoaSBpbiBkaW1lbnNpb25TZXQpIHtcbiAgICAgICAgICAgIGlmIChkaW1lbnNpb25TZXQuaGFzT3duUHJvcGVydHkoaSkpIHtcbiAgICAgICAgICAgICAgICBkaW1lbnNpb24gPSBkaW1lbnNpb25TZXRbaV07XG4gICAgICAgICAgICAgICAgaWYgKHRoaXMudGhhdFt0aGlzLnR5cGVdLmRhdGFDaGFuZ2VkID09PSB0cnVlKSB7XG4gICAgICAgICAgICAgICAgICAgIGRpbWVuc2lvbi5kaXNwb3NlKCk7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuYWRkRmlsdGVyKGkpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgZGltZW5zaW9uLmZpbHRlckFsbCgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH07XG4gICAgRmlsdGVyLnByb3RvdHlwZS5maWx0ZXJCeVRhZyA9IGZ1bmN0aW9uIChxdWVyeSkge1xuICAgICAgICAvLyBpZiB0aGUgc2VhcmNoIHF1ZXJ5IGlzIGFuIGFycmF5IHdpdGggb25seSBvbmUgaXRlbSB0aGVuIGp1c3QgdXNlIHRoYXQgc3RyaW5nXG4gICAgICAgIGlmICh0aGlzLnV0aWxzLmlzQXJyYXkocXVlcnkpICYmIHF1ZXJ5Lmxlbmd0aCA9PT0gMSkge1xuICAgICAgICAgICAgcXVlcnkgPSBxdWVyeVswXTtcbiAgICAgICAgfVxuICAgICAgICBpZiAodHlwZW9mIHF1ZXJ5ID09PSBcInN0cmluZ1wiKSB7XG4gICAgICAgICAgICBpZiAodGhpcy50aGF0W3RoaXMudHlwZV0udGFnc1txdWVyeV0pIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy51dGlscy50b0FycmF5KHRoaXMudGhhdFt0aGlzLnR5cGVdLnRhZ3NbcXVlcnldKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIHJldHVybiBbXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHZhciBtYXJrZXJzID0gdGhpcy5mZXRjaEJ5VGFnKHF1ZXJ5KTtcbiAgICAgICAgICAgIGlmICh0eXBlb2YgbWFya2VycyA9PT0gXCJvYmplY3RcIikge1xuICAgICAgICAgICAgICAgIG1hcmtlcnMgPSB0aGlzLnV0aWxzLnRvQXJyYXkobWFya2Vycyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gbWFya2VycztcbiAgICAgICAgfVxuICAgIH07XG4gICAgRmlsdGVyLnByb3RvdHlwZS5mZXRjaEJ5VGFnID0gZnVuY3Rpb24gKHF1ZXJ5KSB7XG4gICAgICAgIHZhciBtYXJrZXJzOyAvLyBzdG9yZSBmaXJzdCBzZXQgb2YgbWFya2VycyB0byBjb21wYXJlXG4gICAgICAgIHZhciBpO1xuICAgICAgICBmb3IgKGkgPSAwOyBpIDwgcXVlcnkubGVuZ3RoIC0gMTsgaSsrKSB7XG4gICAgICAgICAgICB2YXIgdGFnID0gcXVlcnlbaV07XG4gICAgICAgICAgICB2YXIgbmV4dFRhZyA9IHF1ZXJ5W2kgKyAxXTtcbiAgICAgICAgICAgIC8vIG51bGwgY2hlY2sga2lja3MgaW4gd2hlbiB3ZSBnZXQgdG8gdGhlIGVuZCBvZiB0aGUgZm9yIGxvb3BcbiAgICAgICAgICAgIG1hcmtlcnMgPSB0aGlzLnV0aWxzLmdldENvbW1vbk9iamVjdCh0aGlzLnRoYXRbdGhpcy50eXBlXS50YWdzW3RhZ10sIHRoaXMudGhhdFt0aGlzLnR5cGVdLnRhZ3NbbmV4dFRhZ10pO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBtYXJrZXJzO1xuICAgIH07XG4gICAgRmlsdGVyLnByb3RvdHlwZS5maWx0ZXIgPSBmdW5jdGlvbiAoYXJncywgb3B0aW9ucykge1xuICAgICAgICAvLyBSZXR1cm4gQWxsIGl0ZW1zIGlmIG5vIGFyZ3VtZW50cyBhcmUgc3VwcGxpZWRcbiAgICAgICAgaWYgKHR5cGVvZiBhcmdzID09PSAndW5kZWZpbmVkJyAmJiB0eXBlb2Ygb3B0aW9ucyA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLnV0aWxzLnRvQXJyYXkodGhpcy50aGF0W3RoaXMudHlwZV0uYWxsKTtcbiAgICAgICAgfVxuICAgICAgICB2YXIgZGltZW5zaW9uLCBvcmRlciwgbGltaXQsIHF1ZXJ5O1xuICAgICAgICBpZiAodHlwZW9mIGFyZ3MgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICBkaW1lbnNpb24gPSBhcmdzO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgZGltZW5zaW9uID0gT2JqZWN0LmtleXMoYXJncylbMF07XG4gICAgICAgICAgICBxdWVyeSA9IGFyZ3NbZGltZW5zaW9uXTtcbiAgICAgICAgICAgIGlmIChkaW1lbnNpb24gPT09ICd0YWdzJykge1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmZpbHRlckJ5VGFnKHF1ZXJ5KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICB0aGlzLmNsZWFyQWxsKHRoaXMudGhhdFt0aGlzLnR5cGVdLmZpbHRlcik7XG4gICAgICAgIC8vIEFkZCBDcm9zc2ZpbHRlciBEaW1lbnNpb24gaWYgaXQgZG9lcyBub3QgZXhpc3QuXG4gICAgICAgIGlmICghdGhpcy50aGF0W3RoaXMudHlwZV0uZmlsdGVyW2RpbWVuc2lvbl0pIHtcbiAgICAgICAgICAgIHRoaXMuYWRkRmlsdGVyKGRpbWVuc2lvbik7XG4gICAgICAgIH1cbiAgICAgICAgb3JkZXIgPSAob3B0aW9ucyAmJiBvcHRpb25zLm9yZGVyICYmIHRoaXMub3JkZXJMb29rdXBbb3B0aW9ucy5vcmRlcl0pID8gdGhpcy5vcmRlckxvb2t1cFtvcHRpb25zLm9yZGVyXSA6IHRoaXMub3JkZXJMb29rdXBbT2JqZWN0LmtleXModGhpcy5vcmRlckxvb2t1cClbMF1dO1xuICAgICAgICBsaW1pdCA9IChvcHRpb25zICYmIG9wdGlvbnMubGltaXQpID8gb3B0aW9ucy5saW1pdCA6IEluZmluaXR5O1xuICAgICAgICBpZiAodHlwZW9mIHF1ZXJ5ID09PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgcXVlcnkgPSBudWxsO1xuICAgICAgICB9XG4gICAgICAgIHZhciByZXN1bHQgPSB0aGlzLnRoYXRbdGhpcy50eXBlXS5maWx0ZXJbZGltZW5zaW9uXS5maWx0ZXIocXVlcnkpW29yZGVyXShsaW1pdCk7XG4gICAgICAgIHRoaXMudGhhdFt0aGlzLnR5cGVdLmRhdGFDaGFuZ2VkID0gZmFsc2U7XG4gICAgICAgIGlmIChsaW1pdCA9PT0gMSkge1xuICAgICAgICAgICAgcmV0dXJuIHJlc3VsdFswXTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH07XG4gICAgcmV0dXJuIEZpbHRlcjtcbn0pKCk7XG5tb2R1bGUuZXhwb3J0cyA9IEZpbHRlcjtcbiIsIi8vLyA8cmVmZXJlbmNlIHBhdGg9XCJ0eXBpbmdzL3RzZC5kLnRzXCIvPlxudmFyIEZpbmRNYXJrZXJCeUlkID0gKGZ1bmN0aW9uICgpIHtcbiAgICBmdW5jdGlvbiBGaW5kTWFya2VyQnlJZCh0aGF0KSB7XG4gICAgICAgIHRoaXMudGhhdCA9IHRoYXQ7XG4gICAgfVxuICAgIEZpbmRNYXJrZXJCeUlkLnByb3RvdHlwZS5maW5kID0gZnVuY3Rpb24gKG1hcmtlcikge1xuICAgICAgICBpZiAobWFya2VyLmRhdGEgJiYgbWFya2VyLmRhdGEudWlkKSB7XG4gICAgICAgICAgICByZXR1cm4gbWFya2VyO1xuICAgICAgICB9XG4gICAgICAgIGlmIChtYXJrZXIudWlkICYmIG1hcFRvb2xzLm1hcHNbdGhpcy50aGF0LmlkXS5tYXJrZXJzLmFsbFttYXJrZXIudWlkXSkge1xuICAgICAgICAgICAgcmV0dXJuIG1hcFRvb2xzLm1hcHNbdGhpcy50aGF0LmlkXS5tYXJrZXJzLmFsbFttYXJrZXIudWlkXTtcbiAgICAgICAgfVxuICAgIH07XG4gICAgcmV0dXJuIEZpbmRNYXJrZXJCeUlkO1xufSkoKTtcbm1vZHVsZS5leHBvcnRzID0gRmluZE1hcmtlckJ5SWQ7XG4iLCIvLy8gPHJlZmVyZW5jZSBwYXRoPVwidHlwaW5ncy90c2QuZC50c1wiLz5cbnZhciBJbmZvV2luZG93ID0gKGZ1bmN0aW9uICgpIHtcbiAgICBmdW5jdGlvbiBJbmZvV2luZG93KHRoYXQpIHtcbiAgICAgICAgdGhpcy50aGF0ID0gdGhhdDtcbiAgICAgICAgdGhpcy51dGlscyA9IHJlcXVpcmUoJy4vdXRpbHMnKTtcbiAgICAgICAgdGhpcy5jb25maWcgPSByZXF1aXJlKCcuL2NvbmZpZycpO1xuICAgIH1cbiAgICBJbmZvV2luZG93LnByb3RvdHlwZS5pbmZvV2luZG93ID0gZnVuY3Rpb24gKG1hcCwgbWFya2VyLCBhcmdzKSB7XG4gICAgICAgIHZhciBjb250ZW50ID0gZmFsc2U7XG4gICAgICAgIGlmIChtYXJrZXIuaW5mb1dpbmRvdy5jb250ZW50KSB7XG4gICAgICAgICAgICBpZiAobWFya2VyLmluZm9XaW5kb3cuY29udGVudC5pbmRleE9mKCd7JykgPiAtMSkge1xuICAgICAgICAgICAgICAgIGNvbnRlbnQgPSBhcmdzLmNvbnRlbnQucmVwbGFjZSgvXFx7KFxcdyspXFx9L2csIGZ1bmN0aW9uIChtLCB2YXJpYWJsZSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gbWFya2VyLmRhdGFbdmFyaWFibGVdIHx8ICcnO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY29udGVudCA9IGNvbnRlbnQgfHwgbWFya2VyLmluZm9XaW5kb3cuY29udGVudDtcbiAgICAgICAgfVxuICAgICAgICB2YXIgb3B0aW9ucyA9IHRoaXMudXRpbHMuY2xvbmUoYXJncyk7XG4gICAgICAgIG9wdGlvbnMuY29udGVudCA9IGNvbnRlbnQ7XG4gICAgICAgIHRoaXMudGhhdC5pbmZvV2luZG93ID0gbmV3IGdvb2dsZS5tYXBzLkluZm9XaW5kb3cob3B0aW9ucyk7XG4gICAgICAgIHRoaXMudGhhdC5pbmZvV2luZG93Lm9wZW4obWFwLCBtYXJrZXIpO1xuICAgIH07XG4gICAgSW5mb1dpbmRvdy5wcm90b3R5cGUub3BlbiA9IGZ1bmN0aW9uIChtYXAsIG1hcmtlciwgb3B0aW9ucykge1xuICAgICAgICB0aGlzLmNsb3NlKCk7XG4gICAgICAgIHRoaXMuaW5mb1dpbmRvdyhtYXAsIG1hcmtlciwgb3B0aW9ucyk7XG4gICAgfTtcbiAgICBJbmZvV2luZG93LnByb3RvdHlwZS5pc09wZW4gPSBmdW5jdGlvbiAoaW5mb1dpbmRvdykge1xuICAgICAgICB2YXIgbWFwID0gaW5mb1dpbmRvdy5nZXRNYXAoKTtcbiAgICAgICAgcmV0dXJuIChtYXAgIT09IG51bGwgJiYgdHlwZW9mIG1hcCAhPT0gXCJ1bmRlZmluZWRcIik7XG4gICAgfTtcbiAgICBJbmZvV2luZG93LnByb3RvdHlwZS5jbG9zZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgY2xlYXJUaW1lb3V0KHRoaXMudGltZXIpO1xuICAgICAgICBpZiAodGhpcy50aGF0LmluZm9XaW5kb3cgJiYgdGhpcy5pc09wZW4odGhpcy50aGF0LmluZm9XaW5kb3cpKSB7XG4gICAgICAgICAgICB0aGlzLnRoYXQuaW5mb1dpbmRvdy5jbG9zZSgpO1xuICAgICAgICB9XG4gICAgfTtcbiAgICBJbmZvV2luZG93LnByb3RvdHlwZS5hZGRFdmVudHMgPSBmdW5jdGlvbiAobWFya2VyLCBvcHRpb25zLCBtYXApIHtcbiAgICAgICAgdmFyIF90aGlzID0gdGhpcztcbiAgICAgICAgdmFyIGFyZ3MgPSB0aGlzLnV0aWxzLnByZXBhcmVPcHRpb25zKG9wdGlvbnMsIHRoaXMuY29uZmlnLmN1c3RvbUluZm9XaW5kb3dPcHRpb25zKTtcbiAgICAgICAgdmFyIG9wZW5PbiA9IChhcmdzLmN1c3RvbSAmJiBhcmdzLmN1c3RvbS5vcGVuICYmIGFyZ3MuY3VzdG9tLm9wZW4ub24pID8gYXJncy5jdXN0b20ub3Blbi5vbiA6ICdjbGljayc7XG4gICAgICAgIHZhciBjbG9zZU9uID0gKGFyZ3MuY3VzdG9tICYmIGFyZ3MuY3VzdG9tLmNsb3NlICYmIGFyZ3MuY3VzdG9tLmNsb3NlLm9uKSA/IGFyZ3MuY3VzdG9tLmNsb3NlLm9uIDogJ2NsaWNrJztcbiAgICAgICAgLy8gVG9nZ2xlIEVmZmVjdCB3aGVuIHVzaW5nIHRoZSBzYW1lIG1ldGhvZCB0byBPcGVuIGFuZCBDbG9zZS5cbiAgICAgICAgaWYgKG9wZW5PbiA9PT0gY2xvc2VPbikge1xuICAgICAgICAgICAgZ29vZ2xlLm1hcHMuZXZlbnQuYWRkTGlzdGVuZXIobWFya2VyLCBvcGVuT24sIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBpZiAoIV90aGlzLnRoYXQuaW5mb1dpbmRvdyB8fCAhX3RoaXMuaXNPcGVuKF90aGlzLnRoYXQuaW5mb1dpbmRvdykpIHtcbiAgICAgICAgICAgICAgICAgICAgX3RoaXMub3BlbihtYXAsIG1hcmtlciwgYXJncy5kZWZhdWx0cyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBfdGhpcy5jbG9zZSgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgZ29vZ2xlLm1hcHMuZXZlbnQuYWRkTGlzdGVuZXIobWFya2VyLCBvcGVuT24sIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBfdGhpcy5vcGVuKG1hcCwgbWFya2VyLCBhcmdzLmRlZmF1bHRzKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgZ29vZ2xlLm1hcHMuZXZlbnQuYWRkTGlzdGVuZXIobWFya2VyLCBjbG9zZU9uLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgaWYgKGFyZ3MuY3VzdG9tLmNsb3NlLmR1cmF0aW9uKSB7XG4gICAgICAgICAgICAgICAgICAgIF90aGlzLnRpbWVyID0gc2V0VGltZW91dChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBfdGhpcy5jbG9zZSgpO1xuICAgICAgICAgICAgICAgICAgICB9LCBhcmdzLmN1c3RvbS5jbG9zZS5kdXJhdGlvbik7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBfdGhpcy5jbG9zZSgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgfTtcbiAgICByZXR1cm4gSW5mb1dpbmRvdztcbn0pKCk7XG5tb2R1bGUuZXhwb3J0cyA9IEluZm9XaW5kb3c7XG4iLCJ2YXIgTG9jYXRlID0gKGZ1bmN0aW9uICgpIHtcbiAgICBmdW5jdGlvbiBMb2NhdGUoKSB7XG4gICAgfVxuICAgIExvY2F0ZS5wcm90b3R5cGUubG9jYXRlID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgY2VudGVyID0gdGhpcy5pbnN0YW5jZS5nZXRDZW50ZXIoKTtcbiAgICAgICAgcmV0dXJuIHsgbGF0OiBjZW50ZXIubGF0KCksIGxuZzogY2VudGVyLmxuZygpIH07XG4gICAgfTtcbiAgICByZXR1cm4gTG9jYXRlO1xufSkoKTtcbm1vZHVsZS5leHBvcnRzID0gTG9jYXRlO1xuIiwiLy8vIDxyZWZlcmVuY2UgcGF0aD1cInR5cGluZ3MvdHNkLmQudHNcIi8+XG52YXIgYWRkTWFya2VyID0gcmVxdWlyZSgnLi9hZGRNYXJrZXInKTtcbnZhciBhZGRGZWF0dXJlID0gcmVxdWlyZSgnLi9hZGRGZWF0dXJlJyk7XG52YXIgYWRkUGFuZWwgPSByZXF1aXJlKCcuL2FkZFBhbmVsJyk7XG52YXIgY2VudGVyID0gcmVxdWlyZSgnLi9jZW50ZXInKTtcbnZhciBsb2NhdGUgPSByZXF1aXJlKCcuL2xvY2F0ZScpO1xudmFyIHVwZGF0ZU1hcmtlciA9IHJlcXVpcmUoJy4vdXBkYXRlTWFya2VyJyk7XG52YXIgdXBkYXRlTWFwID0gcmVxdWlyZSgnLi91cGRhdGVNYXAnKTtcbnZhciB1cGRhdGVGZWF0dXJlID0gcmVxdWlyZSgnLi91cGRhdGVGZWF0dXJlJyk7XG52YXIgYWRkTWFwID0gcmVxdWlyZSgnLi9hZGRNYXAnKTtcbnZhciByZW1vdmVNYXJrZXIgPSByZXF1aXJlKCcuL3JlbW92ZU1hcmtlcicpO1xudmFyIHJlc2V0TWFya2VyID0gcmVxdWlyZSgnLi9yZXNldE1hcmtlcicpO1xudmFyIGZpbHRlciA9IHJlcXVpcmUoJy4vZmlsdGVyJyk7XG52YXIgbWFwVG9vbHMgPSAoZnVuY3Rpb24gKCkge1xuICAgIGZ1bmN0aW9uIG1hcFRvb2xzKG9wdGlvbnMsIGNiKSB7XG4gICAgICAgIHRoaXMuY3Jvc3NmaWx0ZXIgPSByZXF1aXJlKCdjcm9zc2ZpbHRlcicpO1xuICAgICAgICB2YXIgYWRkTWFya2VySW5zdGFuY2UgPSBuZXcgYWRkTWFya2VyKHRoaXMpO1xuICAgICAgICB0aGlzLmFkZE1hcmtlciA9IGZ1bmN0aW9uIChtYXJrZXIsIG9wdGlvbnMpIHtcbiAgICAgICAgICAgIHJldHVybiBhZGRNYXJrZXJJbnN0YW5jZS5hZGRNYXJrZXIobWFya2VyLCBvcHRpb25zKTtcbiAgICAgICAgfTtcbiAgICAgICAgdmFyIGFkZEZlYXR1cmVJbnN0YW5jZSA9IG5ldyBhZGRGZWF0dXJlKHRoaXMpO1xuICAgICAgICB0aGlzLmFkZFRvcG9Kc29uID0gZnVuY3Rpb24gKGRhdGEsIG9wdGlvbnMpIHtcbiAgICAgICAgICAgIHJldHVybiBhZGRGZWF0dXJlSW5zdGFuY2UuYWRkVG9wb0pzb24oZGF0YSwgb3B0aW9ucyk7XG4gICAgICAgIH07XG4gICAgICAgIHRoaXMuYWRkR2VvSnNvbiA9IGZ1bmN0aW9uIChkYXRhLCBvcHRpb25zKSB7XG4gICAgICAgICAgICByZXR1cm4gYWRkRmVhdHVyZUluc3RhbmNlLmFkZEdlb0pzb24oZGF0YSwgb3B0aW9ucyk7XG4gICAgICAgIH07XG4gICAgICAgIHZhciBhZGRQYW5lbEluc3RhbmNlID0gbmV3IGFkZFBhbmVsKHRoaXMpO1xuICAgICAgICB0aGlzLmFkZFBhbmVsID0gZnVuY3Rpb24gKG9wdGlvbnMsIGNiKSB7XG4gICAgICAgICAgICByZXR1cm4gYWRkUGFuZWxJbnN0YW5jZS5hZGRQYW5lbChvcHRpb25zLCBjYik7XG4gICAgICAgIH07XG4gICAgICAgIHRoaXMuY2VudGVyID0gbmV3IGNlbnRlcigpLnBvcztcbiAgICAgICAgdGhpcy5sb2NhdGUgPSBuZXcgbG9jYXRlKCkubG9jYXRlO1xuICAgICAgICB2YXIgdXBkYXRlTWFya2VySW5zdGFuY2UgPSBuZXcgdXBkYXRlTWFya2VyKHRoaXMpO1xuICAgICAgICB0aGlzLnVwZGF0ZU1hcmtlciA9IGZ1bmN0aW9uIChhcmdzLCBvcHRpb25zKSB7XG4gICAgICAgICAgICByZXR1cm4gdXBkYXRlTWFya2VySW5zdGFuY2UudXBkYXRlKGFyZ3MsIG9wdGlvbnMpO1xuICAgICAgICB9O1xuICAgICAgICB2YXIgdXBkYXRlTWFwSW5zdGFuY2UgPSBuZXcgdXBkYXRlTWFwKHRoaXMpO1xuICAgICAgICB0aGlzLnVwZGF0ZU1hcCA9IGZ1bmN0aW9uIChhcmdzKSB7XG4gICAgICAgICAgICB1cGRhdGVNYXBJbnN0YW5jZS51cGRhdGVNYXAoYXJncyk7XG4gICAgICAgIH07XG4gICAgICAgIHZhciB1cGRhdGVGZWF0dXJlSW5zdGFuY2UgPSBuZXcgdXBkYXRlRmVhdHVyZSh0aGlzKTtcbiAgICAgICAgdGhpcy51cGRhdGVGZWF0dXJlID0gZnVuY3Rpb24gKGFyZ3MsIG9wdGlvbnMpIHtcbiAgICAgICAgICAgIHJldHVybiB1cGRhdGVGZWF0dXJlSW5zdGFuY2UudXBkYXRlKGFyZ3MsIG9wdGlvbnMpO1xuICAgICAgICB9O1xuICAgICAgICB2YXIgcmVtb3ZlTWFya2VySW5zdGFuY2UgPSBuZXcgcmVtb3ZlTWFya2VyKHRoaXMpO1xuICAgICAgICB0aGlzLnJlbW92ZU1hcmtlciA9IGZ1bmN0aW9uIChhcmdzKSB7XG4gICAgICAgICAgICByZXR1cm4gcmVtb3ZlTWFya2VySW5zdGFuY2UucmVtb3ZlTWFya2VyKGFyZ3MpO1xuICAgICAgICB9O1xuICAgICAgICB2YXIgcmVzZXRNYXJrZXJJbnN0YW5jZSA9IG5ldyByZXNldE1hcmtlcih0aGlzKTtcbiAgICAgICAgdGhpcy5yZXNldE1hcmtlciA9IGZ1bmN0aW9uIChhcmdzLCBvcHRpb25zKSB7XG4gICAgICAgICAgICByZXR1cm4gcmVzZXRNYXJrZXJJbnN0YW5jZS5yZXNldE1hcmtlcihhcmdzLCBvcHRpb25zKTtcbiAgICAgICAgfTtcbiAgICAgICAgdmFyIGZpbmRNYXJrZXIgPSBuZXcgZmlsdGVyKHRoaXMsICdtYXJrZXJzJyk7XG4gICAgICAgIHRoaXMuZmluZE1hcmtlciA9IGZ1bmN0aW9uIChhcmdzLCBvcHRpb25zKSB7XG4gICAgICAgICAgICByZXR1cm4gZmluZE1hcmtlci5maWx0ZXIoYXJncywgb3B0aW9ucyk7XG4gICAgICAgIH07XG4gICAgICAgIC8vIFVuaXQgVGVzdHM/XG4gICAgICAgIHZhciBmaW5kRmVhdHVyZSA9IG5ldyBmaWx0ZXIodGhpcywgJ2pzb24nKTtcbiAgICAgICAgdGhpcy5maW5kRmVhdHVyZSA9IGZ1bmN0aW9uIChhcmdzLCBvcHRpb25zKSB7XG4gICAgICAgICAgICByZXR1cm4gZmluZEZlYXR1cmUuZmlsdGVyKGFyZ3MsIG9wdGlvbnMpO1xuICAgICAgICB9O1xuICAgICAgICB2YXIgbWFwID0gbmV3IGFkZE1hcCh0aGlzKTtcbiAgICAgICAgbWFwLmxvYWQob3B0aW9ucywgY2IpO1xuICAgIH1cbiAgICBtYXBUb29scy5wcm90b3R5cGUuem9vbSA9IGZ1bmN0aW9uICh6b29tKSB7XG4gICAgICAgIGlmICh0eXBlb2Ygem9vbSA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmluc3RhbmNlLmdldFpvb20oKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuaW5zdGFuY2Uuc2V0Wm9vbSh6b29tKTtcbiAgICAgICAgfVxuICAgIH07XG4gICAgcmV0dXJuIG1hcFRvb2xzO1xufSkoKTtcbm1vZHVsZS5leHBvcnRzID0gbWFwVG9vbHM7XG4iLCIvLy8gPHJlZmVyZW5jZSBwYXRoPVwidHlwaW5ncy90c2QuZC50c1wiLz5cbnZhciB1dGlscyA9IHJlcXVpcmUoJy4vdXRpbHMnKTtcbnZhciBjb25maWcgPSByZXF1aXJlKCcuL2NvbmZpZycpO1xudmFyIE1hcHMgPSAoZnVuY3Rpb24gKCkge1xuICAgIGZ1bmN0aW9uIE1hcHMoKSB7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIEluamVjdHMgR29vZ2xlIEFQSSBKYXZhc2NyaXB0IEZpbGUgYW5kIGFkZHMgYSBjYWxsYmFjayB0byBsb2FkIHRoZSBHb29nbGUgTWFwcyBBc3luYy5cbiAgICAgKiBAdHlwZSB7e2xvYWQ6IEZ1bmN0aW9ufX1cbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqXG4gICAgICogQHJldHVybnMgdGhlIGVsZW1lbnQgYXBwZW5kZWRcbiAgICAgKi9cbiAgICBNYXBzLmxvYWQgPSBmdW5jdGlvbiAoaWQsIGFyZ3MpIHtcbiAgICAgICAgdmFyIHZlcnNpb24gPSBhcmdzLnZlcnNpb24gfHwgY29uZmlnLnZlcnNpb247XG4gICAgICAgIHZhciBzY3JpcHQgPSB3aW5kb3cuZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc2NyaXB0Jyk7XG4gICAgICAgIHNjcmlwdC50eXBlID0gJ3RleHQvamF2YXNjcmlwdCc7XG4gICAgICAgIHNjcmlwdC5zcmMgPSBcIlwiICsgY29uZmlnLnVybCArIFwiP3Y9XCIgKyB2ZXJzaW9uICsgXCIma2V5PVwiICsgYXJncy5rZXkgKyBcIiZjYWxsYmFjaz1tYXBUb29scy5tYXBzLlwiICsgaWQgKyBcIi5jcmVhdGVcIjtcbiAgICAgICAgcmV0dXJuIHdpbmRvdy5kb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKHNjcmlwdCk7XG4gICAgfTtcbiAgICBNYXBzLm1hcE9wdGlvbnMgPSBmdW5jdGlvbiAoYXJncykge1xuICAgICAgICAvLyBUbyBjbG9uZSBBcmd1bWVudHMgZXhjbHVkaW5nIGN1c3RvbU1hcE9wdGlvbnNcbiAgICAgICAgdmFyIHJlc3VsdCA9IHV0aWxzLmNsb25lKGFyZ3MsIGNvbmZpZy5jdXN0b21NYXBPcHRpb25zKTtcbiAgICAgICAgcmVzdWx0Lnpvb20gPSBhcmdzLnpvb20gfHwgY29uZmlnLnpvb207XG4gICAgICAgIGlmIChhcmdzLmxhdCAmJiBhcmdzLmxuZykge1xuICAgICAgICAgICAgcmVzdWx0LmNlbnRlciA9IG5ldyBnb29nbGUubWFwcy5MYXRMbmcoYXJncy5sYXQsIGFyZ3MubG5nKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoYXJncy50eXBlKSB7XG4gICAgICAgICAgICByZXN1bHQubWFwVHlwZUlkID0gZ29vZ2xlLm1hcHMuTWFwVHlwZUlkW2FyZ3MudHlwZV0gfHwgZmFsc2U7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9O1xuICAgIHJldHVybiBNYXBzO1xufSkoKTtcbm1vZHVsZS5leHBvcnRzID0gTWFwcztcbiIsIi8vLyA8cmVmZXJlbmNlIHBhdGg9XCJ0eXBpbmdzL3RzZC5kLnRzXCIvPlxudmFyIGZpbmRNYXJrZXIgPSByZXF1aXJlKCcuL2ZpbmRNYXJrZXJCeUlkJyk7XG52YXIgUmVtb3ZlTWFya2VyID0gKGZ1bmN0aW9uICgpIHtcbiAgICBmdW5jdGlvbiBSZW1vdmVNYXJrZXIodGhhdCkge1xuICAgICAgICB0aGlzLnRoYXQgPSB0aGF0O1xuICAgICAgICB2YXIgZmluZE1hcmtlckluc3RhbmNlID0gbmV3IGZpbmRNYXJrZXIodGhhdCk7XG4gICAgICAgIHRoaXMuZmluZE1hcmtlciA9IGZ1bmN0aW9uIChtYXJrZXIpIHtcbiAgICAgICAgICAgIHJldHVybiBmaW5kTWFya2VySW5zdGFuY2UuZmluZChtYXJrZXIpO1xuICAgICAgICB9O1xuICAgIH1cbiAgICBSZW1vdmVNYXJrZXIucHJvdG90eXBlLnJlbW92ZUJ1bGsgPSBmdW5jdGlvbiAoYXJncykge1xuICAgICAgICB2YXIgbWFya2VyLCB4O1xuICAgICAgICBmb3IgKHggaW4gYXJncykge1xuICAgICAgICAgICAgaWYgKGFyZ3MuaGFzT3duUHJvcGVydHkoeCkpIHtcbiAgICAgICAgICAgICAgICBtYXJrZXIgPSBhcmdzW3hdO1xuICAgICAgICAgICAgICAgIHRoaXMucmVtb3ZlKHRoaXMuZmluZE1hcmtlcihtYXJrZXIpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH07XG4gICAgUmVtb3ZlTWFya2VyLnByb3RvdHlwZS5yZW1vdmVNYXJrZXIgPSBmdW5jdGlvbiAoYXJncykge1xuICAgICAgICBpZiAodHlwZW9mIGFyZ3MgPT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICB0aGlzLnJlbW92ZUJ1bGsodGhpcy50aGF0Lm1hcmtlcnMuYWxsKTtcbiAgICAgICAgfVxuICAgICAgICB2YXIgdHlwZSA9IE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbChhcmdzKTtcbiAgICAgICAgaWYgKHR5cGUgPT09ICdbb2JqZWN0IE9iamVjdF0nKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5yZW1vdmUodGhpcy5maW5kTWFya2VyKGFyZ3MpKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAodHlwZSA9PT0gJ1tvYmplY3QgQXJyYXldJykge1xuICAgICAgICAgICAgdGhpcy5yZW1vdmVCdWxrKGFyZ3MpO1xuICAgICAgICB9XG4gICAgfTtcbiAgICBSZW1vdmVNYXJrZXIucHJvdG90eXBlLnJlbW92ZSA9IGZ1bmN0aW9uIChtYXJrZXIpIHtcbiAgICAgICAgbWFya2VyLnNldE1hcChudWxsKTtcbiAgICAgICAgZGVsZXRlIG1hcFRvb2xzLm1hcHNbdGhpcy50aGF0LmlkXS5tYXJrZXJzLmFsbFttYXJrZXIuZGF0YS51aWRdO1xuICAgIH07XG4gICAgcmV0dXJuIFJlbW92ZU1hcmtlcjtcbn0pKCk7XG5tb2R1bGUuZXhwb3J0cyA9IFJlbW92ZU1hcmtlcjtcbiIsIi8vLyA8cmVmZXJlbmNlIHBhdGg9XCJ0eXBpbmdzL3RzZC5kLnRzXCIvPlxudmFyIHV0aWxzID0gcmVxdWlyZSgnLi91dGlscycpO1xudmFyIGNvbmZpZyA9IHJlcXVpcmUoJy4vY29uZmlnJyk7XG52YXIgZmluZE1hcmtlciA9IHJlcXVpcmUoJy4vZmluZE1hcmtlckJ5SWQnKTtcbnZhciB1cGRhdGVNYXJrZXIgPSByZXF1aXJlKCcuL3VwZGF0ZU1hcmtlcicpO1xudmFyIFJlc2V0TWFya2VyID0gKGZ1bmN0aW9uICgpIHtcbiAgICBmdW5jdGlvbiBSZXNldE1hcmtlcih0aGF0KSB7XG4gICAgICAgIHRoaXMudGhhdCA9IHRoYXQ7XG4gICAgICAgIHZhciBmaW5kTWFya2VySW5zdGFuY2UgPSBuZXcgZmluZE1hcmtlcih0aGF0KTtcbiAgICAgICAgdGhpcy5maW5kTWFya2VyID0gZnVuY3Rpb24gKG1hcmtlcikge1xuICAgICAgICAgICAgcmV0dXJuIGZpbmRNYXJrZXJJbnN0YW5jZS5maW5kKG1hcmtlcik7XG4gICAgICAgIH07XG4gICAgICAgIHRoaXMudXBkYXRlTWFya2VyID0gbmV3IHVwZGF0ZU1hcmtlcih0aGF0KTtcbiAgICB9XG4gICAgUmVzZXRNYXJrZXIucHJvdG90eXBlLnJlc2V0QnVsayA9IGZ1bmN0aW9uIChtYXJrZXJzLCBvcHRpb25zKSB7XG4gICAgICAgIHZhciB4O1xuICAgICAgICBmb3IgKHggaW4gbWFya2Vycykge1xuICAgICAgICAgICAgaWYgKG1hcmtlcnMuaGFzT3duUHJvcGVydHkoeCkpIHtcbiAgICAgICAgICAgICAgICB0aGlzLnJlc2V0KG1hcmtlcnNbeF0sIG9wdGlvbnMpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfTtcbiAgICBSZXNldE1hcmtlci5wcm90b3R5cGUucmVzZXRNYXJrZXIgPSBmdW5jdGlvbiAoYXJncywgb3B0aW9ucykge1xuICAgICAgICB2YXIgdHlwZSA9IE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbChhcmdzKTtcbiAgICAgICAgdmFyIHJlc3VsdDtcbiAgICAgICAgaWYgKHR5cGUgPT09ICdbb2JqZWN0IE9iamVjdF0nKSB7XG4gICAgICAgICAgICByZXN1bHQgPSB0aGlzLnJlc2V0KHRoaXMuZmluZE1hcmtlcihhcmdzKSwgb3B0aW9ucyk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHR5cGUgPT09ICdbb2JqZWN0IEFycmF5XScpIHtcbiAgICAgICAgICAgIHJlc3VsdCA9IHRoaXMucmVzZXRCdWxrKGFyZ3MsIG9wdGlvbnMpO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMudGhhdC5tYXJrZXJzLmRhdGFDaGFuZ2VkID0gdHJ1ZTtcbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9O1xuICAgIFJlc2V0TWFya2VyLnByb3RvdHlwZS5mb3JtYXRPcHRpb25zID0gZnVuY3Rpb24gKG1hcmtlciwgb3B0aW9ucykge1xuICAgICAgICB2YXIga2V5LCBvcCA9IHt9O1xuICAgICAgICB2YXIgdHlwZSA9IE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbChvcHRpb25zKTtcbiAgICAgICAgaWYgKHR5cGUgPT09ICdbb2JqZWN0IFN0cmluZ10nKSB7XG4gICAgICAgICAgICBvcFtvcHRpb25zXSA9IG1hcmtlci5kYXRhLl9zZWxmW29wdGlvbnNdO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0eXBlID09PSAnW29iamVjdCBBcnJheV0nKSB7XG4gICAgICAgICAgICBmb3IgKGtleSBpbiBvcHRpb25zKSB7XG4gICAgICAgICAgICAgICAgaWYgKG9wdGlvbnMuaGFzT3duUHJvcGVydHkoa2V5KSkge1xuICAgICAgICAgICAgICAgICAgICBvcFtvcHRpb25zW2tleV1dID0gbWFya2VyLmRhdGEuX3NlbGZbb3B0aW9uc1trZXldXTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG9wO1xuICAgIH07XG4gICAgUmVzZXRNYXJrZXIucHJvdG90eXBlLnJlc2V0ID0gZnVuY3Rpb24gKG1hcmtlciwgb3B0aW9ucykge1xuICAgICAgICB2YXIgcHJlcGFyZWRPcHRpb25zID0gdXRpbHMucHJlcGFyZU9wdGlvbnModGhpcy5mb3JtYXRPcHRpb25zKG1hcmtlciwgb3B0aW9ucyksIGNvbmZpZy5jdXN0b21NYXJrZXJPcHRpb25zKTtcbiAgICAgICAgdGhpcy51cGRhdGVNYXJrZXIuY3VzdG9tVXBkYXRlKG1hcmtlciwgcHJlcGFyZWRPcHRpb25zKTtcbiAgICAgICAgcmV0dXJuIG1hcmtlcjtcbiAgICB9O1xuICAgIHJldHVybiBSZXNldE1hcmtlcjtcbn0pKCk7XG5tb2R1bGUuZXhwb3J0cyA9IFJlc2V0TWFya2VyO1xuIiwidmFyIFRlbXBsYXRlID0gKGZ1bmN0aW9uICgpIHtcbiAgICBmdW5jdGlvbiBUZW1wbGF0ZSh0aGF0KSB7XG4gICAgICAgIHRoaXMudGhhdCA9IHRoYXQ7XG4gICAgfVxuICAgIFRlbXBsYXRlLnByb3RvdHlwZS5sb2FkID0gZnVuY3Rpb24gKHR5cGUsIHVybCwgY2IpIHtcbiAgICAgICAgdmFyIF90aGlzID0gdGhpcztcbiAgICAgICAgaWYgKHRoaXMudGhhdC50ZW1wbGF0ZXNbdHlwZV1bdXJsXSkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMudGhhdC50ZW1wbGF0ZXNbdHlwZV1bdXJsXTtcbiAgICAgICAgfVxuICAgICAgICB2YXIgeGhyID0gbmV3IFhNTEh0dHBSZXF1ZXN0KCk7XG4gICAgICAgIHhoci5vcGVuKFwiR0VUXCIsIHVybCk7XG4gICAgICAgIHhoci5vbmxvYWQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBpZiAoeGhyLnJlYWR5U3RhdGUgPT09IDQpIHtcbiAgICAgICAgICAgICAgICBpZiAoeGhyLnN0YXR1cyA9PT0gMjAwKSB7XG4gICAgICAgICAgICAgICAgICAgIF90aGlzLnRoYXQudGVtcGxhdGVzW3R5cGVdW3VybF0gPSB4aHIucmVzcG9uc2VUZXh0O1xuICAgICAgICAgICAgICAgICAgICBjYihmYWxzZSwgeGhyLnJlc3BvbnNlVGV4dCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBjYihuZXcgRXJyb3IoeGhyLnN0YXR1c1RleHQpKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgICAgIHhoci5zZW5kKG51bGwpO1xuICAgIH07XG4gICAgcmV0dXJuIFRlbXBsYXRlO1xufSkoKTtcbm1vZHVsZS5leHBvcnRzID0gVGVtcGxhdGU7XG4iLCIvLy8gPHJlZmVyZW5jZSBwYXRoPVwidHlwaW5ncy90c2QuZC50c1wiLz5cbnZhciBVcGRhdGVGZWF0dXJlID0gKGZ1bmN0aW9uICgpIHtcbiAgICBmdW5jdGlvbiBVcGRhdGVGZWF0dXJlKHRoYXQpIHtcbiAgICAgICAgdGhpcy50aGF0ID0gdGhhdDtcbiAgICB9XG4gICAgVXBkYXRlRmVhdHVyZS5wcm90b3R5cGUudXBkYXRlU3R5bGUgPSBmdW5jdGlvbiAoZiwgc3R5bGUpIHtcbiAgICAgICAgaWYgKHR5cGVvZiBzdHlsZSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgdmFyIHN0eWxlT3B0aW9ucyA9IHN0eWxlLmNhbGwoZik7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy50aGF0Lmluc3RhbmNlLmRhdGEub3ZlcnJpZGVTdHlsZShmLCBzdHlsZU9wdGlvbnMpO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMudGhhdC5pbnN0YW5jZS5kYXRhLm92ZXJyaWRlU3R5bGUoZiwgc3R5bGUpO1xuICAgIH07XG4gICAgVXBkYXRlRmVhdHVyZS5wcm90b3R5cGUuZmluZEFuZFVwZGF0ZSA9IGZ1bmN0aW9uIChhcmdzLCBvcHRpb25zKSB7XG4gICAgICAgIGlmIChhcmdzLmRhdGEgJiYgYXJncy5kYXRhLnVpZCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMudXBkYXRlRmVhdHVyZShhcmdzLCBvcHRpb25zKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoYXJncy51aWQgJiYgbWFwVG9vbHMubWFwc1t0aGlzLnRoYXQuaWRdLmpzb24gJiYgbWFwVG9vbHMubWFwc1t0aGlzLnRoYXQuaWRdLmpzb24uYWxsW2FyZ3MudWlkXSkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMudXBkYXRlRmVhdHVyZShtYXBUb29scy5tYXBzW3RoaXMudGhhdC5pZF0uanNvbi5hbGxbYXJncy51aWRdLCBvcHRpb25zKTtcbiAgICAgICAgfVxuICAgIH07XG4gICAgVXBkYXRlRmVhdHVyZS5wcm90b3R5cGUudXBkYXRlID0gZnVuY3Rpb24gKGFyZ3MsIG9wdGlvbnMpIHtcbiAgICAgICAgdmFyIHR5cGUgPSBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwoYXJncyk7XG4gICAgICAgIGlmICh0eXBlID09PSAnW29iamVjdCBBcnJheV0nKSB7XG4gICAgICAgICAgICB2YXIgZmVhdHVyZSwgeDtcbiAgICAgICAgICAgIGZvciAoeCBpbiBhcmdzKSB7XG4gICAgICAgICAgICAgICAgaWYgKGFyZ3MuaGFzT3duUHJvcGVydHkoeCkpIHtcbiAgICAgICAgICAgICAgICAgICAgZmVhdHVyZSA9IGFyZ3NbeF07XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZmluZEFuZFVwZGF0ZShmZWF0dXJlLCBvcHRpb25zKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHR5cGUgPT09ICdbb2JqZWN0IE9iamVjdF0nKSB7XG4gICAgICAgICAgICB0aGlzLmZpbmRBbmRVcGRhdGUoYXJncywgb3B0aW9ucyk7XG4gICAgICAgIH1cbiAgICB9O1xuICAgIFVwZGF0ZUZlYXR1cmUucHJvdG90eXBlLnVwZGF0ZUZlYXR1cmUgPSBmdW5jdGlvbiAoZmVhdHVyZSwgb3B0aW9ucykge1xuICAgICAgICBpZiAob3B0aW9ucy5zdHlsZSkge1xuICAgICAgICAgICAgdGhpcy51cGRhdGVTdHlsZShmZWF0dXJlLCBvcHRpb25zLnN0eWxlKTtcbiAgICAgICAgfVxuICAgIH07XG4gICAgcmV0dXJuIFVwZGF0ZUZlYXR1cmU7XG59KSgpO1xubW9kdWxlLmV4cG9ydHMgPSBVcGRhdGVGZWF0dXJlO1xuIiwiLy8vIDxyZWZlcmVuY2UgcGF0aD1cIm1hcHMudHNcIi8+XG52YXIgbWFwcyA9IHJlcXVpcmUoJy4vbWFwcycpO1xudmFyIFVwZGF0ZU1hcCA9IChmdW5jdGlvbiAoKSB7XG4gICAgZnVuY3Rpb24gVXBkYXRlTWFwKHRoYXQpIHtcbiAgICAgICAgdGhpcy50aGF0ID0gdGhhdDtcbiAgICB9XG4gICAgVXBkYXRlTWFwLnByb3RvdHlwZS51cGRhdGVNYXAgPSBmdW5jdGlvbiAoYXJncykge1xuICAgICAgICB2YXIgbWFwT3B0aW9ucyA9IG1hcHMubWFwT3B0aW9ucyhhcmdzKTtcbiAgICAgICAgcmV0dXJuIHRoaXMudGhhdC5pbnN0YW5jZS5zZXRPcHRpb25zKG1hcE9wdGlvbnMpO1xuICAgIH07XG4gICAgcmV0dXJuIFVwZGF0ZU1hcDtcbn0pKCk7XG5tb2R1bGUuZXhwb3J0cyA9IFVwZGF0ZU1hcDtcbiIsIi8vLyA8cmVmZXJlbmNlIHBhdGg9XCJ0eXBpbmdzL3RzZC5kLnRzXCIvPlxudmFyIHV0aWxzID0gcmVxdWlyZSgnLi91dGlscycpO1xudmFyIGNvbmZpZyA9IHJlcXVpcmUoJy4vY29uZmlnJyk7XG52YXIgZmluZE1hcmtlciA9IHJlcXVpcmUoJy4vZmluZE1hcmtlckJ5SWQnKTtcbnZhciBmaWx0ZXIgPSByZXF1aXJlKCcuL2ZpbHRlcicpO1xudmFyIFVwZGF0ZU1hcmtlciA9IChmdW5jdGlvbiAoKSB7XG4gICAgZnVuY3Rpb24gVXBkYXRlTWFya2VyKHRoYXQpIHtcbiAgICAgICAgdGhpcy50aGF0ID0gdGhhdDtcbiAgICAgICAgdmFyIGZpbmRNYXJrZXJJbnN0YW5jZSA9IG5ldyBmaW5kTWFya2VyKHRoYXQpO1xuICAgICAgICB0aGlzLmZpbmRNYXJrZXIgPSBmdW5jdGlvbiAobWFya2VyKSB7XG4gICAgICAgICAgICByZXR1cm4gZmluZE1hcmtlckluc3RhbmNlLmZpbmQobWFya2VyKTtcbiAgICAgICAgfTtcbiAgICB9XG4gICAgVXBkYXRlTWFya2VyLnByb3RvdHlwZS5yZW1vdmVUYWdzID0gZnVuY3Rpb24gKG1hcmtlcikge1xuICAgICAgICBpZiAodXRpbHMuaXNBcnJheShtYXJrZXIudGFncykpIHtcbiAgICAgICAgICAgIHZhciBpLCB0YWc7XG4gICAgICAgICAgICBmb3IgKGkgaW4gbWFya2VyLnRhZ3MpIHtcbiAgICAgICAgICAgICAgICBpZiAobWFya2VyLnRhZ3MuaGFzT3duUHJvcGVydHkoaSkpIHtcbiAgICAgICAgICAgICAgICAgICAgdGFnID0gbWFya2VyLnRhZ3NbaV07XG4gICAgICAgICAgICAgICAgICAgIGRlbGV0ZSB0aGlzLnRoYXQubWFya2Vycy50YWdzW3RhZ11bbWFya2VyLmRhdGEudWlkXTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBkZWxldGUgdGhpcy50aGF0Lm1hcmtlcnMudGFnc1ttYXJrZXIudGFnc11bbWFya2VyLmRhdGEudWlkXTtcbiAgICAgICAgfVxuICAgIH07XG4gICAgVXBkYXRlTWFya2VyLnByb3RvdHlwZS5hZGRUYWdzID0gZnVuY3Rpb24gKG1hcmtlciwgb3B0aW9ucykge1xuICAgICAgICBpZiAodXRpbHMuaXNBcnJheShvcHRpb25zLmN1c3RvbS50YWdzKSkge1xuICAgICAgICAgICAgdmFyIGksIHRhZztcbiAgICAgICAgICAgIGZvciAoaSBpbiBvcHRpb25zLmN1c3RvbS50YWdzKSB7XG4gICAgICAgICAgICAgICAgdGFnID0gb3B0aW9ucy5jdXN0b20udGFnc1tpXTtcbiAgICAgICAgICAgICAgICB0aGlzLnRoYXQubWFya2Vycy50YWdzW3RhZ10gPSB0aGlzLnRoYXQubWFya2Vycy50YWdzW3RhZ10gfHwge307XG4gICAgICAgICAgICAgICAgdGhpcy50aGF0Lm1hcmtlcnMudGFnc1t0YWddW21hcmtlci5kYXRhLnVpZF0gPSBtYXJrZXI7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICB0aGlzLnRoYXQubWFya2Vycy50YWdzW29wdGlvbnMuY3VzdG9tLnRhZ3NdID0gdGhpcy50aGF0Lm1hcmtlcnMudGFnc1tvcHRpb25zLmN1c3RvbS50YWdzXSB8fCB7fTtcbiAgICAgICAgICAgIHRoaXMudGhhdC5tYXJrZXJzLnRhZ3Nbb3B0aW9ucy5jdXN0b20udGFnc11bbWFya2VyLmRhdGEudWlkXSA9IG1hcmtlcjtcbiAgICAgICAgfVxuICAgICAgICBtYXJrZXIudGFncyA9IG9wdGlvbnMuY3VzdG9tLnRhZ3M7XG4gICAgfTtcbiAgICBVcGRhdGVNYXJrZXIucHJvdG90eXBlLnVwZGF0ZVRhZyA9IGZ1bmN0aW9uIChtYXJrZXIsIG9wdGlvbnMpIHtcbiAgICAgICAgdGhpcy5yZW1vdmVUYWdzKG1hcmtlcik7XG4gICAgICAgIHRoaXMuYWRkVGFncyhtYXJrZXIsIG9wdGlvbnMpO1xuICAgIH07XG4gICAgVXBkYXRlTWFya2VyLnByb3RvdHlwZS5jdXN0b21VcGRhdGUgPSBmdW5jdGlvbiAobWFya2VyLCBvcHRpb25zKSB7XG4gICAgICAgIGlmIChvcHRpb25zLmN1c3RvbSkge1xuICAgICAgICAgICAgaWYgKG9wdGlvbnMuY3VzdG9tLm1vdmUpIHtcbiAgICAgICAgICAgICAgICBtYXJrZXIuc2V0QW5pbWF0aW9uKGdvb2dsZS5tYXBzLkFuaW1hdGlvbltvcHRpb25zLmN1c3RvbS5tb3ZlLnRvVXBwZXJDYXNlKCldKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChvcHRpb25zLmN1c3RvbS5sYXQgJiYgb3B0aW9ucy5jdXN0b20ubG5nKSB7XG4gICAgICAgICAgICAgICAgbWFya2VyLnNldFBvc2l0aW9uKG5ldyBnb29nbGUubWFwcy5MYXRMbmcob3B0aW9ucy5jdXN0b20ubGF0LCBvcHRpb25zLmN1c3RvbS5sbmcpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChvcHRpb25zLmN1c3RvbS5pbmZvV2luZG93ICYmIG9wdGlvbnMuY3VzdG9tLmluZm9XaW5kb3cuY29udGVudCkge1xuICAgICAgICAgICAgICAgIG1hcmtlci5pbmZvV2luZG93LmNvbnRlbnQgPSBvcHRpb25zLmN1c3RvbS5pbmZvV2luZG93LmNvbnRlbnQ7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAob3B0aW9ucy5jdXN0b20udGFncykge1xuICAgICAgICAgICAgICAgIHRoaXMudXBkYXRlVGFnKG1hcmtlciwgb3B0aW9ucyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgaWYgKG9wdGlvbnMuZGVmYXVsdHMpIHtcbiAgICAgICAgICAgIG1hcmtlci5zZXRPcHRpb25zKG9wdGlvbnMuZGVmYXVsdHMpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBtYXJrZXI7XG4gICAgfTtcbiAgICBVcGRhdGVNYXJrZXIucHJvdG90eXBlLmJ1bGtVcGRhdGUgPSBmdW5jdGlvbiAoYXJncywgb3B0aW9ucykge1xuICAgICAgICB2YXIgbWFya2VyLCByZXN1bHRzID0gW10sIGluc3RhbmNlLCB4O1xuICAgICAgICBmb3IgKHggaW4gYXJncykge1xuICAgICAgICAgICAgaWYgKGFyZ3MuaGFzT3duUHJvcGVydHkoeCkpIHtcbiAgICAgICAgICAgICAgICBtYXJrZXIgPSBhcmdzW3hdO1xuICAgICAgICAgICAgICAgIGluc3RhbmNlID0gdGhpcy5jdXN0b21VcGRhdGUodGhpcy5maW5kTWFya2VyKG1hcmtlciksIG9wdGlvbnMpO1xuICAgICAgICAgICAgICAgIHJlc3VsdHMucHVzaChpbnN0YW5jZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHJlc3VsdHM7XG4gICAgfTtcbiAgICBVcGRhdGVNYXJrZXIucHJvdG90eXBlLmNvdW50VmlzaWJsZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIHgsIGNvdW50ID0gMDtcbiAgICAgICAgZm9yICh4IGluIHRoaXMudGhhdC5tYXJrZXJzLmFsbCkge1xuICAgICAgICAgICAgaWYgKHRoaXMudGhhdC5tYXJrZXJzLmFsbFt4XS52aXNpYmxlKSB7XG4gICAgICAgICAgICAgICAgY291bnQrKztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBnb29nbGUubWFwcy5ldmVudC50cmlnZ2VyKHRoaXMudGhhdC5pbnN0YW5jZSwgJ21hcmtlcl92aXNpYmlsaXR5X2NoYW5nZWQnLCBjb3VudCk7XG4gICAgfTtcbiAgICBVcGRhdGVNYXJrZXIucHJvdG90eXBlLnVwZGF0ZSA9IGZ1bmN0aW9uIChhcmdzLCBvcHRpb25zKSB7XG4gICAgICAgIHZhciB2aXNpYmlsaXR5RmxhZyA9IGZhbHNlO1xuICAgICAgICB2YXIgcHJlcGFyZWRPcHRpb25zID0gdXRpbHMucHJlcGFyZU9wdGlvbnMob3B0aW9ucywgY29uZmlnLmN1c3RvbU1hcmtlck9wdGlvbnMpO1xuICAgICAgICBpZiAocHJlcGFyZWRPcHRpb25zLmRlZmF1bHRzICYmIHByZXBhcmVkT3B0aW9ucy5kZWZhdWx0cy5oYXNPd25Qcm9wZXJ0eSgndmlzaWJsZScpICYmIHRoaXMudGhhdC5ldmVudHMuaW5kZXhPZignbWFya2VyX3Zpc2liaWxpdHlfY2hhbmdlZCcpID4gLTEpIHtcbiAgICAgICAgICAgIHZpc2liaWxpdHlGbGFnID0gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgICB2YXIgcmVzdWx0O1xuICAgICAgICB2YXIgdHlwZSA9IE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbChhcmdzKTtcbiAgICAgICAgaWYgKHR5cGUgPT09ICdbb2JqZWN0IE9iamVjdF0nKSB7XG4gICAgICAgICAgICBpZiAoT2JqZWN0LmtleXMoYXJncykubGVuZ3RoID09PSAxICYmIGFyZ3MudGFncykge1xuICAgICAgICAgICAgICAgIHZhciBmaWx0ZXJJbnN0YW5jZSA9IG5ldyBmaWx0ZXIodGhpcy50aGF0LCAnbWFya2VycycpO1xuICAgICAgICAgICAgICAgIHJlc3VsdCA9IHRoaXMuYnVsa1VwZGF0ZShmaWx0ZXJJbnN0YW5jZS5maWx0ZXIoYXJncyksIHByZXBhcmVkT3B0aW9ucyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICByZXN1bHQgPSB0aGlzLmN1c3RvbVVwZGF0ZSh0aGlzLmZpbmRNYXJrZXIoYXJncyksIHByZXBhcmVkT3B0aW9ucyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHR5cGUgPT09ICdbb2JqZWN0IEFycmF5XScpIHtcbiAgICAgICAgICAgIHJlc3VsdCA9IHRoaXMuYnVsa1VwZGF0ZShhcmdzLCBwcmVwYXJlZE9wdGlvbnMpO1xuICAgICAgICB9XG4gICAgICAgIGlmICh2aXNpYmlsaXR5RmxhZykge1xuICAgICAgICAgICAgdGhpcy5jb3VudFZpc2libGUoKTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLnRoYXQubWFya2Vycy5kYXRhQ2hhbmdlZCA9IHRydWU7XG4gICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfTtcbiAgICByZXR1cm4gVXBkYXRlTWFya2VyO1xufSkoKTtcbm1vZHVsZS5leHBvcnRzID0gVXBkYXRlTWFya2VyO1xuIiwidmFyIFV0aWxzID0gKGZ1bmN0aW9uICgpIHtcbiAgICBmdW5jdGlvbiBVdGlscygpIHtcbiAgICB9XG4gICAgVXRpbHMuY2xvbmUgPSBmdW5jdGlvbiAobywgZXhjZXB0aW9uS2V5cykge1xuICAgICAgICB2YXIgb3V0LCB2LCBrZXk7XG4gICAgICAgIG91dCA9IEFycmF5LmlzQXJyYXkobykgPyBbXSA6IHt9O1xuICAgICAgICBmb3IgKGtleSBpbiBvKSB7XG4gICAgICAgICAgICBpZiAoby5oYXNPd25Qcm9wZXJ0eShrZXkpKSB7XG4gICAgICAgICAgICAgICAgaWYgKCFleGNlcHRpb25LZXlzIHx8IChleGNlcHRpb25LZXlzICYmIGV4Y2VwdGlvbktleXMuaW5kZXhPZihrZXkpID09PSAtMSkpIHtcbiAgICAgICAgICAgICAgICAgICAgdiA9IG9ba2V5XTtcbiAgICAgICAgICAgICAgICAgICAgb3V0W2tleV0gPSAodHlwZW9mIHYgPT09ICdvYmplY3QnKSA/IHRoaXMuY2xvbmUodikgOiB2O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gb3V0O1xuICAgIH07XG4gICAgVXRpbHMuY3JlYXRlVWlkID0gZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gJ3h4eHh4eHh4eHh4eDR4eHh5eHh4eHh4eHh4eHh4eHh4Jy5yZXBsYWNlKC9beHldL2csIGZ1bmN0aW9uIChjKSB7XG4gICAgICAgICAgICB2YXIgciwgdjtcbiAgICAgICAgICAgIHIgPSBNYXRoLnJhbmRvbSgpICogMTYgfCAwO1xuICAgICAgICAgICAgdiA9IGMgPT09ICd4JyA/IHIgOiByICYgMHgzIHwgMHg4O1xuICAgICAgICAgICAgcmV0dXJuIHYudG9TdHJpbmcoMTYpO1xuICAgICAgICB9KTtcbiAgICB9O1xuICAgIFV0aWxzLnByZXBhcmVPcHRpb25zID0gZnVuY3Rpb24gKG9wdGlvbnMsIGN1c3RvbSkge1xuICAgICAgICB2YXIgcmVzdWx0ID0geyBjdXN0b206IHt9LCBkZWZhdWx0czoge30gfSwgb3B0aW9uO1xuICAgICAgICBmb3IgKG9wdGlvbiBpbiBvcHRpb25zKSB7XG4gICAgICAgICAgICBpZiAob3B0aW9ucy5oYXNPd25Qcm9wZXJ0eShvcHRpb24pKSB7XG4gICAgICAgICAgICAgICAgaWYgKGN1c3RvbS5pbmRleE9mKG9wdGlvbikgPiAtMSkge1xuICAgICAgICAgICAgICAgICAgICByZXN1bHQuY3VzdG9tID0gcmVzdWx0LmN1c3RvbSB8fCB7fTtcbiAgICAgICAgICAgICAgICAgICAgcmVzdWx0LmN1c3RvbVtvcHRpb25dID0gb3B0aW9uc1tvcHRpb25dO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgcmVzdWx0LmRlZmF1bHRzID0gcmVzdWx0LmRlZmF1bHRzIHx8IHt9O1xuICAgICAgICAgICAgICAgICAgICByZXN1bHQuZGVmYXVsdHNbb3B0aW9uXSA9IG9wdGlvbnNbb3B0aW9uXTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9O1xuICAgIFV0aWxzLmlzQXJyYXkgPSBmdW5jdGlvbiAoYXJnKSB7XG4gICAgICAgIHJldHVybiBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwoYXJnKSA9PT0gJ1tvYmplY3QgQXJyYXldJztcbiAgICB9O1xuICAgIFV0aWxzLnRvQXJyYXkgPSBmdW5jdGlvbiAob2JqKSB7XG4gICAgICAgIHJldHVybiBPYmplY3Qua2V5cyhvYmopLm1hcChmdW5jdGlvbiAoa2V5KSB7XG4gICAgICAgICAgICByZXR1cm4gb2JqW2tleV07XG4gICAgICAgIH0pO1xuICAgIH07XG4gICAgVXRpbHMuZGVmYXVsdERpbWVuc2lvbiA9IGZ1bmN0aW9uIChpdGVtKSB7XG4gICAgICAgIHJldHVybiBmdW5jdGlvbiAoZCkge1xuICAgICAgICAgICAgaWYgKHR5cGVvZiBkLmRhdGFbaXRlbV0gPT09ICd1bmRlZmluZWQnICYmIHR5cGVvZiBkW2l0ZW1dICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgICAgIHJldHVybiBkW2l0ZW1dO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHR5cGVvZiBkLmRhdGFbaXRlbV0gPT09ICd1bmRlZmluZWQnICYmIHR5cGVvZiBkW2l0ZW1dID09PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIGQuZGF0YVtpdGVtXTtcbiAgICAgICAgfTtcbiAgICB9O1xuICAgIC8vIGNvbXBhcmVzIHR3byBsaXN0cyBhbmQgcmV0dXJucyB0aGUgY29tbW9uIGl0ZW1zXG4gICAgVXRpbHMuZ2V0Q29tbW9uT2JqZWN0ID0gZnVuY3Rpb24gKGxpc3QxLCBsaXN0Mikge1xuICAgICAgICB2YXIgcmVzdWx0ID0ge307XG4gICAgICAgIGZvciAodmFyIHVpZCBpbiBsaXN0MSkge1xuICAgICAgICAgICAgaWYgKGxpc3QxLmhhc093blByb3BlcnR5KHVpZCkpIHtcbiAgICAgICAgICAgICAgICB2YXIgbWF0Y2ggPSBsaXN0Mlt1aWRdO1xuICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgbWF0Y2ggIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICAgICAgICAgIHJlc3VsdFt1aWRdID0gbWF0Y2g7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfTtcbiAgICByZXR1cm4gVXRpbHM7XG59KSgpO1xubW9kdWxlLmV4cG9ydHMgPSBVdGlscztcbiIsIihmdW5jdGlvbihleHBvcnRzKXtcbmNyb3NzZmlsdGVyLnZlcnNpb24gPSBcIjEuMy4xMlwiO1xuZnVuY3Rpb24gY3Jvc3NmaWx0ZXJfaWRlbnRpdHkoZCkge1xuICByZXR1cm4gZDtcbn1cbmNyb3NzZmlsdGVyLnBlcm11dGUgPSBwZXJtdXRlO1xuXG5mdW5jdGlvbiBwZXJtdXRlKGFycmF5LCBpbmRleCkge1xuICBmb3IgKHZhciBpID0gMCwgbiA9IGluZGV4Lmxlbmd0aCwgY29weSA9IG5ldyBBcnJheShuKTsgaSA8IG47ICsraSkge1xuICAgIGNvcHlbaV0gPSBhcnJheVtpbmRleFtpXV07XG4gIH1cbiAgcmV0dXJuIGNvcHk7XG59XG52YXIgYmlzZWN0ID0gY3Jvc3NmaWx0ZXIuYmlzZWN0ID0gYmlzZWN0X2J5KGNyb3NzZmlsdGVyX2lkZW50aXR5KTtcblxuYmlzZWN0LmJ5ID0gYmlzZWN0X2J5O1xuXG5mdW5jdGlvbiBiaXNlY3RfYnkoZikge1xuXG4gIC8vIExvY2F0ZSB0aGUgaW5zZXJ0aW9uIHBvaW50IGZvciB4IGluIGEgdG8gbWFpbnRhaW4gc29ydGVkIG9yZGVyLiBUaGVcbiAgLy8gYXJndW1lbnRzIGxvIGFuZCBoaSBtYXkgYmUgdXNlZCB0byBzcGVjaWZ5IGEgc3Vic2V0IG9mIHRoZSBhcnJheSB3aGljaFxuICAvLyBzaG91bGQgYmUgY29uc2lkZXJlZDsgYnkgZGVmYXVsdCB0aGUgZW50aXJlIGFycmF5IGlzIHVzZWQuIElmIHggaXMgYWxyZWFkeVxuICAvLyBwcmVzZW50IGluIGEsIHRoZSBpbnNlcnRpb24gcG9pbnQgd2lsbCBiZSBiZWZvcmUgKHRvIHRoZSBsZWZ0IG9mKSBhbnlcbiAgLy8gZXhpc3RpbmcgZW50cmllcy4gVGhlIHJldHVybiB2YWx1ZSBpcyBzdWl0YWJsZSBmb3IgdXNlIGFzIHRoZSBmaXJzdFxuICAvLyBhcmd1bWVudCB0byBgYXJyYXkuc3BsaWNlYCBhc3N1bWluZyB0aGF0IGEgaXMgYWxyZWFkeSBzb3J0ZWQuXG4gIC8vXG4gIC8vIFRoZSByZXR1cm5lZCBpbnNlcnRpb24gcG9pbnQgaSBwYXJ0aXRpb25zIHRoZSBhcnJheSBhIGludG8gdHdvIGhhbHZlcyBzb1xuICAvLyB0aGF0IGFsbCB2IDwgeCBmb3IgdiBpbiBhW2xvOmldIGZvciB0aGUgbGVmdCBzaWRlIGFuZCBhbGwgdiA+PSB4IGZvciB2IGluXG4gIC8vIGFbaTpoaV0gZm9yIHRoZSByaWdodCBzaWRlLlxuICBmdW5jdGlvbiBiaXNlY3RMZWZ0KGEsIHgsIGxvLCBoaSkge1xuICAgIHdoaWxlIChsbyA8IGhpKSB7XG4gICAgICB2YXIgbWlkID0gbG8gKyBoaSA+Pj4gMTtcbiAgICAgIGlmIChmKGFbbWlkXSkgPCB4KSBsbyA9IG1pZCArIDE7XG4gICAgICBlbHNlIGhpID0gbWlkO1xuICAgIH1cbiAgICByZXR1cm4gbG87XG4gIH1cblxuICAvLyBTaW1pbGFyIHRvIGJpc2VjdExlZnQsIGJ1dCByZXR1cm5zIGFuIGluc2VydGlvbiBwb2ludCB3aGljaCBjb21lcyBhZnRlciAodG9cbiAgLy8gdGhlIHJpZ2h0IG9mKSBhbnkgZXhpc3RpbmcgZW50cmllcyBvZiB4IGluIGEuXG4gIC8vXG4gIC8vIFRoZSByZXR1cm5lZCBpbnNlcnRpb24gcG9pbnQgaSBwYXJ0aXRpb25zIHRoZSBhcnJheSBpbnRvIHR3byBoYWx2ZXMgc28gdGhhdFxuICAvLyBhbGwgdiA8PSB4IGZvciB2IGluIGFbbG86aV0gZm9yIHRoZSBsZWZ0IHNpZGUgYW5kIGFsbCB2ID4geCBmb3IgdiBpblxuICAvLyBhW2k6aGldIGZvciB0aGUgcmlnaHQgc2lkZS5cbiAgZnVuY3Rpb24gYmlzZWN0UmlnaHQoYSwgeCwgbG8sIGhpKSB7XG4gICAgd2hpbGUgKGxvIDwgaGkpIHtcbiAgICAgIHZhciBtaWQgPSBsbyArIGhpID4+PiAxO1xuICAgICAgaWYgKHggPCBmKGFbbWlkXSkpIGhpID0gbWlkO1xuICAgICAgZWxzZSBsbyA9IG1pZCArIDE7XG4gICAgfVxuICAgIHJldHVybiBsbztcbiAgfVxuXG4gIGJpc2VjdFJpZ2h0LnJpZ2h0ID0gYmlzZWN0UmlnaHQ7XG4gIGJpc2VjdFJpZ2h0LmxlZnQgPSBiaXNlY3RMZWZ0O1xuICByZXR1cm4gYmlzZWN0UmlnaHQ7XG59XG52YXIgaGVhcCA9IGNyb3NzZmlsdGVyLmhlYXAgPSBoZWFwX2J5KGNyb3NzZmlsdGVyX2lkZW50aXR5KTtcblxuaGVhcC5ieSA9IGhlYXBfYnk7XG5cbmZ1bmN0aW9uIGhlYXBfYnkoZikge1xuXG4gIC8vIEJ1aWxkcyBhIGJpbmFyeSBoZWFwIHdpdGhpbiB0aGUgc3BlY2lmaWVkIGFycmF5IGFbbG86aGldLiBUaGUgaGVhcCBoYXMgdGhlXG4gIC8vIHByb3BlcnR5IHN1Y2ggdGhhdCB0aGUgcGFyZW50IGFbbG8raV0gaXMgYWx3YXlzIGxlc3MgdGhhbiBvciBlcXVhbCB0byBpdHNcbiAgLy8gdHdvIGNoaWxkcmVuOiBhW2xvKzIqaSsxXSBhbmQgYVtsbysyKmkrMl0uXG4gIGZ1bmN0aW9uIGhlYXAoYSwgbG8sIGhpKSB7XG4gICAgdmFyIG4gPSBoaSAtIGxvLFxuICAgICAgICBpID0gKG4gPj4+IDEpICsgMTtcbiAgICB3aGlsZSAoLS1pID4gMCkgc2lmdChhLCBpLCBuLCBsbyk7XG4gICAgcmV0dXJuIGE7XG4gIH1cblxuICAvLyBTb3J0cyB0aGUgc3BlY2lmaWVkIGFycmF5IGFbbG86aGldIGluIGRlc2NlbmRpbmcgb3JkZXIsIGFzc3VtaW5nIGl0IGlzXG4gIC8vIGFscmVhZHkgYSBoZWFwLlxuICBmdW5jdGlvbiBzb3J0KGEsIGxvLCBoaSkge1xuICAgIHZhciBuID0gaGkgLSBsbyxcbiAgICAgICAgdDtcbiAgICB3aGlsZSAoLS1uID4gMCkgdCA9IGFbbG9dLCBhW2xvXSA9IGFbbG8gKyBuXSwgYVtsbyArIG5dID0gdCwgc2lmdChhLCAxLCBuLCBsbyk7XG4gICAgcmV0dXJuIGE7XG4gIH1cblxuICAvLyBTaWZ0cyB0aGUgZWxlbWVudCBhW2xvK2ktMV0gZG93biB0aGUgaGVhcCwgd2hlcmUgdGhlIGhlYXAgaXMgdGhlIGNvbnRpZ3VvdXNcbiAgLy8gc2xpY2Ugb2YgYXJyYXkgYVtsbzpsbytuXS4gVGhpcyBtZXRob2QgY2FuIGFsc28gYmUgdXNlZCB0byB1cGRhdGUgdGhlIGhlYXBcbiAgLy8gaW5jcmVtZW50YWxseSwgd2l0aG91dCBpbmN1cnJpbmcgdGhlIGZ1bGwgY29zdCBvZiByZWNvbnN0cnVjdGluZyB0aGUgaGVhcC5cbiAgZnVuY3Rpb24gc2lmdChhLCBpLCBuLCBsbykge1xuICAgIHZhciBkID0gYVstLWxvICsgaV0sXG4gICAgICAgIHggPSBmKGQpLFxuICAgICAgICBjaGlsZDtcbiAgICB3aGlsZSAoKGNoaWxkID0gaSA8PCAxKSA8PSBuKSB7XG4gICAgICBpZiAoY2hpbGQgPCBuICYmIGYoYVtsbyArIGNoaWxkXSkgPiBmKGFbbG8gKyBjaGlsZCArIDFdKSkgY2hpbGQrKztcbiAgICAgIGlmICh4IDw9IGYoYVtsbyArIGNoaWxkXSkpIGJyZWFrO1xuICAgICAgYVtsbyArIGldID0gYVtsbyArIGNoaWxkXTtcbiAgICAgIGkgPSBjaGlsZDtcbiAgICB9XG4gICAgYVtsbyArIGldID0gZDtcbiAgfVxuXG4gIGhlYXAuc29ydCA9IHNvcnQ7XG4gIHJldHVybiBoZWFwO1xufVxudmFyIGhlYXBzZWxlY3QgPSBjcm9zc2ZpbHRlci5oZWFwc2VsZWN0ID0gaGVhcHNlbGVjdF9ieShjcm9zc2ZpbHRlcl9pZGVudGl0eSk7XG5cbmhlYXBzZWxlY3QuYnkgPSBoZWFwc2VsZWN0X2J5O1xuXG5mdW5jdGlvbiBoZWFwc2VsZWN0X2J5KGYpIHtcbiAgdmFyIGhlYXAgPSBoZWFwX2J5KGYpO1xuXG4gIC8vIFJldHVybnMgYSBuZXcgYXJyYXkgY29udGFpbmluZyB0aGUgdG9wIGsgZWxlbWVudHMgaW4gdGhlIGFycmF5IGFbbG86aGldLlxuICAvLyBUaGUgcmV0dXJuZWQgYXJyYXkgaXMgbm90IHNvcnRlZCwgYnV0IG1haW50YWlucyB0aGUgaGVhcCBwcm9wZXJ0eS4gSWYgayBpc1xuICAvLyBncmVhdGVyIHRoYW4gaGkgLSBsbywgdGhlbiBmZXdlciB0aGFuIGsgZWxlbWVudHMgd2lsbCBiZSByZXR1cm5lZC4gVGhlXG4gIC8vIG9yZGVyIG9mIGVsZW1lbnRzIGluIGEgaXMgdW5jaGFuZ2VkIGJ5IHRoaXMgb3BlcmF0aW9uLlxuICBmdW5jdGlvbiBoZWFwc2VsZWN0KGEsIGxvLCBoaSwgaykge1xuICAgIHZhciBxdWV1ZSA9IG5ldyBBcnJheShrID0gTWF0aC5taW4oaGkgLSBsbywgaykpLFxuICAgICAgICBtaW4sXG4gICAgICAgIGksXG4gICAgICAgIHgsXG4gICAgICAgIGQ7XG5cbiAgICBmb3IgKGkgPSAwOyBpIDwgazsgKytpKSBxdWV1ZVtpXSA9IGFbbG8rK107XG4gICAgaGVhcChxdWV1ZSwgMCwgayk7XG5cbiAgICBpZiAobG8gPCBoaSkge1xuICAgICAgbWluID0gZihxdWV1ZVswXSk7XG4gICAgICBkbyB7XG4gICAgICAgIGlmICh4ID0gZihkID0gYVtsb10pID4gbWluKSB7XG4gICAgICAgICAgcXVldWVbMF0gPSBkO1xuICAgICAgICAgIG1pbiA9IGYoaGVhcChxdWV1ZSwgMCwgaylbMF0pO1xuICAgICAgICB9XG4gICAgICB9IHdoaWxlICgrK2xvIDwgaGkpO1xuICAgIH1cblxuICAgIHJldHVybiBxdWV1ZTtcbiAgfVxuXG4gIHJldHVybiBoZWFwc2VsZWN0O1xufVxudmFyIGluc2VydGlvbnNvcnQgPSBjcm9zc2ZpbHRlci5pbnNlcnRpb25zb3J0ID0gaW5zZXJ0aW9uc29ydF9ieShjcm9zc2ZpbHRlcl9pZGVudGl0eSk7XG5cbmluc2VydGlvbnNvcnQuYnkgPSBpbnNlcnRpb25zb3J0X2J5O1xuXG5mdW5jdGlvbiBpbnNlcnRpb25zb3J0X2J5KGYpIHtcblxuICBmdW5jdGlvbiBpbnNlcnRpb25zb3J0KGEsIGxvLCBoaSkge1xuICAgIGZvciAodmFyIGkgPSBsbyArIDE7IGkgPCBoaTsgKytpKSB7XG4gICAgICBmb3IgKHZhciBqID0gaSwgdCA9IGFbaV0sIHggPSBmKHQpOyBqID4gbG8gJiYgZihhW2ogLSAxXSkgPiB4OyAtLWopIHtcbiAgICAgICAgYVtqXSA9IGFbaiAtIDFdO1xuICAgICAgfVxuICAgICAgYVtqXSA9IHQ7XG4gICAgfVxuICAgIHJldHVybiBhO1xuICB9XG5cbiAgcmV0dXJuIGluc2VydGlvbnNvcnQ7XG59XG4vLyBBbGdvcml0aG0gZGVzaWduZWQgYnkgVmxhZGltaXIgWWFyb3NsYXZza2l5LlxuLy8gSW1wbGVtZW50YXRpb24gYmFzZWQgb24gdGhlIERhcnQgcHJvamVjdDsgc2VlIGxpYi9kYXJ0L0xJQ0VOU0UgZm9yIGRldGFpbHMuXG5cbnZhciBxdWlja3NvcnQgPSBjcm9zc2ZpbHRlci5xdWlja3NvcnQgPSBxdWlja3NvcnRfYnkoY3Jvc3NmaWx0ZXJfaWRlbnRpdHkpO1xuXG5xdWlja3NvcnQuYnkgPSBxdWlja3NvcnRfYnk7XG5cbmZ1bmN0aW9uIHF1aWNrc29ydF9ieShmKSB7XG4gIHZhciBpbnNlcnRpb25zb3J0ID0gaW5zZXJ0aW9uc29ydF9ieShmKTtcblxuICBmdW5jdGlvbiBzb3J0KGEsIGxvLCBoaSkge1xuICAgIHJldHVybiAoaGkgLSBsbyA8IHF1aWNrc29ydF9zaXplVGhyZXNob2xkXG4gICAgICAgID8gaW5zZXJ0aW9uc29ydFxuICAgICAgICA6IHF1aWNrc29ydCkoYSwgbG8sIGhpKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHF1aWNrc29ydChhLCBsbywgaGkpIHtcbiAgICAvLyBDb21wdXRlIHRoZSB0d28gcGl2b3RzIGJ5IGxvb2tpbmcgYXQgNSBlbGVtZW50cy5cbiAgICB2YXIgc2l4dGggPSAoaGkgLSBsbykgLyA2IHwgMCxcbiAgICAgICAgaTEgPSBsbyArIHNpeHRoLFxuICAgICAgICBpNSA9IGhpIC0gMSAtIHNpeHRoLFxuICAgICAgICBpMyA9IGxvICsgaGkgLSAxID4+IDEsICAvLyBUaGUgbWlkcG9pbnQuXG4gICAgICAgIGkyID0gaTMgLSBzaXh0aCxcbiAgICAgICAgaTQgPSBpMyArIHNpeHRoO1xuXG4gICAgdmFyIGUxID0gYVtpMV0sIHgxID0gZihlMSksXG4gICAgICAgIGUyID0gYVtpMl0sIHgyID0gZihlMiksXG4gICAgICAgIGUzID0gYVtpM10sIHgzID0gZihlMyksXG4gICAgICAgIGU0ID0gYVtpNF0sIHg0ID0gZihlNCksXG4gICAgICAgIGU1ID0gYVtpNV0sIHg1ID0gZihlNSk7XG5cbiAgICB2YXIgdDtcblxuICAgIC8vIFNvcnQgdGhlIHNlbGVjdGVkIDUgZWxlbWVudHMgdXNpbmcgYSBzb3J0aW5nIG5ldHdvcmsuXG4gICAgaWYgKHgxID4geDIpIHQgPSBlMSwgZTEgPSBlMiwgZTIgPSB0LCB0ID0geDEsIHgxID0geDIsIHgyID0gdDtcbiAgICBpZiAoeDQgPiB4NSkgdCA9IGU0LCBlNCA9IGU1LCBlNSA9IHQsIHQgPSB4NCwgeDQgPSB4NSwgeDUgPSB0O1xuICAgIGlmICh4MSA+IHgzKSB0ID0gZTEsIGUxID0gZTMsIGUzID0gdCwgdCA9IHgxLCB4MSA9IHgzLCB4MyA9IHQ7XG4gICAgaWYgKHgyID4geDMpIHQgPSBlMiwgZTIgPSBlMywgZTMgPSB0LCB0ID0geDIsIHgyID0geDMsIHgzID0gdDtcbiAgICBpZiAoeDEgPiB4NCkgdCA9IGUxLCBlMSA9IGU0LCBlNCA9IHQsIHQgPSB4MSwgeDEgPSB4NCwgeDQgPSB0O1xuICAgIGlmICh4MyA+IHg0KSB0ID0gZTMsIGUzID0gZTQsIGU0ID0gdCwgdCA9IHgzLCB4MyA9IHg0LCB4NCA9IHQ7XG4gICAgaWYgKHgyID4geDUpIHQgPSBlMiwgZTIgPSBlNSwgZTUgPSB0LCB0ID0geDIsIHgyID0geDUsIHg1ID0gdDtcbiAgICBpZiAoeDIgPiB4MykgdCA9IGUyLCBlMiA9IGUzLCBlMyA9IHQsIHQgPSB4MiwgeDIgPSB4MywgeDMgPSB0O1xuICAgIGlmICh4NCA+IHg1KSB0ID0gZTQsIGU0ID0gZTUsIGU1ID0gdCwgdCA9IHg0LCB4NCA9IHg1LCB4NSA9IHQ7XG5cbiAgICB2YXIgcGl2b3QxID0gZTIsIHBpdm90VmFsdWUxID0geDIsXG4gICAgICAgIHBpdm90MiA9IGU0LCBwaXZvdFZhbHVlMiA9IHg0O1xuXG4gICAgLy8gZTIgYW5kIGU0IGhhdmUgYmVlbiBzYXZlZCBpbiB0aGUgcGl2b3QgdmFyaWFibGVzLiBUaGV5IHdpbGwgYmUgd3JpdHRlblxuICAgIC8vIGJhY2ssIG9uY2UgdGhlIHBhcnRpdGlvbmluZyBpcyBmaW5pc2hlZC5cbiAgICBhW2kxXSA9IGUxO1xuICAgIGFbaTJdID0gYVtsb107XG4gICAgYVtpM10gPSBlMztcbiAgICBhW2k0XSA9IGFbaGkgLSAxXTtcbiAgICBhW2k1XSA9IGU1O1xuXG4gICAgdmFyIGxlc3MgPSBsbyArIDEsICAgLy8gRmlyc3QgZWxlbWVudCBpbiB0aGUgbWlkZGxlIHBhcnRpdGlvbi5cbiAgICAgICAgZ3JlYXQgPSBoaSAtIDI7ICAvLyBMYXN0IGVsZW1lbnQgaW4gdGhlIG1pZGRsZSBwYXJ0aXRpb24uXG5cbiAgICAvLyBOb3RlIHRoYXQgZm9yIHZhbHVlIGNvbXBhcmlzb24sIDwsIDw9LCA+PSBhbmQgPiBjb2VyY2UgdG8gYSBwcmltaXRpdmUgdmlhXG4gICAgLy8gT2JqZWN0LnByb3RvdHlwZS52YWx1ZU9mOyA9PSBhbmQgPT09IGRvIG5vdCwgc28gaW4gb3JkZXIgdG8gYmUgY29uc2lzdGVudFxuICAgIC8vIHdpdGggbmF0dXJhbCBvcmRlciAoc3VjaCBhcyBmb3IgRGF0ZSBvYmplY3RzKSwgd2UgbXVzdCBkbyB0d28gY29tcGFyZXMuXG4gICAgdmFyIHBpdm90c0VxdWFsID0gcGl2b3RWYWx1ZTEgPD0gcGl2b3RWYWx1ZTIgJiYgcGl2b3RWYWx1ZTEgPj0gcGl2b3RWYWx1ZTI7XG4gICAgaWYgKHBpdm90c0VxdWFsKSB7XG5cbiAgICAgIC8vIERlZ2VuZXJhdGVkIGNhc2Ugd2hlcmUgdGhlIHBhcnRpdGlvbmluZyBiZWNvbWVzIGEgZHV0Y2ggbmF0aW9uYWwgZmxhZ1xuICAgICAgLy8gcHJvYmxlbS5cbiAgICAgIC8vXG4gICAgICAvLyBbIHwgIDwgcGl2b3QgIHwgPT0gcGl2b3QgfCB1bnBhcnRpdGlvbmVkIHwgPiBwaXZvdCAgfCBdXG4gICAgICAvLyAgXiAgICAgICAgICAgICBeICAgICAgICAgIF4gICAgICAgICAgICAgXiAgICAgICAgICAgIF5cbiAgICAgIC8vIGxlZnQgICAgICAgICBsZXNzICAgICAgICAgayAgICAgICAgICAgZ3JlYXQgICAgICAgICByaWdodFxuICAgICAgLy9cbiAgICAgIC8vIGFbbGVmdF0gYW5kIGFbcmlnaHRdIGFyZSB1bmRlZmluZWQgYW5kIGFyZSBmaWxsZWQgYWZ0ZXIgdGhlXG4gICAgICAvLyBwYXJ0aXRpb25pbmcuXG4gICAgICAvL1xuICAgICAgLy8gSW52YXJpYW50czpcbiAgICAgIC8vICAgMSkgZm9yIHggaW4gXWxlZnQsIGxlc3NbIDogeCA8IHBpdm90LlxuICAgICAgLy8gICAyKSBmb3IgeCBpbiBbbGVzcywga1sgOiB4ID09IHBpdm90LlxuICAgICAgLy8gICAzKSBmb3IgeCBpbiBdZ3JlYXQsIHJpZ2h0WyA6IHggPiBwaXZvdC5cbiAgICAgIGZvciAodmFyIGsgPSBsZXNzOyBrIDw9IGdyZWF0OyArK2spIHtcbiAgICAgICAgdmFyIGVrID0gYVtrXSwgeGsgPSBmKGVrKTtcbiAgICAgICAgaWYgKHhrIDwgcGl2b3RWYWx1ZTEpIHtcbiAgICAgICAgICBpZiAoayAhPT0gbGVzcykge1xuICAgICAgICAgICAgYVtrXSA9IGFbbGVzc107XG4gICAgICAgICAgICBhW2xlc3NdID0gZWs7XG4gICAgICAgICAgfVxuICAgICAgICAgICsrbGVzcztcbiAgICAgICAgfSBlbHNlIGlmICh4ayA+IHBpdm90VmFsdWUxKSB7XG5cbiAgICAgICAgICAvLyBGaW5kIHRoZSBmaXJzdCBlbGVtZW50IDw9IHBpdm90IGluIHRoZSByYW5nZSBbayAtIDEsIGdyZWF0XSBhbmRcbiAgICAgICAgICAvLyBwdXQgWzplazpdIHRoZXJlLiBXZSBrbm93IHRoYXQgc3VjaCBhbiBlbGVtZW50IG11c3QgZXhpc3Q6XG4gICAgICAgICAgLy8gV2hlbiBrID09IGxlc3MsIHRoZW4gZWwzICh3aGljaCBpcyBlcXVhbCB0byBwaXZvdCkgbGllcyBpbiB0aGVcbiAgICAgICAgICAvLyBpbnRlcnZhbC4gT3RoZXJ3aXNlIGFbayAtIDFdID09IHBpdm90IGFuZCB0aGUgc2VhcmNoIHN0b3BzIGF0IGstMS5cbiAgICAgICAgICAvLyBOb3RlIHRoYXQgaW4gdGhlIGxhdHRlciBjYXNlIGludmFyaWFudCAyIHdpbGwgYmUgdmlvbGF0ZWQgZm9yIGFcbiAgICAgICAgICAvLyBzaG9ydCBhbW91bnQgb2YgdGltZS4gVGhlIGludmFyaWFudCB3aWxsIGJlIHJlc3RvcmVkIHdoZW4gdGhlXG4gICAgICAgICAgLy8gcGl2b3RzIGFyZSBwdXQgaW50byB0aGVpciBmaW5hbCBwb3NpdGlvbnMuXG4gICAgICAgICAgd2hpbGUgKHRydWUpIHtcbiAgICAgICAgICAgIHZhciBncmVhdFZhbHVlID0gZihhW2dyZWF0XSk7XG4gICAgICAgICAgICBpZiAoZ3JlYXRWYWx1ZSA+IHBpdm90VmFsdWUxKSB7XG4gICAgICAgICAgICAgIGdyZWF0LS07XG4gICAgICAgICAgICAgIC8vIFRoaXMgaXMgdGhlIG9ubHkgbG9jYXRpb24gaW4gdGhlIHdoaWxlLWxvb3Agd2hlcmUgYSBuZXdcbiAgICAgICAgICAgICAgLy8gaXRlcmF0aW9uIGlzIHN0YXJ0ZWQuXG4gICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgfSBlbHNlIGlmIChncmVhdFZhbHVlIDwgcGl2b3RWYWx1ZTEpIHtcbiAgICAgICAgICAgICAgLy8gVHJpcGxlIGV4Y2hhbmdlLlxuICAgICAgICAgICAgICBhW2tdID0gYVtsZXNzXTtcbiAgICAgICAgICAgICAgYVtsZXNzKytdID0gYVtncmVhdF07XG4gICAgICAgICAgICAgIGFbZ3JlYXQtLV0gPSBlaztcbiAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICBhW2tdID0gYVtncmVhdF07XG4gICAgICAgICAgICAgIGFbZ3JlYXQtLV0gPSBlaztcbiAgICAgICAgICAgICAgLy8gTm90ZTogaWYgZ3JlYXQgPCBrIHRoZW4gd2Ugd2lsbCBleGl0IHRoZSBvdXRlciBsb29wIGFuZCBmaXhcbiAgICAgICAgICAgICAgLy8gaW52YXJpYW50IDIgKHdoaWNoIHdlIGp1c3QgdmlvbGF0ZWQpLlxuICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuXG4gICAgICAvLyBXZSBwYXJ0aXRpb24gdGhlIGxpc3QgaW50byB0aHJlZSBwYXJ0czpcbiAgICAgIC8vICAxLiA8IHBpdm90MVxuICAgICAgLy8gIDIuID49IHBpdm90MSAmJiA8PSBwaXZvdDJcbiAgICAgIC8vICAzLiA+IHBpdm90MlxuICAgICAgLy9cbiAgICAgIC8vIER1cmluZyB0aGUgbG9vcCB3ZSBoYXZlOlxuICAgICAgLy8gWyB8IDwgcGl2b3QxIHwgPj0gcGl2b3QxICYmIDw9IHBpdm90MiB8IHVucGFydGl0aW9uZWQgIHwgPiBwaXZvdDIgIHwgXVxuICAgICAgLy8gIF4gICAgICAgICAgICBeICAgICAgICAgICAgICAgICAgICAgICAgXiAgICAgICAgICAgICAgXiAgICAgICAgICAgICBeXG4gICAgICAvLyBsZWZ0ICAgICAgICAgbGVzcyAgICAgICAgICAgICAgICAgICAgIGsgICAgICAgICAgICAgIGdyZWF0ICAgICAgICByaWdodFxuICAgICAgLy9cbiAgICAgIC8vIGFbbGVmdF0gYW5kIGFbcmlnaHRdIGFyZSB1bmRlZmluZWQgYW5kIGFyZSBmaWxsZWQgYWZ0ZXIgdGhlXG4gICAgICAvLyBwYXJ0aXRpb25pbmcuXG4gICAgICAvL1xuICAgICAgLy8gSW52YXJpYW50czpcbiAgICAgIC8vICAgMS4gZm9yIHggaW4gXWxlZnQsIGxlc3NbIDogeCA8IHBpdm90MVxuICAgICAgLy8gICAyLiBmb3IgeCBpbiBbbGVzcywga1sgOiBwaXZvdDEgPD0geCAmJiB4IDw9IHBpdm90MlxuICAgICAgLy8gICAzLiBmb3IgeCBpbiBdZ3JlYXQsIHJpZ2h0WyA6IHggPiBwaXZvdDJcbiAgICAgIGZvciAodmFyIGsgPSBsZXNzOyBrIDw9IGdyZWF0OyBrKyspIHtcbiAgICAgICAgdmFyIGVrID0gYVtrXSwgeGsgPSBmKGVrKTtcbiAgICAgICAgaWYgKHhrIDwgcGl2b3RWYWx1ZTEpIHtcbiAgICAgICAgICBpZiAoayAhPT0gbGVzcykge1xuICAgICAgICAgICAgYVtrXSA9IGFbbGVzc107XG4gICAgICAgICAgICBhW2xlc3NdID0gZWs7XG4gICAgICAgICAgfVxuICAgICAgICAgICsrbGVzcztcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBpZiAoeGsgPiBwaXZvdFZhbHVlMikge1xuICAgICAgICAgICAgd2hpbGUgKHRydWUpIHtcbiAgICAgICAgICAgICAgdmFyIGdyZWF0VmFsdWUgPSBmKGFbZ3JlYXRdKTtcbiAgICAgICAgICAgICAgaWYgKGdyZWF0VmFsdWUgPiBwaXZvdFZhbHVlMikge1xuICAgICAgICAgICAgICAgIGdyZWF0LS07XG4gICAgICAgICAgICAgICAgaWYgKGdyZWF0IDwgaykgYnJlYWs7XG4gICAgICAgICAgICAgICAgLy8gVGhpcyBpcyB0aGUgb25seSBsb2NhdGlvbiBpbnNpZGUgdGhlIGxvb3Agd2hlcmUgYSBuZXdcbiAgICAgICAgICAgICAgICAvLyBpdGVyYXRpb24gaXMgc3RhcnRlZC5cbiAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAvLyBhW2dyZWF0XSA8PSBwaXZvdDIuXG4gICAgICAgICAgICAgICAgaWYgKGdyZWF0VmFsdWUgPCBwaXZvdFZhbHVlMSkge1xuICAgICAgICAgICAgICAgICAgLy8gVHJpcGxlIGV4Y2hhbmdlLlxuICAgICAgICAgICAgICAgICAgYVtrXSA9IGFbbGVzc107XG4gICAgICAgICAgICAgICAgICBhW2xlc3MrK10gPSBhW2dyZWF0XTtcbiAgICAgICAgICAgICAgICAgIGFbZ3JlYXQtLV0gPSBlaztcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgLy8gYVtncmVhdF0gPj0gcGl2b3QxLlxuICAgICAgICAgICAgICAgICAgYVtrXSA9IGFbZ3JlYXRdO1xuICAgICAgICAgICAgICAgICAgYVtncmVhdC0tXSA9IGVrO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIC8vIE1vdmUgcGl2b3RzIGludG8gdGhlaXIgZmluYWwgcG9zaXRpb25zLlxuICAgIC8vIFdlIHNocnVuayB0aGUgbGlzdCBmcm9tIGJvdGggc2lkZXMgKGFbbGVmdF0gYW5kIGFbcmlnaHRdIGhhdmVcbiAgICAvLyBtZWFuaW5nbGVzcyB2YWx1ZXMgaW4gdGhlbSkgYW5kIG5vdyB3ZSBtb3ZlIGVsZW1lbnRzIGZyb20gdGhlIGZpcnN0XG4gICAgLy8gYW5kIHRoaXJkIHBhcnRpdGlvbiBpbnRvIHRoZXNlIGxvY2F0aW9ucyBzbyB0aGF0IHdlIGNhbiBzdG9yZSB0aGVcbiAgICAvLyBwaXZvdHMuXG4gICAgYVtsb10gPSBhW2xlc3MgLSAxXTtcbiAgICBhW2xlc3MgLSAxXSA9IHBpdm90MTtcbiAgICBhW2hpIC0gMV0gPSBhW2dyZWF0ICsgMV07XG4gICAgYVtncmVhdCArIDFdID0gcGl2b3QyO1xuXG4gICAgLy8gVGhlIGxpc3QgaXMgbm93IHBhcnRpdGlvbmVkIGludG8gdGhyZWUgcGFydGl0aW9uczpcbiAgICAvLyBbIDwgcGl2b3QxICAgfCA+PSBwaXZvdDEgJiYgPD0gcGl2b3QyICAgfCAgPiBwaXZvdDIgICBdXG4gICAgLy8gIF4gICAgICAgICAgICBeICAgICAgICAgICAgICAgICAgICAgICAgXiAgICAgICAgICAgICBeXG4gICAgLy8gbGVmdCAgICAgICAgIGxlc3MgICAgICAgICAgICAgICAgICAgICBncmVhdCAgICAgICAgcmlnaHRcblxuICAgIC8vIFJlY3Vyc2l2ZSBkZXNjZW50LiAoRG9uJ3QgaW5jbHVkZSB0aGUgcGl2b3QgdmFsdWVzLilcbiAgICBzb3J0KGEsIGxvLCBsZXNzIC0gMSk7XG4gICAgc29ydChhLCBncmVhdCArIDIsIGhpKTtcblxuICAgIGlmIChwaXZvdHNFcXVhbCkge1xuICAgICAgLy8gQWxsIGVsZW1lbnRzIGluIHRoZSBzZWNvbmQgcGFydGl0aW9uIGFyZSBlcXVhbCB0byB0aGUgcGl2b3QuIE5vXG4gICAgICAvLyBuZWVkIHRvIHNvcnQgdGhlbS5cbiAgICAgIHJldHVybiBhO1xuICAgIH1cblxuICAgIC8vIEluIHRoZW9yeSBpdCBzaG91bGQgYmUgZW5vdWdoIHRvIGNhbGwgX2RvU29ydCByZWN1cnNpdmVseSBvbiB0aGUgc2Vjb25kXG4gICAgLy8gcGFydGl0aW9uLlxuICAgIC8vIFRoZSBBbmRyb2lkIHNvdXJjZSBob3dldmVyIHJlbW92ZXMgdGhlIHBpdm90IGVsZW1lbnRzIGZyb20gdGhlIHJlY3Vyc2l2ZVxuICAgIC8vIGNhbGwgaWYgdGhlIHNlY29uZCBwYXJ0aXRpb24gaXMgdG9vIGxhcmdlIChtb3JlIHRoYW4gMi8zIG9mIHRoZSBsaXN0KS5cbiAgICBpZiAobGVzcyA8IGkxICYmIGdyZWF0ID4gaTUpIHtcbiAgICAgIHZhciBsZXNzVmFsdWUsIGdyZWF0VmFsdWU7XG4gICAgICB3aGlsZSAoKGxlc3NWYWx1ZSA9IGYoYVtsZXNzXSkpIDw9IHBpdm90VmFsdWUxICYmIGxlc3NWYWx1ZSA+PSBwaXZvdFZhbHVlMSkgKytsZXNzO1xuICAgICAgd2hpbGUgKChncmVhdFZhbHVlID0gZihhW2dyZWF0XSkpIDw9IHBpdm90VmFsdWUyICYmIGdyZWF0VmFsdWUgPj0gcGl2b3RWYWx1ZTIpIC0tZ3JlYXQ7XG5cbiAgICAgIC8vIENvcHkgcGFzdGUgb2YgdGhlIHByZXZpb3VzIDMtd2F5IHBhcnRpdGlvbmluZyB3aXRoIGFkYXB0aW9ucy5cbiAgICAgIC8vXG4gICAgICAvLyBXZSBwYXJ0aXRpb24gdGhlIGxpc3QgaW50byB0aHJlZSBwYXJ0czpcbiAgICAgIC8vICAxLiA9PSBwaXZvdDFcbiAgICAgIC8vICAyLiA+IHBpdm90MSAmJiA8IHBpdm90MlxuICAgICAgLy8gIDMuID09IHBpdm90MlxuICAgICAgLy9cbiAgICAgIC8vIER1cmluZyB0aGUgbG9vcCB3ZSBoYXZlOlxuICAgICAgLy8gWyA9PSBwaXZvdDEgfCA+IHBpdm90MSAmJiA8IHBpdm90MiB8IHVucGFydGl0aW9uZWQgIHwgPT0gcGl2b3QyIF1cbiAgICAgIC8vICAgICAgICAgICAgICBeICAgICAgICAgICAgICAgICAgICAgIF4gICAgICAgICAgICAgIF5cbiAgICAgIC8vICAgICAgICAgICAgbGVzcyAgICAgICAgICAgICAgICAgICAgIGsgICAgICAgICAgICAgIGdyZWF0XG4gICAgICAvL1xuICAgICAgLy8gSW52YXJpYW50czpcbiAgICAgIC8vICAgMS4gZm9yIHggaW4gWyAqLCBsZXNzWyA6IHggPT0gcGl2b3QxXG4gICAgICAvLyAgIDIuIGZvciB4IGluIFtsZXNzLCBrWyA6IHBpdm90MSA8IHggJiYgeCA8IHBpdm90MlxuICAgICAgLy8gICAzLiBmb3IgeCBpbiBdZ3JlYXQsICogXSA6IHggPT0gcGl2b3QyXG4gICAgICBmb3IgKHZhciBrID0gbGVzczsgayA8PSBncmVhdDsgaysrKSB7XG4gICAgICAgIHZhciBlayA9IGFba10sIHhrID0gZihlayk7XG4gICAgICAgIGlmICh4ayA8PSBwaXZvdFZhbHVlMSAmJiB4ayA+PSBwaXZvdFZhbHVlMSkge1xuICAgICAgICAgIGlmIChrICE9PSBsZXNzKSB7XG4gICAgICAgICAgICBhW2tdID0gYVtsZXNzXTtcbiAgICAgICAgICAgIGFbbGVzc10gPSBlaztcbiAgICAgICAgICB9XG4gICAgICAgICAgbGVzcysrO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGlmICh4ayA8PSBwaXZvdFZhbHVlMiAmJiB4ayA+PSBwaXZvdFZhbHVlMikge1xuICAgICAgICAgICAgd2hpbGUgKHRydWUpIHtcbiAgICAgICAgICAgICAgdmFyIGdyZWF0VmFsdWUgPSBmKGFbZ3JlYXRdKTtcbiAgICAgICAgICAgICAgaWYgKGdyZWF0VmFsdWUgPD0gcGl2b3RWYWx1ZTIgJiYgZ3JlYXRWYWx1ZSA+PSBwaXZvdFZhbHVlMikge1xuICAgICAgICAgICAgICAgIGdyZWF0LS07XG4gICAgICAgICAgICAgICAgaWYgKGdyZWF0IDwgaykgYnJlYWs7XG4gICAgICAgICAgICAgICAgLy8gVGhpcyBpcyB0aGUgb25seSBsb2NhdGlvbiBpbnNpZGUgdGhlIGxvb3Agd2hlcmUgYSBuZXdcbiAgICAgICAgICAgICAgICAvLyBpdGVyYXRpb24gaXMgc3RhcnRlZC5cbiAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAvLyBhW2dyZWF0XSA8IHBpdm90Mi5cbiAgICAgICAgICAgICAgICBpZiAoZ3JlYXRWYWx1ZSA8IHBpdm90VmFsdWUxKSB7XG4gICAgICAgICAgICAgICAgICAvLyBUcmlwbGUgZXhjaGFuZ2UuXG4gICAgICAgICAgICAgICAgICBhW2tdID0gYVtsZXNzXTtcbiAgICAgICAgICAgICAgICAgIGFbbGVzcysrXSA9IGFbZ3JlYXRdO1xuICAgICAgICAgICAgICAgICAgYVtncmVhdC0tXSA9IGVrO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAvLyBhW2dyZWF0XSA9PSBwaXZvdDEuXG4gICAgICAgICAgICAgICAgICBhW2tdID0gYVtncmVhdF07XG4gICAgICAgICAgICAgICAgICBhW2dyZWF0LS1dID0gZWs7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gVGhlIHNlY29uZCBwYXJ0aXRpb24gaGFzIG5vdyBiZWVuIGNsZWFyZWQgb2YgcGl2b3QgZWxlbWVudHMgYW5kIGxvb2tzXG4gICAgLy8gYXMgZm9sbG93czpcbiAgICAvLyBbICAqICB8ICA+IHBpdm90MSAmJiA8IHBpdm90MiAgfCAqIF1cbiAgICAvLyAgICAgICAgXiAgICAgICAgICAgICAgICAgICAgICBeXG4gICAgLy8gICAgICAgbGVzcyAgICAgICAgICAgICAgICAgIGdyZWF0XG4gICAgLy8gU29ydCB0aGUgc2Vjb25kIHBhcnRpdGlvbiB1c2luZyByZWN1cnNpdmUgZGVzY2VudC5cblxuICAgIC8vIFRoZSBzZWNvbmQgcGFydGl0aW9uIGxvb2tzIGFzIGZvbGxvd3M6XG4gICAgLy8gWyAgKiAgfCAgPj0gcGl2b3QxICYmIDw9IHBpdm90MiAgfCAqIF1cbiAgICAvLyAgICAgICAgXiAgICAgICAgICAgICAgICAgICAgICAgIF5cbiAgICAvLyAgICAgICBsZXNzICAgICAgICAgICAgICAgICAgICBncmVhdFxuICAgIC8vIFNpbXBseSBzb3J0IGl0IGJ5IHJlY3Vyc2l2ZSBkZXNjZW50LlxuXG4gICAgcmV0dXJuIHNvcnQoYSwgbGVzcywgZ3JlYXQgKyAxKTtcbiAgfVxuXG4gIHJldHVybiBzb3J0O1xufVxuXG52YXIgcXVpY2tzb3J0X3NpemVUaHJlc2hvbGQgPSAzMjtcbnZhciBjcm9zc2ZpbHRlcl9hcnJheTggPSBjcm9zc2ZpbHRlcl9hcnJheVVudHlwZWQsXG4gICAgY3Jvc3NmaWx0ZXJfYXJyYXkxNiA9IGNyb3NzZmlsdGVyX2FycmF5VW50eXBlZCxcbiAgICBjcm9zc2ZpbHRlcl9hcnJheTMyID0gY3Jvc3NmaWx0ZXJfYXJyYXlVbnR5cGVkLFxuICAgIGNyb3NzZmlsdGVyX2FycmF5TGVuZ3RoZW4gPSBjcm9zc2ZpbHRlcl9hcnJheUxlbmd0aGVuVW50eXBlZCxcbiAgICBjcm9zc2ZpbHRlcl9hcnJheVdpZGVuID0gY3Jvc3NmaWx0ZXJfYXJyYXlXaWRlblVudHlwZWQ7XG5cbmlmICh0eXBlb2YgVWludDhBcnJheSAhPT0gXCJ1bmRlZmluZWRcIikge1xuICBjcm9zc2ZpbHRlcl9hcnJheTggPSBmdW5jdGlvbihuKSB7IHJldHVybiBuZXcgVWludDhBcnJheShuKTsgfTtcbiAgY3Jvc3NmaWx0ZXJfYXJyYXkxNiA9IGZ1bmN0aW9uKG4pIHsgcmV0dXJuIG5ldyBVaW50MTZBcnJheShuKTsgfTtcbiAgY3Jvc3NmaWx0ZXJfYXJyYXkzMiA9IGZ1bmN0aW9uKG4pIHsgcmV0dXJuIG5ldyBVaW50MzJBcnJheShuKTsgfTtcblxuICBjcm9zc2ZpbHRlcl9hcnJheUxlbmd0aGVuID0gZnVuY3Rpb24oYXJyYXksIGxlbmd0aCkge1xuICAgIGlmIChhcnJheS5sZW5ndGggPj0gbGVuZ3RoKSByZXR1cm4gYXJyYXk7XG4gICAgdmFyIGNvcHkgPSBuZXcgYXJyYXkuY29uc3RydWN0b3IobGVuZ3RoKTtcbiAgICBjb3B5LnNldChhcnJheSk7XG4gICAgcmV0dXJuIGNvcHk7XG4gIH07XG5cbiAgY3Jvc3NmaWx0ZXJfYXJyYXlXaWRlbiA9IGZ1bmN0aW9uKGFycmF5LCB3aWR0aCkge1xuICAgIHZhciBjb3B5O1xuICAgIHN3aXRjaCAod2lkdGgpIHtcbiAgICAgIGNhc2UgMTY6IGNvcHkgPSBjcm9zc2ZpbHRlcl9hcnJheTE2KGFycmF5Lmxlbmd0aCk7IGJyZWFrO1xuICAgICAgY2FzZSAzMjogY29weSA9IGNyb3NzZmlsdGVyX2FycmF5MzIoYXJyYXkubGVuZ3RoKTsgYnJlYWs7XG4gICAgICBkZWZhdWx0OiB0aHJvdyBuZXcgRXJyb3IoXCJpbnZhbGlkIGFycmF5IHdpZHRoIVwiKTtcbiAgICB9XG4gICAgY29weS5zZXQoYXJyYXkpO1xuICAgIHJldHVybiBjb3B5O1xuICB9O1xufVxuXG5mdW5jdGlvbiBjcm9zc2ZpbHRlcl9hcnJheVVudHlwZWQobikge1xuICB2YXIgYXJyYXkgPSBuZXcgQXJyYXkobiksIGkgPSAtMTtcbiAgd2hpbGUgKCsraSA8IG4pIGFycmF5W2ldID0gMDtcbiAgcmV0dXJuIGFycmF5O1xufVxuXG5mdW5jdGlvbiBjcm9zc2ZpbHRlcl9hcnJheUxlbmd0aGVuVW50eXBlZChhcnJheSwgbGVuZ3RoKSB7XG4gIHZhciBuID0gYXJyYXkubGVuZ3RoO1xuICB3aGlsZSAobiA8IGxlbmd0aCkgYXJyYXlbbisrXSA9IDA7XG4gIHJldHVybiBhcnJheTtcbn1cblxuZnVuY3Rpb24gY3Jvc3NmaWx0ZXJfYXJyYXlXaWRlblVudHlwZWQoYXJyYXksIHdpZHRoKSB7XG4gIGlmICh3aWR0aCA+IDMyKSB0aHJvdyBuZXcgRXJyb3IoXCJpbnZhbGlkIGFycmF5IHdpZHRoIVwiKTtcbiAgcmV0dXJuIGFycmF5O1xufVxuZnVuY3Rpb24gY3Jvc3NmaWx0ZXJfZmlsdGVyRXhhY3QoYmlzZWN0LCB2YWx1ZSkge1xuICByZXR1cm4gZnVuY3Rpb24odmFsdWVzKSB7XG4gICAgdmFyIG4gPSB2YWx1ZXMubGVuZ3RoO1xuICAgIHJldHVybiBbYmlzZWN0LmxlZnQodmFsdWVzLCB2YWx1ZSwgMCwgbiksIGJpc2VjdC5yaWdodCh2YWx1ZXMsIHZhbHVlLCAwLCBuKV07XG4gIH07XG59XG5cbmZ1bmN0aW9uIGNyb3NzZmlsdGVyX2ZpbHRlclJhbmdlKGJpc2VjdCwgcmFuZ2UpIHtcbiAgdmFyIG1pbiA9IHJhbmdlWzBdLFxuICAgICAgbWF4ID0gcmFuZ2VbMV07XG4gIHJldHVybiBmdW5jdGlvbih2YWx1ZXMpIHtcbiAgICB2YXIgbiA9IHZhbHVlcy5sZW5ndGg7XG4gICAgcmV0dXJuIFtiaXNlY3QubGVmdCh2YWx1ZXMsIG1pbiwgMCwgbiksIGJpc2VjdC5sZWZ0KHZhbHVlcywgbWF4LCAwLCBuKV07XG4gIH07XG59XG5cbmZ1bmN0aW9uIGNyb3NzZmlsdGVyX2ZpbHRlckFsbCh2YWx1ZXMpIHtcbiAgcmV0dXJuIFswLCB2YWx1ZXMubGVuZ3RoXTtcbn1cbmZ1bmN0aW9uIGNyb3NzZmlsdGVyX251bGwoKSB7XG4gIHJldHVybiBudWxsO1xufVxuZnVuY3Rpb24gY3Jvc3NmaWx0ZXJfemVybygpIHtcbiAgcmV0dXJuIDA7XG59XG5mdW5jdGlvbiBjcm9zc2ZpbHRlcl9yZWR1Y2VJbmNyZW1lbnQocCkge1xuICByZXR1cm4gcCArIDE7XG59XG5cbmZ1bmN0aW9uIGNyb3NzZmlsdGVyX3JlZHVjZURlY3JlbWVudChwKSB7XG4gIHJldHVybiBwIC0gMTtcbn1cblxuZnVuY3Rpb24gY3Jvc3NmaWx0ZXJfcmVkdWNlQWRkKGYpIHtcbiAgcmV0dXJuIGZ1bmN0aW9uKHAsIHYpIHtcbiAgICByZXR1cm4gcCArICtmKHYpO1xuICB9O1xufVxuXG5mdW5jdGlvbiBjcm9zc2ZpbHRlcl9yZWR1Y2VTdWJ0cmFjdChmKSB7XG4gIHJldHVybiBmdW5jdGlvbihwLCB2KSB7XG4gICAgcmV0dXJuIHAgLSBmKHYpO1xuICB9O1xufVxuZXhwb3J0cy5jcm9zc2ZpbHRlciA9IGNyb3NzZmlsdGVyO1xuXG5mdW5jdGlvbiBjcm9zc2ZpbHRlcigpIHtcbiAgdmFyIGNyb3NzZmlsdGVyID0ge1xuICAgIGFkZDogYWRkLFxuICAgIHJlbW92ZTogcmVtb3ZlRGF0YSxcbiAgICBkaW1lbnNpb246IGRpbWVuc2lvbixcbiAgICBncm91cEFsbDogZ3JvdXBBbGwsXG4gICAgc2l6ZTogc2l6ZVxuICB9O1xuXG4gIHZhciBkYXRhID0gW10sIC8vIHRoZSByZWNvcmRzXG4gICAgICBuID0gMCwgLy8gdGhlIG51bWJlciBvZiByZWNvcmRzOyBkYXRhLmxlbmd0aFxuICAgICAgbSA9IDAsIC8vIGEgYml0IG1hc2sgcmVwcmVzZW50aW5nIHdoaWNoIGRpbWVuc2lvbnMgYXJlIGluIHVzZVxuICAgICAgTSA9IDgsIC8vIG51bWJlciBvZiBkaW1lbnNpb25zIHRoYXQgY2FuIGZpdCBpbiBgZmlsdGVyc2BcbiAgICAgIGZpbHRlcnMgPSBjcm9zc2ZpbHRlcl9hcnJheTgoMCksIC8vIE0gYml0cyBwZXIgcmVjb3JkOyAxIGlzIGZpbHRlcmVkIG91dFxuICAgICAgZmlsdGVyTGlzdGVuZXJzID0gW10sIC8vIHdoZW4gdGhlIGZpbHRlcnMgY2hhbmdlXG4gICAgICBkYXRhTGlzdGVuZXJzID0gW10sIC8vIHdoZW4gZGF0YSBpcyBhZGRlZFxuICAgICAgcmVtb3ZlRGF0YUxpc3RlbmVycyA9IFtdOyAvLyB3aGVuIGRhdGEgaXMgcmVtb3ZlZFxuXG4gIC8vIEFkZHMgdGhlIHNwZWNpZmllZCBuZXcgcmVjb3JkcyB0byB0aGlzIGNyb3NzZmlsdGVyLlxuICBmdW5jdGlvbiBhZGQobmV3RGF0YSkge1xuICAgIHZhciBuMCA9IG4sXG4gICAgICAgIG4xID0gbmV3RGF0YS5sZW5ndGg7XG5cbiAgICAvLyBJZiB0aGVyZSdzIGFjdHVhbGx5IG5ldyBkYXRhIHRvIGFkZOKAplxuICAgIC8vIE1lcmdlIHRoZSBuZXcgZGF0YSBpbnRvIHRoZSBleGlzdGluZyBkYXRhLlxuICAgIC8vIExlbmd0aGVuIHRoZSBmaWx0ZXIgYml0c2V0IHRvIGhhbmRsZSB0aGUgbmV3IHJlY29yZHMuXG4gICAgLy8gTm90aWZ5IGxpc3RlbmVycyAoZGltZW5zaW9ucyBhbmQgZ3JvdXBzKSB0aGF0IG5ldyBkYXRhIGlzIGF2YWlsYWJsZS5cbiAgICBpZiAobjEpIHtcbiAgICAgIGRhdGEgPSBkYXRhLmNvbmNhdChuZXdEYXRhKTtcbiAgICAgIGZpbHRlcnMgPSBjcm9zc2ZpbHRlcl9hcnJheUxlbmd0aGVuKGZpbHRlcnMsIG4gKz0gbjEpO1xuICAgICAgZGF0YUxpc3RlbmVycy5mb3JFYWNoKGZ1bmN0aW9uKGwpIHsgbChuZXdEYXRhLCBuMCwgbjEpOyB9KTtcbiAgICB9XG5cbiAgICByZXR1cm4gY3Jvc3NmaWx0ZXI7XG4gIH1cblxuICAvLyBSZW1vdmVzIGFsbCByZWNvcmRzIHRoYXQgbWF0Y2ggdGhlIGN1cnJlbnQgZmlsdGVycy5cbiAgZnVuY3Rpb24gcmVtb3ZlRGF0YSgpIHtcbiAgICB2YXIgbmV3SW5kZXggPSBjcm9zc2ZpbHRlcl9pbmRleChuLCBuKSxcbiAgICAgICAgcmVtb3ZlZCA9IFtdO1xuICAgIGZvciAodmFyIGkgPSAwLCBqID0gMDsgaSA8IG47ICsraSkge1xuICAgICAgaWYgKGZpbHRlcnNbaV0pIG5ld0luZGV4W2ldID0gaisrO1xuICAgICAgZWxzZSByZW1vdmVkLnB1c2goaSk7XG4gICAgfVxuXG4gICAgLy8gUmVtb3ZlIGFsbCBtYXRjaGluZyByZWNvcmRzIGZyb20gZ3JvdXBzLlxuICAgIGZpbHRlckxpc3RlbmVycy5mb3JFYWNoKGZ1bmN0aW9uKGwpIHsgbCgwLCBbXSwgcmVtb3ZlZCk7IH0pO1xuXG4gICAgLy8gVXBkYXRlIGluZGV4ZXMuXG4gICAgcmVtb3ZlRGF0YUxpc3RlbmVycy5mb3JFYWNoKGZ1bmN0aW9uKGwpIHsgbChuZXdJbmRleCk7IH0pO1xuXG4gICAgLy8gUmVtb3ZlIG9sZCBmaWx0ZXJzIGFuZCBkYXRhIGJ5IG92ZXJ3cml0aW5nLlxuICAgIGZvciAodmFyIGkgPSAwLCBqID0gMCwgazsgaSA8IG47ICsraSkge1xuICAgICAgaWYgKGsgPSBmaWx0ZXJzW2ldKSB7XG4gICAgICAgIGlmIChpICE9PSBqKSBmaWx0ZXJzW2pdID0gaywgZGF0YVtqXSA9IGRhdGFbaV07XG4gICAgICAgICsrajtcbiAgICAgIH1cbiAgICB9XG4gICAgZGF0YS5sZW5ndGggPSBqO1xuICAgIHdoaWxlIChuID4gaikgZmlsdGVyc1stLW5dID0gMDtcbiAgfVxuXG4gIC8vIEFkZHMgYSBuZXcgZGltZW5zaW9uIHdpdGggdGhlIHNwZWNpZmllZCB2YWx1ZSBhY2Nlc3NvciBmdW5jdGlvbi5cbiAgZnVuY3Rpb24gZGltZW5zaW9uKHZhbHVlKSB7XG4gICAgdmFyIGRpbWVuc2lvbiA9IHtcbiAgICAgIGZpbHRlcjogZmlsdGVyLFxuICAgICAgZmlsdGVyRXhhY3Q6IGZpbHRlckV4YWN0LFxuICAgICAgZmlsdGVyUmFuZ2U6IGZpbHRlclJhbmdlLFxuICAgICAgZmlsdGVyRnVuY3Rpb246IGZpbHRlckZ1bmN0aW9uLFxuICAgICAgZmlsdGVyQWxsOiBmaWx0ZXJBbGwsXG4gICAgICB0b3A6IHRvcCxcbiAgICAgIGJvdHRvbTogYm90dG9tLFxuICAgICAgZ3JvdXA6IGdyb3VwLFxuICAgICAgZ3JvdXBBbGw6IGdyb3VwQWxsLFxuICAgICAgZGlzcG9zZTogZGlzcG9zZSxcbiAgICAgIHJlbW92ZTogZGlzcG9zZSAvLyBmb3IgYmFja3dhcmRzLWNvbXBhdGliaWxpdHlcbiAgICB9O1xuXG4gICAgdmFyIG9uZSA9IH5tICYgLX5tLCAvLyBsb3dlc3QgdW5zZXQgYml0IGFzIG1hc2ssIGUuZy4sIDAwMDAxMDAwXG4gICAgICAgIHplcm8gPSB+b25lLCAvLyBpbnZlcnRlZCBvbmUsIGUuZy4sIDExMTEwMTExXG4gICAgICAgIHZhbHVlcywgLy8gc29ydGVkLCBjYWNoZWQgYXJyYXlcbiAgICAgICAgaW5kZXgsIC8vIHZhbHVlIHJhbmsg4oamIG9iamVjdCBpZFxuICAgICAgICBuZXdWYWx1ZXMsIC8vIHRlbXBvcmFyeSBhcnJheSBzdG9yaW5nIG5ld2x5LWFkZGVkIHZhbHVlc1xuICAgICAgICBuZXdJbmRleCwgLy8gdGVtcG9yYXJ5IGFycmF5IHN0b3JpbmcgbmV3bHktYWRkZWQgaW5kZXhcbiAgICAgICAgc29ydCA9IHF1aWNrc29ydF9ieShmdW5jdGlvbihpKSB7IHJldHVybiBuZXdWYWx1ZXNbaV07IH0pLFxuICAgICAgICByZWZpbHRlciA9IGNyb3NzZmlsdGVyX2ZpbHRlckFsbCwgLy8gZm9yIHJlY29tcHV0aW5nIGZpbHRlclxuICAgICAgICByZWZpbHRlckZ1bmN0aW9uLCAvLyB0aGUgY3VzdG9tIGZpbHRlciBmdW5jdGlvbiBpbiB1c2VcbiAgICAgICAgaW5kZXhMaXN0ZW5lcnMgPSBbXSwgLy8gd2hlbiBkYXRhIGlzIGFkZGVkXG4gICAgICAgIGRpbWVuc2lvbkdyb3VwcyA9IFtdLFxuICAgICAgICBsbzAgPSAwLFxuICAgICAgICBoaTAgPSAwO1xuXG4gICAgLy8gVXBkYXRpbmcgYSBkaW1lbnNpb24gaXMgYSB0d28tc3RhZ2UgcHJvY2Vzcy4gRmlyc3QsIHdlIG11c3QgdXBkYXRlIHRoZVxuICAgIC8vIGFzc29jaWF0ZWQgZmlsdGVycyBmb3IgdGhlIG5ld2x5LWFkZGVkIHJlY29yZHMuIE9uY2UgYWxsIGRpbWVuc2lvbnMgaGF2ZVxuICAgIC8vIHVwZGF0ZWQgdGhlaXIgZmlsdGVycywgdGhlIGdyb3VwcyBhcmUgbm90aWZpZWQgdG8gdXBkYXRlLlxuICAgIGRhdGFMaXN0ZW5lcnMudW5zaGlmdChwcmVBZGQpO1xuICAgIGRhdGFMaXN0ZW5lcnMucHVzaChwb3N0QWRkKTtcblxuICAgIHJlbW92ZURhdGFMaXN0ZW5lcnMucHVzaChyZW1vdmVEYXRhKTtcblxuICAgIC8vIEluY29ycG9yYXRlIGFueSBleGlzdGluZyBkYXRhIGludG8gdGhpcyBkaW1lbnNpb24sIGFuZCBtYWtlIHN1cmUgdGhhdCB0aGVcbiAgICAvLyBmaWx0ZXIgYml0c2V0IGlzIHdpZGUgZW5vdWdoIHRvIGhhbmRsZSB0aGUgbmV3IGRpbWVuc2lvbi5cbiAgICBtIHw9IG9uZTtcbiAgICBpZiAoTSA+PSAzMiA/ICFvbmUgOiBtICYgLSgxIDw8IE0pKSB7XG4gICAgICBmaWx0ZXJzID0gY3Jvc3NmaWx0ZXJfYXJyYXlXaWRlbihmaWx0ZXJzLCBNIDw8PSAxKTtcbiAgICB9XG4gICAgcHJlQWRkKGRhdGEsIDAsIG4pO1xuICAgIHBvc3RBZGQoZGF0YSwgMCwgbik7XG5cbiAgICAvLyBJbmNvcnBvcmF0ZXMgdGhlIHNwZWNpZmllZCBuZXcgcmVjb3JkcyBpbnRvIHRoaXMgZGltZW5zaW9uLlxuICAgIC8vIFRoaXMgZnVuY3Rpb24gaXMgcmVzcG9uc2libGUgZm9yIHVwZGF0aW5nIGZpbHRlcnMsIHZhbHVlcywgYW5kIGluZGV4LlxuICAgIGZ1bmN0aW9uIHByZUFkZChuZXdEYXRhLCBuMCwgbjEpIHtcblxuICAgICAgLy8gUGVybXV0ZSBuZXcgdmFsdWVzIGludG8gbmF0dXJhbCBvcmRlciB1c2luZyBhIHNvcnRlZCBpbmRleC5cbiAgICAgIG5ld1ZhbHVlcyA9IG5ld0RhdGEubWFwKHZhbHVlKTtcbiAgICAgIG5ld0luZGV4ID0gc29ydChjcm9zc2ZpbHRlcl9yYW5nZShuMSksIDAsIG4xKTtcbiAgICAgIG5ld1ZhbHVlcyA9IHBlcm11dGUobmV3VmFsdWVzLCBuZXdJbmRleCk7XG5cbiAgICAgIC8vIEJpc2VjdCBuZXdWYWx1ZXMgdG8gZGV0ZXJtaW5lIHdoaWNoIG5ldyByZWNvcmRzIGFyZSBzZWxlY3RlZC5cbiAgICAgIHZhciBib3VuZHMgPSByZWZpbHRlcihuZXdWYWx1ZXMpLCBsbzEgPSBib3VuZHNbMF0sIGhpMSA9IGJvdW5kc1sxXSwgaTtcbiAgICAgIGlmIChyZWZpbHRlckZ1bmN0aW9uKSB7XG4gICAgICAgIGZvciAoaSA9IDA7IGkgPCBuMTsgKytpKSB7XG4gICAgICAgICAgaWYgKCFyZWZpbHRlckZ1bmN0aW9uKG5ld1ZhbHVlc1tpXSwgaSkpIGZpbHRlcnNbbmV3SW5kZXhbaV0gKyBuMF0gfD0gb25lO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBmb3IgKGkgPSAwOyBpIDwgbG8xOyArK2kpIGZpbHRlcnNbbmV3SW5kZXhbaV0gKyBuMF0gfD0gb25lO1xuICAgICAgICBmb3IgKGkgPSBoaTE7IGkgPCBuMTsgKytpKSBmaWx0ZXJzW25ld0luZGV4W2ldICsgbjBdIHw9IG9uZTtcbiAgICAgIH1cblxuICAgICAgLy8gSWYgdGhpcyBkaW1lbnNpb24gcHJldmlvdXNseSBoYWQgbm8gZGF0YSwgdGhlbiB3ZSBkb24ndCBuZWVkIHRvIGRvIHRoZVxuICAgICAgLy8gbW9yZSBleHBlbnNpdmUgbWVyZ2Ugb3BlcmF0aW9uOyB1c2UgdGhlIG5ldyB2YWx1ZXMgYW5kIGluZGV4IGFzLWlzLlxuICAgICAgaWYgKCFuMCkge1xuICAgICAgICB2YWx1ZXMgPSBuZXdWYWx1ZXM7XG4gICAgICAgIGluZGV4ID0gbmV3SW5kZXg7XG4gICAgICAgIGxvMCA9IGxvMTtcbiAgICAgICAgaGkwID0gaGkxO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIHZhciBvbGRWYWx1ZXMgPSB2YWx1ZXMsXG4gICAgICAgICAgb2xkSW5kZXggPSBpbmRleCxcbiAgICAgICAgICBpMCA9IDAsXG4gICAgICAgICAgaTEgPSAwO1xuXG4gICAgICAvLyBPdGhlcndpc2UsIGNyZWF0ZSBuZXcgYXJyYXlzIGludG8gd2hpY2ggdG8gbWVyZ2UgbmV3IGFuZCBvbGQuXG4gICAgICB2YWx1ZXMgPSBuZXcgQXJyYXkobik7XG4gICAgICBpbmRleCA9IGNyb3NzZmlsdGVyX2luZGV4KG4sIG4pO1xuXG4gICAgICAvLyBNZXJnZSB0aGUgb2xkIGFuZCBuZXcgc29ydGVkIHZhbHVlcywgYW5kIG9sZCBhbmQgbmV3IGluZGV4LlxuICAgICAgZm9yIChpID0gMDsgaTAgPCBuMCAmJiBpMSA8IG4xOyArK2kpIHtcbiAgICAgICAgaWYgKG9sZFZhbHVlc1tpMF0gPCBuZXdWYWx1ZXNbaTFdKSB7XG4gICAgICAgICAgdmFsdWVzW2ldID0gb2xkVmFsdWVzW2kwXTtcbiAgICAgICAgICBpbmRleFtpXSA9IG9sZEluZGV4W2kwKytdO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHZhbHVlc1tpXSA9IG5ld1ZhbHVlc1tpMV07XG4gICAgICAgICAgaW5kZXhbaV0gPSBuZXdJbmRleFtpMSsrXSArIG4wO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIC8vIEFkZCBhbnkgcmVtYWluaW5nIG9sZCB2YWx1ZXMuXG4gICAgICBmb3IgKDsgaTAgPCBuMDsgKytpMCwgKytpKSB7XG4gICAgICAgIHZhbHVlc1tpXSA9IG9sZFZhbHVlc1tpMF07XG4gICAgICAgIGluZGV4W2ldID0gb2xkSW5kZXhbaTBdO1xuICAgICAgfVxuXG4gICAgICAvLyBBZGQgYW55IHJlbWFpbmluZyBuZXcgdmFsdWVzLlxuICAgICAgZm9yICg7IGkxIDwgbjE7ICsraTEsICsraSkge1xuICAgICAgICB2YWx1ZXNbaV0gPSBuZXdWYWx1ZXNbaTFdO1xuICAgICAgICBpbmRleFtpXSA9IG5ld0luZGV4W2kxXSArIG4wO1xuICAgICAgfVxuXG4gICAgICAvLyBCaXNlY3QgYWdhaW4gdG8gcmVjb21wdXRlIGxvMCBhbmQgaGkwLlxuICAgICAgYm91bmRzID0gcmVmaWx0ZXIodmFsdWVzKSwgbG8wID0gYm91bmRzWzBdLCBoaTAgPSBib3VuZHNbMV07XG4gICAgfVxuXG4gICAgLy8gV2hlbiBhbGwgZmlsdGVycyBoYXZlIHVwZGF0ZWQsIG5vdGlmeSBpbmRleCBsaXN0ZW5lcnMgb2YgdGhlIG5ldyB2YWx1ZXMuXG4gICAgZnVuY3Rpb24gcG9zdEFkZChuZXdEYXRhLCBuMCwgbjEpIHtcbiAgICAgIGluZGV4TGlzdGVuZXJzLmZvckVhY2goZnVuY3Rpb24obCkgeyBsKG5ld1ZhbHVlcywgbmV3SW5kZXgsIG4wLCBuMSk7IH0pO1xuICAgICAgbmV3VmFsdWVzID0gbmV3SW5kZXggPSBudWxsO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHJlbW92ZURhdGEocmVJbmRleCkge1xuICAgICAgZm9yICh2YXIgaSA9IDAsIGogPSAwLCBrOyBpIDwgbjsgKytpKSB7XG4gICAgICAgIGlmIChmaWx0ZXJzW2sgPSBpbmRleFtpXV0pIHtcbiAgICAgICAgICBpZiAoaSAhPT0gaikgdmFsdWVzW2pdID0gdmFsdWVzW2ldO1xuICAgICAgICAgIGluZGV4W2pdID0gcmVJbmRleFtrXTtcbiAgICAgICAgICArK2o7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHZhbHVlcy5sZW5ndGggPSBqO1xuICAgICAgd2hpbGUgKGogPCBuKSBpbmRleFtqKytdID0gMDtcblxuICAgICAgLy8gQmlzZWN0IGFnYWluIHRvIHJlY29tcHV0ZSBsbzAgYW5kIGhpMC5cbiAgICAgIHZhciBib3VuZHMgPSByZWZpbHRlcih2YWx1ZXMpO1xuICAgICAgbG8wID0gYm91bmRzWzBdLCBoaTAgPSBib3VuZHNbMV07XG4gICAgfVxuXG4gICAgLy8gVXBkYXRlcyB0aGUgc2VsZWN0ZWQgdmFsdWVzIGJhc2VkIG9uIHRoZSBzcGVjaWZpZWQgYm91bmRzIFtsbywgaGldLlxuICAgIC8vIFRoaXMgaW1wbGVtZW50YXRpb24gaXMgdXNlZCBieSBhbGwgdGhlIHB1YmxpYyBmaWx0ZXIgbWV0aG9kcy5cbiAgICBmdW5jdGlvbiBmaWx0ZXJJbmRleEJvdW5kcyhib3VuZHMpIHtcbiAgICAgIHZhciBsbzEgPSBib3VuZHNbMF0sXG4gICAgICAgICAgaGkxID0gYm91bmRzWzFdO1xuXG4gICAgICBpZiAocmVmaWx0ZXJGdW5jdGlvbikge1xuICAgICAgICByZWZpbHRlckZ1bmN0aW9uID0gbnVsbDtcbiAgICAgICAgZmlsdGVySW5kZXhGdW5jdGlvbihmdW5jdGlvbihkLCBpKSB7IHJldHVybiBsbzEgPD0gaSAmJiBpIDwgaGkxOyB9KTtcbiAgICAgICAgbG8wID0gbG8xO1xuICAgICAgICBoaTAgPSBoaTE7XG4gICAgICAgIHJldHVybiBkaW1lbnNpb247XG4gICAgICB9XG5cbiAgICAgIHZhciBpLFxuICAgICAgICAgIGosXG4gICAgICAgICAgayxcbiAgICAgICAgICBhZGRlZCA9IFtdLFxuICAgICAgICAgIHJlbW92ZWQgPSBbXTtcblxuICAgICAgLy8gRmFzdCBpbmNyZW1lbnRhbCB1cGRhdGUgYmFzZWQgb24gcHJldmlvdXMgbG8gaW5kZXguXG4gICAgICBpZiAobG8xIDwgbG8wKSB7XG4gICAgICAgIGZvciAoaSA9IGxvMSwgaiA9IE1hdGgubWluKGxvMCwgaGkxKTsgaSA8IGo7ICsraSkge1xuICAgICAgICAgIGZpbHRlcnNbayA9IGluZGV4W2ldXSBePSBvbmU7XG4gICAgICAgICAgYWRkZWQucHVzaChrKTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIGlmIChsbzEgPiBsbzApIHtcbiAgICAgICAgZm9yIChpID0gbG8wLCBqID0gTWF0aC5taW4obG8xLCBoaTApOyBpIDwgajsgKytpKSB7XG4gICAgICAgICAgZmlsdGVyc1trID0gaW5kZXhbaV1dIF49IG9uZTtcbiAgICAgICAgICByZW1vdmVkLnB1c2goayk7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgLy8gRmFzdCBpbmNyZW1lbnRhbCB1cGRhdGUgYmFzZWQgb24gcHJldmlvdXMgaGkgaW5kZXguXG4gICAgICBpZiAoaGkxID4gaGkwKSB7XG4gICAgICAgIGZvciAoaSA9IE1hdGgubWF4KGxvMSwgaGkwKSwgaiA9IGhpMTsgaSA8IGo7ICsraSkge1xuICAgICAgICAgIGZpbHRlcnNbayA9IGluZGV4W2ldXSBePSBvbmU7XG4gICAgICAgICAgYWRkZWQucHVzaChrKTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIGlmIChoaTEgPCBoaTApIHtcbiAgICAgICAgZm9yIChpID0gTWF0aC5tYXgobG8wLCBoaTEpLCBqID0gaGkwOyBpIDwgajsgKytpKSB7XG4gICAgICAgICAgZmlsdGVyc1trID0gaW5kZXhbaV1dIF49IG9uZTtcbiAgICAgICAgICByZW1vdmVkLnB1c2goayk7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgbG8wID0gbG8xO1xuICAgICAgaGkwID0gaGkxO1xuICAgICAgZmlsdGVyTGlzdGVuZXJzLmZvckVhY2goZnVuY3Rpb24obCkgeyBsKG9uZSwgYWRkZWQsIHJlbW92ZWQpOyB9KTtcbiAgICAgIHJldHVybiBkaW1lbnNpb247XG4gICAgfVxuXG4gICAgLy8gRmlsdGVycyB0aGlzIGRpbWVuc2lvbiB1c2luZyB0aGUgc3BlY2lmaWVkIHJhbmdlLCB2YWx1ZSwgb3IgbnVsbC5cbiAgICAvLyBJZiB0aGUgcmFuZ2UgaXMgbnVsbCwgdGhpcyBpcyBlcXVpdmFsZW50IHRvIGZpbHRlckFsbC5cbiAgICAvLyBJZiB0aGUgcmFuZ2UgaXMgYW4gYXJyYXksIHRoaXMgaXMgZXF1aXZhbGVudCB0byBmaWx0ZXJSYW5nZS5cbiAgICAvLyBPdGhlcndpc2UsIHRoaXMgaXMgZXF1aXZhbGVudCB0byBmaWx0ZXJFeGFjdC5cbiAgICBmdW5jdGlvbiBmaWx0ZXIocmFuZ2UpIHtcbiAgICAgIHJldHVybiByYW5nZSA9PSBudWxsXG4gICAgICAgICAgPyBmaWx0ZXJBbGwoKSA6IEFycmF5LmlzQXJyYXkocmFuZ2UpXG4gICAgICAgICAgPyBmaWx0ZXJSYW5nZShyYW5nZSkgOiB0eXBlb2YgcmFuZ2UgPT09IFwiZnVuY3Rpb25cIlxuICAgICAgICAgID8gZmlsdGVyRnVuY3Rpb24ocmFuZ2UpXG4gICAgICAgICAgOiBmaWx0ZXJFeGFjdChyYW5nZSk7XG4gICAgfVxuXG4gICAgLy8gRmlsdGVycyB0aGlzIGRpbWVuc2lvbiB0byBzZWxlY3QgdGhlIGV4YWN0IHZhbHVlLlxuICAgIGZ1bmN0aW9uIGZpbHRlckV4YWN0KHZhbHVlKSB7XG4gICAgICByZXR1cm4gZmlsdGVySW5kZXhCb3VuZHMoKHJlZmlsdGVyID0gY3Jvc3NmaWx0ZXJfZmlsdGVyRXhhY3QoYmlzZWN0LCB2YWx1ZSkpKHZhbHVlcykpO1xuICAgIH1cblxuICAgIC8vIEZpbHRlcnMgdGhpcyBkaW1lbnNpb24gdG8gc2VsZWN0IHRoZSBzcGVjaWZpZWQgcmFuZ2UgW2xvLCBoaV0uXG4gICAgLy8gVGhlIGxvd2VyIGJvdW5kIGlzIGluY2x1c2l2ZSwgYW5kIHRoZSB1cHBlciBib3VuZCBpcyBleGNsdXNpdmUuXG4gICAgZnVuY3Rpb24gZmlsdGVyUmFuZ2UocmFuZ2UpIHtcbiAgICAgIHJldHVybiBmaWx0ZXJJbmRleEJvdW5kcygocmVmaWx0ZXIgPSBjcm9zc2ZpbHRlcl9maWx0ZXJSYW5nZShiaXNlY3QsIHJhbmdlKSkodmFsdWVzKSk7XG4gICAgfVxuXG4gICAgLy8gQ2xlYXJzIGFueSBmaWx0ZXJzIG9uIHRoaXMgZGltZW5zaW9uLlxuICAgIGZ1bmN0aW9uIGZpbHRlckFsbCgpIHtcbiAgICAgIHJldHVybiBmaWx0ZXJJbmRleEJvdW5kcygocmVmaWx0ZXIgPSBjcm9zc2ZpbHRlcl9maWx0ZXJBbGwpKHZhbHVlcykpO1xuICAgIH1cblxuICAgIC8vIEZpbHRlcnMgdGhpcyBkaW1lbnNpb24gdXNpbmcgYW4gYXJiaXRyYXJ5IGZ1bmN0aW9uLlxuICAgIGZ1bmN0aW9uIGZpbHRlckZ1bmN0aW9uKGYpIHtcbiAgICAgIHJlZmlsdGVyID0gY3Jvc3NmaWx0ZXJfZmlsdGVyQWxsO1xuXG4gICAgICBmaWx0ZXJJbmRleEZ1bmN0aW9uKHJlZmlsdGVyRnVuY3Rpb24gPSBmKTtcblxuICAgICAgbG8wID0gMDtcbiAgICAgIGhpMCA9IG47XG5cbiAgICAgIHJldHVybiBkaW1lbnNpb247XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZmlsdGVySW5kZXhGdW5jdGlvbihmKSB7XG4gICAgICB2YXIgaSxcbiAgICAgICAgICBrLFxuICAgICAgICAgIHgsXG4gICAgICAgICAgYWRkZWQgPSBbXSxcbiAgICAgICAgICByZW1vdmVkID0gW107XG5cbiAgICAgIGZvciAoaSA9IDA7IGkgPCBuOyArK2kpIHtcbiAgICAgICAgaWYgKCEoZmlsdGVyc1trID0gaW5kZXhbaV1dICYgb25lKSBeICEhKHggPSBmKHZhbHVlc1tpXSwgaSkpKSB7XG4gICAgICAgICAgaWYgKHgpIGZpbHRlcnNba10gJj0gemVybywgYWRkZWQucHVzaChrKTtcbiAgICAgICAgICBlbHNlIGZpbHRlcnNba10gfD0gb25lLCByZW1vdmVkLnB1c2goayk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGZpbHRlckxpc3RlbmVycy5mb3JFYWNoKGZ1bmN0aW9uKGwpIHsgbChvbmUsIGFkZGVkLCByZW1vdmVkKTsgfSk7XG4gICAgfVxuXG4gICAgLy8gUmV0dXJucyB0aGUgdG9wIEsgc2VsZWN0ZWQgcmVjb3JkcyBiYXNlZCBvbiB0aGlzIGRpbWVuc2lvbidzIG9yZGVyLlxuICAgIC8vIE5vdGU6IG9ic2VydmVzIHRoaXMgZGltZW5zaW9uJ3MgZmlsdGVyLCB1bmxpa2UgZ3JvdXAgYW5kIGdyb3VwQWxsLlxuICAgIGZ1bmN0aW9uIHRvcChrKSB7XG4gICAgICB2YXIgYXJyYXkgPSBbXSxcbiAgICAgICAgICBpID0gaGkwLFxuICAgICAgICAgIGo7XG5cbiAgICAgIHdoaWxlICgtLWkgPj0gbG8wICYmIGsgPiAwKSB7XG4gICAgICAgIGlmICghZmlsdGVyc1tqID0gaW5kZXhbaV1dKSB7XG4gICAgICAgICAgYXJyYXkucHVzaChkYXRhW2pdKTtcbiAgICAgICAgICAtLWs7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgcmV0dXJuIGFycmF5O1xuICAgIH1cblxuICAgIC8vIFJldHVybnMgdGhlIGJvdHRvbSBLIHNlbGVjdGVkIHJlY29yZHMgYmFzZWQgb24gdGhpcyBkaW1lbnNpb24ncyBvcmRlci5cbiAgICAvLyBOb3RlOiBvYnNlcnZlcyB0aGlzIGRpbWVuc2lvbidzIGZpbHRlciwgdW5saWtlIGdyb3VwIGFuZCBncm91cEFsbC5cbiAgICBmdW5jdGlvbiBib3R0b20oaykge1xuICAgICAgdmFyIGFycmF5ID0gW10sXG4gICAgICAgICAgaSA9IGxvMCxcbiAgICAgICAgICBqO1xuXG4gICAgICB3aGlsZSAoaSA8IGhpMCAmJiBrID4gMCkge1xuICAgICAgICBpZiAoIWZpbHRlcnNbaiA9IGluZGV4W2ldXSkge1xuICAgICAgICAgIGFycmF5LnB1c2goZGF0YVtqXSk7XG4gICAgICAgICAgLS1rO1xuICAgICAgICB9XG4gICAgICAgIGkrKztcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIGFycmF5O1xuICAgIH1cblxuICAgIC8vIEFkZHMgYSBuZXcgZ3JvdXAgdG8gdGhpcyBkaW1lbnNpb24sIHVzaW5nIHRoZSBzcGVjaWZpZWQga2V5IGZ1bmN0aW9uLlxuICAgIGZ1bmN0aW9uIGdyb3VwKGtleSkge1xuICAgICAgdmFyIGdyb3VwID0ge1xuICAgICAgICB0b3A6IHRvcCxcbiAgICAgICAgYWxsOiBhbGwsXG4gICAgICAgIHJlZHVjZTogcmVkdWNlLFxuICAgICAgICByZWR1Y2VDb3VudDogcmVkdWNlQ291bnQsXG4gICAgICAgIHJlZHVjZVN1bTogcmVkdWNlU3VtLFxuICAgICAgICBvcmRlcjogb3JkZXIsXG4gICAgICAgIG9yZGVyTmF0dXJhbDogb3JkZXJOYXR1cmFsLFxuICAgICAgICBzaXplOiBzaXplLFxuICAgICAgICBkaXNwb3NlOiBkaXNwb3NlLFxuICAgICAgICByZW1vdmU6IGRpc3Bvc2UgLy8gZm9yIGJhY2t3YXJkcy1jb21wYXRpYmlsaXR5XG4gICAgICB9O1xuXG4gICAgICAvLyBFbnN1cmUgdGhhdCB0aGlzIGdyb3VwIHdpbGwgYmUgcmVtb3ZlZCB3aGVuIHRoZSBkaW1lbnNpb24gaXMgcmVtb3ZlZC5cbiAgICAgIGRpbWVuc2lvbkdyb3Vwcy5wdXNoKGdyb3VwKTtcblxuICAgICAgdmFyIGdyb3VwcywgLy8gYXJyYXkgb2Yge2tleSwgdmFsdWV9XG4gICAgICAgICAgZ3JvdXBJbmRleCwgLy8gb2JqZWN0IGlkIOKGpiBncm91cCBpZFxuICAgICAgICAgIGdyb3VwV2lkdGggPSA4LFxuICAgICAgICAgIGdyb3VwQ2FwYWNpdHkgPSBjcm9zc2ZpbHRlcl9jYXBhY2l0eShncm91cFdpZHRoKSxcbiAgICAgICAgICBrID0gMCwgLy8gY2FyZGluYWxpdHlcbiAgICAgICAgICBzZWxlY3QsXG4gICAgICAgICAgaGVhcCxcbiAgICAgICAgICByZWR1Y2VBZGQsXG4gICAgICAgICAgcmVkdWNlUmVtb3ZlLFxuICAgICAgICAgIHJlZHVjZUluaXRpYWwsXG4gICAgICAgICAgdXBkYXRlID0gY3Jvc3NmaWx0ZXJfbnVsbCxcbiAgICAgICAgICByZXNldCA9IGNyb3NzZmlsdGVyX251bGwsXG4gICAgICAgICAgcmVzZXROZWVkZWQgPSB0cnVlLFxuICAgICAgICAgIGdyb3VwQWxsID0ga2V5ID09PSBjcm9zc2ZpbHRlcl9udWxsO1xuXG4gICAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA8IDEpIGtleSA9IGNyb3NzZmlsdGVyX2lkZW50aXR5O1xuXG4gICAgICAvLyBUaGUgZ3JvdXAgbGlzdGVucyB0byB0aGUgY3Jvc3NmaWx0ZXIgZm9yIHdoZW4gYW55IGRpbWVuc2lvbiBjaGFuZ2VzLCBzb1xuICAgICAgLy8gdGhhdCBpdCBjYW4gdXBkYXRlIHRoZSBhc3NvY2lhdGVkIHJlZHVjZSB2YWx1ZXMuIEl0IG11c3QgYWxzbyBsaXN0ZW4gdG9cbiAgICAgIC8vIHRoZSBwYXJlbnQgZGltZW5zaW9uIGZvciB3aGVuIGRhdGEgaXMgYWRkZWQsIGFuZCBjb21wdXRlIG5ldyBrZXlzLlxuICAgICAgZmlsdGVyTGlzdGVuZXJzLnB1c2godXBkYXRlKTtcbiAgICAgIGluZGV4TGlzdGVuZXJzLnB1c2goYWRkKTtcbiAgICAgIHJlbW92ZURhdGFMaXN0ZW5lcnMucHVzaChyZW1vdmVEYXRhKTtcblxuICAgICAgLy8gSW5jb3Jwb3JhdGUgYW55IGV4aXN0aW5nIGRhdGEgaW50byB0aGUgZ3JvdXBpbmcuXG4gICAgICBhZGQodmFsdWVzLCBpbmRleCwgMCwgbik7XG5cbiAgICAgIC8vIEluY29ycG9yYXRlcyB0aGUgc3BlY2lmaWVkIG5ldyB2YWx1ZXMgaW50byB0aGlzIGdyb3VwLlxuICAgICAgLy8gVGhpcyBmdW5jdGlvbiBpcyByZXNwb25zaWJsZSBmb3IgdXBkYXRpbmcgZ3JvdXBzIGFuZCBncm91cEluZGV4LlxuICAgICAgZnVuY3Rpb24gYWRkKG5ld1ZhbHVlcywgbmV3SW5kZXgsIG4wLCBuMSkge1xuICAgICAgICB2YXIgb2xkR3JvdXBzID0gZ3JvdXBzLFxuICAgICAgICAgICAgcmVJbmRleCA9IGNyb3NzZmlsdGVyX2luZGV4KGssIGdyb3VwQ2FwYWNpdHkpLFxuICAgICAgICAgICAgYWRkID0gcmVkdWNlQWRkLFxuICAgICAgICAgICAgaW5pdGlhbCA9IHJlZHVjZUluaXRpYWwsXG4gICAgICAgICAgICBrMCA9IGssIC8vIG9sZCBjYXJkaW5hbGl0eVxuICAgICAgICAgICAgaTAgPSAwLCAvLyBpbmRleCBvZiBvbGQgZ3JvdXBcbiAgICAgICAgICAgIGkxID0gMCwgLy8gaW5kZXggb2YgbmV3IHJlY29yZFxuICAgICAgICAgICAgaiwgLy8gb2JqZWN0IGlkXG4gICAgICAgICAgICBnMCwgLy8gb2xkIGdyb3VwXG4gICAgICAgICAgICB4MCwgLy8gb2xkIGtleVxuICAgICAgICAgICAgeDEsIC8vIG5ldyBrZXlcbiAgICAgICAgICAgIGcsIC8vIGdyb3VwIHRvIGFkZFxuICAgICAgICAgICAgeDsgLy8ga2V5IG9mIGdyb3VwIHRvIGFkZFxuXG4gICAgICAgIC8vIElmIGEgcmVzZXQgaXMgbmVlZGVkLCB3ZSBkb24ndCBuZWVkIHRvIHVwZGF0ZSB0aGUgcmVkdWNlIHZhbHVlcy5cbiAgICAgICAgaWYgKHJlc2V0TmVlZGVkKSBhZGQgPSBpbml0aWFsID0gY3Jvc3NmaWx0ZXJfbnVsbDtcblxuICAgICAgICAvLyBSZXNldCB0aGUgbmV3IGdyb3VwcyAoayBpcyBhIGxvd2VyIGJvdW5kKS5cbiAgICAgICAgLy8gQWxzbywgbWFrZSBzdXJlIHRoYXQgZ3JvdXBJbmRleCBleGlzdHMgYW5kIGlzIGxvbmcgZW5vdWdoLlxuICAgICAgICBncm91cHMgPSBuZXcgQXJyYXkoayksIGsgPSAwO1xuICAgICAgICBncm91cEluZGV4ID0gazAgPiAxID8gY3Jvc3NmaWx0ZXJfYXJyYXlMZW5ndGhlbihncm91cEluZGV4LCBuKSA6IGNyb3NzZmlsdGVyX2luZGV4KG4sIGdyb3VwQ2FwYWNpdHkpO1xuXG4gICAgICAgIC8vIEdldCB0aGUgZmlyc3Qgb2xkIGtleSAoeDAgb2YgZzApLCBpZiBpdCBleGlzdHMuXG4gICAgICAgIGlmIChrMCkgeDAgPSAoZzAgPSBvbGRHcm91cHNbMF0pLmtleTtcblxuICAgICAgICAvLyBGaW5kIHRoZSBmaXJzdCBuZXcga2V5ICh4MSksIHNraXBwaW5nIE5hTiBrZXlzLlxuICAgICAgICB3aGlsZSAoaTEgPCBuMSAmJiAhKCh4MSA9IGtleShuZXdWYWx1ZXNbaTFdKSkgPj0geDEpKSArK2kxO1xuXG4gICAgICAgIC8vIFdoaWxlIG5ldyBrZXlzIHJlbWFpbuKAplxuICAgICAgICB3aGlsZSAoaTEgPCBuMSkge1xuXG4gICAgICAgICAgLy8gRGV0ZXJtaW5lIHRoZSBsZXNzZXIgb2YgdGhlIHR3byBjdXJyZW50IGtleXM7IG5ldyBhbmQgb2xkLlxuICAgICAgICAgIC8vIElmIHRoZXJlIGFyZSBubyBvbGQga2V5cyByZW1haW5pbmcsIHRoZW4gYWx3YXlzIGFkZCB0aGUgbmV3IGtleS5cbiAgICAgICAgICBpZiAoZzAgJiYgeDAgPD0geDEpIHtcbiAgICAgICAgICAgIGcgPSBnMCwgeCA9IHgwO1xuXG4gICAgICAgICAgICAvLyBSZWNvcmQgdGhlIG5ldyBpbmRleCBvZiB0aGUgb2xkIGdyb3VwLlxuICAgICAgICAgICAgcmVJbmRleFtpMF0gPSBrO1xuXG4gICAgICAgICAgICAvLyBSZXRyaWV2ZSB0aGUgbmV4dCBvbGQga2V5LlxuICAgICAgICAgICAgaWYgKGcwID0gb2xkR3JvdXBzWysraTBdKSB4MCA9IGcwLmtleTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgZyA9IHtrZXk6IHgxLCB2YWx1ZTogaW5pdGlhbCgpfSwgeCA9IHgxO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIC8vIEFkZCB0aGUgbGVzc2VyIGdyb3VwLlxuICAgICAgICAgIGdyb3Vwc1trXSA9IGc7XG5cbiAgICAgICAgICAvLyBBZGQgYW55IHNlbGVjdGVkIHJlY29yZHMgYmVsb25naW5nIHRvIHRoZSBhZGRlZCBncm91cCwgd2hpbGVcbiAgICAgICAgICAvLyBhZHZhbmNpbmcgdGhlIG5ldyBrZXkgYW5kIHBvcHVsYXRpbmcgdGhlIGFzc29jaWF0ZWQgZ3JvdXAgaW5kZXguXG4gICAgICAgICAgd2hpbGUgKCEoeDEgPiB4KSkge1xuICAgICAgICAgICAgZ3JvdXBJbmRleFtqID0gbmV3SW5kZXhbaTFdICsgbjBdID0gaztcbiAgICAgICAgICAgIGlmICghKGZpbHRlcnNbal0gJiB6ZXJvKSkgZy52YWx1ZSA9IGFkZChnLnZhbHVlLCBkYXRhW2pdKTtcbiAgICAgICAgICAgIGlmICgrK2kxID49IG4xKSBicmVhaztcbiAgICAgICAgICAgIHgxID0ga2V5KG5ld1ZhbHVlc1tpMV0pO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGdyb3VwSW5jcmVtZW50KCk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBBZGQgYW55IHJlbWFpbmluZyBvbGQgZ3JvdXBzIHRoYXQgd2VyZSBncmVhdGVyIHRoYW4gYWxsIG5ldyBrZXlzLlxuICAgICAgICAvLyBObyBpbmNyZW1lbnRhbCByZWR1Y2UgaXMgbmVlZGVkOyB0aGVzZSBncm91cHMgaGF2ZSBubyBuZXcgcmVjb3Jkcy5cbiAgICAgICAgLy8gQWxzbyByZWNvcmQgdGhlIG5ldyBpbmRleCBvZiB0aGUgb2xkIGdyb3VwLlxuICAgICAgICB3aGlsZSAoaTAgPCBrMCkge1xuICAgICAgICAgIGdyb3Vwc1tyZUluZGV4W2kwXSA9IGtdID0gb2xkR3JvdXBzW2kwKytdO1xuICAgICAgICAgIGdyb3VwSW5jcmVtZW50KCk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBJZiB3ZSBhZGRlZCBhbnkgbmV3IGdyb3VwcyBiZWZvcmUgYW55IG9sZCBncm91cHMsXG4gICAgICAgIC8vIHVwZGF0ZSB0aGUgZ3JvdXAgaW5kZXggb2YgYWxsIHRoZSBvbGQgcmVjb3Jkcy5cbiAgICAgICAgaWYgKGsgPiBpMCkgZm9yIChpMCA9IDA7IGkwIDwgbjA7ICsraTApIHtcbiAgICAgICAgICBncm91cEluZGV4W2kwXSA9IHJlSW5kZXhbZ3JvdXBJbmRleFtpMF1dO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gTW9kaWZ5IHRoZSB1cGRhdGUgYW5kIHJlc2V0IGJlaGF2aW9yIGJhc2VkIG9uIHRoZSBjYXJkaW5hbGl0eS5cbiAgICAgICAgLy8gSWYgdGhlIGNhcmRpbmFsaXR5IGlzIGxlc3MgdGhhbiBvciBlcXVhbCB0byBvbmUsIHRoZW4gdGhlIGdyb3VwSW5kZXhcbiAgICAgICAgLy8gaXMgbm90IG5lZWRlZC4gSWYgdGhlIGNhcmRpbmFsaXR5IGlzIHplcm8sIHRoZW4gdGhlcmUgYXJlIG5vIHJlY29yZHNcbiAgICAgICAgLy8gYW5kIHRoZXJlZm9yZSBubyBncm91cHMgdG8gdXBkYXRlIG9yIHJlc2V0LiBOb3RlIHRoYXQgd2UgYWxzbyBtdXN0XG4gICAgICAgIC8vIGNoYW5nZSB0aGUgcmVnaXN0ZXJlZCBsaXN0ZW5lciB0byBwb2ludCB0byB0aGUgbmV3IG1ldGhvZC5cbiAgICAgICAgaiA9IGZpbHRlckxpc3RlbmVycy5pbmRleE9mKHVwZGF0ZSk7XG4gICAgICAgIGlmIChrID4gMSkge1xuICAgICAgICAgIHVwZGF0ZSA9IHVwZGF0ZU1hbnk7XG4gICAgICAgICAgcmVzZXQgPSByZXNldE1hbnk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgaWYgKCFrICYmIGdyb3VwQWxsKSB7XG4gICAgICAgICAgICBrID0gMTtcbiAgICAgICAgICAgIGdyb3VwcyA9IFt7a2V5OiBudWxsLCB2YWx1ZTogaW5pdGlhbCgpfV07XG4gICAgICAgICAgfVxuICAgICAgICAgIGlmIChrID09PSAxKSB7XG4gICAgICAgICAgICB1cGRhdGUgPSB1cGRhdGVPbmU7XG4gICAgICAgICAgICByZXNldCA9IHJlc2V0T25lO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB1cGRhdGUgPSBjcm9zc2ZpbHRlcl9udWxsO1xuICAgICAgICAgICAgcmVzZXQgPSBjcm9zc2ZpbHRlcl9udWxsO1xuICAgICAgICAgIH1cbiAgICAgICAgICBncm91cEluZGV4ID0gbnVsbDtcbiAgICAgICAgfVxuICAgICAgICBmaWx0ZXJMaXN0ZW5lcnNbal0gPSB1cGRhdGU7XG5cbiAgICAgICAgLy8gQ291bnQgdGhlIG51bWJlciBvZiBhZGRlZCBncm91cHMsXG4gICAgICAgIC8vIGFuZCB3aWRlbiB0aGUgZ3JvdXAgaW5kZXggYXMgbmVlZGVkLlxuICAgICAgICBmdW5jdGlvbiBncm91cEluY3JlbWVudCgpIHtcbiAgICAgICAgICBpZiAoKytrID09PSBncm91cENhcGFjaXR5KSB7XG4gICAgICAgICAgICByZUluZGV4ID0gY3Jvc3NmaWx0ZXJfYXJyYXlXaWRlbihyZUluZGV4LCBncm91cFdpZHRoIDw8PSAxKTtcbiAgICAgICAgICAgIGdyb3VwSW5kZXggPSBjcm9zc2ZpbHRlcl9hcnJheVdpZGVuKGdyb3VwSW5kZXgsIGdyb3VwV2lkdGgpO1xuICAgICAgICAgICAgZ3JvdXBDYXBhY2l0eSA9IGNyb3NzZmlsdGVyX2NhcGFjaXR5KGdyb3VwV2lkdGgpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBmdW5jdGlvbiByZW1vdmVEYXRhKCkge1xuICAgICAgICBpZiAoayA+IDEpIHtcbiAgICAgICAgICB2YXIgb2xkSyA9IGssXG4gICAgICAgICAgICAgIG9sZEdyb3VwcyA9IGdyb3VwcyxcbiAgICAgICAgICAgICAgc2Vlbkdyb3VwcyA9IGNyb3NzZmlsdGVyX2luZGV4KG9sZEssIG9sZEspO1xuXG4gICAgICAgICAgLy8gRmlsdGVyIG91dCBub24tbWF0Y2hlcyBieSBjb3B5aW5nIG1hdGNoaW5nIGdyb3VwIGluZGV4IGVudHJpZXMgdG9cbiAgICAgICAgICAvLyB0aGUgYmVnaW5uaW5nIG9mIHRoZSBhcnJheS5cbiAgICAgICAgICBmb3IgKHZhciBpID0gMCwgaiA9IDA7IGkgPCBuOyArK2kpIHtcbiAgICAgICAgICAgIGlmIChmaWx0ZXJzW2ldKSB7XG4gICAgICAgICAgICAgIHNlZW5Hcm91cHNbZ3JvdXBJbmRleFtqXSA9IGdyb3VwSW5kZXhbaV1dID0gMTtcbiAgICAgICAgICAgICAgKytqO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cblxuICAgICAgICAgIC8vIFJlYXNzZW1ibGUgZ3JvdXBzIGluY2x1ZGluZyBvbmx5IHRob3NlIGdyb3VwcyB0aGF0IHdlcmUgcmVmZXJyZWRcbiAgICAgICAgICAvLyB0byBieSBtYXRjaGluZyBncm91cCBpbmRleCBlbnRyaWVzLiAgTm90ZSB0aGUgbmV3IGdyb3VwIGluZGV4IGluXG4gICAgICAgICAgLy8gc2Vlbkdyb3Vwcy5cbiAgICAgICAgICBncm91cHMgPSBbXSwgayA9IDA7XG4gICAgICAgICAgZm9yIChpID0gMDsgaSA8IG9sZEs7ICsraSkge1xuICAgICAgICAgICAgaWYgKHNlZW5Hcm91cHNbaV0pIHtcbiAgICAgICAgICAgICAgc2Vlbkdyb3Vwc1tpXSA9IGsrKztcbiAgICAgICAgICAgICAgZ3JvdXBzLnB1c2gob2xkR3JvdXBzW2ldKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG5cbiAgICAgICAgICBpZiAoayA+IDEpIHtcbiAgICAgICAgICAgIC8vIFJlaW5kZXggdGhlIGdyb3VwIGluZGV4IHVzaW5nIHNlZW5Hcm91cHMgdG8gZmluZCB0aGUgbmV3IGluZGV4LlxuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBqOyArK2kpIGdyb3VwSW5kZXhbaV0gPSBzZWVuR3JvdXBzW2dyb3VwSW5kZXhbaV1dO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBncm91cEluZGV4ID0gbnVsbDtcbiAgICAgICAgICB9XG4gICAgICAgICAgZmlsdGVyTGlzdGVuZXJzW2ZpbHRlckxpc3RlbmVycy5pbmRleE9mKHVwZGF0ZSldID0gayA+IDFcbiAgICAgICAgICAgICAgPyAocmVzZXQgPSByZXNldE1hbnksIHVwZGF0ZSA9IHVwZGF0ZU1hbnkpXG4gICAgICAgICAgICAgIDogayA9PT0gMSA/IChyZXNldCA9IHJlc2V0T25lLCB1cGRhdGUgPSB1cGRhdGVPbmUpXG4gICAgICAgICAgICAgIDogcmVzZXQgPSB1cGRhdGUgPSBjcm9zc2ZpbHRlcl9udWxsO1xuICAgICAgICB9IGVsc2UgaWYgKGsgPT09IDEpIHtcbiAgICAgICAgICBpZiAoZ3JvdXBBbGwpIHJldHVybjtcbiAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IG47ICsraSkgaWYgKGZpbHRlcnNbaV0pIHJldHVybjtcbiAgICAgICAgICBncm91cHMgPSBbXSwgayA9IDA7XG4gICAgICAgICAgZmlsdGVyTGlzdGVuZXJzW2ZpbHRlckxpc3RlbmVycy5pbmRleE9mKHVwZGF0ZSldID1cbiAgICAgICAgICB1cGRhdGUgPSByZXNldCA9IGNyb3NzZmlsdGVyX251bGw7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgLy8gUmVkdWNlcyB0aGUgc3BlY2lmaWVkIHNlbGVjdGVkIG9yIGRlc2VsZWN0ZWQgcmVjb3Jkcy5cbiAgICAgIC8vIFRoaXMgZnVuY3Rpb24gaXMgb25seSB1c2VkIHdoZW4gdGhlIGNhcmRpbmFsaXR5IGlzIGdyZWF0ZXIgdGhhbiAxLlxuICAgICAgZnVuY3Rpb24gdXBkYXRlTWFueShmaWx0ZXJPbmUsIGFkZGVkLCByZW1vdmVkKSB7XG4gICAgICAgIGlmIChmaWx0ZXJPbmUgPT09IG9uZSB8fCByZXNldE5lZWRlZCkgcmV0dXJuO1xuXG4gICAgICAgIHZhciBpLFxuICAgICAgICAgICAgayxcbiAgICAgICAgICAgIG4sXG4gICAgICAgICAgICBnO1xuXG4gICAgICAgIC8vIEFkZCB0aGUgYWRkZWQgdmFsdWVzLlxuICAgICAgICBmb3IgKGkgPSAwLCBuID0gYWRkZWQubGVuZ3RoOyBpIDwgbjsgKytpKSB7XG4gICAgICAgICAgaWYgKCEoZmlsdGVyc1trID0gYWRkZWRbaV1dICYgemVybykpIHtcbiAgICAgICAgICAgIGcgPSBncm91cHNbZ3JvdXBJbmRleFtrXV07XG4gICAgICAgICAgICBnLnZhbHVlID0gcmVkdWNlQWRkKGcudmFsdWUsIGRhdGFba10pO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFJlbW92ZSB0aGUgcmVtb3ZlZCB2YWx1ZXMuXG4gICAgICAgIGZvciAoaSA9IDAsIG4gPSByZW1vdmVkLmxlbmd0aDsgaSA8IG47ICsraSkge1xuICAgICAgICAgIGlmICgoZmlsdGVyc1trID0gcmVtb3ZlZFtpXV0gJiB6ZXJvKSA9PT0gZmlsdGVyT25lKSB7XG4gICAgICAgICAgICBnID0gZ3JvdXBzW2dyb3VwSW5kZXhba11dO1xuICAgICAgICAgICAgZy52YWx1ZSA9IHJlZHVjZVJlbW92ZShnLnZhbHVlLCBkYXRhW2tdKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgLy8gUmVkdWNlcyB0aGUgc3BlY2lmaWVkIHNlbGVjdGVkIG9yIGRlc2VsZWN0ZWQgcmVjb3Jkcy5cbiAgICAgIC8vIFRoaXMgZnVuY3Rpb24gaXMgb25seSB1c2VkIHdoZW4gdGhlIGNhcmRpbmFsaXR5IGlzIDEuXG4gICAgICBmdW5jdGlvbiB1cGRhdGVPbmUoZmlsdGVyT25lLCBhZGRlZCwgcmVtb3ZlZCkge1xuICAgICAgICBpZiAoZmlsdGVyT25lID09PSBvbmUgfHwgcmVzZXROZWVkZWQpIHJldHVybjtcblxuICAgICAgICB2YXIgaSxcbiAgICAgICAgICAgIGssXG4gICAgICAgICAgICBuLFxuICAgICAgICAgICAgZyA9IGdyb3Vwc1swXTtcblxuICAgICAgICAvLyBBZGQgdGhlIGFkZGVkIHZhbHVlcy5cbiAgICAgICAgZm9yIChpID0gMCwgbiA9IGFkZGVkLmxlbmd0aDsgaSA8IG47ICsraSkge1xuICAgICAgICAgIGlmICghKGZpbHRlcnNbayA9IGFkZGVkW2ldXSAmIHplcm8pKSB7XG4gICAgICAgICAgICBnLnZhbHVlID0gcmVkdWNlQWRkKGcudmFsdWUsIGRhdGFba10pO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFJlbW92ZSB0aGUgcmVtb3ZlZCB2YWx1ZXMuXG4gICAgICAgIGZvciAoaSA9IDAsIG4gPSByZW1vdmVkLmxlbmd0aDsgaSA8IG47ICsraSkge1xuICAgICAgICAgIGlmICgoZmlsdGVyc1trID0gcmVtb3ZlZFtpXV0gJiB6ZXJvKSA9PT0gZmlsdGVyT25lKSB7XG4gICAgICAgICAgICBnLnZhbHVlID0gcmVkdWNlUmVtb3ZlKGcudmFsdWUsIGRhdGFba10pO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICAvLyBSZWNvbXB1dGVzIHRoZSBncm91cCByZWR1Y2UgdmFsdWVzIGZyb20gc2NyYXRjaC5cbiAgICAgIC8vIFRoaXMgZnVuY3Rpb24gaXMgb25seSB1c2VkIHdoZW4gdGhlIGNhcmRpbmFsaXR5IGlzIGdyZWF0ZXIgdGhhbiAxLlxuICAgICAgZnVuY3Rpb24gcmVzZXRNYW55KCkge1xuICAgICAgICB2YXIgaSxcbiAgICAgICAgICAgIGc7XG5cbiAgICAgICAgLy8gUmVzZXQgYWxsIGdyb3VwIHZhbHVlcy5cbiAgICAgICAgZm9yIChpID0gMDsgaSA8IGs7ICsraSkge1xuICAgICAgICAgIGdyb3Vwc1tpXS52YWx1ZSA9IHJlZHVjZUluaXRpYWwoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIEFkZCBhbnkgc2VsZWN0ZWQgcmVjb3Jkcy5cbiAgICAgICAgZm9yIChpID0gMDsgaSA8IG47ICsraSkge1xuICAgICAgICAgIGlmICghKGZpbHRlcnNbaV0gJiB6ZXJvKSkge1xuICAgICAgICAgICAgZyA9IGdyb3Vwc1tncm91cEluZGV4W2ldXTtcbiAgICAgICAgICAgIGcudmFsdWUgPSByZWR1Y2VBZGQoZy52YWx1ZSwgZGF0YVtpXSk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIC8vIFJlY29tcHV0ZXMgdGhlIGdyb3VwIHJlZHVjZSB2YWx1ZXMgZnJvbSBzY3JhdGNoLlxuICAgICAgLy8gVGhpcyBmdW5jdGlvbiBpcyBvbmx5IHVzZWQgd2hlbiB0aGUgY2FyZGluYWxpdHkgaXMgMS5cbiAgICAgIGZ1bmN0aW9uIHJlc2V0T25lKCkge1xuICAgICAgICB2YXIgaSxcbiAgICAgICAgICAgIGcgPSBncm91cHNbMF07XG5cbiAgICAgICAgLy8gUmVzZXQgdGhlIHNpbmdsZXRvbiBncm91cCB2YWx1ZXMuXG4gICAgICAgIGcudmFsdWUgPSByZWR1Y2VJbml0aWFsKCk7XG5cbiAgICAgICAgLy8gQWRkIGFueSBzZWxlY3RlZCByZWNvcmRzLlxuICAgICAgICBmb3IgKGkgPSAwOyBpIDwgbjsgKytpKSB7XG4gICAgICAgICAgaWYgKCEoZmlsdGVyc1tpXSAmIHplcm8pKSB7XG4gICAgICAgICAgICBnLnZhbHVlID0gcmVkdWNlQWRkKGcudmFsdWUsIGRhdGFbaV0pO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICAvLyBSZXR1cm5zIHRoZSBhcnJheSBvZiBncm91cCB2YWx1ZXMsIGluIHRoZSBkaW1lbnNpb24ncyBuYXR1cmFsIG9yZGVyLlxuICAgICAgZnVuY3Rpb24gYWxsKCkge1xuICAgICAgICBpZiAocmVzZXROZWVkZWQpIHJlc2V0KCksIHJlc2V0TmVlZGVkID0gZmFsc2U7XG4gICAgICAgIHJldHVybiBncm91cHM7XG4gICAgICB9XG5cbiAgICAgIC8vIFJldHVybnMgYSBuZXcgYXJyYXkgY29udGFpbmluZyB0aGUgdG9wIEsgZ3JvdXAgdmFsdWVzLCBpbiByZWR1Y2Ugb3JkZXIuXG4gICAgICBmdW5jdGlvbiB0b3Aoaykge1xuICAgICAgICB2YXIgdG9wID0gc2VsZWN0KGFsbCgpLCAwLCBncm91cHMubGVuZ3RoLCBrKTtcbiAgICAgICAgcmV0dXJuIGhlYXAuc29ydCh0b3AsIDAsIHRvcC5sZW5ndGgpO1xuICAgICAgfVxuXG4gICAgICAvLyBTZXRzIHRoZSByZWR1Y2UgYmVoYXZpb3IgZm9yIHRoaXMgZ3JvdXAgdG8gdXNlIHRoZSBzcGVjaWZpZWQgZnVuY3Rpb25zLlxuICAgICAgLy8gVGhpcyBtZXRob2QgbGF6aWx5IHJlY29tcHV0ZXMgdGhlIHJlZHVjZSB2YWx1ZXMsIHdhaXRpbmcgdW50aWwgbmVlZGVkLlxuICAgICAgZnVuY3Rpb24gcmVkdWNlKGFkZCwgcmVtb3ZlLCBpbml0aWFsKSB7XG4gICAgICAgIHJlZHVjZUFkZCA9IGFkZDtcbiAgICAgICAgcmVkdWNlUmVtb3ZlID0gcmVtb3ZlO1xuICAgICAgICByZWR1Y2VJbml0aWFsID0gaW5pdGlhbDtcbiAgICAgICAgcmVzZXROZWVkZWQgPSB0cnVlO1xuICAgICAgICByZXR1cm4gZ3JvdXA7XG4gICAgICB9XG5cbiAgICAgIC8vIEEgY29udmVuaWVuY2UgbWV0aG9kIGZvciByZWR1Y2luZyBieSBjb3VudC5cbiAgICAgIGZ1bmN0aW9uIHJlZHVjZUNvdW50KCkge1xuICAgICAgICByZXR1cm4gcmVkdWNlKGNyb3NzZmlsdGVyX3JlZHVjZUluY3JlbWVudCwgY3Jvc3NmaWx0ZXJfcmVkdWNlRGVjcmVtZW50LCBjcm9zc2ZpbHRlcl96ZXJvKTtcbiAgICAgIH1cblxuICAgICAgLy8gQSBjb252ZW5pZW5jZSBtZXRob2QgZm9yIHJlZHVjaW5nIGJ5IHN1bSh2YWx1ZSkuXG4gICAgICBmdW5jdGlvbiByZWR1Y2VTdW0odmFsdWUpIHtcbiAgICAgICAgcmV0dXJuIHJlZHVjZShjcm9zc2ZpbHRlcl9yZWR1Y2VBZGQodmFsdWUpLCBjcm9zc2ZpbHRlcl9yZWR1Y2VTdWJ0cmFjdCh2YWx1ZSksIGNyb3NzZmlsdGVyX3plcm8pO1xuICAgICAgfVxuXG4gICAgICAvLyBTZXRzIHRoZSByZWR1Y2Ugb3JkZXIsIHVzaW5nIHRoZSBzcGVjaWZpZWQgYWNjZXNzb3IuXG4gICAgICBmdW5jdGlvbiBvcmRlcih2YWx1ZSkge1xuICAgICAgICBzZWxlY3QgPSBoZWFwc2VsZWN0X2J5KHZhbHVlT2YpO1xuICAgICAgICBoZWFwID0gaGVhcF9ieSh2YWx1ZU9mKTtcbiAgICAgICAgZnVuY3Rpb24gdmFsdWVPZihkKSB7IHJldHVybiB2YWx1ZShkLnZhbHVlKTsgfVxuICAgICAgICByZXR1cm4gZ3JvdXA7XG4gICAgICB9XG5cbiAgICAgIC8vIEEgY29udmVuaWVuY2UgbWV0aG9kIGZvciBuYXR1cmFsIG9yZGVyaW5nIGJ5IHJlZHVjZSB2YWx1ZS5cbiAgICAgIGZ1bmN0aW9uIG9yZGVyTmF0dXJhbCgpIHtcbiAgICAgICAgcmV0dXJuIG9yZGVyKGNyb3NzZmlsdGVyX2lkZW50aXR5KTtcbiAgICAgIH1cblxuICAgICAgLy8gUmV0dXJucyB0aGUgY2FyZGluYWxpdHkgb2YgdGhpcyBncm91cCwgaXJyZXNwZWN0aXZlIG9mIGFueSBmaWx0ZXJzLlxuICAgICAgZnVuY3Rpb24gc2l6ZSgpIHtcbiAgICAgICAgcmV0dXJuIGs7XG4gICAgICB9XG5cbiAgICAgIC8vIFJlbW92ZXMgdGhpcyBncm91cCBhbmQgYXNzb2NpYXRlZCBldmVudCBsaXN0ZW5lcnMuXG4gICAgICBmdW5jdGlvbiBkaXNwb3NlKCkge1xuICAgICAgICB2YXIgaSA9IGZpbHRlckxpc3RlbmVycy5pbmRleE9mKHVwZGF0ZSk7XG4gICAgICAgIGlmIChpID49IDApIGZpbHRlckxpc3RlbmVycy5zcGxpY2UoaSwgMSk7XG4gICAgICAgIGkgPSBpbmRleExpc3RlbmVycy5pbmRleE9mKGFkZCk7XG4gICAgICAgIGlmIChpID49IDApIGluZGV4TGlzdGVuZXJzLnNwbGljZShpLCAxKTtcbiAgICAgICAgaSA9IHJlbW92ZURhdGFMaXN0ZW5lcnMuaW5kZXhPZihyZW1vdmVEYXRhKTtcbiAgICAgICAgaWYgKGkgPj0gMCkgcmVtb3ZlRGF0YUxpc3RlbmVycy5zcGxpY2UoaSwgMSk7XG4gICAgICAgIHJldHVybiBncm91cDtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIHJlZHVjZUNvdW50KCkub3JkZXJOYXR1cmFsKCk7XG4gICAgfVxuXG4gICAgLy8gQSBjb252ZW5pZW5jZSBmdW5jdGlvbiBmb3IgZ2VuZXJhdGluZyBhIHNpbmdsZXRvbiBncm91cC5cbiAgICBmdW5jdGlvbiBncm91cEFsbCgpIHtcbiAgICAgIHZhciBnID0gZ3JvdXAoY3Jvc3NmaWx0ZXJfbnVsbCksIGFsbCA9IGcuYWxsO1xuICAgICAgZGVsZXRlIGcuYWxsO1xuICAgICAgZGVsZXRlIGcudG9wO1xuICAgICAgZGVsZXRlIGcub3JkZXI7XG4gICAgICBkZWxldGUgZy5vcmRlck5hdHVyYWw7XG4gICAgICBkZWxldGUgZy5zaXplO1xuICAgICAgZy52YWx1ZSA9IGZ1bmN0aW9uKCkgeyByZXR1cm4gYWxsKClbMF0udmFsdWU7IH07XG4gICAgICByZXR1cm4gZztcbiAgICB9XG5cbiAgICAvLyBSZW1vdmVzIHRoaXMgZGltZW5zaW9uIGFuZCBhc3NvY2lhdGVkIGdyb3VwcyBhbmQgZXZlbnQgbGlzdGVuZXJzLlxuICAgIGZ1bmN0aW9uIGRpc3Bvc2UoKSB7XG4gICAgICBkaW1lbnNpb25Hcm91cHMuZm9yRWFjaChmdW5jdGlvbihncm91cCkgeyBncm91cC5kaXNwb3NlKCk7IH0pO1xuICAgICAgdmFyIGkgPSBkYXRhTGlzdGVuZXJzLmluZGV4T2YocHJlQWRkKTtcbiAgICAgIGlmIChpID49IDApIGRhdGFMaXN0ZW5lcnMuc3BsaWNlKGksIDEpO1xuICAgICAgaSA9IGRhdGFMaXN0ZW5lcnMuaW5kZXhPZihwb3N0QWRkKTtcbiAgICAgIGlmIChpID49IDApIGRhdGFMaXN0ZW5lcnMuc3BsaWNlKGksIDEpO1xuICAgICAgaSA9IHJlbW92ZURhdGFMaXN0ZW5lcnMuaW5kZXhPZihyZW1vdmVEYXRhKTtcbiAgICAgIGlmIChpID49IDApIHJlbW92ZURhdGFMaXN0ZW5lcnMuc3BsaWNlKGksIDEpO1xuICAgICAgbSAmPSB6ZXJvO1xuICAgICAgcmV0dXJuIGZpbHRlckFsbCgpO1xuICAgIH1cblxuICAgIHJldHVybiBkaW1lbnNpb247XG4gIH1cblxuICAvLyBBIGNvbnZlbmllbmNlIG1ldGhvZCBmb3IgZ3JvdXBBbGwgb24gYSBkdW1teSBkaW1lbnNpb24uXG4gIC8vIFRoaXMgaW1wbGVtZW50YXRpb24gY2FuIGJlIG9wdGltaXplZCBzaW5jZSBpdCBhbHdheXMgaGFzIGNhcmRpbmFsaXR5IDEuXG4gIGZ1bmN0aW9uIGdyb3VwQWxsKCkge1xuICAgIHZhciBncm91cCA9IHtcbiAgICAgIHJlZHVjZTogcmVkdWNlLFxuICAgICAgcmVkdWNlQ291bnQ6IHJlZHVjZUNvdW50LFxuICAgICAgcmVkdWNlU3VtOiByZWR1Y2VTdW0sXG4gICAgICB2YWx1ZTogdmFsdWUsXG4gICAgICBkaXNwb3NlOiBkaXNwb3NlLFxuICAgICAgcmVtb3ZlOiBkaXNwb3NlIC8vIGZvciBiYWNrd2FyZHMtY29tcGF0aWJpbGl0eVxuICAgIH07XG5cbiAgICB2YXIgcmVkdWNlVmFsdWUsXG4gICAgICAgIHJlZHVjZUFkZCxcbiAgICAgICAgcmVkdWNlUmVtb3ZlLFxuICAgICAgICByZWR1Y2VJbml0aWFsLFxuICAgICAgICByZXNldE5lZWRlZCA9IHRydWU7XG5cbiAgICAvLyBUaGUgZ3JvdXAgbGlzdGVucyB0byB0aGUgY3Jvc3NmaWx0ZXIgZm9yIHdoZW4gYW55IGRpbWVuc2lvbiBjaGFuZ2VzLCBzb1xuICAgIC8vIHRoYXQgaXQgY2FuIHVwZGF0ZSB0aGUgcmVkdWNlIHZhbHVlLiBJdCBtdXN0IGFsc28gbGlzdGVuIHRvIHRoZSBwYXJlbnRcbiAgICAvLyBkaW1lbnNpb24gZm9yIHdoZW4gZGF0YSBpcyBhZGRlZC5cbiAgICBmaWx0ZXJMaXN0ZW5lcnMucHVzaCh1cGRhdGUpO1xuICAgIGRhdGFMaXN0ZW5lcnMucHVzaChhZGQpO1xuXG4gICAgLy8gRm9yIGNvbnNpc3RlbmN5OyBhY3R1YWxseSBhIG5vLW9wIHNpbmNlIHJlc2V0TmVlZGVkIGlzIHRydWUuXG4gICAgYWRkKGRhdGEsIDAsIG4pO1xuXG4gICAgLy8gSW5jb3Jwb3JhdGVzIHRoZSBzcGVjaWZpZWQgbmV3IHZhbHVlcyBpbnRvIHRoaXMgZ3JvdXAuXG4gICAgZnVuY3Rpb24gYWRkKG5ld0RhdGEsIG4wKSB7XG4gICAgICB2YXIgaTtcblxuICAgICAgaWYgKHJlc2V0TmVlZGVkKSByZXR1cm47XG5cbiAgICAgIC8vIEFkZCB0aGUgYWRkZWQgdmFsdWVzLlxuICAgICAgZm9yIChpID0gbjA7IGkgPCBuOyArK2kpIHtcbiAgICAgICAgaWYgKCFmaWx0ZXJzW2ldKSB7XG4gICAgICAgICAgcmVkdWNlVmFsdWUgPSByZWR1Y2VBZGQocmVkdWNlVmFsdWUsIGRhdGFbaV0pO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gUmVkdWNlcyB0aGUgc3BlY2lmaWVkIHNlbGVjdGVkIG9yIGRlc2VsZWN0ZWQgcmVjb3Jkcy5cbiAgICBmdW5jdGlvbiB1cGRhdGUoZmlsdGVyT25lLCBhZGRlZCwgcmVtb3ZlZCkge1xuICAgICAgdmFyIGksXG4gICAgICAgICAgayxcbiAgICAgICAgICBuO1xuXG4gICAgICBpZiAocmVzZXROZWVkZWQpIHJldHVybjtcblxuICAgICAgLy8gQWRkIHRoZSBhZGRlZCB2YWx1ZXMuXG4gICAgICBmb3IgKGkgPSAwLCBuID0gYWRkZWQubGVuZ3RoOyBpIDwgbjsgKytpKSB7XG4gICAgICAgIGlmICghZmlsdGVyc1trID0gYWRkZWRbaV1dKSB7XG4gICAgICAgICAgcmVkdWNlVmFsdWUgPSByZWR1Y2VBZGQocmVkdWNlVmFsdWUsIGRhdGFba10pO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIC8vIFJlbW92ZSB0aGUgcmVtb3ZlZCB2YWx1ZXMuXG4gICAgICBmb3IgKGkgPSAwLCBuID0gcmVtb3ZlZC5sZW5ndGg7IGkgPCBuOyArK2kpIHtcbiAgICAgICAgaWYgKGZpbHRlcnNbayA9IHJlbW92ZWRbaV1dID09PSBmaWx0ZXJPbmUpIHtcbiAgICAgICAgICByZWR1Y2VWYWx1ZSA9IHJlZHVjZVJlbW92ZShyZWR1Y2VWYWx1ZSwgZGF0YVtrXSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBSZWNvbXB1dGVzIHRoZSBncm91cCByZWR1Y2UgdmFsdWUgZnJvbSBzY3JhdGNoLlxuICAgIGZ1bmN0aW9uIHJlc2V0KCkge1xuICAgICAgdmFyIGk7XG5cbiAgICAgIHJlZHVjZVZhbHVlID0gcmVkdWNlSW5pdGlhbCgpO1xuXG4gICAgICBmb3IgKGkgPSAwOyBpIDwgbjsgKytpKSB7XG4gICAgICAgIGlmICghZmlsdGVyc1tpXSkge1xuICAgICAgICAgIHJlZHVjZVZhbHVlID0gcmVkdWNlQWRkKHJlZHVjZVZhbHVlLCBkYXRhW2ldKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIC8vIFNldHMgdGhlIHJlZHVjZSBiZWhhdmlvciBmb3IgdGhpcyBncm91cCB0byB1c2UgdGhlIHNwZWNpZmllZCBmdW5jdGlvbnMuXG4gICAgLy8gVGhpcyBtZXRob2QgbGF6aWx5IHJlY29tcHV0ZXMgdGhlIHJlZHVjZSB2YWx1ZSwgd2FpdGluZyB1bnRpbCBuZWVkZWQuXG4gICAgZnVuY3Rpb24gcmVkdWNlKGFkZCwgcmVtb3ZlLCBpbml0aWFsKSB7XG4gICAgICByZWR1Y2VBZGQgPSBhZGQ7XG4gICAgICByZWR1Y2VSZW1vdmUgPSByZW1vdmU7XG4gICAgICByZWR1Y2VJbml0aWFsID0gaW5pdGlhbDtcbiAgICAgIHJlc2V0TmVlZGVkID0gdHJ1ZTtcbiAgICAgIHJldHVybiBncm91cDtcbiAgICB9XG5cbiAgICAvLyBBIGNvbnZlbmllbmNlIG1ldGhvZCBmb3IgcmVkdWNpbmcgYnkgY291bnQuXG4gICAgZnVuY3Rpb24gcmVkdWNlQ291bnQoKSB7XG4gICAgICByZXR1cm4gcmVkdWNlKGNyb3NzZmlsdGVyX3JlZHVjZUluY3JlbWVudCwgY3Jvc3NmaWx0ZXJfcmVkdWNlRGVjcmVtZW50LCBjcm9zc2ZpbHRlcl96ZXJvKTtcbiAgICB9XG5cbiAgICAvLyBBIGNvbnZlbmllbmNlIG1ldGhvZCBmb3IgcmVkdWNpbmcgYnkgc3VtKHZhbHVlKS5cbiAgICBmdW5jdGlvbiByZWR1Y2VTdW0odmFsdWUpIHtcbiAgICAgIHJldHVybiByZWR1Y2UoY3Jvc3NmaWx0ZXJfcmVkdWNlQWRkKHZhbHVlKSwgY3Jvc3NmaWx0ZXJfcmVkdWNlU3VidHJhY3QodmFsdWUpLCBjcm9zc2ZpbHRlcl96ZXJvKTtcbiAgICB9XG5cbiAgICAvLyBSZXR1cm5zIHRoZSBjb21wdXRlZCByZWR1Y2UgdmFsdWUuXG4gICAgZnVuY3Rpb24gdmFsdWUoKSB7XG4gICAgICBpZiAocmVzZXROZWVkZWQpIHJlc2V0KCksIHJlc2V0TmVlZGVkID0gZmFsc2U7XG4gICAgICByZXR1cm4gcmVkdWNlVmFsdWU7XG4gICAgfVxuXG4gICAgLy8gUmVtb3ZlcyB0aGlzIGdyb3VwIGFuZCBhc3NvY2lhdGVkIGV2ZW50IGxpc3RlbmVycy5cbiAgICBmdW5jdGlvbiBkaXNwb3NlKCkge1xuICAgICAgdmFyIGkgPSBmaWx0ZXJMaXN0ZW5lcnMuaW5kZXhPZih1cGRhdGUpO1xuICAgICAgaWYgKGkgPj0gMCkgZmlsdGVyTGlzdGVuZXJzLnNwbGljZShpKTtcbiAgICAgIGkgPSBkYXRhTGlzdGVuZXJzLmluZGV4T2YoYWRkKTtcbiAgICAgIGlmIChpID49IDApIGRhdGFMaXN0ZW5lcnMuc3BsaWNlKGkpO1xuICAgICAgcmV0dXJuIGdyb3VwO1xuICAgIH1cblxuICAgIHJldHVybiByZWR1Y2VDb3VudCgpO1xuICB9XG5cbiAgLy8gUmV0dXJucyB0aGUgbnVtYmVyIG9mIHJlY29yZHMgaW4gdGhpcyBjcm9zc2ZpbHRlciwgaXJyZXNwZWN0aXZlIG9mIGFueSBmaWx0ZXJzLlxuICBmdW5jdGlvbiBzaXplKCkge1xuICAgIHJldHVybiBuO1xuICB9XG5cbiAgcmV0dXJuIGFyZ3VtZW50cy5sZW5ndGhcbiAgICAgID8gYWRkKGFyZ3VtZW50c1swXSlcbiAgICAgIDogY3Jvc3NmaWx0ZXI7XG59XG5cbi8vIFJldHVybnMgYW4gYXJyYXkgb2Ygc2l6ZSBuLCBiaWcgZW5vdWdoIHRvIHN0b3JlIGlkcyB1cCB0byBtLlxuZnVuY3Rpb24gY3Jvc3NmaWx0ZXJfaW5kZXgobiwgbSkge1xuICByZXR1cm4gKG0gPCAweDEwMVxuICAgICAgPyBjcm9zc2ZpbHRlcl9hcnJheTggOiBtIDwgMHgxMDAwMVxuICAgICAgPyBjcm9zc2ZpbHRlcl9hcnJheTE2XG4gICAgICA6IGNyb3NzZmlsdGVyX2FycmF5MzIpKG4pO1xufVxuXG4vLyBDb25zdHJ1Y3RzIGEgbmV3IGFycmF5IG9mIHNpemUgbiwgd2l0aCBzZXF1ZW50aWFsIHZhbHVlcyBmcm9tIDAgdG8gbiAtIDEuXG5mdW5jdGlvbiBjcm9zc2ZpbHRlcl9yYW5nZShuKSB7XG4gIHZhciByYW5nZSA9IGNyb3NzZmlsdGVyX2luZGV4KG4sIG4pO1xuICBmb3IgKHZhciBpID0gLTE7ICsraSA8IG47KSByYW5nZVtpXSA9IGk7XG4gIHJldHVybiByYW5nZTtcbn1cblxuZnVuY3Rpb24gY3Jvc3NmaWx0ZXJfY2FwYWNpdHkodykge1xuICByZXR1cm4gdyA9PT0gOFxuICAgICAgPyAweDEwMCA6IHcgPT09IDE2XG4gICAgICA/IDB4MTAwMDBcbiAgICAgIDogMHgxMDAwMDAwMDA7XG59XG59KSh0eXBlb2YgZXhwb3J0cyAhPT0gJ3VuZGVmaW5lZCcgJiYgZXhwb3J0cyB8fCB0aGlzKTtcbiIsIm1vZHVsZS5leHBvcnRzID0gcmVxdWlyZShcIi4vY3Jvc3NmaWx0ZXJcIikuY3Jvc3NmaWx0ZXI7XG4iLCIndXNlIHN0cmljdCc7XG5cbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCAnX19lc01vZHVsZScsIHsgdmFsdWU6IHRydWUgfSk7XG5cbnZhciB0b3BvanNvbkNsaWVudCA9IHJlcXVpcmUoJ3RvcG9qc29uLWNsaWVudCcpO1xudmFyIHRvcG9qc29uU2VydmVyID0gcmVxdWlyZSgndG9wb2pzb24tc2VydmVyJyk7XG52YXIgdG9wb2pzb25TaW1wbGlmeSA9IHJlcXVpcmUoJ3RvcG9qc29uLXNpbXBsaWZ5Jyk7XG5cblxuXG5PYmplY3Qua2V5cyh0b3BvanNvbkNsaWVudCkuZm9yRWFjaChmdW5jdGlvbiAoa2V5KSB7IGV4cG9ydHNba2V5XSA9IHRvcG9qc29uQ2xpZW50W2tleV07IH0pO1xuT2JqZWN0LmtleXModG9wb2pzb25TZXJ2ZXIpLmZvckVhY2goZnVuY3Rpb24gKGtleSkgeyBleHBvcnRzW2tleV0gPSB0b3BvanNvblNlcnZlcltrZXldOyB9KTtcbk9iamVjdC5rZXlzKHRvcG9qc29uU2ltcGxpZnkpLmZvckVhY2goZnVuY3Rpb24gKGtleSkgeyBleHBvcnRzW2tleV0gPSB0b3BvanNvblNpbXBsaWZ5W2tleV07IH0pO1xuIiwiLy8gaHR0cHM6Ly9naXRodWIuY29tL3RvcG9qc29uL3RvcG9qc29uLWNsaWVudCBWZXJzaW9uIDMuMC4wLiBDb3B5cmlnaHQgMjAxNyBNaWtlIEJvc3RvY2suXG4oZnVuY3Rpb24gKGdsb2JhbCwgZmFjdG9yeSkge1xuXHR0eXBlb2YgZXhwb3J0cyA9PT0gJ29iamVjdCcgJiYgdHlwZW9mIG1vZHVsZSAhPT0gJ3VuZGVmaW5lZCcgPyBmYWN0b3J5KGV4cG9ydHMpIDpcblx0dHlwZW9mIGRlZmluZSA9PT0gJ2Z1bmN0aW9uJyAmJiBkZWZpbmUuYW1kID8gZGVmaW5lKFsnZXhwb3J0cyddLCBmYWN0b3J5KSA6XG5cdChmYWN0b3J5KChnbG9iYWwudG9wb2pzb24gPSBnbG9iYWwudG9wb2pzb24gfHwge30pKSk7XG59KHRoaXMsIChmdW5jdGlvbiAoZXhwb3J0cykgeyAndXNlIHN0cmljdCc7XG5cbnZhciBpZGVudGl0eSA9IGZ1bmN0aW9uKHgpIHtcbiAgcmV0dXJuIHg7XG59O1xuXG52YXIgdHJhbnNmb3JtID0gZnVuY3Rpb24odHJhbnNmb3JtKSB7XG4gIGlmICh0cmFuc2Zvcm0gPT0gbnVsbCkgcmV0dXJuIGlkZW50aXR5O1xuICB2YXIgeDAsXG4gICAgICB5MCxcbiAgICAgIGt4ID0gdHJhbnNmb3JtLnNjYWxlWzBdLFxuICAgICAga3kgPSB0cmFuc2Zvcm0uc2NhbGVbMV0sXG4gICAgICBkeCA9IHRyYW5zZm9ybS50cmFuc2xhdGVbMF0sXG4gICAgICBkeSA9IHRyYW5zZm9ybS50cmFuc2xhdGVbMV07XG4gIHJldHVybiBmdW5jdGlvbihpbnB1dCwgaSkge1xuICAgIGlmICghaSkgeDAgPSB5MCA9IDA7XG4gICAgdmFyIGogPSAyLCBuID0gaW5wdXQubGVuZ3RoLCBvdXRwdXQgPSBuZXcgQXJyYXkobik7XG4gICAgb3V0cHV0WzBdID0gKHgwICs9IGlucHV0WzBdKSAqIGt4ICsgZHg7XG4gICAgb3V0cHV0WzFdID0gKHkwICs9IGlucHV0WzFdKSAqIGt5ICsgZHk7XG4gICAgd2hpbGUgKGogPCBuKSBvdXRwdXRbal0gPSBpbnB1dFtqXSwgKytqO1xuICAgIHJldHVybiBvdXRwdXQ7XG4gIH07XG59O1xuXG52YXIgYmJveCA9IGZ1bmN0aW9uKHRvcG9sb2d5KSB7XG4gIHZhciB0ID0gdHJhbnNmb3JtKHRvcG9sb2d5LnRyYW5zZm9ybSksIGtleSxcbiAgICAgIHgwID0gSW5maW5pdHksIHkwID0geDAsIHgxID0gLXgwLCB5MSA9IC14MDtcblxuICBmdW5jdGlvbiBiYm94UG9pbnQocCkge1xuICAgIHAgPSB0KHApO1xuICAgIGlmIChwWzBdIDwgeDApIHgwID0gcFswXTtcbiAgICBpZiAocFswXSA+IHgxKSB4MSA9IHBbMF07XG4gICAgaWYgKHBbMV0gPCB5MCkgeTAgPSBwWzFdO1xuICAgIGlmIChwWzFdID4geTEpIHkxID0gcFsxXTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGJib3hHZW9tZXRyeShvKSB7XG4gICAgc3dpdGNoIChvLnR5cGUpIHtcbiAgICAgIGNhc2UgXCJHZW9tZXRyeUNvbGxlY3Rpb25cIjogby5nZW9tZXRyaWVzLmZvckVhY2goYmJveEdlb21ldHJ5KTsgYnJlYWs7XG4gICAgICBjYXNlIFwiUG9pbnRcIjogYmJveFBvaW50KG8uY29vcmRpbmF0ZXMpOyBicmVhaztcbiAgICAgIGNhc2UgXCJNdWx0aVBvaW50XCI6IG8uY29vcmRpbmF0ZXMuZm9yRWFjaChiYm94UG9pbnQpOyBicmVhaztcbiAgICB9XG4gIH1cblxuICB0b3BvbG9neS5hcmNzLmZvckVhY2goZnVuY3Rpb24oYXJjKSB7XG4gICAgdmFyIGkgPSAtMSwgbiA9IGFyYy5sZW5ndGgsIHA7XG4gICAgd2hpbGUgKCsraSA8IG4pIHtcbiAgICAgIHAgPSB0KGFyY1tpXSwgaSk7XG4gICAgICBpZiAocFswXSA8IHgwKSB4MCA9IHBbMF07XG4gICAgICBpZiAocFswXSA+IHgxKSB4MSA9IHBbMF07XG4gICAgICBpZiAocFsxXSA8IHkwKSB5MCA9IHBbMV07XG4gICAgICBpZiAocFsxXSA+IHkxKSB5MSA9IHBbMV07XG4gICAgfVxuICB9KTtcblxuICBmb3IgKGtleSBpbiB0b3BvbG9neS5vYmplY3RzKSB7XG4gICAgYmJveEdlb21ldHJ5KHRvcG9sb2d5Lm9iamVjdHNba2V5XSk7XG4gIH1cblxuICByZXR1cm4gW3gwLCB5MCwgeDEsIHkxXTtcbn07XG5cbnZhciByZXZlcnNlID0gZnVuY3Rpb24oYXJyYXksIG4pIHtcbiAgdmFyIHQsIGogPSBhcnJheS5sZW5ndGgsIGkgPSBqIC0gbjtcbiAgd2hpbGUgKGkgPCAtLWopIHQgPSBhcnJheVtpXSwgYXJyYXlbaSsrXSA9IGFycmF5W2pdLCBhcnJheVtqXSA9IHQ7XG59O1xuXG52YXIgZmVhdHVyZSA9IGZ1bmN0aW9uKHRvcG9sb2d5LCBvKSB7XG4gIHJldHVybiBvLnR5cGUgPT09IFwiR2VvbWV0cnlDb2xsZWN0aW9uXCJcbiAgICAgID8ge3R5cGU6IFwiRmVhdHVyZUNvbGxlY3Rpb25cIiwgZmVhdHVyZXM6IG8uZ2VvbWV0cmllcy5tYXAoZnVuY3Rpb24obykgeyByZXR1cm4gZmVhdHVyZSQxKHRvcG9sb2d5LCBvKTsgfSl9XG4gICAgICA6IGZlYXR1cmUkMSh0b3BvbG9neSwgbyk7XG59O1xuXG5mdW5jdGlvbiBmZWF0dXJlJDEodG9wb2xvZ3ksIG8pIHtcbiAgdmFyIGlkID0gby5pZCxcbiAgICAgIGJib3ggPSBvLmJib3gsXG4gICAgICBwcm9wZXJ0aWVzID0gby5wcm9wZXJ0aWVzID09IG51bGwgPyB7fSA6IG8ucHJvcGVydGllcyxcbiAgICAgIGdlb21ldHJ5ID0gb2JqZWN0KHRvcG9sb2d5LCBvKTtcbiAgcmV0dXJuIGlkID09IG51bGwgJiYgYmJveCA9PSBudWxsID8ge3R5cGU6IFwiRmVhdHVyZVwiLCBwcm9wZXJ0aWVzOiBwcm9wZXJ0aWVzLCBnZW9tZXRyeTogZ2VvbWV0cnl9XG4gICAgICA6IGJib3ggPT0gbnVsbCA/IHt0eXBlOiBcIkZlYXR1cmVcIiwgaWQ6IGlkLCBwcm9wZXJ0aWVzOiBwcm9wZXJ0aWVzLCBnZW9tZXRyeTogZ2VvbWV0cnl9XG4gICAgICA6IHt0eXBlOiBcIkZlYXR1cmVcIiwgaWQ6IGlkLCBiYm94OiBiYm94LCBwcm9wZXJ0aWVzOiBwcm9wZXJ0aWVzLCBnZW9tZXRyeTogZ2VvbWV0cnl9O1xufVxuXG5mdW5jdGlvbiBvYmplY3QodG9wb2xvZ3ksIG8pIHtcbiAgdmFyIHRyYW5zZm9ybVBvaW50ID0gdHJhbnNmb3JtKHRvcG9sb2d5LnRyYW5zZm9ybSksXG4gICAgICBhcmNzID0gdG9wb2xvZ3kuYXJjcztcblxuICBmdW5jdGlvbiBhcmMoaSwgcG9pbnRzKSB7XG4gICAgaWYgKHBvaW50cy5sZW5ndGgpIHBvaW50cy5wb3AoKTtcbiAgICBmb3IgKHZhciBhID0gYXJjc1tpIDwgMCA/IH5pIDogaV0sIGsgPSAwLCBuID0gYS5sZW5ndGg7IGsgPCBuOyArK2spIHtcbiAgICAgIHBvaW50cy5wdXNoKHRyYW5zZm9ybVBvaW50KGFba10sIGspKTtcbiAgICB9XG4gICAgaWYgKGkgPCAwKSByZXZlcnNlKHBvaW50cywgbik7XG4gIH1cblxuICBmdW5jdGlvbiBwb2ludChwKSB7XG4gICAgcmV0dXJuIHRyYW5zZm9ybVBvaW50KHApO1xuICB9XG5cbiAgZnVuY3Rpb24gbGluZShhcmNzKSB7XG4gICAgdmFyIHBvaW50cyA9IFtdO1xuICAgIGZvciAodmFyIGkgPSAwLCBuID0gYXJjcy5sZW5ndGg7IGkgPCBuOyArK2kpIGFyYyhhcmNzW2ldLCBwb2ludHMpO1xuICAgIGlmIChwb2ludHMubGVuZ3RoIDwgMikgcG9pbnRzLnB1c2gocG9pbnRzWzBdKTsgLy8gVGhpcyBzaG91bGQgbmV2ZXIgaGFwcGVuIHBlciB0aGUgc3BlY2lmaWNhdGlvbi5cbiAgICByZXR1cm4gcG9pbnRzO1xuICB9XG5cbiAgZnVuY3Rpb24gcmluZyhhcmNzKSB7XG4gICAgdmFyIHBvaW50cyA9IGxpbmUoYXJjcyk7XG4gICAgd2hpbGUgKHBvaW50cy5sZW5ndGggPCA0KSBwb2ludHMucHVzaChwb2ludHNbMF0pOyAvLyBUaGlzIG1heSBoYXBwZW4gaWYgYW4gYXJjIGhhcyBvbmx5IHR3byBwb2ludHMuXG4gICAgcmV0dXJuIHBvaW50cztcbiAgfVxuXG4gIGZ1bmN0aW9uIHBvbHlnb24oYXJjcykge1xuICAgIHJldHVybiBhcmNzLm1hcChyaW5nKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGdlb21ldHJ5KG8pIHtcbiAgICB2YXIgdHlwZSA9IG8udHlwZSwgY29vcmRpbmF0ZXM7XG4gICAgc3dpdGNoICh0eXBlKSB7XG4gICAgICBjYXNlIFwiR2VvbWV0cnlDb2xsZWN0aW9uXCI6IHJldHVybiB7dHlwZTogdHlwZSwgZ2VvbWV0cmllczogby5nZW9tZXRyaWVzLm1hcChnZW9tZXRyeSl9O1xuICAgICAgY2FzZSBcIlBvaW50XCI6IGNvb3JkaW5hdGVzID0gcG9pbnQoby5jb29yZGluYXRlcyk7IGJyZWFrO1xuICAgICAgY2FzZSBcIk11bHRpUG9pbnRcIjogY29vcmRpbmF0ZXMgPSBvLmNvb3JkaW5hdGVzLm1hcChwb2ludCk7IGJyZWFrO1xuICAgICAgY2FzZSBcIkxpbmVTdHJpbmdcIjogY29vcmRpbmF0ZXMgPSBsaW5lKG8uYXJjcyk7IGJyZWFrO1xuICAgICAgY2FzZSBcIk11bHRpTGluZVN0cmluZ1wiOiBjb29yZGluYXRlcyA9IG8uYXJjcy5tYXAobGluZSk7IGJyZWFrO1xuICAgICAgY2FzZSBcIlBvbHlnb25cIjogY29vcmRpbmF0ZXMgPSBwb2x5Z29uKG8uYXJjcyk7IGJyZWFrO1xuICAgICAgY2FzZSBcIk11bHRpUG9seWdvblwiOiBjb29yZGluYXRlcyA9IG8uYXJjcy5tYXAocG9seWdvbik7IGJyZWFrO1xuICAgICAgZGVmYXVsdDogcmV0dXJuIG51bGw7XG4gICAgfVxuICAgIHJldHVybiB7dHlwZTogdHlwZSwgY29vcmRpbmF0ZXM6IGNvb3JkaW5hdGVzfTtcbiAgfVxuXG4gIHJldHVybiBnZW9tZXRyeShvKTtcbn1cblxudmFyIHN0aXRjaCA9IGZ1bmN0aW9uKHRvcG9sb2d5LCBhcmNzKSB7XG4gIHZhciBzdGl0Y2hlZEFyY3MgPSB7fSxcbiAgICAgIGZyYWdtZW50QnlTdGFydCA9IHt9LFxuICAgICAgZnJhZ21lbnRCeUVuZCA9IHt9LFxuICAgICAgZnJhZ21lbnRzID0gW10sXG4gICAgICBlbXB0eUluZGV4ID0gLTE7XG5cbiAgLy8gU3RpdGNoIGVtcHR5IGFyY3MgZmlyc3QsIHNpbmNlIHRoZXkgbWF5IGJlIHN1YnN1bWVkIGJ5IG90aGVyIGFyY3MuXG4gIGFyY3MuZm9yRWFjaChmdW5jdGlvbihpLCBqKSB7XG4gICAgdmFyIGFyYyA9IHRvcG9sb2d5LmFyY3NbaSA8IDAgPyB+aSA6IGldLCB0O1xuICAgIGlmIChhcmMubGVuZ3RoIDwgMyAmJiAhYXJjWzFdWzBdICYmICFhcmNbMV1bMV0pIHtcbiAgICAgIHQgPSBhcmNzWysrZW1wdHlJbmRleF0sIGFyY3NbZW1wdHlJbmRleF0gPSBpLCBhcmNzW2pdID0gdDtcbiAgICB9XG4gIH0pO1xuXG4gIGFyY3MuZm9yRWFjaChmdW5jdGlvbihpKSB7XG4gICAgdmFyIGUgPSBlbmRzKGkpLFxuICAgICAgICBzdGFydCA9IGVbMF0sXG4gICAgICAgIGVuZCA9IGVbMV0sXG4gICAgICAgIGYsIGc7XG5cbiAgICBpZiAoZiA9IGZyYWdtZW50QnlFbmRbc3RhcnRdKSB7XG4gICAgICBkZWxldGUgZnJhZ21lbnRCeUVuZFtmLmVuZF07XG4gICAgICBmLnB1c2goaSk7XG4gICAgICBmLmVuZCA9IGVuZDtcbiAgICAgIGlmIChnID0gZnJhZ21lbnRCeVN0YXJ0W2VuZF0pIHtcbiAgICAgICAgZGVsZXRlIGZyYWdtZW50QnlTdGFydFtnLnN0YXJ0XTtcbiAgICAgICAgdmFyIGZnID0gZyA9PT0gZiA/IGYgOiBmLmNvbmNhdChnKTtcbiAgICAgICAgZnJhZ21lbnRCeVN0YXJ0W2ZnLnN0YXJ0ID0gZi5zdGFydF0gPSBmcmFnbWVudEJ5RW5kW2ZnLmVuZCA9IGcuZW5kXSA9IGZnO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgZnJhZ21lbnRCeVN0YXJ0W2Yuc3RhcnRdID0gZnJhZ21lbnRCeUVuZFtmLmVuZF0gPSBmO1xuICAgICAgfVxuICAgIH0gZWxzZSBpZiAoZiA9IGZyYWdtZW50QnlTdGFydFtlbmRdKSB7XG4gICAgICBkZWxldGUgZnJhZ21lbnRCeVN0YXJ0W2Yuc3RhcnRdO1xuICAgICAgZi51bnNoaWZ0KGkpO1xuICAgICAgZi5zdGFydCA9IHN0YXJ0O1xuICAgICAgaWYgKGcgPSBmcmFnbWVudEJ5RW5kW3N0YXJ0XSkge1xuICAgICAgICBkZWxldGUgZnJhZ21lbnRCeUVuZFtnLmVuZF07XG4gICAgICAgIHZhciBnZiA9IGcgPT09IGYgPyBmIDogZy5jb25jYXQoZik7XG4gICAgICAgIGZyYWdtZW50QnlTdGFydFtnZi5zdGFydCA9IGcuc3RhcnRdID0gZnJhZ21lbnRCeUVuZFtnZi5lbmQgPSBmLmVuZF0gPSBnZjtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGZyYWdtZW50QnlTdGFydFtmLnN0YXJ0XSA9IGZyYWdtZW50QnlFbmRbZi5lbmRdID0gZjtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgZiA9IFtpXTtcbiAgICAgIGZyYWdtZW50QnlTdGFydFtmLnN0YXJ0ID0gc3RhcnRdID0gZnJhZ21lbnRCeUVuZFtmLmVuZCA9IGVuZF0gPSBmO1xuICAgIH1cbiAgfSk7XG5cbiAgZnVuY3Rpb24gZW5kcyhpKSB7XG4gICAgdmFyIGFyYyA9IHRvcG9sb2d5LmFyY3NbaSA8IDAgPyB+aSA6IGldLCBwMCA9IGFyY1swXSwgcDE7XG4gICAgaWYgKHRvcG9sb2d5LnRyYW5zZm9ybSkgcDEgPSBbMCwgMF0sIGFyYy5mb3JFYWNoKGZ1bmN0aW9uKGRwKSB7IHAxWzBdICs9IGRwWzBdLCBwMVsxXSArPSBkcFsxXTsgfSk7XG4gICAgZWxzZSBwMSA9IGFyY1thcmMubGVuZ3RoIC0gMV07XG4gICAgcmV0dXJuIGkgPCAwID8gW3AxLCBwMF0gOiBbcDAsIHAxXTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGZsdXNoKGZyYWdtZW50QnlFbmQsIGZyYWdtZW50QnlTdGFydCkge1xuICAgIGZvciAodmFyIGsgaW4gZnJhZ21lbnRCeUVuZCkge1xuICAgICAgdmFyIGYgPSBmcmFnbWVudEJ5RW5kW2tdO1xuICAgICAgZGVsZXRlIGZyYWdtZW50QnlTdGFydFtmLnN0YXJ0XTtcbiAgICAgIGRlbGV0ZSBmLnN0YXJ0O1xuICAgICAgZGVsZXRlIGYuZW5kO1xuICAgICAgZi5mb3JFYWNoKGZ1bmN0aW9uKGkpIHsgc3RpdGNoZWRBcmNzW2kgPCAwID8gfmkgOiBpXSA9IDE7IH0pO1xuICAgICAgZnJhZ21lbnRzLnB1c2goZik7XG4gICAgfVxuICB9XG5cbiAgZmx1c2goZnJhZ21lbnRCeUVuZCwgZnJhZ21lbnRCeVN0YXJ0KTtcbiAgZmx1c2goZnJhZ21lbnRCeVN0YXJ0LCBmcmFnbWVudEJ5RW5kKTtcbiAgYXJjcy5mb3JFYWNoKGZ1bmN0aW9uKGkpIHsgaWYgKCFzdGl0Y2hlZEFyY3NbaSA8IDAgPyB+aSA6IGldKSBmcmFnbWVudHMucHVzaChbaV0pOyB9KTtcblxuICByZXR1cm4gZnJhZ21lbnRzO1xufTtcblxudmFyIG1lc2ggPSBmdW5jdGlvbih0b3BvbG9neSkge1xuICByZXR1cm4gb2JqZWN0KHRvcG9sb2d5LCBtZXNoQXJjcy5hcHBseSh0aGlzLCBhcmd1bWVudHMpKTtcbn07XG5cbmZ1bmN0aW9uIG1lc2hBcmNzKHRvcG9sb2d5LCBvYmplY3QkJDEsIGZpbHRlcikge1xuICB2YXIgYXJjcywgaSwgbjtcbiAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPiAxKSBhcmNzID0gZXh0cmFjdEFyY3ModG9wb2xvZ3ksIG9iamVjdCQkMSwgZmlsdGVyKTtcbiAgZWxzZSBmb3IgKGkgPSAwLCBhcmNzID0gbmV3IEFycmF5KG4gPSB0b3BvbG9neS5hcmNzLmxlbmd0aCk7IGkgPCBuOyArK2kpIGFyY3NbaV0gPSBpO1xuICByZXR1cm4ge3R5cGU6IFwiTXVsdGlMaW5lU3RyaW5nXCIsIGFyY3M6IHN0aXRjaCh0b3BvbG9neSwgYXJjcyl9O1xufVxuXG5mdW5jdGlvbiBleHRyYWN0QXJjcyh0b3BvbG9neSwgb2JqZWN0JCQxLCBmaWx0ZXIpIHtcbiAgdmFyIGFyY3MgPSBbXSxcbiAgICAgIGdlb21zQnlBcmMgPSBbXSxcbiAgICAgIGdlb207XG5cbiAgZnVuY3Rpb24gZXh0cmFjdDAoaSkge1xuICAgIHZhciBqID0gaSA8IDAgPyB+aSA6IGk7XG4gICAgKGdlb21zQnlBcmNbal0gfHwgKGdlb21zQnlBcmNbal0gPSBbXSkpLnB1c2goe2k6IGksIGc6IGdlb219KTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGV4dHJhY3QxKGFyY3MpIHtcbiAgICBhcmNzLmZvckVhY2goZXh0cmFjdDApO1xuICB9XG5cbiAgZnVuY3Rpb24gZXh0cmFjdDIoYXJjcykge1xuICAgIGFyY3MuZm9yRWFjaChleHRyYWN0MSk7XG4gIH1cblxuICBmdW5jdGlvbiBleHRyYWN0MyhhcmNzKSB7XG4gICAgYXJjcy5mb3JFYWNoKGV4dHJhY3QyKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGdlb21ldHJ5KG8pIHtcbiAgICBzd2l0Y2ggKGdlb20gPSBvLCBvLnR5cGUpIHtcbiAgICAgIGNhc2UgXCJHZW9tZXRyeUNvbGxlY3Rpb25cIjogby5nZW9tZXRyaWVzLmZvckVhY2goZ2VvbWV0cnkpOyBicmVhaztcbiAgICAgIGNhc2UgXCJMaW5lU3RyaW5nXCI6IGV4dHJhY3QxKG8uYXJjcyk7IGJyZWFrO1xuICAgICAgY2FzZSBcIk11bHRpTGluZVN0cmluZ1wiOiBjYXNlIFwiUG9seWdvblwiOiBleHRyYWN0MihvLmFyY3MpOyBicmVhaztcbiAgICAgIGNhc2UgXCJNdWx0aVBvbHlnb25cIjogZXh0cmFjdDMoby5hcmNzKTsgYnJlYWs7XG4gICAgfVxuICB9XG5cbiAgZ2VvbWV0cnkob2JqZWN0JCQxKTtcblxuICBnZW9tc0J5QXJjLmZvckVhY2goZmlsdGVyID09IG51bGxcbiAgICAgID8gZnVuY3Rpb24oZ2VvbXMpIHsgYXJjcy5wdXNoKGdlb21zWzBdLmkpOyB9XG4gICAgICA6IGZ1bmN0aW9uKGdlb21zKSB7IGlmIChmaWx0ZXIoZ2VvbXNbMF0uZywgZ2VvbXNbZ2VvbXMubGVuZ3RoIC0gMV0uZykpIGFyY3MucHVzaChnZW9tc1swXS5pKTsgfSk7XG5cbiAgcmV0dXJuIGFyY3M7XG59XG5cbmZ1bmN0aW9uIHBsYW5hclJpbmdBcmVhKHJpbmcpIHtcbiAgdmFyIGkgPSAtMSwgbiA9IHJpbmcubGVuZ3RoLCBhLCBiID0gcmluZ1tuIC0gMV0sIGFyZWEgPSAwO1xuICB3aGlsZSAoKytpIDwgbikgYSA9IGIsIGIgPSByaW5nW2ldLCBhcmVhICs9IGFbMF0gKiBiWzFdIC0gYVsxXSAqIGJbMF07XG4gIHJldHVybiBNYXRoLmFicyhhcmVhKTsgLy8gTm90ZTogZG91YmxlZCBhcmVhIVxufVxuXG52YXIgbWVyZ2UgPSBmdW5jdGlvbih0b3BvbG9neSkge1xuICByZXR1cm4gb2JqZWN0KHRvcG9sb2d5LCBtZXJnZUFyY3MuYXBwbHkodGhpcywgYXJndW1lbnRzKSk7XG59O1xuXG5mdW5jdGlvbiBtZXJnZUFyY3ModG9wb2xvZ3ksIG9iamVjdHMpIHtcbiAgdmFyIHBvbHlnb25zQnlBcmMgPSB7fSxcbiAgICAgIHBvbHlnb25zID0gW10sXG4gICAgICBncm91cHMgPSBbXTtcblxuICBvYmplY3RzLmZvckVhY2goZ2VvbWV0cnkpO1xuXG4gIGZ1bmN0aW9uIGdlb21ldHJ5KG8pIHtcbiAgICBzd2l0Y2ggKG8udHlwZSkge1xuICAgICAgY2FzZSBcIkdlb21ldHJ5Q29sbGVjdGlvblwiOiBvLmdlb21ldHJpZXMuZm9yRWFjaChnZW9tZXRyeSk7IGJyZWFrO1xuICAgICAgY2FzZSBcIlBvbHlnb25cIjogZXh0cmFjdChvLmFyY3MpOyBicmVhaztcbiAgICAgIGNhc2UgXCJNdWx0aVBvbHlnb25cIjogby5hcmNzLmZvckVhY2goZXh0cmFjdCk7IGJyZWFrO1xuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIGV4dHJhY3QocG9seWdvbikge1xuICAgIHBvbHlnb24uZm9yRWFjaChmdW5jdGlvbihyaW5nKSB7XG4gICAgICByaW5nLmZvckVhY2goZnVuY3Rpb24oYXJjKSB7XG4gICAgICAgIChwb2x5Z29uc0J5QXJjW2FyYyA9IGFyYyA8IDAgPyB+YXJjIDogYXJjXSB8fCAocG9seWdvbnNCeUFyY1thcmNdID0gW10pKS5wdXNoKHBvbHlnb24pO1xuICAgICAgfSk7XG4gICAgfSk7XG4gICAgcG9seWdvbnMucHVzaChwb2x5Z29uKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGFyZWEocmluZykge1xuICAgIHJldHVybiBwbGFuYXJSaW5nQXJlYShvYmplY3QodG9wb2xvZ3ksIHt0eXBlOiBcIlBvbHlnb25cIiwgYXJjczogW3JpbmddfSkuY29vcmRpbmF0ZXNbMF0pO1xuICB9XG5cbiAgcG9seWdvbnMuZm9yRWFjaChmdW5jdGlvbihwb2x5Z29uKSB7XG4gICAgaWYgKCFwb2x5Z29uLl8pIHtcbiAgICAgIHZhciBncm91cCA9IFtdLFxuICAgICAgICAgIG5laWdoYm9ycyA9IFtwb2x5Z29uXTtcbiAgICAgIHBvbHlnb24uXyA9IDE7XG4gICAgICBncm91cHMucHVzaChncm91cCk7XG4gICAgICB3aGlsZSAocG9seWdvbiA9IG5laWdoYm9ycy5wb3AoKSkge1xuICAgICAgICBncm91cC5wdXNoKHBvbHlnb24pO1xuICAgICAgICBwb2x5Z29uLmZvckVhY2goZnVuY3Rpb24ocmluZykge1xuICAgICAgICAgIHJpbmcuZm9yRWFjaChmdW5jdGlvbihhcmMpIHtcbiAgICAgICAgICAgIHBvbHlnb25zQnlBcmNbYXJjIDwgMCA/IH5hcmMgOiBhcmNdLmZvckVhY2goZnVuY3Rpb24ocG9seWdvbikge1xuICAgICAgICAgICAgICBpZiAoIXBvbHlnb24uXykge1xuICAgICAgICAgICAgICAgIHBvbHlnb24uXyA9IDE7XG4gICAgICAgICAgICAgICAgbmVpZ2hib3JzLnB1c2gocG9seWdvbik7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9XG4gIH0pO1xuXG4gIHBvbHlnb25zLmZvckVhY2goZnVuY3Rpb24ocG9seWdvbikge1xuICAgIGRlbGV0ZSBwb2x5Z29uLl87XG4gIH0pO1xuXG4gIHJldHVybiB7XG4gICAgdHlwZTogXCJNdWx0aVBvbHlnb25cIixcbiAgICBhcmNzOiBncm91cHMubWFwKGZ1bmN0aW9uKHBvbHlnb25zKSB7XG4gICAgICB2YXIgYXJjcyA9IFtdLCBuO1xuXG4gICAgICAvLyBFeHRyYWN0IHRoZSBleHRlcmlvciAodW5pcXVlKSBhcmNzLlxuICAgICAgcG9seWdvbnMuZm9yRWFjaChmdW5jdGlvbihwb2x5Z29uKSB7XG4gICAgICAgIHBvbHlnb24uZm9yRWFjaChmdW5jdGlvbihyaW5nKSB7XG4gICAgICAgICAgcmluZy5mb3JFYWNoKGZ1bmN0aW9uKGFyYykge1xuICAgICAgICAgICAgaWYgKHBvbHlnb25zQnlBcmNbYXJjIDwgMCA/IH5hcmMgOiBhcmNdLmxlbmd0aCA8IDIpIHtcbiAgICAgICAgICAgICAgYXJjcy5wdXNoKGFyYyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG5cbiAgICAgIC8vIFN0aXRjaCB0aGUgYXJjcyBpbnRvIG9uZSBvciBtb3JlIHJpbmdzLlxuICAgICAgYXJjcyA9IHN0aXRjaCh0b3BvbG9neSwgYXJjcyk7XG5cbiAgICAgIC8vIElmIG1vcmUgdGhhbiBvbmUgcmluZyBpcyByZXR1cm5lZCxcbiAgICAgIC8vIGF0IG1vc3Qgb25lIG9mIHRoZXNlIHJpbmdzIGNhbiBiZSB0aGUgZXh0ZXJpb3I7XG4gICAgICAvLyBjaG9vc2UgdGhlIG9uZSB3aXRoIHRoZSBncmVhdGVzdCBhYnNvbHV0ZSBhcmVhLlxuICAgICAgaWYgKChuID0gYXJjcy5sZW5ndGgpID4gMSkge1xuICAgICAgICBmb3IgKHZhciBpID0gMSwgayA9IGFyZWEoYXJjc1swXSksIGtpLCB0OyBpIDwgbjsgKytpKSB7XG4gICAgICAgICAgaWYgKChraSA9IGFyZWEoYXJjc1tpXSkpID4gaykge1xuICAgICAgICAgICAgdCA9IGFyY3NbMF0sIGFyY3NbMF0gPSBhcmNzW2ldLCBhcmNzW2ldID0gdCwgayA9IGtpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICByZXR1cm4gYXJjcztcbiAgICB9KVxuICB9O1xufVxuXG52YXIgYmlzZWN0ID0gZnVuY3Rpb24oYSwgeCkge1xuICB2YXIgbG8gPSAwLCBoaSA9IGEubGVuZ3RoO1xuICB3aGlsZSAobG8gPCBoaSkge1xuICAgIHZhciBtaWQgPSBsbyArIGhpID4+PiAxO1xuICAgIGlmIChhW21pZF0gPCB4KSBsbyA9IG1pZCArIDE7XG4gICAgZWxzZSBoaSA9IG1pZDtcbiAgfVxuICByZXR1cm4gbG87XG59O1xuXG52YXIgbmVpZ2hib3JzID0gZnVuY3Rpb24ob2JqZWN0cykge1xuICB2YXIgaW5kZXhlc0J5QXJjID0ge30sIC8vIGFyYyBpbmRleCAtPiBhcnJheSBvZiBvYmplY3QgaW5kZXhlc1xuICAgICAgbmVpZ2hib3JzID0gb2JqZWN0cy5tYXAoZnVuY3Rpb24oKSB7IHJldHVybiBbXTsgfSk7XG5cbiAgZnVuY3Rpb24gbGluZShhcmNzLCBpKSB7XG4gICAgYXJjcy5mb3JFYWNoKGZ1bmN0aW9uKGEpIHtcbiAgICAgIGlmIChhIDwgMCkgYSA9IH5hO1xuICAgICAgdmFyIG8gPSBpbmRleGVzQnlBcmNbYV07XG4gICAgICBpZiAobykgby5wdXNoKGkpO1xuICAgICAgZWxzZSBpbmRleGVzQnlBcmNbYV0gPSBbaV07XG4gICAgfSk7XG4gIH1cblxuICBmdW5jdGlvbiBwb2x5Z29uKGFyY3MsIGkpIHtcbiAgICBhcmNzLmZvckVhY2goZnVuY3Rpb24oYXJjKSB7IGxpbmUoYXJjLCBpKTsgfSk7XG4gIH1cblxuICBmdW5jdGlvbiBnZW9tZXRyeShvLCBpKSB7XG4gICAgaWYgKG8udHlwZSA9PT0gXCJHZW9tZXRyeUNvbGxlY3Rpb25cIikgby5nZW9tZXRyaWVzLmZvckVhY2goZnVuY3Rpb24obykgeyBnZW9tZXRyeShvLCBpKTsgfSk7XG4gICAgZWxzZSBpZiAoby50eXBlIGluIGdlb21ldHJ5VHlwZSkgZ2VvbWV0cnlUeXBlW28udHlwZV0oby5hcmNzLCBpKTtcbiAgfVxuXG4gIHZhciBnZW9tZXRyeVR5cGUgPSB7XG4gICAgTGluZVN0cmluZzogbGluZSxcbiAgICBNdWx0aUxpbmVTdHJpbmc6IHBvbHlnb24sXG4gICAgUG9seWdvbjogcG9seWdvbixcbiAgICBNdWx0aVBvbHlnb246IGZ1bmN0aW9uKGFyY3MsIGkpIHsgYXJjcy5mb3JFYWNoKGZ1bmN0aW9uKGFyYykgeyBwb2x5Z29uKGFyYywgaSk7IH0pOyB9XG4gIH07XG5cbiAgb2JqZWN0cy5mb3JFYWNoKGdlb21ldHJ5KTtcblxuICBmb3IgKHZhciBpIGluIGluZGV4ZXNCeUFyYykge1xuICAgIGZvciAodmFyIGluZGV4ZXMgPSBpbmRleGVzQnlBcmNbaV0sIG0gPSBpbmRleGVzLmxlbmd0aCwgaiA9IDA7IGogPCBtOyArK2opIHtcbiAgICAgIGZvciAodmFyIGsgPSBqICsgMTsgayA8IG07ICsraykge1xuICAgICAgICB2YXIgaWogPSBpbmRleGVzW2pdLCBpayA9IGluZGV4ZXNba10sIG47XG4gICAgICAgIGlmICgobiA9IG5laWdoYm9yc1tpal0pW2kgPSBiaXNlY3QobiwgaWspXSAhPT0gaWspIG4uc3BsaWNlKGksIDAsIGlrKTtcbiAgICAgICAgaWYgKChuID0gbmVpZ2hib3JzW2lrXSlbaSA9IGJpc2VjdChuLCBpaildICE9PSBpaikgbi5zcGxpY2UoaSwgMCwgaWopO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIHJldHVybiBuZWlnaGJvcnM7XG59O1xuXG52YXIgdW50cmFuc2Zvcm0gPSBmdW5jdGlvbih0cmFuc2Zvcm0pIHtcbiAgaWYgKHRyYW5zZm9ybSA9PSBudWxsKSByZXR1cm4gaWRlbnRpdHk7XG4gIHZhciB4MCxcbiAgICAgIHkwLFxuICAgICAga3ggPSB0cmFuc2Zvcm0uc2NhbGVbMF0sXG4gICAgICBreSA9IHRyYW5zZm9ybS5zY2FsZVsxXSxcbiAgICAgIGR4ID0gdHJhbnNmb3JtLnRyYW5zbGF0ZVswXSxcbiAgICAgIGR5ID0gdHJhbnNmb3JtLnRyYW5zbGF0ZVsxXTtcbiAgcmV0dXJuIGZ1bmN0aW9uKGlucHV0LCBpKSB7XG4gICAgaWYgKCFpKSB4MCA9IHkwID0gMDtcbiAgICB2YXIgaiA9IDIsXG4gICAgICAgIG4gPSBpbnB1dC5sZW5ndGgsXG4gICAgICAgIG91dHB1dCA9IG5ldyBBcnJheShuKSxcbiAgICAgICAgeDEgPSBNYXRoLnJvdW5kKChpbnB1dFswXSAtIGR4KSAvIGt4KSxcbiAgICAgICAgeTEgPSBNYXRoLnJvdW5kKChpbnB1dFsxXSAtIGR5KSAvIGt5KTtcbiAgICBvdXRwdXRbMF0gPSB4MSAtIHgwLCB4MCA9IHgxO1xuICAgIG91dHB1dFsxXSA9IHkxIC0geTAsIHkwID0geTE7XG4gICAgd2hpbGUgKGogPCBuKSBvdXRwdXRbal0gPSBpbnB1dFtqXSwgKytqO1xuICAgIHJldHVybiBvdXRwdXQ7XG4gIH07XG59O1xuXG52YXIgcXVhbnRpemUgPSBmdW5jdGlvbih0b3BvbG9neSwgdHJhbnNmb3JtKSB7XG4gIGlmICh0b3BvbG9neS50cmFuc2Zvcm0pIHRocm93IG5ldyBFcnJvcihcImFscmVhZHkgcXVhbnRpemVkXCIpO1xuXG4gIGlmICghdHJhbnNmb3JtIHx8ICF0cmFuc2Zvcm0uc2NhbGUpIHtcbiAgICBpZiAoISgobiA9IE1hdGguZmxvb3IodHJhbnNmb3JtKSkgPj0gMikpIHRocm93IG5ldyBFcnJvcihcIm4gbXVzdCBiZSDiiaUyXCIpO1xuICAgIGJveCA9IHRvcG9sb2d5LmJib3ggfHwgYmJveCh0b3BvbG9neSk7XG4gICAgdmFyIHgwID0gYm94WzBdLCB5MCA9IGJveFsxXSwgeDEgPSBib3hbMl0sIHkxID0gYm94WzNdLCBuO1xuICAgIHRyYW5zZm9ybSA9IHtzY2FsZTogW3gxIC0geDAgPyAoeDEgLSB4MCkgLyAobiAtIDEpIDogMSwgeTEgLSB5MCA/ICh5MSAtIHkwKSAvIChuIC0gMSkgOiAxXSwgdHJhbnNsYXRlOiBbeDAsIHkwXX07XG4gIH0gZWxzZSB7XG4gICAgYm94ID0gdG9wb2xvZ3kuYmJveDtcbiAgfVxuXG4gIHZhciB0ID0gdW50cmFuc2Zvcm0odHJhbnNmb3JtKSwgYm94LCBrZXksIGlucHV0cyA9IHRvcG9sb2d5Lm9iamVjdHMsIG91dHB1dHMgPSB7fTtcblxuICBmdW5jdGlvbiBxdWFudGl6ZVBvaW50KHBvaW50KSB7XG4gICAgcmV0dXJuIHQocG9pbnQpO1xuICB9XG5cbiAgZnVuY3Rpb24gcXVhbnRpemVHZW9tZXRyeShpbnB1dCkge1xuICAgIHZhciBvdXRwdXQ7XG4gICAgc3dpdGNoIChpbnB1dC50eXBlKSB7XG4gICAgICBjYXNlIFwiR2VvbWV0cnlDb2xsZWN0aW9uXCI6IG91dHB1dCA9IHt0eXBlOiBcIkdlb21ldHJ5Q29sbGVjdGlvblwiLCBnZW9tZXRyaWVzOiBpbnB1dC5nZW9tZXRyaWVzLm1hcChxdWFudGl6ZUdlb21ldHJ5KX07IGJyZWFrO1xuICAgICAgY2FzZSBcIlBvaW50XCI6IG91dHB1dCA9IHt0eXBlOiBcIlBvaW50XCIsIGNvb3JkaW5hdGVzOiBxdWFudGl6ZVBvaW50KGlucHV0LmNvb3JkaW5hdGVzKX07IGJyZWFrO1xuICAgICAgY2FzZSBcIk11bHRpUG9pbnRcIjogb3V0cHV0ID0ge3R5cGU6IFwiTXVsdGlQb2ludFwiLCBjb29yZGluYXRlczogaW5wdXQuY29vcmRpbmF0ZXMubWFwKHF1YW50aXplUG9pbnQpfTsgYnJlYWs7XG4gICAgICBkZWZhdWx0OiByZXR1cm4gaW5wdXQ7XG4gICAgfVxuICAgIGlmIChpbnB1dC5pZCAhPSBudWxsKSBvdXRwdXQuaWQgPSBpbnB1dC5pZDtcbiAgICBpZiAoaW5wdXQuYmJveCAhPSBudWxsKSBvdXRwdXQuYmJveCA9IGlucHV0LmJib3g7XG4gICAgaWYgKGlucHV0LnByb3BlcnRpZXMgIT0gbnVsbCkgb3V0cHV0LnByb3BlcnRpZXMgPSBpbnB1dC5wcm9wZXJ0aWVzO1xuICAgIHJldHVybiBvdXRwdXQ7XG4gIH1cblxuICBmdW5jdGlvbiBxdWFudGl6ZUFyYyhpbnB1dCkge1xuICAgIHZhciBpID0gMCwgaiA9IDEsIG4gPSBpbnB1dC5sZW5ndGgsIHAsIG91dHB1dCA9IG5ldyBBcnJheShuKTsgLy8gcGVzc2ltaXN0aWNcbiAgICBvdXRwdXRbMF0gPSB0KGlucHV0WzBdLCAwKTtcbiAgICB3aGlsZSAoKytpIDwgbikgaWYgKChwID0gdChpbnB1dFtpXSwgaSkpWzBdIHx8IHBbMV0pIG91dHB1dFtqKytdID0gcDsgLy8gbm9uLWNvaW5jaWRlbnQgcG9pbnRzXG4gICAgaWYgKGogPT09IDEpIG91dHB1dFtqKytdID0gWzAsIDBdOyAvLyBhbiBhcmMgbXVzdCBoYXZlIGF0IGxlYXN0IHR3byBwb2ludHNcbiAgICBvdXRwdXQubGVuZ3RoID0gajtcbiAgICByZXR1cm4gb3V0cHV0O1xuICB9XG5cbiAgZm9yIChrZXkgaW4gaW5wdXRzKSBvdXRwdXRzW2tleV0gPSBxdWFudGl6ZUdlb21ldHJ5KGlucHV0c1trZXldKTtcblxuICByZXR1cm4ge1xuICAgIHR5cGU6IFwiVG9wb2xvZ3lcIixcbiAgICBiYm94OiBib3gsXG4gICAgdHJhbnNmb3JtOiB0cmFuc2Zvcm0sXG4gICAgb2JqZWN0czogb3V0cHV0cyxcbiAgICBhcmNzOiB0b3BvbG9neS5hcmNzLm1hcChxdWFudGl6ZUFyYylcbiAgfTtcbn07XG5cbmV4cG9ydHMuYmJveCA9IGJib3g7XG5leHBvcnRzLmZlYXR1cmUgPSBmZWF0dXJlO1xuZXhwb3J0cy5tZXNoID0gbWVzaDtcbmV4cG9ydHMubWVzaEFyY3MgPSBtZXNoQXJjcztcbmV4cG9ydHMubWVyZ2UgPSBtZXJnZTtcbmV4cG9ydHMubWVyZ2VBcmNzID0gbWVyZ2VBcmNzO1xuZXhwb3J0cy5uZWlnaGJvcnMgPSBuZWlnaGJvcnM7XG5leHBvcnRzLnF1YW50aXplID0gcXVhbnRpemU7XG5leHBvcnRzLnRyYW5zZm9ybSA9IHRyYW5zZm9ybTtcbmV4cG9ydHMudW50cmFuc2Zvcm0gPSB1bnRyYW5zZm9ybTtcblxuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsICdfX2VzTW9kdWxlJywgeyB2YWx1ZTogdHJ1ZSB9KTtcblxufSkpKTtcbiIsIi8vIGh0dHBzOi8vZ2l0aHViLmNvbS90b3BvanNvbi90b3BvanNvbi1zZXJ2ZXIgVmVyc2lvbiAzLjAuMC4gQ29weXJpZ2h0IDIwMTcgTWlrZSBCb3N0b2NrLlxuKGZ1bmN0aW9uIChnbG9iYWwsIGZhY3RvcnkpIHtcblx0dHlwZW9mIGV4cG9ydHMgPT09ICdvYmplY3QnICYmIHR5cGVvZiBtb2R1bGUgIT09ICd1bmRlZmluZWQnID8gZmFjdG9yeShleHBvcnRzKSA6XG5cdHR5cGVvZiBkZWZpbmUgPT09ICdmdW5jdGlvbicgJiYgZGVmaW5lLmFtZCA/IGRlZmluZShbJ2V4cG9ydHMnXSwgZmFjdG9yeSkgOlxuXHQoZmFjdG9yeSgoZ2xvYmFsLnRvcG9qc29uID0gZ2xvYmFsLnRvcG9qc29uIHx8IHt9KSkpO1xufSh0aGlzLCAoZnVuY3Rpb24gKGV4cG9ydHMpIHsgJ3VzZSBzdHJpY3QnO1xuXG4vLyBDb21wdXRlcyB0aGUgYm91bmRpbmcgYm94IG9mIHRoZSBzcGVjaWZpZWQgaGFzaCBvZiBHZW9KU09OIG9iamVjdHMuXG52YXIgYm91bmRzID0gZnVuY3Rpb24ob2JqZWN0cykge1xuICB2YXIgeDAgPSBJbmZpbml0eSxcbiAgICAgIHkwID0gSW5maW5pdHksXG4gICAgICB4MSA9IC1JbmZpbml0eSxcbiAgICAgIHkxID0gLUluZmluaXR5O1xuXG4gIGZ1bmN0aW9uIGJvdW5kR2VvbWV0cnkoZ2VvbWV0cnkpIHtcbiAgICBpZiAoZ2VvbWV0cnkgIT0gbnVsbCAmJiBib3VuZEdlb21ldHJ5VHlwZS5oYXNPd25Qcm9wZXJ0eShnZW9tZXRyeS50eXBlKSkgYm91bmRHZW9tZXRyeVR5cGVbZ2VvbWV0cnkudHlwZV0oZ2VvbWV0cnkpO1xuICB9XG5cbiAgdmFyIGJvdW5kR2VvbWV0cnlUeXBlID0ge1xuICAgIEdlb21ldHJ5Q29sbGVjdGlvbjogZnVuY3Rpb24obykgeyBvLmdlb21ldHJpZXMuZm9yRWFjaChib3VuZEdlb21ldHJ5KTsgfSxcbiAgICBQb2ludDogZnVuY3Rpb24obykgeyBib3VuZFBvaW50KG8uY29vcmRpbmF0ZXMpOyB9LFxuICAgIE11bHRpUG9pbnQ6IGZ1bmN0aW9uKG8pIHsgby5jb29yZGluYXRlcy5mb3JFYWNoKGJvdW5kUG9pbnQpOyB9LFxuICAgIExpbmVTdHJpbmc6IGZ1bmN0aW9uKG8pIHsgYm91bmRMaW5lKG8uYXJjcyk7IH0sXG4gICAgTXVsdGlMaW5lU3RyaW5nOiBmdW5jdGlvbihvKSB7IG8uYXJjcy5mb3JFYWNoKGJvdW5kTGluZSk7IH0sXG4gICAgUG9seWdvbjogZnVuY3Rpb24obykgeyBvLmFyY3MuZm9yRWFjaChib3VuZExpbmUpOyB9LFxuICAgIE11bHRpUG9seWdvbjogZnVuY3Rpb24obykgeyBvLmFyY3MuZm9yRWFjaChib3VuZE11bHRpTGluZSk7IH1cbiAgfTtcblxuICBmdW5jdGlvbiBib3VuZFBvaW50KGNvb3JkaW5hdGVzKSB7XG4gICAgdmFyIHggPSBjb29yZGluYXRlc1swXSxcbiAgICAgICAgeSA9IGNvb3JkaW5hdGVzWzFdO1xuICAgIGlmICh4IDwgeDApIHgwID0geDtcbiAgICBpZiAoeCA+IHgxKSB4MSA9IHg7XG4gICAgaWYgKHkgPCB5MCkgeTAgPSB5O1xuICAgIGlmICh5ID4geTEpIHkxID0geTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGJvdW5kTGluZShjb29yZGluYXRlcykge1xuICAgIGNvb3JkaW5hdGVzLmZvckVhY2goYm91bmRQb2ludCk7XG4gIH1cblxuICBmdW5jdGlvbiBib3VuZE11bHRpTGluZShjb29yZGluYXRlcykge1xuICAgIGNvb3JkaW5hdGVzLmZvckVhY2goYm91bmRMaW5lKTtcbiAgfVxuXG4gIGZvciAodmFyIGtleSBpbiBvYmplY3RzKSB7XG4gICAgYm91bmRHZW9tZXRyeShvYmplY3RzW2tleV0pO1xuICB9XG5cbiAgcmV0dXJuIHgxID49IHgwICYmIHkxID49IHkwID8gW3gwLCB5MCwgeDEsIHkxXSA6IHVuZGVmaW5lZDtcbn07XG5cbnZhciBoYXNoc2V0ID0gZnVuY3Rpb24oc2l6ZSwgaGFzaCwgZXF1YWwsIHR5cGUsIGVtcHR5KSB7XG4gIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAzKSB7XG4gICAgdHlwZSA9IEFycmF5O1xuICAgIGVtcHR5ID0gbnVsbDtcbiAgfVxuXG4gIHZhciBzdG9yZSA9IG5ldyB0eXBlKHNpemUgPSAxIDw8IE1hdGgubWF4KDQsIE1hdGguY2VpbChNYXRoLmxvZyhzaXplKSAvIE1hdGguTE4yKSkpLFxuICAgICAgbWFzayA9IHNpemUgLSAxO1xuXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgc2l6ZTsgKytpKSB7XG4gICAgc3RvcmVbaV0gPSBlbXB0eTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGFkZCh2YWx1ZSkge1xuICAgIHZhciBpbmRleCA9IGhhc2godmFsdWUpICYgbWFzayxcbiAgICAgICAgbWF0Y2ggPSBzdG9yZVtpbmRleF0sXG4gICAgICAgIGNvbGxpc2lvbnMgPSAwO1xuICAgIHdoaWxlIChtYXRjaCAhPSBlbXB0eSkge1xuICAgICAgaWYgKGVxdWFsKG1hdGNoLCB2YWx1ZSkpIHJldHVybiB0cnVlO1xuICAgICAgaWYgKCsrY29sbGlzaW9ucyA+PSBzaXplKSB0aHJvdyBuZXcgRXJyb3IoXCJmdWxsIGhhc2hzZXRcIik7XG4gICAgICBtYXRjaCA9IHN0b3JlW2luZGV4ID0gKGluZGV4ICsgMSkgJiBtYXNrXTtcbiAgICB9XG4gICAgc3RvcmVbaW5kZXhdID0gdmFsdWU7XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cblxuICBmdW5jdGlvbiBoYXModmFsdWUpIHtcbiAgICB2YXIgaW5kZXggPSBoYXNoKHZhbHVlKSAmIG1hc2ssXG4gICAgICAgIG1hdGNoID0gc3RvcmVbaW5kZXhdLFxuICAgICAgICBjb2xsaXNpb25zID0gMDtcbiAgICB3aGlsZSAobWF0Y2ggIT0gZW1wdHkpIHtcbiAgICAgIGlmIChlcXVhbChtYXRjaCwgdmFsdWUpKSByZXR1cm4gdHJ1ZTtcbiAgICAgIGlmICgrK2NvbGxpc2lvbnMgPj0gc2l6ZSkgYnJlYWs7XG4gICAgICBtYXRjaCA9IHN0b3JlW2luZGV4ID0gKGluZGV4ICsgMSkgJiBtYXNrXTtcbiAgICB9XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgZnVuY3Rpb24gdmFsdWVzKCkge1xuICAgIHZhciB2YWx1ZXMgPSBbXTtcbiAgICBmb3IgKHZhciBpID0gMCwgbiA9IHN0b3JlLmxlbmd0aDsgaSA8IG47ICsraSkge1xuICAgICAgdmFyIG1hdGNoID0gc3RvcmVbaV07XG4gICAgICBpZiAobWF0Y2ggIT0gZW1wdHkpIHZhbHVlcy5wdXNoKG1hdGNoKTtcbiAgICB9XG4gICAgcmV0dXJuIHZhbHVlcztcbiAgfVxuXG4gIHJldHVybiB7XG4gICAgYWRkOiBhZGQsXG4gICAgaGFzOiBoYXMsXG4gICAgdmFsdWVzOiB2YWx1ZXNcbiAgfTtcbn07XG5cbnZhciBoYXNobWFwID0gZnVuY3Rpb24oc2l6ZSwgaGFzaCwgZXF1YWwsIGtleVR5cGUsIGtleUVtcHR5LCB2YWx1ZVR5cGUpIHtcbiAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDMpIHtcbiAgICBrZXlUeXBlID0gdmFsdWVUeXBlID0gQXJyYXk7XG4gICAga2V5RW1wdHkgPSBudWxsO1xuICB9XG5cbiAgdmFyIGtleXN0b3JlID0gbmV3IGtleVR5cGUoc2l6ZSA9IDEgPDwgTWF0aC5tYXgoNCwgTWF0aC5jZWlsKE1hdGgubG9nKHNpemUpIC8gTWF0aC5MTjIpKSksXG4gICAgICB2YWxzdG9yZSA9IG5ldyB2YWx1ZVR5cGUoc2l6ZSksXG4gICAgICBtYXNrID0gc2l6ZSAtIDE7XG5cbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBzaXplOyArK2kpIHtcbiAgICBrZXlzdG9yZVtpXSA9IGtleUVtcHR5O1xuICB9XG5cbiAgZnVuY3Rpb24gc2V0KGtleSwgdmFsdWUpIHtcbiAgICB2YXIgaW5kZXggPSBoYXNoKGtleSkgJiBtYXNrLFxuICAgICAgICBtYXRjaEtleSA9IGtleXN0b3JlW2luZGV4XSxcbiAgICAgICAgY29sbGlzaW9ucyA9IDA7XG4gICAgd2hpbGUgKG1hdGNoS2V5ICE9IGtleUVtcHR5KSB7XG4gICAgICBpZiAoZXF1YWwobWF0Y2hLZXksIGtleSkpIHJldHVybiB2YWxzdG9yZVtpbmRleF0gPSB2YWx1ZTtcbiAgICAgIGlmICgrK2NvbGxpc2lvbnMgPj0gc2l6ZSkgdGhyb3cgbmV3IEVycm9yKFwiZnVsbCBoYXNobWFwXCIpO1xuICAgICAgbWF0Y2hLZXkgPSBrZXlzdG9yZVtpbmRleCA9IChpbmRleCArIDEpICYgbWFza107XG4gICAgfVxuICAgIGtleXN0b3JlW2luZGV4XSA9IGtleTtcbiAgICB2YWxzdG9yZVtpbmRleF0gPSB2YWx1ZTtcbiAgICByZXR1cm4gdmFsdWU7XG4gIH1cblxuICBmdW5jdGlvbiBtYXliZVNldChrZXksIHZhbHVlKSB7XG4gICAgdmFyIGluZGV4ID0gaGFzaChrZXkpICYgbWFzayxcbiAgICAgICAgbWF0Y2hLZXkgPSBrZXlzdG9yZVtpbmRleF0sXG4gICAgICAgIGNvbGxpc2lvbnMgPSAwO1xuICAgIHdoaWxlIChtYXRjaEtleSAhPSBrZXlFbXB0eSkge1xuICAgICAgaWYgKGVxdWFsKG1hdGNoS2V5LCBrZXkpKSByZXR1cm4gdmFsc3RvcmVbaW5kZXhdO1xuICAgICAgaWYgKCsrY29sbGlzaW9ucyA+PSBzaXplKSB0aHJvdyBuZXcgRXJyb3IoXCJmdWxsIGhhc2htYXBcIik7XG4gICAgICBtYXRjaEtleSA9IGtleXN0b3JlW2luZGV4ID0gKGluZGV4ICsgMSkgJiBtYXNrXTtcbiAgICB9XG4gICAga2V5c3RvcmVbaW5kZXhdID0ga2V5O1xuICAgIHZhbHN0b3JlW2luZGV4XSA9IHZhbHVlO1xuICAgIHJldHVybiB2YWx1ZTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGdldChrZXksIG1pc3NpbmdWYWx1ZSkge1xuICAgIHZhciBpbmRleCA9IGhhc2goa2V5KSAmIG1hc2ssXG4gICAgICAgIG1hdGNoS2V5ID0ga2V5c3RvcmVbaW5kZXhdLFxuICAgICAgICBjb2xsaXNpb25zID0gMDtcbiAgICB3aGlsZSAobWF0Y2hLZXkgIT0ga2V5RW1wdHkpIHtcbiAgICAgIGlmIChlcXVhbChtYXRjaEtleSwga2V5KSkgcmV0dXJuIHZhbHN0b3JlW2luZGV4XTtcbiAgICAgIGlmICgrK2NvbGxpc2lvbnMgPj0gc2l6ZSkgYnJlYWs7XG4gICAgICBtYXRjaEtleSA9IGtleXN0b3JlW2luZGV4ID0gKGluZGV4ICsgMSkgJiBtYXNrXTtcbiAgICB9XG4gICAgcmV0dXJuIG1pc3NpbmdWYWx1ZTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGtleXMoKSB7XG4gICAgdmFyIGtleXMgPSBbXTtcbiAgICBmb3IgKHZhciBpID0gMCwgbiA9IGtleXN0b3JlLmxlbmd0aDsgaSA8IG47ICsraSkge1xuICAgICAgdmFyIG1hdGNoS2V5ID0ga2V5c3RvcmVbaV07XG4gICAgICBpZiAobWF0Y2hLZXkgIT0ga2V5RW1wdHkpIGtleXMucHVzaChtYXRjaEtleSk7XG4gICAgfVxuICAgIHJldHVybiBrZXlzO1xuICB9XG5cbiAgcmV0dXJuIHtcbiAgICBzZXQ6IHNldCxcbiAgICBtYXliZVNldDogbWF5YmVTZXQsIC8vIHNldCBpZiB1bnNldFxuICAgIGdldDogZ2V0LFxuICAgIGtleXM6IGtleXNcbiAgfTtcbn07XG5cbnZhciBlcXVhbFBvaW50ID0gZnVuY3Rpb24ocG9pbnRBLCBwb2ludEIpIHtcbiAgcmV0dXJuIHBvaW50QVswXSA9PT0gcG9pbnRCWzBdICYmIHBvaW50QVsxXSA9PT0gcG9pbnRCWzFdO1xufTtcblxuLy8gVE9ETyBpZiBxdWFudGl6ZWQsIHVzZSBzaW1wbGVyIEludDMyIGhhc2hpbmc/XG5cbnZhciBidWZmZXIgPSBuZXcgQXJyYXlCdWZmZXIoMTYpO1xudmFyIGZsb2F0cyA9IG5ldyBGbG9hdDY0QXJyYXkoYnVmZmVyKTtcbnZhciB1aW50cyA9IG5ldyBVaW50MzJBcnJheShidWZmZXIpO1xuXG52YXIgaGFzaFBvaW50ID0gZnVuY3Rpb24ocG9pbnQpIHtcbiAgZmxvYXRzWzBdID0gcG9pbnRbMF07XG4gIGZsb2F0c1sxXSA9IHBvaW50WzFdO1xuICB2YXIgaGFzaCA9IHVpbnRzWzBdIF4gdWludHNbMV07XG4gIGhhc2ggPSBoYXNoIDw8IDUgXiBoYXNoID4+IDcgXiB1aW50c1syXSBeIHVpbnRzWzNdO1xuICByZXR1cm4gaGFzaCAmIDB4N2ZmZmZmZmY7XG59O1xuXG4vLyBHaXZlbiBhbiBleHRyYWN0ZWQgKHByZS0pdG9wb2xvZ3ksIGlkZW50aWZpZXMgYWxsIG9mIHRoZSBqdW5jdGlvbnMuIFRoZXNlIGFyZVxuLy8gdGhlIHBvaW50cyBhdCB3aGljaCBhcmNzIChsaW5lcyBvciByaW5ncykgd2lsbCBuZWVkIHRvIGJlIGN1dCBzbyB0aGF0IGVhY2hcbi8vIGFyYyBpcyByZXByZXNlbnRlZCB1bmlxdWVseS5cbi8vXG4vLyBBIGp1bmN0aW9uIGlzIGEgcG9pbnQgd2hlcmUgYXQgbGVhc3Qgb25lIGFyYyBkZXZpYXRlcyBmcm9tIGFub3RoZXIgYXJjIGdvaW5nXG4vLyB0aHJvdWdoIHRoZSBzYW1lIHBvaW50LiBGb3IgZXhhbXBsZSwgY29uc2lkZXIgdGhlIHBvaW50IEIuIElmIHRoZXJlIGlzIGEgYXJjXG4vLyB0aHJvdWdoIEFCQyBhbmQgYW5vdGhlciBhcmMgdGhyb3VnaCBDQkEsIHRoZW4gQiBpcyBub3QgYSBqdW5jdGlvbiBiZWNhdXNlIGluXG4vLyBib3RoIGNhc2VzIHRoZSBhZGphY2VudCBwb2ludCBwYWlycyBhcmUge0EsQ30uIEhvd2V2ZXIsIGlmIHRoZXJlIGlzIGFuXG4vLyBhZGRpdGlvbmFsIGFyYyBBQkQsIHRoZW4ge0EsRH0gIT0ge0EsQ30sIGFuZCB0aHVzIEIgYmVjb21lcyBhIGp1bmN0aW9uLlxuLy9cbi8vIEZvciBhIGNsb3NlZCByaW5nIEFCQ0EsIHRoZSBmaXJzdCBwb2ludCBB4oCZcyBhZGphY2VudCBwb2ludHMgYXJlIHRoZSBzZWNvbmRcbi8vIGFuZCBsYXN0IHBvaW50IHtCLEN9LiBGb3IgYSBsaW5lLCB0aGUgZmlyc3QgYW5kIGxhc3QgcG9pbnQgYXJlIGFsd2F5c1xuLy8gY29uc2lkZXJlZCBqdW5jdGlvbnMsIGV2ZW4gaWYgdGhlIGxpbmUgaXMgY2xvc2VkOyB0aGlzIGVuc3VyZXMgdGhhdCBhIGNsb3NlZFxuLy8gbGluZSBpcyBuZXZlciByb3RhdGVkLlxudmFyIGpvaW4gPSBmdW5jdGlvbih0b3BvbG9neSkge1xuICB2YXIgY29vcmRpbmF0ZXMgPSB0b3BvbG9neS5jb29yZGluYXRlcyxcbiAgICAgIGxpbmVzID0gdG9wb2xvZ3kubGluZXMsXG4gICAgICByaW5ncyA9IHRvcG9sb2d5LnJpbmdzLFxuICAgICAgaW5kZXhlcyA9IGluZGV4KCksXG4gICAgICB2aXNpdGVkQnlJbmRleCA9IG5ldyBJbnQzMkFycmF5KGNvb3JkaW5hdGVzLmxlbmd0aCksXG4gICAgICBsZWZ0QnlJbmRleCA9IG5ldyBJbnQzMkFycmF5KGNvb3JkaW5hdGVzLmxlbmd0aCksXG4gICAgICByaWdodEJ5SW5kZXggPSBuZXcgSW50MzJBcnJheShjb29yZGluYXRlcy5sZW5ndGgpLFxuICAgICAganVuY3Rpb25CeUluZGV4ID0gbmV3IEludDhBcnJheShjb29yZGluYXRlcy5sZW5ndGgpLFxuICAgICAganVuY3Rpb25Db3VudCA9IDAsIC8vIHVwcGVyIGJvdW5kIG9uIG51bWJlciBvZiBqdW5jdGlvbnNcbiAgICAgIGksIG4sXG4gICAgICBwcmV2aW91c0luZGV4LFxuICAgICAgY3VycmVudEluZGV4LFxuICAgICAgbmV4dEluZGV4O1xuXG4gIGZvciAoaSA9IDAsIG4gPSBjb29yZGluYXRlcy5sZW5ndGg7IGkgPCBuOyArK2kpIHtcbiAgICB2aXNpdGVkQnlJbmRleFtpXSA9IGxlZnRCeUluZGV4W2ldID0gcmlnaHRCeUluZGV4W2ldID0gLTE7XG4gIH1cblxuICBmb3IgKGkgPSAwLCBuID0gbGluZXMubGVuZ3RoOyBpIDwgbjsgKytpKSB7XG4gICAgdmFyIGxpbmUgPSBsaW5lc1tpXSxcbiAgICAgICAgbGluZVN0YXJ0ID0gbGluZVswXSxcbiAgICAgICAgbGluZUVuZCA9IGxpbmVbMV07XG4gICAgY3VycmVudEluZGV4ID0gaW5kZXhlc1tsaW5lU3RhcnRdO1xuICAgIG5leHRJbmRleCA9IGluZGV4ZXNbKytsaW5lU3RhcnRdO1xuICAgICsranVuY3Rpb25Db3VudCwganVuY3Rpb25CeUluZGV4W2N1cnJlbnRJbmRleF0gPSAxOyAvLyBzdGFydFxuICAgIHdoaWxlICgrK2xpbmVTdGFydCA8PSBsaW5lRW5kKSB7XG4gICAgICBzZXF1ZW5jZShpLCBwcmV2aW91c0luZGV4ID0gY3VycmVudEluZGV4LCBjdXJyZW50SW5kZXggPSBuZXh0SW5kZXgsIG5leHRJbmRleCA9IGluZGV4ZXNbbGluZVN0YXJ0XSk7XG4gICAgfVxuICAgICsranVuY3Rpb25Db3VudCwganVuY3Rpb25CeUluZGV4W25leHRJbmRleF0gPSAxOyAvLyBlbmRcbiAgfVxuXG4gIGZvciAoaSA9IDAsIG4gPSBjb29yZGluYXRlcy5sZW5ndGg7IGkgPCBuOyArK2kpIHtcbiAgICB2aXNpdGVkQnlJbmRleFtpXSA9IC0xO1xuICB9XG5cbiAgZm9yIChpID0gMCwgbiA9IHJpbmdzLmxlbmd0aDsgaSA8IG47ICsraSkge1xuICAgIHZhciByaW5nID0gcmluZ3NbaV0sXG4gICAgICAgIHJpbmdTdGFydCA9IHJpbmdbMF0gKyAxLFxuICAgICAgICByaW5nRW5kID0gcmluZ1sxXTtcbiAgICBwcmV2aW91c0luZGV4ID0gaW5kZXhlc1tyaW5nRW5kIC0gMV07XG4gICAgY3VycmVudEluZGV4ID0gaW5kZXhlc1tyaW5nU3RhcnQgLSAxXTtcbiAgICBuZXh0SW5kZXggPSBpbmRleGVzW3JpbmdTdGFydF07XG4gICAgc2VxdWVuY2UoaSwgcHJldmlvdXNJbmRleCwgY3VycmVudEluZGV4LCBuZXh0SW5kZXgpO1xuICAgIHdoaWxlICgrK3JpbmdTdGFydCA8PSByaW5nRW5kKSB7XG4gICAgICBzZXF1ZW5jZShpLCBwcmV2aW91c0luZGV4ID0gY3VycmVudEluZGV4LCBjdXJyZW50SW5kZXggPSBuZXh0SW5kZXgsIG5leHRJbmRleCA9IGluZGV4ZXNbcmluZ1N0YXJ0XSk7XG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gc2VxdWVuY2UoaSwgcHJldmlvdXNJbmRleCwgY3VycmVudEluZGV4LCBuZXh0SW5kZXgpIHtcbiAgICBpZiAodmlzaXRlZEJ5SW5kZXhbY3VycmVudEluZGV4XSA9PT0gaSkgcmV0dXJuOyAvLyBpZ25vcmUgc2VsZi1pbnRlcnNlY3Rpb25cbiAgICB2aXNpdGVkQnlJbmRleFtjdXJyZW50SW5kZXhdID0gaTtcbiAgICB2YXIgbGVmdEluZGV4ID0gbGVmdEJ5SW5kZXhbY3VycmVudEluZGV4XTtcbiAgICBpZiAobGVmdEluZGV4ID49IDApIHtcbiAgICAgIHZhciByaWdodEluZGV4ID0gcmlnaHRCeUluZGV4W2N1cnJlbnRJbmRleF07XG4gICAgICBpZiAoKGxlZnRJbmRleCAhPT0gcHJldmlvdXNJbmRleCB8fCByaWdodEluZGV4ICE9PSBuZXh0SW5kZXgpXG4gICAgICAgICYmIChsZWZ0SW5kZXggIT09IG5leHRJbmRleCB8fCByaWdodEluZGV4ICE9PSBwcmV2aW91c0luZGV4KSkge1xuICAgICAgICArK2p1bmN0aW9uQ291bnQsIGp1bmN0aW9uQnlJbmRleFtjdXJyZW50SW5kZXhdID0gMTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgbGVmdEJ5SW5kZXhbY3VycmVudEluZGV4XSA9IHByZXZpb3VzSW5kZXg7XG4gICAgICByaWdodEJ5SW5kZXhbY3VycmVudEluZGV4XSA9IG5leHRJbmRleDtcbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiBpbmRleCgpIHtcbiAgICB2YXIgaW5kZXhCeVBvaW50ID0gaGFzaG1hcChjb29yZGluYXRlcy5sZW5ndGggKiAxLjQsIGhhc2hJbmRleCwgZXF1YWxJbmRleCwgSW50MzJBcnJheSwgLTEsIEludDMyQXJyYXkpLFxuICAgICAgICBpbmRleGVzID0gbmV3IEludDMyQXJyYXkoY29vcmRpbmF0ZXMubGVuZ3RoKTtcblxuICAgIGZvciAodmFyIGkgPSAwLCBuID0gY29vcmRpbmF0ZXMubGVuZ3RoOyBpIDwgbjsgKytpKSB7XG4gICAgICBpbmRleGVzW2ldID0gaW5kZXhCeVBvaW50Lm1heWJlU2V0KGksIGkpO1xuICAgIH1cblxuICAgIHJldHVybiBpbmRleGVzO1xuICB9XG5cbiAgZnVuY3Rpb24gaGFzaEluZGV4KGkpIHtcbiAgICByZXR1cm4gaGFzaFBvaW50KGNvb3JkaW5hdGVzW2ldKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGVxdWFsSW5kZXgoaSwgaikge1xuICAgIHJldHVybiBlcXVhbFBvaW50KGNvb3JkaW5hdGVzW2ldLCBjb29yZGluYXRlc1tqXSk7XG4gIH1cblxuICB2aXNpdGVkQnlJbmRleCA9IGxlZnRCeUluZGV4ID0gcmlnaHRCeUluZGV4ID0gbnVsbDtcblxuICB2YXIganVuY3Rpb25CeVBvaW50ID0gaGFzaHNldChqdW5jdGlvbkNvdW50ICogMS40LCBoYXNoUG9pbnQsIGVxdWFsUG9pbnQpLCBqO1xuXG4gIC8vIENvbnZlcnQgYmFjayB0byBhIHN0YW5kYXJkIGhhc2hzZXQgYnkgcG9pbnQgZm9yIGNhbGxlciBjb252ZW5pZW5jZS5cbiAgZm9yIChpID0gMCwgbiA9IGNvb3JkaW5hdGVzLmxlbmd0aDsgaSA8IG47ICsraSkge1xuICAgIGlmIChqdW5jdGlvbkJ5SW5kZXhbaiA9IGluZGV4ZXNbaV1dKSB7XG4gICAgICBqdW5jdGlvbkJ5UG9pbnQuYWRkKGNvb3JkaW5hdGVzW2pdKTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4ganVuY3Rpb25CeVBvaW50O1xufTtcblxuLy8gR2l2ZW4gYW4gZXh0cmFjdGVkIChwcmUtKXRvcG9sb2d5LCBjdXRzIChvciByb3RhdGVzKSBhcmNzIHNvIHRoYXQgYWxsIHNoYXJlZFxuLy8gcG9pbnQgc2VxdWVuY2VzIGFyZSBpZGVudGlmaWVkLiBUaGUgdG9wb2xvZ3kgY2FuIHRoZW4gYmUgc3Vic2VxdWVudGx5IGRlZHVwZWRcbi8vIHRvIHJlbW92ZSBleGFjdCBkdXBsaWNhdGUgYXJjcy5cbnZhciBjdXQgPSBmdW5jdGlvbih0b3BvbG9neSkge1xuICB2YXIganVuY3Rpb25zID0gam9pbih0b3BvbG9neSksXG4gICAgICBjb29yZGluYXRlcyA9IHRvcG9sb2d5LmNvb3JkaW5hdGVzLFxuICAgICAgbGluZXMgPSB0b3BvbG9neS5saW5lcyxcbiAgICAgIHJpbmdzID0gdG9wb2xvZ3kucmluZ3MsXG4gICAgICBuZXh0LFxuICAgICAgaSwgbjtcblxuICBmb3IgKGkgPSAwLCBuID0gbGluZXMubGVuZ3RoOyBpIDwgbjsgKytpKSB7XG4gICAgdmFyIGxpbmUgPSBsaW5lc1tpXSxcbiAgICAgICAgbGluZU1pZCA9IGxpbmVbMF0sXG4gICAgICAgIGxpbmVFbmQgPSBsaW5lWzFdO1xuICAgIHdoaWxlICgrK2xpbmVNaWQgPCBsaW5lRW5kKSB7XG4gICAgICBpZiAoanVuY3Rpb25zLmhhcyhjb29yZGluYXRlc1tsaW5lTWlkXSkpIHtcbiAgICAgICAgbmV4dCA9IHswOiBsaW5lTWlkLCAxOiBsaW5lWzFdfTtcbiAgICAgICAgbGluZVsxXSA9IGxpbmVNaWQ7XG4gICAgICAgIGxpbmUgPSBsaW5lLm5leHQgPSBuZXh0O1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIGZvciAoaSA9IDAsIG4gPSByaW5ncy5sZW5ndGg7IGkgPCBuOyArK2kpIHtcbiAgICB2YXIgcmluZyA9IHJpbmdzW2ldLFxuICAgICAgICByaW5nU3RhcnQgPSByaW5nWzBdLFxuICAgICAgICByaW5nTWlkID0gcmluZ1N0YXJ0LFxuICAgICAgICByaW5nRW5kID0gcmluZ1sxXSxcbiAgICAgICAgcmluZ0ZpeGVkID0ganVuY3Rpb25zLmhhcyhjb29yZGluYXRlc1tyaW5nU3RhcnRdKTtcbiAgICB3aGlsZSAoKytyaW5nTWlkIDwgcmluZ0VuZCkge1xuICAgICAgaWYgKGp1bmN0aW9ucy5oYXMoY29vcmRpbmF0ZXNbcmluZ01pZF0pKSB7XG4gICAgICAgIGlmIChyaW5nRml4ZWQpIHtcbiAgICAgICAgICBuZXh0ID0gezA6IHJpbmdNaWQsIDE6IHJpbmdbMV19O1xuICAgICAgICAgIHJpbmdbMV0gPSByaW5nTWlkO1xuICAgICAgICAgIHJpbmcgPSByaW5nLm5leHQgPSBuZXh0O1xuICAgICAgICB9IGVsc2UgeyAvLyBGb3IgdGhlIGZpcnN0IGp1bmN0aW9uLCB3ZSBjYW4gcm90YXRlIHJhdGhlciB0aGFuIGN1dC5cbiAgICAgICAgICByb3RhdGVBcnJheShjb29yZGluYXRlcywgcmluZ1N0YXJ0LCByaW5nRW5kLCByaW5nRW5kIC0gcmluZ01pZCk7XG4gICAgICAgICAgY29vcmRpbmF0ZXNbcmluZ0VuZF0gPSBjb29yZGluYXRlc1tyaW5nU3RhcnRdO1xuICAgICAgICAgIHJpbmdGaXhlZCA9IHRydWU7XG4gICAgICAgICAgcmluZ01pZCA9IHJpbmdTdGFydDsgLy8gcmVzdGFydDsgd2UgbWF5IGhhdmUgc2tpcHBlZCBqdW5jdGlvbnNcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIHJldHVybiB0b3BvbG9neTtcbn07XG5cbmZ1bmN0aW9uIHJvdGF0ZUFycmF5KGFycmF5LCBzdGFydCwgZW5kLCBvZmZzZXQpIHtcbiAgcmV2ZXJzZShhcnJheSwgc3RhcnQsIGVuZCk7XG4gIHJldmVyc2UoYXJyYXksIHN0YXJ0LCBzdGFydCArIG9mZnNldCk7XG4gIHJldmVyc2UoYXJyYXksIHN0YXJ0ICsgb2Zmc2V0LCBlbmQpO1xufVxuXG5mdW5jdGlvbiByZXZlcnNlKGFycmF5LCBzdGFydCwgZW5kKSB7XG4gIGZvciAodmFyIG1pZCA9IHN0YXJ0ICsgKChlbmQtLSAtIHN0YXJ0KSA+PiAxKSwgdDsgc3RhcnQgPCBtaWQ7ICsrc3RhcnQsIC0tZW5kKSB7XG4gICAgdCA9IGFycmF5W3N0YXJ0XSwgYXJyYXlbc3RhcnRdID0gYXJyYXlbZW5kXSwgYXJyYXlbZW5kXSA9IHQ7XG4gIH1cbn1cblxuLy8gR2l2ZW4gYSBjdXQgdG9wb2xvZ3ksIGNvbWJpbmVzIGR1cGxpY2F0ZSBhcmNzLlxudmFyIGRlZHVwID0gZnVuY3Rpb24odG9wb2xvZ3kpIHtcbiAgdmFyIGNvb3JkaW5hdGVzID0gdG9wb2xvZ3kuY29vcmRpbmF0ZXMsXG4gICAgICBsaW5lcyA9IHRvcG9sb2d5LmxpbmVzLCBsaW5lLFxuICAgICAgcmluZ3MgPSB0b3BvbG9neS5yaW5ncywgcmluZyxcbiAgICAgIGFyY0NvdW50ID0gbGluZXMubGVuZ3RoICsgcmluZ3MubGVuZ3RoLFxuICAgICAgaSwgbjtcblxuICBkZWxldGUgdG9wb2xvZ3kubGluZXM7XG4gIGRlbGV0ZSB0b3BvbG9neS5yaW5ncztcblxuICAvLyBDb3VudCB0aGUgbnVtYmVyIG9mIChub24tdW5pcXVlKSBhcmNzIHRvIGluaXRpYWxpemUgdGhlIGhhc2htYXAgc2FmZWx5LlxuICBmb3IgKGkgPSAwLCBuID0gbGluZXMubGVuZ3RoOyBpIDwgbjsgKytpKSB7XG4gICAgbGluZSA9IGxpbmVzW2ldOyB3aGlsZSAobGluZSA9IGxpbmUubmV4dCkgKythcmNDb3VudDtcbiAgfVxuICBmb3IgKGkgPSAwLCBuID0gcmluZ3MubGVuZ3RoOyBpIDwgbjsgKytpKSB7XG4gICAgcmluZyA9IHJpbmdzW2ldOyB3aGlsZSAocmluZyA9IHJpbmcubmV4dCkgKythcmNDb3VudDtcbiAgfVxuXG4gIHZhciBhcmNzQnlFbmQgPSBoYXNobWFwKGFyY0NvdW50ICogMiAqIDEuNCwgaGFzaFBvaW50LCBlcXVhbFBvaW50KSxcbiAgICAgIGFyY3MgPSB0b3BvbG9neS5hcmNzID0gW107XG5cbiAgZm9yIChpID0gMCwgbiA9IGxpbmVzLmxlbmd0aDsgaSA8IG47ICsraSkge1xuICAgIGxpbmUgPSBsaW5lc1tpXTtcbiAgICBkbyB7XG4gICAgICBkZWR1cExpbmUobGluZSk7XG4gICAgfSB3aGlsZSAobGluZSA9IGxpbmUubmV4dCk7XG4gIH1cblxuICBmb3IgKGkgPSAwLCBuID0gcmluZ3MubGVuZ3RoOyBpIDwgbjsgKytpKSB7XG4gICAgcmluZyA9IHJpbmdzW2ldO1xuICAgIGlmIChyaW5nLm5leHQpIHsgLy8gYXJjIGlzIG5vIGxvbmdlciBjbG9zZWRcbiAgICAgIGRvIHtcbiAgICAgICAgZGVkdXBMaW5lKHJpbmcpO1xuICAgICAgfSB3aGlsZSAocmluZyA9IHJpbmcubmV4dCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGRlZHVwUmluZyhyaW5nKTtcbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiBkZWR1cExpbmUoYXJjKSB7XG4gICAgdmFyIHN0YXJ0UG9pbnQsXG4gICAgICAgIGVuZFBvaW50LFxuICAgICAgICBzdGFydEFyY3MsIHN0YXJ0QXJjLFxuICAgICAgICBlbmRBcmNzLCBlbmRBcmMsXG4gICAgICAgIGksIG47XG5cbiAgICAvLyBEb2VzIHRoaXMgYXJjIG1hdGNoIGFuIGV4aXN0aW5nIGFyYyBpbiBvcmRlcj9cbiAgICBpZiAoc3RhcnRBcmNzID0gYXJjc0J5RW5kLmdldChzdGFydFBvaW50ID0gY29vcmRpbmF0ZXNbYXJjWzBdXSkpIHtcbiAgICAgIGZvciAoaSA9IDAsIG4gPSBzdGFydEFyY3MubGVuZ3RoOyBpIDwgbjsgKytpKSB7XG4gICAgICAgIHN0YXJ0QXJjID0gc3RhcnRBcmNzW2ldO1xuICAgICAgICBpZiAoZXF1YWxMaW5lKHN0YXJ0QXJjLCBhcmMpKSB7XG4gICAgICAgICAgYXJjWzBdID0gc3RhcnRBcmNbMF07XG4gICAgICAgICAgYXJjWzFdID0gc3RhcnRBcmNbMV07XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gRG9lcyB0aGlzIGFyYyBtYXRjaCBhbiBleGlzdGluZyBhcmMgaW4gcmV2ZXJzZSBvcmRlcj9cbiAgICBpZiAoZW5kQXJjcyA9IGFyY3NCeUVuZC5nZXQoZW5kUG9pbnQgPSBjb29yZGluYXRlc1thcmNbMV1dKSkge1xuICAgICAgZm9yIChpID0gMCwgbiA9IGVuZEFyY3MubGVuZ3RoOyBpIDwgbjsgKytpKSB7XG4gICAgICAgIGVuZEFyYyA9IGVuZEFyY3NbaV07XG4gICAgICAgIGlmIChyZXZlcnNlRXF1YWxMaW5lKGVuZEFyYywgYXJjKSkge1xuICAgICAgICAgIGFyY1sxXSA9IGVuZEFyY1swXTtcbiAgICAgICAgICBhcmNbMF0gPSBlbmRBcmNbMV07XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKHN0YXJ0QXJjcykgc3RhcnRBcmNzLnB1c2goYXJjKTsgZWxzZSBhcmNzQnlFbmQuc2V0KHN0YXJ0UG9pbnQsIFthcmNdKTtcbiAgICBpZiAoZW5kQXJjcykgZW5kQXJjcy5wdXNoKGFyYyk7IGVsc2UgYXJjc0J5RW5kLnNldChlbmRQb2ludCwgW2FyY10pO1xuICAgIGFyY3MucHVzaChhcmMpO1xuICB9XG5cbiAgZnVuY3Rpb24gZGVkdXBSaW5nKGFyYykge1xuICAgIHZhciBlbmRQb2ludCxcbiAgICAgICAgZW5kQXJjcyxcbiAgICAgICAgZW5kQXJjLFxuICAgICAgICBpLCBuO1xuXG4gICAgLy8gRG9lcyB0aGlzIGFyYyBtYXRjaCBhbiBleGlzdGluZyBsaW5lIGluIG9yZGVyLCBvciByZXZlcnNlIG9yZGVyP1xuICAgIC8vIFJpbmdzIGFyZSBjbG9zZWQsIHNvIHRoZWlyIHN0YXJ0IHBvaW50IGFuZCBlbmQgcG9pbnQgaXMgdGhlIHNhbWUuXG4gICAgaWYgKGVuZEFyY3MgPSBhcmNzQnlFbmQuZ2V0KGVuZFBvaW50ID0gY29vcmRpbmF0ZXNbYXJjWzBdXSkpIHtcbiAgICAgIGZvciAoaSA9IDAsIG4gPSBlbmRBcmNzLmxlbmd0aDsgaSA8IG47ICsraSkge1xuICAgICAgICBlbmRBcmMgPSBlbmRBcmNzW2ldO1xuICAgICAgICBpZiAoZXF1YWxSaW5nKGVuZEFyYywgYXJjKSkge1xuICAgICAgICAgIGFyY1swXSA9IGVuZEFyY1swXTtcbiAgICAgICAgICBhcmNbMV0gPSBlbmRBcmNbMV07XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGlmIChyZXZlcnNlRXF1YWxSaW5nKGVuZEFyYywgYXJjKSkge1xuICAgICAgICAgIGFyY1swXSA9IGVuZEFyY1sxXTtcbiAgICAgICAgICBhcmNbMV0gPSBlbmRBcmNbMF07XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gT3RoZXJ3aXNlLCBkb2VzIHRoaXMgYXJjIG1hdGNoIGFuIGV4aXN0aW5nIHJpbmcgaW4gb3JkZXIsIG9yIHJldmVyc2Ugb3JkZXI/XG4gICAgaWYgKGVuZEFyY3MgPSBhcmNzQnlFbmQuZ2V0KGVuZFBvaW50ID0gY29vcmRpbmF0ZXNbYXJjWzBdICsgZmluZE1pbmltdW1PZmZzZXQoYXJjKV0pKSB7XG4gICAgICBmb3IgKGkgPSAwLCBuID0gZW5kQXJjcy5sZW5ndGg7IGkgPCBuOyArK2kpIHtcbiAgICAgICAgZW5kQXJjID0gZW5kQXJjc1tpXTtcbiAgICAgICAgaWYgKGVxdWFsUmluZyhlbmRBcmMsIGFyYykpIHtcbiAgICAgICAgICBhcmNbMF0gPSBlbmRBcmNbMF07XG4gICAgICAgICAgYXJjWzFdID0gZW5kQXJjWzFdO1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBpZiAocmV2ZXJzZUVxdWFsUmluZyhlbmRBcmMsIGFyYykpIHtcbiAgICAgICAgICBhcmNbMF0gPSBlbmRBcmNbMV07XG4gICAgICAgICAgYXJjWzFdID0gZW5kQXJjWzBdO1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIGlmIChlbmRBcmNzKSBlbmRBcmNzLnB1c2goYXJjKTsgZWxzZSBhcmNzQnlFbmQuc2V0KGVuZFBvaW50LCBbYXJjXSk7XG4gICAgYXJjcy5wdXNoKGFyYyk7XG4gIH1cblxuICBmdW5jdGlvbiBlcXVhbExpbmUoYXJjQSwgYXJjQikge1xuICAgIHZhciBpYSA9IGFyY0FbMF0sIGliID0gYXJjQlswXSxcbiAgICAgICAgamEgPSBhcmNBWzFdLCBqYiA9IGFyY0JbMV07XG4gICAgaWYgKGlhIC0gamEgIT09IGliIC0gamIpIHJldHVybiBmYWxzZTtcbiAgICBmb3IgKDsgaWEgPD0gamE7ICsraWEsICsraWIpIGlmICghZXF1YWxQb2ludChjb29yZGluYXRlc1tpYV0sIGNvb3JkaW5hdGVzW2liXSkpIHJldHVybiBmYWxzZTtcbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHJldmVyc2VFcXVhbExpbmUoYXJjQSwgYXJjQikge1xuICAgIHZhciBpYSA9IGFyY0FbMF0sIGliID0gYXJjQlswXSxcbiAgICAgICAgamEgPSBhcmNBWzFdLCBqYiA9IGFyY0JbMV07XG4gICAgaWYgKGlhIC0gamEgIT09IGliIC0gamIpIHJldHVybiBmYWxzZTtcbiAgICBmb3IgKDsgaWEgPD0gamE7ICsraWEsIC0tamIpIGlmICghZXF1YWxQb2ludChjb29yZGluYXRlc1tpYV0sIGNvb3JkaW5hdGVzW2piXSkpIHJldHVybiBmYWxzZTtcbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGVxdWFsUmluZyhhcmNBLCBhcmNCKSB7XG4gICAgdmFyIGlhID0gYXJjQVswXSwgaWIgPSBhcmNCWzBdLFxuICAgICAgICBqYSA9IGFyY0FbMV0sIGpiID0gYXJjQlsxXSxcbiAgICAgICAgbiA9IGphIC0gaWE7XG4gICAgaWYgKG4gIT09IGpiIC0gaWIpIHJldHVybiBmYWxzZTtcbiAgICB2YXIga2EgPSBmaW5kTWluaW11bU9mZnNldChhcmNBKSxcbiAgICAgICAga2IgPSBmaW5kTWluaW11bU9mZnNldChhcmNCKTtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IG47ICsraSkge1xuICAgICAgaWYgKCFlcXVhbFBvaW50KGNvb3JkaW5hdGVzW2lhICsgKGkgKyBrYSkgJSBuXSwgY29vcmRpbmF0ZXNbaWIgKyAoaSArIGtiKSAlIG5dKSkgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHJldmVyc2VFcXVhbFJpbmcoYXJjQSwgYXJjQikge1xuICAgIHZhciBpYSA9IGFyY0FbMF0sIGliID0gYXJjQlswXSxcbiAgICAgICAgamEgPSBhcmNBWzFdLCBqYiA9IGFyY0JbMV0sXG4gICAgICAgIG4gPSBqYSAtIGlhO1xuICAgIGlmIChuICE9PSBqYiAtIGliKSByZXR1cm4gZmFsc2U7XG4gICAgdmFyIGthID0gZmluZE1pbmltdW1PZmZzZXQoYXJjQSksXG4gICAgICAgIGtiID0gbiAtIGZpbmRNaW5pbXVtT2Zmc2V0KGFyY0IpO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbjsgKytpKSB7XG4gICAgICBpZiAoIWVxdWFsUG9pbnQoY29vcmRpbmF0ZXNbaWEgKyAoaSArIGthKSAlIG5dLCBjb29yZGluYXRlc1tqYiAtIChpICsga2IpICUgbl0pKSByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIHJldHVybiB0cnVlO1xuICB9XG5cbiAgLy8gUmluZ3MgYXJlIHJvdGF0ZWQgdG8gYSBjb25zaXN0ZW50LCBidXQgYXJiaXRyYXJ5LCBzdGFydCBwb2ludC5cbiAgLy8gVGhpcyBpcyBuZWNlc3NhcnkgdG8gZGV0ZWN0IHdoZW4gYSByaW5nIGFuZCBhIHJvdGF0ZWQgY29weSBhcmUgZHVwZXMuXG4gIGZ1bmN0aW9uIGZpbmRNaW5pbXVtT2Zmc2V0KGFyYykge1xuICAgIHZhciBzdGFydCA9IGFyY1swXSxcbiAgICAgICAgZW5kID0gYXJjWzFdLFxuICAgICAgICBtaWQgPSBzdGFydCxcbiAgICAgICAgbWluaW11bSA9IG1pZCxcbiAgICAgICAgbWluaW11bVBvaW50ID0gY29vcmRpbmF0ZXNbbWlkXTtcbiAgICB3aGlsZSAoKyttaWQgPCBlbmQpIHtcbiAgICAgIHZhciBwb2ludCA9IGNvb3JkaW5hdGVzW21pZF07XG4gICAgICBpZiAocG9pbnRbMF0gPCBtaW5pbXVtUG9pbnRbMF0gfHwgcG9pbnRbMF0gPT09IG1pbmltdW1Qb2ludFswXSAmJiBwb2ludFsxXSA8IG1pbmltdW1Qb2ludFsxXSkge1xuICAgICAgICBtaW5pbXVtID0gbWlkO1xuICAgICAgICBtaW5pbXVtUG9pbnQgPSBwb2ludDtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIG1pbmltdW0gLSBzdGFydDtcbiAgfVxuXG4gIHJldHVybiB0b3BvbG9neTtcbn07XG5cbi8vIEdpdmVuIGFuIGFycmF5IG9mIGFyY3MgaW4gYWJzb2x1dGUgKGJ1dCBhbHJlYWR5IHF1YW50aXplZCEpIGNvb3JkaW5hdGVzLFxuLy8gY29udmVydHMgdG8gZml4ZWQtcG9pbnQgZGVsdGEgZW5jb2RpbmcuXG4vLyBUaGlzIGlzIGEgZGVzdHJ1Y3RpdmUgb3BlcmF0aW9uIHRoYXQgbW9kaWZpZXMgdGhlIGdpdmVuIGFyY3MhXG52YXIgZGVsdGEgPSBmdW5jdGlvbihhcmNzKSB7XG4gIHZhciBpID0gLTEsXG4gICAgICBuID0gYXJjcy5sZW5ndGg7XG5cbiAgd2hpbGUgKCsraSA8IG4pIHtcbiAgICB2YXIgYXJjID0gYXJjc1tpXSxcbiAgICAgICAgaiA9IDAsXG4gICAgICAgIGsgPSAxLFxuICAgICAgICBtID0gYXJjLmxlbmd0aCxcbiAgICAgICAgcG9pbnQgPSBhcmNbMF0sXG4gICAgICAgIHgwID0gcG9pbnRbMF0sXG4gICAgICAgIHkwID0gcG9pbnRbMV0sXG4gICAgICAgIHgxLFxuICAgICAgICB5MTtcblxuICAgIHdoaWxlICgrK2ogPCBtKSB7XG4gICAgICBwb2ludCA9IGFyY1tqXSwgeDEgPSBwb2ludFswXSwgeTEgPSBwb2ludFsxXTtcbiAgICAgIGlmICh4MSAhPT0geDAgfHwgeTEgIT09IHkwKSBhcmNbaysrXSA9IFt4MSAtIHgwLCB5MSAtIHkwXSwgeDAgPSB4MSwgeTAgPSB5MTtcbiAgICB9XG5cbiAgICBpZiAoayA9PT0gMSkgYXJjW2srK10gPSBbMCwgMF07IC8vIEVhY2ggYXJjIG11c3QgYmUgYW4gYXJyYXkgb2YgdHdvIG9yIG1vcmUgcG9zaXRpb25zLlxuXG4gICAgYXJjLmxlbmd0aCA9IGs7XG4gIH1cblxuICByZXR1cm4gYXJjcztcbn07XG5cbi8vIEV4dHJhY3RzIHRoZSBsaW5lcyBhbmQgcmluZ3MgZnJvbSB0aGUgc3BlY2lmaWVkIGhhc2ggb2YgZ2VvbWV0cnkgb2JqZWN0cy5cbi8vXG4vLyBSZXR1cm5zIGFuIG9iamVjdCB3aXRoIHRocmVlIHByb3BlcnRpZXM6XG4vL1xuLy8gKiBjb29yZGluYXRlcyAtIHNoYXJlZCBidWZmZXIgb2YgW3gsIHldIGNvb3JkaW5hdGVzXG4vLyAqIGxpbmVzIC0gbGluZXMgZXh0cmFjdGVkIGZyb20gdGhlIGhhc2gsIG9mIHRoZSBmb3JtIFtzdGFydCwgZW5kXVxuLy8gKiByaW5ncyAtIHJpbmdzIGV4dHJhY3RlZCBmcm9tIHRoZSBoYXNoLCBvZiB0aGUgZm9ybSBbc3RhcnQsIGVuZF1cbi8vXG4vLyBGb3IgZWFjaCByaW5nIG9yIGxpbmUsIHN0YXJ0IGFuZCBlbmQgcmVwcmVzZW50IGluY2x1c2l2ZSBpbmRleGVzIGludG8gdGhlXG4vLyBjb29yZGluYXRlcyBidWZmZXIuIEZvciByaW5ncyAoYW5kIGNsb3NlZCBsaW5lcyksIGNvb3JkaW5hdGVzW3N0YXJ0XSBlcXVhbHNcbi8vIGNvb3JkaW5hdGVzW2VuZF0uXG4vL1xuLy8gRm9yIGVhY2ggbGluZSBvciBwb2x5Z29uIGdlb21ldHJ5IGluIHRoZSBpbnB1dCBoYXNoLCBpbmNsdWRpbmcgbmVzdGVkXG4vLyBnZW9tZXRyaWVzIGFzIGluIGdlb21ldHJ5IGNvbGxlY3Rpb25zLCB0aGUgYGNvb3JkaW5hdGVzYCBhcnJheSBpcyByZXBsYWNlZFxuLy8gd2l0aCBhbiBlcXVpdmFsZW50IGBhcmNzYCBhcnJheSB0aGF0LCBmb3IgZWFjaCBsaW5lIChmb3IgbGluZSBzdHJpbmdcbi8vIGdlb21ldHJpZXMpIG9yIHJpbmcgKGZvciBwb2x5Z29uIGdlb21ldHJpZXMpLCBwb2ludHMgdG8gb25lIG9mIHRoZSBhYm92ZVxuLy8gbGluZXMgb3IgcmluZ3MuXG52YXIgZXh0cmFjdCA9IGZ1bmN0aW9uKG9iamVjdHMpIHtcbiAgdmFyIGluZGV4ID0gLTEsXG4gICAgICBsaW5lcyA9IFtdLFxuICAgICAgcmluZ3MgPSBbXSxcbiAgICAgIGNvb3JkaW5hdGVzID0gW107XG5cbiAgZnVuY3Rpb24gZXh0cmFjdEdlb21ldHJ5KGdlb21ldHJ5KSB7XG4gICAgaWYgKGdlb21ldHJ5ICYmIGV4dHJhY3RHZW9tZXRyeVR5cGUuaGFzT3duUHJvcGVydHkoZ2VvbWV0cnkudHlwZSkpIGV4dHJhY3RHZW9tZXRyeVR5cGVbZ2VvbWV0cnkudHlwZV0oZ2VvbWV0cnkpO1xuICB9XG5cbiAgdmFyIGV4dHJhY3RHZW9tZXRyeVR5cGUgPSB7XG4gICAgR2VvbWV0cnlDb2xsZWN0aW9uOiBmdW5jdGlvbihvKSB7IG8uZ2VvbWV0cmllcy5mb3JFYWNoKGV4dHJhY3RHZW9tZXRyeSk7IH0sXG4gICAgTGluZVN0cmluZzogZnVuY3Rpb24obykgeyBvLmFyY3MgPSBleHRyYWN0TGluZShvLmFyY3MpOyB9LFxuICAgIE11bHRpTGluZVN0cmluZzogZnVuY3Rpb24obykgeyBvLmFyY3MgPSBvLmFyY3MubWFwKGV4dHJhY3RMaW5lKTsgfSxcbiAgICBQb2x5Z29uOiBmdW5jdGlvbihvKSB7IG8uYXJjcyA9IG8uYXJjcy5tYXAoZXh0cmFjdFJpbmcpOyB9LFxuICAgIE11bHRpUG9seWdvbjogZnVuY3Rpb24obykgeyBvLmFyY3MgPSBvLmFyY3MubWFwKGV4dHJhY3RNdWx0aVJpbmcpOyB9XG4gIH07XG5cbiAgZnVuY3Rpb24gZXh0cmFjdExpbmUobGluZSkge1xuICAgIGZvciAodmFyIGkgPSAwLCBuID0gbGluZS5sZW5ndGg7IGkgPCBuOyArK2kpIGNvb3JkaW5hdGVzWysraW5kZXhdID0gbGluZVtpXTtcbiAgICB2YXIgYXJjID0gezA6IGluZGV4IC0gbiArIDEsIDE6IGluZGV4fTtcbiAgICBsaW5lcy5wdXNoKGFyYyk7XG4gICAgcmV0dXJuIGFyYztcbiAgfVxuXG4gIGZ1bmN0aW9uIGV4dHJhY3RSaW5nKHJpbmcpIHtcbiAgICBmb3IgKHZhciBpID0gMCwgbiA9IHJpbmcubGVuZ3RoOyBpIDwgbjsgKytpKSBjb29yZGluYXRlc1srK2luZGV4XSA9IHJpbmdbaV07XG4gICAgdmFyIGFyYyA9IHswOiBpbmRleCAtIG4gKyAxLCAxOiBpbmRleH07XG4gICAgcmluZ3MucHVzaChhcmMpO1xuICAgIHJldHVybiBhcmM7XG4gIH1cblxuICBmdW5jdGlvbiBleHRyYWN0TXVsdGlSaW5nKHJpbmdzKSB7XG4gICAgcmV0dXJuIHJpbmdzLm1hcChleHRyYWN0UmluZyk7XG4gIH1cblxuICBmb3IgKHZhciBrZXkgaW4gb2JqZWN0cykge1xuICAgIGV4dHJhY3RHZW9tZXRyeShvYmplY3RzW2tleV0pO1xuICB9XG5cbiAgcmV0dXJuIHtcbiAgICB0eXBlOiBcIlRvcG9sb2d5XCIsXG4gICAgY29vcmRpbmF0ZXM6IGNvb3JkaW5hdGVzLFxuICAgIGxpbmVzOiBsaW5lcyxcbiAgICByaW5nczogcmluZ3MsXG4gICAgb2JqZWN0czogb2JqZWN0c1xuICB9O1xufTtcblxuLy8gR2l2ZW4gYSBoYXNoIG9mIEdlb0pTT04gb2JqZWN0cywgcmV0dXJucyBhIGhhc2ggb2YgR2VvSlNPTiBnZW9tZXRyeSBvYmplY3RzLlxuLy8gQW55IG51bGwgaW5wdXQgZ2VvbWV0cnkgb2JqZWN0cyBhcmUgcmVwcmVzZW50ZWQgYXMge3R5cGU6IG51bGx9IGluIHRoZSBvdXRwdXQuXG4vLyBBbnkgZmVhdHVyZS57aWQscHJvcGVydGllcyxiYm94fSBhcmUgdHJhbnNmZXJyZWQgdG8gdGhlIG91dHB1dCBnZW9tZXRyeSBvYmplY3QuXG4vLyBFYWNoIG91dHB1dCBnZW9tZXRyeSBvYmplY3QgaXMgYSBzaGFsbG93IGNvcHkgb2YgdGhlIGlucHV0IChlLmcuLCBwcm9wZXJ0aWVzLCBjb29yZGluYXRlcykhXG52YXIgZ2VvbWV0cnkgPSBmdW5jdGlvbihpbnB1dHMpIHtcbiAgdmFyIG91dHB1dHMgPSB7fSwga2V5O1xuICBmb3IgKGtleSBpbiBpbnB1dHMpIG91dHB1dHNba2V5XSA9IGdlb21pZnlPYmplY3QoaW5wdXRzW2tleV0pO1xuICByZXR1cm4gb3V0cHV0cztcbn07XG5cbmZ1bmN0aW9uIGdlb21pZnlPYmplY3QoaW5wdXQpIHtcbiAgcmV0dXJuIGlucHV0ID09IG51bGwgPyB7dHlwZTogbnVsbH1cbiAgICAgIDogKGlucHV0LnR5cGUgPT09IFwiRmVhdHVyZUNvbGxlY3Rpb25cIiA/IGdlb21pZnlGZWF0dXJlQ29sbGVjdGlvblxuICAgICAgOiBpbnB1dC50eXBlID09PSBcIkZlYXR1cmVcIiA/IGdlb21pZnlGZWF0dXJlXG4gICAgICA6IGdlb21pZnlHZW9tZXRyeSkoaW5wdXQpO1xufVxuXG5mdW5jdGlvbiBnZW9taWZ5RmVhdHVyZUNvbGxlY3Rpb24oaW5wdXQpIHtcbiAgdmFyIG91dHB1dCA9IHt0eXBlOiBcIkdlb21ldHJ5Q29sbGVjdGlvblwiLCBnZW9tZXRyaWVzOiBpbnB1dC5mZWF0dXJlcy5tYXAoZ2VvbWlmeUZlYXR1cmUpfTtcbiAgaWYgKGlucHV0LmJib3ggIT0gbnVsbCkgb3V0cHV0LmJib3ggPSBpbnB1dC5iYm94O1xuICByZXR1cm4gb3V0cHV0O1xufVxuXG5mdW5jdGlvbiBnZW9taWZ5RmVhdHVyZShpbnB1dCkge1xuICB2YXIgb3V0cHV0ID0gZ2VvbWlmeUdlb21ldHJ5KGlucHV0Lmdlb21ldHJ5KSwga2V5OyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG5vLXVudXNlZC12YXJzXG4gIGlmIChpbnB1dC5pZCAhPSBudWxsKSBvdXRwdXQuaWQgPSBpbnB1dC5pZDtcbiAgaWYgKGlucHV0LmJib3ggIT0gbnVsbCkgb3V0cHV0LmJib3ggPSBpbnB1dC5iYm94O1xuICBmb3IgKGtleSBpbiBpbnB1dC5wcm9wZXJ0aWVzKSB7IG91dHB1dC5wcm9wZXJ0aWVzID0gaW5wdXQucHJvcGVydGllczsgYnJlYWs7IH1cbiAgcmV0dXJuIG91dHB1dDtcbn1cblxuZnVuY3Rpb24gZ2VvbWlmeUdlb21ldHJ5KGlucHV0KSB7XG4gIGlmIChpbnB1dCA9PSBudWxsKSByZXR1cm4ge3R5cGU6IG51bGx9O1xuICB2YXIgb3V0cHV0ID0gaW5wdXQudHlwZSA9PT0gXCJHZW9tZXRyeUNvbGxlY3Rpb25cIiA/IHt0eXBlOiBcIkdlb21ldHJ5Q29sbGVjdGlvblwiLCBnZW9tZXRyaWVzOiBpbnB1dC5nZW9tZXRyaWVzLm1hcChnZW9taWZ5R2VvbWV0cnkpfVxuICAgICAgOiBpbnB1dC50eXBlID09PSBcIlBvaW50XCIgfHwgaW5wdXQudHlwZSA9PT0gXCJNdWx0aVBvaW50XCIgPyB7dHlwZTogaW5wdXQudHlwZSwgY29vcmRpbmF0ZXM6IGlucHV0LmNvb3JkaW5hdGVzfVxuICAgICAgOiB7dHlwZTogaW5wdXQudHlwZSwgYXJjczogaW5wdXQuY29vcmRpbmF0ZXN9OyAvLyBUT0RPIENoZWNrIGZvciB1bmtub3duIHR5cGVzP1xuICBpZiAoaW5wdXQuYmJveCAhPSBudWxsKSBvdXRwdXQuYmJveCA9IGlucHV0LmJib3g7XG4gIHJldHVybiBvdXRwdXQ7XG59XG5cbnZhciBwcmVxdWFudGl6ZSA9IGZ1bmN0aW9uKG9iamVjdHMsIGJib3gsIG4pIHtcbiAgdmFyIHgwID0gYmJveFswXSxcbiAgICAgIHkwID0gYmJveFsxXSxcbiAgICAgIHgxID0gYmJveFsyXSxcbiAgICAgIHkxID0gYmJveFszXSxcbiAgICAgIGt4ID0geDEgLSB4MCA/IChuIC0gMSkgLyAoeDEgLSB4MCkgOiAxLFxuICAgICAga3kgPSB5MSAtIHkwID8gKG4gLSAxKSAvICh5MSAtIHkwKSA6IDE7XG5cbiAgZnVuY3Rpb24gcXVhbnRpemVQb2ludChpbnB1dCkge1xuICAgIHJldHVybiBbTWF0aC5yb3VuZCgoaW5wdXRbMF0gLSB4MCkgKiBreCksIE1hdGgucm91bmQoKGlucHV0WzFdIC0geTApICoga3kpXTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHF1YW50aXplUG9pbnRzKGlucHV0LCBtKSB7XG4gICAgdmFyIGkgPSAtMSxcbiAgICAgICAgaiA9IDAsXG4gICAgICAgIG4gPSBpbnB1dC5sZW5ndGgsXG4gICAgICAgIG91dHB1dCA9IG5ldyBBcnJheShuKSwgLy8gcGVzc2ltaXN0aWNcbiAgICAgICAgcGksXG4gICAgICAgIHB4LFxuICAgICAgICBweSxcbiAgICAgICAgeCxcbiAgICAgICAgeTtcblxuICAgIHdoaWxlICgrK2kgPCBuKSB7XG4gICAgICBwaSA9IGlucHV0W2ldO1xuICAgICAgeCA9IE1hdGgucm91bmQoKHBpWzBdIC0geDApICoga3gpO1xuICAgICAgeSA9IE1hdGgucm91bmQoKHBpWzFdIC0geTApICoga3kpO1xuICAgICAgaWYgKHggIT09IHB4IHx8IHkgIT09IHB5KSBvdXRwdXRbaisrXSA9IFtweCA9IHgsIHB5ID0geV07IC8vIG5vbi1jb2luY2lkZW50IHBvaW50c1xuICAgIH1cblxuICAgIG91dHB1dC5sZW5ndGggPSBqO1xuICAgIHdoaWxlIChqIDwgbSkgaiA9IG91dHB1dC5wdXNoKFtvdXRwdXRbMF1bMF0sIG91dHB1dFswXVsxXV0pO1xuICAgIHJldHVybiBvdXRwdXQ7XG4gIH1cblxuICBmdW5jdGlvbiBxdWFudGl6ZUxpbmUoaW5wdXQpIHtcbiAgICByZXR1cm4gcXVhbnRpemVQb2ludHMoaW5wdXQsIDIpO1xuICB9XG5cbiAgZnVuY3Rpb24gcXVhbnRpemVSaW5nKGlucHV0KSB7XG4gICAgcmV0dXJuIHF1YW50aXplUG9pbnRzKGlucHV0LCA0KTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHF1YW50aXplUG9seWdvbihpbnB1dCkge1xuICAgIHJldHVybiBpbnB1dC5tYXAocXVhbnRpemVSaW5nKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHF1YW50aXplR2VvbWV0cnkobykge1xuICAgIGlmIChvICE9IG51bGwgJiYgcXVhbnRpemVHZW9tZXRyeVR5cGUuaGFzT3duUHJvcGVydHkoby50eXBlKSkgcXVhbnRpemVHZW9tZXRyeVR5cGVbby50eXBlXShvKTtcbiAgfVxuXG4gIHZhciBxdWFudGl6ZUdlb21ldHJ5VHlwZSA9IHtcbiAgICBHZW9tZXRyeUNvbGxlY3Rpb246IGZ1bmN0aW9uKG8pIHsgby5nZW9tZXRyaWVzLmZvckVhY2gocXVhbnRpemVHZW9tZXRyeSk7IH0sXG4gICAgUG9pbnQ6IGZ1bmN0aW9uKG8pIHsgby5jb29yZGluYXRlcyA9IHF1YW50aXplUG9pbnQoby5jb29yZGluYXRlcyk7IH0sXG4gICAgTXVsdGlQb2ludDogZnVuY3Rpb24obykgeyBvLmNvb3JkaW5hdGVzID0gby5jb29yZGluYXRlcy5tYXAocXVhbnRpemVQb2ludCk7IH0sXG4gICAgTGluZVN0cmluZzogZnVuY3Rpb24obykgeyBvLmFyY3MgPSBxdWFudGl6ZUxpbmUoby5hcmNzKTsgfSxcbiAgICBNdWx0aUxpbmVTdHJpbmc6IGZ1bmN0aW9uKG8pIHsgby5hcmNzID0gby5hcmNzLm1hcChxdWFudGl6ZUxpbmUpOyB9LFxuICAgIFBvbHlnb246IGZ1bmN0aW9uKG8pIHsgby5hcmNzID0gcXVhbnRpemVQb2x5Z29uKG8uYXJjcyk7IH0sXG4gICAgTXVsdGlQb2x5Z29uOiBmdW5jdGlvbihvKSB7IG8uYXJjcyA9IG8uYXJjcy5tYXAocXVhbnRpemVQb2x5Z29uKTsgfVxuICB9O1xuXG4gIGZvciAodmFyIGtleSBpbiBvYmplY3RzKSB7XG4gICAgcXVhbnRpemVHZW9tZXRyeShvYmplY3RzW2tleV0pO1xuICB9XG5cbiAgcmV0dXJuIHtcbiAgICBzY2FsZTogWzEgLyBreCwgMSAvIGt5XSxcbiAgICB0cmFuc2xhdGU6IFt4MCwgeTBdXG4gIH07XG59O1xuXG4vLyBDb25zdHJ1Y3RzIHRoZSBUb3BvSlNPTiBUb3BvbG9neSBmb3IgdGhlIHNwZWNpZmllZCBoYXNoIG9mIGZlYXR1cmVzLlxuLy8gRWFjaCBvYmplY3QgaW4gdGhlIHNwZWNpZmllZCBoYXNoIG11c3QgYmUgYSBHZW9KU09OIG9iamVjdCxcbi8vIG1lYW5pbmcgRmVhdHVyZUNvbGxlY3Rpb24sIGEgRmVhdHVyZSBvciBhIGdlb21ldHJ5IG9iamVjdC5cbnZhciB0b3BvbG9neSA9IGZ1bmN0aW9uKG9iamVjdHMsIHF1YW50aXphdGlvbikge1xuICB2YXIgYmJveCA9IGJvdW5kcyhvYmplY3RzID0gZ2VvbWV0cnkob2JqZWN0cykpLFxuICAgICAgdHJhbnNmb3JtID0gcXVhbnRpemF0aW9uID4gMCAmJiBiYm94ICYmIHByZXF1YW50aXplKG9iamVjdHMsIGJib3gsIHF1YW50aXphdGlvbiksXG4gICAgICB0b3BvbG9neSA9IGRlZHVwKGN1dChleHRyYWN0KG9iamVjdHMpKSksXG4gICAgICBjb29yZGluYXRlcyA9IHRvcG9sb2d5LmNvb3JkaW5hdGVzLFxuICAgICAgaW5kZXhCeUFyYyA9IGhhc2htYXAodG9wb2xvZ3kuYXJjcy5sZW5ndGggKiAxLjQsIGhhc2hBcmMsIGVxdWFsQXJjKTtcblxuICBvYmplY3RzID0gdG9wb2xvZ3kub2JqZWN0czsgLy8gZm9yIGdhcmJhZ2UgY29sbGVjdGlvblxuICB0b3BvbG9neS5iYm94ID0gYmJveDtcbiAgdG9wb2xvZ3kuYXJjcyA9IHRvcG9sb2d5LmFyY3MubWFwKGZ1bmN0aW9uKGFyYywgaSkge1xuICAgIGluZGV4QnlBcmMuc2V0KGFyYywgaSk7XG4gICAgcmV0dXJuIGNvb3JkaW5hdGVzLnNsaWNlKGFyY1swXSwgYXJjWzFdICsgMSk7XG4gIH0pO1xuXG4gIGRlbGV0ZSB0b3BvbG9neS5jb29yZGluYXRlcztcbiAgY29vcmRpbmF0ZXMgPSBudWxsO1xuXG4gIGZ1bmN0aW9uIGluZGV4R2VvbWV0cnkoZ2VvbWV0cnkkJDEpIHtcbiAgICBpZiAoZ2VvbWV0cnkkJDEgJiYgaW5kZXhHZW9tZXRyeVR5cGUuaGFzT3duUHJvcGVydHkoZ2VvbWV0cnkkJDEudHlwZSkpIGluZGV4R2VvbWV0cnlUeXBlW2dlb21ldHJ5JCQxLnR5cGVdKGdlb21ldHJ5JCQxKTtcbiAgfVxuXG4gIHZhciBpbmRleEdlb21ldHJ5VHlwZSA9IHtcbiAgICBHZW9tZXRyeUNvbGxlY3Rpb246IGZ1bmN0aW9uKG8pIHsgby5nZW9tZXRyaWVzLmZvckVhY2goaW5kZXhHZW9tZXRyeSk7IH0sXG4gICAgTGluZVN0cmluZzogZnVuY3Rpb24obykgeyBvLmFyY3MgPSBpbmRleEFyY3Moby5hcmNzKTsgfSxcbiAgICBNdWx0aUxpbmVTdHJpbmc6IGZ1bmN0aW9uKG8pIHsgby5hcmNzID0gby5hcmNzLm1hcChpbmRleEFyY3MpOyB9LFxuICAgIFBvbHlnb246IGZ1bmN0aW9uKG8pIHsgby5hcmNzID0gby5hcmNzLm1hcChpbmRleEFyY3MpOyB9LFxuICAgIE11bHRpUG9seWdvbjogZnVuY3Rpb24obykgeyBvLmFyY3MgPSBvLmFyY3MubWFwKGluZGV4TXVsdGlBcmNzKTsgfVxuICB9O1xuXG4gIGZ1bmN0aW9uIGluZGV4QXJjcyhhcmMpIHtcbiAgICB2YXIgaW5kZXhlcyA9IFtdO1xuICAgIGRvIHtcbiAgICAgIHZhciBpbmRleCA9IGluZGV4QnlBcmMuZ2V0KGFyYyk7XG4gICAgICBpbmRleGVzLnB1c2goYXJjWzBdIDwgYXJjWzFdID8gaW5kZXggOiB+aW5kZXgpO1xuICAgIH0gd2hpbGUgKGFyYyA9IGFyYy5uZXh0KTtcbiAgICByZXR1cm4gaW5kZXhlcztcbiAgfVxuXG4gIGZ1bmN0aW9uIGluZGV4TXVsdGlBcmNzKGFyY3MpIHtcbiAgICByZXR1cm4gYXJjcy5tYXAoaW5kZXhBcmNzKTtcbiAgfVxuXG4gIGZvciAodmFyIGtleSBpbiBvYmplY3RzKSB7XG4gICAgaW5kZXhHZW9tZXRyeShvYmplY3RzW2tleV0pO1xuICB9XG5cbiAgaWYgKHRyYW5zZm9ybSkge1xuICAgIHRvcG9sb2d5LnRyYW5zZm9ybSA9IHRyYW5zZm9ybTtcbiAgICB0b3BvbG9neS5hcmNzID0gZGVsdGEodG9wb2xvZ3kuYXJjcyk7XG4gIH1cblxuICByZXR1cm4gdG9wb2xvZ3k7XG59O1xuXG5mdW5jdGlvbiBoYXNoQXJjKGFyYykge1xuICB2YXIgaSA9IGFyY1swXSwgaiA9IGFyY1sxXSwgdDtcbiAgaWYgKGogPCBpKSB0ID0gaSwgaSA9IGosIGogPSB0O1xuICByZXR1cm4gaSArIDMxICogajtcbn1cblxuZnVuY3Rpb24gZXF1YWxBcmMoYXJjQSwgYXJjQikge1xuICB2YXIgaWEgPSBhcmNBWzBdLCBqYSA9IGFyY0FbMV0sXG4gICAgICBpYiA9IGFyY0JbMF0sIGpiID0gYXJjQlsxXSwgdDtcbiAgaWYgKGphIDwgaWEpIHQgPSBpYSwgaWEgPSBqYSwgamEgPSB0O1xuICBpZiAoamIgPCBpYikgdCA9IGliLCBpYiA9IGpiLCBqYiA9IHQ7XG4gIHJldHVybiBpYSA9PT0gaWIgJiYgamEgPT09IGpiO1xufVxuXG5leHBvcnRzLnRvcG9sb2d5ID0gdG9wb2xvZ3k7XG5cbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCAnX19lc01vZHVsZScsIHsgdmFsdWU6IHRydWUgfSk7XG5cbn0pKSk7XG4iLCIvLyBodHRwczovL2dpdGh1Yi5jb20vdG9wb2pzb24vdG9wb2pzb24tc2ltcGxpZnkgVmVyc2lvbiAzLjAuMi4gQ29weXJpZ2h0IDIwMTcgTWlrZSBCb3N0b2NrLlxuKGZ1bmN0aW9uIChnbG9iYWwsIGZhY3RvcnkpIHtcblx0dHlwZW9mIGV4cG9ydHMgPT09ICdvYmplY3QnICYmIHR5cGVvZiBtb2R1bGUgIT09ICd1bmRlZmluZWQnID8gZmFjdG9yeShleHBvcnRzLCByZXF1aXJlKCd0b3BvanNvbi1jbGllbnQnKSkgOlxuXHR0eXBlb2YgZGVmaW5lID09PSAnZnVuY3Rpb24nICYmIGRlZmluZS5hbWQgPyBkZWZpbmUoWydleHBvcnRzJywgJ3RvcG9qc29uLWNsaWVudCddLCBmYWN0b3J5KSA6XG5cdChmYWN0b3J5KChnbG9iYWwudG9wb2pzb24gPSBnbG9iYWwudG9wb2pzb24gfHwge30pLGdsb2JhbC50b3BvanNvbikpO1xufSh0aGlzLCAoZnVuY3Rpb24gKGV4cG9ydHMsdG9wb2pzb25DbGllbnQpIHsgJ3VzZSBzdHJpY3QnO1xuXG52YXIgcHJ1bmUgPSBmdW5jdGlvbih0b3BvbG9neSkge1xuICB2YXIgb2xkT2JqZWN0cyA9IHRvcG9sb2d5Lm9iamVjdHMsXG4gICAgICBuZXdPYmplY3RzID0ge30sXG4gICAgICBvbGRBcmNzID0gdG9wb2xvZ3kuYXJjcyxcbiAgICAgIG9sZEFyY3NMZW5ndGggPSBvbGRBcmNzLmxlbmd0aCxcbiAgICAgIG9sZEluZGV4ID0gLTEsXG4gICAgICBuZXdJbmRleEJ5T2xkSW5kZXggPSBuZXcgQXJyYXkob2xkQXJjc0xlbmd0aCksXG4gICAgICBuZXdBcmNzTGVuZ3RoID0gMCxcbiAgICAgIG5ld0FyY3MsXG4gICAgICBuZXdJbmRleCA9IC0xLFxuICAgICAga2V5O1xuXG4gIGZ1bmN0aW9uIHNjYW5HZW9tZXRyeShpbnB1dCkge1xuICAgIHN3aXRjaCAoaW5wdXQudHlwZSkge1xuICAgICAgY2FzZSBcIkdlb21ldHJ5Q29sbGVjdGlvblwiOiBpbnB1dC5nZW9tZXRyaWVzLmZvckVhY2goc2Nhbkdlb21ldHJ5KTsgYnJlYWs7XG4gICAgICBjYXNlIFwiTGluZVN0cmluZ1wiOiBzY2FuQXJjcyhpbnB1dC5hcmNzKTsgYnJlYWs7XG4gICAgICBjYXNlIFwiTXVsdGlMaW5lU3RyaW5nXCI6IGlucHV0LmFyY3MuZm9yRWFjaChzY2FuQXJjcyk7IGJyZWFrO1xuICAgICAgY2FzZSBcIlBvbHlnb25cIjogaW5wdXQuYXJjcy5mb3JFYWNoKHNjYW5BcmNzKTsgYnJlYWs7XG4gICAgICBjYXNlIFwiTXVsdGlQb2x5Z29uXCI6IGlucHV0LmFyY3MuZm9yRWFjaChzY2FuTXVsdGlBcmNzKTsgYnJlYWs7XG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gc2NhbkFyYyhpbmRleCkge1xuICAgIGlmIChpbmRleCA8IDApIGluZGV4ID0gfmluZGV4O1xuICAgIGlmICghbmV3SW5kZXhCeU9sZEluZGV4W2luZGV4XSkgbmV3SW5kZXhCeU9sZEluZGV4W2luZGV4XSA9IDEsICsrbmV3QXJjc0xlbmd0aDtcbiAgfVxuXG4gIGZ1bmN0aW9uIHNjYW5BcmNzKGFyY3MpIHtcbiAgICBhcmNzLmZvckVhY2goc2NhbkFyYyk7XG4gIH1cblxuICBmdW5jdGlvbiBzY2FuTXVsdGlBcmNzKGFyY3MpIHtcbiAgICBhcmNzLmZvckVhY2goc2NhbkFyY3MpO1xuICB9XG5cbiAgZnVuY3Rpb24gcmVpbmRleEdlb21ldHJ5KGlucHV0KSB7XG4gICAgdmFyIG91dHB1dDtcbiAgICBzd2l0Y2ggKGlucHV0LnR5cGUpIHtcbiAgICAgIGNhc2UgXCJHZW9tZXRyeUNvbGxlY3Rpb25cIjogb3V0cHV0ID0ge3R5cGU6IFwiR2VvbWV0cnlDb2xsZWN0aW9uXCIsIGdlb21ldHJpZXM6IGlucHV0Lmdlb21ldHJpZXMubWFwKHJlaW5kZXhHZW9tZXRyeSl9OyBicmVhaztcbiAgICAgIGNhc2UgXCJMaW5lU3RyaW5nXCI6IG91dHB1dCA9IHt0eXBlOiBcIkxpbmVTdHJpbmdcIiwgYXJjczogcmVpbmRleEFyY3MoaW5wdXQuYXJjcyl9OyBicmVhaztcbiAgICAgIGNhc2UgXCJNdWx0aUxpbmVTdHJpbmdcIjogb3V0cHV0ID0ge3R5cGU6IFwiTXVsdGlMaW5lU3RyaW5nXCIsIGFyY3M6IGlucHV0LmFyY3MubWFwKHJlaW5kZXhBcmNzKX07IGJyZWFrO1xuICAgICAgY2FzZSBcIlBvbHlnb25cIjogb3V0cHV0ID0ge3R5cGU6IFwiUG9seWdvblwiLCBhcmNzOiBpbnB1dC5hcmNzLm1hcChyZWluZGV4QXJjcyl9OyBicmVhaztcbiAgICAgIGNhc2UgXCJNdWx0aVBvbHlnb25cIjogb3V0cHV0ID0ge3R5cGU6IFwiTXVsdGlQb2x5Z29uXCIsIGFyY3M6IGlucHV0LmFyY3MubWFwKHJlaW5kZXhNdWx0aUFyY3MpfTsgYnJlYWs7XG4gICAgICBkZWZhdWx0OiByZXR1cm4gaW5wdXQ7XG4gICAgfVxuICAgIGlmIChpbnB1dC5pZCAhPSBudWxsKSBvdXRwdXQuaWQgPSBpbnB1dC5pZDtcbiAgICBpZiAoaW5wdXQuYmJveCAhPSBudWxsKSBvdXRwdXQuYmJveCA9IGlucHV0LmJib3g7XG4gICAgaWYgKGlucHV0LnByb3BlcnRpZXMgIT0gbnVsbCkgb3V0cHV0LnByb3BlcnRpZXMgPSBpbnB1dC5wcm9wZXJ0aWVzO1xuICAgIHJldHVybiBvdXRwdXQ7XG4gIH1cblxuICBmdW5jdGlvbiByZWluZGV4QXJjKG9sZEluZGV4KSB7XG4gICAgcmV0dXJuIG9sZEluZGV4IDwgMCA/IH5uZXdJbmRleEJ5T2xkSW5kZXhbfm9sZEluZGV4XSA6IG5ld0luZGV4QnlPbGRJbmRleFtvbGRJbmRleF07XG4gIH1cblxuICBmdW5jdGlvbiByZWluZGV4QXJjcyhhcmNzKSB7XG4gICAgcmV0dXJuIGFyY3MubWFwKHJlaW5kZXhBcmMpO1xuICB9XG5cbiAgZnVuY3Rpb24gcmVpbmRleE11bHRpQXJjcyhhcmNzKSB7XG4gICAgcmV0dXJuIGFyY3MubWFwKHJlaW5kZXhBcmNzKTtcbiAgfVxuXG4gIGZvciAoa2V5IGluIG9sZE9iamVjdHMpIHtcbiAgICBzY2FuR2VvbWV0cnkob2xkT2JqZWN0c1trZXldKTtcbiAgfVxuXG4gIG5ld0FyY3MgPSBuZXcgQXJyYXkobmV3QXJjc0xlbmd0aCk7XG5cbiAgd2hpbGUgKCsrb2xkSW5kZXggPCBvbGRBcmNzTGVuZ3RoKSB7XG4gICAgaWYgKG5ld0luZGV4QnlPbGRJbmRleFtvbGRJbmRleF0pIHtcbiAgICAgIG5ld0luZGV4QnlPbGRJbmRleFtvbGRJbmRleF0gPSArK25ld0luZGV4O1xuICAgICAgbmV3QXJjc1tuZXdJbmRleF0gPSBvbGRBcmNzW29sZEluZGV4XTtcbiAgICB9XG4gIH1cblxuICBmb3IgKGtleSBpbiBvbGRPYmplY3RzKSB7XG4gICAgbmV3T2JqZWN0c1trZXldID0gcmVpbmRleEdlb21ldHJ5KG9sZE9iamVjdHNba2V5XSk7XG4gIH1cblxuICByZXR1cm4ge1xuICAgIHR5cGU6IFwiVG9wb2xvZ3lcIixcbiAgICBiYm94OiB0b3BvbG9neS5iYm94LFxuICAgIHRyYW5zZm9ybTogdG9wb2xvZ3kudHJhbnNmb3JtLFxuICAgIG9iamVjdHM6IG5ld09iamVjdHMsXG4gICAgYXJjczogbmV3QXJjc1xuICB9O1xufTtcblxudmFyIGZpbHRlciA9IGZ1bmN0aW9uKHRvcG9sb2d5LCBmaWx0ZXIpIHtcbiAgdmFyIG9sZE9iamVjdHMgPSB0b3BvbG9neS5vYmplY3RzLFxuICAgICAgbmV3T2JqZWN0cyA9IHt9LFxuICAgICAga2V5O1xuXG4gIGlmIChmaWx0ZXIgPT0gbnVsbCkgZmlsdGVyID0gZmlsdGVyVHJ1ZTtcblxuICBmdW5jdGlvbiBmaWx0ZXJHZW9tZXRyeShpbnB1dCkge1xuICAgIHZhciBvdXRwdXQsIGFyY3M7XG4gICAgc3dpdGNoIChpbnB1dC50eXBlKSB7XG4gICAgICBjYXNlIFwiUG9seWdvblwiOiB7XG4gICAgICAgIGFyY3MgPSBmaWx0ZXJSaW5ncyhpbnB1dC5hcmNzKTtcbiAgICAgICAgb3V0cHV0ID0gYXJjcyA/IHt0eXBlOiBcIlBvbHlnb25cIiwgYXJjczogYXJjc30gOiB7dHlwZTogbnVsbH07XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgICAgY2FzZSBcIk11bHRpUG9seWdvblwiOiB7XG4gICAgICAgIGFyY3MgPSBpbnB1dC5hcmNzLm1hcChmaWx0ZXJSaW5ncykuZmlsdGVyKGZpbHRlcklkZW50aXR5KTtcbiAgICAgICAgb3V0cHV0ID0gYXJjcy5sZW5ndGggPyB7dHlwZTogXCJNdWx0aVBvbHlnb25cIiwgYXJjczogYXJjc30gOiB7dHlwZTogbnVsbH07XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgICAgY2FzZSBcIkdlb21ldHJ5Q29sbGVjdGlvblwiOiB7XG4gICAgICAgIGFyY3MgPSBpbnB1dC5nZW9tZXRyaWVzLm1hcChmaWx0ZXJHZW9tZXRyeSkuZmlsdGVyKGZpbHRlck5vdE51bGwpO1xuICAgICAgICBvdXRwdXQgPSBhcmNzLmxlbmd0aCA/IHt0eXBlOiBcIkdlb21ldHJ5Q29sbGVjdGlvblwiLCBnZW9tZXRyaWVzOiBhcmNzfSA6IHt0eXBlOiBudWxsfTtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgICBkZWZhdWx0OiByZXR1cm4gaW5wdXQ7XG4gICAgfVxuICAgIGlmIChpbnB1dC5pZCAhPSBudWxsKSBvdXRwdXQuaWQgPSBpbnB1dC5pZDtcbiAgICBpZiAoaW5wdXQuYmJveCAhPSBudWxsKSBvdXRwdXQuYmJveCA9IGlucHV0LmJib3g7XG4gICAgaWYgKGlucHV0LnByb3BlcnRpZXMgIT0gbnVsbCkgb3V0cHV0LnByb3BlcnRpZXMgPSBpbnB1dC5wcm9wZXJ0aWVzO1xuICAgIHJldHVybiBvdXRwdXQ7XG4gIH1cblxuICBmdW5jdGlvbiBmaWx0ZXJSaW5ncyhhcmNzKSB7XG4gICAgcmV0dXJuIGFyY3MubGVuZ3RoICYmIGZpbHRlckV4dGVyaW9yUmluZyhhcmNzWzBdKSAvLyBpZiB0aGUgZXh0ZXJpb3IgaXMgc21hbGwsIGlnbm9yZSBhbnkgaG9sZXNcbiAgICAgICAgPyBbYXJjc1swXV0uY29uY2F0KGFyY3Muc2xpY2UoMSkuZmlsdGVyKGZpbHRlckludGVyaW9yUmluZykpXG4gICAgICAgIDogbnVsbDtcbiAgfVxuXG4gIGZ1bmN0aW9uIGZpbHRlckV4dGVyaW9yUmluZyhyaW5nKSB7XG4gICAgcmV0dXJuIGZpbHRlcihyaW5nLCBmYWxzZSk7XG4gIH1cblxuICBmdW5jdGlvbiBmaWx0ZXJJbnRlcmlvclJpbmcocmluZykge1xuICAgIHJldHVybiBmaWx0ZXIocmluZywgdHJ1ZSk7XG4gIH1cblxuICBmb3IgKGtleSBpbiBvbGRPYmplY3RzKSB7XG4gICAgbmV3T2JqZWN0c1trZXldID0gZmlsdGVyR2VvbWV0cnkob2xkT2JqZWN0c1trZXldKTtcbiAgfVxuXG4gIHJldHVybiBwcnVuZSh7XG4gICAgdHlwZTogXCJUb3BvbG9neVwiLFxuICAgIGJib3g6IHRvcG9sb2d5LmJib3gsXG4gICAgdHJhbnNmb3JtOiB0b3BvbG9neS50cmFuc2Zvcm0sXG4gICAgb2JqZWN0czogbmV3T2JqZWN0cyxcbiAgICBhcmNzOiB0b3BvbG9neS5hcmNzXG4gIH0pO1xufTtcblxuZnVuY3Rpb24gZmlsdGVyVHJ1ZSgpIHtcbiAgcmV0dXJuIHRydWU7XG59XG5cbmZ1bmN0aW9uIGZpbHRlcklkZW50aXR5KHgpIHtcbiAgcmV0dXJuIHg7XG59XG5cbmZ1bmN0aW9uIGZpbHRlck5vdE51bGwoZ2VvbWV0cnkpIHtcbiAgcmV0dXJuIGdlb21ldHJ5LnR5cGUgIT0gbnVsbDtcbn1cblxudmFyIGZpbHRlckF0dGFjaGVkID0gZnVuY3Rpb24odG9wb2xvZ3kpIHtcbiAgdmFyIG93bmVyQnlBcmMgPSBuZXcgQXJyYXkodG9wb2xvZ3kuYXJjcy5sZW5ndGgpLCAvLyBhcmMgaW5kZXggLT4gaW5kZXggb2YgdW5pcXVlIGFzc29jaWF0ZWQgcmluZywgb3IgLTEgaWYgdXNlZCBieSBtdWx0aXBsZSByaW5nc1xuICAgICAgb3duZXJJbmRleCA9IDAsXG4gICAgICBrZXk7XG5cbiAgZnVuY3Rpb24gdGVzdEdlb21ldHJ5KG8pIHtcbiAgICBzd2l0Y2ggKG8udHlwZSkge1xuICAgICAgY2FzZSBcIkdlb21ldHJ5Q29sbGVjdGlvblwiOiBvLmdlb21ldHJpZXMuZm9yRWFjaCh0ZXN0R2VvbWV0cnkpOyBicmVhaztcbiAgICAgIGNhc2UgXCJQb2x5Z29uXCI6IHRlc3RBcmNzKG8uYXJjcyk7IGJyZWFrO1xuICAgICAgY2FzZSBcIk11bHRpUG9seWdvblwiOiBvLmFyY3MuZm9yRWFjaCh0ZXN0QXJjcyk7IGJyZWFrO1xuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIHRlc3RBcmNzKGFyY3MpIHtcbiAgICBmb3IgKHZhciBpID0gMCwgbiA9IGFyY3MubGVuZ3RoOyBpIDwgbjsgKytpLCArK293bmVySW5kZXgpIHtcbiAgICAgIGZvciAodmFyIHJpbmcgPSBhcmNzW2ldLCBqID0gMCwgbSA9IHJpbmcubGVuZ3RoOyBqIDwgbTsgKytqKSB7XG4gICAgICAgIHZhciBhcmMgPSByaW5nW2pdO1xuICAgICAgICBpZiAoYXJjIDwgMCkgYXJjID0gfmFyYztcbiAgICAgICAgdmFyIG93bmVyID0gb3duZXJCeUFyY1thcmNdO1xuICAgICAgICBpZiAob3duZXIgPT0gbnVsbCkgb3duZXJCeUFyY1thcmNdID0gb3duZXJJbmRleDtcbiAgICAgICAgZWxzZSBpZiAob3duZXIgIT09IG93bmVySW5kZXgpIG93bmVyQnlBcmNbYXJjXSA9IC0xO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIGZvciAoa2V5IGluIHRvcG9sb2d5Lm9iamVjdHMpIHtcbiAgICB0ZXN0R2VvbWV0cnkodG9wb2xvZ3kub2JqZWN0c1trZXldKTtcbiAgfVxuXG4gIHJldHVybiBmdW5jdGlvbihyaW5nKSB7XG4gICAgZm9yICh2YXIgaiA9IDAsIG0gPSByaW5nLmxlbmd0aCwgYXJjOyBqIDwgbTsgKytqKSB7XG4gICAgICBpZiAob3duZXJCeUFyY1soYXJjID0gcmluZ1tqXSkgPCAwID8gfmFyYyA6IGFyY10gPT09IC0xKSB7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gZmFsc2U7XG4gIH07XG59O1xuXG5mdW5jdGlvbiBwbGFuYXJUcmlhbmdsZUFyZWEodHJpYW5nbGUpIHtcbiAgdmFyIGEgPSB0cmlhbmdsZVswXSwgYiA9IHRyaWFuZ2xlWzFdLCBjID0gdHJpYW5nbGVbMl07XG4gIHJldHVybiBNYXRoLmFicygoYVswXSAtIGNbMF0pICogKGJbMV0gLSBhWzFdKSAtIChhWzBdIC0gYlswXSkgKiAoY1sxXSAtIGFbMV0pKSAvIDI7XG59XG5cbmZ1bmN0aW9uIHBsYW5hclJpbmdBcmVhKHJpbmcpIHtcbiAgdmFyIGkgPSAtMSwgbiA9IHJpbmcubGVuZ3RoLCBhLCBiID0gcmluZ1tuIC0gMV0sIGFyZWEgPSAwO1xuICB3aGlsZSAoKytpIDwgbikgYSA9IGIsIGIgPSByaW5nW2ldLCBhcmVhICs9IGFbMF0gKiBiWzFdIC0gYVsxXSAqIGJbMF07XG4gIHJldHVybiBNYXRoLmFicyhhcmVhKSAvIDI7XG59XG5cbnZhciBmaWx0ZXJXZWlnaHQgPSBmdW5jdGlvbih0b3BvbG9neSwgbWluV2VpZ2h0LCB3ZWlnaHQpIHtcbiAgbWluV2VpZ2h0ID0gbWluV2VpZ2h0ID09IG51bGwgPyBOdW1iZXIuTUlOX1ZBTFVFIDogK21pbldlaWdodDtcblxuICBpZiAod2VpZ2h0ID09IG51bGwpIHdlaWdodCA9IHBsYW5hclJpbmdBcmVhO1xuXG4gIHJldHVybiBmdW5jdGlvbihyaW5nLCBpbnRlcmlvcikge1xuICAgIHJldHVybiB3ZWlnaHQodG9wb2pzb25DbGllbnQuZmVhdHVyZSh0b3BvbG9neSwge3R5cGU6IFwiUG9seWdvblwiLCBhcmNzOiBbcmluZ119KS5nZW9tZXRyeS5jb29yZGluYXRlc1swXSwgaW50ZXJpb3IpID49IG1pbldlaWdodDtcbiAgfTtcbn07XG5cbnZhciBmaWx0ZXJBdHRhY2hlZFdlaWdodCA9IGZ1bmN0aW9uKHRvcG9sb2d5LCBtaW5XZWlnaHQsIHdlaWdodCkge1xuICB2YXIgYSA9IGZpbHRlckF0dGFjaGVkKHRvcG9sb2d5KSxcbiAgICAgIHcgPSBmaWx0ZXJXZWlnaHQodG9wb2xvZ3ksIG1pbldlaWdodCwgd2VpZ2h0KTtcbiAgcmV0dXJuIGZ1bmN0aW9uKHJpbmcsIGludGVyaW9yKSB7XG4gICAgcmV0dXJuIGEocmluZywgaW50ZXJpb3IpIHx8IHcocmluZywgaW50ZXJpb3IpO1xuICB9O1xufTtcblxuZnVuY3Rpb24gY29tcGFyZShhLCBiKSB7XG4gIHJldHVybiBhWzFdWzJdIC0gYlsxXVsyXTtcbn1cblxudmFyIG5ld0hlYXAgPSBmdW5jdGlvbigpIHtcbiAgdmFyIGhlYXAgPSB7fSxcbiAgICAgIGFycmF5ID0gW10sXG4gICAgICBzaXplID0gMDtcblxuICBoZWFwLnB1c2ggPSBmdW5jdGlvbihvYmplY3QpIHtcbiAgICB1cChhcnJheVtvYmplY3QuXyA9IHNpemVdID0gb2JqZWN0LCBzaXplKyspO1xuICAgIHJldHVybiBzaXplO1xuICB9O1xuXG4gIGhlYXAucG9wID0gZnVuY3Rpb24oKSB7XG4gICAgaWYgKHNpemUgPD0gMCkgcmV0dXJuO1xuICAgIHZhciByZW1vdmVkID0gYXJyYXlbMF0sIG9iamVjdDtcbiAgICBpZiAoLS1zaXplID4gMCkgb2JqZWN0ID0gYXJyYXlbc2l6ZV0sIGRvd24oYXJyYXlbb2JqZWN0Ll8gPSAwXSA9IG9iamVjdCwgMCk7XG4gICAgcmV0dXJuIHJlbW92ZWQ7XG4gIH07XG5cbiAgaGVhcC5yZW1vdmUgPSBmdW5jdGlvbihyZW1vdmVkKSB7XG4gICAgdmFyIGkgPSByZW1vdmVkLl8sIG9iamVjdDtcbiAgICBpZiAoYXJyYXlbaV0gIT09IHJlbW92ZWQpIHJldHVybjsgLy8gaW52YWxpZCByZXF1ZXN0XG4gICAgaWYgKGkgIT09IC0tc2l6ZSkgb2JqZWN0ID0gYXJyYXlbc2l6ZV0sIChjb21wYXJlKG9iamVjdCwgcmVtb3ZlZCkgPCAwID8gdXAgOiBkb3duKShhcnJheVtvYmplY3QuXyA9IGldID0gb2JqZWN0LCBpKTtcbiAgICByZXR1cm4gaTtcbiAgfTtcblxuICBmdW5jdGlvbiB1cChvYmplY3QsIGkpIHtcbiAgICB3aGlsZSAoaSA+IDApIHtcbiAgICAgIHZhciBqID0gKChpICsgMSkgPj4gMSkgLSAxLFxuICAgICAgICAgIHBhcmVudCA9IGFycmF5W2pdO1xuICAgICAgaWYgKGNvbXBhcmUob2JqZWN0LCBwYXJlbnQpID49IDApIGJyZWFrO1xuICAgICAgYXJyYXlbcGFyZW50Ll8gPSBpXSA9IHBhcmVudDtcbiAgICAgIGFycmF5W29iamVjdC5fID0gaSA9IGpdID0gb2JqZWN0O1xuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIGRvd24ob2JqZWN0LCBpKSB7XG4gICAgd2hpbGUgKHRydWUpIHtcbiAgICAgIHZhciByID0gKGkgKyAxKSA8PCAxLFxuICAgICAgICAgIGwgPSByIC0gMSxcbiAgICAgICAgICBqID0gaSxcbiAgICAgICAgICBjaGlsZCA9IGFycmF5W2pdO1xuICAgICAgaWYgKGwgPCBzaXplICYmIGNvbXBhcmUoYXJyYXlbbF0sIGNoaWxkKSA8IDApIGNoaWxkID0gYXJyYXlbaiA9IGxdO1xuICAgICAgaWYgKHIgPCBzaXplICYmIGNvbXBhcmUoYXJyYXlbcl0sIGNoaWxkKSA8IDApIGNoaWxkID0gYXJyYXlbaiA9IHJdO1xuICAgICAgaWYgKGogPT09IGkpIGJyZWFrO1xuICAgICAgYXJyYXlbY2hpbGQuXyA9IGldID0gY2hpbGQ7XG4gICAgICBhcnJheVtvYmplY3QuXyA9IGkgPSBqXSA9IG9iamVjdDtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gaGVhcDtcbn07XG5cbmZ1bmN0aW9uIGNvcHkocG9pbnQpIHtcbiAgcmV0dXJuIFtwb2ludFswXSwgcG9pbnRbMV0sIDBdO1xufVxuXG52YXIgcHJlc2ltcGxpZnkgPSBmdW5jdGlvbih0b3BvbG9neSwgd2VpZ2h0KSB7XG4gIHZhciBwb2ludCA9IHRvcG9sb2d5LnRyYW5zZm9ybSA/IHRvcG9qc29uQ2xpZW50LnRyYW5zZm9ybSh0b3BvbG9neS50cmFuc2Zvcm0pIDogY29weSxcbiAgICAgIGhlYXAgPSBuZXdIZWFwKCk7XG5cbiAgaWYgKHdlaWdodCA9PSBudWxsKSB3ZWlnaHQgPSBwbGFuYXJUcmlhbmdsZUFyZWE7XG5cbiAgdmFyIGFyY3MgPSB0b3BvbG9neS5hcmNzLm1hcChmdW5jdGlvbihhcmMpIHtcbiAgICB2YXIgdHJpYW5nbGVzID0gW10sXG4gICAgICAgIG1heFdlaWdodCA9IDAsXG4gICAgICAgIHRyaWFuZ2xlLFxuICAgICAgICBpLFxuICAgICAgICBuO1xuXG4gICAgYXJjID0gYXJjLm1hcChwb2ludCk7XG5cbiAgICBmb3IgKGkgPSAxLCBuID0gYXJjLmxlbmd0aCAtIDE7IGkgPCBuOyArK2kpIHtcbiAgICAgIHRyaWFuZ2xlID0gW2FyY1tpIC0gMV0sIGFyY1tpXSwgYXJjW2kgKyAxXV07XG4gICAgICB0cmlhbmdsZVsxXVsyXSA9IHdlaWdodCh0cmlhbmdsZSk7XG4gICAgICB0cmlhbmdsZXMucHVzaCh0cmlhbmdsZSk7XG4gICAgICBoZWFwLnB1c2godHJpYW5nbGUpO1xuICAgIH1cblxuICAgIC8vIEFsd2F5cyBrZWVwIHRoZSBhcmMgZW5kcG9pbnRzIVxuICAgIGFyY1swXVsyXSA9IGFyY1tuXVsyXSA9IEluZmluaXR5O1xuXG4gICAgZm9yIChpID0gMCwgbiA9IHRyaWFuZ2xlcy5sZW5ndGg7IGkgPCBuOyArK2kpIHtcbiAgICAgIHRyaWFuZ2xlID0gdHJpYW5nbGVzW2ldO1xuICAgICAgdHJpYW5nbGUucHJldmlvdXMgPSB0cmlhbmdsZXNbaSAtIDFdO1xuICAgICAgdHJpYW5nbGUubmV4dCA9IHRyaWFuZ2xlc1tpICsgMV07XG4gICAgfVxuXG4gICAgd2hpbGUgKHRyaWFuZ2xlID0gaGVhcC5wb3AoKSkge1xuICAgICAgdmFyIHByZXZpb3VzID0gdHJpYW5nbGUucHJldmlvdXMsXG4gICAgICAgICAgbmV4dCA9IHRyaWFuZ2xlLm5leHQ7XG5cbiAgICAgIC8vIElmIHRoZSB3ZWlnaHQgb2YgdGhlIGN1cnJlbnQgcG9pbnQgaXMgbGVzcyB0aGFuIHRoYXQgb2YgdGhlIHByZXZpb3VzXG4gICAgICAvLyBwb2ludCB0byBiZSBlbGltaW5hdGVkLCB1c2UgdGhlIGxhdHRlcuKAmXMgd2VpZ2h0IGluc3RlYWQuIFRoaXMgZW5zdXJlc1xuICAgICAgLy8gdGhhdCB0aGUgY3VycmVudCBwb2ludCBjYW5ub3QgYmUgZWxpbWluYXRlZCB3aXRob3V0IGVsaW1pbmF0aW5nXG4gICAgICAvLyBwcmV2aW91c2x5LSBlbGltaW5hdGVkIHBvaW50cy5cbiAgICAgIGlmICh0cmlhbmdsZVsxXVsyXSA8IG1heFdlaWdodCkgdHJpYW5nbGVbMV1bMl0gPSBtYXhXZWlnaHQ7XG4gICAgICBlbHNlIG1heFdlaWdodCA9IHRyaWFuZ2xlWzFdWzJdO1xuXG4gICAgICBpZiAocHJldmlvdXMpIHtcbiAgICAgICAgcHJldmlvdXMubmV4dCA9IG5leHQ7XG4gICAgICAgIHByZXZpb3VzWzJdID0gdHJpYW5nbGVbMl07XG4gICAgICAgIHVwZGF0ZShwcmV2aW91cyk7XG4gICAgICB9XG5cbiAgICAgIGlmIChuZXh0KSB7XG4gICAgICAgIG5leHQucHJldmlvdXMgPSBwcmV2aW91cztcbiAgICAgICAgbmV4dFswXSA9IHRyaWFuZ2xlWzBdO1xuICAgICAgICB1cGRhdGUobmV4dCk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIGFyYztcbiAgfSk7XG5cbiAgZnVuY3Rpb24gdXBkYXRlKHRyaWFuZ2xlKSB7XG4gICAgaGVhcC5yZW1vdmUodHJpYW5nbGUpO1xuICAgIHRyaWFuZ2xlWzFdWzJdID0gd2VpZ2h0KHRyaWFuZ2xlKTtcbiAgICBoZWFwLnB1c2godHJpYW5nbGUpO1xuICB9XG5cbiAgcmV0dXJuIHtcbiAgICB0eXBlOiBcIlRvcG9sb2d5XCIsXG4gICAgYmJveDogdG9wb2xvZ3kuYmJveCxcbiAgICBvYmplY3RzOiB0b3BvbG9neS5vYmplY3RzLFxuICAgIGFyY3M6IGFyY3NcbiAgfTtcbn07XG5cbnZhciBxdWFudGlsZSA9IGZ1bmN0aW9uKHRvcG9sb2d5LCBwKSB7XG4gIHZhciBhcnJheSA9IFtdO1xuXG4gIHRvcG9sb2d5LmFyY3MuZm9yRWFjaChmdW5jdGlvbihhcmMpIHtcbiAgICBhcmMuZm9yRWFjaChmdW5jdGlvbihwb2ludCkge1xuICAgICAgaWYgKGlzRmluaXRlKHBvaW50WzJdKSkgeyAvLyBJZ25vcmUgZW5kcG9pbnRzLCB3aG9zZSB3ZWlnaHQgaXMgSW5maW5pdHkuXG4gICAgICAgIGFycmF5LnB1c2gocG9pbnRbMl0pO1xuICAgICAgfVxuICAgIH0pO1xuICB9KTtcblxuICByZXR1cm4gYXJyYXkubGVuZ3RoICYmIHF1YW50aWxlJDEoYXJyYXkuc29ydChkZXNjZW5kaW5nKSwgcCk7XG59O1xuXG5mdW5jdGlvbiBxdWFudGlsZSQxKGFycmF5LCBwKSB7XG4gIGlmICghKG4gPSBhcnJheS5sZW5ndGgpKSByZXR1cm47XG4gIGlmICgocCA9ICtwKSA8PSAwIHx8IG4gPCAyKSByZXR1cm4gYXJyYXlbMF07XG4gIGlmIChwID49IDEpIHJldHVybiBhcnJheVtuIC0gMV07XG4gIHZhciBuLFxuICAgICAgaCA9IChuIC0gMSkgKiBwLFxuICAgICAgaSA9IE1hdGguZmxvb3IoaCksXG4gICAgICBhID0gYXJyYXlbaV0sXG4gICAgICBiID0gYXJyYXlbaSArIDFdO1xuICByZXR1cm4gYSArIChiIC0gYSkgKiAoaCAtIGkpO1xufVxuXG5mdW5jdGlvbiBkZXNjZW5kaW5nKGEsIGIpIHtcbiAgcmV0dXJuIGIgLSBhO1xufVxuXG52YXIgc2ltcGxpZnkgPSBmdW5jdGlvbih0b3BvbG9neSwgbWluV2VpZ2h0KSB7XG4gIG1pbldlaWdodCA9IG1pbldlaWdodCA9PSBudWxsID8gTnVtYmVyLk1JTl9WQUxVRSA6ICttaW5XZWlnaHQ7XG5cbiAgLy8gUmVtb3ZlIHBvaW50cyB3aG9zZSB3ZWlnaHQgaXMgbGVzcyB0aGFuIHRoZSBtaW5pbXVtIHdlaWdodC5cbiAgdmFyIGFyY3MgPSB0b3BvbG9neS5hcmNzLm1hcChmdW5jdGlvbihpbnB1dCkge1xuICAgIHZhciBpID0gLTEsXG4gICAgICAgIGogPSAwLFxuICAgICAgICBuID0gaW5wdXQubGVuZ3RoLFxuICAgICAgICBvdXRwdXQgPSBuZXcgQXJyYXkobiksIC8vIHBlc3NpbWlzdGljXG4gICAgICAgIHBvaW50O1xuXG4gICAgd2hpbGUgKCsraSA8IG4pIHtcbiAgICAgIGlmICgocG9pbnQgPSBpbnB1dFtpXSlbMl0gPj0gbWluV2VpZ2h0KSB7XG4gICAgICAgIG91dHB1dFtqKytdID0gW3BvaW50WzBdLCBwb2ludFsxXV07XG4gICAgICB9XG4gICAgfVxuXG4gICAgb3V0cHV0Lmxlbmd0aCA9IGo7XG4gICAgcmV0dXJuIG91dHB1dDtcbiAgfSk7XG5cbiAgcmV0dXJuIHtcbiAgICB0eXBlOiBcIlRvcG9sb2d5XCIsXG4gICAgdHJhbnNmb3JtOiB0b3BvbG9neS50cmFuc2Zvcm0sXG4gICAgYmJveDogdG9wb2xvZ3kuYmJveCxcbiAgICBvYmplY3RzOiB0b3BvbG9neS5vYmplY3RzLFxuICAgIGFyY3M6IGFyY3NcbiAgfTtcbn07XG5cbnZhciBwaSA9IE1hdGguUEk7XG52YXIgdGF1ID0gMiAqIHBpO1xudmFyIHF1YXJ0ZXJQaSA9IHBpIC8gNDtcbnZhciByYWRpYW5zID0gcGkgLyAxODA7XG52YXIgYWJzID0gTWF0aC5hYnM7XG52YXIgYXRhbjIgPSBNYXRoLmF0YW4yO1xudmFyIGNvcyA9IE1hdGguY29zO1xudmFyIHNpbiA9IE1hdGguc2luO1xuXG5mdW5jdGlvbiBoYWxmQXJlYShyaW5nLCBjbG9zZWQpIHtcbiAgdmFyIGkgPSAwLFxuICAgICAgbiA9IHJpbmcubGVuZ3RoLFxuICAgICAgc3VtID0gMCxcbiAgICAgIHBvaW50ID0gcmluZ1tjbG9zZWQgPyBpKysgOiBuIC0gMV0sXG4gICAgICBsYW1iZGEwLCBsYW1iZGExID0gcG9pbnRbMF0gKiByYWRpYW5zLFxuICAgICAgcGhpMSA9IChwb2ludFsxXSAqIHJhZGlhbnMpIC8gMiArIHF1YXJ0ZXJQaSxcbiAgICAgIGNvc1BoaTAsIGNvc1BoaTEgPSBjb3MocGhpMSksXG4gICAgICBzaW5QaGkwLCBzaW5QaGkxID0gc2luKHBoaTEpO1xuXG4gIGZvciAoOyBpIDwgbjsgKytpKSB7XG4gICAgcG9pbnQgPSByaW5nW2ldO1xuICAgIGxhbWJkYTAgPSBsYW1iZGExLCBsYW1iZGExID0gcG9pbnRbMF0gKiByYWRpYW5zO1xuICAgIHBoaTEgPSAocG9pbnRbMV0gKiByYWRpYW5zKSAvIDIgKyBxdWFydGVyUGk7XG4gICAgY29zUGhpMCA9IGNvc1BoaTEsIGNvc1BoaTEgPSBjb3MocGhpMSk7XG4gICAgc2luUGhpMCA9IHNpblBoaTEsIHNpblBoaTEgPSBzaW4ocGhpMSk7XG5cbiAgICAvLyBTcGhlcmljYWwgZXhjZXNzIEUgZm9yIGEgc3BoZXJpY2FsIHRyaWFuZ2xlIHdpdGggdmVydGljZXM6IHNvdXRoIHBvbGUsXG4gICAgLy8gcHJldmlvdXMgcG9pbnQsIGN1cnJlbnQgcG9pbnQuICBVc2VzIGEgZm9ybXVsYSBkZXJpdmVkIGZyb20gQ2Fnbm9saeKAmXNcbiAgICAvLyB0aGVvcmVtLiAgU2VlIFRvZGh1bnRlciwgU3BoZXJpY2FsIFRyaWcuICgxODcxKSwgU2VjLiAxMDMsIEVxLiAoMikuXG4gICAgLy8gU2VlIGh0dHBzOi8vZ2l0aHViLmNvbS9kMy9kMy1nZW8vYmxvYi9tYXN0ZXIvUkVBRE1FLm1kI2dlb0FyZWFcbiAgICB2YXIgZExhbWJkYSA9IGxhbWJkYTEgLSBsYW1iZGEwLFxuICAgICAgICBzZExhbWJkYSA9IGRMYW1iZGEgPj0gMCA/IDEgOiAtMSxcbiAgICAgICAgYWRMYW1iZGEgPSBzZExhbWJkYSAqIGRMYW1iZGEsXG4gICAgICAgIGsgPSBzaW5QaGkwICogc2luUGhpMSxcbiAgICAgICAgdSA9IGNvc1BoaTAgKiBjb3NQaGkxICsgayAqIGNvcyhhZExhbWJkYSksXG4gICAgICAgIHYgPSBrICogc2RMYW1iZGEgKiBzaW4oYWRMYW1iZGEpO1xuICAgIHN1bSArPSBhdGFuMih2LCB1KTtcbiAgfVxuXG4gIHJldHVybiBzdW07XG59XG5cbmZ1bmN0aW9uIHNwaGVyaWNhbFJpbmdBcmVhKHJpbmcsIGludGVyaW9yKSB7XG4gIHZhciBzdW0gPSBoYWxmQXJlYShyaW5nLCB0cnVlKTtcbiAgaWYgKGludGVyaW9yKSBzdW0gKj0gLTE7XG4gIHJldHVybiAoc3VtIDwgMCA/IHRhdSArIHN1bSA6IHN1bSkgKiAyO1xufVxuXG5mdW5jdGlvbiBzcGhlcmljYWxUcmlhbmdsZUFyZWEodCkge1xuICByZXR1cm4gYWJzKGhhbGZBcmVhKHQsIGZhbHNlKSkgKiAyO1xufVxuXG5leHBvcnRzLmZpbHRlciA9IGZpbHRlcjtcbmV4cG9ydHMuZmlsdGVyQXR0YWNoZWQgPSBmaWx0ZXJBdHRhY2hlZDtcbmV4cG9ydHMuZmlsdGVyQXR0YWNoZWRXZWlnaHQgPSBmaWx0ZXJBdHRhY2hlZFdlaWdodDtcbmV4cG9ydHMuZmlsdGVyV2VpZ2h0ID0gZmlsdGVyV2VpZ2h0O1xuZXhwb3J0cy5wbGFuYXJSaW5nQXJlYSA9IHBsYW5hclJpbmdBcmVhO1xuZXhwb3J0cy5wbGFuYXJUcmlhbmdsZUFyZWEgPSBwbGFuYXJUcmlhbmdsZUFyZWE7XG5leHBvcnRzLnByZXNpbXBsaWZ5ID0gcHJlc2ltcGxpZnk7XG5leHBvcnRzLnF1YW50aWxlID0gcXVhbnRpbGU7XG5leHBvcnRzLnNpbXBsaWZ5ID0gc2ltcGxpZnk7XG5leHBvcnRzLnNwaGVyaWNhbFJpbmdBcmVhID0gc3BoZXJpY2FsUmluZ0FyZWE7XG5leHBvcnRzLnNwaGVyaWNhbFRyaWFuZ2xlQXJlYSA9IHNwaGVyaWNhbFRyaWFuZ2xlQXJlYTtcblxuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsICdfX2VzTW9kdWxlJywgeyB2YWx1ZTogdHJ1ZSB9KTtcblxufSkpKTtcbiJdfQ==
