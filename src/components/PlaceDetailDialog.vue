<template>
  <q-dialog :model-value="modelValue" maximized transition-show="slide-up" transition-hide="slide-down" @update:model-value="$emit('update:model-value', $event)">
    <q-card v-if="place" class="detail-dialog">
      <div class="detail-topbar">
        <q-btn round flat icon="arrow_back" :aria-label="isEnglish ? 'Back' : 'Volver'" @click="$emit('update:model-value', false)" />
        <div class="detail-topbar__title">{{ isEnglish ? place.nameEn : place.name }}</div>
        <q-btn round flat :icon="isSaved ? 'favorite' : 'favorite_border'" :color="isSaved ? 'negative' : 'dark'" :aria-label="isEnglish ? 'Save place' : 'Guardar lugar'" @click="$emit('toggle-save', place.id)" />
      </div>

      <main class="detail-content">
        <q-carousel v-model="slide" swipeable animated navigation arrows control-color="white" class="detail-gallery">
          <q-carousel-slide v-for="(photo, index) in photos" :key="photo" :name="index" class="detail-gallery__slide">
            <img :src="photo" :alt="isEnglish ? `${place.nameEn} photo ${index + 1}` : `Foto ${index + 1} de ${place.name}`" />
          </q-carousel-slide>
        </q-carousel>

        <div class="detail-heading">
          <div class="detail-heading__eyebrow">{{ isEnglish ? place.categoryEn : place.category }} <span>·</span> {{ place.region }}</div>
          <h1>{{ isEnglish ? place.nameEn : place.name }}</h1>
          <div class="detail-rating" v-if="place.rating"><q-icon name="star" /> <strong>{{ place.rating.toFixed(1) }}</strong><span>· {{ place.reviewsCount.toLocaleString() }} {{ isEnglish ? 'reviews' : 'reseñas' }}</span><span v-if="place.stars">· {{ place.stars }} ★</span></div>
          <div v-else class="detail-rating detail-rating--pending">{{ isEnglish ? 'New listing · no ratings yet' : 'Lugar nuevo · aún sin puntuaciones' }}</div>
        </div>

        <p class="detail-description">{{ isEnglish ? place.descriptionEn : place.description }}</p>

        <div v-if="place.type === 'hotel'" class="detail-facts">
          <div><span>{{ isEnglish ? 'Nightly rate' : 'Precio por noche' }}</span><strong>{{ isEnglish ? place.priceLabelEn : place.priceLabel }}</strong></div>
          <div><span>{{ isEnglish ? 'Guest rating' : 'Puntuación de huéspedes' }}</span><strong>{{ place.rating ? `${place.rating.toFixed(1)} / 5` : (isEnglish ? 'Not rated yet' : 'Pendiente de verificar') }}</strong></div>
          <div><span>{{ isEnglish ? 'Availability' : 'Disponibilidad' }}</span><a v-if="place.bookingUrl" :href="place.bookingUrl" target="_blank" rel="noopener noreferrer">{{ isEnglish ? 'Check with the hotel' : 'Consultar al hotel' }} <q-icon name="open_in_new" /></a><strong v-else>{{ isEnglish ? 'Contact the business' : 'Consultar al negocio' }}</strong></div>
        </div>

        <section class="detail-travel-card">
          <div class="detail-travel-card__icon"><q-icon name="directions_car" /></div>
          <div><strong>{{ isEnglish ? 'Plan the trip' : 'Planea el viaje' }}</strong><p>{{ isEnglish ? 'Estimated travel from San Salvador' : 'Viaje estimado desde San Salvador' }}</p></div>
          <strong class="detail-travel-card__price">~${{ place.travelEstimate }}</strong>
        </section>
        <div class="detail-actions">
          <q-btn unelevated rounded color="primary" icon="account_balance_wallet" :label="isEnglish ? 'Add to budget' : 'Añadir al presupuesto'" @click="$emit('add-to-budget', place)" />
          <q-btn outline rounded color="primary" icon="near_me" :label="isEnglish ? 'Open directions' : 'Ver cómo llegar'" :href="directionsUrl" target="_blank" rel="noopener noreferrer" />
        </div>

        <q-expansion-item class="detail-map" icon="map" :label="isEnglish ? 'View map inside TURISGO' : 'Ver mapa dentro de TURISGO'" expand-separator>
          <div class="map-embed map-embed--detail"><iframe :src="mapUrl" :title="isEnglish ? `Map of ${place.nameEn}` : `Mapa de ${place.name}`" loading="lazy" referrerpolicy="no-referrer-when-downgrade" allowfullscreen></iframe></div>
          <div class="map-external"><span>{{ place.region }}, El Salvador</span><a :href="directionsUrl" target="_blank" rel="noopener noreferrer">{{ isEnglish ? 'Open in Google Maps' : 'Abrir en Google Maps' }} <q-icon name="open_in_new" /></a></div>
        </q-expansion-item>

        <ResenasSection
          :is-english="isEnglish"
          :visited="visited"
          :checking-visit="checkingVisit"
          :reviews="reviews"
          :rating="place.rating"
          @verify-visit="$emit('verify-visit', place)"
          @submit-review="$emit('submit-review', $event)"
        />
      </main>
      <footer class="detail-footer"><q-btn flat rounded icon="close" :label="isEnglish ? 'Close details' : 'Cerrar ficha'" @click="$emit('update:model-value', false)" /></footer>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import ResenasSection from './ResenasSection.vue'

const props = defineProps({
  modelValue: Boolean,
  place: { type: Object, default: null },
  isEnglish: Boolean,
  isSaved: Boolean,
  visited: Boolean,
  checkingVisit: Boolean,
  reviews: { type: Array, default: () => [] },
})
defineEmits(['update:model-value', 'toggle-save', 'add-to-budget', 'verify-visit', 'submit-review'])

const slide = ref(0)
const photos = computed(() => props.place ? [props.place.image, ...(props.place.gallery || [])] : [])
const mapUrl = computed(() => {
  if (props.place?.mapQuery) {
    return `https://maps.google.com/maps?q=${encodeURIComponent(props.place.mapQuery)}&z=14&output=embed`
  }
  const [lat, lng] = props.place?.coordinates || [13.6929, -89.2182]
  return `https://maps.google.com/maps?q=${lat},${lng}&z=14&output=embed`
})
const directionsUrl = computed(() => {
  const place = props.place
  return place ? `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(`${place.name}, ${place.region}, El Salvador`)}` : '#'
})
watch(() => props.place?.id, () => { slide.value = 0 })
</script>
