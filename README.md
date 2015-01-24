### GMPlus.js 0.0.0 [![Build Status](https://travis-ci.org/yagoferrer/gmplus.svg?branch=master)](https://travis-ci.org/yagoferrer/gmplus)

Less Code, More Fun, More Doing! Easy to use, lots of features!

#### How to load a simple Map.
You don't even need to include the Google Maps `<script>` tag. It will load the file for you **asynchronously**.
You can setup a callback to notify you when the Map is fully loaded.
```javascript
var map = GMP({
    id: 'myMap',
    lat: 41.3833,
    lng: 2.1833
}, function(err, instance) {

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

GMPlus.js gives you freedom. Once instantiated you can access directly to the Google API like this:

```javascript
GMP.maps.myMap.instance
```
