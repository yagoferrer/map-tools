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
