import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, useMap, useMapEvents } from 'react-leaflet';
import { useLeafletContext } from '@react-leaflet/core';
import * as protomapsL from 'protomaps-leaflet';
import 'leaflet/dist/leaflet.css';
import { getLabelRules, getPaintRules } from './getLayerSymbolizers';
import 'leaflet-draw';
import 'leaflet-draw/dist/leaflet.draw.css';
import L from 'leaflet';

// Fix for missing Leaflet default icon when using bundlers
// This line corrects the syntax error and performs a common fix for icon path issues.
delete L.Icon.Default.prototype._getIconUrl;

// Set the CDN paths for the marker icons
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// -------------------------------------------------------------
// 1. Custom Component to Handle PMTiles Vector Layer
// -------------------------------------------------------------
const MAX_DATA_ZOOM = 14; // Adjust based on your PMTiles data
// 🗺️ Configuration
const initialCenter = [47.2464, 8.658]; // Center on Switzerland
const initialZoom = 11;

// The path to your PMTiles file in the public folder
// 💡 Ensure 'swisstopo.base.vt.pmtiles' is in your public directory.
const pmtilesPath = '/swisstopo.base.vt.pmtiles';

const pmtilesMinZoom = 0;
const pmtilesMaxZoom = 20;
/**
 * A custom React-Leaflet component to render a vector PMTiles file
 * using the protomaps-leaflet library.
 * This component accesses the Leaflet map instance via the context.
 */
const PMTilesVectorLayer = ({ url, flavor, attribution, minZoom, maxZoom }) => {
  const context = useLeafletContext();
  useEffect(() => {
    // Access the raw Leaflet map instance
    const map = context.map;
    console.log(getPaintRules());
    // Create the Protomaps Leaflet layer (which handles the PMTiles loading)
    const layer = protomapsL.leafletLayer({
      url: url, // Path to your PMTiles file
      // flavor: flavor || 'dark', // e.g., light, dark, white, grayscale, black
      attribution: attribution,
      // Pass min/max zoom from props to the protomaps layer
      minZoom: minZoom,
      maxZoom: maxZoom,
      maxDataZoom: MAX_DATA_ZOOM, // Optional: set max data zoom if known
      // Optional: Add custom paintRules here for specific styling
      paintRules: getPaintRules(),
      labelRules: getLabelRules(),
    });

    // Add the layer to the map
    layer.addTo(map);

    // Cleanup function: remove the layer when the component unmounts
    return () => {
      map.removeLayer(layer);
    };
  }, [url, flavor, attribution, minZoom, maxZoom, context.map]);

  return null; // The component manages a side-effect and renders nothing itself
};

function MapLogger() {
  const map = useMapEvents({
    zoomend: () => {
      console.log(`Current zoom level: ${map.getZoom()}`);
    },
  });
  return null;
}

// --- Leaflet Draw Component ---
/**
 * Custom component to initialize Leaflet Draw controls using the useMap hook.
 * This component must be a child of MapContainer.
 */
const DrawControls = () => {
  // Get the Leaflet map instance
  const map = useMap();

  useEffect(() => {
    // 1. Create a Feature Group to store and manage the drawn features (polygons, markers)
    // This group is also required by the edit functionality of the Draw Control.
    const editableFeatures = new L.FeatureGroup().addTo(map);

    // 2. Initialize the Draw Control
    const drawControl = new L.Control.Draw({
      // Configuration for the Edit toolbar (move, edit, delete features)
      edit: {
        featureGroup: editableFeatures,
        remove: true,
        shapeOptions: {
          color: '#ef4444',
        },
      },
      draw: {
        polygon: {
          allowIntersection: false, // Prevent self-intersection
          showArea: false, // FIX: Disabled area calculation to prevent "type is not defined" ReferenceError
          shapeOptions: {
            color: '#1d4ed8', // A nice blue for the polygon outline
            fillOpacity: 0.5,
          },
          // Custom hint message
          repeatMode: false,
          tooltip: {
            start: 'Click to start drawing shape.',
            cont: 'Click to continue drawing shape.',
            end: 'Click first point to close this shape.',
          },
        },
        marker: true, // Enable marker drawing
        // Disable other drawing tools to keep the interface simple
        polyline: true,
        circlemarker: false,
        rectangle: false,
        circle: false,
      },
    });

    // Add the control to the map
    map.addControl(drawControl);

    // 3. Handle draw:created event
    // This event fires every time a feature (marker, polygon) is finished drawing.
    map.on(L.Draw.Event.CREATED, (event) => {
      const layer = event.layer;

      // Add the new layer to the editable feature group
      editableFeatures.addLayer(layer);

      // Log the GeoJSON data for the new feature
      console.log('--- Drawn Feature Created ---');
      console.log('Type:', event.layerType);
      console.log('GeoJSON Data:', layer.toGeoJSON());

      // OPTIONAL: Bind a popup with the GeoJSON data for demonstration
      layer
        .bindPopup(
          `<div style="font-family: sans-serif; max-width: 200px;">
          <p><strong>Type:</strong> ${event.layerType}</p>
          <p>Data logged to console. Use the edit tools to modify or delete.</p>
        </div>`
        )
        .openPopup();
    });

    // 4. Handle draw:deleted event
    map.on(L.Draw.Event.DELETED, (event) => {
      console.log('--- Feature(s) Deleted ---');
      console.log('Deleted layers:', event.layers.getLayers().length);
    });

    // Cleanup function: runs when the component unmounts
    return () => {
      map.removeControl(drawControl);
      map.off(L.Draw.Event.CREATED);
      map.off(L.Draw.Event.DELETED);
    };
  }, [map]);

  return null; // This component is for side effects only
};
// --- End of Draw Component ---

// -------------------------------------------------------------
// 2. Main Map Component for Testing
// -------------------------------------------------------------

/**
 * The main component that sets up the MapContainer and uses the PMTiles layer.
 */
const MapWithPMTiles = () => {
  return (
    <div className='App' style={{ height: '100vh' }}>
      <MapContainer
        center={initialCenter}
        zoom={initialZoom}
        minZoom={pmtilesMinZoom}
        maxZoom={pmtilesMaxZoom}
        scrollWheelZoom={true}
        style={{ height: '100vh', width: '100%' }} // Map needs explicit dimensions
      >
        <MapLogger />
        {/* The PMTilesVectorLayer component loads and renders your vector tiles.
        It must be a direct child of MapContainer or a component that uses the map context.
      */}
        <PMTilesVectorLayer
          url={pmtilesPath}
          flavor='light'
          attribution='© <a href="https://www.swisstopo.ch/" target="_blank">swisstopo</a>'
          minZoom={pmtilesMinZoom}
          maxZoom={pmtilesMaxZoom}
        />
        <DrawControls />

        {/* Optional: Add a standard TileLayer for comparison/fallback, but usually 
          your vector PMTiles layer will be the base map. */}
        {/* <TileLayer
          attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
          url='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
        /> */}
      </MapContainer>{' '}
    </div>
  );
};

export default MapWithPMTiles;
