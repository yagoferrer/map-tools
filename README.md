## map-tools 2.0.0

[![Build](https://travis-ci.org/yagoferrer/map-tools.svg?branch=master)](https://travis-ci.org/yagoferrer/map-tools)
[![Coverage](https://coveralls.io/repos/yagoferrer/map-tools/badge.svg?branch=master)](https://coveralls.io/r/yagoferrer/map-tools)
[![Code Climate](https://codeclimate.com/github/yagoferrer/map-tools/badges/gpa.svg?branch=master)](https://codeclimate.com/github/yagoferrer/map-tools)
[![Dependency Status](https://david-dm.org/yagoferrer/map-tools.svg)](https://david-dm.org/yagoferrer/map-tools)
[![devDependency](https://david-dm.org/yagoferrer/map-tools/dev-status.svg)](https://david-dm.org/yagoferrer/map-tools#info=devDependencies)

[map-tools](http://map-tools.io/) is a Google Maps Feature-rich Javascript wrapper that makes things like:
[Marker Tagging](#tags); [asynchronous loading](#lazy-loading-the-map), working with [TopoJSON](#topojson-support) or [GeoJSON](#geojson-support), [custom controls](#add-panel), [animation](#animate-markers) and more. Much simpler with an easy-to-use API.


## Benefits
- Less Code: The [Google Maps API](https://developers.google.com/maps/documentation/javascript/reference) it is of considerable size. You'll be writing way **less** code with map-tools.js
- It helps you to keep track of elements created on the Map. Use [findMarker()](#find-marker) to find Markers by properties.
- More Fun: Add [Marker animations](#animate-markers), use [handlebars style](#info-window) variables.
- Non Intrusive: it extends the API; you can use any other native methods, properties and events anywhere.
- Query elements on the Map to update their options using [Crossfilter](#crossfilter-support-for-markers)
- [TopoJSON Support](#topojson-support): Add Topo/GeoJSON files, set styles and find references easier.
- Well tested. Good GPA rating.
- Framework agnostic.
- My ultimate goals are performance and Google API simplification.

## Get Started

it is recommended to use [npm](https://docs.npmjs.com/getting-started/what-is-npm) to install `map-tools` but you can also use *bower*.

NPM:
```bash
npm install map-tools --save-dev
```

Bower:
```bash
bower install map-tools --save-dev
```

Do you need to download it now? Use the direct download link. [map-tools.min.js](https://github.com/yagoferrer/map-tools/blob/2.0.0/dist/map-tools.min.js)

## Need Quick Examples?

Go to: [map-tools.io](http://map-tools.io/)

or pull the repo and run:
```bash
npm start
```

### Lazy Loading the Map
You can load the Google Maps JavaScript file asynchronously. This is useful for example: if you are planning on loading the Map on a different view from the Homepage.
Setting a callback function will help you to now when the Map is ready to be used.

If you don't want to lazy load the map, use the option `async: false` you can still keep the callback function to determine when the Map is ready to be used.

[Live example] (http://map-tools.io/examples/simple.map.html)

```javascript
var map = new mapTools({
  id: 'mymap',
  lat: 41.3833,
  lng: 2.1833
}, function (err, map) {
  if (!err) {
    console.log('Map Loaded!', map.instance);
  }
});
```

The first argument `id` represents the `id` of the HTML element container where you want to display the Map. If you want to use a `class` instead use `el: '.mymap'` to indicate the class name.


`lat` and `lng` are the coordenates used to first load the Map.

The callback function contains two arguments:
- `err` it will contain an error object in case something goes wrong during Map initialization.
- `map` the mapTools instanciated object. You can use this to trigger further API calls.

`id`, `lat` and `lng` are custom helpers that added to quicky create a Map but you can add many other *native* [Map Options](https://developers.google.com/maps/documentation/javascript/reference#MapOptions) take a look to the Google Maps reference.

Here it is what I think some other useful options:
```javascript
{
  disableDoubleClickZoom: true, // Disable double click zoom in google maps while drawing.
  streetViewControl: false // Disables the street view mode.
  scaleControl: true // Scale control that provides a simple map scale.
}
```

#### Map Option Helpers
This Google property is silly: `google.maps.MapTypeId.SATELLITE`. With map-tools, you can simple use:
```javascript
{
  type: 'SATELLITE'
}  
```
Other types are: ROADMAP, HYBRID and TERRAIN.


## HTML

Don't forget to add a simple HTML tag to indicate where to render the Map.

```html
<div id="mymap"></div>
```

### Google Maps Native Instance
Sometimes you just need to go straight to the Google Maps API.
Once the Map is initialized you can either use: `map.instance` or globally `mapTools[YourMapId].instance`.
Notice that if you have multiple Maps, you can access all from the global scope.

### Map Events
Adding listeners for Map events it is easy. You can add handlers for any of the [Native Map Events] (https://developers.google.com/maps/documentation/javascript/events) using the `on` syntax.

[Live example](http://map-tools.io/examples/simple.map.html)

```javascript
var map = new mapTools({
  on: {
      zoom_changed: function() {
        console.log('the zoom level has changed!', map.zoom())
      }
  }  
```
### Custom Map Events
- `marker_visibility_changed` it will get trigger anytime that any Marker changes visibility state.

[Live example](http://map-tools.io/examples/custom.events.html)
```javascript
var map = new mapTools({
  on: {
      marker_visibility_changed: function(numOfVisibleMarkers) {
        console.log('we have a total of %d visible Markers', numOfVisibleMarkers)
      }
  }
```
This event it is very useful if you are planning for example on clustering based on this value.

## Map Methods

#### Update Map
Apply *ANY* option to the Map by calling the `updateMap()` method like this example:

[Live example](http://map-tools.io/examples/update.map.html)
```javascript
map.updateMap({type: 'TERRAIN'});
```

#### Center Map
There are two ways you can use this method:
- Center the current Map using coordinates provided during initialitation.
```javascript
map.center();
```
- Pass specific latitude and longitude coordinates to jump into a location.
```javascript
map.center(41.3833, 2.1833);
```

#### Zoom Map
With this method you can either:
- Retrive the current Map Zoom Level
```javascript
map.zoom();
// Result: 8
```
- Set the Map to specific Zoom level.
```javascript
map.zoom(12);
```

#### Get Current Map Center Position
```javascript
map.locate()
// Result: {lat: 41.3833, lng: 2.1833}
```

## Markers
Adding Markers is simple. Use the `addMarker()` method to add **one or multiple** Markers at the same time. The method will return a reference of the Marker(s) added. It will also save a reference under `map.markers.all[uid]` The uid is either
an unique value that you can provide under `data.uid` or a self-generated value created by map-tools.

[Live example](http://map-tools.io/examples/add.marker.html)

```javascript
map.addMarker([{
  lat: 41.3833,
  lng: 2.1833,
  title: 'Barcelona',
  on: {
    click: function() {
      alert(this.title);
    }
  },
  data: {
    population: 1700000
  }
},
{
  lat: 42.5000,
  lng: 1.5167,
  title: 'Andorra'
}],
{
  icon: 'images/city.png',
  callback: function(instance) {
    console.log('Marker Added', instance);
  }
});

```
`lat` and `lng` provides the coordinates to position the Marker.

Use `on` to define any Marker Events.

The 2nd argument allows you to add options **shared** between the Markers you are adding.

You can also add any other [Native Marker Options](https://developers.google.com/maps/documentation/javascript/reference#MarkerOptions)

The callback property allows to set a callback function that contains the instance of the Marker. This is useful if for example: You add many Markers at once, but you need to do some additional logic once the Marker is added.



#### Update Marker
Allows you to update one or multiple marker options.

[Live example](http://map-tools.io/examples/update.marker.html)

```javascript
map.updateMarker(<marker reference>, {visible: false})
```

The 1st argument can be: A Marker (reference) an Array of Markers or the `uid` specified like this: `{uid: '<uid>'}`

The 2nd argument allows you to set any options you want to update.

For example: `visible` to change the Marker visibilty.

#### Remove Marker
Allows you to delete *one or multiple* Markers. If you *don't* pass any parameter it will delete *ALL* Markers in the Map.

```javascript
map.removeMarker([<marker reference>, <marker reference>]);
```

#### Find Marker
With the power of Crossfilter, findMarker() allows you to find any Marker based on a `property` or a `Marker.data` property value.

This example will return all the Markers visible on the Map.
```javascript
map.findMarker({visible: true})
```

This example will find the Marker that the lowest `data.population` value
```javascript
map.findMarker('population', {order: 'DESC', limit: 1})
```
You can test this query at this [Live example](http://map-tools.io/examples/data.querying.html)


#### Tags
Allows you to Tag a specific Marker to later search or update based on that tag value.

You can set a `tags` property to a Marker

[Live example](http://map-tools.io/examples/tags.html)

```javascript
map.addMarker({
  lat: 42.5000,
  lng: 1.5167,
  title: 'Andorra'
  tags: 'cities'
});
```
You can either set a **string** or an Array of tags

And then find the Marker's reference that have this tag.
```javascript
map.findMarker({tags: 'cities'})
```

You could also update a Marker using their tag.
```javascript
map.updateMarker({tags: 'countries'}, {visible: false})
```

At any moment you can add or remove tags from a Marker.
```javascript
map.updateMarker({tags: 'countries'}, {tags: ['countries', 'EU']})
```


#### Reset Marker
This is one of my favorite features. Sometimes you just want to reset some Marker properties to the original value that was set on the initial creation. This method allows you to reset **one or multiple** Markers to the initial state.

```javascript
map.resetMarker(<marker instance>, ['icon', 'lat', 'lng']);
```

The 2nd argument can be either a string or an Array of the properties that you want to *reset*


#### Animate Markers
Make your marker bounce `move: 'bounce'` or drop `move: 'drop'`

```javascript
map.addMarker({
  lat: 41.3833,
  lng: 2.1833,
  move: 'bounce'
});
```

#### InfoWindow
The infoWindow is the hover bubble to provide more information about the Marker. The `open` and `close` properties
allow you to specify what Marker event to use to display or hide the infoWindow.

```javascript
map.addMarker({
  lat: 41.3833,
  lng: 2.1833,
  infoWindow: {
    open: {on: 'mouseover'},
    close: {on: 'mouseout', duration: 2000},
    content: '<p>{city} City</p>'
  },
  data: {
    city: 'Barcelona'
  }
});
```

the 2nd parameter `duration` allows you to specify a delay for that event. This is really useful if you want to keep
the infoWindow open for a few seconds before closing after you `mouseout`.

In this example: the `open` and `close` events are different `mouseover` and `mouseout` but you could specify exactly the same event `click`. That will trigger toggle effect on `click`

The `data` property is used to store any extra information related to the Marker. You can use curly brakets, for example:
`{city}` within the `content` property, to act as a variable that references to the `data` property.


You can add more [native infoWindow options](https://developers.google.com/maps/documentation/javascript/reference#InfoWindowOptions) inside `infoWindow`.


## Crossfilter support for Markers
- Add Marker related data into the `data` property.
- Add what data properties you want to index into the `filters` option. That will generate default Crossfilter [dimensions](https://github.com/square/crossfilter/wiki/API-Reference#dimension).

```javascript
  function addMarkers() {
    map.addMarker([
      {
        lat: 41.3833, lng: 2.1833,
        data: {
          name: 'Barcelona',
          population: 1621000
        }
      },{
        lat: 41.3833, lng: -3.710436,
        data: {
          name: 'Madrid',
          population: 3234000
        }
      }
    ], {
      filters: ['population']
    });
  }

  var map = new mapTools({id: 'mymap', lat: 41.3833, lng: -3.710436},
  function (err, map) {
    if (!err) {
      addMarkers();
    }
  });
```
Now you can use the power of Crossfilter to update Markers. In this example it finds the city with larger population, Madrid, and makes the marker to bounce.
```javascript
var marker = map.findMarker('population', {limit: 1});
map.updateMarker(marker, {move: 'bounce'});
```

You can also pass custom Crossfilter dimensions to the `filters` option:
```javascript
filters: [{population: function(d) { /* special calculation here */ }]

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

#### Update styling of existing Features

You can update the `style` of the existing Feature on a map.

```javascript
 var colorado = map.findFeature({NAME:'Colorado'}, {limit: 1});
 var nevada = map.findFeature({NAME:'Nevada'}, {limit: 1});
 var style = {fillOpacity: 0.4, fillColor:'black', strokeColor: 'black'};
 map.updateFeature([colorado,nevada], {style: style});
```

You can also update the `style` of a group of features by a mapping function.

```javascript
function color() {
var value = (this.data.CENSUSAREA/570640.95);
var alpha = 5;
var h = 210, s = 100,
l = (Math.pow((1 - value), alpha) * 50)+50;
return {
	fillColor: 'hsl('+h+','+s+'%,'+l+'%)',
	fillOpacity:0.7
	}
};

var all = map.findFeature();
map.updateFeature(all, {style: color});
```

## Crossfilter support for Features

You can use a Crossfilter result to update features. In this example it finds the State named: 'Texas' and updates the background color.

```javascript
var feature = map.findFeature({NAME:'Colorado'}, {limit: 1});
map.updateFeature(feature, {style: {fillColor:'black'}})
```

Add more [Style Options](https://developers.google.com/maps/documentation/javascript/reference#Data.StyleOptions)



## Add Panel
Adds a custom native Control to Google Maps

```javascript
 map.addPanel({
    templateURL: 'templates/custom.panel.html',
    position:'top center',
    events: {
      '.menu li click' : function (e) {
        e.target.classList.toggle('active');
      }}
  });
```

## Add Angular.js template into a Map Panel.
You can inject an Angular template and benefit from two way binding. You'll need to pre-compile the template like this:

```javascript
var template = '<div>{{scopeVar}}</div>';
map.addPanel({
  position: 'top right',
  template: $compile(template)($scope)[0]
})
```

## Meteor Users
You can use map-tools as it is but I'm working on a lab project for map-tools.js + Meteor integration. Please go to: [meteor-map-tools](https://github.com/yagoferrer/meteor-map-tools) for more information.

## How can you contribute?
Get involved! Check out the list of [feature requests](https://github.com/yagoferrer/map-tools/issues). All PRs and ideas are welcome.

##Sponsors
Thank you so much to all our sponsors for providing free licenses:
[WebStorm](https://www.jetbrains.com/webstorm/), [Code Climate](https://codeclimate.com/), [Travis](https://travis-ci.com/) and [Coveralls] (https://coveralls.io/)
