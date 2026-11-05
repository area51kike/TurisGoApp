<template>
  <article class="place-card" @click="$emit('select', place)">
    <div class="place-card__image-wrap">
      <img class="place-card__image" :src="place.image" :alt="label" loading="lazy" />
      <q-btn
        round
        dense
        unelevated
        class="place-card__favorite"
        :icon="isSaved ? 'favorite' : 'favorite_border'"
        :color="isSaved ? 'negative' : 'dark'"
        :aria-label="isSaved ? (isEnglish ? 'Remove from saved' : 'Quitar de guardados') : (isEnglish ? 'Save place' : 'Guardar lugar')"
        @click.stop="$emit('toggle-save', place.id)"
      />
      <span v-if="place.type === 'hotel'" class="place-card__tag">{{ isEnglish ? 'STAY' : 'ALOJAMIENTO' }}</span>
    </div>
    <div class="place-card__body">
      <div class="place-card__title">{{ label }}</div>
      <div class="place-card__meta">
        <span><q-icon name="place" /> {{ place.region }}</span>
        <span v-if="place.rating"><q-icon name="star" class="text-gold" /> {{ place.rating.toFixed(1) }}</span>
      </div>
      <div v-if="place.type === 'hotel'" class="place-card__price">
        {{ isEnglish ? 'Price' : 'Precio' }}: {{ isEnglish ? place.priceLabelEn : place.priceLabel }}
      </div>
      <div v-else class="place-card__price">{{ isEnglish ? 'Trip estimate' : 'Viaje estimado' }}: ~${{ place.travelEstimate }}</div>
    </div>
  </article>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  place: { type: Object, required: true },
  isSaved: Boolean,
  isEnglish: Boolean,
})

defineEmits(['select', 'toggle-save'])

const label = computed(() => (props.isEnglish ? props.place.nameEn : props.place.name))
</script>
