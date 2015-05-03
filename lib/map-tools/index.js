/*jslint node: true */
/// <reference path="../typings/node.d.ts"/>
var mapTools = (function () {
    function mapTools(options, cb) {
        this.instance = false;
        this.zoom = function (zoom) {
            if (typeof zoom === 'undefined') {
                return this.instance.getZoom();
            }
            else {
                this.instance.setZoom(zoom);
            }
        };
        this.locate = function () {
            var center = this.instance.getCenter();
            return { lat: center.lat(), lng: center.lng() };
        };
        var that = this;
        this.addMarker = require('map-tools/addMarker')(window, that);
        this.removeMarker = require('map-tools/removeMarker')(window, that);
        this.resetMarker = require('map-tools/resetMarker')(window, that);
        this.addTopoJson = require('map-tools/addFeature')(window, that).addTopoJson;
        this.addGeoJson = require('map-tools/addFeature')(window, that).addGeoJson;
        this.updateFeature = require('map-tools/updateFeature')(window, that);
        this.addPanel = require('map-tools/addPanel')(window, that);
        this.updateMarker = require('map-tools/updateMarker')(window, that).update;
        this.findFeature = require('map-tools/filter')(window, that, 'json');
        this.findMarker = require('map-tools/filter')(window, that, 'markers');
        this.updateMap = require('map-tools/updateMap')(window, that);
        this.center = require('map-tools/center')(window, that);
        var map = require('map-tools/addMap')(window, that);
        window.onload = map.load(options, cb); // Wait until the DOM is ready before attempting to load the Map
        return this;
    }
    return mapTools;
})();
module.exports = function () {
    return mapTools;
};
//# sourceMappingURL=index.js.map