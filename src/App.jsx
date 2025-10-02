import Map from './assets/Map';
import { useMapStore } from './store';

export default function App() {
  const { toggleLayerGroup, saveMap, loadMap, features } = useMapStore();

  // Example external function to change name
  const renameFirstFeature = () => {
    if (features.length > 0) {
      const firstId = features[0].id;
      useMapStore
        .getState()
        .updateFeature(firstId, { name: 'Renamed feature' });
    }
  };

  return (
    <div>
      <div style={{ padding: 10 }}>
        <button onClick={() => toggleLayerGroup('default')}>
          Toggle Default Group
        </button>
        <button onClick={saveMap}>Save Map</button>
        <button onClick={loadMap}>Load Map</button>
        <button onClick={renameFirstFeature}>Rename First Feature</button>
      </div>
      <Map />
    </div>
  );
}
