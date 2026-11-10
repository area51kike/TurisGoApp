<template>
  <section class="page-section search-page">
    <header class="page-heading">
      <span class="eyebrow">{{
        isEnglish ? 'FIND YOUR NEXT STOP' : 'ENCUENTRA TU PRÓXIMA PARADA'
      }}</span>
      <h1>{{ isEnglish ? 'Search' : 'Buscar' }}</h1>
      <p>
        {{
          isEnglish ? 'Search places, hotels, or a region.' : 'Busca destinos, hoteles o una zona.'
        }}
      </p>
    </header>
    <q-input
      v-model="query"
      outlined
      rounded
      :placeholder="isEnglish ? 'Hotel, beach, town…' : 'Hotel, playa, pueblo…'"
      class="search-page__input"
    >
      <template #prepend><q-icon name="search" /></template>
      <template v-if="query" #append
        ><q-btn round dense flat icon="close" @click="query = ''"
      /></template>
    </q-input>
    <div class="filter-chips">
      <button
        v-for="filter in filters"
        :key="filter.key"
        :class="['filter-chip', { active: activeFilter === filter.key }]"
        @click="activeFilter = filter.key"
      >
        {{ isEnglish ? filter.en : filter.es }}
      </button>
    </div>
    <div class="result-caption">
      {{ resultPlaces.length + remoteResults.length }} {{ isEnglish ? 'results' : 'resultados' }}
    </div>
    <div class="search-results">
      <PlaceCard
        v-for="place in resultPlaces"
        :key="place.id"
        :place="place"
        :is-saved="savedIds.includes(place.id)"
        :is-english="isEnglish"
        @select="selectPlace"
        @toggle-save="toggleSave(place)"
      />
    </div>

    <template v-if="remoteActive">
      <div class="result-caption search-remote__caption">
        <span>{{ isEnglish ? 'More places in El Salvador' : 'Más lugares en El Salvador' }}</span>
        <q-spinner v-if="remoteLoading" size="16px" color="primary" />
      </div>
      <div v-if="remoteResults.length" class="search-results">
        <PlaceCard
          v-for="place in remoteResults"
          :key="place.id"
          :place="place"
          :is-saved="savedIds.includes(place.id)"
          :is-english="isEnglish"
          @select="selectPlace"
          @toggle-save="toggleSave(place)"
        />
      </div>
      <div v-if="remoteError" class="empty-state">
        <q-icon name="cloud_off" />
        <strong>{{
          isEnglish ? 'Live search is unavailable' : 'La búsqueda en vivo no está disponible'
        }}</strong>
        <q-btn
          flat
          rounded
          no-caps
          color="primary"
          :label="isEnglish ? 'Try again' : 'Reintentar'"
          @click="runRemoteSearch(query)"
        />
      </div>
    </template>

    <div v-if="showEmptyState" class="empty-state">
      <q-icon name="travel_explore" />
      <strong>{{ isEnglish ? 'No places found' : 'No encontramos lugares' }}</strong>
      <span>{{
        isEnglish ? 'Try a different name or region.' : 'Prueba con otro nombre o departamento.'
      }}</span>
    </div>
  </section>
</template>

<script setup>
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import PlaceCard from './PlaceCard.vue'
import { MIN_QUERY_LENGTH, searchRemotePlaces } from '../services/placeSearchService'

const props = defineProps({
  isEnglish: Boolean,
  places: { type: Array, required: true },
  savedIds: { type: Array, default: () => [] },
  initialQuery: { type: String, default: '' },
  initialFilter: { type: String, default: 'all' },
})
const emit = defineEmits(['select-place', 'toggle-save', 'remember-place'])

const query = ref(props.initialQuery)
const activeFilter = ref(props.initialFilter)
const filters = [
  { key: 'all', es: 'Todo', en: 'All' },
  { key: 'hotel', es: 'Hoteles', en: 'Hotels' },
  { key: 'destination', es: 'Lugares', en: 'Places' },
  { key: 'beach', es: 'Playas', en: 'Beaches' },
  { key: 'park', es: 'Parques', en: 'Parks' },
  { key: 'volcano', es: 'Volcanes', en: 'Volcanoes' },
  { key: 'lake', es: 'Lagos y ríos', en: 'Lakes and rivers' },
  { key: 'town', es: 'Pueblos', en: 'Towns' },
  { key: 'waterfall', es: 'Cascadas', en: 'Waterfalls' },
  { key: 'viewpoint', es: 'Miradores', en: 'Viewpoints' },
  { key: 'museum', es: 'Museos', en: 'Museums' },
  { key: 'restaurant', es: 'Restaurantes', en: 'Restaurants' },
  { key: 'tour', es: 'Tours', en: 'Tours' },
]

