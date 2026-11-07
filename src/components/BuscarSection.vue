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
      {{ resultPlaces.length }} {{ isEnglish ? 'results' : 'resultados' }}
    </div>
    <div class="search-results">
      <PlaceCard
        v-for="place in resultPlaces"
        :key="place.id"
        :place="place"
        :is-saved="savedIds.includes(place.id)"
        :is-english="isEnglish"
        @select="$emit('select-place', $event)"
        @toggle-save="$emit('toggle-save', $event)"
      />
    </div>
    <div v-if="resultPlaces.length === 0" class="empty-state">
      <q-icon name="travel_explore" />
      <strong>{{ isEnglish ? 'No places found' : 'No encontramos lugares' }}</strong>
      <span>{{
        isEnglish ? 'Try a different name or region.' : 'Prueba con otro nombre o departamento.'
      }}</span>
    </div>
  </section>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import PlaceCard from './PlaceCard.vue'

const props = defineProps({
  isEnglish: Boolean,
  places: { type: Array, required: true },
  savedIds: { type: Array, default: () => [] },
  initialQuery: { type: String, default: '' },
  initialFilter: { type: String, default: 'all' },
})
defineEmits(['select-place', 'toggle-save'])

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

const resultPlaces = computed(() => {
  const normalized = query.value.trim().toLocaleLowerCase()
  return props.places.filter((place) => {
    const text =
      `${place.name} ${place.nameEn} ${place.region} ${place.category} ${place.categoryEn}`.toLocaleLowerCase()
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
    const matchesType =
      activeFilter.value === 'all' ||
      place.type === activeFilter.value ||
      (aliases[activeFilter.value] || []).some((term) => text.includes(term))
    return matchesType && (!normalized || text.includes(normalized))
  })
})
</script>
