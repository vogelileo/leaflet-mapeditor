import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, useMapEvents } from 'react-leaflet';
import { useLeafletContext } from '@react-leaflet/core';
import * as protomapsL from 'protomaps-leaflet';
import 'leaflet/dist/leaflet.css';
import { getLabelRules, getPaintRules } from './getLayerSymbolizers';

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
