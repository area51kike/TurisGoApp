import { ref } from 'vue'

const STORAGE_KEY = 'turisgo.routes.v1'

function readRoutes() {
  try {
    const value = JSON.parse(window.localStorage.getItem(STORAGE_KEY))
    return Array.isArray(value) ? value : []
  } catch {
    return []
  }
}

export const savedRoutes = ref(readRoutes())

function persist() {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(savedRoutes.value))
    return true
  } catch {
    return false
  }
}

export function saveRoute(route) {
  const entry = {
    ...route,
    id: `${route.placeId}-${Date.now()}`,
    savedAt: new Date().toISOString(),
  }
  savedRoutes.value = [entry, ...savedRoutes.value.filter((item) => item.placeId !== route.placeId)]
  return persist()
}

export function deleteRoute(id) {
  savedRoutes.value = savedRoutes.value.filter((item) => item.id !== id)
  return persist()
}

export function findSavedRoute(placeId) {
  return savedRoutes.value.find((item) => item.placeId === placeId) || null
}

export function getCurrentPosition() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) return reject({ code: 0 })
    navigator.geolocation.getCurrentPosition(
      (position) => resolve([position.coords.latitude, position.coords.longitude]),
      (error) => reject(error),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 },
    )
  })
}

export function distanceMeters(from, to) {
  const rad = (deg) => (deg * Math.PI) / 180
  const dLat = rad(to[0] - from[0])
  const dLon = rad(to[1] - from[1])
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(from[0])) * Math.cos(rad(to[0])) * Math.sin(dLon / 2) ** 2
  return 6371000 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

export function formatDistance(meters) {
  return meters >= 1000 ? `${(meters / 1000).toFixed(1)} km` : `${Math.round(meters)} m`
}

export function formatDuration(seconds) {
  const minutes = Math.max(1, Math.round(seconds / 60))
  if (minutes < 60) return `${minutes} min`
  return `${Math.floor(minutes / 60)} h ${minutes % 60} min`
}

// Usa las coordenadas del lugar; si no existen, las busca por nombre (OpenStreetMap Nominatim).
export async function resolvePlaceCoordinates(place) {
  if (Array.isArray(place?.coordinates) && place.coordinates.length === 2) return place.coordinates
  if (!place) return null
  try {
    const query = place.mapQuery || `${place.name}, ${place.region}, El Salvador`
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=sv&q=${encodeURIComponent(query)}`,
    )
    const data = await response.json()
    return data[0] ? [Number(data[0].lat), Number(data[0].lon)] : null
  } catch {
    return null
  }
}

function describeStep(step, english) {
  const type = step.maneuver?.type
  const modifier = step.maneuver?.modifier
  const street = step.name ? ` ${english ? 'onto' : 'por'} ${step.name}` : ''
  const turns = {
    es: {
      left: 'a la izquierda',
      right: 'a la derecha',
      'slight left': 'ligeramente a la izquierda',
      'slight right': 'ligeramente a la derecha',
      'sharp left': 'cerrado a la izquierda',
      'sharp right': 'cerrado a la derecha',
      straight: 'de frente',
      uturn: 'en retorno',
    },
    en: {
      left: 'left',
      right: 'right',
      'slight left': 'slight left',
      'slight right': 'slight right',
      'sharp left': 'sharp left',
      'sharp right': 'sharp right',
      straight: 'straight',
      uturn: 'make a U-turn',
    },
  }[english ? 'en' : 'es']
  const turn = turns[modifier] || ''
  if (type === 'depart') return english ? `Start${street}` : `Inicia${street}`
  if (type === 'arrive') return english ? 'You have arrived' : 'Has llegado a tu destino'
  if (type === 'roundabout' || type === 'rotary')
    return english ? `Take the roundabout${street}` : `Entra a la rotonda${street}`
  if (type === 'merge') return english ? `Merge${street}` : `Incorpórate${street}`
  if (type === 'fork') return english ? `Keep ${turn}${street}` : `Mantente ${turn}${street}`
  if (type === 'continue' || type === 'new name')
    return english ? `Continue${street}` : `Continúa${street}`
  return english ? `Turn ${turn}${street}` : `Gira ${turn}${street}`
}

function simplify(points, max = 700) {
  if (points.length <= max) return points
  const step = Math.ceil(points.length / max)
  const result = points.filter((_, index) => index % step === 0)
  result.push(points[points.length - 1])
  return result
}

// Calcula la ruta en carretera con OSRM, sin salir de la app.
export async function fetchDrivingRoute(from, to, english = false) {
  const url =
    `https://router.project-osrm.org/route/v1/driving/${from[1]},${from[0]};${to[1]},${to[0]}` +
    '?overview=full&geometries=geojson&steps=true'
  const response = await fetch(url)
  if (!response.ok) throw new Error('route-http')
  const data = await response.json()
  const route = data.routes?.[0]
  if (data.code !== 'Ok' || !route) throw new Error('route-none')
  const line = simplify(route.geometry.coordinates.map(([lon, lat]) => [lat, lon]))
  const steps = (route.legs?.[0]?.steps || []).map((step) => ({
    text: describeStep(step, english),
    distance: Math.round(step.distance),
    location: [step.maneuver.location[1], step.maneuver.location[0]],
  }))
  return { from, to, line, steps, distance: route.distance, duration: route.duration }
}
