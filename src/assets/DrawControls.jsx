// DrawControls.jsx
import { useEffect, useState } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';

const bindEditableTooltip = (map, layer, type, text) => {
  // Tooltip content: Type, Color, Name, Save button
  const layerId = L.Util.stamp(layer);
  const getTooltipContent = (type, color, name) => `
    <div style="min-width: 180px;" id="tooltip-content-${layerId}">
      <div><strong>Type:</strong> ${type || ''}</div>
      <div style="margin: 6px 0;">
        <label>
          <strong>Color:</strong>
          <input type="color" id="color-input-${layerId}" value="${
    color || '#1d4ed8'
  }" style="margin-left: 8px; vertical-align: middle;" />
        </label>
      </div>
      <div style="margin: 6px 0;">
        <label>
          <strong>Name:</strong>
          <input type="text" id="name-input-${layerId}" value="${
    name || ''
  }" style="margin-left: 8px; min-width: 80px;" />
        </label>
      </div>
      <button id="save-tooltip-btn-${layerId}" style="margin-top: 6px;">Save</button>
    </div>
  `;

  // Get color from layer options if available
  const getColor = (layer) => {
    if (
      layer.feature &&
      layer.feature.properties &&
      layer.feature.properties.color
    )
      return layer.feature.properties.color;
    return '#1d4ed8';
  };

  // Get name from feature properties or text
  const getName = (layer, text) => {
    if (
      layer.feature &&
      layer.feature.properties &&
      layer.feature.properties.name
    )
      return layer.feature.properties.name;
    return text || '';
  };

  const color = getColor(layer);
  const name = getName(layer, text);

  const tooltip = L.tooltip({
    permanent: true,
    direction: 'right',
    className: 'text-marker',
    interactive: true,
  }).setContent(getTooltipContent(type, color, name));

  layer.bindTooltip(tooltip);

  // Function to save tooltip values to the layer
  const saveTooltipValues = (layer, type, color, name) => {
    // Update tooltip content
    tooltip.setContent(getTooltipContent(type, color, name));

    // Update layer color (for polygons, polylines, etc.)
    if (layer.setStyle) {
      layer.setStyle({ color });
    }
    // For marker, update icon color if needed (not handled here)

    // Ensure layer.feature and layer.feature.properties exist
    if (!layer.feature) layer.feature = { type: 'Feature', properties: {} };
    if (!layer.feature.properties) layer.feature.properties = {};
    layer.feature.properties.name = name;
    layer.feature.properties.color = color;

    // Also update layer.options.color for consistency
    if (layer.options) layer.options.color = color;
  };

  // Attach event after tooltip is opened
  layer.on('tooltipopen', function (e) {
    const tooltipEl = document.querySelector('#tooltip-content-' + layerId);
    if (!tooltipEl) return;

    const colorInput = tooltipEl.querySelector('#color-input-' + layerId);
    const nameInput = tooltipEl.querySelector('#name-input-' + layerId);
    const saveBtn = tooltipEl.querySelector('#save-tooltip-btn-' + layerId);

    if (colorInput) colorInput.value = getColor(layer);
    if (nameInput) nameInput.value = getName(layer, text);

    saveBtn &&
      saveBtn.addEventListener('click', () => {
        const newColor = colorInput ? colorInput.value : color;
        const newName = nameInput ? nameInput.value : name;
        saveTooltipValues(layer, type, newColor, newName);
      });
  });

  // Call saveTooltipValues on load to set color and name
  saveTooltipValues(layer, type, color, name);
};

const DrawControls = () => {
  const map = useMap();
  const [editableFeatures] = useState(new L.FeatureGroup());

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

    map.on(L.Draw.Event.CREATED, (event) => {
      const layer = event.layer;
      const type = event.layerType;
      editableFeatures.addLayer(layer);

      if (layer instanceof L.Marker) {
        const text = 'New marker';
        bindEditableTooltip(map, layer, type, text);
        layer.feature = { type: 'Feature', properties: { text } };
      } else {
        bindEditableTooltip(map, layer, type);
      }
    });

    return () => {
      map.removeControl(drawControl);
      map.off(L.Draw.Event.CREATED);
    };
  }, [map, editableFeatures]);

  // Save / Load buttons
  const handleSave = () => {
    console.log('Original editableFeatures:');
    editableFeatures.eachLayer((layer) => console.log(layer));
    const geojson = editableFeatures.toGeoJSON();
    localStorage.setItem('drawnFeatures', JSON.stringify(geojson));
    console.log('Saved features to localStorage:', geojson);
  };

  const handleLoad = () => {
    const savedData = localStorage.getItem('drawnFeatures');
    if (!savedData) return alert('No saved features found.');
    const geojson = JSON.parse(savedData);

    editableFeatures.clearLayers();

    L.geoJSON(geojson, {
      onEachFeature: (feature, layer) => {
        console.log('Loaded feature:', feature);
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
    }).eachLayer((layer) => editableFeatures.addLayer(layer));
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
