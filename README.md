## map-tools 0.9.0 
[![Build](https://travis-ci.org/yagoferrer/map-tools.svg?branch=master)](https://travis-ci.org/yagoferrer/map-tools) 
[![Coverage](https://coveralls.io/repos/yagoferrer/map-tools/badge.svg?branch=master)](https://coveralls.io/r/yagoferrer/map-tools)
[![Code Climate](https://codeclimate.com/github/yagoferrer/map-tools/badges/gpa.svg?branch=master)](https://codeclimate.com/github/yagoferrer/map-tools)
[![Dependency Status](https://david-dm.org/yagoferrer/map-tools.svg)](https://david-dm.org/yagoferrer/map-tools)
[![devDependency](https://david-dm.org/yagoferrer/map-tools/dev-status.svg)](https://david-dm.org/yagoferrer/map-tools#info=devDependencies)

[map-tools](http://map-tools.io/) is a Google Maps Feature-rich Javascript wrapper that makes things like: 
[Marker filtering](#crossfilter-support-for-markers); [asynchronous loading](#start-by-loading-the-map-async), working with [TopoJSON](#topojson-support) or [GeoJSON](#geojson-support), [custom controls](#add-panel), [animation](#animate-markers) and more. Much simpler with an easy-to-use API.


## Benefits
- Less Code: The [Google Maps API](https://developers.google.com/maps/documentation/javascript/reference) it is of considerable size. You'll be writing way **less** code with map-tools.js
- More Fun: Add [Marker animations](#animate-markers), use [handlebars style](#info-window) variables.
- Easy To Use: Intuitive APIs, easy to understand.
- Non Intrusive: it extends the API; you can use any other native methods, properties and events anywhere.
- Query elements on the Map to update their options using [Crossfilter](#crossfilter-support-for-markers)
- [TopoJSON Support](#topojson-support): Add Topo/GeoJSON files, set styles and find references easier. 
- Well tested. Good GPA rating. 
- Framework agnostic.

## Get Started
Bower (Recommended):
```bash
bower install map-tools --save-dev
```
NPM: 
```bash
npm install map-tools --save-dev
```
Direct download: [map-tools.min.js](https://github.com/yagoferrer/map-tools/blob/0.9.0/dist/map-tools.min.js)

## Examples:

You can either go to: [map-tools.io](http://map-tools.io/) or pull the repo and run:
```bash
npm start
```

### Start by loading the Map Async
There is no need to include the Google Maps `<script>` tag. **map-tools** will load the file for you asynchronously.
Setting a callback function to notify you when the Map is fully loaded it will help you to do things that depend on the Map.
```javascript
var map = new mapTools({
  id: 'mymap',
  lat: 41.3833,
  lng: 2.1833
}, function (err, map) {
  if (!err) {
    console.log('Hey! the Map was fully loaded! Add some Markers :)');
  }
});
```
You can also use: `el: '.mymap'`, instead of `id` to specify a query selector.

By default it will load version [3.18](https://github.com/yagoferrer/map-tools/blob/0.9.0/lib/map-tools/defaults.js) of Google Maps. You can pass a specific version using the `version` option.

Add a simple HTML tag
```html
<div id="mymap"></div>
```

### Map Native Instance
There are two ways to access directly to the Google Maps API: `map.instance` or `mapTools[YourMapId].instance`

### Map Events

You can listen for Map events when creating a new Map.

```javascript
var map = new mapTools({
  on: {
      zoom_changed: function() {
        console.log('the zoom level has changed!', map.zoom())
      }
  }  
...

```
## Map Methods

#### Update Map 
Update any option by calling the updateMap method like this example:
```javascript
map.updateMap({type: 'TERRAIN'});
```

Default map types are : ROADMAP, SATELLITE, HYBRID and TERRAIN.
Add more [Map Options](https://developers.google.com/maps/documentation/javascript/reference#MapOptions) from the Google Maps API and it will work just fine. For example:
```javascript
{
    disableDoubleClickZoom: true,
    mapTypeControl: false,
    streetViewControl: false
}
```

#### Center Map
Call this method to center the Map.
```javascript
map.center();
```
If you pass latitude and longitude coordinates it will center the Map using the coordinates provided
```javascript
map.center(41.3833, 2.1833);
```

#### Zoom Map
Zoom map into a specific Zoom level.
```javascript
map.zoom(12);
```

#### Get the current Zoom Level.
```javascript
map.zoom();
// Result: 8
```

#### Get Current Map Center Position
```javascript
map.locate()
// Result: {lat: 41.3833, lng: 2.1833}
```

## Markers

#### Add One Marker
```javascript
map.addMarker({
  lat: 41.3833,
  lng: 2.1833,
  title: 'Barcelona',
  on: {
    click: function() {
      alert('Barcelona!');
    }
  }  
});
```
Once you add a Marker, it will generate a unique identifier to save a reference of the Marker under `map.markers.all[uid]`. 
There are a couple of ways to setup a custom uid.
**data.uid**
```javascript
map.addMarker({
  lat: 41.3833,
  lng: 2.1833,
  data: {
   uid: "257c726053"
  }
});
```
Or custom a property. This is handy if the only data property is a unique identifier.

```javascript
var map = new mapTools({
  id: 'mymap',
  lat: 41.3833,
  lng: 2.1833,
  uid: 'custom_id',
}, function (err, map) {
  if (!err) {
    map.addMarker({
      lat: 41.3833,
      lng: 2.1833,
      uid: "257c726053"
    });
  }
});
```


#### Add Multiple Markers

```javascript
map.addMarker([{
      lat: 41.3833,
      lng: 2.1833,
      title: 'Barcelona'
    },{
      lat: 42.5000,
      lng: 1.5167,
      title: 'Andorra'
    }
  ], {icon: 'images/city.png'}); // the 2nd parameter allows you to add shared options.
```
The 2nd parameter of `addMarker`, allows you to add options that apply to all the Markers within the Array.

Add any other [Marker Options](https://developers.google.com/maps/documentation/javascript/reference#MarkerOptions)



Once the Markers are created, you can access to all Markers directly like this: `map.markers.all`

#### Update Marker
Allows you to update one or multiple marker options. The 1st parameter can be: a result of Crossfilter, a Marker reference or the uid like this: `{uid: '<uid>'}`

The 2nd parameter is an object with a list of options. For example: `visible` to change the Marker visibilty.

```javascript
map.updateMarker(<marker>, {visible: false})
```

You can also use `lat` and `lng` to change the position of the Marker and many other options.

#### Remove Marker
Allows you to delete one or multiple Markers.

```javascript
map.removeMarker([markerInstance, markerInstance]);
```

#### Remove All Markers
Call the method with no parameters and that will delete all the Markers in the Map.
```javascript
map.removeMarker()
```


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

#### Info Window

Adds an info window with HTML content.
```javascript
map.addMarker({
  lat: 41.3833,
  lng: 2.1833,
  infoWindow: {
    openOn: 'mouseover',
    closeOn: 'click',
    content: '<p>{city} City</p>'
  },
  data: {
    city: 'Barcelona'
  }
});
```
Use curly brackets to display variables from `data` 

Add more [infoWindow options](https://developers.google.com/maps/documentation/javascript/reference#InfoWindowOptions) inside `infoWindow`.
The default **event** is `click` but you can change it with the `event` property.


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
var marker = map.filterMarker('population', {limit: 1});
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
 var colorado = map.filterFeature({NAME:'Colorado'}, {limit: 1});
 var nevada = map.filterFeature({NAME:'Colorado'}, {limit: 1});
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

var all = map.filterFeature('CENSUSAREA');
map.updateFeature(all, {style: color});
```

## Crossfilter support for Features

You can use a Crossfilter result to update features. In this example it finds the State named: 'Texas' and updates the background color.

```javascript
var feature = map.filterFeature({NAME:'Colorado'}, {limit: 1});
map.updateFeature(feature, {style: {fillColor:'black'}})
```

Add more [Style Options](https://developers.google.com/maps/documentation/javascript/reference#Data.StyleOptions)

Once the Features are created, you can access directly like this: `mapTools.maps.mymap.json.groups.states` and `mapTools.maps.mymap.json.groups.counties`

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
