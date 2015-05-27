/// <reference path="typings/tsd.d.ts"/>
export class Maps {


  public static utils = require('./utils');
  public static config = require('./config');

  /**
   * Injects Google API Javascript File and adds a callback to load the Google Maps Async.
   * @type {{load: Function}}
   * @private
   *
   * @returns the element appended
   */
  public static load(id, args): {} {
    var version = args.version || Maps.config.version;
    var script = window.document.createElement('script');
    script.type = 'text/javascript';
    script.src = Maps.config.url + '?v=' + version + '&callback=mapTools.maps.' + id + '.create';
    return window.document.body.appendChild(script);
  }

  public static mapOptions(args): {} {
    // To clone Arguments excluding customMapOptions
    var result = Maps.utils.clone(args, Maps.config.customMapOptions);

    result.zoom = args.zoom || Maps.config.zoom;

    if (args.lat && args.lng) {
      result.center = new google.maps.LatLng(args.lat, args.lng);
    }

    if (args.type) {
      result.mapTypeId = google.maps.MapTypeId[args.type] || false;
    }

    return result;
  }

}
