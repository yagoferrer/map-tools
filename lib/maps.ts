/// <reference path="utils.ts"/>
/// <reference path="config.ts"/>
/// <reference path="typings/tsd.d.ts"/>
class Maps {

  /**
   * Injects Google API Javascript File and adds a callback to load the Google Maps Async.
   * @type {{load: Function}}
   * @private
   *
   * @returns the element appended
   */
  public static load(id, args): {} {
    var version = args.version || Config.version;
    var script = window.document.createElement('script');
    script.type = 'text/javascript';
    script.src = Config.url + '?v=' + version + '&callback=mapTools.maps.' + id + '.create';
    return window.document.body.appendChild(script);
  }

  public static mapOptions(args): {} {
    // To clone Arguments excluding customMapOptions
    var result = Utils.clone(args, Config.customMapOptions);

    result.zoom = args.zoom || Config.zoom;

    if (args.lat && args.lng) {
      result.center = new google.maps.LatLng(args.lat, args.lng);
    }

    if (args.type) {
      result.mapTypeId = google.maps.MapTypeId[args.type] || false;
    }

    return result;
  }

}
