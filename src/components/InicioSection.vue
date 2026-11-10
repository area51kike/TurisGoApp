<template>
  <div class="hm">
    <!-- Saludo + buscador -->
    <header class="hm-top">
      <p class="hm-hello">
        {{ greeting }}<template v-if="firstName">, {{ firstName }}</template>
      </p>
      <h1 class="hm-title">
        <template v-if="isEnglish">Ready to <em>explore</em> ?</template>
        <template v-else>¿ Listo para <em>explorar</em> ?</template>
      </h1>

      <div class="hm-finder">
        <button class="hm-finder__search" @click="$emit('open-search')">
          <q-icon name="search" />
          <span>{{
            searchQuery ||
            (isEnglish ? 'Beaches, volcanoes, hotels…' : 'Playas, volcanes, hoteles…')
          }}</span>
        </button>
        <button
          class="hm-finder__map"
          :aria-label="isEnglish ? 'Open map' : 'Abrir mapa'"
          @click="$emit('open-map')"
        >
          <q-icon name="map" />
        </button>
      </div>

      <div class="hm-chips" role="list">
        <button
          v-for="chip in chips"
          :key="chip.key"
          class="hm-chip"
          role="listitem"
          @click="$emit('open-category', chip.key)"
        >
          <q-icon :name="chip.icon" />
          {{ isEnglish ? chip.en : chip.es }}
          <b v-if="chip.key === 'saved' && savedIds.length">{{ savedIds.length }}</b>
        </button>
      </div>
    </header>

    <!-- Destino del día -->
    <section v-if="featured" class="hm-block">
      <div class="hm-label">
        <span>{{ isEnglish ? 'Pick of the day' : 'Destino del día' }}</span>
        <i></i>
      </div>
      <article
        class="hm-poster"
        tabindex="0"
        @click="$emit('select-place', featured)"
        @keydown.enter="$emit('select-place', featured)"
      >
        <img :src="featured.image" :alt="nameOf(featured)" />
        <button
          class="hm-heart"
          :class="{ on: isSaved(featured) }"
          :aria-label="
            isSaved(featured)
              ? isEnglish
                ? 'Remove from saved'
                : 'Quitar de guardados'
              : isEnglish
                ? 'Save place'
                : 'Guardar lugar'
          "
          @click.stop="$emit('toggle-save', featured.id)"
        >
          <q-icon :name="isSaved(featured) ? 'favorite' : 'favorite_border'" />
        </button>
        <div class="hm-poster__info">
          <span class="hm-poster__region"><q-icon name="place" /> {{ featured.region }}</span>
          <h2>{{ nameOf(featured) }}</h2>
          <p>{{ descOf(featured) }}</p>
          <div class="hm-poster__foot">
            <span v-if="featured.rating" class="hm-rate"
              ><q-icon name="star" /> {{ featured.rating.toFixed(1) }}</span
            >
            <span class="hm-go"
              >{{ isEnglish ? 'Discover' : 'Descubrir' }} <q-icon name="arrow_outward"
            /></span>
          </div>
        </div>
      </article>
    </section>

    <!-- Bento de destinos -->
    <section v-if="bento.length" class="hm-block">
      <div class="hm-label">
        <span>{{ isEnglish ? 'More to explore' : 'Más para explorar' }}</span>
        <i></i>
        <button class="hm-more" @click="$emit('open-category', 'destination')">
          {{ isEnglish ? 'All' : 'Todos' }}
        </button>
      </div>
      <div class="hm-bento">
        <article
          v-for="(place, i) in bento"
          :key="place.id"
          class="hm-tile"
          :class="{ 'hm-tile--tall': i === 0 }"
          tabindex="0"
          @click="$emit('select-place', place)"
          @keydown.enter="$emit('select-place', place)"
        >
          <img :src="place.image" :alt="nameOf(place)" loading="lazy" />
          <button
            class="hm-heart hm-heart--sm"
            :class="{ on: isSaved(place) }"
            :aria-label="isEnglish ? 'Save place' : 'Guardar lugar'"
            @click.stop="$emit('toggle-save', place.id)"
          >
            <q-icon :name="isSaved(place) ? 'favorite' : 'favorite_border'" />
          </button>
          <div class="hm-tile__info">
            <strong>{{ nameOf(place) }}</strong>
            <small>{{ place.region }}</small>
          </div>
        </article>
      </div>
    </section>

    <!-- Alojamientos -->
    <section v-if="hotels.length" class="hm-block">
      <div class="hm-label">
        <span>{{ isEnglish ? 'Where to stay' : 'Dónde quedarte' }}</span>
        <i></i>
        <button class="hm-more" @click="$emit('open-category', 'hotel')">
          {{ isEnglish ? 'All' : 'Todos' }}
        </button>
      </div>
      <ol class="hm-stays">
        <li v-for="(hotel, i) in hotels" :key="hotel.id">
          <article
            class="hm-stay"
            tabindex="0"
            @click="$emit('select-place', hotel)"
            @keydown.enter="$emit('select-place', hotel)"
          >
            <span class="hm-stay__n">{{ String(i + 1).padStart(2, '0') }}</span>
            <img :src="hotel.image" :alt="nameOf(hotel)" loading="lazy" />
            <div class="hm-stay__txt">
              <strong>{{ nameOf(hotel) }}</strong>
              <small><q-icon name="place" /> {{ hotel.region }}</small>
              <span class="hm-stay__price">{{
                (isEnglish ? hotel.priceLabelEn : hotel.priceLabel) ||
                (isEnglish ? 'Check dates' : 'Consulta fechas')
              }}</span>
            </div>
            <div class="hm-stay__side">
              <span v-if="hotel.rating" class="hm-rate"
                ><q-icon name="star" /> {{ hotel.rating.toFixed(1) }}</span
              >
              <button
                class="hm-heart hm-heart--ghost"
                :class="{ on: isSaved(hotel) }"
                :aria-label="isEnglish ? 'Save place' : 'Guardar lugar'"
                @click.stop="$emit('toggle-save', hotel.id)"
              >
                <q-icon :name="isSaved(hotel) ? 'favorite' : 'favorite_border'" />
              </button>
            </div>
          </article>
        </li>
      </ol>
    </section>

    <!-- Atajos -->
    <section class="hm-block hm-duo">
      <button class="hm-duo__a" @click="$emit('open-budget')">
        <q-icon name="payments" />
        <strong>{{ isEnglish ? 'Trip budget' : 'Presupuesto' }}</strong>
        <small>{{
          isEnglish ? 'Estimate costs before you go' : 'Calcula el costo antes de salir'
        }}</small>
      </button>
      <button class="hm-duo__b" @click="$emit('open-map')">
        <q-icon name="explore" />
        <strong>{{ isEnglish ? 'Map' : 'Mapa' }}</strong>
        <small>{{ isEnglish ? 'Places near you' : 'Lugares cerca de ti' }}</small>
      </button>
    </section>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  isEnglish: Boolean,
  searchQuery: String,
  userName: { type: String, default: '' },
  places: { type: Array, required: true },
  savedIds: { type: Array, default: () => [] },
})

