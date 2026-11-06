<template>
  <section class="page-section map-page">
    <header class="page-heading">
      <span class="eyebrow">{{
        isEnglish ? 'EXPLORE WITHOUT LEAVING TURISGO' : 'EXPLORA SIN SALIR DE TURISGO'
      }}</span>
      <h1>{{ isEnglish ? 'Map and routes' : 'Mapa y rutas' }}</h1>
      <p>
        {{
          isEnglish
            ? 'See where you are, get directions and keep routes inside the app.'
            : 'Mira dónde estás, llega a tu destino y guarda rutas dentro de la app.'
        }}
      </p>
    </header>

    <q-tabs
      v-model="tab"
      dense
      no-caps
      active-color="primary"
      indicator-color="primary"
      class="map-tabs"
    >
      <q-tab name="map" icon="map" :label="isEnglish ? 'Map' : 'Mapa'" />
      <q-tab name="routes" icon="route" :label="isEnglish ? 'My routes' : 'Mis rutas'">
        <q-badge v-if="savedRoutes.length" color="pink" floating>{{ savedRoutes.length }}</q-badge>
      </q-tab>
    </q-tabs>

    <q-tab-panels v-model="tab" animated class="map-panels">
      <q-tab-panel name="map" class="q-pa-none">
        <q-select
          :model-value="selectedMapPlace"
          :options="places"
          option-label="name"
          outlined
          rounded
          :label="isEnglish ? 'Destination' : 'Destino'"
          @update:model-value="selectPlace"
        >
          <template #option="scope">
            <q-item v-bind="scope.itemProps">
              <q-item-section avatar
                ><q-icon :name="scope.opt.type === 'hotel' ? 'bed' : 'landscape'"
              /></q-item-section>
              <q-item-section
                ><q-item-label>{{ isEnglish ? scope.opt.nameEn : scope.opt.name }}</q-item-label
                ><q-item-label caption>{{ scope.opt.region }}</q-item-label></q-item-section
              >
            </q-item>
          </template>
        </q-select>

        <div v-if="selectedMapPlace" class="map-place-card">
          <div class="map-place-card__top">
            <img
              :src="selectedMapPlace.image"
              :alt="isEnglish ? selectedMapPlace.nameEn : selectedMapPlace.name"
            />
            <div>
              <span class="eyebrow">{{ selectedMapPlace.region }}</span
              ><strong>{{ isEnglish ? selectedMapPlace.nameEn : selectedMapPlace.name }}</strong>
            </div>
          </div>

          <LiveMap
            :is-english="isEnglish"
            :destination="destination"
            :destination-label="isEnglish ? selectedMapPlace.nameEn : selectedMapPlace.name"
            :route-line="route ? route.line : []"
            height="340px"
            @position="onPosition"
          />

          <div v-if="route" class="route-summary">
            <div class="route-summary__totals">
              <span><q-icon name="straighten" /> {{ formatDistance(route.distance) }}</span>
              <span
                ><q-icon name="schedule" /> {{ formatDuration(route.duration, isEnglish) }}</span
              >
              <span v-if="remaining !== null"
                ><q-icon name="flag" /> {{ formatDistance(remaining) }}
                {{ isEnglish ? 'left' : 'restantes' }}</span
              >
            </div>
            <div v-if="nextStep" class="route-next">
              <q-icon name="turn_right" />
              <div>
                <strong>{{ nextStep.text }}</strong>
                <small v-if="nextStepDistance !== null"
                  >{{ isEnglish ? 'in' : 'en' }} {{ formatDistance(nextStepDistance) }}</small
                >
              </div>
            </div>
            <q-expansion-item
              dense
              icon="list"
              :label="isEnglish ? 'All steps' : 'Todos los pasos'"
            >
              <ol class="route-steps">
                <li
                  v-for="(step, index) in route.steps"
                  :key="index"
                  :class="{ done: index < stepIndex }"
                >
                  {{ step.text }}
                  <small v-if="step.distance">· {{ formatDistance(step.distance) }}</small>
                </li>
              </ol>
            </q-expansion-item>
          </div>
          <p v-if="message" class="route-message"><q-icon name="info" /> {{ message }}</p>

          <div class="map-actions">
            <q-btn
              outline
              rounded
              icon="info"
              color="primary"
              :label="isEnglish ? 'Place details' : 'Ver detalles'"
              @click="$emit('select-place', selectedMapPlace)"
            />
            <q-btn
              unelevated
              rounded
              icon="near_me"
              color="primary"
              :loading="loading"
              :label="isEnglish ? 'Directions' : 'Cómo llegar'"
              @click="getDirections"
            />
            <q-btn
              class="route-download"
              outline
              rounded
              icon="download"
              color="primary"
              :disable="!route || isRouteSaved"
              :label="
                isRouteSaved
                  ? isEnglish
                    ? 'Route downloaded in the app'
                    : 'Ruta descargada en la app'
                  : isEnglish
                    ? 'Download route (keep in app)'
                    : 'Descargar ruta (guardar en la app)'
              "
              @click="downloadRoute"
            />
          </div>
          <p class="map-note">
            <q-icon name="info" />
            {{
              isEnglish
                ? 'Everything happens inside TURISGO. Downloaded routes live in “My routes”.'
                : 'Todo ocurre dentro de TURISGO. Las rutas descargadas están en “Mis rutas”.'
            }}
          </p>
        </div>
      </q-tab-panel>

      <q-tab-panel name="routes" class="q-pa-none">
        <RutasSection
          :is-english="isEnglish"
          :routes="savedRoutes"
          @open-route="openSavedRoute"
          @delete-route="removeRoute"
        />
      </q-tab-panel>
    </q-tab-panels>
  </section>
