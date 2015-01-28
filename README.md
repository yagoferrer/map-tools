## gmplus.js 0.1.0 
[![Build](https://travis-ci.org/yagoferrer/gmplus.svg)](https://travis-ci.org/yagoferrer/gmplus) 
[![Coverage](https://coveralls.io/repos/yagoferrer/gmplus/badge.svg)](https://coveralls.io/r/yagoferrer/gmplus)
[![devDependency](https://david-dm.org/yagoferrer/gmplus/dev-status.svg)](https://david-dm.org/yagoferrer/gmplus#info=devDependencies)

gmplus.js is a Google Maps Feature-rich Javascript wrapper that makes things like [Marker filtering](#crossfilter-support), [asynchronous loading](#load-a-simple-map-async) and [animation](#animate-markers) much simpler with an easy-to-use API.


## Benefits of using gmplus.js: 
- Less Code: The [Google Maps API](https://developers.google.com/maps/documentation/javascript/reference) is of considerable size, you'll be writing way **less** code.
- More Fun: Add [Marker animations](#animate-markers), use [handlebars style](#info-bubble) variables.
- Easy To Use: Intuitive APIs, easy to understand.
- Non Intrusive: it extends the API, you can use any other native methods, properties and events anywhere.
- [Crossfilter Support](#crossfilter-support): Query Markers and change visibility using the power of Crossfilter.
- 100% tested

This page reflects the **latest** documentation from the `master` branch. Please use [this documentation page](https://github.com/yagoferrer/gmplus/tree/0.1.0) as a reference for the latest release: [0.1.0](https://github.com/yagoferrer/gmplus/releases)

## Get Started
Bower: 
```bash
bower install gmplus --save-dev
```
NPM: 
```bash
npm install gmplus --save-dev
```
Direct download: [gmplus.min.js](https://github.com/yagoferrer/gmplus/blob/0.1.0/dist/gmplus.min.js)
 
## Run examples
```bash
git pull https://github.com/yagoferrer/gmplus.git
cd gmplus
npm start
```

## Load a simple Map async
No need to include the Google Maps `<script>` tag. gmplus.js will load the file for you.
Setup a callback to notify you when the Map is fully loaded.
```javascript
var map = new GMP({
  id: 'myMap',
  lat: 41.3833,
  lng: 2.1833
}, function (err, instance) {

  if (!err) {
    console.log('Hey! the Map was fully loaded! Add some Markers :)');
  }

});
```
By default it will load the latest version of Google Maps. You can pass a specific version using the `version` option. For example: `{version: 3.17}`

Add a simple HTML tag
```html
<div id="myMap"></div>
```
You can set any other native Map [Reference](https://developers.google.com/maps/documentation/javascript/reference#Map) option. It just works. For example:
```javascript
{
    disableDoubleClickZoom: true,
    mapTypeControl: false,
    streetViewControl: false,
    zoom: 15
}
```

Once instantiated: you can access directly to the Google API like this: `GMP.maps.myMap.instance`

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
The 2nd parameter of `addMarker`, allows you to add options that apply to all the Markers within the Array.

You can set any other native [Marker Options](https://developers.google.com/maps/documentation/javascript/reference#MarkerOptions)

Once the Markers are created, you can access directly like this: `GMP.maps.myMap.markers`


#### Animate Markers
Make your marker bounce `move: map.bounce` or drop `move: map.drop`

```javascript
map.addMarker({
  lat: 41.3833,
  lng: 2.1833,
  title: 'Barcelona',
  move: map.bounce
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
Since [0.2.0](https://github.com/yagoferrer/gmplus/releases/tag/0.2.0) you can use curly brackets to display variables from `data`
You can set any other [infoWindow options](https://developers.google.com/maps/documentation/javascript/reference#InfoWindowOptions) inside `bubble`.
The default **event** is `click` but you can change it with the `event` property.


## Crossfilter support
- Add Marker related data into the `data` property. 
- Add a [Crossfilter](https://github.com/square/crossfilter) instance when instantiating the Map.
- Create dimensions.

```javascript
  var markers = crossfilter([]);
  var population = markers.dimension(function(d) { return d.population; });

  var map = new GMP({
    id: 'myMap',
    lat: 40.419795,
    lng: -3.710436,
    crossfilter: markers
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
map.updateMarker(population.top(1), {move: map.bounce});
```

## How can you contribute?
Get involved! Check out the list of [feature requests](https://github.com/yagoferrer/gmplus/issues). All PRs and ideas are welcome.