defineEmits([
  'update:searchQuery',
  'open-search',
  'open-map',
  'open-category',
  'open-budget',
  'select-place',
  'toggle-save',
])

const chips = [
  { key: 'destination', icon: 'landscape', es: 'Destinos', en: 'Places' },
  { key: 'hotel', icon: 'bed', es: 'Hoteles', en: 'Stays' },
  { key: 'map', icon: 'near_me', es: 'Rutas', en: 'Routes' },
  { key: 'saved', icon: 'favorite_border', es: 'Guardados', en: 'Saved' },
]

const destinations = computed(() => props.places.filter((p) => p.type === 'destination'))
const hotels = computed(() => props.places.filter((p) => p.type === 'hotel').slice(0, 4))

// El destino del día rota con la fecha, sin aleatoriedad en cada render.
const featured = computed(() => {
  const list = destinations.value
  if (!list.length) return null
  const day = Math.floor(Date.now() / 86400000)
  return list[day % list.length]
})
const bento = computed(() =>
  destinations.value.filter((p) => p.id !== featured.value?.id).slice(0, 3),
)

const firstName = computed(() => {
  const name = (props.userName || '').trim()
  if (!name || name === 'Viajero TURISGO') return ''
  return name.split(/\s+/)[0]
})
const greeting = computed(() => {
  const h = new Date().getHours()
  if (props.isEnglish) return h < 12 ? 'Good morning' : h < 19 ? 'Good afternoon' : 'Good evening'
  return h < 12 ? 'Buenos días' : h < 19 ? 'Buenas tardes' : 'Buenas noches'
})

const isSaved = (place) => props.savedIds.includes(place.id)
const nameOf = (place) => (props.isEnglish ? place.nameEn || place.name : place.name)
const descOf = (place) =>
  props.isEnglish ? place.descriptionEn || place.description : place.description
</script>
