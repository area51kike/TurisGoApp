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
          class="topbar-language"
          :aria-label="isEnglish ? 'Cambiar idioma a español' : 'Switch language to English'"
          @click="toggleLanguage"
        >{{ isEnglish ? 'ES' : 'EN' }}</button>
        <button
          class="topbar-account"
          :aria-label="isEnglish ? 'Open account' : 'Abrir cuenta'"
          @click="navigateTo('account')"
        >
          <span class="topbar-account__photo">
            <img v-if="isAuthenticated && userProfile.avatarUrl && !avatarLoadFailed" :src="userProfile.avatarUrl" alt="" @error="avatarLoadFailed = true" />
            <span v-else-if="isAuthenticated">{{ profileInitials }}</span>
            <q-icon v-else name="person_outline" />
          </span>
          <span class="topbar-account__label">
            <template v-if="isAuthenticated"><strong>{{ userProfile.name || userProfile.username }}</strong><small>@{{ userProfile.username }}</small></template>
            <strong v-else>{{ isEnglish ? 'Account' : 'Cuenta' }}</strong>
          </span>
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

      <CuentaSection
        v-else-if="currentScreen === 'account'"
        :is-english="isEnglish"
        :loading="accountLoading"
        :error-message="accountError"
        :is-authenticated="isAuthenticated"
        :user-profile="userProfile"
        :show-photo-step="showProfilePhotoStep"
        :has-business-profile="Boolean(businessProfile.name)"
        :businesses="ownedBusinessProfiles"
        @login="login"
        @register="register"
        @logout="logout"
        @switch-account="switchAccount"
        @open-settings="openSettings"
        @open-business="openBusinessProfile"
        @add-business="addBusinessProfile"
        @edit-business="editBusinessProfile"
        @update-profile="updateAccountDetails"
        @complete-photo="completeProfilePhoto"
        @skip-photo="skipProfilePhoto"
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
            <span class="eyebrow">{{ customFontEditorOpen ? (isEnglish ? 'CUSTOM TYPEFACE' : 'TIPOGRAFÍA PERSONALIZADA') : (isEnglish ? 'MAKE IT YOURS' : 'A TU MANERA') }}</span>
            <h2>{{ customFontEditorOpen ? (isEnglish ? 'Add a typeface' : 'Agregar tipografía') : (isEnglish ? 'Appearance' : 'Personalización') }}</h2>
          </div>
          <q-btn v-if="customFontEditorOpen" flat round icon="arrow_back" :aria-label="isEnglish ? 'Back' : 'Volver'" @click="cancelCustomFont" />
          <q-btn
            flat
            round
            icon="close"
            :aria-label="isEnglish ? 'Close' : 'Cerrar'"
            @click="settingsOpen = false"
          />
        </div>
        <p v-if="!customFontEditorOpen" class="settings-dialog__intro">
          {{
            isEnglish
              ? 'Choose a theme or typeface to apply it. New typefaces apply when saved.'
              : 'Elige un tema o una tipografía para aplicarlos. Las fuentes nuevas se aplican al guardarlas.'
          }}
        </p>

        <div v-if="!customFontEditorOpen" class="settings-choice-group">
          <div class="settings-label">{{ isEnglish ? 'COLOR THEME' : 'TEMA DE COLOR' }}</div>
          <div
          v-for="theme in allThemeOptions"
            :key="theme.value"
            class="appearance-choice-row"
          >
            <button
              :class="['theme-choice', { selected: settingsDraft.theme === theme.value }]"
              @click="selectTheme(theme.value)"
            >
              <span class="theme-choice__swatches"><i v-for="color in theme.colors" :key="color" :style="{ backgroundColor: color }"></i></span>
              <span>{{ isEnglish ? theme.en : theme.es }}</span>
              <q-icon v-if="settingsDraft.theme === theme.value" name="check_circle" />
            </button>
            <q-btn
              v-if="theme.value.startsWith('custom-')"
              flat round dense icon="delete" class="appearance-choice-delete"
              :disable="allThemeOptions.length <= 1"
              :aria-label="isEnglish ? `Delete ${theme.en} palette` : `Eliminar paleta ${theme.es}`"
              @click="deleteCustomTheme(theme.value)"
            />
          </div>
          <q-btn outline rounded no-caps icon="add" :label="isEnglish ? 'Add a three-color palette' : 'Agregar paleta de tres colores'" @click="openCustomThemeEditor" />
        </div>

        <template v-if="!customFontEditorOpen">
        <div v-for="role in fontRoles" :key="role.key" class="settings-choice-group">
          <div class="settings-label">{{ isEnglish ? role.en : role.es }}</div>
          <div class="font-role-options">
            <div v-for="font in fontOptions" :key="`${role.key}-${font.value}`" class="appearance-choice-row">
              <button
                :class="['font-choice', { selected: settingsDraft.fonts[role.key] === font.value }]"
                @click="selectFont(role.key, font.value)"
              >
                <span :style="{ fontFamily: font.value }">{{ role.sample }}</span>
                <strong>{{ isEnglish ? font.en : font.es }}</strong>
                <q-icon v-if="settingsDraft.fonts[role.key] === font.value" name="check_circle" />
              </button>
              <q-btn v-if="font.name" flat round dense icon="delete" class="appearance-choice-delete"
                :disable="fontOptions.length <= 1"
                :aria-label="isEnglish ? `Delete ${font.en} typeface` : `Eliminar fuente ${font.es}`"
                @click="deleteCustomFont(font.value)" />
            </div>
          </div>
          <q-btn outline rounded no-caps icon="add" :label="isEnglish ? 'Add a typeface' : 'Agregar una tipografía'" @click="openCustomFontEditor(role.key)" />
        </div>
        </template>

        <div v-if="customFontEditorOpen" class="settings-editor-inline">
          <q-input
            v-model="fontCatalogSearch"
            outlined
            rounded
            clearable
            :label="isEnglish ? 'Search typefaces' : 'Buscar tipografías'"
            :hint="isEnglish ? 'Choose by name and preview' : 'Elige por nombre y mira la muestra'"
          />
          <div class="font-catalog-list" role="listbox" :aria-label="isEnglish ? 'Available typefaces' : 'Tipografías disponibles'">
            <button
              v-for="font in filteredFontCatalog"
              :key="font.id"
              type="button"
              role="option"
              :aria-selected="customFontDraft.catalogId === font.id"
              :class="['font-catalog-option', { selected: customFontDraft.catalogId === font.id }]"
              @click="selectCatalogFont(font.id)"
            >
              <strong>{{ font.name }}</strong>
              <span :style="{ fontFamily: font.family }">Aa Bb Cc Ññ 123</span>
            </button>
            <p v-if="!filteredFontCatalog.length" class="font-catalog-empty">
              {{ isEnglish ? 'No typefaces match your search.' : 'No hay tipografías con ese nombre.' }}
            </p>
          </div>
          <div class="font-live-preview" :style="{ fontFamily: customFontPreviewFamily }"><small>{{ isEnglish ? 'PREVIEW' : 'VISTA PREVIA' }}</small><strong>Aa Bb Cc Ññ 123</strong><span>{{ isEnglish ? 'A quick look at this typeface.' : 'Así se vería esta tipografía.' }}</span></div>
          <div class="settings-dialog__actions"><q-btn flat rounded :label="isEnglish ? 'Cancel' : 'Cancelar'" @click="cancelCustomFont" /><q-btn unelevated rounded color="primary" icon="save" :label="isEnglish ? 'Save typeface' : 'Guardar fuente'" @click="saveCustomFont" /></div>
        </div>

      </q-card>
    </q-dialog>

    <q-dialog v-model="customThemeEditorOpen" persistent>
      <q-card class="settings-dialog settings-editor-dialog" :style="appAppearanceStyle">
        <div class="settings-dialog__top">
          <div><span class="eyebrow">{{ isEnglish ? 'CUSTOM COLORS' : 'COLORES PERSONALIZADOS' }}</span><h2>{{ isEnglish ? 'Create a palette' : 'Crear paleta' }}</h2></div>
          <q-btn flat round icon="close" :aria-label="isEnglish ? 'Close' : 'Cerrar'" @click="cancelCustomTheme" />
        </div>
        <q-input v-model="newThemeDraft.name" outlined rounded maxlength="24" :label="isEnglish ? 'Palette name (optional)' : 'Nombre de la paleta (opcional)'" :hint="isEnglish ? 'A name is created automatically if left blank.' : 'Si lo dejas vacío, se asigna un nombre automáticamente.'" />
        <label v-for="field in paletteFields" :key="field.key" class="palette-field"><span>{{ isEnglish ? field.en : field.es }}</span><input v-model="newThemeDraft[field.key]" type="color" /></label>
        <div class="palette-preview" :style="{ background: newThemeDraft.background, color: newThemeDraft.highlight, '--preview-accent': newThemeDraft.accent }"><strong>{{ isEnglish ? 'Palette preview' : 'Vista previa de la paleta' }}</strong><span>{{ isEnglish ? 'Primary color' : 'Color principal' }}</span><i /></div>
        <div class="settings-dialog__actions"><q-btn flat rounded :label="isEnglish ? 'Cancel' : 'Cancelar'" @click="cancelCustomTheme" /><q-btn unelevated rounded color="primary" icon="save" :label="isEnglish ? 'Save palette' : 'Guardar paleta'" @click="saveCustomTheme" /></div>
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
  startUserPresence,
  updateAccountProfile,
  watchAuthentication,
  watchIncomingMessages,
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
const removedCatalogFontNames = new Set([
  'roboto', 'open sans', 'nunito', 'oswald', 'merriweather', 'playfair display', 'source sans 3',
  'roboto slab', 'ubuntu', 'rubik', 'inter', 'work sans', 'nunito sans', 'dm sans', 'pt sans',
  'pt serif', 'libre baskerville', 'caveat', 'dancing script', 'lobster', 'quicksand', 'comfortaa',
  'karla',
])

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
    fonts: {
      title: '"Playfair Display", Georgia, serif',
      subtitle: '"DM Sans", system-ui, sans-serif',
      description: '"DM Sans", system-ui, sans-serif',
    },
  }),
)
if (!preferences.value.fonts) {
  const legacyFont = preferences.value.font || '"DM Sans", system-ui, sans-serif'
  preferences.value = { ...preferences.value, fonts: { title: legacyFont, subtitle: legacyFont, description: legacyFont } }
  writeStorage(STORAGE_KEYS.preferences, preferences.value)
}
const preferencesDefaults = { ...preferences.value }
const customThemes = ref(readStorage(STORAGE_KEYS.themes, []))
const storedCustomFonts = readStorage(STORAGE_KEYS.fonts, [])
const customFonts = ref(storedCustomFonts.filter((font) => !removedCatalogFontNames.has(font.name?.toLowerCase())))
if (customFonts.value.length !== storedCustomFonts.length) writeStorage(STORAGE_KEYS.fonts, customFonts.value)
const userProfile = ref(
  readStorage(STORAGE_KEYS.profile, {
    name: '',
    username: '',
    avatarUrl: '',
    mode: '',
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
const fontCatalogSearch = ref('')
const paletteFields = [
  { key: 'background', es: 'Fondo', en: 'Background' },
  { key: 'accent', es: 'Color principal', en: 'Accent color' },
  { key: 'highlight', es: 'Color destacado', en: 'Highlight color' },
]
const fontRoles = [
  { key: 'title', es: 'Títulos', en: 'Titles', sample: 'Aa' },
  { key: 'subtitle', es: 'Subtítulos', en: 'Subtitles', sample: 'Aa Bb' },
  { key: 'description', es: 'Descripciones', en: 'Descriptions', sample: 'Aa Bb Cc' },
]
const customFontRole = ref('title')
const checkingVisit = ref(false)
const savingBusiness = ref(false)
const avatarLoadFailed = ref(false)
const showProfilePhotoStep = ref(false)

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
  { key: 'messages', icon: 'chat', es: 'Chat', en: 'Chat' },
  { key: 'account', icon: 'person', es: 'Cuenta', en: 'Account' },
]
const themeOptions = [
  { value: 'turisgo', es: 'TurisGo', en: 'TurisGo', colors: ['#031b2e', '#0091e0', '#fbc056'] },
  { value: 'light', es: 'Claro', en: 'Light', colors: ['#f2f8fc', '#0091e0', '#e65a7f'] },
  { value: 'sunset', es: 'Atardecer', en: 'Sunset', colors: ['#04223a', '#fb5d2e', '#fbc056'] },
]
const builtInFontOptions = [
  { value: '"Playfair Display", Georgia, serif', es: 'Playfair Display', en: 'Playfair Display', sample: 'Aa' },
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
  { id: 'montserrat-alternates', name: 'Montserrat Alternates', family: '"Montserrat Alternates", sans-serif' },
  { id: 'lato', name: 'Lato', family: '"Lato", sans-serif' },
  { id: 'raleway', name: 'Raleway', family: '"Raleway", sans-serif' },
  { id: 'bebas-neue', name: 'Bebas Neue', family: '"Bebas Neue", sans-serif' },
  { id: 'montserrat', name: 'Montserrat', family: '"Montserrat", sans-serif' },
  { id: 'poppins', name: 'Poppins', family: '"Poppins", sans-serif' },
  { id:'cocogoose', name: 'Cocogoose', family: '"Cocogoose", sans-serif'},
]
const oldSelectedFont = storedCustomFonts.find((font) => removedCatalogFontNames.has(font.name?.toLowerCase()))
if (oldSelectedFont && Object.values(preferences.value.fonts).some((family) => family === oldSelectedFont.value)) {
  const fonts = Object.fromEntries(Object.entries(preferences.value.fonts).map(([role, family]) => [role, family === oldSelectedFont.value ? '"DM Sans", system-ui, sans-serif' : family]))
  preferences.value = { ...preferences.value, fonts }
  writeStorage(STORAGE_KEYS.preferences, preferences.value)
}

const allThemeOptions = computed(() => [...themeOptions, ...customThemes.value])
const fontOptions = computed(() => [...builtInFontOptions, ...customFonts.value])
const filteredFontCatalog = computed(() => {
  const query = fontCatalogSearch.value.trim().toLocaleLowerCase()
  return fontCatalog.filter((font) => font.name.toLocaleLowerCase().includes(query))
})
const customFontPreviewFamily = computed(() => customFontDraft.value.family || 'sans-serif')
const appAppearanceStyle = computed(() => {
  const selected = allThemeOptions.value.find((theme) => theme.value === preferences.value.theme)
  const colors = selected?.colors || preferences.value.customColors
  const rgb = colors?.[0]?.match(/[\da-f]{2}/gi)?.slice(0, 3).map((part) => parseInt(part, 16))
  const lightBackground = rgb?.length === 3 && (0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2]) > 150
  return {
    '--font-title': preferences.value.fonts.title,
    '--font-subtitle': preferences.value.fonts.subtitle,
    '--font-description': preferences.value.fonts.description,
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
const ownedBusinessProfiles = computed(() => {
  if (!isAuthenticated.value) return []
  const ownerUid = userProfile.value.uid
  const usernameId = `business-${(userProfile.value.username || '').toLowerCase().replace(/[^a-z0-9_-]/g, '').slice(0, 40)}`
  const owned = new Map()
  for (const profile of cloudBusinessListings.value) {
    if (profile.ownerUid === ownerUid || (!profile.ownerUid && profile.id === usernameId)) {
      owned.set(profile.id, profile)
    }
  }
  if (businessProfile.value.id && (businessProfile.value.ownerUid === ownerUid || businessProfile.value.id === usernameId)) {
    owned.set(businessProfile.value.id, businessProfile.value)
  }
  return [...owned.values()].sort((a, b) => (a.name || '').localeCompare(b.name || ''))
})
const accountLoading = ref(false)
const accountError = ref('')
const people = ref([])
let stopPeopleWatch
let stopIncomingMessageWatch
let stopAuthWatch
let stopPresence
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
  stopAuthWatch = watchAuthentication(async (user) => {
    stopPresence?.()
    stopPresence = undefined
    stopPeopleWatch?.()
    stopPeopleWatch = undefined
    stopIncomingMessageWatch?.()
    stopIncomingMessageWatch = undefined
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
        stopPresence = startUserPresence(user.uid, profile.username)
        stopPeopleWatch = watchTravelers(user.uid, (travelers) => {
          people.value = travelers
        }, (error) => console.warn('Could not load travelers:', error))
        stopIncomingMessageWatch = watchIncomingMessages(user.uid, notifyIncomingMessage, (error) => {
          console.warn('Could not watch incoming messages:', error)
        })
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
  void stopPresence?.()
  stopPeopleWatch?.()
  stopIncomingMessageWatch?.()
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
  else if (screen === 'business' && userProfile.value.mode !== 'business') screen = 'account'
  currentScreen.value = screen
  if (screen === 'messages' && typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission().catch(() => {})
  }
  selectedNav.value = ['home', 'search', 'map', 'saved', 'messages', 'account'].includes(screen)
    ? screen
    : 'account'
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
    return false
  }
  let nextProfile = { ...profile, avatarUrl: photoUrl || '' }
  avatarLoadFailed.value = false
  if (isAuthenticated.value) {
    try {
      nextProfile = await updateAccountProfile(nextProfile)
    } catch (error) {
      accountError.value = accountErrorText(error)
      $q.notify({ type: 'negative', message: accountError.value })
      return false
    }
  }
  userProfile.value = nextProfile
  writeStorage(STORAGE_KEYS.profile, userProfile.value)
  $q.notify({ type: 'positive', message: isEnglish.value ? 'Profile saved.' : 'Perfil guardado.' })
  return true
}

async function updateAccountDetails(profile) {
  accountLoading.value = true
  accountError.value = ''
  try {
    await saveProfile(profile)
  } catch (error) {
    accountError.value = accountErrorText(error)
  } finally {
    accountLoading.value = false
  }
}

async function completeProfilePhoto(avatarUrl) {
  accountLoading.value = true
  accountError.value = ''
  try {
    if (await saveProfile({ ...userProfile.value, avatarUrl })) {
      showProfilePhotoStep.value = false
      navigateTo('account')
    }
  } catch (error) {
    accountError.value = accountErrorText(error)
  } finally {
    accountLoading.value = false
  }
}

function skipProfilePhoto() {
  showProfilePhotoStep.value = false
  navigateTo('account')
}

function openSettings() {
  settingsDraft.value = { ...preferences.value }
  customThemeEditorOpen.value = false
  customFontEditorOpen.value = false
  settingsOpen.value = true
}

function selectTheme(theme) {
  settingsDraft.value = { ...settingsDraft.value, theme }
  preferences.value = { ...preferences.value, theme }
  writeStorage(STORAGE_KEYS.preferences, preferences.value)
}

function selectFont(role, font) {
  const fonts = { ...settingsDraft.value.fonts, [role]: font }
  settingsDraft.value = { ...settingsDraft.value, fonts }
  preferences.value = { ...preferences.value, fonts }
  writeStorage(STORAGE_KEYS.preferences, preferences.value)
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
  const name = newThemeDraft.value.name.trim() || `${isEnglish.value ? 'Palette' : 'Paleta'} ${customThemes.value.length + 1}`
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

function deleteCustomTheme(themeId) {
  if (allThemeOptions.value.length <= 1) return
  customThemes.value = customThemes.value.filter((theme) => theme.value !== themeId)
  writeStorage(STORAGE_KEYS.themes, customThemes.value)
  if (preferences.value.theme === themeId) {
    preferences.value = { ...preferences.value, theme: 'turisgo' }
    writeStorage(STORAGE_KEYS.preferences, preferences.value)
  }
  if (settingsDraft.value.theme === themeId) settingsDraft.value = { ...settingsDraft.value, theme: preferences.value.theme }
  $q.notify({ type: 'positive', message: isEnglish.value ? 'Palette deleted.' : 'Paleta eliminada.' })
}

function openCustomFontEditor(role = 'title') {
  customFontRole.value = role
  customFontDraft.value = { catalogId: '', name: '', family: '' }
  fontCatalogSearch.value = ''
  customFontEditorOpen.value = true
}

function cancelCustomFont() {
  customFontEditorOpen.value = false
  customFontDraft.value = { catalogId: '', name: '', family: '' }
  fontCatalogSearch.value = ''
}

function selectCatalogFont(fontId) {
  const font = fontCatalog.find((item) => item.id === fontId)
  if (!font) return
  customFontDraft.value = { catalogId: font.id, name: font.name, family: font.family }
}

function saveCustomFont() {
  const name = customFontDraft.value.name.trim()
  const family = customFontDraft.value.family
  if (!name || !family) {
    $q.notify({ type: 'warning', message: isEnglish.value ? 'Search the catalog and choose a typeface first.' : 'Busca y selecciona una tipografía del catálogo.' })
    return
  }
  const font = { name, es: name, en: name, value: family, sample: 'Aa' }
  const withoutDuplicate = customFonts.value.filter((item) => item.name.toLowerCase() !== name.toLowerCase())
  customFonts.value = [...withoutDuplicate, font]
  writeStorage(STORAGE_KEYS.fonts, customFonts.value)
  selectFont(customFontRole.value, family)
  cancelCustomFont()
  $q.notify({ type: 'positive', message: isEnglish.value ? 'Typeface saved and applied.' : 'Tipografía guardada y aplicada.' })
}

function deleteCustomFont(fontFamily) {
  if (fontOptions.value.length <= 1) return
  customFonts.value = customFonts.value.filter((font) => font.value !== fontFamily)
  writeStorage(STORAGE_KEYS.fonts, customFonts.value)
  const fallbackFont = '"DM Sans", system-ui, sans-serif'
  const fonts = Object.fromEntries(Object.entries(preferences.value.fonts).map(([role, value]) => [role, value === fontFamily ? fallbackFont : value]))
  if (Object.keys(fonts).some((role) => fonts[role] !== preferences.value.fonts[role])) {
    preferences.value = { ...preferences.value, fonts }
    writeStorage(STORAGE_KEYS.preferences, preferences.value)
  }
  settingsDraft.value = { ...settingsDraft.value, fonts: { ...preferences.value.fonts } }
  $q.notify({ type: 'positive', message: isEnglish.value ? 'Typeface deleted.' : 'Tipografía eliminada.' })
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
    'phone-invalid': 'Escribe un teléfono de El Salvador con 8 dígitos; puedes incluir +503.',
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
    isAuthenticated.value = true
    showProfilePhotoStep.value = true
    writeStorage(STORAGE_KEYS.profile, userProfile.value)
    navigateTo('account')
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
    isAuthenticated.value = true
    writeStorage(STORAGE_KEYS.profile, userProfile.value)
    navigateTo('account')
  } catch (error) {
    accountError.value = accountErrorText(error)
  } finally {
    accountLoading.value = false
  }
}

async function logout() {
  await stopPresence?.()
  stopPresence = undefined
  await logoutAccount()
  isAuthenticated.value = false
  showProfilePhotoStep.value = false
  navigateTo('home')
  $q.notify({ type: 'positive', message: isEnglish.value ? 'Signed out.' : 'Sesión cerrada.' })
}

async function switchAccount() {
  await stopPresence?.()
  stopPresence = undefined
  await logoutAccount()
  isAuthenticated.value = false
  showProfilePhotoStep.value = false
  accountError.value = ''
  userProfile.value = {
    uid: '',
    name: '',
    username: '',
    mode: '',
    businessName: '',
    phone: '',
    email: '',
    avatarUrl: '',
  }
  writeStorage(STORAGE_KEYS.profile, userProfile.value)
  navigateTo('account')
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

function getBestLocationFix() {
  return new Promise((resolve, reject) => {
    const geolocation = navigator.geolocation
    let watchId = null
    let bestPosition = null
    let settled = false
    const finish = (callback, value) => {
      if (settled) return
      settled = true
      window.clearTimeout(timer)
      if (watchId !== null) geolocation.clearWatch(watchId)
      callback(value)
    }
    const timer = window.setTimeout(() => {
      if (bestPosition) finish(resolve, bestPosition)
      else finish(reject, { code: 2 })
    }, 20000)

    try {
      watchId = geolocation.watchPosition(
        (position) => {
          if (!bestPosition || position.coords.accuracy < bestPosition.coords.accuracy) {
            bestPosition = position
          }
          // Keep collecting for up to 20 seconds unless GPS reaches a good fix.
          if (position.coords.accuracy <= 1000) finish(resolve, position)
        },
        (error) => {
          if (error.code === 1) finish(reject, error)
          else if (bestPosition) finish(resolve, bestPosition)
        },
        { enableHighAccuracy: true, timeout: 25000, maximumAge: 0 },
      )
    } catch (error) {
      finish(reject, error)
    }
  })
}

async function verifyVisit(place) {
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
  $q.dialog({
    title: isEnglish.value ? 'Allow location to verify your visit' : 'Permitir ubicación para validar la visita',
    message: isEnglish.value
      ? 'TURISGO will ask your browser for your location once to check that you are near this place. Your location is not added to your review.'
      : 'TURISGO pedirá permiso al navegador para comprobar una sola vez que estás cerca de este lugar. Tu ubicación no se agrega a la reseña.',
    cancel: { label: isEnglish.value ? 'Not now' : 'Ahora no', flat: true },
    ok: { label: isEnglish.value ? 'Continue' : 'Continuar', color: 'primary' },
    persistent: true,
  }).onOk(() => locateAndVerifyVisit(place, placeCoordinates))
}

async function locateAndVerifyVisit(place, placeCoordinates) {
  checkingVisit.value = true
  try {
    const position = await getBestLocationFix()
    const distance = haversineMeters(
      [position.coords.latitude, position.coords.longitude],
      placeCoordinates,
    )
    const accuracy = Math.max(0, position.coords.accuracy || 0)
    // Keep a local radius for inaccurate fixes; only expand it when the
    // device provides a reasonably precise GPS reading.
    const allowedDistance = accuracy > 10000 ? 2500 : Math.max(2500, accuracy * 1.25)
    if (distance > allowedDistance) {
      if (accuracy > 10000) {
        $q.notify({ type: 'warning', message: isEnglish.value ? 'Your device location is too imprecise to confirm this visit from here. Turn on precise location and try again.' : 'La ubicación del dispositivo es muy imprecisa para confirmar la visita desde aquí. Activa la ubicación precisa e inténtalo de nuevo.' })
        return
      }
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
  } catch (error) {
    const message =
      error.code === 1
        ? isEnglish.value
          ? 'Location permission is blocked. Open this site’s browser settings, allow Location, and try again.'
          : 'El permiso de ubicación está bloqueado. Abre los permisos de este sitio en el navegador, habilita Ubicación e inténtalo de nuevo.'
        : isEnglish.value
          ? 'Could not read your location. Try again outdoors.'
          : 'No pudimos obtener tu ubicación. Inténtalo de nuevo al aire libre.'
    $q.notify({ type: 'warning', message })
  } finally {
    checkingVisit.value = false
  }
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
    navigateTo('account')
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

async function openBusinessProfile() {
  if (!isAuthenticated.value) {
    navigateTo('account')
    return
  }
  if (userProfile.value.mode !== 'business') {
    accountLoading.value = true
    accountError.value = ''
    try {
      const updatedProfile = await updateAccountProfile({
        ...userProfile.value,
        mode: 'business',
        businessName: userProfile.value.businessName || '',
      })
      userProfile.value = { ...userProfile.value, ...updatedProfile, mode: 'business' }
      writeStorage(STORAGE_KEYS.profile, userProfile.value)
    } catch (error) {
      accountError.value = accountErrorText(error)
      $q.notify({ type: 'negative', message: accountError.value })
      return
    } finally {
      accountLoading.value = false
    }
  }
  navigateTo('business')
}

function addBusinessProfile() {
  businessProfile.value = {
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
  }
  writeStorage(STORAGE_KEYS.business, businessProfile.value)
  navigateTo('business')
}

function editBusinessProfile(profile) {
  businessProfile.value = { ...profile }
  writeStorage(STORAGE_KEYS.business, businessProfile.value)
  startBusinessReplyWatch()
  startBusinessReviewWatch()
  navigateTo('business')
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
    `business-${(userProfile.value.uid || userProfile.value.username || 'viajero').toLowerCase().replace(/[^a-z0-9_-]/g, '').slice(0, 32)}-${Date.now().toString(36)}`
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
    cloudBusinessListings.value = [
      ...cloudBusinessListings.value.filter((item) => item.id !== businessId),
      businessProfile.value,
    ]
    startBusinessReplyWatch()
    startBusinessReviewWatch()
    $q.notify({
      type: 'positive',
      message: isEnglish.value ? 'Listing saved to Firestore.' : 'Ficha guardada en Firestore.',
    })
  } catch (error) {
    console.error('Business listing save failed:', error)
    const errorCode = error?.code || error?.message
    const errorMessage = businessSaveErrorMessage(errorCode, isEnglish.value)
    $q.notify({
      type: 'negative',
      message: errorMessage,
    })
  } finally {
    savingBusiness.value = false
  }
}

function businessSaveErrorMessage(code, english) {
  if (code === 'business-profile-too-large') {
    return english
      ? 'This listing is too large for Firestore. Remove a photo and try again.'
      : 'La ficha supera el límite de Firestore. Quita una foto e inténtalo de nuevo.'
  }
  if (code === 'permission-denied') {
    return english
      ? 'The listing could not be saved to Firestore. Check the database rules for this account.'
      : 'No se pudo guardar la ficha en Firestore. Revisa las reglas de la base de datos para esta cuenta.'
  }
  if (code === 'business-firestore-save-timeout') {
    return english
      ? 'Firestore did not confirm the save in time. Check the connection and try again.'
      : 'Firestore no confirmó el guardado a tiempo. Revisa la conexión e inténtalo de nuevo.'
  }
  return english
    ? 'Could not publish the listing. Check the connection and Firebase permissions, then try again.'
    : 'No se pudo publicar la ficha. Revisa la conexión y los permisos de Firebase e inténtalo de nuevo.'
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
    await sendChatMessage(userProfile.value.uid, uid, text, userProfile.value)
  } catch (error) {
    $q.notify({ type: 'negative', message: accountErrorText(error) })
  }
}

function notifyIncomingMessage(message) {
  const sender = people.value.find((person) => person.uid === message.senderUid)
  const senderName = message.senderName || sender?.name || (isEnglish.value ? 'New message' : 'Nuevo mensaje')
  const body = String(message.text || '').slice(0, 180)
  $q.notify({
    type: 'info',
    message: `${senderName}: ${body}`,
    caption: isEnglish.value ? 'New TURISGO message' : 'Nuevo mensaje de TURISGO',
    timeout: 6500,
    actions: [{
      label: isEnglish.value ? 'OPEN' : 'VER',
      color: 'white',
      handler: () => navigateTo('messages'),
    }],
  })

  if (typeof window === 'undefined' || !('Notification' in window) || Notification.permission !== 'granted') return
  if (document.visibilityState !== 'hidden') return
  const options = {
    body,
    icon: `${import.meta.env.BASE_URL}icons/favicon-128x128.png`,
    tag: `turisgo-message-${message.id}`,
  }
  try {
    const notification = new Notification(`TURISGO · ${senderName}`, options)
    notification.onclick = () => {
      window.focus()
      navigateTo('messages')
      notification.close()
    }
  } catch (error) {
    // Page notifications are unavailable in some mobile browsers.
    console.info('System notifications are unavailable in this browser:', error)
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
