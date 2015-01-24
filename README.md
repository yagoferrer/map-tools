### GMPlus.js 0.0.0 [![Build Status](https://travis-ci.org/yagoferrer/gmplus.svg?branch=master)](https://travis-ci.org/yagoferrer/gmplus)

Google Maps with: Less Code, More Fun, More Doing! Easy To Use, Extra Features, Frameworkless!
 
#### How to install
The `npm` and `bower` package has not been registered yet. you can pull the repo doing:
```bash
git pull https://github.com/yagoferrer/GMPlus.git
```
Then run the examples doing:

```
npm start
```

#### Load a simple Map.
You don't even need to include the Google Maps `<script>` tag. It will load the file for you **asynchronously**.
You can setup a callback to notify you when the Map is fully loaded.
```javascript
var map = new GMP({
  id: 'myMap',
  lat: 41.3833,
  lng: 2.1833
}, function (err, instance) {

  if (!err) {
    console.log('Hey! the Map was fully loaded :)');
  }

});
```
Add a simple HTML tag
```html
<div id="myMap"></div>
```
You can set any other native [map options](https://developers.google.com/maps/documentation/javascript/reference#MapOptions). It just works. For example you can add:
```javascript
{
    zoom: 15,
    streetViewControl: false,
    mapTypeControl: false,
    disableDoubleClickZoom: true
}
```

Once instantiated you can access directly to the Google API like this: `GMP.maps.myMap.instance`

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

Once the markers are created you can access directly like this: `GMP.maps.myMap.groups.myGroup`

##### Animate Markers
Make your marker bounce `move: map.bounce` or drop `move: map.drop`

```javascript
map.addMarker({
  lat: 41.3833,
  lng: 2.1833,
  title: 'barcelona',
  move: map.bounce
});
```
