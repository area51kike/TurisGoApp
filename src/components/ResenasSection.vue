<template>
  <section class="reviews-section">
    <div class="section-heading section-heading--compact">
      <div><span class="eyebrow">{{ isEnglish ? 'TRAVELERS’ EXPERIENCES' : 'EXPERIENCIAS DE VIAJEROS' }}</span><h2>{{ isEnglish ? 'Reviews' : 'Reseñas' }}</h2></div>
      <div v-if="rating" class="reviews-score"><q-icon name="star" /> {{ rating.toFixed(1) }}<small>/5</small></div>
    </div>
    <div v-if="visited" class="verified-banner"><q-icon name="verified" /> {{ isEnglish ? 'Visit verified.' : 'Visita verificada.' }}</div>
    <div v-else class="review-location-note"><q-icon name="rate_review" /> {{ isEnglish ? 'You can leave a review without sharing your location.' : 'Puedes dejar una reseña sin compartir tu ubicación.' }}</div>
    <div v-if="!isAuthenticated" class="visit-gate">
      <div class="visit-gate__icon"><q-icon name="login" /></div>
      <div><strong>{{ isEnglish ? 'Sign in to publish a review' : 'Inicia sesión para publicar una reseña' }}</strong><p>{{ isEnglish ? 'Your review will be connected to your traveler account.' : 'Tu reseña quedará vinculada a tu cuenta de viajero.' }}</p></div>
      <q-btn outline rounded color="primary" :label="isEnglish ? 'Sign in' : 'Iniciar sesión'" @click="$emit('request-account')" />
    </div>
    <form v-else class="review-form" @submit.prevent="submitReview">
      <label class="review-label">{{ isEnglish ? 'Your rating' : 'Tu puntuación' }}</label>
      <q-rating v-model="score" size="30px" color="amber-8" icon="star_border" icon-selected="star" />
      <q-input v-model="text" outlined rounded autogrow :placeholder="isEnglish ? 'Share a helpful tip or experience…' : 'Comparte un consejo o tu experiencia…'" />
      <q-btn unelevated rounded color="primary" icon="send" type="button" :loading="submitting" :label="isEnglish ? 'Publish review' : 'Publicar reseña'" :disable="!score || !text.trim() || submitting" @click="submitReview" />
    </form>

    <div v-if="reviews.length" class="review-list">
      <article v-for="(review, index) in reviews" :key="`${review.author}-${index}`" class="review-card">
        <div class="review-card__head"><q-avatar size="34px" color="secondary" text-color="white">{{ review.author?.[0] || 'V' }}</q-avatar><div><strong>{{ review.author }}</strong><small>{{ review.date || (isEnglish ? 'Sample review' : 'Reseña de ejemplo') }}</small></div><span class="review-rating"><q-icon name="star" /> {{ review.rating }}.0</span></div>
        <p>{{ review.text }}</p>
        <span v-if="review.sample" class="sample-tag">{{ isEnglish ? 'SAMPLE' : 'MUESTRA' }}</span>
      </article>
    </div>
    <div v-else class="review-empty"><q-icon name="rate_review" /><span>{{ isEnglish ? 'No reviews yet. Be the first to share your experience.' : 'Aún no hay reseñas. Sé la primera persona en compartir su experiencia.' }}</span></div>
  </section>
</template>

<script setup>
import { ref } from 'vue'

const props = defineProps({
  isEnglish: Boolean,
  visited: Boolean,
  isAuthenticated: Boolean,
  checkingVisit: Boolean,
  reviews: { type: Array, default: () => [] },
  rating: { type: Number, default: null },
})
const emit = defineEmits(['verify-visit', 'submit-review', 'request-account'])
const score = ref(0)
const text = ref('')
const submitting = ref(false)

function submitReview() {
  if (!props.isAuthenticated || !score.value || !text.value.trim() || submitting.value) return
  submitting.value = true
  emit('submit-review', {
    rating: score.value,
    text: text.value.trim(),
    onComplete: (saved) => {
      submitting.value = false
      if (saved) {
        score.value = 0
        text.value = ''
      }
    },
  })
}
</script>
