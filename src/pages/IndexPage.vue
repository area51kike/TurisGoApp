<template>
  <div
    class="app-shell"
    :class="`theme-${preferences.theme}`"
    :style="{ fontFamily: preferences.font }"
  >
    <header class="app-topbar">
      <button class="brand-lockup" @click="navigateTo('home')">
        <span class="brand-mark"><q-icon name="explore" /></span>
        <span
          ><strong>TURISGO</strong
          ><small>{{ isEnglish ? 'EL SALVADOR' : 'EL SALVADOR' }}</small></span
        >
      </button>
      <div class="topbar-actions">
        <button
          class="language-toggle"
          :aria-label="isEnglish ? 'Cambiar idioma a español' : 'Switch language to English'"
          @click="toggleLanguage"
        >
          {{ isEnglish ? 'ES' : 'EN' }}
        </button>
        <button
          class="topbar-icon"
          :aria-label="isEnglish ? 'Customize app' : 'Personalizar app'"
          @click="openSettings"
        >
          <q-icon name="tune" />
        </button>
        <button
          class="topbar-avatar"
          :aria-label="isEnglish ? 'Open profile' : 'Abrir perfil'"
          @click="navigateTo('profile')"
        >
          <img
            v-if="userProfile.avatarUrl && !avatarLoadFailed"
            :src="userProfile.avatarUrl"
            alt=""
            @error="avatarLoadFailed = true"
          />
          <span v-else>{{ profileInitials }}</span>
        </button>
      </div>
    </header>

    <main class="screen-content" :class="{ 'screen-content--home': currentScreen === 'home' }">
      <InicioSection
        v-if="currentScreen === 'home'"
        :is-english="isEnglish"
        :search-query="searchQuery"
        :user-name="userProfile.name"
        :places="visiblePlaces"
        :saved-ids="savedIds"
        @update:search-query="searchQuery = $event"
        @open-search="openSearch()"
        @open-map="navigateTo('map')"
        @open-category="openCategory"
        @open-budget="navigateTo('budget')"
        @select-place="openPlace"
        @toggle-save="toggleSaved"
      />

      <BuscarSection
        v-else-if="currentScreen === 'search'"
        :key="`${searchFilter}-${searchQuery}`"
        :is-english="isEnglish"
        :places="visiblePlaces"
        :saved-ids="savedIds"
        :initial-query="searchQuery"
        :initial-filter="searchFilter"
        @select-place="openPlace"
        @toggle-save="toggleSaved"
      />

      <GuardadosSection
        v-else-if="currentScreen === 'saved'"
        :is-english="isEnglish"
        :places="savedPlaces"
        @select-place="openPlace"
        @toggle-save="toggleSaved"
        @open-search="navigateTo('search')"
      />

      <PerfilSection
        v-else-if="currentScreen === 'profile'"
        :is-english="isEnglish"
        :user-profile="userProfile"
        @save-profile="saveProfile"
        @navigate="navigateTo"
        @open-settings="openSettings"
      />

      <ExplorarSection
        v-else-if="currentScreen === 'map'"
        :is-english="isEnglish"
        :places="visiblePlaces"
        :selected-map-place="selectedMapPlace"
        @update:selected-map-place="selectedMapPlace = $event"
        @select-place="openPlace"
      />

      <PresupuestoSection
        v-else-if="currentScreen === 'budget'"
        :is-english="isEnglish"
        :places="visiblePlaces"
        :selected-place-ids="budgetPlaceIds"
        :costs="budgetCosts"
        :total-budget="totalBudget"
        @update:selected-place-ids="updateBudgetPlaceIds"
        @update:costs="updateBudgetCosts"
        @open-search="navigateTo('search')"
      />

      <MensajesSection
        v-else-if="currentScreen === 'messages'"
        :is-english="isEnglish"
        :people="people"
        :messages="conversations"
        @send-message="sendMessage"
      />

      <EmpresaSection
        v-else-if="currentScreen === 'business'"
        :is-english="isEnglish"
        :profile="businessProfile"
        :plan-active="premiumPreviewActive"
        :update-due="businessUpdateDue"
        :saving="savingBusiness"
        :customer-reviews="businessReviews"
        :review-replies="businessReplies"
        @activate-demo="activatePremiumPreview"
        @save-profile="saveBusinessProfile"
        @reply-review="replyToReview"
      />
    </main>

    <nav
      class="bottom-navigation"
      :aria-label="isEnglish ? 'Main navigation' : 'Navegación principal'"
    >
      <button
        v-for="item in navigationItems"
        :key="item.key"
        :class="['bottom-navigation__item', { active: selectedNav === item.key }]"
        @click="navigateTo(item.key)"
      >
        <q-icon :name="item.icon" />
        <span>{{ isEnglish ? item.en : item.es }}</span>
      </button>
    </nav>

    <PlaceDetailDialog
      v-model="detailOpen"
      :place="selectedPlace"
      :is-english="isEnglish"
      :is-saved="selectedPlace ? savedIds.includes(selectedPlace.id) : false"
      :visited="isVisitVerified"
      :checking-visit="checkingVisit"
      :reviews="selectedReviews"
      @toggle-save="toggleSaved"
      @add-to-budget="addPlaceToBudget"
      @verify-visit="verifyVisit"
      @submit-review="submitReview"
    />

    <q-dialog v-model="settingsOpen" persistent>
      <q-card class="settings-dialog">
        <div class="settings-dialog__top">
          <div>
            <span class="eyebrow">{{ isEnglish ? 'MAKE IT YOURS' : 'A TU MANERA' }}</span>
            <h2>{{ isEnglish ? 'Appearance' : 'Personalización' }}</h2>
          </div>
          <q-btn
            flat
            round
            icon="close"
            :aria-label="isEnglish ? 'Close' : 'Cerrar'"
            @click="settingsOpen = false"
          />
        </div>
        <p class="settings-dialog__intro">
          {{
            isEnglish
              ? 'Choose colors and a typeface. Changes apply when you save.'
              : 'Elige colores y una tipografía. Los cambios se aplican al guardar.'
          }}
        </p>

        <div class="settings-choice-group">
          <div class="settings-label">{{ isEnglish ? 'COLOR THEME' : 'TEMA DE COLOR' }}</div>
          <button
            v-for="theme in themeOptions"
            :key="theme.value"
            :class="[
              'theme-choice',
              `theme-choice--${theme.value}`,
              { selected: settingsDraft.theme === theme.value },
            ]"
            @click="settingsDraft.theme = theme.value"
          >
            <span class="theme-choice__swatches"><i></i><i></i><i></i></span
            ><span>{{ isEnglish ? theme.en : theme.es }}</span
            ><q-icon v-if="settingsDraft.theme === theme.value" name="check_circle" />
          </button>
        </div>

        <div class="settings-choice-group">
          <div class="settings-label">{{ isEnglish ? 'TYPEFACE' : 'TIPOGRAFÍA' }}</div>
          <button
            v-for="font in fontOptions"
            :key="font.value"
            :class="['font-choice', { selected: settingsDraft.font === font.value }]"
            @click="settingsDraft.font = font.value"
          >
            <span :style="{ fontFamily: font.value }">{{ font.sample }}</span
            ><strong>{{ isEnglish ? font.en : font.es }}</strong
            ><q-icon v-if="settingsDraft.font === font.value" name="check_circle" />
          </button>
        </div>

        <div class="settings-dialog__actions">
          <q-btn
            flat
            rounded
            :label="isEnglish ? 'Cancel' : 'Cancelar'"
            @click="settingsOpen = false"
          /><q-btn
            unelevated
            rounded
            color="primary"
            icon="save"
            :label="isEnglish ? 'Save changes' : 'Guardar cambios'"
            @click="saveSettings"
          />
        </div>
      </q-card>
    </q-dialog>

    <q-dialog
      v-model="showTutorial"
      persistent
      maximized
      transition-show="fade"
      transition-hide="fade"
    >
      <div class="tutorial-overlay">
        <div class="tutorial-card">
          <div class="tutorial-brand">
            <span class="brand-mark"><q-icon name="explore" /></span><strong>TURISGO</strong>
          </div>
          <div class="tutorial-progress">
            <span>{{ isEnglish ? 'QUICK START' : 'INICIO RÁPIDO' }}</span
            ><span>{{ currentTutorialStep + 1 }} / {{ tutorialSteps.length }}</span>
          </div>
          <div class="tutorial-icon">
            <q-icon :name="tutorialSteps[currentTutorialStep].icon" />
          </div>
          <div class="tutorial-copy">
            <span class="eyebrow"
              >{{ isEnglish ? 'STEP' : 'PASO' }} {{ currentTutorialStep + 1 }}</span
            >
            <h1>
              {{
                isEnglish
                  ? tutorialSteps[currentTutorialStep].titleEn
                  : tutorialSteps[currentTutorialStep].title
              }}
            </h1>
            <p>
              {{
                isEnglish
                  ? tutorialSteps[currentTutorialStep].descriptionEn
                  : tutorialSteps[currentTutorialStep].description
              }}
            </p>
          </div>
          <div class="tutorial-dots">
            <span
              v-for="(_, index) in tutorialSteps"
              :key="index"
              :class="{
                active: index === currentTutorialStep,
                complete: index < currentTutorialStep,
              }"
            ></span>
          </div>
          <q-btn
            unelevated
            rounded
            color="primary"
            icon-right="arrow_forward"
            :label="tutorialButtonLabel"
            class="tutorial-next"
            @click="nextTutorialStep"
          />
          <small class="tutorial-footnote">{{
            isEnglish
              ? 'Follow the steps to start exploring.'
              : 'Sigue estos pasos para comenzar a explorar.'
          }}</small>
        </div>
      </div>
    </q-dialog>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useQuasar } from 'quasar'
