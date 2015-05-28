/// <reference path="typings/tsd.d.ts"/>
class Config {
  public static version: string = '3.18'; // Released: May 15, 201
  public static url: string =  '//maps.googleapis.com/maps/api/js';
  public static zoom: number = 8;
  public static customMapOptions: string[] = ['id', 'lat', 'lng', 'type', 'uid'];
  public static customMarkerOptions: string[] = ['lat', 'lng', 'move', 'infoWindow', 'on', 'callback', 'tags'];
  public static panelPosition: string = 'TOP_LEFT';
  public static customInfoWindowOptions: string[] = ['open', 'close'];
  public static customEvents: string[] = ['marker_visibility_changed'];
}

export = Config;
