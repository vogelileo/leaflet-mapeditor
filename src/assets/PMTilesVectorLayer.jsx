// PMTilesVectorLayer.jsx
import { useEffect } from 'react';
import { useLeafletContext } from '@react-leaflet/core';
import * as protomapsL from 'protomaps-leaflet';
import { getLabelRules, getPaintRules } from './getLayerSymbolizers';
import { MAX_DATA_ZOOM } from './MapConfig';

const PMTilesVectorLayer = ({ url, flavor, attribution, minZoom, maxZoom }) => {
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

    return () => {
      map.removeLayer(layer);
    };
  }, [url, flavor, attribution, minZoom, maxZoom, context.map]);

  return null;
};

export default PMTilesVectorLayer;
