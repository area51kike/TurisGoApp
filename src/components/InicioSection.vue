<template>
  <div class="q-pa-md">
    <!-- BUSCADOR -->
    <div class="search q-mb-md">
      <q-icon name="search" size="24px" class="q-ml-sm text-grey-7" />
      <q-input
        borderless
        :model-value="searchQuery"
        @update:model-value="$emit('update:searchQuery', $event)"
        :placeholder="isEnglish ? 'Search destinations...' : 'Buscar destinos...'"
        class="full-width q-px-sm"
      />
    </div>

    <div class="text-h6 text-weight-bold q-mb-sm">
      {{ isEnglish ? 'Recommended Destinations' : 'Destinos Recomendados' }}
    </div>

    <div class="row q-col-gutter-md">
      <div class="col-6" v-for="place in filteredPlaces" :key="place.id">
        <q-card class="card-item cursor-pointer" @click="$emit('select-place', place)">
          <q-img :src="place.img" height="100px">
            <div class="absolute-top-right q-pa-xs">
              <q-btn
                flat
                round
                dense
                size="sm"
                :icon="place.fav ? 'favorite' : 'favorite_border'"
                color="red"
                @click.stop="place.fav = !place.fav"
              />
            </div>
          </q-img>
          <q-card-section class="q-pa-sm">
            <div class="text-weight-bold text-subtitle2 ellipsis">{{ place.name }}</div>
            <div class="text-caption text-grey">{{ place.loc }}</div>
            <div class="text-primary text-weight-bold q-mt-xs">${{ place.travelCost }} USD</div>
          </q-card-section>
        </q-card>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'InicioSection',
  props: {
    isEnglish: Boolean,
    searchQuery: String,
    filteredPlaces: Array,
  },
  emits: ['update:searchQuery', 'select-place'],
}
</script>

<style scoped>
.search {
  background: white;
  border-radius: 14px;
  display: flex;
  align-items: center;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08);
}
.card-item {
  border-radius: 12px;
  overflow: hidden;
  transition: transform 0.2s;
}
.card-item:hover {
  transform: translateY(-3px);
}
</style>
