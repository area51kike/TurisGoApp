<template>
  <div
    class="app-shell"
    :class="`theme-${preferences.theme}`"
    :style="appAppearanceStyle"
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
        <button class="topbar-account" @click="navigateTo('account')">
          <q-icon name="person" /><span>{{ isEnglish ? 'Account' : 'Cuenta' }}</span>
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
        :is-authenticated="isAuthenticated"
        @save-profile="saveProfile"
        @navigate="navigateTo"
        @open-settings="openSettings"
      />

      <CuentaSection
        v-else-if="currentScreen === 'account'"
        :is-english="isEnglish"
        :loading="accountLoading"
        :error-message="accountError"
        :is-authenticated="isAuthenticated"
        :user-profile="userProfile"
        @login="login"
        @register="register"
        @logout="logout"
      />

      <ExplorarSection
        v-else-if="currentScreen === 'map'"
        :is-english="isEnglish"
        :places="visiblePlaces"
        :selected-map-place="selectedMapPlace"
        :route-request="routeRequest"
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
        :current-user="userProfile"
        :is-authenticated="isAuthenticated"
        @send-message="sendMessage"
        @open-account="navigateTo('account')"
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
      :is-authenticated="isAuthenticated"
      :checking-visit="checkingVisit"
      :reviews="selectedReviews"
      @toggle-save="toggleSaved"
      @open-directions="openDirections"
      @add-to-budget="addPlaceToBudget"
      @verify-visit="verifyVisit"
      @submit-review="submitReview"
      @request-account="navigateTo('account')"
    />

    <q-dialog v-model="settingsOpen" persistent>
      <q-card class="settings-dialog" :style="appAppearanceStyle">
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
          v-for="theme in allThemeOptions"
            :key="theme.value"
            :class="[
              'theme-choice',
              { selected: settingsDraft.theme === theme.value },
            ]"
            @click="settingsDraft.theme = theme.value"
          >
            <span class="theme-choice__swatches"><i v-for="color in theme.colors" :key="color" :style="{ backgroundColor: color }"></i></span
            ><span>{{ isEnglish ? theme.en : theme.es }}</span
            ><q-icon v-if="settingsDraft.theme === theme.value" name="check_circle" />
          </button>
          <div class="settings-dialog__actions">
            <q-btn flat rounded :label="isEnglish ? 'Cancel colors' : 'Cancelar colores'" @click="settingsDraft = { ...settingsDraft, theme: preferences.theme, customColors: preferences.customColors }" />
            <q-btn unelevated rounded color="primary" icon="save" :label="isEnglish ? 'Save colors' : 'Guardar colores'" @click="saveThemeSettings" />
          </div>
          <q-btn outline rounded no-caps icon="add" :label="isEnglish ? 'Add a three-color palette' : 'Agregar paleta de tres colores'" @click="openCustomThemeEditor" />
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
          <q-btn outline rounded no-caps icon="add" :label="isEnglish ? 'Add a typeface' : 'Agregar una tipografía'" @click="openCustomFontEditor" />
          <div class="settings-dialog__actions">
            <q-btn flat rounded :label="isEnglish ? 'Cancel font' : 'Cancelar fuente'" @click="settingsDraft = { ...settingsDraft, font: preferences.font }" />
            <q-btn unelevated rounded color="primary" icon="save" :label="isEnglish ? 'Save font' : 'Guardar fuente'" @click="saveFontSettings" />
          </div>
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

    <q-dialog v-model="customThemeEditorOpen" persistent>
      <q-card class="settings-dialog settings-editor-dialog" :style="appAppearanceStyle">
        <div class="settings-dialog__top">
          <div><span class="eyebrow">{{ isEnglish ? 'CUSTOM COLORS' : 'COLORES PERSONALIZADOS' }}</span><h2>{{ isEnglish ? 'Create a palette' : 'Crear paleta' }}</h2></div>
          <q-btn flat round icon="close" :aria-label="isEnglish ? 'Close' : 'Cerrar'" @click="cancelCustomTheme" />
        </div>
        <q-input v-model="newThemeDraft.name" outlined rounded maxlength="24" :label="isEnglish ? 'Palette name' : 'Nombre de la paleta'" />
        <label v-for="field in paletteFields" :key="field.key" class="palette-field"><span>{{ isEnglish ? field.en : field.es }}</span><input v-model="newThemeDraft[field.key]" type="color" /></label>
        <div class="palette-preview" :style="{ background: newThemeDraft.background, color: newThemeDraft.highlight, '--preview-accent': newThemeDraft.accent }"><strong>{{ isEnglish ? 'Palette preview' : 'Vista previa de la paleta' }}</strong><span>{{ isEnglish ? 'Primary color' : 'Color principal' }}</span><i /></div>
        <div class="settings-dialog__actions"><q-btn flat rounded :label="isEnglish ? 'Cancel' : 'Cancelar'" @click="cancelCustomTheme" /><q-btn unelevated rounded color="primary" icon="save" :label="isEnglish ? 'Save palette' : 'Guardar paleta'" @click="saveCustomTheme" /></div>
      </q-card>
    </q-dialog>

    <q-dialog v-model="customFontEditorOpen" persistent>
      <q-card class="settings-dialog settings-editor-dialog" :style="appAppearanceStyle">
        <div class="settings-dialog__top">
          <div><span class="eyebrow">{{ isEnglish ? 'CUSTOM TYPEFACE' : 'TIPOGRAFÍA PERSONALIZADA' }}</span><h2>{{ isEnglish ? 'Add a typeface' : 'Agregar tipografía' }}</h2></div>
          <q-btn flat round icon="close" :aria-label="isEnglish ? 'Close' : 'Cerrar'" @click="cancelCustomFont" />
        </div>
        <q-select
          v-model="customFontDraft.catalogId"
          outlined
          rounded
          use-input
          input-debounce="0"
          :options="fontCatalog"
          option-label="name"
          option-value="id"
          emit-value
          map-options
          :label="isEnglish ? 'Search and choose a typeface' : 'Busca y elige una tipografía'"
          :hint="isEnglish ? 'Type to filter the catalog' : 'Escribe para filtrar el catálogo'"
          @update:model-value="selectCatalogFont"
        >
          <template #option="scope">
            <q-item v-bind="scope.itemProps">
              <q-item-section>
                <q-item-label :style="{ fontFamily: scope.opt.family }">{{ scope.opt.name }}</q-item-label>
                <q-item-label caption :style="{ fontFamily: scope.opt.family }">Aa Bb Cc Ññ 123</q-item-label>
              </q-item-section>
            </q-item>
          </template>
        </q-select>
        <div class="font-live-preview" :style="{ fontFamily: customFontPreviewFamily }"><small>{{ isEnglish ? 'PREVIEW' : 'VISTA PREVIA' }}</small><strong>Aa Bb Cc Ññ 123</strong><span>{{ isEnglish ? 'A quick look at this typeface.' : 'Así se vería esta tipografía.' }}</span></div>
        <div class="settings-dialog__actions"><q-btn flat rounded :label="isEnglish ? 'Cancel' : 'Cancelar'" @click="cancelCustomFont" /><q-btn unelevated rounded color="primary" icon="save" :label="isEnglish ? 'Save typeface' : 'Guardar fuente'" @click="saveCustomFont" /></div>
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
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useQuasar } from 'quasar'
import { places as catalogPlaces } from '../data/places'
import InicioSection from '../components/InicioSection.vue'
import BuscarSection from '../components/BuscarSection.vue'
import GuardadosSection from '../components/GuardadosSection.vue'
import PerfilSection from '../components/PerfilSection.vue'
import ExplorarSection from '../components/ExplorarSection.vue'
import PresupuestoSection from '../components/PresupuestoSection.vue'
import MensajesSection from '../components/MensajesSection.vue'
import EmpresaSection from '../components/EmpresaSection.vue'
import PlaceDetailDialog from '../components/PlaceDetailDialog.vue'
import CuentaSection from '../components/CuentaSection.vue'
import {
  loadBusinessListings,
  saveBusinessListing,
} from '../services/businessRepository'
import { isPhotoSource } from '../services/imageUtils'
import {
  loadAccountProfile,
  loginAccount,
  logoutAccount,
  registerAccount,
  sendChatMessage,
  saveBusinessReply,
  savePlaceReview,
  updateAccountProfile,
  watchAuthentication,
  watchBusinessReplies,
  watchPlaceReviews,
  watchTravelers,
} from '../services/accountRepository'