</template>

<script setup>
import { computed, nextTick, ref, watch } from 'vue'
import { useQuasar } from 'quasar'
import LiveMap from './LiveMap.vue'
import RutasSection from './RutasSection.vue'
import {
  deleteRoute,
  distanceMeters,
  fetchDrivingRoute,
  findSavedRoute,
  formatDistance,
  formatDuration,
  getCurrentPosition,
  resolvePlaceCoordinates,
  saveRoute,
  savedRoutes,
} from '../services/routeService'

const props = defineProps({
  isEnglish: Boolean,
  places: { type: Array, required: true },
  selectedMapPlace: { type: Object, default: null },
  routeRequest: { type: Number, default: 0 },
})
const emit = defineEmits(['update:selectedMapPlace', 'select-place'])

const $q = useQuasar()
const tab = ref('map')
const route = ref(null)
const loading = ref(false)
const message = ref('')
const userPos = ref(null)
const stepIndex = ref(0)
const destination = ref(props.selectedMapPlace?.coordinates || null)

const isRouteSaved = computed(() => {
  if (!route.value || !props.selectedMapPlace) return false
  const saved = findSavedRoute(props.selectedMapPlace.id)
  return Boolean(saved && saved.distance === route.value.distance)
})
const nextStep = computed(() => route.value?.steps?.[stepIndex.value] || null)
const nextStepDistance = computed(() =>
  userPos.value && nextStep.value ? distanceMeters(userPos.value, nextStep.value.location) : null,
)
const remaining = computed(() =>
  userPos.value && route.value ? distanceMeters(userPos.value, route.value.to) : null,
)

function onPosition(point) {
  userPos.value = point
  const steps = route.value?.steps || []
  while (
    stepIndex.value < steps.length - 1 &&
    distanceMeters(point, steps[stepIndex.value].location) < 35
  ) {
    stepIndex.value += 1
  }
}

async function updateDestination() {
  destination.value = props.selectedMapPlace
    ? await resolvePlaceCoordinates(props.selectedMapPlace)
    : null
}

function selectPlace(place) {
  route.value = null
  message.value = ''
  emit('update:selectedMapPlace', place)
}

watch(
  () => props.selectedMapPlace?.id,
  () => {
    if (route.value && route.value.placeId !== props.selectedMapPlace?.id) route.value = null
    stepIndex.value = 0
    updateDestination()
  },
  { immediate: true },
)

watch(
  () => props.routeRequest,
  async () => {
    tab.value = 'map'
    await nextTick()
    getDirections()
  },
)

