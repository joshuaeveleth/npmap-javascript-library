﻿define([
  'Map/Map'
], function(Map) {
  var bounds,
      map,
      max = 19,
      min = 0;

  dojo.require('esri.map');
  dojo.require('esri.geometry');
  dojo.addOnLoad(function() {
    var baseLayer;

    if (NPMap.config.bbox) {
      bounds = NPMap.config.bbox.slice(1, NPMap.config.bbox.length - 1).split(',');
      bounds = new esri.geometry.Extent({
        xmax: parseFloat(bounds[2]),
        xmin: parseFloat(bounds[0]),
        ymin: parseFloat(bounds[1]),
        ymax: parseFloat(bounds[3]),
        spatialReference: {
          wkid: 4326
        }
      });
    } else {
      bounds = new esri.geometry.Extent({
        xmax: -2309009.750438016,
        xmin: -20233187.13519394,
        ymax: 8433755.952870969,
        ymin: 1937220.0448589968,
        spatialReference: {
          wkid: 102100
        }
      });
    }

    map = new esri.Map(NPMap.config.div, {
      extent: bounds,
      logo: false,
      showInfoWindowOnClick: false,
      slider: false,
      wrapAround180: true
    });
    
    if (NPMap.config.baseLayers) {
      for (var i = 0; i < NPMap.config.baseLayers.length; i++) {
        var layer = NPMap.config.baseLayers[i];
        
        if (typeof layer.visible === 'undefined' || layer.visible) {
          if (layer.type === 'ArcGisServerRest') {
            baseLayer = true;
            layer.zIndex = 0;
            NPMap.Util.safeLoad('NPMap.esri.layers.ArcGisServerRest', function() {
              NPMap.esri.layers.ArcGisServerRest.addLayer(layer);
            });
            
            break;
          }
        }
      }
    }
    
    if (!baseLayer) {
      baseLayer = new esri.layers.ArcGISTiledMapServiceLayer('http://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer');

      map.addLayer(baseLayer);
    }
    
    dojo.connect(map, 'onLoad', function() {
      dojo.connect(dijit.byId('map'), 'resize', map, map.resize);
    });

    var interval = setInterval(function() {
      if (NPMap.Map.Esri) {
        clearInterval(interval);

        NPMap.Map.Esri.map = map;
        NPMap.Map.Esri._isReady = true;

        Map._init();
      }
    }, 10);
  });

  return NPMap.Map.Esri = {
    // Is the map loaded and ready to be interacted with programatically?
    _isReady: false,
    // The esri.Map object. This reference should be used to access any of the ArcGIS API for JavaScript functionality that can't be done through the NPMap.Map methods.
    map: null,
    /**
     * Adds a base layer to the map.
     * @param baseLayer An object with id, tiled, url, and visible properties.
     */
    addBaseLayer: function(baseLayer) {
      var layer,
          options = {
            id: baseLayer.code,
            visible: baseLayer.visible
          };

      if (baseLayer.tiled) {
        layer = new esri.layers.ArcGISTiledMapServiceLayer(baseLayer.url, options);
      } else {
        layer = new esri.layers.ArcGISDynamicMapServiceLayer(baseLayer.url, options);
      }
      
      map.addLayer(layer);
      
      return layer;
    },
    /**
     * Adds a shape to the map.
     * @param {Object} shape The shape to add to the map. This can be an esri.geometry.Point, Polygon, or Polyline object.
     */
    addShape: function(shape) {
      
    },
    /**
     * Centers the map.
     * @param {Object} latLng
     */
    center: function(latLng) {
      map.centerAt(latLng);
    },
    /**
     * Centers then zooms the map.
     * @param {} latLng The latLng to center the map on.
     * @param {Integer} zoom The zoom level to zoom the map to.
     * @param {Function} callback (Optional) A callback function to call after the map has been centered and zoomed.
     */
    centerAndZoom: function(latLng, zoom, callback) {
      map.centerAndZoom(latLng, zoom);

      if (callback) {
        callback();
      }
    },
    /**
     * Creates an esri.geometry.Polyline object.
     * @param {Array} latLngs An array of {} objects.
     * @param {} options (Optional) Any additional options to apply to the line.
     * @param {Object} data (Optional) An object with key/value pairs of information that need to be stored with the marker. This object will be added to the line.data property.
     * @param {Function} clickHandler (Optional) A function to call when the marker is clicked.
     * @return {esri.geometry.Polyline}
     */
    createLine: function(latLngs, options, data, clickHandler) {
      var json = {
            paths: [
              [
                [-122.68, 45.53],
                [-122.58, 45.55],
                [-122.57, 45.58],
                [-122.53, 45.6]
              ]
            ],
            spatialReference: {
              wkid: 4326
            }
          },
          line = new esri.geometry.Polyline(json);

      return line;
    },
    /**
     * Creates an esri.geometry.Point object.
     * @param {} latLng Where to place the marker.
     * @param {} options (Optional) Any additional options to apply to the marker.
     * @param {Object} data (Optional) An object with key/value pairs of information that need to be stored with the marker. This object will be added to the marker.data property.
     * @param {Function} clickHandler (Optional) A function to call when the marker is clicked.
     * @return {esri.geometry.Point}
     */
    createMarker: function(latLng, options, data, clickHandler) {

    },
    /**
     * Creates an esri.geometry.Polygon object.
     * @param {Array} latLngs An array of {} objects.
     * @param {} options (Optional) Any additional options to apply to the polygon.
     * @param {Object} data (Optional) An object with key/value pairs of information that need to be stored with the polygon. This object will be added to the polygon.data property.
     * @return {esri.geometry.Polygon}
     */
    createPolygon: function(latLngs, options, data) {

    },
    /**
     * Gets the center of the map.
     * @param {Number} spatialReference (Optional) The spatial reference to use.
     * @return {esri.geometry.Point}
     */
    getCenter: function(spatialReference) {
      var center = map.extent.getCenter();

      if (spatialReference === 102100) {
        return center;
      } else {
        return esri.geometry.webMercatorToGeographic(center);
      }
    },
    /**
     * Gets the latLng () of the #npmap-clickdot div element.
     * @return {}
     */
    getClickDotLatLng: function() {
      
    },
    /**
     * Gets the container div.
     * @return {Object}
     */
    getContainerDiv: function() {
      return map.root;
    },
    /**
     *
     */
    getExtent: function() {
      var extent = map.extent;
      
      return {
        xmax: esri.geometry.webMercatorToGeographic(extent.xmax),
        xmin: esri.geometry.webMercatorToGeographic(extent.xmin),
        ymax: esri.geometry.webMercatorToGeographic(extent.ymax),
        ymin: esri.geometry.webMercatorToGeographic(extent.ymin)
      };
    },
    /**
     * Gets a {} from a {}.
     * @param {} point
     * @return {}
     */
    getLatLngFromPixel: function(point) {
      
    },
    /**
     * Gets the anchor of a marker.
     * @param {} marker The {esri.geometry.Point} to get the anchor for.
     * @return {Object} An object with x and y properties.
     */
    getMarkerAnchor: function(marker) {
      
    },
    /**
     * Gets the icon for a marker.
     * @param {esri.geometry.Point} marker
     * @return
     */
    getMarkerIcon: function(marker) {
      
    },
    /**
     * Gets the latLng () of the marker.
     * @param {Object} marker The marker to get the latLng for.
     * @return {Object}
     */
    getMarkerLatLng: function(marker) {
      return marker.getLocation();
    },
    /**
     * Gets a marker option.
     * @param {Object} marker The marker object.
     * @param {String} option The option to get. Currently the valid options are: 'icon'.
     */
    getMarkerOption: function(marker, option) {
      
    },
    /**
     * Gets the visibility property of a marker.
     * @param {Object} marker The marker to check the visibility for.
     */
    getMarkerVisibility: function(marker) {
      
    },
    /**
     * Returns the maximum zoom level for this map.
     * @return {Number}
     */
    getMaxZoom: function() {
      return max;
    },
    /**
     * Returns the minimum zoom level for this map.
     * @return {Number}
     */
    getMinZoom: function() {
      return min;
    },
    /**
     * Returns a {} object for a given latLng.
     * @param {} latLng
     */
    getPixelFromLatLng: function(latLng) {
      
    },
    /**
     * Gets the zoom level of the map.
     * @return {Number}
     */
    getZoom: function() {
      return map.getLevel();
    },
    /**
     * Handles any necessary sizing and positioning for the map when its div is resized.
     */
    handleResize: function() {
      map.resize();
    },
    /**
     * Hides a shape.
     * @param {} or {} or {} shape The shape to hide.
     */
    hideShape: function(shape) {

    },
    /**
     * Tests to see if a marker is within the map's current bounds.
     * @param latLng {Object/String} {Required} The latitude/longitude, either a {esri.geometry.Point} object or a string in "latitude,longitude" format, to test.
     * @return {Boolean}
     */
    isLatLngWithinMapBounds: function(latLng) {
      
    },
    /**
     * Converts an {esri.geometry.Point} object to the NPMap representation of a latitude/longitude string.
     * @param latLng {esri.geometry.Point} The Point object to convert to a string.
     * @return {String} A latitude/longitude string in "latitude,longitude" format.
     */
    latLngFromApi: function(latLng) {
      if (latLng.spatialReference.wkid !== 4326) {
        latLng = esri.geometry.webMercatorToGeographic(latLng);
      }

      return latLng.y + ',' + latLng.x;
    },
    /**
     * Iterates through the default base layers and returns a match if it exists.
     * @param {Object} baseLayer The baseLayer object.
     * @return {Object}
     */
    matchBaseLayer: function(baseLayer) {
      
    },
    /**
     * Pans the map horizontally and vertically based on the pixels passed in.
     * @param {Object} pixels
     */
    panByPixels: function(pixels) {
      var el = this.getContainerDiv(),
          height = el.offsetHeight,
          width = el.offsetWidth,
          center = esri.geometry.toScreenGeometry(map.extent, width, height, this.getCenter(102100));
          
      map.centerAt(esri.geometry.toMapGeometry(map.extent, width, height, new esri.geometry.Point(center.x - pixels.x, center.y - pixels.y)));
    },
    panEast: function() {
      map.panRight();
    },
    panNorth: function() {
      map.panUp();
    },
    panSouth: function() {
      map.panDown();
    },
    panWest: function() {
      map.panLeft();
    },
    /**
     * Positions the #npmap-clickdot div on top of the pushpin, lat/lng object, or lat/lng string that is passed in.
     * @param {esri.geometry.Point} OR {String} to The Pushpin, Location, or latitude/longitude string to position the div onto.
     */
    positionClickDot: function(to) {
      /*
      
      var anchorY = 0,
          me = this,
          offset = NPMap.Util.getMapDivOffset(),
          pixel = NPMap.bing.map.Map.tryLocationToPixel((function() {
            var latLng = null;
            
            if (typeof(to) === 'string') {
              to = to.split(',');
              latLng = new Microsoft.Maps.Location(parseFloat(to[0]), parseFloat(to[1]));
            } else {
              if (to.latitude) {
                latLng = to;
              } else {
                anchorY = me.getMarkerAnchor(to).y;
                latLng = to.getLocation();
              }
            }

            return latLng;
          })(), Microsoft.Maps.PixelReference.page);
      
      $('#npmap-clickdot').hide().css({
        left: pixel.x - offset.left,
        top: pixel.y - offset.top - anchorY
      }).show();
      
      */
      
      var el = this.getContainerDiv(),
          height = el.offsetHeight,
          width = el.offsetWidth,
          point = esri.geometry.toScreenGeometry(map.extent, width, height, to);
          
      console.log(el);
      console.log(height);
      console.log(map.extent);
      console.log(width);
      
      console.log(point);
      
      $('#npmap-clickdot').css({
        height: '5px',
        width: '5px',
        backgroundColor: 'red',
        
        left: point.x + 'px',
        top: point.y + 'px'
      }).show();
    },
    /**
     * Removes a shape from the map.
     * @param {Object} shape
     */
    removeShape: function(shape) {
      
    },
    /**
     * Sets a marker's options.
     * @param {Object} marker
     * @param {Object} options The options to set. Currently the valid options are: 'class', 'icon', 'label', 'visible', and 'zIndex'.
     */
    setMarkerOptions: function(marker, options) {
      
    },
    /**
     * Shows a shape.
     * @param {} or {} or {} shape The shape to show.
     */
    showShape: function(shape) {
      
    },
    /**
     * Converts a lat/lng string ("latitude/longitude") to a {esri.geometry.Point} object.
     * @param {String} latLng The lat/lng string.
     * @return {esri.geometry.Point}
     */
    latLngToApi: function(latLng) {
      latLng = latLng.split(',');

      return esri.geometry.geographicToWebMercator(new esri.geometry.Point(parseFloat(latLng[1]), parseFloat(latLng[0]), 4326));
    },
    /**
     * Switches the base map.
     * @param {Object} type The base layer to switch to.
     */
    switchBaseLayer: function(to) {
      var active;
      
      for (var i = 0; i < NPMap.config.baseLayers.length; i++) {
        var baseLayer = NPMap.config.baseLayers[i];
        
        if (baseLayer.visible) {
          active = baseLayer;
          break;
        }
      }
      
      if (to.type === 'ArcGisServerRest') {
        NPMap.esri.layers.ArcGisServerRest.hideLayer(active);
      }

      if (active.type === 'ArcGisServerRest') {
        NPMap.esri.layers.ArcGisServerRest.showLayer(to);
      }
    },
    /**
     * Zooms and/or pans the map to its initial extent.
     */
    toInitialExtent: function() {
      map.setExtent(bounds);
    },
    /**
     * Zooms the map to a zoom level.
     * @param {Number} zoom
     */
    zoom: function(zoom) {
      map.setLevel(zoom);
    },
    /**
     * Zooms the map in by one zoom level.
     */
    zoomIn: function() {
      map.setLevel(map.getLevel() + 1);
    },
    /**
     * Zooms the map out by one zoom level.
     */
    zoomOut: function() {
      map.setLevel(map.getLevel() - 1);
    }
  };
});