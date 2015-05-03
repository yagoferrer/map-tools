/*jslint node: true */
'use strict';
module.exports = {
  version: '3.18', // Released: May 15, 2014
  url: '//maps.googleapis.com/maps/api/js',
  zoom: 8,
  customMapOptions: ['id', 'lat', 'lng', 'type', 'uid'],
  customMarkerOptions: ['lat', 'lng', 'move', 'infoWindow', 'on', 'callback', 'tags'],
  panelPosition: 'TOP_LEFT',
  customInfoWindowOptions: ['open', 'close'],
  customEvents: ['marker_visibility_changed']
};