import { places as catalogPlaces, demoPeople } from '../data/places'
import InicioSection from '../components/InicioSection.vue'
import BuscarSection from '../components/BuscarSection.vue'
import GuardadosSection from '../components/GuardadosSection.vue'
import PerfilSection from '../components/PerfilSection.vue'
import ExplorarSection from '../components/ExplorarSection.vue'
import PresupuestoSection from '../components/PresupuestoSection.vue'
import MensajesSection from '../components/MensajesSection.vue'
import EmpresaSection from '../components/EmpresaSection.vue'
import PlaceDetailDialog from '../components/PlaceDetailDialog.vue'
import {
  loadBusinessListings,
  saveBusinessListing,
  saveUserProfile,
} from '../services/businessRepository'
import { isPhotoSource } from '../services/imageUtils'

const $q = useQuasar()
const STORAGE_KEYS = {
  tutorial: 'turisgo.tutorial.completed',
  preferences: 'turisgo.preferences.v2',
  profile: 'turisgo.profile',
  saved: 'turisgo.saved-places',
  budget: 'turisgo.budget',
  budgetPlaces: 'turisgo.budget-places',
  visits: 'turisgo.verified-visits',
  reviews: 'turisgo.reviews',
  language: 'turisgo.language',
  business: 'turisgo.business-profile',
  premium: 'turisgo.premium-preview',
  replies: 'turisgo.business-replies',
  conversations: 'turisgo.conversations',
}

