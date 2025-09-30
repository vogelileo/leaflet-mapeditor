import React, { useEffect, useState } from 'react';
import { MapContainer, useMap, useMapEvents } from 'react-leaflet';
import { useLeafletContext } from '@react-leaflet/core';
import * as protomapsL from 'protomaps-leaflet';
import 'leaflet/dist/leaflet.css';

import '@geoman-io/leaflet-geoman-free';
import '@geoman-io/leaflet-geoman-free/dist/leaflet-geoman.css';
import L from 'leaflet';
import { getLabelRules, getPaintRules } from './getLayerSymbolizers';

// Fix Leaflet default icon paths
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const MAX_DATA_ZOOM = 14;
const initialCenter = [47.2464, 8.658];
const initialZoom = 11;
const pmtilesPath = '/swisstopo.base.vt.pmtiles';
const pmtilesMinZoom = 0;
const pmtilesMaxZoom = 20;

// PMTiles vector layer
const PMTilesVectorLayer = ({ url, attribution, minZoom, maxZoom }) => {
  const context = useLeafletContext();

  useEffect(() => {
    const map = context.map;

    const layer = protomapsL.leafletLayer({
      url,
      attribution,
      minZoom,
      maxZoom,
      maxDataZoom: MAX_DATA_ZOOM,
      paintRules: getPaintRules(),
      labelRules: getLabelRules(),
    });

    layer.addTo(map);
    return () => map.removeLayer(layer);
  }, [url, attribution, minZoom, maxZoom, context.map]);

  return null;
};

// Map logger
function MapLogger() {
  const map = useMapEvents({
    zoomend: () => console.log(`Current zoom level: ${map.getZoom()}`),
  });
  return null;
}

// Leaflet-Geoman with per-feature color and save/load
const GeomanControlsWithColor = () => {
  const map = useMap();
  const [selectedLayer, setSelectedLayer] = useState(null);
  const [color, setColor] = useState('#1d4ed8');

  useEffect(() => {
    map.pm.addControls({
      position: 'topleft',
      drawPolygon: true,
      drawMarker: true,
      drawPolyline: true,
      drawText: true,
      drawCircle: false,
      drawRectangle: false,
      editMode: true,
      dragMode: true,
      removalMode: true,
    });

    map.pm.setGlobalOptions({
      pathOptions: { color, fillOpacity: 0.5 },
      markerStyle: { draggable: true },
    });

    const layers = [];

    // Creation
    map.on('pm:create', (e) => {
      const layer = e.layer;

      const initialColor = color;
      layer.feature = { properties: { color: initialColor } };
      if (layer.setStyle) {
        layer.setStyle({ color: initialColor, fillColor: initialColor });
      }

      layers.push(layer);
      setSelectedLayer(layer);
      layer.on('click', () => {
        setSelectedLayer(layer);
        if (layer.feature.properties.color) {
          setColor(layer.feature.properties.color);
        }
      });
    });

    // Removal
    map.on('pm:remove', (e) => {
      if (selectedLayer === e.layer) setSelectedLayer(null);
      const index = layers.indexOf(e.layer);
      if (index > -1) layers.splice(index, 1);
    });

    return () => {
      map.pm.removeControls();
      map.off('pm:create');
      map.off('pm:remove');
    };
  }, [map, selectedLayer, color]);

  // Update selected feature color
  useEffect(() => {
    if (selectedLayer && selectedLayer.setStyle) {
      selectedLayer.feature.properties.color = color;
      selectedLayer.setStyle({ color, fillColor: color });
    }
  }, [color, selectedLayer]);

  // Save features to localStorage
  const saveFeatures = () => {
    const geojson = [];
    map.eachLayer((layer) => {
      if (layer.pm) {
        console.log(layer);
        console.log(layer.feature.properties);

        if (layer.options && layer.options.textMarker) {
          layer.feature.properties.text = layer.options.text;
        }

        geojson.push(layer.toGeoJSON());
      }
    });
    localStorage.setItem('mapFeatures', JSON.stringify(geojson));
    console.log(geojson);
    alert('Features saved!');
  };

  // Load features from localStorage
  const loadFeatures = () => {
    const stored = localStorage.getItem('mapFeatures');
    if (!stored) return;
    const geojsonData = JSON.parse(stored);

    geojsonData.forEach((feature) => {
      const geojsonFeature =
        feature.type === 'Feature'
          ? feature
          : {
              type: 'Feature',
              properties: feature.properties || {},
              geometry: feature.geometry,
            };

      let layer;

      switch (geojsonFeature.geometry.type) {
        case 'Polygon':
        case 'MultiPolygon':
          layer = L.geoJSON(geojsonFeature, {
            style: { color: geojsonFeature.properties.color || '#1d4ed8' },
          }).getLayers()[0];
          break;
        case 'LineString':
        case 'MultiLineString':
          layer = L.geoJSON(geojsonFeature, {
            style: { color: geojsonFeature.properties.color || '#1d4ed8' },
          }).getLayers()[0];
          break;
        case 'Point':
          layer = L.geoJSON(geojsonFeature, {
            pointToLayer: (f, latlng) =>
              L.marker(latlng, {
                icon: L.divIcon({
                  className: 'text-marker',
                  html: `<div style="color:black;font-weight:bold;">${
                    f.properties?.text || '📍'
                  }</div>`,
                }),
              }),
          }).getLayers()[0];
          break;
        default:
          return;
      }

      layer.feature = geojsonFeature;
      layer.addTo(map);

      // Allow editing
      if (layer.pm) {
        layer.pm.setOptions({ allowEditing: true, allowDragging: true });
      }

      layer.on('click', () => {
        setSelectedLayer(layer);
        if (layer.feature.properties.color) {
          setColor(layer.feature.properties.color);
        }
      });
    });
  };

  return (
    <div
      style={{
        position: 'absolute',
        top: 10,
        right: 10,
        zIndex: 1000,
        background: 'white',
        padding: 5,
      }}
    >
      <div style={{ marginBottom: 5 }}>
        {' '}
        <label>
          Feature Color:{' '}
          <input
            type='color'
            value={color}
            onChange={(e) => setColor(e.target.value)}
          />{' '}
        </label>{' '}
      </div>
      <div style={{ marginBottom: 5 }}>
        {' '}
        <button onClick={saveFeatures}>Save Features</button>{' '}
      </div>{' '}
      <div>
        {' '}
        <button onClick={loadFeatures}>Load Features</button>{' '}
      </div>{' '}
    </div>
  );
};

// Main Map Component
const MapWithPMTiles = () => {
  return (
    <div style={{ height: '100vh', position: 'relative' }}>
      <MapContainer
        center={initialCenter}
        zoom={initialZoom}
        minZoom={pmtilesMinZoom}
        maxZoom={pmtilesMaxZoom}
        scrollWheelZoom={true}
        style={{ height: '100%', width: '100%' }}
      >
        {' '}
        <MapLogger />{' '}
        <PMTilesVectorLayer
          url={pmtilesPath}
          attribution='© <a href="https://www.swisstopo.ch/" target="_blank">swisstopo</a>'
          minZoom={pmtilesMinZoom}
          maxZoom={pmtilesMaxZoom}
        />{' '}
        <GeomanControlsWithColor />{' '}
      </MapContainer>{' '}
    </div>
  );
};

export default MapWithPMTiles;
