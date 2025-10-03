import { useState } from 'react';
import { useMapStore } from '../store';

export default function FeaturePopup({ feature }) {
  const { updateFeature } = useMapStore();
  const [localValues, setLocalValues] = useState({
    name: feature.name || '',
    color: feature.color || '#3388ff', // default leaflet blue
  });

  const handleChange = (field, value) => {
    setLocalValues((prev) => ({ ...prev, [field]: value }));
    updateFeature(feature.id, { [field]: value });
  };

  return (
    <div style={{ minWidth: '180px' }}>
      <div>
        <strong>ID:</strong> {feature.id}
      </div>
      <div>
        <strong>Type:</strong> {feature.type}
      </div>
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