watch(
  () => props.initialQuery,
  (value) => {
    query.value = value
  },
)
watch(
  () => props.initialFilter,
  (value) => {
    activeFilter.value = value
  },
)

const aliases = {
  beach: ['playa', 'beach', 'costa', 'surf'],
  park: ['parque', 'park', 'reserva'],
  volcano: ['volcán', 'volcan', 'volcano', 'montaña'],
  lake: ['lago', 'lake', 'río', 'rio', 'river'],
  town: ['pueblo', 'town', 'cultural', 'colonial'],
  waterfall: ['cascada', 'waterfall'],
  viewpoint: ['mirador', 'viewpoint'],
  museum: ['museo', 'museum', 'histórico', 'historical'],
  restaurant: ['restaurante', 'restaurant', 'café', 'cafe'],
  tour: ['tour', 'actividad', 'activity'],
}

function placeText(place) {
  return `${place.name} ${place.nameEn} ${place.region} ${place.category} ${place.categoryEn}`.toLocaleLowerCase()
}

function matchesFilter(place) {
  if (activeFilter.value === 'all' || place.type === activeFilter.value) return true
  const text = placeText(place)
  return (aliases[activeFilter.value] || []).some((term) => text.includes(term))
}

const resultPlaces = computed(() => {
  const normalized = query.value.trim().toLocaleLowerCase()
  return props.places.filter(
    (place) => matchesFilter(place) && (!normalized || placeText(place).includes(normalized)),
  )
})

// ---- Búsqueda en vivo (Photon / OpenStreetMap) ----
const remotePlaces = ref([])
const remoteLoading = ref(false)
const remoteError = ref(false)
let debounceTimer = null
let controller = null

const remoteActive = computed(() => query.value.trim().length >= MIN_QUERY_LENGTH)

// Quita los que ya están en el catálogo local (mismo id o mismo nombre) y aplica el filtro activo.
const remoteResults = computed(() => {
  if (!remoteActive.value) return []
  const known = new Set(props.places.map((place) => place.name.toLocaleLowerCase()))
  const knownIds = new Set(props.places.map((place) => place.id))
  return remotePlaces.value.filter(
    (place) =>
      !knownIds.has(place.id) && !known.has(place.name.toLocaleLowerCase()) && matchesFilter(place),
  )
})

const showEmptyState = computed(
  () =>
    resultPlaces.value.length === 0 &&
    remoteResults.value.length === 0 &&
    !remoteLoading.value &&
    !remoteError.value,
)

async function runRemoteSearch(text) {
  if (controller) controller.abort()
  if (text.trim().length < MIN_QUERY_LENGTH) {
    remotePlaces.value = []
    remoteLoading.value = false
    remoteError.value = false
    return
  }
  controller = new AbortController()
  const current = controller
  remoteLoading.value = true
  remoteError.value = false
  try {
    const found = await searchRemotePlaces(text, { signal: current.signal })
    if (current !== controller) return
    remotePlaces.value = found
  } catch (error) {
    if (error?.name === 'AbortError') return
    remotePlaces.value = []
    remoteError.value = true
  } finally {
    if (current === controller) remoteLoading.value = false
  }
}

watch(
  query,
  (value) => {
    clearTimeout(debounceTimer)
    if (value.trim().length < MIN_QUERY_LENGTH) return runRemoteSearch('')
    remoteLoading.value = true
    debounceTimer = setTimeout(() => runRemoteSearch(value), 400)
  },
  { immediate: true },
)

onBeforeUnmount(() => {
  clearTimeout(debounceTimer)
  if (controller) controller.abort()
})

// Los lugares remotos no existen en el catálogo: se avisa al padre para que los recuerde
// (así funcionan en detalle, guardados, presupuesto y mapa).
function selectPlace(place) {
  if (place.isRemote) emit('remember-place', place)
  emit('select-place', place)
}
function toggleSave(place) {
  if (place.isRemote) emit('remember-place', place)
  emit('toggle-save', place.id)
}
</script>
