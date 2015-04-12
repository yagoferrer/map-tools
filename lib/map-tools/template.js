"use strict";
module.exports = function(global, that) {

  function load(type, url, cb) {

    if (that.templates[type][url]) {
      return that.templates[type][url];
    }

    var xhr = new XMLHttpRequest();
    xhr.open("GET", url);
    xhr.onload = function () {

      if (xhr.readyState === 4) {
        if (xhr.status === 200) {
          that.templates[type][url] = xhr.responseText;
          cb(false, xhr.responseText);
        } else {
          cb(new Error(xhr.statusText));
        }
      }
    };

    xhr.onerror = function () {
      cb(new Error(xhr.statusText));
    };

    xhr.send(null);
  }

 return load;
};