function readStorage(key, fallback) {
  if (typeof window === 'undefined') return fallback
  try {
    const value = window.localStorage.getItem(key)
    return value === null ? fallback : JSON.parse(value)
  } catch {
    return fallback
  }
}

function writeStorage(key, value) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value))
    return true
  } catch {
    return false
  }
}

const preferences = ref(
  readStorage(STORAGE_KEYS.preferences, {
    theme: 'turisgo',
    font: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  }),
)
const preferencesDefaults = { ...preferences.value }
const userProfile = ref(
  readStorage(STORAGE_KEYS.profile, {
    name: 'Viajero TURISGO',
    username: 'viajero',
    avatarUrl: '',
    mode: 'personal',
  }),
)
const savedIds = ref(readStorage(STORAGE_KEYS.saved, []))
const budgetCosts = ref(readStorage(STORAGE_KEYS.budget, { food: 0, lodging: 0, extras: 0 }))
const budgetPlaceIds = ref(readStorage(STORAGE_KEYS.budgetPlaces, []))
const visitProofs = ref(readStorage(STORAGE_KEYS.visits, {}))
const userReviews = ref(readStorage(STORAGE_KEYS.reviews, {}))
const businessProfile = ref(
  readStorage(STORAGE_KEYS.business, {
    id: '',
    name: '',
    nameEn: '',
    type: 'hotel',
    region: '',
    description: '',
    descriptionEn: '',
    category: 'Negocio local',
    categoryEn: 'Local business',
    priceLabel: '',
    priceLabelEn: '',
    commissionRate: 0,
    websiteUrl: '',
    mapUrl: '',
    latitude: '',
    longitude: '',
    coordinates: null,
    photoUrls: [],
    branches: [],
    updatedAt: '',
  }),
)
const premiumPreviewActive = ref(readStorage(STORAGE_KEYS.premium, false))
const cloudBusinessListings = ref([])
const businessReplies = ref(readStorage(STORAGE_KEYS.replies, {}))
const conversations = ref(readStorage(STORAGE_KEYS.conversations, {}))
const isEnglish = ref(readStorage(STORAGE_KEYS.language, false))
const showTutorial = ref(!readStorage(STORAGE_KEYS.tutorial, false))
const currentTutorialStep = ref(0)
const currentScreen = ref('home')
const selectedNav = ref('home')
const searchQuery = ref('')
const searchFilter = ref('all')
const selectedMapPlace = ref(catalogPlaces[0])
const selectedPlace = ref(null)
const detailOpen = ref(false)
const settingsOpen = ref(false)
const settingsDraft = ref({ ...preferencesDefaults })
const checkingVisit = ref(false)
const savingBusiness = ref(false)
const avatarLoadFailed = ref(false)

