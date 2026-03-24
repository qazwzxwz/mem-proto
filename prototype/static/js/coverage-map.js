/* ══════════════════════════════════════════════
   Coverage Zone Map — Leaflet + CartoDB Dark Matter
   Зона охвата: Ленинградская область + СПб
   Границы: Nominatim / OpenStreetMap (runtime fetch)
     Leningrad Oblast  OSM relation R176095
     Saint Petersburg  OSM relation R337422
   ══════════════════════════════════════════════ */

const NOMINATIM = 'https://nominatim.openstreetmap.org/lookup?format=geojson&polygon_geojson=1&osm_ids=';
const OBLAST_ID = 'R176095';   /* Ленинградская область */
const SPB_ID    = 'R337422';   /* Санкт-Петербург       */

export function init() {
  const el = document.getElementById('coverage-map');
  if (!el || typeof L === 'undefined') return;

  /* ── Loading state ── */
  el.setAttribute('data-loading', '');

  /* ── Map instance ── */
  const map = L.map('coverage-map', {
    zoomControl:        false,
    attributionControl: false,
    scrollWheelZoom:    false,
    doubleClickZoom:    false,
    dragging:           true,
    tap:                false,
  });

  /* ── Tiles: OpenStreetMap (русские подписи) + CSS invert для тёмной темы ── */
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom:     19,
    attribution: '',
  }).addTo(map);

  /* ── Minimal attribution ── */
  L.control.attribution({ position: 'bottomright', prefix: false })
    .addAttribution('© <a href="https://www.openstreetmap.org/copyright" style="color:rgba(255,255,255,0.2)">OSM</a> © <a href="https://carto.com/" style="color:rgba(255,255,255,0.2)">CARTO</a>')
    .addTo(map);

  /* ── Zoom control ── */
  L.control.zoom({ position: 'topright' }).addTo(map);

  /* ── Polygon styles ── */
  const oblastStyle = {
    color:       '#E93C35',
    weight:      1.5,
    opacity:     0.65,
    fillColor:   '#E93C35',
    fillOpacity: 0.08,
    dashArray:   '4 3',
  };
  const cityStyle = {
    color:       '#E93C35',
    weight:      2,
    opacity:     0.9,
    fillColor:   '#E93C35',
    fillOpacity: 0.22,
    dashArray:   null,
  };

  /* ── Fetch both boundaries in parallel ── */
  Promise.all([
    fetch(`${NOMINATIM}${OBLAST_ID}`).then(r => r.json()),
    fetch(`${NOMINATIM}${SPB_ID}`).then(r => r.json()),
  ])
  .then(([oblastData, spbData]) => {
    el.removeAttribute('data-loading');

    const oblastLayer = L.geoJSON(oblastData, { style: oblastStyle }).addTo(map);

    const spbLayer = L.geoJSON(spbData, { style: cityStyle }).addTo(map);

    /* SPb label marker */
    const spbCenter = spbLayer.getBounds().getCenter();
    L.marker(spbCenter, { icon: spbIcon() })
      .bindTooltip('Санкт-Петербург', {
        permanent:  true,
        direction:  'right',
        offset:     [10, 0],
        className:  'coverage-tooltip',
      })
      .addTo(map);

    /* Fit to full zone */
    map.fitBounds(oblastLayer.getBounds(), { padding: [32, 32] });
  })
  .catch(() => {
    el.removeAttribute('data-loading');
    /* Fallback to local GeoJSON if Nominatim unreachable */
    fetch('./static/data/coverage.geojson')
      .then(r => r.json())
      .then(data => {
        const layer = L.geoJSON(data, {
          style: f => f.properties.type === 'city' ? cityStyle : oblastStyle,
        }).addTo(map);
        map.fitBounds(layer.getBounds(), { padding: [32, 32] });
      })
      .catch(() => map.setView([59.95, 30.33], 7));
  });
}

/* ── SPb dot icon ── */
function spbIcon() {
  return L.divIcon({
    className:  'coverage-marker',
    html:       '<span class="coverage-marker__dot"></span>',
    iconSize:   [10, 10],
    iconAnchor: [5, 5],
  });
}
