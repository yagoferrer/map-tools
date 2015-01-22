'use strict';

(function(global){

    var options;

    var _googleMapsApi = {
        load: function() {
            var script = document.createElement('script');
            script.type = 'text/javascript';
            script.src = 'https://maps.googleapis.com/maps/api/js?v=3.exp&' +
            'callback=GMP.maps.map.create';
            global.document.body.appendChild(script);
        },
        loaded: function() {
            console.log('API Loaded');
        }
    };

    function newMap(args)
    {

        var mapOptions = {
            zoom: args.zoom,
            center: new global.google.maps.LatLng(args.center.lat, args.center.lng)
        };
        global.GMP.maps[args.id].map = new global.google.maps.Map(document.getElementById(args.id),
            mapOptions);

    }

    function GMP(args)
    {
        options = args;

        if (typeof options === 'string') {
            console.log('string', args);
        } else {

            if (options.id) {
                global.GMP.maps = global.GMP.maps || {};
                global.GMP.maps[options.id] = {
                    create: function() {
                        newMap(this.arguments);
                    },
                    arguments: options
                }
            }

            if (options.async) {
                _googleMapsApi.load();
            }

        }
    }

    global.GMP = GMP

})(this, window);