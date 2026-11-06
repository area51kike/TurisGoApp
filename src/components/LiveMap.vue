<template>
  <div class="live-map" :style="{ height }">
    <div ref="canvas" class="live-map__canvas"></div>
    <q-btn
      round
      unelevated
      color="primary"
      icon="my_location"
      class="live-map__locate"
      :aria-label="isEnglish ? 'Center on my location' : 'Centrar en mi ubicación'"
      @click="centerOnUser"
    />
    <div v-if="locationError" class="live-map__status" @click="startWatching">
      <q-icon name="location_off" />
      <span>{{ locationError }}</span>
      <strong>{{ isEnglish ? 'Tap to retry' : 'Toca para reintentar' }}</strong>
    </div>
  </div>
</template>

<script setup>
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

const props = defineProps({
  isEnglish: Boolean,
  destination: { type: Array, default: null },
  destinationLabel: { type: String, default: '' },
  routeLine: { type: Array, default: () => [] },
  height: { type: String, default: '320px' },
})
const emit = defineEmits(['position'])

const canvas = ref(null)
const locationError = ref('')
let map = null
let userMarker = null
let accuracyCircle = null
let destinationMarker = null
let routeLayer = null
let watchId = null
let resizeObserver = null
let lastPosition = null
let centeredOnce = false

const userIcon = L.divIcon({
  className: 'tg-user-marker',
  html: '<span class="tg-user-marker__pulse"></span><span class="tg-user-marker__dot"></span>',
  iconSize: [22, 22],
  iconAnchor: [11, 11],
})
const destinationIcon = L.divIcon({
  className: 'tg-destination-marker',
  html: '<span></span>',
  iconSize: [28, 28],
  iconAnchor: [14, 28],
})

function onPosition(position) {
  const point = [position.coords.latitude, position.coords.longitude]
  lastPosition = point
  locationError.value = ''
  if (!userMarker) {
    userMarker = L.marker(point, { icon: userIcon, zIndexOffset: 1000, interactive: false }).addTo(
      map,
    )
    accuracyCircle = L.circle(point, {
      radius: position.coords.accuracy,
      color: '#0091e0',
      weight: 1,
      fillOpacity: 0.12,
      interactive: false,
    }).addTo(map)
  } else {
    userMarker.setLatLng(point)
    accuracyCircle.setLatLng(point).setRadius(position.coords.accuracy)
  }
  emit('position', point)
  if (!centeredOnce && !props.destination && !props.routeLine.length) {
    centeredOnce = true
    map.setView(point, 14)
  }
}

function onLocationError(error) {
  const es = {
    0: 'Este dispositivo no permite usar la ubicación.',
    1: 'Permite el acceso a la ubicación para verte en el mapa.',
    2: 'No pudimos obtener tu ubicación. Prueba al aire libre.',
    3: 'La ubicación tardó demasiado en responder.',
  }
  const en = {
    0: 'This device does not support location.',
    1: 'Allow location access to see yourself on the map.',
    2: 'Could not get your location. Try outdoors.',
    3: 'Location took too long to respond.',
  }
  locationError.value = (props.isEnglish ? en : es)[error.code] || (props.isEnglish ? en : es)[2]
}

function startWatching() {
  if (!navigator.geolocation) return onLocationError({ code: 0 })
  if (watchId !== null) navigator.geolocation.clearWatch(watchId)
  watchId = navigator.geolocation.watchPosition(onPosition, onLocationError, {
    enableHighAccuracy: true,
    maximumAge: 5000,
    timeout: 20000,
  })
}

function centerOnUser() {
  if (lastPosition) map.setView(lastPosition, Math.max(map.getZoom(), 15), { animate: true })
  else startWatching()
}

function fitContent() {
  if (!map) return
  const points = []
  if (props.routeLine.length) points.push(...props.routeLine)
  else if (props.destination) points.push(props.destination)
  if (lastPosition && props.routeLine.length) points.push(lastPosition)
  if (points.length > 1) map.fitBounds(L.latLngBounds(points), { padding: [34, 34] })
  else if (points.length === 1) map.setView(points[0], 14)
}

function drawDestination() {
  if (destinationMarker) {
    destinationMarker.remove()
    destinationMarker = null
  }
  if (props.destination) {
    destinationMarker = L.marker(props.destination, { icon: destinationIcon })
      .addTo(map)
      .bindPopup(props.destinationLabel || '')
  }
}

function drawRoute() {
  if (routeLayer) {
    routeLayer.remove()
    routeLayer = null
  }
  if (props.routeLine.length) {
    routeLayer = L.polyline(props.routeLine, { color: '#0091e0', weight: 6, opacity: 0.9 }).addTo(
      map,
    )
  }
}

onMounted(() => {
  map = L.map(canvas.value, { zoomControl: false, attributionControl: true }).setView(
    [13.6929, -89.2182],
    9,
  )
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '© OpenStreetMap',
  }).addTo(map)
  L.control.zoom({ position: 'topright' }).addTo(map)
  drawDestination()
  drawRoute()
  fitContent()
  startWatching()
  resizeObserver = new ResizeObserver(() => map && map.invalidateSize())
  resizeObserver.observe(canvas.value)
})

onBeforeUnmount(() => {
  if (watchId !== null && navigator.geolocation) navigator.geolocation.clearWatch(watchId)
  if (resizeObserver) resizeObserver.disconnect()
  if (map) map.remove()
  map = null
})

watch(
  () => props.destination,
  () => {
    drawDestination()
    fitContent()
  },
)
watch(
  () => props.routeLine,
  () => {
    drawRoute()
    fitContent()
  },
)
</script>

<style lang="scss">
.live-map {
  position: relative;
  width: 100%;
  background: var(--surface-raised);
  overflow: hidden;
}
.live-map__canvas {
  position: absolute;
  inset: 0;
  z-index: 0;
}
.live-map__locate {
  position: absolute;
  right: 10px;
  bottom: 22px;
  z-index: 500;
}
.live-map__status {
  position: absolute;
  left: 10px;
  right: 60px;
  bottom: 12px;
  z-index: 500;
  display: grid;
  gap: 2px;
  padding: 8px 10px;
  border-radius: 12px;
  background: rgba(3, 27, 46, 0.92);
  color: #f4f9fd;
  font-size: 11px;
  line-height: 1.35;
  cursor: pointer;
}
.live-map__status strong {
  color: #fbc056;
}
.live-map .leaflet-container {
  font-family: inherit;
}
.tg-user-marker {
  background: transparent;
  border: 0;
}
.tg-user-marker__dot {
  position: absolute;
  inset: 3px;
  border-radius: 50%;
  background: #1a73e8;
  border: 3px solid #fff;
  box-shadow: 0 1px 6px rgba(0, 0, 0, 0.45);
}
.tg-user-marker__pulse {
  position: absolute;
  inset: -8px;
  border-radius: 50%;
  background: rgba(26, 115, 232, 0.28);
  animation: tg-pulse 2s ease-out infinite;
}
@keyframes tg-pulse {
  0% {
    transform: scale(0.5);
    opacity: 1;
  }
  100% {
    transform: scale(1.4);
    opacity: 0;
  }
}
.tg-destination-marker {
  background: transparent;
  border: 0;
}
.tg-destination-marker span {
  display: block;
  width: 24px;
  height: 24px;
  margin: 0 2px;
  border-radius: 50% 50% 50% 0;
  background: #e65a7f;
  border: 3px solid #fff;
  transform: rotate(-45deg);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.4);
}
</style>