const tutorialSteps = [
  {
    icon: 'search',
    title: 'Busca lugares que van contigo',
    titleEn: 'Find places that fit your trip',
    description:
      'Busca destinos y hoteles por nombre o departamento, y guarda los que te interesen.',
    descriptionEn:
      'Search destinations and hotels by name or region, and save the places you like.',
  },
  {
    icon: 'photo_library',
    title: 'Abre una ficha para conocer más',
    titleEn: 'Open a place to see the details',
    description:
      'Mira fotos, puntuaciones, detalles y el mapa. Las indicaciones también pueden abrir Google Maps.',
    descriptionEn:
      'Browse photos, ratings, details, and an in-app map. Directions can also open in Google Maps.',
  },
  {
    icon: 'account_balance_wallet',
    title: 'Arma tu presupuesto',
    titleEn: 'Build a trip budget',
    description: 'Añade destinos para comparar el costo de viaje estimado y suma otros gastos.',
    descriptionEn:
      'Add destinations to compare estimated travel costs, then include your other expenses.',
  },
  {
    icon: 'person',
    title: 'Personaliza tu experiencia',
    titleEn: 'Make the app yours',
    description: 'Elige tu tema, cambia la letra y completa tu perfil personal o empresarial.',
    descriptionEn:
      'Choose a theme, change the typeface, and set up a personal or business profile.',
  },
]
const tutorialButtonLabel = computed(() =>
  currentTutorialStep.value === tutorialSteps.length - 1
    ? isEnglish.value
      ? 'Start exploring'
      : 'Comenzar a explorar'
    : isEnglish.value
      ? 'Next step'
      : 'Siguiente paso',
)
const navigationItems = [
  { key: 'home', icon: 'home', es: 'Inicio', en: 'Home' },
  { key: 'search', icon: 'search', es: 'Buscar', en: 'Search' },
  { key: 'saved', icon: 'favorite', es: 'Guardados', en: 'Saved' },
  { key: 'profile', icon: 'person', es: 'Perfil', en: 'Profile' },
]
const themeOptions = [
  { value: 'turisgo', es: 'TurisGo', en: 'TurisGo' },
  { value: 'light', es: 'Claro', en: 'Light' },
  { value: 'sunset', es: 'Atardecer', en: 'Sunset' },
]
const fontOptions = [
  {
    value: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    es: 'Sistema',
    en: 'System',
    sample: 'Aa',
  },
  { value: 'Georgia, "Times New Roman", serif', es: 'Georgia', en: 'Georgia', sample: 'Aa' },
  { value: 'Arial, Helvetica, sans-serif', es: 'Arial', en: 'Arial', sample: 'Aa' },
]

