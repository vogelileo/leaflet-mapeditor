import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polygon,
  Polyline,
  Circle,
  Rectangle,
  FeatureGroup,
  LayersControl,
  Tooltip,
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
    const customId = uuidv4();
    layer.options.customId = customId;

    let type = null;
    let coords;
    console.log(e.layer);
    if (layer instanceof L.Marker) {
      type = 'marker';
      coords = layer.getLatLng();
    } else if (layer instanceof L.Rectangle) {
      type = 'rectangle';
      coords = layer.getLatLngs();
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

    featureGroupRef.current.removeLayer(layer);
  };

  const onEdited = (e) => {
    e.layers.eachLayer((layer) => {
      const id = layer.options.customId;
      if (!id) return;

      if (layer instanceof L.Marker) {
        updateFeature(id, { coordinates: layer.getLatLng() });
      } else if (
        layer instanceof L.Polygon ||
        layer instanceof L.Polyline ||
        layer instanceof L.Rectangle
      ) {
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
      <LayersControl position='bottomright'>
        <LayersControl.BaseLayer checked name='Color Map - Offline'>
          <PMTilesVectorLayer
            url={pmtilesPath}
            attribution="© <a href='https://www.swisstopo.ch/'>swisstopo</a>"
            minZoom={pmtilesMinZoom}
            maxZoom={pmtilesMaxZoom}
          />
        </LayersControl.BaseLayer>
        <LayersControl.BaseLayer name='Aerial Map'>
          <TileLayer
            url='https://wmts.geo.admin.ch/1.0.0/ch.swisstopo.swissimage/default/current/3857/{z}/{x}/{y}.jpeg'
            maxZoom={20}
            attribution="&copy; <a href='https://www.swisstopo.ch/'>swisstopo</a>"
          />
        </LayersControl.BaseLayer>
      </LayersControl>

      <FeatureGroup ref={featureGroupRef}>
        <EditControl
          position='topleft'
          featureGroup={featureGroupRef.current}
          onCreated={onCreated}
          onEdited={onEdited}
          onDeleted={onDeleted}
          draw={{
            rectangle: {
              showArea: false,
            },
            circlemarker: false,
          }}
          edit={{
            moveMarkers: true,
            poly: { allowIntersection: false },
            rotate: true,
          }}
        />

        {features.map(
          (f) =>
            f.visible &&
            (f.type === 'marker' ? (
              <Marker key={f.id} position={f.coordinates} customId={f.id}>
                <Popup>
                  <FeaturePopup feature={f} />
                </Popup>
                <Tooltip direction='bottom' offset={[-15, 30]} permanent>
                  {f.name || 'Unnamed'}
                </Tooltip>
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
            ) : f.type === 'rectangle' ? (
              <Rectangle
                key={f.id}
                bounds={f.coordinates}
                pathOptions={{ color: f.color || '#3388ff' }}
                customId={f.id}
              >
                <Popup>
                  <FeaturePopup feature={f} />
                </Popup>
              </Rectangle>
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