function errorMessage(error) {
  if (error?.code === 1)
    return props.isEnglish
      ? 'Allow location access so TURISGO can start the route from where you are.'
      : 'Permite el acceso a la ubicación para iniciar la ruta desde donde estás.'
  return props.isEnglish
    ? 'Could not get your location. Try again outdoors.'
    : 'No pudimos obtener tu ubicación. Inténtalo de nuevo al aire libre.'
}

async function getDirections() {
  const place = props.selectedMapPlace
  if (!place || loading.value) return
  loading.value = true
  message.value = ''
  try {
    const to = await resolvePlaceCoordinates(place)
    if (!to) {
      message.value = props.isEnglish
        ? 'This place has no exact location yet.'
        : 'Este lugar aún no tiene ubicación exacta.'
      return
    }
    destination.value = to
    let from = userPos.value
    if (!from) {
      try {
        from = await getCurrentPosition()
        userPos.value = from
      } catch (error) {
        const saved = findSavedRoute(place.id)
        if (saved) {
          openSavedRoute(saved)
          return
        }
        message.value = errorMessage(error)
        return
      }
    }
    try {
      const result = await fetchDrivingRoute(from, to, props.isEnglish)
      route.value = {
        ...result,
        placeId: place.id,
        placeName: props.isEnglish ? place.nameEn : place.name,
        region: place.region,
      }
      stepIndex.value = 0
    } catch {
      const saved = findSavedRoute(place.id)
      if (saved) {
        route.value = saved
        stepIndex.value = 0
        message.value = props.isEnglish
          ? 'No connection: showing your downloaded route.'
          : 'Sin conexión: mostrando tu ruta descargada.'
      } else {
        message.value = props.isEnglish
          ? 'Could not calculate the route. Check your connection and try again.'
          : 'No se pudo calcular la ruta. Revisa tu conexión e inténtalo de nuevo.'
      }
    }
  } finally {
    loading.value = false
  }
}

function downloadRoute() {
  if (!route.value) return
  const ok = saveRoute(route.value)
  $q.notify({
    type: ok ? 'positive' : 'warning',
    message: ok
      ? props.isEnglish
        ? 'Route downloaded. Find it in “My routes”.'
        : 'Ruta descargada. La encuentras en “Mis rutas”.'
      : props.isEnglish
        ? 'Not enough storage to save the route.'
        : 'No hay espacio suficiente para guardar la ruta.',
  })
}

function openSavedRoute(saved) {
  const place = props.places.find((item) => item.id === saved.placeId)
  if (place) emit('update:selectedMapPlace', place)
  destination.value = saved.to
  route.value = saved
  stepIndex.value = 0
  message.value = ''
  tab.value = 'map'
}

function removeRoute(id) {
  if (route.value?.id === id) route.value = null
  deleteRoute(id)
  $q.notify({ type: 'info', message: props.isEnglish ? 'Route deleted.' : 'Ruta eliminada.' })
}
</script>

<style lang="scss">
.map-tabs {
  margin: 4px 0 10px;
  color: var(--text-muted);
}
.map-panels {
  background: transparent;
  color: inherit;
}
.route-summary {
  display: grid;
  gap: 8px;
  padding: 12px 12px 0;
}
.route-summary__totals {
  display: flex;
  flex-wrap: wrap;
  gap: 4px 14px;
  font-size: 12px;
  font-weight: 650;
}
.route-summary__totals .q-icon {
  color: var(--accent);
}
.route-next {
  display: flex;
  gap: 10px;
  align-items: center;
  padding: 10px 12px;
  border-radius: 14px;
  background: var(--surface-raised);
}
.route-next .q-icon {
  font-size: 26px;
  color: var(--gold);
}
.route-next div {
  display: grid;
}
.route-next small {
  color: var(--text-muted);
}
.route-steps {
  margin: 0;
  padding: 4px 12px 10px 30px;
  font-size: 12px;
  line-height: 1.6;
}
.route-steps li.done {
  opacity: 0.45;
  text-decoration: line-through;
}
.route-message {
  display: flex;
  gap: 7px;
  margin: 10px 12px 0;
  color: var(--gold);
  font-size: 11px;
}
</style>
