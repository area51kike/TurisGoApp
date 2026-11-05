<template>
  <section class="page-section map-page">
    <header class="page-heading">
      <span class="eyebrow">{{ isEnglish ? 'EXPLORE WITHOUT LEAVING TURISGO' : 'EXPLORA SIN SALIR DE TURISGO' }}</span>
      <h1>{{ isEnglish ? 'Destination map' : 'Mapa de destinos' }}</h1>
      <p>{{ isEnglish ? 'Choose a place to see it on the map.' : 'Elige un lugar para verlo en el mapa.' }}</p>
    </header>

    <q-select
      :model-value="selectedMapPlace"
      :options="places"
      option-label="name"
      outlined
      rounded
      :label="isEnglish ? 'Destination' : 'Destino'"
      @update:model-value="$emit('update:selectedMapPlace', $event)"
    >
      <template #option="scope">
        <q-item v-bind="scope.itemProps">
          <q-item-section avatar><q-icon :name="scope.opt.type === 'hotel' ? 'bed' : 'landscape'" /></q-item-section>
          <q-item-section><q-item-label>{{ isEnglish ? scope.opt.nameEn : scope.opt.name }}</q-item-label><q-item-label caption>{{ scope.opt.region }}</q-item-label></q-item-section>
        </q-item>
      </template>
    </q-select>

    <div v-if="selectedMapPlace" class="map-place-card">
      <div class="map-place-card__top">
        <img :src="selectedMapPlace.image" :alt="isEnglish ? selectedMapPlace.nameEn : selectedMapPlace.name" />
        <div><span class="eyebrow">{{ selectedMapPlace.region }}</span><strong>{{ isEnglish ? selectedMapPlace.nameEn : selectedMapPlace.name }}</strong><small><q-icon name="star" class="text-gold" /> {{ selectedMapPlace.rating ? selectedMapPlace.rating.toFixed(1) : (isEnglish ? 'New' : 'Nuevo') }}</small></div>
      </div>
      <div class="map-embed">
        <iframe
          :src="mapEmbedUrl"
          :title="isEnglish ? `Map showing ${selectedMapPlace.nameEn}` : `Mapa de ${selectedMapPlace.name}`"
          loading="lazy"
          referrerpolicy="no-referrer-when-downgrade"
          allowfullscreen
        ></iframe>
      </div>
      <div class="map-actions">
        <q-btn outline rounded icon="info" color="primary" :label="isEnglish ? 'Place details' : 'Ver detalles'" @click="$emit('select-place', selectedMapPlace)" />
        <q-btn unelevated rounded icon="near_me" color="primary" :label="isEnglish ? 'Directions' : 'Cómo llegar'" @click="openDirections" />
        <q-btn class="route-download" outline rounded icon="download" color="primary" :disable="!selectedMapPlace.coordinates" :label="isEnglish ? 'Download route for this destination (.gpx)' : 'Descargar ruta a este destino (.gpx)'" @click="downloadRoute" />
      </div>
      <p class="map-note"><q-icon name="info" /> {{ isEnglish ? 'The map stays inside the app. Directions can also open in Google Maps.' : 'El mapa se muestra dentro de la app. También puedes abrir la ruta en Google Maps.' }}</p>
    </div>
  </section>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  isEnglish: Boolean,
  places: { type: Array, required: true },
  selectedMapPlace: { type: Object, default: null },
})
defineEmits(['update:selectedMapPlace', 'select-place'])

const mapEmbedUrl = computed(() => {
  if (props.selectedMapPlace?.mapQuery) {
    return `https://maps.google.com/maps?q=${encodeURIComponent(props.selectedMapPlace.mapQuery)}&z=14&output=embed`
  }
  const [lat, lng] = props.selectedMapPlace?.coordinates || [13.6929, -89.2182]
  return `https://maps.google.com/maps?q=${lat},${lng}&z=14&output=embed`
})

function openDirections() {
  const place = props.selectedMapPlace
  if (!place) return
  const query = encodeURIComponent(`${place.name}, ${place.region}, El Salvador`)
  window.open(`https://www.google.com/maps/dir/?api=1&destination=${query}`, '_blank', 'noopener,noreferrer')
}

function downloadRoute() {
  const place = props.selectedMapPlace
  if (!place?.coordinates) return
  const [lat, lng] = place.coordinates
  const label = props.isEnglish ? place.nameEn : place.name
  const safeLabel = label.replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' })[character])
  const gpx = `<?xml version="1.0" encoding="UTF-8"?><gpx version="1.1" creator="TURISGO" xmlns="http://www.topografix.com/GPX/1/1"><rte><name>${safeLabel}</name><rtept lat="${lat}" lon="${lng}"><name>${safeLabel}</name></rtept></rte></gpx>`
  const url = URL.createObjectURL(new Blob([gpx], { type: 'application/gpx+xml' }))
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = `${place.id}.gpx`
  anchor.click()
  window.setTimeout(() => URL.revokeObjectURL(url), 1500)
}
</script>
