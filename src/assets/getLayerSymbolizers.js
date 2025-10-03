import * as protomapsL from 'protomaps-leaflet';

/**
 * Common color definitions for the map style, using user-defined colors.
 */
export const Colors = {
  // Vom Benutzer definierte Farben
  land: '#F2F4F5', // Wiesen/Flächen (landcover/general) c
  forest: '#C3DDAE', // Wälder (landcover class=wood)
  building: '#000000', // Häuser/Gebäude (Polygon fill)
  waterway: 'rgb(77, 164, 218)', // Bachkonturen (Line color) c
  water: '#D3EEFF', // Flussmitte/Seen (Polygon fill) c
  transportationMotorway: '#FABE37', // Autobahn-Kern
  railway: '#C81C1C', // Bahnlinien
  contour: '#E0A360', // Helles Orange/Braun für Höhenlinien

  // Farben für Straßen nach den Vorgaben:
  transportationCore: '#FFFFFF', // Haupt- und Nebenstraßen (Kern)
  roadCasing: '#000000', // Dünne schwarze Umrundung (Casing)
  transportationMinor: '#000000', // Feldwege (Als einfache Linie)

  // Ergänzte neutrale Farben für den Rest der Karte
  park: '#C2DCB6',
  poi: '#ff6666',
  mountain: '#b0b0b0',
  elevation: '#a8a8a8',
  boundary: '#909090',
  text: '#000000',
  gray: '#eeeeee',
  construct: '#cccccc',
  extent: '#cccccc',
};

/**
 * Defines rules for drawing map geometry (polygons, lines, and points without text).
 */
export function getPaintRules() {
  return [
    // ------------------ POLYGONS ------------------
    {
      dataLayer: 'water',
      symbolizer: new protomapsL.PolygonSymbolizer({ fill: Colors.water }),
      sort: -10,
      minZoom: 7, // Seen/Flüsse früh anzeigen
    },

    // Wald/Forst
    {
      dataLayer: 'landcover',
      symbolizer: new protomapsL.PolygonSymbolizer({ fill: Colors.forest }),
      filter: (zoom, feature) => feature.props.class === 'wood',
      sort: -5,
      minZoom: 8,
    },
    // ... (park, landuse, landcover general)
    {
      dataLayer: 'park',
      symbolizer: new protomapsL.PolygonSymbolizer({ fill: Colors.park }),
      sort: -4,
      minZoom: 9,
    },

    {
      dataLayer: 'extent',
      symbolizer: new protomapsL.PolygonSymbolizer({
        fill: Colors.extent,
        opacity: 0.2,
      }),
      minZoom: 8,
    },
    {
      dataLayer: 'aeroway',
      symbolizer: new protomapsL.PolygonSymbolizer({ fill: Colors.gray }),
      minZoom: 10,
    },
    {
      dataLayer: 'bathymetry',
      symbolizer: new protomapsL.PolygonSymbolizer({
        fill: Colors.water,
        opacity: 0.3,
      }),
      sort: -9,
      minZoom: 7,
    },
    {
      dataLayer: 'building',
      symbolizer: new protomapsL.PolygonSymbolizer({ fill: Colors.building }),
      minZoom: 15, // Häuser erst spät anzeigen
    },

    // ------------------ LINES ------------------
    {
      dataLayer: 'waterway',
      symbolizer: new protomapsL.LineSymbolizer({
        color: Colors.waterway,
        width: 1.5,
      }),
      minZoom: 9, // Bachkonturen früh anzeigen
    },

    // ------------------ TRANSPORTATION (Road Casings - Draw under the main road line) ------------------
    // Autobahn-Casing
    {
      dataLayer: 'transportation',
      symbolizer: new protomapsL.LineSymbolizer({
        color: Colors.roadCasing,
        width: 6,
      }),
      filter: (zoom, feature) => feature.props.class === 'motorway',
      sort: 0,
      minZoom: 9,
    },
    // Haupt- und Nebenstraßen-Casing
    {
      dataLayer: 'transportation',
      symbolizer: new protomapsL.LineSymbolizer({
        color: Colors.roadCasing,
        width: 4,
      }),
      filter: (zoom, feature) =>
        [
          'trunk',
          'primary',
          'secondary',
          'tertiary',
          'residential',
          'unclassified',
        ].includes(feature.props.class),
      sort: 0,
      minZoom: 10,
    },

    // ------------------ TRANSPORTATION (Roads - Main Lines) ------------------

    // Bahnlinien (NEU: in transportation dataLayer mit class='rail')
    {
      dataLayer: 'transportation',
      symbolizer: new protomapsL.LineSymbolizer({
        color: Colors.railway, // #C81C1C
        width: 1.5,
        dashArray: '8, 4',
      }),
      filter: (zoom, feature) => feature.props.class === 'rail',
      sort: 1, // Über den Road Casings
      minZoom: 11,
    },

    // Autobahn (#FABE37)
    {
      dataLayer: 'transportation',
      symbolizer: new protomapsL.LineSymbolizer({
        color: Colors.transportationMotorway,
        width: 4,
      }),
      filter: (zoom, feature) => feature.props.class === 'motorway',
      sort: 1,
      minZoom: 10,
    },

    // Haupt- und Nebenstraßen (Weiss-Kern)
    {
      dataLayer: 'transportation',
      symbolizer: new protomapsL.LineSymbolizer({
        color: Colors.transportationCore,
        width: 3,
      }),
      filter: (zoom, feature) =>
        ['trunk', 'primary', 'secondary', 'tertiary'].includes(
          feature.props.class
        ),
      sort: 1,
      minZoom: 13,
    },

    // Wohn- und unklassifizierte Straßen (Weiss-Kern)
    {
      dataLayer: 'transportation',
      symbolizer: new protomapsL.LineSymbolizer({
        color: Colors.transportationCore,
        width: 1.5,
      }),
      filter: (zoom, feature) =>
        ['residential', 'unclassified'].includes(feature.props.class),
      sort: 1,
      minZoom: 14, // Etwas später als Hauptstraßen
    },

    // Feldwege (Schwarz)
    {
      dataLayer: 'transportation',
      symbolizer: new protomapsL.LineSymbolizer({
        color: Colors.transportationMinor,
        width: 0.5,
      }),
      filter: (zoom, feature) =>
        ['service', 'living_street', 'track', 'path', 'footway'].includes(
          feature.props.class
        ),
      sort: 1,
      minZoom: 15, // Kleinere Straßen spät anzeigen
    },

    // Konturen & Co.
    {
      dataLayer: 'boundary',
      symbolizer: new protomapsL.LineSymbolizer({
        color: Colors.boundary,
        width: 1,
        dashArray: '4, 2',
      }),
      minZoom: 10,
    },
    {
      dataLayer: 'building_ln',
      symbolizer: new protomapsL.LineSymbolizer({
        color: Colors.building,
        width: 0.5,
      }),
      minZoom: 15, // Gebäudelinien gleichzeitig mit Flächen
    },
    {
      dataLayer: 'contour_line',
      symbolizer: new protomapsL.LineSymbolizer({
        color: Colors.contour,
        width: 0.5,
        dashArray: '3,3',
      }),
      minZoom: 12,
    },
    {
      dataLayer: 'shortest_path',
      symbolizer: new protomapsL.LineSymbolizer({
        color: Colors.transportationCore,
        width: 1,
      }),
      minZoom: 14,
    },

    // ------------------ POINTS (Non-Text) ------------------
    {
      dataLayer: 'contour_line_pt',
      symbolizer: new protomapsL.CircleSymbolizer({
        fill: Colors.contour,
        radius: 2,
      }),
      minZoom: 13,
    },
    {
      dataLayer: 'landcover_pt',
      symbolizer: new protomapsL.CircleSymbolizer({
        fill: Colors.land,
        radius: 2,
      }),
      minZoom: 13,
    },
    {
      dataLayer: 'mountain_peak',
      symbolizer: new protomapsL.CircleSymbolizer({
        fill: Colors.mountain,
        radius: 3,
      }),
      minZoom: 10,
    },
    {
      dataLayer: 'poi',
      symbolizer: new protomapsL.CircleSymbolizer({
        fill: Colors.poi,
        radius: 3,
      }),
      minZoom: 14,
    },
    {
      dataLayer: 'spot_elevation',
      symbolizer: new protomapsL.CircleSymbolizer({
        fill: Colors.elevation,
        radius: 2,
      }),
      minZoom: 13,
    },
  ];
}

