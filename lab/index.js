'use strict';

(function(global){

    var _googleMapsApi = {
        load: function(args) {

            var version = args.version || '3.16';

            var script = document.createElement('script');
            script.type = 'text/javascript';
            script.src = '//maps.googleapis.com/maps/api/js?v=' + version + '&' +
            'callback=GMP.maps.' + args.id + '.create';
            global.document.body.appendChild(script);
        }
    };

    function newMap(args)
    {
        var mapOptions = {
            zoom: args.zoom,
            center: new global.google.maps.LatLng(args.center.lat, args.center.lng)
        };
        global.GMP.maps[args.id].map = new global.google.maps.Map(document.getElementById(args.id), mapOptions);

    }

    function GMP(options)
    {
        if (typeof options == 'object') {
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
                _googleMapsApi.load(options);
            }
        }
    }

    global.GMP = GMP

})(this, window);