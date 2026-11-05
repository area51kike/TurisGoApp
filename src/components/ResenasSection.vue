<template>
  <section class="reviews-section">
    <div class="section-heading section-heading--compact">
      <div><span class="eyebrow">{{ isEnglish ? 'TRAVELERS’ EXPERIENCES' : 'EXPERIENCIAS DE VIAJEROS' }}</span><h2>{{ isEnglish ? 'Reviews' : 'Reseñas' }}</h2></div>
      <div v-if="rating" class="reviews-score"><q-icon name="star" /> {{ rating.toFixed(1) }}<small>/5</small></div>
    </div>
    <div v-if="!visited" class="visit-gate">
      <div class="visit-gate__icon"><q-icon name="verified_user" /></div>
      <div><strong>{{ isEnglish ? 'Visited this place?' : '¿Ya visitaste este lugar?' }}</strong><p>{{ isEnglish ? 'Confirm your location near the place to unlock the review form.' : 'Confirma que estás cerca del lugar para habilitar el formulario de reseña.' }}</p></div>
      <q-btn outline rounded color="primary" :loading="checkingVisit" :label="isEnglish ? 'Verify visit' : 'Validar visita'" @click="$emit('verify-visit')" />
    </div>
    <div v-else class="verified-banner"><q-icon name="verified" /> {{ isEnglish ? 'Visit verified. You can leave a review.' : 'Visita verificada. Ya puedes dejar una reseña.' }}</div>

    <form v-if="visited" class="review-form" @submit.prevent="submitReview">
      <label class="review-label">{{ isEnglish ? 'Your rating' : 'Tu puntuación' }}</label>
      <q-rating v-model="score" size="30px" color="amber-8" icon="star_border" icon-selected="star" />
      <q-input v-model="text" outlined rounded autogrow :placeholder="isEnglish ? 'Share a helpful tip or experience…' : 'Comparte un consejo o tu experiencia…'" />
      <q-btn unelevated rounded color="primary" icon="send" :label="isEnglish ? 'Publish review' : 'Publicar reseña'" :disable="!score || !text.trim()" />
    </form>

    <div v-if="reviews.length" class="review-list">
      <article v-for="(review, index) in reviews" :key="`${review.author}-${index}`" class="review-card">
        <div class="review-card__head"><q-avatar size="34px" color="secondary" text-color="white">{{ review.author?.[0] || 'V' }}</q-avatar><div><strong>{{ review.author }}</strong><small>{{ review.date || (isEnglish ? 'Sample review' : 'Reseña de ejemplo') }}</small></div><span class="review-rating"><q-icon name="star" /> {{ review.rating }}.0</span></div>
        <p>{{ review.text }}</p>
        <span v-if="review.sample" class="sample-tag">{{ isEnglish ? 'SAMPLE' : 'MUESTRA' }}</span>
      </article>
    </div>
    <div v-else class="review-empty"><q-icon name="rate_review" /><span>{{ isEnglish ? 'No reviews yet. Your verified visit can start the conversation.' : 'Aún no hay reseñas. Tu visita verificada puede iniciar la conversación.' }}</span></div>
  </section>
</template>

<script setup>
import { ref } from 'vue'

const props = defineProps({
  isEnglish: Boolean,
  visited: Boolean,
  checkingVisit: Boolean,
  reviews: { type: Array, default: () => [] },
  rating: { type: Number, default: null },
})
const emit = defineEmits(['verify-visit', 'submit-review'])
const score = ref(0)
const text = ref('')

function submitReview() {
  if (!props.visited || !score.value || !text.value.trim()) return
  emit('submit-review', { rating: score.value, text: text.value.trim() })
  score.value = 0
  text.value = ''
}
</script>
