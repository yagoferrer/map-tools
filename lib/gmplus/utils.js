/*jslint node: true */
"use strict";
function clone(o) {
  var out, v, key;
  out = Array.isArray(o) ? [] : {};
  for (key in o) {
    if (o.hasOwnProperty(key)) {
      v = o[key];
      out[key] = (typeof v === "object") ? clone(v) : v;
    }
  }
  return out;
}

function createUid() {
  return 'xxxxxxxxxxxx4xxxyxxxxxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    var r, v;
    r = Math.random() * 16 | 0;
    v = c === 'x' ? r : r & 0x3 | 0x8;
    return v.toString(16);
  });
}

function prepareOptions(options, custom) {
  var result = {}, option;
  for (option in options) {
    if (options.hasOwnProperty(option)) {
      if (custom.indexOf(option) > -1) {
        result.custom = result.custom || {};
        result.custom[option] = options[option];
      } else {
        result.setters = result.setters || {};
        result.setters['set' + option[0].toUpperCase() + option.slice(1)] = options[option];
      }
    }
  }
  return result;
}

module.exports = {
  clone: clone,
  createUid: createUid,
  prepareOptions: prepareOptions
};
