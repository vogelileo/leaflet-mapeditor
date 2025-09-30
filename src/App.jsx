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

function MapLogger() {
  const map = useMapEvents({
    zoomend: () => console.log(`Current zoom level: ${map.getZoom()}`),
  });
  return null;
}

// --- Leaflet-Geoman Component with per-feature colors ---
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

    // Store a reference to all drawn layers
    const layers = [];

    // Handle new shapes
    map.on('pm:create', (e) => {
      const layer = e.layer;
      const initialColor = color;

      // Assign individual color to the layer
      layer.feature = { properties: { color: initialColor } };
      layer.setStyle({ color: initialColor, fillColor: initialColor });

      // Save the layer reference
      layers.push(layer);

      // Select the newly created layer
      setSelectedLayer(layer);

      // Bind popup showing current color
      const updatePopup = () =>
        layer.bindPopup(
          `<div style="font-family: sans-serif; max-width: 200px;">
            <p><strong>Type:</strong> ${e.shape}</p>
            <p><strong>Color:</strong> <span style="color:${layer.feature.properties.color}">${layer.feature.properties.color}</span></p>
            <p>Click a feature to select and change its color.</p>
          </div>`
        );

      updatePopup();
      layer.openPopup();

      // Make layer clickable to allow selection for color change
      layer.on('click', () => {
        setSelectedLayer(layer);
        setColor(layer.feature.properties.color); // sync color picker
      });
    });

    // Handle removal
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
  }, [map]);

  // Update color of the selected layer
  useEffect(() => {
    if (selectedLayer) {
      selectedLayer.feature.properties.color = color;
      selectedLayer.setStyle({ color, fillColor: color });

      // Update popup
      selectedLayer.setPopupContent(
        `<div style="font-family: sans-serif; max-width: 200px;">
          <p><strong>Type:</strong> ${selectedLayer.pm.shape}</p>
          <p><strong>Color:</strong> <span style="color:${color}">${color}</span></p>
          <p>Click a feature to select and change its color.</p>
        </div>`
      );
    }
  }, [color, selectedLayer]);

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
      <label>
        Feature Color:{' '}
        <input
          type='color'
          value={color}
          onChange={(e) => setColor(e.target.value)}
        />
      </label>
    </div>
  );
};

// -------------------------------------------------------------
// Main Map Component
// -------------------------------------------------------------
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
        <MapLogger />
        <PMTilesVectorLayer
          url={pmtilesPath}
          attribution='© <a href="https://www.swisstopo.ch/" target="_blank">swisstopo</a>'
          minZoom={pmtilesMinZoom}
          maxZoom={pmtilesMaxZoom}
        />
        <GeomanControlsWithColor />
      </MapContainer>
    </div>
  );
};

export default MapWithPMTiles;
