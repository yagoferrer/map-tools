/// <reference path="typings/tsd.d.ts"/>
class UpdateFeature {
  'use strict';

  constructor(public that) {}

  private updateStyle (f, style) {
    if (typeof style === 'function') {
      var styleOptions = style.call(f);
      return this.that.instance.data.overrideStyle(f, styleOptions);
    }
    this.that.instance.data.overrideStyle(f, style);
  }

  private findAndUpdate(args, options) {

    if (args.data && args.data.uid) {
      return this.updateFeature(args, options);
    }

    if (args.uid && mapTools.maps[this.that.id].json && mapTools.maps[this.that.id].json.all[args.uid]) {
      return this.updateFeature(mapTools.maps[this.that.id].json.all[args.uid], options);
    }
  }

  public update(args, options){
    var type = Object.prototype.toString.call(args);

    if (type === '[object Array]') {
      var feature, x;
      for (x in args) {
        if (args.hasOwnProperty(x)) {
          feature = args[x];
          this.findAndUpdate(feature, options);
        }
      }
    }

    if (type === '[object Object]') {
      this.findAndUpdate(args, options);
    }
  }

  private updateFeature(feature, options) {
    if( options.style ) {
      this.updateStyle(feature, options.style);
    }
  }

}

export = UpdateFeature;
