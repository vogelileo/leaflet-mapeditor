import React, { useEffect } from 'react';
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

const PMTilesVectorLayer = ({ url, flavor, attribution, minZoom, maxZoom }) => {
  const context = useLeafletContext();

  useEffect(() => {
    const map = context.map;

    const layer = protomapsL.leafletLayer({
      url: url,
      attribution: attribution,
      minZoom: minZoom,
      maxZoom: maxZoom,
      maxDataZoom: MAX_DATA_ZOOM,
      paintRules: getPaintRules(),
      labelRules: getLabelRules(),
    });

    layer.addTo(map);

    return () => map.removeLayer(layer);
  }, [url, flavor, attribution, minZoom, maxZoom, context.map]);

  return null;
};

function MapLogger() {
  const map = useMapEvents({
    zoomend: () => console.log(`Current zoom level: ${map.getZoom()}`),
  });
  return null;
}

// --- Leaflet-Geoman Component ---
const GeomanControls = () => {
  const map = useMap();

  useEffect(() => {
    // Add Geoman controls to the map
    map.pm.addControls({
      position: 'topleft',
      drawPolygon: true,
      drawMarker: true,
      drawPolyline: true,
      drawCircle: false,
      drawRectangle: false,
      editMode: true,
      dragMode: true,
      cutPolygon: false,
      removalMode: true,
    });

    // Set default options for drawn layers
    map.pm.setGlobalOptions({
      pathOptions: {
        color: '#1d4ed8',
        fillOpacity: 0.5,
      },
      markerStyle: {
        draggable: true,
      },
    });

    // Handle creation of new shapes
    map.on('pm:create', (e) => {
      const layer = e.layer;
      console.log('--- New Feature Created ---');
      console.log('Layer type:', e.shape);
      console.log('GeoJSON:', layer.toGeoJSON());

      layer
        .bindPopup(
          `<div style="font-family: sans-serif; max-width: 200px;">
          <p><strong>Type:</strong> ${e.shape}</p>
          <p>Data logged to console. Use Geoman tools to edit or remove.</p>
        </div>`
        )
        .openPopup();
    });

    // Handle removal of shapes
    map.on('pm:remove', (e) => {
      console.log('--- Feature Removed ---');
      console.log(e.layer.toGeoJSON());
    });

    // Cleanup
    return () => {
      map.pm.removeControls();
      map.off('pm:create');
      map.off('pm:remove');
    };
  }, [map]);

  return null;
};

// -------------------------------------------------------------
// Main Map Component
// -------------------------------------------------------------
const MapWithPMTiles = () => {
  return (
    <div className='App' style={{ height: '100vh' }}>
      <MapContainer
        center={initialCenter}
        zoom={initialZoom}
        minZoom={pmtilesMinZoom}
        maxZoom={pmtilesMaxZoom}
        scrollWheelZoom={true}
        style={{ height: '100vh', width: '100%' }}
      >
        <MapLogger />
        <PMTilesVectorLayer
          url={pmtilesPath}
          flavor='light'
          attribution='© <a href="https://www.swisstopo.ch/" target="_blank">swisstopo</a>'
          minZoom={pmtilesMinZoom}
          maxZoom={pmtilesMaxZoom}
        />
        <GeomanControls />
      </MapContainer>
    </div>
  );
};

export default MapWithPMTiles;
