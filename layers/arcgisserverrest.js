﻿define(function() {
  var 
      // The preserved HTML string from the #npmap-infobox-content div.
      backContent = null,
      // The preserved HTML string from the #npmap-infobox-title div.
      backTitle = null,
      // An array of results for the current identify operation.
      identifyResults = [];

  // TODO: Start using underscore's templating (or mustache.js) to clean this code up.
  function buildHtmlForLayer(layer) {
    var html = '<ul>',
        layerConfig = NPMap.Map.getLayerByName(layer.layerName),
        subLayers = [];

    $.each(layer.data.results, function(i, result) {
      var subLayerObject;

      $.each(subLayers, function(i2, subLayer) {
        if (subLayer.layerName === result.layerName) {
          subLayerObject = subLayer;
        }
      });

      if (!subLayerObject) {
        subLayers.push({
          displayFieldName: result.displayFieldName,
          layerId: result.layerId,
          layerName: result.layerName,
          results: [
            result.attributes
          ]
        });
      } else {
        subLayerObject.results.push(result.attributes);
      }
    });
    subLayers.sort(function(a, b) {
      return a.layerName > b.layerName;
    });
    identifyResults.push({
      layerName: layer.layerName,
      results: subLayers
    });
    $.each(subLayers, function(i, subLayer) {
      var titles = [];
          
      if (!layerConfig.identify || !layerConfig.identify.simpleTree) {
        html += '<li>' + subLayer.layerName.replace(/_/g, ' ') + '<ul>';
      }

      $.each(subLayer.results, function(i2, result) {
        var t;

        if (layerConfig.identify && layerConfig.identify.title) {
          t = NPMap.Map.buildInfoBoxHtmlString(layerConfig, result, 'title');
              
          if (!t) {
            t = result[subLayer.displayFieldName];
          }
        } else {
          t = result[subLayer.displayFieldName];
        }
            
        t = NPMap.utils.stripHtmlFromString(t);
            
        titles.push({
          r: result,
          t: t
        });
      });

      titles.sort(function(a, b) {
        var textA = a.t.toUpperCase(),
            textB = b.t.toUpperCase();
            
        return (textA < textB) ? -1 : (textA > textB) ? 1 : 0;
      });

      $.each(titles, function(i2, t) {
        html += '<li><a href="javascript:void(0)" onclick="NPMap.layers.ArcGisServerRest.infoBoxMoreInfo(\'' + constructId(layer.layerName, subLayer.layerId, t.r['OBJECTID']) + '\',\'' + layer.layerName + '\',';
          
        html += '\'' + t.t + '\');return false;">' + t.t + '</a></li>';
      });
          
      if (!layerConfig.identify || !layerConfig.identify.simpleTree) {
        html += '</ul></li>';
      }
    });

    return html + '</ul>';
  }
  /**
   * Constructs a unique id.
   * @param {String} layerName
   * @param {Number} layerId
   * @param {Number} objectId
   * @return {String}
   */
  function constructId(layerName, layerId, objectId) {
    return layerName.replace(' ', '') + '-' + layerId + '-' + objectId;
  }
  
  NPMap.Event.add('NPMap.InfoBox', 'hide', function() {
    NPMap.layers.ArcGisServerRest.identifyResult = null;
  });
  
  // TODO: This should be in the NPMap.layers namespace. This applies to all layer handlers.
  NPMap.layers = NPMap.layers || {};
  
  return NPMap.layers.ArcGisServerRest = {
    // Holds the current identify result object for this layer. This will be an array if multiple results are returned or an object if a single result is returned.
    identifyResult: null,
    /**
     * Builds an infobox for an ArcGisServerRest layer. If provided by user, this function uses the identify config information from each layer's config.
     * @param {Object/Array} (Required) data - The data object or array to build the infobox for.
     */
    buildInfoBox: function(data) {
      // TODO: Enable sorting for simpleTree === true.

      var content = '',
          me = this,
          title = '';

      identifyResults = [];
      
      if (!data || data.length === 0) {
        content = 'No information is available for this location.';
        title = 'Sorry!';
      } else if (data.length === 1) {
        content = buildHtmlForLayer(data[0]);
        title = data[0].layerName.replace(/_/g, ' ');
      } else {
        $.each(data, function(i, v) {
          content += '<div><h3>' + data[i].layerName.replace(/_/g, ' ') + '</h3>' + buildHtmlForLayer(data[i]) + '</div>';
        });

        title = 'Results';
      }

      title = '<h2>' + title + '</h2>';
      backContent = content;
      backTitle = title;

      return {
        content: content,
        title: title
      };
    },
    /**
     * Performs an identify operation.
     * @param {Number} clickLat
     * @param {Number} clickLng
     * @param {Number} divHeight
     * @param {Number} divWidth
     * @param {Number} neLat
     * @param {Number} neLng
     * @param {Number} swLat
     * @param {Number} swLng
     */
    doIdentify: function(clickLat, clickLng, divHeight, divWidth, neLat, neLng, swLat, swLng) {
      var count = 0,
          me = this,
          results = [],
          value = .1;
      
      $.each(NPMap.config.layers, function(i, v) {
        if (v.type === 'ArcGisServerRest') {
          var url = v.url + '/identify?callback=?&f=json&geometry=' + clickLng + ',' + clickLat + '&geometryType=esriGeometryPoint&imageDisplay=' + divWidth + ',' + divHeight + ',' + '96&mapExtent=' + swLng + ',' + swLat + ',' + neLng + ',' + neLat + '&returnGeometry=false&sr=4326&tolerance=10&layers=visible';

          if (v.layers && v.layers !== 'all') {
            url += ':' + v.layers;
          }

          count++;

          $.getJSON(url, function(data) {
            if (data.results && data.results.length > 0) {
              results.push({
                data: data,
                layerName: v.name
              });
            }

            count--;
          });
        }
      });
      NPMap.Map.showProgressBar(value);

      var interval = setInterval(function() {
        value = value + .1;

        NPMap.Map.updateProgressBar(value);

        if (value < 100) {
          if (count === 0) {
            var infobox = NPMap.layers.ArcGisServerRest.buildInfoBox(results);
            
            me.identifyResult = results;
            
            clearInterval(interval);
            NPMap.Map.hideProgressBar(value);
            NPMap.InfoBox.show(infobox.content, infobox.title);
          }
        } else {
          clearInterval(interval);
          NPMap.Map.hideProgressBar();
          NPMap.InfoBox.show('The identify operation is taking too long. Zoom in further and try again.', 'Sorry!');
        }
      }, 5);
    },
    /**
     * Called when the user hits the "<<Back to List" link in an InfoBox.
     */
    infoBoxBack: function() {
      NPMap.InfoBox.show(backContent, backTitle);

      this.identifyResult = identifyResults;
    },
    /**
     * Gets more attribution infomation for an individual geometry and displays it in the InfoBox.
     * @param {String} id The id of the geometry.
     * @param {String} name The name of the layer.
     * @param {String} title The title of the geometry identify.
     */
    infoBoxMoreInfo: function(id, name, title) {
      var actions = [{
            handler: NPMap.layers.ArcGisServerRest.infoBoxBack,
            text: 'Back to list'
          }],
          attributes,
          i = 0,
          ids = id.split('-'),
          layer = NPMap.Map.getLayerByName(name, NPMap.config.layers),
          me = this,
          results,
          subLayer;
      
      for (i; i < identifyResults.length; i++) {
        if (identifyResults[i].layerName === name) {
          results = identifyResults[i].results;
          break;
        }
      }

      i = 0;

      for (i; i < results.length; i++) {
        if (results[i].layerId === parseInt(ids[1])) {
          subLayer = results[i];
          results = results[i].results;
          break;
        }
      }

      i = 0;

      for (i; i < results.length; i++) {
        if (results[i].OBJECTID === ids[2]) {
          attributes = results[i];
          break;
        }
      }

      if (layer.edit) {
        var editable = layer.edit.layers.split(','),
            j = 0;
        
        for (j; j < editable.length; j++) {
          if (parseInt(editable[j]) === subLayer.layerId) {
            actions.push({
              group: 'Edit',
              handler: function() {
                layer.edit.handlers['delete']({
                  globalId: attributes.GlobalID,
                  name: name,
                  objectId: attributes.OBJECTID,
                  subLayerId: subLayer.layerId
                });
              },
              text: 'Delete feature'
            });
            actions.push({
              group: 'Edit',
              handler: function() {
                layer.edit.handlers.updateAttributes({
                  globalId: attributes.GlobalID,
                  name: name,
                  objectId: attributes.OBJECTID,
                  subLayerId: subLayer.layerId
                });
              },
              text: 'Update feature attributes'
            });
            actions.push({
              group: 'Edit',
              handler: function() {
                layer.edit.handlers.updateGeometry({
                  globalId: attributes.GlobalID,
                  name: name,
                  objectId: attributes.OBJECTID,
                  subLayerId: subLayer.layerId
                });
              },
              text: 'Update feature geometry'
            });

            break;
          }
        }
      }

      me.identifyResult = attributes;

      if (layer.skipActions) {
        actions = [];
      }

      NPMap.InfoBox.show(NPMap.Map.buildInfoBoxHtmlString(layer, attributes, 'content'), '<h2>' + title + '</h2>', null, actions);
    },
    /**
     * Reloads an ArcGisServerRest layer. Can be used after an edit operation or after a subLayer has been toggled on or off.
     * @param {Object} layer The layer to reload.
     */
    reloadLayer: function(layer) {
      NPMap.InfoBox.hide();
      NPMap[NPMap.config.api].layers.ArcGisServerRest.reloadLayer(layer);
    },
    /**
     * Toggles a layer on or off.
     * @param {Object} layer The layer config object.
     * @param {Boolean} on Turn the layer on?
     */
    toggleLayer: function(layer, on) {
      if (on) {
        NPMap[NPMap.config.api].layers.ArcGisServerRest.showLayer(layer);
      } else {
        NPMap[NPMap.config.api].layers.ArcGisServerRest.hideLayer(layer);
      }
    },
    /**
     * Toggles a layer's sublayer on or off.
     * @param {Object} layer The layer config object.
     * @param {Integer} subLayerIndex The index of the sublayer.
     * @param {Boolean} on Toggle this layer on?
     */
    toggleSubLayer: function(layer, subLayerIndex, on) {
      var changed = false,
          index = -1,
          subLayers = layer.layers.split(',');

      for (var i = 0; i < subLayers.length; i++) {
        if (parseInt(subLayers[i]) === parseInt(subLayerIndex)) {
          index = i;
          break;
        }
      }

      if (on) {
        if (index === -1) {
          changed = true;
          subLayers.push(subLayerIndex);
        }
      } else {
        if (index !== -1) {
          changed = true;
          subLayers.splice(index, 1);
        }
      }

      layer.layers = subLayers.join();

      if (layer.layers.indexOf(',') === 0) {
        layer.layers = layer.layers.slice(1, layer.layers.length);
      }

      if (changed) {
        if (subLayers.length === 0) {
          NPMap[NPMap.config.api].layers.ArcGisServerRest.removeLayer(layer);
        } else {
          this.reloadLayer(layer);
        }
      }
    }
  };
});