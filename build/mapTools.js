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
