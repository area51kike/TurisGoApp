<template>
  <section class="page-section saved-page">
    <header class="page-heading">
      <span class="eyebrow">{{ isEnglish ? 'YOUR TRAVEL WISHLIST' : 'TU LISTA DE VIAJE' }}</span>
      <h1>{{ isEnglish ? 'Saved places' : 'Guardados' }}</h1>
      <p>{{ isEnglish ? 'Keep the places you want to visit close at hand.' : 'Ten a la mano los lugares que quieres visitar.' }}</p>
    </header>
    <div v-if="places.length" class="search-results">
      <PlaceCard v-for="place in places" :key="place.id" :place="place" is-saved :is-english="isEnglish" @select="$emit('select-place', $event)" @toggle-save="$emit('toggle-save', $event)" />
    </div>
    <div v-else class="empty-state saved-empty">
      <div class="saved-empty__icon"><q-icon name="favorite_border" /></div>
      <strong>{{ isEnglish ? 'Your saved list is empty' : 'Aún no tienes lugares guardados' }}</strong>
      <span>{{ isEnglish ? 'Tap the heart on a place to keep it here.' : 'Toca el corazón de un lugar para guardarlo aquí.' }}</span>
      <q-btn unelevated rounded color="primary" :label="isEnglish ? 'Explore places' : 'Explorar lugares'" icon="travel_explore" @click="$emit('open-search')" />
    </div>
  </section>
</template>

<script setup>
import PlaceCard from './PlaceCard.vue'

defineProps({
  isEnglish: Boolean,
  places: { type: Array, default: () => [] },
})
defineEmits(['select-place', 'toggle-save', 'open-search'])
</script>
