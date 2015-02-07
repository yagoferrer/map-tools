/* gmplus.js 0.2.1 MIT License. 2015 Yago Ferrer <yago.ferrer@gmail.com> */
(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/*jslint node: true */
"use strict";
var utils = require('gmplus/utils');

module.exports = function (global, that) {
  var bubble = require('gmplus/bubble')(global);

  function addMarker(marker, options) {
    var i;
    marker.map = that.instance;
    marker.position = new global.google.maps.LatLng(marker.lat, marker.lng);

    var group = marker.group || false;

    if (options && options.group) {
      group = options.group || group;
    }

    // Adds options set via 2nd parameter. Overwrites any Marker options already set.
    if (options) {
      for (i in options) {
        if (options.hasOwnProperty(i)) {
          marker[i] = options[i];
        }
      }
    }

    // Adds additional options from the Group and overwrites any Marker options already set.
    if (group && global.GMP.maps[that.id].markers && global.GMP.maps[that.id].markers.groupOptions && global.GMP.maps[that.id].markers.groupOptions[group]) {

      for (var j in global.GMP.maps[that.id].markers.groupOptions[group]) {
        marker[j] = global.GMP.maps[that.id].markers.groupOptions[group][j];
      }
    }

    marker.data = marker.data || {};

    if (marker.data) {
      marker.data.uid = utils.createUid();
    }

    if (that.options.crossfilter) {
      that.options.crossfilter.add([marker.data]);
    }

    var instance = new global.google.maps.Marker(marker);

    if (marker.move) {
      instance.setAnimation(marker.move);
    }

    if (marker.bubble) {
      bubble.create(instance, marker.bubble, that.instance);
    }

    global.GMP.maps[that.id].markers = global.GMP.maps[that.id].markers || {};

    // Adds Marker Reference to specific Group
    if (group) {
      global.GMP.maps[that.id].markers.groups = global.GMP.maps[that.id].markers.groups || {};
      global.GMP.maps[that.id].markers.groups[group] = global.GMP.maps[that.id].markers.groups[group] || [];
      global.GMP.maps[that.id].markers.groups[group].push(instance);
    }


    // Adds Marker Reference of each Marker to "markers"
    global.GMP.maps[that.id].markers.all = global.GMP.maps[that.id].markers.all || {};
    global.GMP.maps[that.id].markers.all[marker.data.uid] = instance;


    return instance;
  }


  /**
   * Adds Markers to the Map
   * @param args Array or Markers
   * @param options things like groups etc
   * @returns {Array} all the instances of the markers.
   */
  function addMarkers(args, options) {
    if (args.length && args.length >= 1) {
      var markers = [];
      var marker;
      for (var i in args) {
        marker = addMarker(args[i], options);
        markers.push(marker);

      }

      return markers;
    }

    return addMarker(args, options);
  };

  return addMarkers;

};

},{"gmplus/bubble":2,"gmplus/utils":11}],2:[function(require,module,exports){
/*jslint node: true */
"use strict";
module.exports = function (global) {

  function create(marker, options, map) {
    var event = options.event || 'click';

    options.content = options.content.replace(/\{(\w+)\}/g, function (m, variable) {
      return marker.data[variable] || '';
    });

    marker.bubble.instance = new global.google.maps.InfoWindow(options);

    global.google.maps.event.addListener(marker, event, function () {
      marker.bubble.instance.open(map, marker);
    });
  }

  return {
    create: create
  };
};


},{}],3:[function(require,module,exports){
/*jslint node: true */
"use strict";
module.exports = {
  version: '3.exp',
  zoom: 8,
  customMarkerOptions: ['lat', 'lng', 'move', 'bubble']
};

},{}],4:[function(require,module,exports){
/*jslint node: true */
"use strict";
module.exports = function (global, that) {

  function updateMarker(marker, options) {
    var setter;

    if (options.custom) {
      if (options.custom.move) {
        marker.setAnimation(options.custom.move);
      }

      if (options.custom.lat && options.custom.lng) {
        marker.setPosition(new global.google.maps.LatLng(options.custom.lat, options.custom.lng));
      }

      if (options.custom.bubble && options.custom.bubble.content) {
        marker.bubble.instance.setContent(options.custom.bubble.content);
      }
    }

    if (options.defaults) {
      marker.setOptions(options.defaults);
    }

    return marker;
  }
  /**
   * Transforms flat keys to Setters. For example visible becomes: setVisible.
   * @param options
   * @returns {{count: number, setterKey: *, setters: {}}}
   * @private
   */
  function findAndUpdateMarker(marker, options) {
    if (marker.data && marker.data.uid) {
      return updateMarker(marker, options);
    }

    if (marker.uid && global.GMP.maps[that.id].markers.all[marker.uid]) {
      return updateMarker(global.GMP.maps[that.id].markers.all[marker.uid], options);
    }
  }


  return findAndUpdateMarker;
};

},{}],5:[function(require,module,exports){
(function (global){
/*jslint node: true */
"use strict";

var config = require('gmplus/config');

/**
 * Injects Google API Javascript File and adds a callback to load the Google Maps Async.
 * @type {{load: Function}}
 * @private
 *
 * @returns the element appended
 */
function load(args) {
  var version = args.version || config.version;
  var script = global.window.document.createElement('script');
  script.type = 'text/javascript';
  script.src = '//maps.googleapis.com/maps/api/js?v=' + version + '&callback=GMP.maps.' + args.id + '.create';
  return global.window.document.body.appendChild(script);
}

module.exports = {
  load: load
};

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"gmplus/config":3}],6:[function(require,module,exports){
/*jslint node: true */
"use strict";
var utils = require('gmplus/utils');
var config = require('gmplus/config');

module.exports = function (global, that) {
  var findAndUpdateMarker = require('gmplus/findUpdateMarker')(global, that);

  /**
   * Adds a New Group
   * @param name Name of the Group
   * @param options That Apply to all the Group
   */
  function addGroup(name, options) {
    global.GMP.maps[that.id].markers = global.GMP.maps[that.id].markers || {};
    global.GMP.maps[that.id].markers.groups = global.GMP.maps[that.id].markers.groups || [];
    global.GMP.maps[that.id].markers.groupOptions = global.GMP.maps[that.id].markers.groupOptions || {};
    global.GMP.maps[that.id].markers.groupOptions[name] = options;
  }

  /**
   * Updates all the Markers of a Group to have specific Properties
   * @param name
   * @param options
   */
  function updateGroup(name, options) {
    var result = [], instance, item;
    var preparedOptions =  utils.prepareOptions(options, config.customMarkerOptions);
    if (global.GMP.maps[that.id].markers.groups && global.GMP.maps[that.id].markers.groups[name]) {
      for (item in global.GMP.maps[that.id].markers.groups[name]) {
        if (global.GMP.maps[that.id].markers.groups[name].hasOwnProperty(item)) {
          instance = findAndUpdateMarker(global.GMP.maps[that.id].markers.groups[name][item], preparedOptions);
          result.push(instance);
        }
      }
    }
    return result;
  }

  return {
    addGroup: addGroup,
    updateGroup: updateGroup
  };

};

},{"gmplus/config":3,"gmplus/findUpdateMarker":4,"gmplus/utils":11}],7:[function(require,module,exports){
/*jslint node: true */
"use strict";
module.exports = function (global) {

  /**
   * Creates a new GMaps Plus instance
   * @param options
   * @constructor
   */
  function GMP(options, cb) {
    var that = this;

    this.addMarker = require('gmplus/addMarker')(global, that);
    this.loadTopoJson = require('gmplus/topojson')(global, that);
    this.updateMarker = require('gmplus/updateMarker')(global, that);
    this.addGroup = require('gmplus/groups')(global, that).addGroup;
    this.updateGroup = require('gmplus/groups')(global, that).updateGroup;

    var map = require('gmplus/map')(global, that);

    global.onload = map.load(options, cb); // Wait until the DOM is ready before attempting to load the Map

    return this;
  }

  // a GMP Instance
  GMP.prototype.instance = false;

  // Animations
  GMP.prototype.bounce = 1;
  GMP.prototype.drop = 2;

  return GMP;
};

},{"gmplus/addMarker":1,"gmplus/groups":6,"gmplus/map":8,"gmplus/topojson":9,"gmplus/updateMarker":10}],8:[function(require,module,exports){
/*jslint node: true */
"use strict";
var utils = require('gmplus/utils');
var config = require('gmplus/config');
var gmaps = require('gmplus/gmaps.js');

module.exports = function (global, that) {

  /**
   * Creates a new Google Map Instance
   * @param args Arguments to instantiate a Google Maps
   *
   */
  function create(args, cb) {

    cb = cb || function () {};

    var mapOptions = utils.clone(args); // To clone Array content

    mapOptions.zoom = args.zoom || config.zoom;
    mapOptions.center = new global.google.maps.LatLng(args.lat, args.lng);

    // These are custom properties from GMP API that need to be unset.
    mapOptions.id = undefined;
    mapOptions.lat = undefined;
    mapOptions.lng = undefined;

    that.id = args.id;
    that.options = args;
    that.instance = new global.google.maps.Map(global.document.getElementById(args.id), mapOptions);
    global.GMP.maps[args.id].instance = that.instance;

    global.google.maps.event.addListenerOnce(that.instance, 'idle', function(){
      cb(false, that.instance);
    });
  }

  /**
   * Validates GMP Options
   * @param options to validate
   * @param cb Only used when something goes wrong
   * @returns {boolean} true/false
   */
  function validOptions(options, cb) {
    if (!options || (options && typeof options !== 'object')) {
      cb(new Error('You must pass a valid first parameter: options'));
      return false;
    }

    if (!options.id && !options.class) {
      cb(new Error('You must pass an "id" or a "class" property values'));
      return false;
    }

    if (!options.lat || !options.lng) {
      cb(new Error('You must pass valid "lat" (latitude) and "lng" (longitude) values'));
      return false;
    }

    return true;
  }

  function load(options, cb) {
    if (validOptions(options, cb)) {
      global.GMP.maps = global.GMP.maps || {};
      global.GMP.maps[options.id] = {
        create: function () {
          create(this.arguments, cb);
        },
        arguments: options
      };

      if (options.async !== false || options.sync === true) {
        gmaps.load(options);
      } else {
        global.GMP.maps[options.id].create();
      }
    }
  }

  return {
    load: load
  };

};

},{"gmplus/config":3,"gmplus/gmaps.js":5,"gmplus/utils":11}],9:[function(require,module,exports){
/*jslint node: true */
"use strict";
var topojson = require('topojson');

module.exports = function (global, that) {

  /**
   * Adds GeoJSON Feature Options like: style
   * @param features
   * @param options
   * @private
   */
  function addFeatureOptions(features, options) {
    var feature, x;
    for (x in features) {
      if (features.hasOwnProperty(x)) {
        feature = features[x];
        if (options.style) {
          that.instance.data.overrideStyle(feature, options.style);
        }
      }
    }
  }

  /**
   * Loads a Topo JSON file into a Map
   * @param data The parsed JSON File
   * @param options
   */
  function loadTopoJson(data, options) {
    var item, geoJson, features,  x;
    for (x in options) {
      if (options.hasOwnProperty(x)) {
        item = options[x];
        geoJson = topojson.feature(data, data.objects[item.object]);
        features = that.instance.data.addGeoJson(geoJson);
        addFeatureOptions(features, item);
        global.GMP.maps[that.id].json = global.GMP.maps[that.id].json || {};
        global.GMP.maps[that.id].json[item.object] = features;
      }
    }
    return features;
  }

  return loadTopoJson;
};

},{"topojson":13}],10:[function(require,module,exports){
/*jslint node: true */
"use strict";
var utils = require('gmplus/utils');
var config = require('gmplus/config');

module.exports = function (global, that) {

  var findAndUpdateMarker = require('gmplus/findUpdateMarker')(global, that);

  function updateMarker(args, options) {
    var type = Object.prototype.toString.call(args);
    var preparedOptions = utils.prepareOptions(options, config.customMarkerOptions);

    if (type === '[object Object]') {
      return findAndUpdateMarker(args, preparedOptions);
    }
    if (type === '[object Array]') {
      var marker, results = [], instance, x;
      for (x in args) {
        if (args.hasOwnProperty(x)) {
          marker = args[x];
          instance = findAndUpdateMarker(marker, preparedOptions);
          results.push(instance);
        }
      }
      return results;
    }
  }

  return updateMarker;

};

},{"gmplus/config":3,"gmplus/findUpdateMarker":4,"gmplus/utils":11}],11:[function(require,module,exports){
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
        result.defaults = result.defaults || {};
        result.defaults[option] = options[option];
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

},{}],12:[function(require,module,exports){
/* global: window */
/*jslint node: true */
"use strict";
window.GMP = require('gmplus/index')(window);

},{"gmplus/index":7}],13:[function(require,module,exports){
!function() {
  var topojson = {
    version: "1.6.18",
    mesh: function(topology) { return object(topology, meshArcs.apply(this, arguments)); },
    meshArcs: meshArcs,
    merge: function(topology) { return object(topology, mergeArcs.apply(this, arguments)); },
    mergeArcs: mergeArcs,
    feature: featureOrCollection,
    neighbors: neighbors,
    presimplify: presimplify
  };

  function stitchArcs(topology, arcs) {
    var stitchedArcs = {},
        fragmentByStart = {},
        fragmentByEnd = {},
        fragments = [],
        emptyIndex = -1;

    // Stitch empty arcs first, since they may be subsumed by other arcs.
    arcs.forEach(function(i, j) {
      var arc = topology.arcs[i < 0 ? ~i : i], t;
      if (arc.length < 3 && !arc[1][0] && !arc[1][1]) {
        t = arcs[++emptyIndex], arcs[emptyIndex] = i, arcs[j] = t;
      }
    });

    arcs.forEach(function(i) {
      var e = ends(i),
          start = e[0],
          end = e[1],
          f, g;

      if (f = fragmentByEnd[start]) {
        delete fragmentByEnd[f.end];
        f.push(i);
        f.end = end;
        if (g = fragmentByStart[end]) {
          delete fragmentByStart[g.start];
          var fg = g === f ? f : f.concat(g);
          fragmentByStart[fg.start = f.start] = fragmentByEnd[fg.end = g.end] = fg;
        } else {
          fragmentByStart[f.start] = fragmentByEnd[f.end] = f;
        }
      } else if (f = fragmentByStart[end]) {
        delete fragmentByStart[f.start];
        f.unshift(i);
        f.start = start;
        if (g = fragmentByEnd[start]) {
          delete fragmentByEnd[g.end];
          var gf = g === f ? f : g.concat(f);
          fragmentByStart[gf.start = g.start] = fragmentByEnd[gf.end = f.end] = gf;
        } else {
          fragmentByStart[f.start] = fragmentByEnd[f.end] = f;
        }
      } else {
        f = [i];
        fragmentByStart[f.start = start] = fragmentByEnd[f.end = end] = f;
      }
    });

    function ends(i) {
      var arc = topology.arcs[i < 0 ? ~i : i], p0 = arc[0], p1;
      if (topology.transform) p1 = [0, 0], arc.forEach(function(dp) { p1[0] += dp[0], p1[1] += dp[1]; });
      else p1 = arc[arc.length - 1];
      return i < 0 ? [p1, p0] : [p0, p1];
    }

    function flush(fragmentByEnd, fragmentByStart) {
      for (var k in fragmentByEnd) {
        var f = fragmentByEnd[k];
        delete fragmentByStart[f.start];
        delete f.start;
        delete f.end;
        f.forEach(function(i) { stitchedArcs[i < 0 ? ~i : i] = 1; });
        fragments.push(f);
      }
    }

    flush(fragmentByEnd, fragmentByStart);
    flush(fragmentByStart, fragmentByEnd);
    arcs.forEach(function(i) { if (!stitchedArcs[i < 0 ? ~i : i]) fragments.push([i]); });

    return fragments;
  }

  function meshArcs(topology, o, filter) {
    var arcs = [];

    if (arguments.length > 1) {
      var geomsByArc = [],
          geom;

      function arc(i) {
        var j = i < 0 ? ~i : i;
        (geomsByArc[j] || (geomsByArc[j] = [])).push({i: i, g: geom});
      }

      function line(arcs) {
        arcs.forEach(arc);
      }

      function polygon(arcs) {
        arcs.forEach(line);
      }

      function geometry(o) {
        if (o.type === "GeometryCollection") o.geometries.forEach(geometry);
        else if (o.type in geometryType) geom = o, geometryType[o.type](o.arcs);
      }

      var geometryType = {
        LineString: line,
        MultiLineString: polygon,
        Polygon: polygon,
        MultiPolygon: function(arcs) { arcs.forEach(polygon); }
      };

      geometry(o);

      geomsByArc.forEach(arguments.length < 3
          ? function(geoms) { arcs.push(geoms[0].i); }
          : function(geoms) { if (filter(geoms[0].g, geoms[geoms.length - 1].g)) arcs.push(geoms[0].i); });
    } else {
      for (var i = 0, n = topology.arcs.length; i < n; ++i) arcs.push(i);
    }

    return {type: "MultiLineString", arcs: stitchArcs(topology, arcs)};
  }

  function mergeArcs(topology, objects) {
    var polygonsByArc = {},
        polygons = [],
        components = [];

    objects.forEach(function(o) {
      if (o.type === "Polygon") register(o.arcs);
      else if (o.type === "MultiPolygon") o.arcs.forEach(register);
    });

    function register(polygon) {
      polygon.forEach(function(ring) {
        ring.forEach(function(arc) {
          (polygonsByArc[arc = arc < 0 ? ~arc : arc] || (polygonsByArc[arc] = [])).push(polygon);
        });
      });
      polygons.push(polygon);
    }

    function exterior(ring) {
      return cartesianRingArea(object(topology, {type: "Polygon", arcs: [ring]}).coordinates[0]) > 0; // TODO allow spherical?
    }

    polygons.forEach(function(polygon) {
      if (!polygon._) {
        var component = [],
            neighbors = [polygon];
        polygon._ = 1;
        components.push(component);
        while (polygon = neighbors.pop()) {
          component.push(polygon);
          polygon.forEach(function(ring) {
            ring.forEach(function(arc) {
              polygonsByArc[arc < 0 ? ~arc : arc].forEach(function(polygon) {
                if (!polygon._) {
                  polygon._ = 1;
                  neighbors.push(polygon);
                }
              });
            });
          });
        }
      }
    });

    polygons.forEach(function(polygon) {
      delete polygon._;
    });

    return {
      type: "MultiPolygon",
      arcs: components.map(function(polygons) {
        var arcs = [];

        // Extract the exterior (unique) arcs.
        polygons.forEach(function(polygon) {
          polygon.forEach(function(ring) {
            ring.forEach(function(arc) {
              if (polygonsByArc[arc < 0 ? ~arc : arc].length < 2) {
                arcs.push(arc);
              }
            });
          });
        });

        // Stitch the arcs into one or more rings.
        arcs = stitchArcs(topology, arcs);

        // If more than one ring is returned,
        // at most one of these rings can be the exterior;
        // this exterior ring has the same winding order
        // as any exterior ring in the original polygons.
        if ((n = arcs.length) > 1) {
          var sgn = exterior(polygons[0][0]);
          for (var i = 0, t; i < n; ++i) {
            if (sgn === exterior(arcs[i])) {
              t = arcs[0], arcs[0] = arcs[i], arcs[i] = t;
              break;
            }
          }
        }

        return arcs;
      })
    };
  }

  function featureOrCollection(topology, o) {
    return o.type === "GeometryCollection" ? {
      type: "FeatureCollection",
      features: o.geometries.map(function(o) { return feature(topology, o); })
    } : feature(topology, o);
  }

  function feature(topology, o) {
    var f = {
      type: "Feature",
      id: o.id,
      properties: o.properties || {},
      geometry: object(topology, o)
    };
    if (o.id == null) delete f.id;
    return f;
  }

  function object(topology, o) {
    var absolute = transformAbsolute(topology.transform),
        arcs = topology.arcs;

    function arc(i, points) {
      if (points.length) points.pop();
      for (var a = arcs[i < 0 ? ~i : i], k = 0, n = a.length, p; k < n; ++k) {
        points.push(p = a[k].slice());
        absolute(p, k);
      }
      if (i < 0) reverse(points, n);
    }

    function point(p) {
      p = p.slice();
      absolute(p, 0);
      return p;
    }

    function line(arcs) {
      var points = [];
      for (var i = 0, n = arcs.length; i < n; ++i) arc(arcs[i], points);
      if (points.length < 2) points.push(points[0].slice());
      return points;
    }

    function ring(arcs) {
      var points = line(arcs);
      while (points.length < 4) points.push(points[0].slice());
      return points;
    }

    function polygon(arcs) {
      return arcs.map(ring);
    }

    function geometry(o) {
      var t = o.type;
      return t === "GeometryCollection" ? {type: t, geometries: o.geometries.map(geometry)}
          : t in geometryType ? {type: t, coordinates: geometryType[t](o)}
          : null;
    }

    var geometryType = {
      Point: function(o) { return point(o.coordinates); },
      MultiPoint: function(o) { return o.coordinates.map(point); },
      LineString: function(o) { return line(o.arcs); },
      MultiLineString: function(o) { return o.arcs.map(line); },
      Polygon: function(o) { return polygon(o.arcs); },
      MultiPolygon: function(o) { return o.arcs.map(polygon); }
    };

    return geometry(o);
  }

  function reverse(array, n) {
    var t, j = array.length, i = j - n; while (i < --j) t = array[i], array[i++] = array[j], array[j] = t;
  }

  function bisect(a, x) {
    var lo = 0, hi = a.length;
    while (lo < hi) {
      var mid = lo + hi >>> 1;
      if (a[mid] < x) lo = mid + 1;
      else hi = mid;
    }
    return lo;
  }

  function neighbors(objects) {
    var indexesByArc = {}, // arc index -> array of object indexes
        neighbors = objects.map(function() { return []; });

    function line(arcs, i) {
      arcs.forEach(function(a) {
        if (a < 0) a = ~a;
        var o = indexesByArc[a];
        if (o) o.push(i);
        else indexesByArc[a] = [i];
      });
    }

    function polygon(arcs, i) {
      arcs.forEach(function(arc) { line(arc, i); });
    }

    function geometry(o, i) {
      if (o.type === "GeometryCollection") o.geometries.forEach(function(o) { geometry(o, i); });
      else if (o.type in geometryType) geometryType[o.type](o.arcs, i);
    }

    var geometryType = {
      LineString: line,
      MultiLineString: polygon,
      Polygon: polygon,
      MultiPolygon: function(arcs, i) { arcs.forEach(function(arc) { polygon(arc, i); }); }
    };

    objects.forEach(geometry);

    for (var i in indexesByArc) {
      for (var indexes = indexesByArc[i], m = indexes.length, j = 0; j < m; ++j) {
        for (var k = j + 1; k < m; ++k) {
          var ij = indexes[j], ik = indexes[k], n;
          if ((n = neighbors[ij])[i = bisect(n, ik)] !== ik) n.splice(i, 0, ik);
          if ((n = neighbors[ik])[i = bisect(n, ij)] !== ij) n.splice(i, 0, ij);
        }
      }
    }

    return neighbors;
  }

  function presimplify(topology, triangleArea) {
    var absolute = transformAbsolute(topology.transform),
        relative = transformRelative(topology.transform),
        heap = minAreaHeap();

    if (!triangleArea) triangleArea = cartesianTriangleArea;

    topology.arcs.forEach(function(arc) {
      var triangles = [],
          maxArea = 0,
          triangle;

      // To store each point’s effective area, we create a new array rather than
      // extending the passed-in point to workaround a Chrome/V8 bug (getting
      // stuck in smi mode). For midpoints, the initial effective area of
      // Infinity will be computed in the next step.
      for (var i = 0, n = arc.length, p; i < n; ++i) {
        p = arc[i];
        absolute(arc[i] = [p[0], p[1], Infinity], i);
      }

      for (var i = 1, n = arc.length - 1; i < n; ++i) {
        triangle = arc.slice(i - 1, i + 2);
        triangle[1][2] = triangleArea(triangle);
        triangles.push(triangle);
        heap.push(triangle);
      }

      for (var i = 0, n = triangles.length; i < n; ++i) {
        triangle = triangles[i];
        triangle.previous = triangles[i - 1];
        triangle.next = triangles[i + 1];
      }

      while (triangle = heap.pop()) {
        var previous = triangle.previous,
            next = triangle.next;

        // If the area of the current point is less than that of the previous point
        // to be eliminated, use the latter's area instead. This ensures that the
        // current point cannot be eliminated without eliminating previously-
        // eliminated points.
        if (triangle[1][2] < maxArea) triangle[1][2] = maxArea;
        else maxArea = triangle[1][2];

        if (previous) {
          previous.next = next;
          previous[2] = triangle[2];
          update(previous);
        }

        if (next) {
          next.previous = previous;
          next[0] = triangle[0];
          update(next);
        }
      }

      arc.forEach(relative);
    });

    function update(triangle) {
      heap.remove(triangle);
      triangle[1][2] = triangleArea(triangle);
      heap.push(triangle);
    }

    return topology;
  };

  function cartesianRingArea(ring) {
    var i = -1,
        n = ring.length,
        a,
        b = ring[n - 1],
        area = 0;

    while (++i < n) {
      a = b;
      b = ring[i];
      area += a[0] * b[1] - a[1] * b[0];
    }

    return area * .5;
  }

  function cartesianTriangleArea(triangle) {
    var a = triangle[0], b = triangle[1], c = triangle[2];
    return Math.abs((a[0] - c[0]) * (b[1] - a[1]) - (a[0] - b[0]) * (c[1] - a[1]));
  }

  function compareArea(a, b) {
    return a[1][2] - b[1][2];
  }

  function minAreaHeap() {
    var heap = {},
        array = [],
        size = 0;

    heap.push = function(object) {
      up(array[object._ = size] = object, size++);
      return size;
    };

    heap.pop = function() {
      if (size <= 0) return;
      var removed = array[0], object;
      if (--size > 0) object = array[size], down(array[object._ = 0] = object, 0);
      return removed;
    };

    heap.remove = function(removed) {
      var i = removed._, object;
      if (array[i] !== removed) return; // invalid request
      if (i !== --size) object = array[size], (compareArea(object, removed) < 0 ? up : down)(array[object._ = i] = object, i);
      return i;
    };

    function up(object, i) {
      while (i > 0) {
        var j = ((i + 1) >> 1) - 1,
            parent = array[j];
        if (compareArea(object, parent) >= 0) break;
        array[parent._ = i] = parent;
        array[object._ = i = j] = object;
      }
    }

    function down(object, i) {
      while (true) {
        var r = (i + 1) << 1,
            l = r - 1,
            j = i,
            child = array[j];
        if (l < size && compareArea(array[l], child) < 0) child = array[j = l];
        if (r < size && compareArea(array[r], child) < 0) child = array[j = r];
        if (j === i) break;
        array[child._ = i] = child;
        array[object._ = i = j] = object;
      }
    }

    return heap;
  }

  function transformAbsolute(transform) {
    if (!transform) return noop;
    var x0,
        y0,
        kx = transform.scale[0],
        ky = transform.scale[1],
        dx = transform.translate[0],
        dy = transform.translate[1];
    return function(point, i) {
      if (!i) x0 = y0 = 0;
      point[0] = (x0 += point[0]) * kx + dx;
      point[1] = (y0 += point[1]) * ky + dy;
    };
  }

  function transformRelative(transform) {
    if (!transform) return noop;
    var x0,
        y0,
        kx = transform.scale[0],
        ky = transform.scale[1],
        dx = transform.translate[0],
        dy = transform.translate[1];
    return function(point, i) {
      if (!i) x0 = y0 = 0;
      var x1 = (point[0] - dx) / kx | 0,
          y1 = (point[1] - dy) / ky | 0;
      point[0] = x1 - x0;
      point[1] = y1 - y0;
      x0 = x1;
      y0 = y1;
    };
  }

  function noop() {}

  if (typeof define === "function" && define.amd) define(topojson);
  else if (typeof module === "object" && module.exports) module.exports = topojson;
  else this.topojson = topojson;
}();

},{}]},{},[12]);
