// DrawControls.jsx
import { useEffect, useState } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';

const bindEditableTooltip = (map, layer, type, text) => {
  // Tooltip content: Type, Color, Name
  const getTooltipContent = (type, color, name) => `
    <div>
      <div><strong>Type:</strong> ${type || ''}</div>
      <div><strong>Color:</strong> ${color || ''}</div>
      <div><strong>Name:</strong> ${name || ''}</div>
    </div>
  `;

  // Get color from layer options if available
  const getColor = (layer) => {
    if (layer.options && layer.options.color) return layer.options.color;
    if (
      layer.feature &&
      layer.feature.properties &&
      layer.feature.properties.color
    )
      return layer.feature.properties.color;
    return '';
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
  }).setContent(getTooltipContent(type, color, name));

  layer.bindTooltip(tooltip).openTooltip();

  layer.on('click', (e) => {
    const container = map.getContainer();
    const input = document.createElement('input');
    input.type = 'text';

    // Extract the Name value from the tooltip
    const currentContent = layer.getTooltip().getContent();
    const match = currentContent.match(
      /<div><strong>Name:<\/strong> (.*?)<\/div>/
    );
    input.value = match ? match[1] : '';

    input.style.position = 'absolute';
    input.style.zIndex = 1000;
    input.style.left = `${e.containerPoint.x}px`;
    input.style.top = `${e.containerPoint.y}px`;
    input.style.minWidth = '100px';

    container.appendChild(input);
    input.focus();

    const save = () => {
      const newName = input.value;
      layer.getTooltip().setContent(getTooltipContent(type, color, newName));
      // Ensure layer.feature and layer.feature.properties exist
      if (!layer.feature) layer.feature = { type: 'Feature', properties: {} };
      if (!layer.feature.properties) layer.feature.properties = {};
      layer.feature.properties.name = newName;
      container.removeChild(input);
    };

    input.addEventListener('blur', save);
    input.addEventListener('keydown', (evt) => {
      if (evt.key === 'Enter') save();
      if (evt.key === 'Escape') container.removeChild(input);
    });
  });
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
