/// <reference path="typings/tsd.d.ts"/>

class Center {

  private options;
  private instance;

  pos(lat: number, lng: number): void {
    var position;
    if (lat && lng) {
      position = new google.maps.LatLng(lat, lng);
    } else {
      position = new google.maps.LatLng(this.options.lat, this.options.lng);
    }

    this.instance.setCenter(position);
  }

}

export = Center;
