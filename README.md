### GMapsPlus.js 0.1.0-alpha

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
and an HTML tag
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

Once instantiated you can access the Google Instance via: 

```javascript
GMP.maps.myMap.instance
```


