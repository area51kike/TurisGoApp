<template>
  <section class="page-section budget-page">
    <header class="page-heading">
      <span class="eyebrow">{{ isEnglish ? 'TRAVEL WITH A PLAN' : 'VIAJA CON UN PLAN' }}</span>
      <h1>{{ isEnglish ? 'Trip budget' : 'Presupuesto' }}</h1>
      <p>{{ isEnglish ? 'Estimates are a guide. Confirm prices with each place.' : 'Los costos son una referencia; confirma precios con cada lugar.' }}</p>
    </header>

    <div class="budget-total">
      <span>{{ isEnglish ? 'Estimated total' : 'Total estimado' }}</span>
      <strong>${{ totalBudget.toFixed(2) }}</strong>
      <small>{{ isEnglish ? 'USD · from your current selection' : 'USD · según tu selección actual' }}</small>
    </div>

    <div class="budget-block">
      <div class="section-heading section-heading--compact"><h2>{{ isEnglish ? 'Places in your trip' : 'Lugares de tu viaje' }}</h2><button class="text-link" @click="$emit('open-search')">{{ isEnglish ? 'Add a place' : 'Añadir lugar' }} <q-icon name="add" /></button></div>
      <div v-if="selectedPlaces.length" class="budget-stops">
        <div v-for="place in selectedPlaces" :key="place.id" class="budget-stop">
          <img :src="place.image" :alt="place.name" />
          <div class="budget-stop__info"><strong>{{ isEnglish ? place.nameEn : place.name }}</strong><span>{{ isEnglish ? 'Estimated travel' : 'Viaje estimado' }}</span></div>
          <strong class="budget-stop__price">~${{ place.travelEstimate }}</strong>
          <q-btn flat round dense icon="close" :aria-label="isEnglish ? 'Remove place' : 'Quitar lugar'" @click="removePlace(place.id)" />
        </div>
      </div>
      <div v-else class="budget-empty"><q-icon name="add_road" /><span>{{ isEnglish ? 'Add a recommended place to see its estimated travel cost.' : 'Añade un lugar recomendado para ver su costo estimado de viaje.' }}</span></div>
    </div>

    <div class="budget-block">
      <h2>{{ isEnglish ? 'Other trip costs' : 'Otros gastos del viaje' }}</h2>
      <p v-if="!selectedPlaces.length" class="budget-lock-note">{{ isEnglish ? 'Choose at least one place first. Free admission is $0; estimated travel is shown separately.' : 'Primero elige al menos un lugar. Si la entrada es gratis, cuenta $0; el viaje estimado aparece aparte.' }}</p>
      <q-input :model-value="costs.food" :disable="!selectedPlaces.length" type="number" min="0" step="1" outlined rounded :label="isEnglish ? 'Food & drinks' : 'Comida y bebidas'" prefix="$" @update:model-value="updateCost('food', $event)" />
      <q-input :model-value="costs.lodging" :disable="!selectedPlaces.length" type="number" min="0" step="1" outlined rounded :label="isEnglish ? 'Lodging' : 'Hospedaje'" prefix="$" @update:model-value="updateCost('lodging', $event)" />
      <q-input :model-value="costs.extras" :disable="!selectedPlaces.length" type="number" min="0" step="1" outlined rounded :label="isEnglish ? 'Admission & other expenses' : 'Entradas y otros gastos'" prefix="$" @update:model-value="updateCost('extras', $event)" />
    </div>
    <div v-if="selectedPlaces.length" class="budget-tip"><q-icon name="lightbulb" /><span>{{ isEnglish ? 'Free parks and public areas have $0 admission unless a listing states a fee. Travel is estimated separately from San Salvador.' : 'Los parques y espacios públicos gratuitos tienen entrada de $0 salvo que la ficha indique una tarifa. El viaje se estima aparte desde San Salvador.' }}</span></div>
  </section>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  isEnglish: Boolean,
  places: { type: Array, required: true },
  selectedPlaceIds: { type: Array, default: () => [] },
  costs: { type: Object, required: true },
  totalBudget: { type: Number, default: 0 },
})
const emit = defineEmits(['update:selected-place-ids', 'update:costs', 'open-search'])

const selectedPlaces = computed(() => props.selectedPlaceIds.map((id) => props.places.find((place) => place.id === id)).filter(Boolean))
const costs = computed(() => props.costs)

function updateCost(key, value) {
  emit('update:costs', { ...props.costs, [key]: Number(value) || 0 })
}

function removePlace(id) {
  emit('update:selected-place-ids', props.selectedPlaceIds.filter((selectedId) => selectedId !== id))
}
</script>