/**
 * Defines rules for drawing text labels on the map.
 */
export function getLabelRules() {
  const defaultTextProps = {
    font: '12px sans-serif',
    stroke: '#ffffff', // Weißer Halo
    strokeWidth: 2,
    fill: Colors.text, // Textfarbe: Schwarz
    // minZoom: 12,
  };

  return [
    {
      dataLayer: 'aerodrome_label',
      symbolizer: new protomapsL.TextSymbolizer({
        label: '[name]',
        ...defaultTextProps,
      }),
      minZoom: 10,
    },
    {
      dataLayer: 'area_name',
      symbolizer: new protomapsL.TextSymbolizer({
        label: '[name]',
        ...defaultTextProps,
      }),
      minZoom: 11,
    },
    {
      dataLayer: 'housenumber',
      symbolizer: new protomapsL.TextSymbolizer({
        label: '[housenumber]',
        ...defaultTextProps,
      }),
      minZoom: 16,
    },
    {
      dataLayer: 'place',
      symbolizer: new protomapsL.TextSymbolizer({
        label: '[name]',
        ...defaultTextProps,
        font: 'bold 14px sans-serif',
      }),
      minZoom: 8,
    },
    {
      dataLayer: 'transportation_name',
      symbolizer: new protomapsL.TextSymbolizer({
        label: '[name]',
        fill: Colors.text,
        ...defaultTextProps,
      }),
      minZoom: 8,
    },
    {
      dataLayer: 'water_name',
      symbolizer: new protomapsL.TextSymbolizer({
        label: '[name]',
        fill: Colors.waterway, // Nutzt die Bachkonturen-Farbe für Wasser-Labels
        ...defaultTextProps,
      }),
      minZoom: 12,
    },
  ];
}
