<template>
  <section class="page-section business-page">
    <header class="page-heading">
      <span class="eyebrow">{{ isEnglish ? 'FOR LOCAL BUSINESSES' : 'PARA NEGOCIOS LOCALES' }}</span>
      <h1>{{ isEnglish ? 'Business profile' : 'Perfil empresarial' }}</h1>
      <p>{{ isEnglish ? 'Show travelers what makes your place special.' : 'Muestra a los viajeros lo que hace especial a tu negocio.' }}</p>
    </header>

    <div v-if="!planActive" class="premium-offer">
      <div class="premium-offer__top"><span><q-icon name="auto_awesome" /> TURISGO PREMIUM</span><span class="premium-badge">{{ isEnglish ? 'PREVIEW' : 'VISTA PREVIA' }}</span></div>
      <h2>{{ isEnglish ? 'Get discovered by travelers' : 'Haz que más viajeros te encuentren' }}</h2>
      <p>{{ isEnglish ? 'A Premium business listing includes photos, a description, map location, and monthly update reminders.' : 'La ficha Premium incluye fotos, descripción, ubicación en el mapa y recordatorios mensuales para actualizar la información.' }}</p>
      <ul><li>{{ isEnglish ? 'Publish a featured listing' : 'Publica una ficha destacada' }}</li><li>{{ isEnglish ? 'Add photo URLs and branch locations' : 'Añade URLs de fotos y sucursales' }}</li><li>{{ isEnglish ? 'Manage traveler reviews' : 'Administra reseñas de viajeros' }}</li></ul>
      <q-btn unelevated rounded color="primary" icon="visibility" :label="isEnglish ? 'Preview Premium tools' : 'Probar herramientas Premium'" @click="$emit('activate-demo')" />
      <small class="premium-disclaimer">{{ isEnglish ? 'Demo only. Payments and subscription billing are not connected.' : 'Solo demostración. Los pagos y la suscripción aún no están conectados.' }}</small>
    </div>

    <template v-else>
      <div :class="['business-status', { 'business-status--due': updateDue }]">
        <q-icon :name="updateDue ? 'notification_important' : 'verified'" />
        <div><strong>{{ updateDue ? (isEnglish ? 'Refresh your listing to keep it featured' : 'Actualiza tu ficha para volver a destacarla') : (isEnglish ? 'Premium preview is active' : 'Vista previa Premium activa') }}</strong><span>{{ updateDue ? (isEnglish ? 'The featured listing is paused after 30 days until you confirm prices, photos, and branches.' : 'La ficha destacada se pausa a los 30 días hasta confirmar precios, fotos y sucursales.') : (isEnglish ? 'Review your listing at least every 30 days.' : 'Revisa tu ficha al menos cada 30 días.') }}</span></div>
      </div>

      <div class="business-form-card">
        <div class="section-heading section-heading--compact"><div><span class="eyebrow">{{ isEnglish ? 'PUBLIC LISTING' : 'FICHA PÚBLICA' }}</span><h2>{{ isEnglish ? 'Your place' : 'Tu negocio' }}</h2></div><q-chip color="secondary" text-color="white" icon="workspace_premium">{{ isEnglish ? 'Premium' : 'Premium' }}</q-chip></div>
        <div class="business-form">
          <q-input v-model="draft.name" outlined rounded :label="isEnglish ? 'Business name' : 'Nombre del negocio'" />
          <q-select v-model="draft.type" outlined rounded emit-value map-options :options="typeOptions" :label="isEnglish ? 'Listing type' : 'Tipo de ficha'" />
          <q-input v-model="draft.region" outlined rounded :label="isEnglish ? 'City / department' : 'Ciudad / departamento'" />
          <q-input v-model="draft.description" outlined rounded type="textarea" autogrow maxlength="400" :label="isEnglish ? 'Description' : 'Descripción'" />
          <q-input v-model="draft.priceLabel" outlined rounded :label="isEnglish ? 'Price / rate' : 'Precio / tarifa'" :hint="isEnglish ? 'For example: from $25 per night, or check dates' : 'Ejemplo: desde $25 por noche o consultar fechas'" />
          <q-input v-model.number="draft.commissionRate" outlined rounded type="number" min="0" max="30" step="0.5" suffix="%" :label="isEnglish ? 'TURISGO commission per booking' : 'Comisión TURISGO por reserva'" :hint="isEnglish ? 'Agreement preview only; not billed.' : 'Vista previa del acuerdo; aún no se cobra.'" />
          <q-input v-model="draft.websiteUrl" outlined rounded type="url" :label="isEnglish ? 'Website / booking URL (optional)' : 'Sitio web / URL de reservas (opcional)'" />
          <q-input v-model="draft.mapUrl" outlined rounded :label="isEnglish ? 'Google Maps link or address' : 'Enlace de Google Maps o dirección'" />
          <div class="business-coordinates">
            <q-input v-model="draft.latitude" outlined rounded type="number" step="any" :label="isEnglish ? 'Latitude' : 'Latitud'" />
            <q-input v-model="draft.longitude" outlined rounded type="number" step="any" :label="isEnglish ? 'Longitude' : 'Longitud'" />
          </div>
          <small class="field-hint">{{ isEnglish ? 'Coordinates help place your listing and verify visits. They can be read from a Google Maps link.' : 'Las coordenadas ubican tu ficha y ayudan a verificar visitas. Se pueden leer del enlace de Google Maps.' }}</small>
          <q-input v-model="photosText" outlined rounded type="textarea" autogrow :label="isEnglish ? 'Photo URLs (one per line)' : 'URLs de fotos (una por línea)'" :hint="isEnglish ? 'Paste public https image URLs. TURISGO saves the URLs with your listing.' : 'Pega enlaces públicos https de imágenes. TURISGO guarda las URLs en la ficha.'" />
          <q-input v-model="branchesText" outlined rounded type="textarea" autogrow :label="isEnglish ? 'Branches / locations (one per line)' : 'Sucursales / ubicaciones (una por línea)'" />
          <q-btn unelevated rounded color="primary" icon="cloud_upload" :loading="saving" :disable="!isPublishable" :label="updateDue ? (isEnglish ? 'Confirm monthly update' : 'Confirmar actualización mensual') : (isEnglish ? 'Save and publish listing' : 'Guardar y publicar ficha')" @click="save" />
          <p class="business-save-note"><q-icon name="info" /> {{ isEnglish ? 'Photos are stored as URLs in Firestore; the image files need to be hosted at those URLs. If Firestore rules reject the write, the draft remains on this device.' : 'Firestore guarda las URLs, no los archivos de imagen; las fotos deben estar alojadas en esos enlaces. Si las reglas de Firestore rechazan el guardado, el borrador queda en este dispositivo.' }}</p>
        </div>
      </div>

      <div class="business-form-card reviews-management">
        <div class="section-heading section-heading--compact"><div><span class="eyebrow">{{ isEnglish ? 'CUSTOMER FEEDBACK' : 'COMENTARIOS DE CLIENTES' }}</span><h2>{{ isEnglish ? 'Review inbox' : 'Panel de reseñas' }}</h2></div><span class="review-count">{{ customerReviews.length }}</span></div>
        <div v-if="customerReviews.length" class="business-review-list">
          <article v-for="(review, index) in customerReviews" :key="`${review.author}-${index}`" class="business-review">
            <div class="business-review__top"><strong>{{ review.author }}</strong><span><q-icon name="star" /> {{ review.rating }}</span></div>
            <p>{{ review.text }}</p>
            <div v-if="reviewReplies[review.id || index]" class="business-reply"><strong>{{ isEnglish ? 'Your reply' : 'Tu respuesta' }}</strong><p>{{ reviewReplies[review.id || index] }}</p></div>
            <div v-else class="business-reply-form"><q-input v-model="replyDrafts[index]" dense outlined rounded :placeholder="isEnglish ? 'Write a response…' : 'Escribe una respuesta…'" /><q-btn flat round icon="send" color="primary" :aria-label="isEnglish ? 'Reply' : 'Responder'" @click="reply(index, review)" /></div>
          </article>
        </div>
        <div v-else class="review-empty"><q-icon name="rate_review" /><span>{{ isEnglish ? 'New reviews from verified visits will appear here.' : 'Aquí aparecerán las reseñas de visitas verificadas.' }}</span></div>
      </div>
    </template>
  </section>
