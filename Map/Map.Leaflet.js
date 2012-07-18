﻿// TODO: Hook up attribution for all layers.
define([
  'Map/Map'
], function(Map) {
  var
      // The base layer to initialize the map with.
      baseLayer,
      // The center {L.LatLng} to initialize the map with.
      center = NPMap.config.center,
      // The {L.Map} object.
      map,
      // The map config object.
      mapConfig = NPMap.config.mapConfig || {},
      // The zoom level to initialize the map with.
      zoom = (function() {
        if (typeof NPMap.config.zoom === 'undefined') {
          return 4;
        } else {
          return NPMap.config.zoom;
        }
      })();
      
  // Simple projection for "flat" maps. - https://github.com/CloudMade/Leaflet/issues/210#issuecomment-3344944
  // TODO: This should be contained in Zoomify layer handler.
  L.Projection.NoWrap = {
    project: function (latlng) {
      return new L.Point(latlng.lng, latlng.lat);
    },
    unproject: function (point, unbounded) {
      return new L.LatLng(point.y, point.x, true);
    }
  };
  L.CRS.Direct = L.Util.extend({}, L.CRS, {
    code: 'Direct',
    projection: L.Projection.NoWrap,
    transformation: new L.Transformation(1, 0, 1, 0)
  });
  
  if (!center) {
    center = new L.LatLng(40.78054143186031, -99.931640625);
  } else {
    center = new L.LatLng(center.lat, center.lng);
  }
  
  mapConfig.attributionControl = false;
  mapConfig.center = center;
  mapConfig.zoom = zoom;
  mapConfig.zoomControl = false;
  
  if (NPMap.config.baseLayers) {
    for (var i = 0; i < NPMap.config.baseLayers.length; i++) {
      var layer = NPMap.config.baseLayers[i];
      
      if (layer.visible) {
        NPMap.Util.safeLoad('NPMap.leaflet.layers.' + layer.type, function() {
          NPMap.leaflet.layers[layer.type].addLayer(layer);
        });
        
        baseLayer = true;
        
        // TODO: This should be contained in Zoomify layer handler.
        if (layer.type === 'Zoomify') {
          mapConfig.crs = L.CRS.Direct;
          mapConfig.worldCopyJump = false;
        }
        
        break;
      }
    }
  }
  
  if (typeof NPMap.config.restrictZoom !== 'undefined') {
    if (typeof NPMap.config.restrictZoom.max !== 'undefined') {
      mapConfig.maxZoom = NPMap.config.restrictZoom.max;
    }
    
    if (typeof NPMap.config.restrictZoom.min !== 'undefined') {
      mapConfig.minZoom = NPMap.config.restrictZoom.min;
    }
  } else {
    mapConfig.maxZoom = 17;
    mapConfig.minZoom = 0;
  }
  
  map = new L.Map(NPMap.config.div, mapConfig);
  
  if (!baseLayer) {
    baseLayer = new L.TileLayer('http://{s}.tiles.mapbox.com/v3/mapbox.mapbox-streets/{z}/{x}/{y}.png', {
      attribution: '<a href="http://mapbox.com/about/maps" target="_blank">Terms & Feedback</a>',
      maxZoom: 17
    });
    
    map.addLayer(baseLayer);
    NPMap.Map.setAttribution('<a href="http://mapbox.com/about/maps" target="_blank">Terms & Feedback</a>');
  }
  
  Map._init();
  
  return NPMap.Map.Leaflet = {
    // Is the map loaded and ready to be interacted with programatically?
    _isReady: true,
    // The {L.Map} object. This reference should be used to access any of the Leaflet functionality that can't be done through NPMap's API.
    map: map,
    /**
     * Zooms to the center and zoom provided. If zoom isn't provided, the map will zoom to level 17.
     * @param {L.LatLng} latLng
     * @param {Number} zoom
     */
    centerAndZoom: function(latLng, zoom) {
      map.setView(latLng, zoom);
    },
    /**
     *
     * @return {L.LatLng}
     */
    getCenter: function() {
      return map.getCenter();
    },
    /**
     * Gets the container div.
     */
    getContainerDiv: function() {
      return document.getElementById('npmap');
    },
    /**
     * Gets the maximum zoom level for this map.
     * @return {Number}
     */
    getMaxZoom: function() {
      return mapConfig.maxZoom;
    },
    /**
     * Gets the minimum zoom level for this map.
     * @return {Number}
     */
    getMinZoom: function() {
      return mapConfig.minZoom;
    },
    /**
     *
     * @return {Number}
     */
    getZoom: function() {
      return map.getZoom();
    },
    /**
     * Handles any necessary sizing and positioning for the map when its div is resized.
     */
    handleResize: function(callback) {
      map.invalidateSize();
      
      if (callback) {
        callback();
      }
    },
    /**
     * Converts a {L.LatLng} to the NPMap representation of a latitude/longitude string.
     * @param latLng {L.LatLng} The object to convert to a string.
     * @return {String} A latitude/longitude string in "latitude,longitude" format.
     */
    latLngFromApi: function(latLng) {
      return latLng.lat + ',' + latLng.lng;
    },
    /**
     * Pans the map horizontally and vertically based on the pixels passed in.
     * @param {Object} pixels
     */
    panByPixels: function(pixels) {
      map.panBy(new L.Point(-pixels.x, -pixels.y));
    },
    /**
     *
     */
    setBounds: function(bounds) {
      map.fitBounds(bounds);
    },
    /**
     * Sets the initial center of the map. This initial center is stored with the map, and is used by the setInitialExtent method, among other things.
     * @param {Object} c
     */
    setInitialCenter: function(c) {
      center = c;
      NPMap.config.center = {
        lat: c.lat,
        lng: c.lng
      };
    },
    /**
     * Sets the initial zoom of the map. This initial zoom is stored with the map, and is used by the setInitialExtent method, among other things.
     * @param {Number} zoom
     */
    setInitialZoom: function(zoom) {
      zoom = NPMap.config.zoom = zoom;
    },
    /**
     * Sets zoom restrictions on the map.
     * @param {Object} restrictions
     */
    setZoomRestrictions: function(restrictions) {
      NPMap.config.restrictZoom = NPMap.config.restrictZoom || {};
      
      if (restrictions.max) {
        NPMap.config.restrictZoom.max = max;
      }
      
      if (restrictions.min) {
        NPMap.config.restrictZoom.min = min;
      }
      
      // TODO: Cannot currently set zoom restrictions dynamically using Leaflet API.
    },
    /**
     * Converts a lat/lng string ("latitude/longitude") to a {Microsoft.Maps.Location} object.
     * @param {String} latLng The lat/lng string.
     * @return {Object}
     */
    latLngToApi: function(latLng) {
      latLng = latLng.split(',');
      return new L.LatLng(parseFloat(latLng[0]), parseFloat(latLng[1]));
    },
    /**
     * Zooms and/or pans the map to its initial extent.
     */
    toInitialExtent: function() {
      map.setView(center, zoom);
    },
    /**
     * Zooms the map in by one zoom level.
     */
    zoomIn: function() {
      map.zoomIn();
    },
    /**
     * Zooms the map out by one zoom level.
     */
    zoomOut: function() {
      map.zoomOut();
    }
  };
});