import LayerOverview from './assets/LayerOverview';
import Map from './assets/Map';
import { useMapStore } from './store';

export default function App() {
  const { saveMap, loadMap } = useMapStore();

  return (
    <div>
      <div style={{ padding: 10 }}>
        <button onClick={saveMap}>Save Map</button>
        <button onClick={loadMap}>Load Map</button>
      </div>
      <LayerOverview />
      <Map />
    </div>
  );
}
