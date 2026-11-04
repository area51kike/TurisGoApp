<template>
  <div class="q-pa-md">
    <div class="text-h6 text-weight-bold q-mb-sm">
      {{ isEnglish ? 'Explore Interactive Map' : 'Explorar Mapa Interactivo' }}
    </div>
    <p class="text-caption text-grey-7">
      {{
        isEnglish
          ? 'Select a point in El Salvador to view details:'
          : 'Selecciona un destino para centrar el mapa:'
      }}
    </p>

    <!-- SELECTOR DE LUGAR -->
    <q-select
      outlined
      dense
      :model-value="selectedMapPlace"
      @update:model-value="$emit('update:selectedMapPlace', $event)"
      :options="places"
      option-label="name"
      :label="isEnglish ? 'Select Destination' : 'Seleccionar Destino'"
      class="q-mb-md"
    />

    <!-- MAPA EMBEBIDO -->
    <div class="map-wrapper shadow-2">
      <iframe
        width="100%"
        height="280"
        style="border: 0; border-radius: 12px"
        loading="lazy"
        allowfullscreen
        :src="selectedMapPlace ? selectedMapPlace.mapUrl : defaultMapUrl"
      ></iframe>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ExplorarSection',
  props: {
    isEnglish: Boolean,
    places: Array,
    selectedMapPlace: Object,
    defaultMapUrl: String,
  },
  emits: ['update:selectedMapPlace'],
}
</script>

<style scoped>
.map-wrapper {
  border-radius: 12px;
  overflow: hidden;
}
</style>