const $q = useQuasar()
const STORAGE_KEYS = {
  tutorial: 'turisgo.tutorial.completed',
  preferences: 'turisgo.preferences.v2',
  profile: 'turisgo.profile',
  themes: 'turisgo.custom-themes',
  fonts: 'turisgo.custom-fonts',
  saved: 'turisgo.saved-places',
  budget: 'turisgo.budget',
  budgetPlaces: 'turisgo.budget-places',
  visits: 'turisgo.verified-visits',
  reviews: 'turisgo.reviews',
  language: 'turisgo.language',
  business: 'turisgo.business-profile',
  premium: 'turisgo.premium-preview',
  replies: 'turisgo.business-replies',
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
const customThemes = ref(readStorage(STORAGE_KEYS.themes, []))
const customFonts = ref(readStorage(STORAGE_KEYS.fonts, []))
const userProfile = ref(
  readStorage(STORAGE_KEYS.profile, {
    name: 'Viajero TURISGO',
    username: 'viajero',
    avatarUrl: '',
    mode: 'personal',
  }),
)
const savedIds = ref(readStorage(STORAGE_KEYS.saved, []))
const budgetPlaceIds = ref(readStorage(STORAGE_KEYS.budgetPlaces, []))
const budgetCosts = ref(budgetPlaceIds.value.length ? readStorage(STORAGE_KEYS.budget, { food: 0, lodging: 0, extras: 0 }) : { food: 0, lodging: 0, extras: 0 })
const visitProofs = ref(readStorage(STORAGE_KEYS.visits, {}))
const userReviews = ref(readStorage(STORAGE_KEYS.reviews, {}))
const cloudPlaceReviews = ref({})
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
const isEnglish = ref(readStorage(STORAGE_KEYS.language, false))
const showTutorial = ref(!readStorage(STORAGE_KEYS.tutorial, false))
const currentTutorialStep = ref(0)
const currentScreen = ref('home')
const selectedNav = ref('home')
const searchQuery = ref('')
const searchFilter = ref('all')
const selectedMapPlace = ref(catalogPlaces[0])
const routeRequest = ref(0)
const selectedPlace = ref(null)
const detailOpen = ref(false)
const settingsOpen = ref(false)
const settingsDraft = ref({ ...preferencesDefaults })
const customThemeEditorOpen = ref(false)
const newThemeDraft = ref({ name: '', background: '#08243a', accent: '#1688e8', highlight: '#f2b84b' })
const customFontEditorOpen = ref(false)
const customFontDraft = ref({ name: '', family: '' })
const paletteFields = [
  { key: 'background', es: 'Fondo', en: 'Background' },
  { key: 'accent', es: 'Color principal', en: 'Accent color' },
  { key: 'highlight', es: 'Color destacado', en: 'Highlight color' },
]
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
  { key: 'map', icon: 'map', es: 'Mapa', en: 'Map' },
  { key: 'home', icon: 'home', es: 'Inicio', en: 'Home' },
  { key: 'search', icon: 'search', es: 'Buscar', en: 'Search' },
  { key: 'saved', icon: 'favorite', es: 'Guardados', en: 'Saved' },
  { key: 'profile', icon: 'person', es: 'Perfil', en: 'Profile' },
]
const themeOptions = [
  { value: 'turisgo', es: 'TurisGo', en: 'TurisGo', colors: ['#031b2e', '#0091e0', '#fbc056'] },
  { value: 'light', es: 'Claro', en: 'Light', colors: ['#f2f8fc', '#0091e0', '#e65a7f'] },
  { value: 'sunset', es: 'Atardecer', en: 'Sunset', colors: ['#04223a', '#fb5d2e', '#fbc056'] },
]
const builtInFontOptions = [
  {
    value: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    es: 'Sistema',
    en: 'System',
    sample: 'Aa',
  },
  { value: 'Georgia, "Times New Roman", serif', es: 'Georgia', en: 'Georgia', sample: 'Aa' },
  { value: 'Arial, Helvetica, sans-serif', es: 'Arial', en: 'Arial', sample: 'Aa' },
]
const fontCatalog = [
  'Roboto', 'Open Sans', 'Lato', 'Montserrat', 'Poppins', 'Nunito', 'Raleway', 'Oswald',
  'Merriweather', 'Playfair Display', 'Source Sans 3', 'Roboto Slab', 'Ubuntu', 'Rubik',
  'Inter', 'Work Sans', 'Nunito Sans', 'DM Sans', 'PT Sans', 'PT Serif', 'Libre Baskerville',
  'Caveat', 'Dancing Script', 'Lobster', 'Quicksand', 'Comfortaa', 'Karla', 'Bebas Neue',
].map((name) => ({
  id: name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
  name,
  googleName: name,
  family: `"${name}", sans-serif`,
}))

