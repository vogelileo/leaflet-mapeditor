// MapLogger.jsx
import { useMapEvents } from 'react-leaflet';

const MapLogger = () => {
  const map = useMapEvents({
    zoomend: () => console.log(`Current zoom level: ${map.getZoom()}`),
  });

  return null;
};

export default MapLogger;
