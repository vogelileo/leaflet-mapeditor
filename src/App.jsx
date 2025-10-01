// MapWithPMTiles.jsx
import { MapContainer } from 'react-leaflet';
import PMTilesVectorLayer from './assets/PMTilesVectorLayer';
import DrawControls from './assets/DrawControls';
import MapLogger from './assets/MapLogger';
import {
  initialCenter,
  initialZoom,
  pmtilesMinZoom,
  pmtilesMaxZoom,
  pmtilesPath,
} from './assets/MapConfig';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import 'leaflet-draw/dist/leaflet.draw.css';
import 'leaflet-draw';

// Fix for missing default Leaflet icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const MapWithPMTiles = () => (
  <div style={{ height: '100vh' }}>
    <MapContainer
      center={initialCenter}
      zoom={initialZoom}
      minZoom={pmtilesMinZoom}
      maxZoom={pmtilesMaxZoom}
      style={{ height: '100vh', width: '100%' }}
    >
      <MapLogger />
      <PMTilesVectorLayer
        url={pmtilesPath}
        flavor='light'
        attribution='© <a href="https://www.swisstopo.ch/" target="_blank">swisstopo</a>'
        minZoom={pmtilesMinZoom}
        maxZoom={pmtilesMaxZoom}
      />
      <DrawControls />
    </MapContainer>
  </div>
);

export default MapWithPMTiles;
