### GMaps Plus

You don't need to include Google Maps. It will do it for you asynchronously, then it will load the Map with the settings that you had set.
```javascript
    var map = GMP({
        id: 'myMap',
        center: {
            lat: 41.3833, lng: 2.1833
        },
        zoom: 8
    });
```

```html
<div id="map"></div>
```

You can access the Google Instance via: `GMP.maps.myMap.map`
