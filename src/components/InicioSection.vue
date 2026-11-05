<template>
  <div class="home-screen">
    <section class="home-hero">
      <div class="home-hero__mosaic" aria-hidden="true">
        <img v-for="image in heroImages" :key="image" :src="image" alt="" />
      </div>
      <div class="home-hero__shade"></div>
      <div class="home-hero__content">
        <span class="eyebrow">{{ isEnglish ? 'YOUR NEXT STORY STARTS HERE' : 'TU PRÓXIMA HISTORIA EMPIEZA AQUÍ' }}</span>
        <h1>TURISGO</h1>
        <p>{{ isEnglish ? 'Find places to love in El Salvador' : 'Encuentra lugares para enamorarte de El Salvador' }}</p>
      </div>
    </section>

    <div class="home-content">
      <q-input
        :model-value="searchQuery"
        readonly
        outlined
        rounded
        dense
        class="home-search"
        :placeholder="isEnglish ? 'Where would you like to go?' : '¿A dónde quieres ir?'"
        @update:model-value="$emit('update:searchQuery', $event)"
        @click="$emit('open-search')"
      >
        <template #prepend><q-icon name="search" /></template>
      </q-input>

      <button class="map-feature" @click="$emit('open-map')">
        <span class="map-feature__icon"><q-icon name="map" /></span>
        <span class="map-feature__text">
          <strong>{{ isEnglish ? 'Explore the map' : 'Explora el mapa' }}</strong>
          <small>{{ isEnglish ? 'See destinations around you' : 'Descubre destinos cerca de ti' }}</small>
        </span>
        <q-icon name="arrow_forward" />
      </button>

      <div class="quick-categories">
        <button v-for="category in categories" :key="category.key" class="quick-category" @click="$emit('open-category', category.key)">
          <span class="quick-category__icon"><q-icon :name="category.icon" /></span>
          <span>{{ isEnglish ? category.en : category.es }}</span>
        </button>
      </div>

      <section class="content-section">
        <div class="section-heading">
          <div>
            <span class="eyebrow">{{ isEnglish ? 'EXPLORE EL SALVADOR' : 'EXPLORA EL SALVADOR' }}</span>
            <h2>{{ isEnglish ? 'Featured places' : 'Destinos destacados' }}</h2>
          </div>
          <button class="text-link" @click="$emit('open-category', 'destination')">{{ isEnglish ? 'See all' : 'Ver todos' }} <q-icon name="chevron_right" /></button>
        </div>
        <div class="horizontal-cards">
          <PlaceCard v-for="place in destinations" :key="place.id" :place="place" :is-saved="savedIds.includes(place.id)" :is-english="isEnglish" @select="$emit('select-place', $event)" @toggle-save="$emit('toggle-save', $event)" />
        </div>
      </section>

      <section class="content-section">
        <div class="section-heading">
          <div>
            <span class="eyebrow">{{ isEnglish ? 'REST WELL' : 'DESCANSA BIEN' }}</span>
            <h2>{{ isEnglish ? 'Recommended stays' : 'Hoteles recomendados' }}</h2>
          </div>
          <button class="text-link" @click="$emit('open-category', 'hotel')">{{ isEnglish ? 'See all' : 'Ver todos' }} <q-icon name="chevron_right" /></button>
        </div>
        <div class="horizontal-cards">
          <PlaceCard v-for="place in hotels" :key="place.id" :place="place" :is-saved="savedIds.includes(place.id)" :is-english="isEnglish" @select="$emit('select-place', $event)" @toggle-save="$emit('toggle-save', $event)" />
        </div>
      </section>

      <section class="planning-card">
        <div class="planning-card__icon"><q-icon name="route" /></div>
        <div>
          <strong>{{ isEnglish ? 'Plan your next trip' : 'Planea tu próximo viaje' }}</strong>
          <p>{{ isEnglish ? 'Compare travel estimates before you go.' : 'Compara el costo estimado del viaje antes de salir.' }}</p>
          <button class="text-link" @click="$emit('open-budget')">{{ isEnglish ? 'Build a budget' : 'Armar presupuesto' }} <q-icon name="arrow_forward" /></button>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import PlaceCard from './PlaceCard.vue'

const props = defineProps({
  isEnglish: Boolean,
  searchQuery: String,
  places: { type: Array, required: true },
  savedIds: { type: Array, default: () => [] },
})

defineEmits(['update:searchQuery', 'open-search', 'open-map', 'open-category', 'open-budget', 'select-place', 'toggle-save'])

const destinations = computed(() => props.places.filter((place) => place.type === 'destination').slice(0, 4))
const hotels = computed(() => props.places.filter((place) => place.type === 'hotel'))
const heroImages = computed(() => props.places.slice(0, 6).map((place) => place.image))
const categories = [
  { key: 'hotel', icon: 'bed', es: 'Hoteles', en: 'Stays' },
  { key: 'destination', icon: 'photo_camera', es: 'Lugares', en: 'Places' },
  { key: 'map', icon: 'near_me', es: 'Rutas', en: 'Routes' },
  { key: 'saved', icon: 'favorite', es: 'Guardados', en: 'Saved' },
]
</script>
