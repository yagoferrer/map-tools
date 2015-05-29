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