function isListingUpdateDue(profile) {
  if (!profile?.published) return false
  const updatedAt = profile.updatedAt ? new Date(profile.updatedAt).getTime() : 0
  return !updatedAt || Date.now() - updatedAt >= 30 * 24 * 60 * 60 * 1000
}

function mapBusinessPlace(profile) {
  return {
    id: profile.id,
    type: profile.type || 'hotel',
    name: profile.name,
    nameEn: profile.nameEn || profile.name,
    region: profile.region,
    description: profile.description,
    descriptionEn: profile.descriptionEn || profile.description,
    image: profile.photoUrls[0],
    gallery: profile.photoUrls.slice(1),
    rating: null,
    reviewsCount: 0,
    travelEstimate: 8,
    coordinates: profile.coordinates || null,
    mapQuery: profile.coordinates
      ? profile.coordinates.join(',')
      : `${profile.name}, ${profile.region}, El Salvador`,
    category: profile.category || 'Negocio local',
    categoryEn: profile.categoryEn || 'Local business',
    priceLabel: profile.priceLabel || 'Consultar',
    priceLabelEn: profile.priceLabelEn || 'Check details',
    bookingUrl: profile.websiteUrl || '',
    branches: profile.branches || [],
    mapUrl: profile.mapUrl || '',
    isBusinessListing: true,
    reviews: [],
  }
}

const visiblePlaces = computed(() => {
  const listingsById = new Map()
  for (const profile of cloudBusinessListings.value) listingsById.set(profile.id, profile)
  if (businessProfile.value.published && businessProfile.value.id)
    listingsById.set(businessProfile.value.id, businessProfile.value)
  const activeListings = [...listingsById.values()].filter(
    (profile) => profile.published && !isListingUpdateDue(profile) && profile.photoUrls?.length,
  )
  return [...catalogPlaces, ...activeListings.map(mapBusinessPlace)]
})
const savedPlaces = computed(() =>
  visiblePlaces.value.filter((place) => savedIds.value.includes(place.id)),
)
const selectedReviews = computed(() => {
  if (!selectedPlace.value) return []
  const base = (selectedPlace.value.reviews || []).map((review) => ({ ...review, sample: true }))
  const submitted = userReviews.value[selectedPlace.value.id] || []
  return [...submitted, ...base]
})
const isVisitVerified = computed(() =>
  Boolean(selectedPlace.value && visitProofs.value[selectedPlace.value.id]),
)
const businessReviews = computed(
  () =>
    userReviews.value[businessProfile.value.id || `business-${userProfile.value.username}`] || [],
)
const businessUpdateDue = computed(() => isListingUpdateDue(businessProfile.value))
const totalBudget = computed(() => {
  const travel = budgetPlaceIds.value.reduce(
    (sum, id) => sum + (visiblePlaces.value.find((place) => place.id === id)?.travelEstimate || 0),
    0,
  )
  return (
    travel +
    Number(budgetCosts.value.food || 0) +
    Number(budgetCosts.value.lodging || 0) +
    Number(budgetCosts.value.extras || 0)
  )
})
const profileInitials = computed(() =>
  (userProfile.value.name || 'T')
    .trim()
    .split(/\s+/)
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase(),
)
const people = computed(() =>
  demoPeople.filter((person) => person.username !== userProfile.value.username),
)

