/* global window, document */
(function (global) {
  "use strict";
  var defaults = {
    version: 3.16
  };

  /**
   * Injects Google API Javascript File and adds a callback to load the Google Maps Async
   * @type {{load: Function}}
   * @private
   */
  var _googleMapsApi = {
    load: function (args) {
      var version = args.version || defaults.version;
      var script = document.createElement('script');
      script.type = 'text/javascript';
      script.src = '//maps.googleapis.com/maps/api/js?v=' + version + '&' +
      'callback=GMP.maps.' + args.id + '.create';
      return global.document.body.appendChild(script);
    }
  };

  /**
   * Creates a new Google Map Instance
   * @param args
   */
  function newMap(args) {
    var mapOptions = {
      zoom: args.zoom,
      center: new global.google.maps.LatLng(args.center.lat, args.center.lng)
    };

    global.GMP.maps[args.id].map = new global.google.maps.Map(document.getElementById(args.id), mapOptions);
  }

  /**
   * Creates a new GMaps Plus instance
   * @param options
   * @constructor
   */
  function GMP(options) {
    if (typeof options == 'object') {
      if (options.id) {
        global.GMP.maps = global.GMP.maps || {};
        global.GMP.maps[options.id] = {
          create: function () {
            newMap(this.arguments);
          },
          arguments: options
        };
      }

      if (options.async !== false) {
        _googleMapsApi.load(options);
      }
    }
  }

  global.GMP = GMP;

})(this, window);
