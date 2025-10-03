import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polygon,
  Polyline,
  Circle,
  FeatureGroup,
} from 'react-leaflet';
import { EditControl } from 'react-leaflet-draw';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';
import { useMapStore } from '../store';
import { useRef } from 'react';
import {
  initialCenter,
  initialZoom,
  pmtilesMinZoom,
  pmtilesMaxZoom,
  pmtilesPath,
} from './MapConfig';
import PMTilesVectorLayer from './PMTilesVectorLayer';
import FeaturePopup from './FeaturePopup';
import { v4 as uuidv4 } from 'uuid';

export default function Map() {
  const { features, addFeature, updateFeature, removeFeature } = useMapStore();
  const featureGroupRef = useRef(null);

  const onCreated = (e) => {
    const layer = e.layer;
    const customId = uuidv4(); // ✅ stable ID
    layer.options.customId = customId; // ✅ attach to the layer

    let type = null;
    let coords;

    if (layer instanceof L.Marker) {
      type = 'marker';
      coords = layer.getLatLng();
    } else if (layer instanceof L.Polygon) {
      type = 'polygon';
      coords = layer.getLatLngs();
    } else if (layer instanceof L.Polyline) {
      type = 'line';
      coords = layer.getLatLngs();
    } else if (layer instanceof L.Circle) {
      type = 'circle';
      coords = { lat: layer.getLatLng(), radius: layer.getRadius() };
    }

    addFeature({
      id: customId,
      type,
      coordinates: coords,
      layerGroup: 'default',
      visible: true,
      name: `${type} ${customId.slice(-5)}`,
      description: '',
    });

    featureGroupRef.current.removeLayer(layer); // workaround for leaflet-draw bug
  };

  const onEdited = (e) => {
    console.log(e);
    e.layers.eachLayer((layer) => {
      const id = layer.options.customId;
      if (!id) {
        console.warn('Edited layer has no customId, skipping update', layer);
        return;
      }

      if (layer instanceof L.Marker) {
        updateFeature(id, { coordinates: layer.getLatLng() });
      } else if (layer instanceof L.Polygon || layer instanceof L.Polyline) {
        updateFeature(id, { coordinates: layer.getLatLngs() });
      } else if (layer instanceof L.Circle) {
        updateFeature(id, {
          coordinates: { lat: layer.getLatLng(), radius: layer.getRadius() },
        });
      }
    });
  };

  const onDeleted = (e) => {
    e.layers.eachLayer((layer) => {
      const id = layer.options.customId;
      if (!id) {
        console.warn('Deleted layer has no customId, skipping update', layer);
        return;
      }
      if (id) removeFeature(id);
    });
  };

  return (
    <MapContainer
      center={initialCenter}
      zoom={initialZoom}
      minZoom={pmtilesMinZoom}
      maxZoom={pmtilesMaxZoom}
      style={{ height: '80vh', width: '100%' }}
    >
      {/* <TileLayer url='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png' /> */}
      <PMTilesVectorLayer
        url={pmtilesPath}
        flavor='light'
        attribution='© <a href="https://www.swisstopo.ch/" target="_blank">swisstopo</a>'
        minZoom={pmtilesMinZoom}
        maxZoom={pmtilesMaxZoom}
      />
      <FeatureGroup ref={featureGroupRef}>
        <EditControl
          position='topright'
          featureGroup={featureGroupRef.current} // <- pass the actual Leaflet FeatureGroup
          onCreated={onCreated}
          onEdited={onEdited}
          onDeleted={onDeleted}
          draw={{ rectangle: false, circlemarker: false }}
          edit={{
            moveMarkers: true, // allows vertices to be dragged
            poly: { allowIntersection: false },
          }}
        />

        {/* Render your features inside the FeatureGroup */}
        {features.map(
          (f) =>
            f.visible &&
            (f.type === 'marker' ? (
              <Marker key={f.id} position={f.coordinates} customId={f.id}>
                <Popup>
                  <FeaturePopup feature={f} />
                </Popup>
              </Marker>
            ) : f.type === 'polygon' ? (
              <Polygon
                key={f.id}
                positions={f.coordinates}
                pathOptions={{ color: f.color || '#3388ff' }}
                customId={f.id}
              >
                <Popup>
                  <FeaturePopup feature={f} />
                </Popup>
              </Polygon>
            ) : f.type === 'line' ? (
              <Polyline
                key={f.id}
                positions={f.coordinates}
                pathOptions={{ color: f.color || '#3388ff' }}
                customId={f.id}
              >
                <Popup>
                  <FeaturePopup feature={f} />
                </Popup>
              </Polyline>
            ) : f.type === 'circle' ? (
              <Circle
                key={f.id}
                center={f.coordinates.lat}
                radius={f.coordinates.radius}
                pathOptions={{ color: f.color || '#3388ff' }}
                customId={f.id}
              >
                <Popup>
                  <FeaturePopup feature={f} />
                </Popup>
              </Circle>
            ) : null)
        )}
      </FeatureGroup>
    </MapContainer>
  );
}