</template>

<script setup>
import { computed, reactive, ref, watch } from 'vue'

const props = defineProps({
  isEnglish: Boolean,
  profile: { type: Object, required: true },
  planActive: Boolean,
  updateDue: Boolean,
  saving: Boolean,
  customerReviews: { type: Array, default: () => [] },
  reviewReplies: { type: Object, default: () => ({}) },
})
const emit = defineEmits(['activate-demo', 'save-profile', 'reply-review'])
const draft = reactive({ ...props.profile })
const photosText = ref((props.profile.photoUrls || []).join('\n'))
const branchesText = ref((props.profile.branches || []).join('\n'))
const replyDrafts = reactive({})

watch(() => props.profile, (profile) => {
  Object.assign(draft, profile)
  photosText.value = (profile.photoUrls || []).join('\n')
  branchesText.value = (profile.branches || []).join('\n')
}, { deep: true })

const typeOptions = computed(() => [
  { label: props.isEnglish ? 'Tourist destination' : 'Lugar turístico', value: 'destination' },
  { label: props.isEnglish ? 'Hotel / accommodation' : 'Hotel / alojamiento', value: 'hotel' },
])
const isPublishable = computed(() => Boolean(draft.name.trim() && draft.region.trim() && draft.description.trim() && photoUrls.value.length > 0 && (draft.mapUrl?.trim() || (draft.latitude && draft.longitude))))
const photoUrls = computed(() => photosText.value.split(/\n+/).map((url) => url.trim()).filter(Boolean))
const branches = computed(() => branchesText.value.split(/\n+/).map((branch) => branch.trim()).filter(Boolean))

function save() {
  const profile = {
    ...draft,
    id: props.profile.id || '',
    name: draft.name.trim(),
    description: draft.description.trim(),
    region: draft.region.trim(),
    commissionRate: Math.min(30, Math.max(0, Number(draft.commissionRate) || 0)),
    photoUrls: photoUrls.value,
    branches: branches.value,
    coordinates: draft.latitude && draft.longitude ? [Number(draft.latitude), Number(draft.longitude)] : draft.coordinates,
    updatedAt: new Date().toISOString(),
  }
  emit('save-profile', profile)
}

function reply(index, review) {
  const message = (replyDrafts[index] || '').trim()
  if (!message) return
  emit('reply-review', { reviewId: review.id || String(index), message })
  replyDrafts[index] = ''
}
</script>