const allThemeOptions = computed(() => [...themeOptions, ...customThemes.value])
const fontOptions = computed(() => [...builtInFontOptions, ...customFonts.value])
const customFontPreviewFamily = computed(() => customFontDraft.value.family || 'sans-serif')
const appAppearanceStyle = computed(() => {
  const selected = allThemeOptions.value.find((theme) => theme.value === preferences.value.theme)
  const colors = selected?.colors || preferences.value.customColors
  const rgb = colors?.[0]?.match(/[\da-f]{2}/gi)?.slice(0, 3).map((part) => parseInt(part, 16))
  const lightBackground = rgb?.length === 3 && (0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2]) > 150
  return {
    fontFamily: preferences.value.font,
    ...(colors ? { colorScheme: lightBackground ? 'light' : 'dark' } : {}),
    ...(colors ? {
      '--app-bg': colors[0],
      '--surface': `color-mix(in srgb, ${colors[0]} ${lightBackground ? '94%' : '84%'}, ${lightBackground ? 'black' : 'white'})`,
      '--surface-raised': `color-mix(in srgb, ${colors[0]} ${lightBackground ? '88%' : '72%'}, ${lightBackground ? 'black' : 'white'})`,
      '--surface-soft': `color-mix(in srgb, ${colors[0]} ${lightBackground ? '80%' : '60%'}, ${lightBackground ? 'black' : 'white'})`,
      '--text-primary': lightBackground ? '#102538' : '#f4f9fd',
      '--text-muted': lightBackground ? '#52697a' : '#a9c4d9',
      '--accent': colors[1],
      '--accent-strong': colors[1],
      '--q-primary': colors[1],
      '--gold': colors[2],
      '--c-gold': colors[2],
      '--line': `color-mix(in srgb, ${colors[1]} 35%, transparent)`,
    } : {}),
  }
})

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
    coordinates: normalizeCoordinates(profile.coordinates),
    mapQuery: normalizeCoordinates(profile.coordinates)
      ? normalizeCoordinates(profile.coordinates).join(',')
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
  return [...(cloudPlaceReviews.value[selectedPlace.value.id] || []), ...submitted, ...base]
})
const isVisitVerified = computed(() =>
  Boolean(selectedPlace.value && visitProofs.value[selectedPlace.value.id]),
)
const businessReviews = computed(
  () =>
    [...(cloudPlaceReviews.value[businessProfile.value.id || `business-${userProfile.value.username}`] || []), ...(userReviews.value[businessProfile.value.id || `business-${userProfile.value.username}`] || [])],
)
const businessUpdateDue = computed(() => isListingUpdateDue(businessProfile.value))
const totalBudget = computed(() => {
  const travel = budgetPlaceIds.value.reduce((sum, id) => {
    const place = visiblePlaces.value.find((item) => item.id === id)
    return sum + Number(place?.travelEstimate || 0) + Number(place?.admissionEstimate || 0)
  }, 0)
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
const isAuthenticated = ref(false)
const accountLoading = ref(false)
const accountError = ref('')
const people = ref([])
let stopPeopleWatch
let stopAuthWatch
let stopReviewWatch
let stopBusinessReplyWatch
let stopBusinessReviewWatch

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

watch(selectedPlace, (place) => {
  stopReviewWatch?.()
  if (!place?.id) return
  stopReviewWatch = watchPlaceReviews(place.id, (reviews) => {
    cloudPlaceReviews.value = { ...cloudPlaceReviews.value, [place.id]: reviews }
  }, (error) => console.warn('Could not load place reviews:', error))
})

onMounted(async () => {
  const selectedCatalogFont = fontCatalog.find((font) => font.family === preferences.value.font)
  if (selectedCatalogFont) ensureCatalogFontLoaded(selectedCatalogFont)
  stopAuthWatch = watchAuthentication(async (user) => {
    stopPeopleWatch?.()
    stopPeopleWatch = undefined
    stopBusinessReplyWatch?.()
    stopBusinessReplyWatch = undefined
    stopBusinessReviewWatch?.()
    stopBusinessReviewWatch = undefined
    isAuthenticated.value = Boolean(user)
    if (!user) {
      people.value = []
      userProfile.value = { ...userProfile.value, uid: '', email: '' }
      return
    }
    try {
      const profile = await loadAccountProfile(user.uid)
      if (profile) {
        userProfile.value = { ...userProfile.value, ...profile }
        writeStorage(STORAGE_KEYS.profile, userProfile.value)
        stopPeopleWatch = watchTravelers(user.uid, (travelers) => {
          people.value = travelers
        }, (error) => console.warn('Could not load travelers:', error))
        startBusinessReplyWatch()
        startBusinessReviewWatch()
      }
    } catch (error) {
      accountError.value = accountErrorText(error)
    }
  })
  try {
    cloudBusinessListings.value = await loadBusinessListings()
  } catch (error) {
    console.warn('Could not load public business listings from Firestore:', error)
  }
})

onBeforeUnmount(() => {
  stopAuthWatch?.()
  stopPeopleWatch?.()
  stopReviewWatch?.()
  stopBusinessReplyWatch?.()
  stopBusinessReviewWatch?.()
})

function navigateTo(screen) {
  if (screen === 'messages' && !isAuthenticated.value) {
    accountError.value = ''
    screen = 'account'
  }
  if (screen === 'business' && !isAuthenticated.value) screen = 'account'
  else if (screen === 'business' && userProfile.value.mode !== 'business') screen = 'profile'
  currentScreen.value = screen
  selectedNav.value = ['home', 'search', 'map', 'saved', 'profile'].includes(screen)
    ? screen
    : 'profile'
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
function openDirections(place) {
  selectedMapPlace.value = place
  detailOpen.value = false
  navigateTo('map')
  routeRequest.value += 1
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
  if (!ids.length) {
    budgetCosts.value = { food: 0, lodging: 0, extras: 0 }
    writeStorage(STORAGE_KEYS.budget, budgetCosts.value)
  }
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
  let nextProfile = { ...profile, avatarUrl: photoUrl || '' }
  avatarLoadFailed.value = false
  if (isAuthenticated.value) {
    try {
      nextProfile = await updateAccountProfile(nextProfile)
    } catch (error) {
      $q.notify({ type: 'negative', message: accountErrorText(error) })
      return
    }
  }
  userProfile.value = nextProfile
  writeStorage(STORAGE_KEYS.profile, userProfile.value)
  $q.notify({ type: 'positive', message: isEnglish.value ? 'Profile saved.' : 'Perfil guardado.' })
}

function openSettings() {
  settingsDraft.value = { ...preferences.value }
  customThemeEditorOpen.value = false
  customFontEditorOpen.value = false
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

function saveThemeSettings() {
  preferences.value = { ...preferences.value, theme: settingsDraft.value.theme }
  writeStorage(STORAGE_KEYS.preferences, preferences.value)
  $q.notify({ type: 'positive', message: isEnglish.value ? 'Colors saved.' : 'Colores guardados.' })
}

function saveFontSettings() {
  preferences.value = { ...preferences.value, font: settingsDraft.value.font }
  writeStorage(STORAGE_KEYS.preferences, preferences.value)
  $q.notify({ type: 'positive', message: isEnglish.value ? 'Typeface saved.' : 'Tipografía guardada.' })
}

function cancelCustomTheme() {
  customThemeEditorOpen.value = false
  newThemeDraft.value = { name: '', background: '#08243a', accent: '#1688e8', highlight: '#f2b84b' }
}

function openCustomThemeEditor() {
  newThemeDraft.value = { name: '', background: '#08243a', accent: '#1688e8', highlight: '#f2b84b' }
  customThemeEditorOpen.value = true
}

function saveCustomTheme() {
  const name = newThemeDraft.value.name.trim()
  if (!name) {
    $q.notify({ type: 'warning', message: isEnglish.value ? 'Name your palette first.' : 'Escribe un nombre para la paleta.' })
    return
  }
  const theme = {
    value: `custom-${Date.now()}`,
    es: name,
    en: name,
    colors: [newThemeDraft.value.background, newThemeDraft.value.accent, newThemeDraft.value.highlight],
  }
  customThemes.value = [...customThemes.value, theme]
  writeStorage(STORAGE_KEYS.themes, customThemes.value)
  settingsDraft.value = { ...settingsDraft.value, theme: theme.value }
  preferences.value = { ...preferences.value, theme: theme.value }
  writeStorage(STORAGE_KEYS.preferences, preferences.value)
  cancelCustomTheme()
  $q.notify({ type: 'positive', message: isEnglish.value ? 'Palette saved and applied.' : 'Paleta guardada y aplicada.' })
}

function openCustomFontEditor() {
  customFontDraft.value = { catalogId: '', name: '', family: '' }
  customFontEditorOpen.value = true
}

function cancelCustomFont() {
  customFontEditorOpen.value = false
  customFontDraft.value = { catalogId: '', name: '', family: '' }
}

function selectCatalogFont(fontId) {
  const font = fontCatalog.find((item) => item.id === fontId)
  if (!font) return
  customFontDraft.value = { catalogId: font.id, name: font.name, family: font.family }
  ensureCatalogFontLoaded(font)
}

function ensureCatalogFontLoaded(font) {
  const linkId = `turisgo-google-font-${font.id}`
  if (!document.getElementById(linkId)) {
    const link = document.createElement('link')
    link.id = linkId
    link.rel = 'stylesheet'
    link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(font.googleName).replace(/%20/g, '+')}:wght@400;500;700&display=swap`
    document.head.appendChild(link)
  }
}

function saveCustomFont() {
  const name = customFontDraft.value.name.trim()
  const family = customFontDraft.value.family
  if (!name || !family) {
    $q.notify({ type: 'warning', message: isEnglish.value ? 'Search the catalog and choose a typeface first.' : 'Busca y selecciona una tipografía del catálogo.' })
    return
  }
  const font = { name, es: name, en: name, value: family, sample: 'Aa Bb Ññ 123' }
  const withoutDuplicate = customFonts.value.filter((item) => item.name.toLowerCase() !== name.toLowerCase())
  customFonts.value = [...withoutDuplicate, font]
  writeStorage(STORAGE_KEYS.fonts, customFonts.value)
  settingsDraft.value = { ...settingsDraft.value, font: family }
  preferences.value = { ...preferences.value, font: family }
  writeStorage(STORAGE_KEYS.preferences, preferences.value)
  cancelCustomFont()
  $q.notify({ type: 'positive', message: isEnglish.value ? 'Typeface saved and applied.' : 'Tipografía guardada y aplicada.' })
}

function accountErrorText(error) {
  const code = error?.code || error?.message
  const messages = {
    'auth/email-already-in-use': 'Ese correo ya está registrado. Inicia sesión.',
    'auth/invalid-credential': 'Correo o contraseña incorrectos.',
    'auth/weak-password': 'La contraseña debe tener al menos 6 caracteres.',
    'auth/invalid-email': 'Escribe un correo válido.',
    'auth/unauthorized-domain': 'Firebase bloqueó este dominio. En Authentication > Settings > Authorized domains agrega 127.0.0.1 (y localhost para desarrollo).',
    'auth/operation-not-allowed': 'Activa el proveedor Correo electrónico/Contraseña en Firebase Authentication > Sign-in method.',
    'auth/configuration-not-found': 'La configuración de Firebase Authentication no está completa. Verifica que Authentication esté habilitado en el proyecto.',
    'auth/invalid-api-key': 'La clave de Firebase no es válida. Revisa la configuración del proyecto en src/boot/firebase.js.',
    'auth/network-request-failed': 'No se pudo conectar con Firebase. Revisa la conexión a internet y vuelve a intentarlo.',
    'auth/too-many-requests': 'Firebase bloqueó temporalmente los intentos. Espera un momento e inténtalo de nuevo.',
    'permission-denied': 'Firebase rechazó el guardado del perfil. Publica las reglas actualizadas de Firestore en el proyecto.',
    'firestore/permission-denied': 'Firebase rechazó el guardado del perfil. Publica las reglas actualizadas de Firestore en el proyecto.',
    'username-already-used': 'Ese nombre de usuario ya está ocupado.',
    'username-invalid': 'El usuario debe tener entre 3 y 24 caracteres válidos.',
    'profile-not-found': 'No encontramos el perfil para esta cuenta.',
    'account-details-required': 'Completa el nombre, teléfono, tipo de cuenta y nombre de empresa si aplica.',
    'auth-required': 'Inicia sesión para continuar.',
  }
  return messages[code] || (isEnglish.value ? `Could not complete the account action${code ? ` (Firebase: ${code})` : ''}. Check Firebase Authentication and Firestore rules.` : `No se pudo completar la acción${code ? ` (Firebase: ${code})` : ''}. Revisa Firebase Authentication y las reglas de Firestore.`)
}

async function register(form) {
  accountLoading.value = true
  accountError.value = ''
  try {
    const profile = await registerAccount(form)
    userProfile.value = { ...userProfile.value, ...profile }
    writeStorage(STORAGE_KEYS.profile, userProfile.value)
    navigateTo('profile')
    $q.notify({ type: 'positive', message: isEnglish.value ? 'Account created.' : 'Cuenta creada.' })
  } catch (error) {
    accountError.value = accountErrorText(error)
  } finally {
    accountLoading.value = false
  }
}

async function login(credentials) {
  accountLoading.value = true
  accountError.value = ''
  try {
    const profile = await loginAccount(credentials.email, credentials.password)
    userProfile.value = { ...userProfile.value, ...profile }
    writeStorage(STORAGE_KEYS.profile, userProfile.value)
    navigateTo('profile')
  } catch (error) {
    accountError.value = accountErrorText(error)
  } finally {
    accountLoading.value = false
  }
}

async function logout() {
  await logoutAccount()
  navigateTo('home')
  $q.notify({ type: 'positive', message: isEnglish.value ? 'Signed out.' : 'Sesión cerrada.' })
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
  const placeCoordinates = normalizeCoordinates(place.coordinates)
  if (!placeCoordinates) {
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
        placeCoordinates,
      )
      const accuracy = Math.max(0, position.coords.accuracy || 0)
      if (accuracy > 10000) {
        $q.notify({ type: 'warning', message: isEnglish.value ? 'Your device location is too imprecise. Turn on precise location and try again.' : 'La ubicación del dispositivo es muy imprecisa. Activa la ubicación precisa e inténtalo de nuevo.' })
        return
      }
      const allowedDistance = Math.max(2500, accuracy * 1.25)
      if (distance > allowedDistance) {
        $q.notify({
          type: 'warning',
          message: isEnglish.value
            ? `You are about ${(distance / 1000).toFixed(1)} km away. Reviews unlock within about ${(allowedDistance / 1000).toFixed(1)} km based on GPS accuracy.`
            : `Estás a unos ${(distance / 1000).toFixed(1)} km. El límite actual es ${(allowedDistance / 1000).toFixed(1)} km según la precisión del GPS.`,
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
    { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 },
  )
}

function normalizeCoordinates(value) {
  if (!Array.isArray(value) || value.length !== 2) return null
  let [latitude, longitude] = value.map(Number)
  if (Math.abs(latitude) > 90 && Math.abs(longitude) <= 90) [latitude, longitude] = [longitude, latitude]
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude) || Math.abs(latitude) > 90 || Math.abs(longitude) > 180) return null
  return [latitude, longitude]
}

async function submitReview(review) {
  if (!isAuthenticated.value) {
    navigateTo('account')
    return
  }
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
  try {
    await savePlaceReview(selectedPlace.value.id, entry)
  } catch (error) {
    $q.notify({ type: 'negative', message: accountErrorText(error) })
    return
  }
  $q.notify({
    type: 'positive',
    message: isEnglish.value ? 'Review published.' : 'Reseña publicada.',
  })
}

function activatePremiumPreview() {
  if (!isAuthenticated.value || userProfile.value.mode !== 'business') {
    navigateTo(isAuthenticated.value ? 'profile' : 'account')
    $q.notify({ type: 'info', message: isEnglish.value ? 'Sign in with a business account to open these tools.' : 'Inicia sesión con una cuenta empresarial para usar estas herramientas.' })
    return
  }
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
  const coordinates = normalizeCoordinates(parseMapCoordinates(profile.mapUrl) || profile.coordinates)
  if (!coordinates || coordinates.some((coordinate) => !Number.isFinite(coordinate))) {
    $q.notify({
      type: 'negative',
      message: isEnglish.value
        ? 'Add a valid Google Maps link with coordinates or enter valid latitude and longitude.'
        : 'Añade un enlace de Google Maps con coordenadas o escribe una latitud y longitud válidas.',
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
    ownerUid: userProfile.value.uid,
  }
  businessProfile.value = savedProfile
  writeStorage(STORAGE_KEYS.business, savedProfile)
  savingBusiness.value = true
  try {
    const persistedProfile = await saveBusinessListing(savedProfile)
    businessProfile.value = { ...savedProfile, ...persistedProfile }
    writeStorage(STORAGE_KEYS.business, businessProfile.value)
    startBusinessReplyWatch()
    startBusinessReviewWatch()
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

function startBusinessReplyWatch() {
  stopBusinessReplyWatch?.()
  const businessId = businessProfile.value.id || `business-${(userProfile.value.username || '').toLowerCase().replace(/[^a-z0-9_-]/g, '').slice(0, 40)}`
  if (!isAuthenticated.value || !businessId) return
  stopBusinessReplyWatch = watchBusinessReplies(businessId, (replies) => {
    businessReplies.value = { ...businessReplies.value, ...replies }
    writeStorage(STORAGE_KEYS.replies, businessReplies.value)
  }, (error) => console.warn('Could not load business replies:', error))
}

function startBusinessReviewWatch() {
  stopBusinessReviewWatch?.()
  const businessId = businessProfile.value.id
  if (!isAuthenticated.value || !businessId) return
  stopBusinessReviewWatch = watchPlaceReviews(businessId, (reviews) => {
    cloudPlaceReviews.value = { ...cloudPlaceReviews.value, [businessId]: reviews }
  }, (error) => console.warn('Could not load business reviews:', error))
}

async function replyToReview({ reviewId, message }) {
  businessReplies.value = { ...businessReplies.value, [reviewId]: message }
  writeStorage(STORAGE_KEYS.replies, businessReplies.value)
  if (isAuthenticated.value && businessProfile.value.id) {
    try {
      await saveBusinessReply(businessProfile.value.id, String(reviewId), message)
    } catch (error) {
      $q.notify({ type: 'negative', message: accountErrorText(error) })
      return
    }
  }
  $q.notify({
    type: 'positive',
    message: isEnglish.value
      ? 'Reply saved on this device.'
      : 'Respuesta guardada en este dispositivo.',
  })
}

async function sendMessage({ uid, text }) {
  if (!isAuthenticated.value || !userProfile.value.uid) return navigateTo('account')
  try {
    await sendChatMessage(userProfile.value.uid, uid, text)
  } catch (error) {
    $q.notify({ type: 'negative', message: accountErrorText(error) })
  }
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
