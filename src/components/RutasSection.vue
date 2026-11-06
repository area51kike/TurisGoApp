<template>
  <div class="routes-tab">
    <div v-if="routes.length" class="routes-list">
      <article v-for="route in routes" :key="route.id" class="route-card">
        <div class="route-card__info">
          <strong>{{ route.placeName }}</strong>
          <small>{{ route.region }}</small>
          <div class="route-card__meta">
            <span><q-icon name="straighten" /> {{ formatDistance(route.distance) }}</span>
            <span><q-icon name="schedule" /> {{ formatDuration(route.duration, isEnglish) }}</span>
            <span><q-icon name="download_done" /> {{ formatDate(route.savedAt) }}</span>
          </div>
        </div>
        <div class="route-card__actions">
          <q-btn
            unelevated
            rounded
            dense
            color="primary"
            icon="map"
            :label="isEnglish ? 'Open' : 'Abrir'"
            @click="$emit('open-route', route)"
          />
          <q-btn
            flat
            round
            dense
            color="negative"
            icon="delete"
            :aria-label="isEnglish ? 'Delete route' : 'Eliminar ruta'"
            @click="$emit('delete-route', route.id)"
          />
        </div>
      </article>
    </div>
    <div v-else class="empty-state saved-empty">
      <div class="saved-empty__icon"><q-icon name="route" /></div>
      <strong>{{
        isEnglish ? 'No downloaded routes yet' : 'Aún no tienes rutas descargadas'
      }}</strong>
      <span>{{
        isEnglish
          ? 'Choose a destination on the map and tap “Download route”. It will be kept inside TURISGO.'
          : 'Elige un destino en el mapa y toca “Descargar ruta”. Se guardará dentro de TURISGO.'
      }}</span>
    </div>
  </div>
</template>

<script setup>
import { formatDistance, formatDuration } from '../services/routeService'

const props = defineProps({
  isEnglish: Boolean,
  routes: { type: Array, default: () => [] },
})
defineEmits(['open-route', 'delete-route'])

function formatDate(value) {
  return new Intl.DateTimeFormat(props.isEnglish ? 'en-US' : 'es-SV', {
    dateStyle: 'medium',
  }).format(new Date(value))
}
</script>

<style lang="scss">
.routes-tab {
  padding: 4px 0 12px;
}
.routes-list {
  display: grid;
  gap: 10px;
}
.route-card {
  display: flex;
  gap: 10px;
  align-items: center;
  justify-content: space-between;
  padding: 12px;
  border: 1px solid var(--line);
  border-radius: 16px;
  background: var(--surface);
}
.route-card__info {
  display: grid;
  gap: 2px;
  min-width: 0;
}
.route-card__info small {
  color: var(--text-muted);
}
.route-card__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 4px 10px;
  margin-top: 4px;
  color: var(--text-muted);
  font-size: 10px;
}
.route-card__meta .q-icon {
  color: var(--accent);
}
.route-card__actions {
  display: flex;
  gap: 4px;
  align-items: center;
  flex: none;
}
</style>
