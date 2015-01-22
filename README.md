### GMaps+.js

You don't need to include Google Maps. It will do it for you asynchronously, then it will load the Map with the settings that you had set.
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

You can access the Google Instance via: `GMP.maps.myMap.instance`. 

You can set any other native [map options](https://developers.google.com/maps/documentation/javascript/reference#MapOptions) it will just work. 
