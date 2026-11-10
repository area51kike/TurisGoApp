import { distanceMeters } from './routeService'

// Búsqueda de lugares en tiempo real con Photon (OpenStreetMap).
// Gratis, sin API key, con CORS habilitado y pensada para autocompletar mientras se escribe.
// Docs: https://github.com/komoot/photon/blob/master/docs/api-v1.md
const PHOTON_URL = 'https://photon.komoot.io/api/'
// minLon,minLat,maxLon,maxLat -> limita los resultados a El Salvador
const EL_SALVADOR_BBOX = '-90.2,13.1,-87.6,14.5'
const SAN_SALVADOR = [13.6929, -89.2182]

export const MIN_QUERY_LENGTH = 3

const PLACEHOLDER_IMAGE =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="640" height="420" viewBox="0 0 640 420">' +
      '<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">' +
      '<stop offset="0" stop-color="#0091e0"/><stop offset="1" stop-color="#031b2e"/>' +
      '</linearGradient></defs>' +
      '<rect width="640" height="420" fill="url(#g)"/>' +
      '<path d="M320 120c-44 0-80 34-80 76 0 56 80 120 80 120s80-64 80-120c0-42-36-76-80-76zm0 106a30 30 0 1 1 0-60 30 30 0 0 1 0 60z" fill="#ffffff" fill-opacity=".85"/>' +
      '</svg>',
  )

// osm_key + osm_value -> tipo y categoría (en español e inglés).
// Los textos de categoría coinciden con los alias de los filtros de BuscarSection.
function classify(key, value) {
  if (
    key === 'tourism' &&
    ['hotel', 'hostel', 'guest_house', 'motel', 'apartment', 'resort', 'chalet'].includes(value)
  )
    return { type: 'hotel', category: 'Alojamiento', categoryEn: 'Lodging' }
  if (key === 'natural' && value === 'beach')
    return { type: 'destination', category: 'Playa', categoryEn: 'Beach' }
  if (key === 'natural' && value === 'volcano')
    return { type: 'destination', category: 'Volcán', categoryEn: 'Volcano' }
  if (key === 'natural' && ['peak', 'hill'].includes(value))
    return { type: 'destination', category: 'Montaña', categoryEn: 'Mountain' }
  if (key === 'waterway' && value === 'waterfall')
    return { type: 'destination', category: 'Cascada', categoryEn: 'Waterfall' }
  if (
    (key === 'natural' && value === 'water') ||
    (key === 'waterway' && ['river', 'stream'].includes(value))
  )
    return { type: 'destination', category: 'Lago y río', categoryEn: 'Lake and river' }
  if (
    (key === 'leisure' && ['park', 'nature_reserve'].includes(value)) ||
    (key === 'boundary' && value === 'national_park')
  )
    return { type: 'destination', category: 'Parque', categoryEn: 'Park' }
  if (key === 'tourism' && value === 'viewpoint')
    return { type: 'destination', category: 'Mirador', categoryEn: 'Viewpoint' }
  if (key === 'tourism' && value === 'museum')
    return { type: 'destination', category: 'Museo', categoryEn: 'Museum' }
  if (key === 'amenity' && ['restaurant', 'cafe', 'bar', 'fast_food'].includes(value))
    return { type: 'destination', category: 'Restaurante', categoryEn: 'Restaurant' }
  if (
    key === 'place' &&
    ['city', 'town', 'village', 'suburb', 'neighbourhood', 'hamlet'].includes(value)
  )
    return { type: 'destination', category: 'Pueblo', categoryEn: 'Town' }
  if (key === 'tourism')
    return { type: 'destination', category: 'Atracción turística', categoryEn: 'Attraction' }
  return { type: 'destination', category: 'Lugar', categoryEn: 'Place' }
}

function featureToPlace(feature) {
  const props = feature.properties || {}
  const [lon, lat] = feature.geometry?.coordinates || []
  if (!props.name || typeof lat !== 'number' || typeof lon !== 'number') return null

  const { type, category, categoryEn } = classify(props.osm_key, props.osm_value)
  const region = props.state || props.county || props.city || 'El Salvador'
  const area = [props.city, props.state].filter((part) => part && part !== props.name).join(', ')
  const km = distanceMeters(SAN_SALVADOR, [lat, lon]) / 1000

  return {
    id: `osm-${props.osm_type || 'X'}${props.osm_id}`,
    type,
    name: props.name,
    nameEn: props.name,
    region: String(region).replace(/^Departamento de /i, ''),
    description: `${category}${area ? ` en ${area}` : ''}. Resultado de OpenStreetMap; confirma horarios y precios antes de viajar.`,
    descriptionEn: `${categoryEn}${area ? ` in ${area}` : ''}. OpenStreetMap result; check hours and prices before you travel.`,
    image: PLACEHOLDER_IMAGE,
    gallery: [],
    rating: null,
    reviewsCount: 0,
    // Aproximación de combustible/transporte desde San Salvador (ajusta el factor a tu criterio).
    travelEstimate: Math.max(2, Math.round(km * 0.15)),
    coordinates: [lat, lon],
    category,
    categoryEn,
    priceLabel: 'Consultar',
    priceLabelEn: 'Check details',
    reviews: [],
    isRemote: true,
  }
}

// Devuelve lugares compatibles con PlaceCard / PlaceDetailDialog.
// Pasa un AbortSignal para cancelar la petición anterior cuando el usuario sigue escribiendo.
export async function searchRemotePlaces(query, { signal, limit = 8 } = {}) {
  const text = String(query || '').trim()
  if (text.length < MIN_QUERY_LENGTH) return []

  const params = new URLSearchParams({
    q: text,
    limit: String(limit),
    bbox: EL_SALVADOR_BBOX,
    lat: String(SAN_SALVADOR[0]),
    lon: String(SAN_SALVADOR[1]),
  })
  const response = await fetch(`${PHOTON_URL}?${params}`, { signal })
  if (!response.ok) throw new Error(`photon-${response.status}`)
  const data = await response.json()

  const seen = new Set()
  return (data.features || []).map(featureToPlace).filter((place) => {
    if (!place || seen.has(place.id)) return false
    seen.add(place.id)
    return true
  })
}
