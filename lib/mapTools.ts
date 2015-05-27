/// <reference path="typings/tsd.d.ts"/>
interface mapToolsOptions {
  id?: string;
  el?: string;
  lat: number;
  lng: number;
  type?: string;
  async?: boolean;
  sync?: boolean;
  on?: {}
}

interface mapToolsCallback {
  (err: {}, instance?: {}): void;
}

class mapTools {

  public instance;
  public addMarker;
  public addTopoJson;
  public addGeoJson;
  public addPanel;
  public center;
  public updateMarker;
  public updateMap;
  public updateFeature;
  public removeMarker;
  public resetMarker;
  public findMarker;
  public findFeature;

  public locate;
  public crossfilter = require('crossfilter');

  zoom(zoom?: number): number {
    if (typeof zoom === 'undefined') {
      return this.instance.getZoom();
    } else {
      this.instance.setZoom(zoom);
    }
  }

  constructor(options: mapToolsOptions, cb: mapToolsCallback) {
    var addMarker = require('./addMarker')(this);

    this.addMarker = function(marker, options) {
      return addMarker.addMarker(marker, options);
    };

    var addFeature = require('./addFeature')(this);

    this.addTopoJson = function(data, options) {
      return addFeature.addTopoJson(data, options);
    };

    this.addGeoJson = function(data, options) {
      return addFeature.addGeoJson(data, options);
    };

    var addPanel = require('./addPanel')(this);

    this.addPanel = function(options, cb) {
      return addPanel.addPanel(options, cb);
    };

    this.center = require('./center').pos;

    this.locate = require('./locate').locate;


    var updateMarker = require('./updateMarker')(this);

    this.updateMarker = function(args, options) {
      return updateMarker.update(args, options);
    };

    var updateMap = require('./updateMap')(this);

    this.updateMap = function(args) {
      updateMap.updateMap(args)
    };

    var updateFeature = require('./updateFeature')(this);

    this.updateFeature = function(args, options) {
      return updateFeature.update(args, options);
    };


    var removeMarker = require('./removeMarker')(this);
    this.removeMarker = function(args) {
      return removeMarker.removeMarker(args)
    };


    var resetMarker = require('./resetMarker')(this);
    this.resetMarker = function(args, options) {
      return resetMarker.resetMarker(args, options)
    };


    var findMarker = require('./filter')(this, 'markers');
    this.findMarker = function(args, options) {
      return findMarker.filter(args, options);
    };

    // Unit Tests?
    var findFeature = require('./filter')(this, 'json');
    this.findFeature = function(args, options) {
      return findFeature.filter(args, options);
    };

    var map = require('./addMap')(this);
    map.load(options, cb);
  }
}

export = mapTools;
