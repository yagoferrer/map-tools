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
