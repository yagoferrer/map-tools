### GMPlus.js 0.0.0 [![Build Status](https://travis-ci.org/yagoferrer/gmplus.svg?branch=master)](https://travis-ci.org/yagoferrer/gmplus)

Google Maps with: Less Code, More Fun, More Doing, Easy To Use, Extra Features and Frameworkless!
 
#### How to test
You can pull the repo:
```bash
git pull https://github.com/yagoferrer/GMPlus.git
```

Then run the examples:

```
npm start
```

#### Load a simple Map.
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

#### Markers

##### Add One Marker
```javascript
map.addMarker({
     lat: 41.3833,
     lng: 2.1833,
     title: 'Barcelona'
     });
```

##### Add Multiple Markers

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
  ]);
```

You can set any other native [Marker Options](https://developers.google.com/maps/documentation/javascript/reference#MarkerOptions)

Once the markers are created you can access directly like this: `GMP.maps.myMap.markers`

##### Animate Markers
Make your marker bounce `move: map.bounce` or drop `move: map.drop`

```javascript
map.addMarker({
  lat: 41.3833,
  lng: 2.1833,
  title: 'Barcelona',
  move: map.bounce
});
```

##### Marker Groups

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


