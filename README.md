### GMapsPlus.js

Is a Google Maps Extension that allows you, with very little code, work with Maps, Markers and Clusters in a more fun and simpler way.


You don't even need to include the Google Maps `<script>` tag. It will load the file for you **asynchronously**.

#### How to load a simple Map.
All you need is a little Javascript
```javascript
var map = GMP({
    id: 'myMap',
    lat: 41.3833,
    lng: 2.1833
});
```
and an HTML tag
```html
<div id="myMap"></div>
```

Once instantiated you can access the Google Instance via: `GMP.maps.myMap.instance`. 

You can set any other native [map options](https://developers.google.com/maps/documentation/javascript/reference#MapOptions). It will just work. 
