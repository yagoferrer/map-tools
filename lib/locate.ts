class Locate {

  private instance;

  constructor() {

  }

  public locate(): {lat: number; lng: number} {
    var center = this.instance.getCenter();
    return {lat: center.lat(), lng: center.lng()};
  }
}


export = Locate;
