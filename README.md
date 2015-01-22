### GMapsPlus.js

You don't need to include the Google Maps `<script>` tag. It will load the file **asynchronously**.

#### How to load a simple Map.
```javascript
var map = GMP({
    id: 'myMap',
    lat: 41.3833,
    lng: 2.1833
});
```

```html
<div id="myMap"></div>
```

Once instanciated you can access the Google Instance via: `GMP.maps.myMap.instance`. 

You can set any other native [map options](https://developers.google.com/maps/documentation/javascript/reference#MapOptions). It will just work. 
