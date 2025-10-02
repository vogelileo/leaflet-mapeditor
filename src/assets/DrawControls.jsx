// DrawControls.jsx
import { useEffect, useState } from 'react';
import { FeatureGroup, useMap } from 'react-leaflet';
import L, { layerGroup, map } from 'leaflet';

const getColor = (layer) => layer.feature?.properties?.color || '#1d4ed8';

const getName = (layer, text) => layer.feature?.properties?.name || text || '';

const getTooltipContent = (layerId, type, color, name) => `
  <div style="min-width: 180px;" id="tooltip-content-${layerId}">
    <div><strong>Type:</strong> ${type || ''}</div>
    <div style="margin: 6px 0;">
      <label>
        <strong>Color:</strong>
        <input type="color" id="color-input-${layerId}" value="${color}" />
      </label>
    </div>
    <div style="margin: 6px 0;">
      <label>
        <strong>Name:</strong>
        <input type="text" id="name-input-${layerId}" value="${name}" />
      </label>
    </div>
    <button data-layer-id="${layerId}" class="save-tooltip-btn">Save</button>
  </div>
`;

const saveTooltipValues = (map, layer, type, color, name) => {
  const layerId = L.Util.stamp(layer);

  // Update tooltip
  const tooltip = layer.getTooltip();
  if (tooltip) {
    tooltip.setContent(getTooltipContent(layerId, type, color, name));
  }

  // Apply color
  if (layer.setStyle) {
    layer.setStyle({ color });
  }

  // Ensure feature + properties exist
  if (!layer.feature) layer.feature = { type: 'Feature', properties: {} };
  if (!layer.feature.properties) layer.feature.properties = {};

  layer.feature.properties.name = name;
  layer.feature.properties.color = color;
  layer.feature.properties.layerGroup = layer.options.layerGroup || 'default';
  if (layer.options) layer.options.color = color;

  map.fire(L.Draw.Event.EDITED, { layers: L.layerGroup([layer]) });
};

const bindEditableTooltip = (map, layer, type, text) => {
  const layerId = L.Util.stamp(layer);
  const color = getColor(layer);
  const name = getName(layer, text);

  const tooltip = L.tooltip({
    permanent: true,
    direction: 'right',
    className: 'text-marker',
    interactive: true,
  }).setContent(getTooltipContent(layerId, type, color, name));

  layer.bindTooltip(tooltip);

  // Set initial values
  saveTooltipValues(map, layer, type, color, name);
};

const getAllFeatureGroups = (map) => {
  const groups = [];
  map.eachLayer((layer) => {
    if (layer instanceof FeatureGroup) {
      groups.add(layer);
    }
  });

  return groups;
};

const getFeatureGroup = (map, groupName) => {
  const groups = getAllFeatureGroups(map);
  return groups.find((g) => g.options?.layerGroup === groupName);
};

const createFeatureGroup = (map, groupName) => {
  const group = new L.FeatureGroup();
  group.options.layerGroup = groupName;
  group.addTo(map);
  return group;
};

const DrawControls = () => {
  const map = useMap();
  const [editableFeatures] = useState(createFeatureGroup(map, 'default'));

  useEffect(() => {
    editableFeatures.addTo(map);

    const drawControl = new L.Control.Draw({
      edit: { featureGroup: editableFeatures, remove: true },
      draw: {
        polygon: {
          allowIntersection: false,
          showArea: false,
          shapeOptions: { color: '#1d4ed8', fillOpacity: 0.5 },
        },
        marker: true,
        polyline: true,
        rectangle: false,
        circle: false,
        circlemarker: false,
      },
    });

    map.addControl(drawControl);

    // Handle creation
    map.on(L.Draw.Event.CREATED, (event) => {
      const layer = event.layer;
      const type = event.layerType;

      layer.options.layerGroup = 'default';
      if (getFeatureGroup(map, 'default')) {
        getFeatureGroup(map, 'default').addLayer(layer);
        editableFeatures.addLayer(layer);
      } else {
        createFeatureGroup(map, 'default').addLayer(layer);
        editableFeatures.addLayer(layer);
      }

      if (layer instanceof L.Marker) {
        const text = 'New marker';
        bindEditableTooltip(map, layer, type, text);
        layer.feature = {
          type: 'Feature',
          properties: { text, layerGroup: 'default' },
        };
      } else {
        bindEditableTooltip(map, layer, type);
      }
    });

    // Delegated save handler
    const handleSaveClick = (e) => {
      const btn = e.target.closest('.save-tooltip-btn');
      if (!btn) return;

      const layerId = btn.getAttribute('data-layer-id');
      const tooltipEl = document.querySelector(`#tooltip-content-${layerId}`);
      if (!tooltipEl) return;

      const colorInput = tooltipEl.querySelector(`#color-input-${layerId}`);
      const nameInput = tooltipEl.querySelector(`#name-input-${layerId}`);

      const color = colorInput?.value || '#1d4ed8';
      const name = nameInput?.value || '';

      // Find layer and save
      editableFeatures.eachLayer((layer) => {
        if (L.Util.stamp(layer) == layerId) {
          saveTooltipValues(
            map,
            layer,
            layer.feature?.geometry?.type,
            color,
            name
          );
        }
      });
    };

    const container = map.getContainer();
    container.addEventListener('click', handleSaveClick);

    return () => {
      map.removeControl(drawControl);
      map.off(L.Draw.Event.CREATED);
      container.removeEventListener('click', handleSaveClick);
    };
  }, [map, editableFeatures]);

  // Save all features
  const handleSave = () => {
    const geojson = editableFeatures.toGeoJSON();
    localStorage.setItem('drawnFeatures', JSON.stringify(geojson));
    console.log('Saved features to localStorage:', geojson);
  };

  // Load features
  const handleLoad = () => {
    const savedData = localStorage.getItem('drawnFeatures');
    if (!savedData) return alert('No saved features found.');
    const geojson = JSON.parse(savedData);
    console.log(geojson, savedData);

    editableFeatures.clearLayers();
    L.geoJSON(geojson, {
      onEachFeature: (feature, layer) => {
        if (feature.properties?.text) {
          bindEditableTooltip(
            map,
            layer,
            feature.geometry.type,
            feature.properties.text
          );
        } else {
          bindEditableTooltip(map, layer, feature.geometry.type);
        }
      },
    }).eachLayer((layer) => {
      console.log(layer);
      editableFeatures.addLayer(layer);
    });
  };

  return (
    <div style={{ position: 'absolute', top: 10, right: 10, zIndex: 1000 }}>
      <button onClick={handleSave} style={{ marginRight: 5 }}>
        Save Features
      </button>
      <button onClick={handleLoad}>Load Features</button>
    </div>
  );
};

export default DrawControls;