watch(
  preferences,
  (value) => {
    document.documentElement.dataset.turisgoTheme = value.theme
  },
  { immediate: true, deep: true },
)
watch(isEnglish, (value) => {
  document.documentElement.lang = value ? 'en' : 'es'
})

onMounted(async () => {
  try {
    cloudBusinessListings.value = await loadBusinessListings()
  } catch (error) {
    console.warn('Could not load public business listings from Firestore:', error)
  }
})

function navigateTo(screen) {
  currentScreen.value = screen
  selectedNav.value = ['home', 'search', 'saved', 'profile'].includes(screen) ? screen : 'profile'
  if (screen === 'search') searchFilter.value = 'all'
}

function openSearch() {
  searchFilter.value = 'all'
  navigateTo('search')
}

function openCategory(category) {
  if (category === 'saved') return navigateTo('saved')
  if (category === 'map') return navigateTo('map')
  searchFilter.value = category === 'hotel' || category === 'destination' ? category : 'all'
  navigateTo('search')
}

function openPlace(place) {
  selectedPlace.value = place
  detailOpen.value = true
}

function toggleSaved(id) {
  savedIds.value = savedIds.value.includes(id)
    ? savedIds.value.filter((savedId) => savedId !== id)
    : [...savedIds.value, id]
  writeStorage(STORAGE_KEYS.saved, savedIds.value)
}

function addPlaceToBudget(place) {
  if (!budgetPlaceIds.value.includes(place.id)) {
    budgetPlaceIds.value = [...budgetPlaceIds.value, place.id]
    writeStorage(STORAGE_KEYS.budgetPlaces, budgetPlaceIds.value)
  }
  detailOpen.value = false
  navigateTo('budget')
  $q.notify({
    type: 'positive',
    message: isEnglish.value
      ? 'Place added to your trip budget.'
      : 'Lugar añadido a tu presupuesto.',
  })
}

function updateBudgetPlaceIds(ids) {
  budgetPlaceIds.value = ids
  writeStorage(STORAGE_KEYS.budgetPlaces, ids)
}

function updateBudgetCosts(costs) {
  budgetCosts.value = costs
  writeStorage(STORAGE_KEYS.budget, costs)
}

async function saveProfile(profile) {
  const photoUrl = profile.avatarUrl?.trim()
  if (photoUrl && !isPhotoSource(photoUrl)) {
    $q.notify({
      type: 'negative',
      message: isEnglish.value ? 'Upload a valid photo.' : 'Sube una foto válida.',
    })
    return
  }
  userProfile.value = { ...profile, avatarUrl: photoUrl || '' }
  avatarLoadFailed.value = false
  writeStorage(STORAGE_KEYS.profile, userProfile.value)
  try {
    await saveUserProfile(userProfile.value)
    $q.notify({
      type: 'positive',
      message: isEnglish.value ? 'Profile and photo saved.' : 'Perfil y foto guardados.',
    })
  } catch (error) {
    console.warn('Firestore user profile save failed:', error)
    $q.notify({
      type: 'warning',
      message: isEnglish.value
        ? 'Saved on this device. Firestore rejected the write; check project rules and authentication.'
        : 'Guardado en este dispositivo. Firestore rechazó la escritura; revisa las reglas y la autenticación del proyecto.',
    })
  }
}

function openSettings() {
  settingsDraft.value = { ...preferences.value }
  settingsOpen.value = true
}

function saveSettings() {
  preferences.value = { ...settingsDraft.value }
  writeStorage(STORAGE_KEYS.preferences, preferences.value)
  settingsOpen.value = false
  $q.notify({
    type: 'positive',
    message: isEnglish.value ? 'Appearance saved.' : 'Personalización guardada.',
  })
}

function toggleLanguage() {
  isEnglish.value = !isEnglish.value
  writeStorage(STORAGE_KEYS.language, isEnglish.value)
}

