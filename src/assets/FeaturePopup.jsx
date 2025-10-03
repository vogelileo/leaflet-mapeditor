import { useState, useMemo } from 'react';
import { useMapStore } from '../store';
import L from 'leaflet';
import 'leaflet-geometryutil'; // make sure this is installed

export default function FeaturePopup({ feature }) {
  const { updateFeature } = useMapStore();
  const [localValues, setLocalValues] = useState({
    name: feature.name || '',
    color: feature.color || '#3388ff',
  });

  const handleChange = (field, value) => {
    setLocalValues((prev) => ({ ...prev, [field]: value }));
    updateFeature(feature.id, { [field]: value });
  };

  // --- 📏 Geometry calculation ---
  const geometryInfo = useMemo(() => {
    if (!feature.coordinates) return null;

    // Convert into Leaflet LatLngs
    const toLatLngs = (coords) =>
      coords.map((c) =>
        Array.isArray(c) ? L.latLng(c[0], c[1]) : L.latLng(c)
      );

    if (feature.type === 'rectangle') {
      const latlngs = toLatLngs(feature.coordinates[0] || feature.coordinates);
      if (latlngs.length < 4) return null;

      const sw = latlngs[0];
      const ne = latlngs[2];

      const width = sw.distanceTo(L.latLng(sw.lat, ne.lng));
      const height = sw.distanceTo(L.latLng(ne.lat, sw.lng));

      return {
        width: width.toFixed(2),
        height: height.toFixed(2),
        area: (width * height).toFixed(2),
        unit: 'm',
      };
    }

    if (feature.type === 'polygon') {
      const latlngs = toLatLngs(feature.coordinates[0] || feature.coordinates);
      const area = L.GeometryUtil.geodesicArea(latlngs);
      return {
        area: area.toFixed(2),
        unit: 'm²',
      };
    }

    if (feature.type === 'polyline' || feature.type === 'line') {
      const latlngs = toLatLngs(feature.coordinates);
      let length = 0;
      for (let i = 0; i < latlngs.length - 1; i++) {
        length += latlngs[i].distanceTo(latlngs[i + 1]);
      }
      return {
        length: length.toFixed(2),
        unit: 'm',
      };
    }

    if (feature.type === 'circle') {
      const radius = feature.coordinates.radius || 0;
      const area = Math.PI * Math.pow(radius, 2);
      return {
        radius: radius.toFixed(2),
        area: area.toFixed(2),
        unit: 'm',
      };
    }

    return null;
  }, [feature]);

  return (
    <div style={{ minWidth: '200px' }}>
      <div>
        <strong>ID:</strong> {feature.id}
      </div>
      <div>
        <strong>Type:</strong> {feature.type}
      </div>
      {geometryInfo && (
        <div style={{ margin: '6px 0' }}>
          {feature.type === 'rectangle' && (
            <>
              <div>
                <strong>Width:</strong> {geometryInfo.width} {geometryInfo.unit}
              </div>
              <div>
                <strong>Height:</strong> {geometryInfo.height}{' '}
                {geometryInfo.unit}
              </div>
              <div>
                <strong>Area:</strong> {geometryInfo.area} m²
              </div>
            </>
          )}
          {feature.type === 'polygon' && (
            <div>
              <strong>Area:</strong> {geometryInfo.area} {geometryInfo.unit}
            </div>
          )}
          {(feature.type === 'polyline' || feature.type === 'line') && (
            <div>
              <strong>Length:</strong> {geometryInfo.length} {geometryInfo.unit}
            </div>
          )}
          {feature.type === 'circle' && (
            <>
              <div>
                <strong>Radius:</strong> {geometryInfo.radius}{' '}
                {geometryInfo.unit}
              </div>
              <div>
                <strong>Area:</strong> {geometryInfo.area} m²
              </div>
            </>
          )}
        </div>
      )}
      <div>
        <label>
          <strong>Name:</strong>
          <input
            type='text'
            value={localValues.name}
            onChange={(e) => handleChange('name', e.target.value)}
            style={{ width: '100%' }}
          />
        </label>
      </div>
      <div>
        <label>
          <strong>Color:</strong>
          <input
            type='color'
            value={localValues.color}
            onChange={(e) => handleChange('color', e.target.value)}
          />
        </label>
      </div>
    </div>
  );
}
