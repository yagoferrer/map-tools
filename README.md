## GMPlus.js 0.0.0 [![Build Status](https://travis-ci.org/yagoferrer/GMPlus.svg?branch=master)](https://travis-ci.org/yagoferrer/GMPlus)

Google Maps Plus: Less Code, More Fun, More Doing, Easy To Use, Frameworkless, Crossfilter support and more!
 
## How to test
You can pull the repo:
```bash
git pull https://github.com/yagoferrer/GMPlus.git
```

Then run the examples:

```
npm start
```

## Load a simple Map.
No need to include the Google Maps `<script>` tag. GMPlus will load the file for you **asynchronously**.
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
Add a simple HTML tag
```html
<div id="myMap"></div>
```
You can set any other native Map: [options](https://developers.google.com/maps/documentation/javascript/reference#MapOptions), [Full Reference](https://developers.google.com/maps/documentation/javascript/reference#Map). It just works. For example you can add:
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
The 2nd parameter of `addMarker` allows you to add options that will apply to all the Markers that you are adding.

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
  title: 'Barcelona',
  bubble: {
    event: 'mouseover',
    content: '<p>Barcelona City</p>'
  }
});
```

You can set any other [infoWindow options](https://developers.google.com/maps/documentation/javascript/reference#InfoWindowOptions) inside `bubble`.
The default **event** is `click` but you can change it with the `event` property.


## Crossfilter support
- Add Marker related data into the `data` property. 
- Add a [Crossfilter](https://github.com/square/crossfilter) when instantiating the Map.
- Create dimensions.

```javascript
  var markers = crossfilter([]);
  var population = markers.dimension(function(d) { return d.population; });

  var map = new GMP({
    id: 'myMap',
    lat: 40.419795,
    lng: -3.710436,
    zoom: 6,
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
