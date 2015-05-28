/// <reference path="typings/tsd.d.ts"/>

class InfoWindow {
  'use strict';

  private timer;
  private utils = require('./utils');
  private config = require('./config');

  constructor(public that) {
  }

  private infoWindow(map, marker, args) {
    var content = false;

    if (marker.infoWindow.content) {

      if (marker.infoWindow.content.indexOf('{') > - 1) {
        content = args.content.replace(/\{(\w+)\}/g, function (m, variable) {
          return marker.data[variable] || '';
        });
      }

      content = content || marker.infoWindow.content;
    }

    var options: any = this.utils.clone(args);
    options.content = content;

    this.that.infoWindow = new google.maps.InfoWindow(options);
    this.that.infoWindow.open(map, marker);
  }

  private open(map, marker, options) {
    this.close();
    this.infoWindow(map, marker, options);
  }

  private isOpen(infoWindow){
    var map = infoWindow.getMap();
    return (map !== null && typeof map !== "undefined");
  }

  private close() {
    clearTimeout(this.timer);
    if (this.that.infoWindow && this.isOpen(this.that.infoWindow)) {
      this.that.infoWindow.close();
    }
  }

  public addEvents(marker, options, map) {
    var args = this.utils.prepareOptions(options, this.config.customInfoWindowOptions);
    var openOn = (args.custom && args.custom.open && args.custom.open.on) ?  args.custom.open.on : 'click';
    var closeOn = (args.custom && args.custom.close && args.custom.close.on) ? args.custom.close.on : 'click';

    // Toggle Effect when using the same method to Open and Close.
    if (openOn === closeOn) {
      google.maps.event.addListener(marker, openOn, ()=> {
        if (!this.that.infoWindow || !this.isOpen(this.that.infoWindow)) {
          this.open(map, marker, args.defaults);
        } else {
          this.close();
        }
      });

    } else {

      google.maps.event.addListener(marker, openOn, ()=> {
        this.open(map, marker, args.defaults);
      });

      google.maps.event.addListener(marker, closeOn, ()=> {
        if (args.custom.close.duration) {

          this.timer = setTimeout(()=>{
            this.close();
          }, args.custom.close.duration);

        } else {
          this.close();
        }
      });
    }
  }
}

export = InfoWindow;

