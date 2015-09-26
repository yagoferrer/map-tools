'use strict';

var current = new RegExp(/2.0.0+/g);
var next = '2.0.1';
var description = "map-tools.js is a Google Maps Feature-rich Javascript wrapper that makes things like: Marker filtering, asynchronous loading, working with TopoJSON or GeoJSON, animation and more. Much simpler with an easy-to-use API.";

var fs = require('fs');

function replaceDocs(location, current, next) {
  fs.readFile(location, 'utf8', function (err, data) {
    if (err) {return console.log(err);}
    var result = data.replace(current, next);
    fs.writeFile(location, result, 'utf8', function (err) {
      if (err) {
        return console.log(err);
      }
    });
  });
}

function replaceJson(location, destination, next) {
  var json = require(location);
  json.version = next;
  json.description = description;

  var output = JSON.stringify(json, null, "  ");

  fs.writeFile(destination, output, 'utf8', function (err) {
    if (err) {
      return console.log(err);
    }
  });

}

replaceDocs('./README.md', current, next);
replaceDocs('./index.html', current, next);
replaceJson('../package.json', './package.json', next);
replaceJson('../bower.json', './bower.json', next);



