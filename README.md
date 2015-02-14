## Gmplus.js 0.3.0 
[![Build](https://travis-ci.org/yagoferrer/gmplus.svg?branch=master)](https://travis-ci.org/yagoferrer/gmplus) 
[![Coverage](https://coveralls.io/repos/yagoferrer/gmplus/badge.svg)](https://coveralls.io/r/yagoferrer/gmplus)
[![Code Climate](https://codeclimate.com/github/yagoferrer/gmplus/badges/gpa.svg)](https://codeclimate.com/github/yagoferrer/gmplus)
[![Dependency Status](https://david-dm.org/yagoferrer/gmplus.svg)](https://david-dm.org/yagoferrer/gmplus)
[![devDependency](https://david-dm.org/yagoferrer/gmplus/dev-status.svg)](https://david-dm.org/yagoferrer/gmplus#info=devDependencies)

Gmplus.js is a Google Maps Feature-rich Javascript wrapper that makes things like: 
[Marker filtering](#crossfilter-support-for-markers), [asynchronous loading](#load-a-simple-map-async), working with [TopoJSON](#topojson-support) or [GeoJSON](#geojson-support), [animation](#animate-markers) and more. Much simpler with an easy-to-use API.


## Benefits
- Less Code: The [Google Maps API](https://developers.google.com/maps/documentation/javascript/reference) it is of considerable size. You'll be writing way **less** code with Gmplus.js
- More Fun: Add [Marker animations](#animate-markers), use [handlebars style](#info-bubble) variables.
- Easy To Use: Intuitive APIs, easy to understand.
- Non Intrusive: it extends the API, you can use any other native methods, properties and events anywhere.
- [Crossfilter Support for Markers](#crossfilter-support-for-markers): Query Markers and change any options using the power of Crossfilter.
- [TopoJSON Support](#topojson-support): Add Topo/GeoJSON files, set styles and find references easier. 
- 100% tested

## Get Started
Bower: 
```bash
bower install gmplus --save-dev
```
NPM: 
```bash
npm install gmplus --save-dev
```
Direct download: [gmplus.min.js](https://github.com/yagoferrer/gmplus/blob/0.3.0/dist/gmplus.min.js)
 
## Run examples
```bash
git pull https://github.com/yagoferrer/gmplus.git
cd gmplus
npm start
```

## Load a simple Map async
No need to include the Google Maps `<script>` tag. Gmplus.js will load the file for you.
Setup a callback to notify you when the Map is fully loaded.
```javascript
var map = new GMP({
  id: 'mymap',
  lat: 41.3833,
  lng: 2.1833
}, function (err, instance) {
  if (!err) {
    console.log('Hey! the Map was fully loaded! Add some Markers :)');
  }
});
```
You can also use: `el: '.mymap'`, instead of `id` to specify a query selector.

By default it will load version [3.18](https://github.com/yagoferrer/gmplus/blob/0.3.0/lib/gmplus/defaults.js) of Google Maps. You can pass a specific version using the `version` option.

Add a simple HTML tag
```html
<div id="mymap"></div>
```
### Map Types
Default map types are : ROADMAP, SATELLITE, HYBRID and TERRAIN
example:
```javascript
{
 el: '.mymap',
 lat: 41.3833,
 lng: 2.1833
 type: 'TERRAIN'
}
```

Add more [Map Options](https://developers.google.com/maps/documentation/javascript/reference#MapOptions). It just works. For example:
```javascript
{
    disableDoubleClickZoom: true,
    mapTypeControl: false,
    streetViewControl: false,
    zoom: 15
}
```

### Update Map 
Update any option by calling the updateMap method like this example:
```javavascript
map.updateMap({zoom: 6});
```

Once instantiated: you can access directly to the Google API like this: `GMP.maps.mymap.instance`

## Markers

#### Add One Marker
```javascript
map.addMarker({
     lat: 41.3833,
     lng: 2.1833,
     title: 'Barcelona'
     });
```

#### Add Multiple Markers

```javascript
map.addMarker([
    {
      lat: 41.3833,
      lng: 2.1833,
      title: 'Barcelona'
    },
    {
      lat: 42.5000,
      lng: 1.5167,
      title: 'Andorra'
    }
  ], {icon: 'images/city.png'});
```
Add any other [Marker Options](https://developers.google.com/maps/documentation/javascript/reference#MarkerOptions)

The 2nd parameter of `addMarker`, allows you to add options that apply to all the Markers within the Array.

Once the Markers are created, you can access directly like this: `GMP.maps.mymap.markers.all`

#### Update Marker
Allows you to update one or multiple marker options. The 1st parameter can be: a result of Crossfilter, a Marker reference or the uid like this: `{uuid: '<uuid>'}`

The 2nd parameter is an object with a list of options. For example: `visible` to change the Marker visibilty.

```javascript
map.updateMarker(<marker>, {visible: false})
```

You can also use `lat` and `lng` to change the position of the Marker and many other options.


#### Animate Markers
Make your marker bounce `move: 'bounce'` or drop `move: 'drop'`

```javascript
map.addMarker({
  lat: 41.3833,
  lng: 2.1833,
  title: 'Barcelona',
  move: 'bounce'
});
```

#### Marker Groups
Marker Groups are a persistent high level group that allows you to work with a set of Markers.
You can create Groups and then associate Markers. Groups are great to apply options to a set of Markers.  
```javascript
map.addGroup('myGroup', {visible: false});

map.addMarker({
  lat: 41.3833,
  lng: 2.1833,
  title: 'Barcelona',
  group: 'myGroup'
});
// Markers are added to the Map but not visible.

map.updateGroup('myGroup', {visible: true});
// Updates all the Markers to be visible.
```

#### Info Bubble

Adds an info bubble with HTML content.
```javascript
map.addMarker({
  lat: 41.3833,
  lng: 2.1833,
  bubble: {
    event: 'mouseover',
    content: '<p>{city} City</p>'
  },
  data: {
    city: 'Barcelona'
  }
});
```
Use curly brackets to display variables from `data` 

Add more [infoWindow options](https://developers.google.com/maps/documentation/javascript/reference#InfoWindowOptions) inside `bubble`.
The default **event** is `click` but you can change it with the `event` property.


## Crossfilter support for Markers
- Add Marker related data into the `data` property. 
- Add what data properties you want to index into the `indexes` option. That will generate default Crossfilter [dimensions](https://github.com/square/crossfilter/wiki/API-Reference#dimension).
 
```javascript
  var map = new GMP({
    id: 'mymap',
    lat: 40.419795,
    lng: -3.710436,
    indexes: ['population']
  }, function (err, instance) {
    if (!err) {
      addMarker();
    }
  });

  function addMarker() {
    map.addMarker([
      {
        lat: 41.3833,
        lng: 2.1833,
        data: {
          name: 'Barcelona',
          population: 1621000
        }
      },
      {
        lat: 40.419795,
        lng: -3.710436,
        data: {
          name: 'Madrid',
          population: 3234000
        }
      }
    ]);
  }
```
Now you can use the power of Crossfilter to update Markers. In this example it finds the city with larger population, Madrid, and makes the marker to bounce.
```javascript
map.updateMarker(map.markers.filter.population.top(1), {move: 'bounce'});
```

You can also pass custom Crossfilter dimensions to the `indexes` option:
```javascript
indexes: [{population: function(d) { /* special calculation here */ }]

```

## GeoJSON support
You can add a GeoJSON file like this:
```javascript
map.addGeoJson(<parsed JSON>)
```

## TopoJSON support

Once the Map is loaded, you can add a TopoJSON file. Pass an Array of objects containing the **object** to load into the Map.

```javascript
map.addTopoJson(<parsed JSON>, [{object: 'states'}, {object: 'counties'}]);
```

#### Apply styles to Features

You can set `style` options to specify the way a Feature should appear when displayed on a map.

```javascript
{
  object: 'states',
  style: {
    strokeColor: 'red',
    strokeWeight: 2,
    fillOpacity: 0
  }
}
      
```
Add more [Style Options](https://developers.google.com/maps/documentation/javascript/reference#Data.StyleOptions)

Once the Features are created, you can access directly like this: `GMP.maps.mymap.json.groups.states` and `GMP.maps.mymap.json.groups.counties`


## How can you contribute?
Get involved! Check out the list of [feature requests](https://github.com/yagoferrer/gmplus/issues). All PRs and ideas are welcome.
