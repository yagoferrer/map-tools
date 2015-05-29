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
