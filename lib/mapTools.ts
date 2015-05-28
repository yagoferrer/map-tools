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

import addMarker = require('./addMarker');
import addFeature = require('./addFeature');
import addPanel = require('./addPanel');
import center = require('./center');
import locate = require('./locate');
import updateMarker = require('./updateMarker');
import updateMap = require('./updateMap');
import updateFeature = require('./updateFeature');
import addMap = require('./addMap');
import removeMarker = require('./removeMarker');
import resetMarker = require('./resetMarker');
import filter = require('./filter');

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


    var addMarkerInstance = new addMarker(this);

    this.addMarker = function(marker, options) {
      return addMarkerInstance.addMarker(marker, options);
    };

    var addFeatureInstance = new addFeature(this);

    this.addTopoJson = function(data, options) {
      return addFeatureInstance.addTopoJson(data, options);
    };

    this.addGeoJson = function(data, options) {
      return addFeatureInstance.addGeoJson(data, options);
    };

    var addPanelInstance = new addPanel(this);

    this.addPanel = function(options, cb) {
      return addPanelInstance.addPanel(options, cb);
    };

    this.center = new center().pos;

    this.locate = new locate().locate;


    var updateMarkerInstance = new updateMarker(this);

    this.updateMarker = function(args, options) {
      return updateMarkerInstance.update(args, options);
    };

    var updateMapInstance = new updateMap(this);

    this.updateMap = function(args) {
      updateMapInstance.updateMap(args)
    };

    var updateFeatureInstance = new updateFeature(this);

    this.updateFeature = function(args, options) {
      return updateFeatureInstance.update(args, options);
    };


    var removeMarkerInstance = new removeMarker(this);
    this.removeMarker = function(args) {
      return removeMarkerInstance.removeMarker(args)
    };


    var resetMarkerInstance = new resetMarker(this);
    this.resetMarker = function(args, options) {
      return resetMarkerInstance.resetMarker(args, options)
    };


    var findMarker = new filter(this, 'markers');
    this.findMarker = function(args, options) {
      return findMarker.filter(args, options);
    };

    // Unit Tests?
    var findFeature = new filter(this, 'json');
    this.findFeature = function(args, options) {
      return findFeature.filter(args, options);
    };

    var map = new addMap(this);

    map.load(options, cb);
  }
}

export = mapTools;