function nextTutorialStep() {
  if (currentTutorialStep.value < tutorialSteps.length - 1) {
    currentTutorialStep.value += 1
    return
  }
  showTutorial.value = false
  writeStorage(STORAGE_KEYS.tutorial, true)
}

function haversineMeters(from, to) {
  const radians = (degrees) => (degrees * Math.PI) / 180
  const [lat1, lon1] = from
  const [lat2, lon2] = to
  const dLat = radians(lat2 - lat1)
  const dLon = radians(lon2 - lon1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(radians(lat1)) * Math.cos(radians(lat2)) * Math.sin(dLon / 2) ** 2
  return 6_371_000 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function verifyVisit(place) {
  if (!Array.isArray(place.coordinates) || place.coordinates.length !== 2) {
    $q.notify({
      type: 'warning',
      message: isEnglish.value
        ? 'The business needs exact map coordinates before visits can be verified.'
        : 'El negocio debe añadir coordenadas exactas antes de poder verificar visitas.',
    })
    return
  }
  if (!navigator.geolocation) {
    $q.notify({
      type: 'warning',
      message: isEnglish.value
        ? 'Location verification is not available in this browser.'
        : 'Este navegador no permite verificar la ubicación.',
    })
    return
  }
  checkingVisit.value = true
  navigator.geolocation.getCurrentPosition(
    (position) => {
      checkingVisit.value = false
      const distance = haversineMeters(
        [position.coords.latitude, position.coords.longitude],
        place.coordinates,
      )
      if (distance > 2500) {
        $q.notify({
          type: 'warning',
          message: isEnglish.value
            ? `You are about ${(distance / 1000).toFixed(1)} km away. Reviews unlock within 2.5 km.`
            : `Estás a unos ${(distance / 1000).toFixed(1)} km. Las reseñas se habilitan a menos de 2.5 km.`,
        })
        return
      }
      visitProofs.value = { ...visitProofs.value, [place.id]: new Date().toISOString() }
      writeStorage(STORAGE_KEYS.visits, visitProofs.value)
      $q.notify({
        type: 'positive',
        message: isEnglish.value
          ? 'Visit verified. You can now leave a review.'
          : 'Visita verificada. Ya puedes dejar tu reseña.',
      })
    },
    (error) => {
      checkingVisit.value = false
      const message =
        error.code === 1
          ? isEnglish.value
            ? 'Allow location access to verify your visit.'
            : 'Permite el acceso a la ubicación para verificar tu visita.'
          : isEnglish.value
            ? 'Could not read your location. Try again outdoors.'
            : 'No pudimos obtener tu ubicación. Inténtalo de nuevo al aire libre.'
      $q.notify({ type: 'warning', message })
    },
    { enableHighAccuracy: true, timeout: 12000, maximumAge: 30000 },
  )
}

function submitReview(review) {
  if (!selectedPlace.value || !visitProofs.value[selectedPlace.value.id]) {
    $q.notify({
      type: 'negative',
      message: isEnglish.value
        ? 'Verify your visit before reviewing.'
        : 'Verifica tu visita antes de publicar una reseña.',
    })
    return
  }
  const id = `${Date.now()}`
  const entry = {
    id,
    author: userProfile.value.name || (isEnglish.value ? 'Traveler' : 'Viajero'),
    rating: review.rating,
    text: review.text,
    date: new Intl.DateTimeFormat(isEnglish.value ? 'en-US' : 'es-SV', {
      dateStyle: 'medium',
    }).format(new Date()),
    verifiedAt: visitProofs.value[selectedPlace.value.id],
    sample: false,
  }
  userReviews.value = {
    ...userReviews.value,
    [selectedPlace.value.id]: [entry, ...(userReviews.value[selectedPlace.value.id] || [])],
  }
  writeStorage(STORAGE_KEYS.reviews, userReviews.value)
  $q.notify({
    type: 'positive',
    message: isEnglish.value ? 'Review published.' : 'Reseña publicada.',
  })
}

function activatePremiumPreview() {
  premiumPreviewActive.value = true
  writeStorage(STORAGE_KEYS.premium, true)
  userProfile.value = { ...userProfile.value, mode: 'business' }
  writeStorage(STORAGE_KEYS.profile, userProfile.value)
  $q.notify({
    type: 'info',
    message: isEnglish.value
      ? 'Premium preview enabled. No payment was made.'
      : 'Vista previa Premium activada. No se realizó ningún cobro.',
  })
}

async function saveBusinessProfile(profile) {
  const photoUrls = (profile.photoUrls || []).map((url) => url.trim()).filter(Boolean)
  if (
    photoUrls.some((url) => !isPhotoSource(url)) ||
    (profile.websiteUrl && !isHttpsUrl(profile.websiteUrl)) ||
    (profile.mapUrl?.startsWith('http') && !isHttpsUrl(profile.mapUrl))
  ) {
    $q.notify({
      type: 'negative',
      message: isEnglish.value
        ? 'Website and map links must use HTTPS, and photos must be uploaded from your device.'
        : 'Los enlaces de sitio web y mapa deben usar HTTPS, y las fotos deben subirse desde tu dispositivo.',
    })
    return
  }
  const coordinates = parseMapCoordinates(profile.mapUrl) || profile.coordinates
  if (
    coordinates &&
    (coordinates.some((coordinate) => !Number.isFinite(coordinate)) ||
      Math.abs(coordinates[0]) > 90 ||
      Math.abs(coordinates[1]) > 180)
  ) {
    $q.notify({
      type: 'negative',
      message: isEnglish.value
        ? 'Enter valid latitude and longitude.'
        : 'Escribe una latitud y longitud válidas.',
    })
    return
  }
  const businessId =
    profile.id ||
    `business-${(userProfile.value.username || 'viajero')
      .toLowerCase()
      .replace(/[^a-z0-9_-]/g, '')
      .slice(0, 40)}`
  const savedProfile = {
    ...profile,
    id: businessId,
    photoUrls,
    coordinates: coordinates || null,
    published: true,
  }
  businessProfile.value = savedProfile
  writeStorage(STORAGE_KEYS.business, savedProfile)
  savingBusiness.value = true
  try {
    await saveBusinessListing(savedProfile)
    $q.notify({
      type: 'positive',
      message: isEnglish.value ? 'Listing saved to Firestore.' : 'Ficha guardada en Firestore.',
    })
  } catch (error) {
    console.error('Firestore business profile save failed:', error)
    $q.notify({
      type: 'warning',
      message: isEnglish.value
        ? 'Saved on this device. Firestore rejected the write; check project rules and authentication.'
        : 'Guardado en este dispositivo. Firestore rechazó la escritura; revisa las reglas y la autenticación del proyecto.',
    })
  } finally {
    savingBusiness.value = false
  }
}

function replyToReview({ reviewId, message }) {
  businessReplies.value = { ...businessReplies.value, [reviewId]: message }
  writeStorage(STORAGE_KEYS.replies, businessReplies.value)
  $q.notify({
    type: 'positive',
    message: isEnglish.value
      ? 'Reply saved on this device.'
      : 'Respuesta guardada en este dispositivo.',
  })
}

function sendMessage({ username, text, timestamp }) {
  const existing = conversations.value[username] || []
  conversations.value = {
    ...conversations.value,
    [username]: [...existing, { fromMe: true, text, timestamp }],
  }
  writeStorage(STORAGE_KEYS.conversations, conversations.value)
}

function isHttpsUrl(value) {
  try {
    return new URL(value).protocol === 'https:'
  } catch {
    return false
  }
}

function parseMapCoordinates(value) {
  if (!value) return null
  const patterns = [
    /@(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)/,
    /!3d(-?\d+(?:\.\d+)?)!4d(-?\d+(?:\.\d+)?)/,
    /[?&]q=(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)/,
  ]
  for (const pattern of patterns) {
    const match = value.match(pattern)
    if (match) return [Number(match[1]), Number(match[2])]
  }
  return null
}
</script>
