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

export default function Map() {
  const { features, addFeature, updateFeature, removeFeature } = useMapStore();
  const featureGroupRef = useRef(null);

  const onCreated = (e) => {
    const layer = e.layer;
    const id = layer._leaflet_id.toString();
    let type = 'marker';
    let coords;

    if (layer instanceof L.Marker) {
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
      id,
      type,
      coordinates: coords,
      layerGroup: 'default',
      visible: true,
      name: '',
      description: '',
    });
  };

  const onEdited = (e) => {
    e.layers.eachLayer((layer) => {
      const id = layer._leaflet_id.toString();
      if (
        layer instanceof L.Marker ||
        layer instanceof L.Polygon ||
        layer instanceof L.Polyline
      ) {
        updateFeature(id, {
          coordinates: layer.getLatLngs
            ? layer.getLatLngs()
            : layer.getLatLng(),
        });
      } else if (layer instanceof L.Circle) {
        updateFeature(id, {
          coordinates: { lat: layer.getLatLng(), radius: layer.getRadius() },
        });
      }
    });
  };

  const onDeleted = (e) => {
    e.layers.eachLayer((layer) => removeFeature(layer._leaflet_id.toString()));
  };

  return (
    <MapContainer
      center={initialCenter}
      zoom={initialZoom}
      minZoom={pmtilesMinZoom}
      maxZoom={pmtilesMaxZoom}
      style={{ height: '100vh', width: '100%' }}
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
        {featureGroupRef.current && (
          <EditControl
            position='topright'
            featureGroup={featureGroupRef.current} // <- pass the actual Leaflet FeatureGroup
            onCreated={onCreated}
            onEdited={onEdited}
            onDeleted={onDeleted}
            draw={{ rectangle: false, circlemarker: false }}
          />
        )}

        {/* Render your features inside the FeatureGroup */}
        {features.map(
          (f) =>
            f.visible &&
            (f.type === 'marker' ? (
              <Marker key={f.id} position={f.coordinates}>
                <Popup>{f.name || 'Unnamed marker'}</Popup>
              </Marker>
            ) : f.type === 'polygon' ? (
              <Polygon key={f.id} positions={f.coordinates}>
                <Popup>{f.name}</Popup>
              </Polygon>
            ) : f.type === 'line' ? (
              <Polyline key={f.id} positions={f.coordinates}>
                <Popup>{f.name}</Popup>
              </Polyline>
            ) : f.type === 'circle' ? (
              <Circle
                key={f.id}
                center={f.coordinates.lat}
                radius={f.coordinates.radius}
              >
                <Popup>{f.name}</Popup>
              </Circle>
            ) : null)
        )}
      </FeatureGroup>
    </MapContainer>
  );
}
