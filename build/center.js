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
