// PMTilesVectorLayer.jsx
import { createLayerComponent } from '@react-leaflet/core';
import * as protomapsL from 'protomaps-leaflet';
import { getLabelRules, getPaintRules } from './getLayerSymbolizers';
import { MAX_DATA_ZOOM } from './MapConfig';

const createPMTilesLayer = (props, context) => {
  const instance = protomapsL.leafletLayer({
    url: props.url,
    attribution: props.attribution,
    minZoom: props.minZoom,
    maxZoom: props.maxZoom,
    maxDataZoom: MAX_DATA_ZOOM,
    paintRules: getPaintRules(),
    labelRules: getLabelRules(),
    backgroundColor: '#F7F8FA',
  });

  return { instance, context };
};

const PMTilesVectorLayer = createLayerComponent(createPMTilesLayer);

export default PMTilesVectorLayer;
