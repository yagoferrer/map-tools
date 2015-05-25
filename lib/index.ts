/// <reference path="references.ts"/>
class Index {

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

  constructor(options, cb) {
    var addMarker = new AddMarker(this);

    this.addMarker = function(marker, options) {
      return addMarker.addMarker(marker, options);
    };

    var addFeature = new AddFeature(this);

    this.addTopoJson = function(data, options) {
      return addFeature.addTopoJson(data, options);
    };

    this.addGeoJson = function(data, options) {
      return addFeature.addGeoJson(data, options);
    };

    var addPanel = new AddPanel(this);

    this.addPanel = function(options, cb) {
      return addPanel.addPanel(options, cb);
    };

    this.center = new Center().pos;

    this.locate = new Locate().locate;


    var updateMarker = new UpdateMarker(this);

    this.updateMarker = function(args, options) {
      return updateMarker.update(args, options);
    };

    var updateMap = new UpdateMap(this);

    this.updateMap = function(args) {
      updateMap.updateMap(args)
    };

    var updateFeature = new UpdateFeature(this);

    this.updateFeature = function(args, options) {
      return updateFeature.update(args, options);
    };


    var removeMarker = new RemoveMarker(this);
    this.removeMarker = function(args) {
      return removeMarker.removeMarker(args)
    };


    var resetMarker = new ResetMarker(this);
    this.resetMarker = function(args, options) {
      return resetMarker.resetMarker(args, options)
    };


    var findMarker = new Filter(this, 'markers');
    this.findMarker = function(args, options) {
      return findMarker.filter(args, options);
    };

    // Unit Tests?
    var findFeature = new Filter(this, 'json');
    this.findFeature = function(args, options) {
      return findFeature.filter(args, options);
    };

    var map = new AddMap(this);
    map.load(options, cb);
  }
}

// Node
module.exports = Index;
