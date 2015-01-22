### GMPlus.js 0.1.0-alpha

#### How to load a simple Map.
You don't even need to include the Google Maps `<script>` tag. It will load the file for you **asynchronously**.

All you need is a little Javascript
```javascript
var map = GMP({
    id: 'myMap',
    lat: 41.3833,
    lng: 2.1833
});
```
and a simple HTML tag
```html
<div id="myMap"></div>
```
You can set any other native [map options](https://developers.google.com/maps/documentation/javascript/reference#MapOptions). It will just work. For example you can add:
```javascript
{
    zoom: 15,
    streetViewControl: false,
    mapTypeControl: false,
    disableDoubleClickZoom: true
}
```

GMPlus.js gives you freedom. Once instantiated you can access directly like this:

```javascript
GMP.maps.myMap.instance
```

You can setup a callback to notify you if the Map was fully loaded.
All you need is a little Javascript
```javascript
var map = GMP({
    id: 'myMap',
    lat: 41.3833,
    lng: 2.1833
}, function(err, instance) {

  if (!err) {
    console.log('Hey the Map was fully loaded!', instance);
  }

});
```

