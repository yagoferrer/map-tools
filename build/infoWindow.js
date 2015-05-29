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
