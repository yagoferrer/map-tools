interface utilsClone {
  zoom: string;
  center: {};
  mapTypeId: any;
}

class Utils {

  public static clone(o: {}, exceptionKeys?: string[]): utilsClone {
    var out, v, key;
    out = Array.isArray(o) ? [] : {};
    for (key in o) {
      if (o.hasOwnProperty(key)) {
        if (!exceptionKeys || (exceptionKeys && exceptionKeys.indexOf(key) === -1)) {
          v = o[key];
          out[key] = (typeof v === 'object') ? this.clone(v) : v;
        }
      }
    }
    return out;
  }

  public static createUid(): string {
    return 'xxxxxxxxxxxx4xxxyxxxxxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      var r, v;
      r = Math.random() * 16 | 0;
      v = c === 'x' ? r : r & 0x3 | 0x8;
      return v.toString(16);
    });
  }

  public static prepareOptions(options, custom) : {custom: {open?: {on: string}; close?: {on: string; duration: number}}; defaults: {}} {
    var result = {custom: {}, defaults: {}}, option;
    for (option in options) {
      if (options.hasOwnProperty(option)) {
        if (custom.indexOf(option) > -1) {
          result.custom = result.custom || {};
          result.custom[option] = options[option];
        } else {
          result.defaults = result.defaults || {};
          result.defaults[option] = options[option];
        }
      }
    }
    return result;
  }

  public static isArray(arg) {
    return Object.prototype.toString.call(arg) === '[object Array]';
  }

  public static toArray(obj) {
    return Object.keys(obj).map(function(key){ return obj[key]; });
  }

  public static defaultDimension(item) {
    return function(d) {

      if (typeof d.data[item] === 'undefined' && typeof d[item] !== 'undefined') {
        return d[item];
      }

      if ( typeof d.data[item] === 'undefined' && typeof d[item] === 'undefined') {
        return null;
      }

      return d.data[item];
    };
  }

  // compares two lists and returns the common items
  public static getCommonObject(list1, list2){
    var result = {};
    for (var uid in list1) {
      if (list1.hasOwnProperty(uid)) {
        var match = list2[uid];
        if (typeof match !== 'undefined'){
          result[uid] = match;
        }
      }
    }
    return result;
  }
}

export = Utils;
