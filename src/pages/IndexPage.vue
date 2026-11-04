<template>
  <q-layout view="lHh Lpr lFf" :style="appStyle">
    <!-- TUTORIAL OBLIGATORIO -->
    <q-dialog
      v-model="showTutorial"
      persistent
      maximized
      transition-show="scale"
      transition-hide="scale"
    >
      <q-card class="column items-center justify-center bg-dark text-white q-pa-xl text-center">
        <q-icon name="explore" size="64px" color="amber" class="q-mb-md" />
        <h3 class="text-weight-bold q-my-none">{{ tutorialSteps[currentTutorialStep].title }}</h3>
        <p class="text-subtitle1 q-my-md" style="max-width: 400px">
          {{ tutorialSteps[currentTutorialStep].desc }}
        </p>
        <q-btn
          color="amber"
          text-color="dark"
          class="q-mt-lg px-xl text-weight-bold"
          :label="getTutorialButtonLabel"
          @click="nextTutorialStep"
        />
      </q-card>
    </q-dialog>

    <q-page-container>
      <q-page class="q-pa-md flex flex-center">
        <div id="app-container" :class="['q-card', currentTheme]">
          <!-- HEADER / HERO -->
          <div class="hero relative-position">
            <div class="row justify-between items-center q-px-md q-pt-md">
              <div
                class="row items-center q-gutter-x-sm cursor-pointer"
                @click="currentTab = 'profile'"
              >
                <q-avatar size="40px" class="border-white">
                  <img :src="userProfile.avatar" alt="Avatar" />
                </q-avatar>
                <div class="text-white text-weight-bold shadow-text">{{ userProfile.name }}</div>
              </div>

              <div class="row q-gutter-x-sm">
                <q-btn flat dense round icon="translate" color="white" @click="toggleLanguage" />
                <q-btn flat dense round icon="palette" color="white" @click="openSettings = true" />
              </div>
            </div>

            <div class="text-center q-mt-sm">
              <div class="logo text-italic text-weight-bold">TURISGO</div>
              <small>{{
                isEnglish ? 'Hotels & Tourism in El Salvador' : 'Hoteles y Turismo en El Salvador'
              }}</small>
            </div>
          </div>

          <!-- PANELES COMPONENTIZADOS (MANTIENE TODO DENTRO DEL MARCO) -->
          <div class="scroll-area">
            <q-tab-panels v-model="currentTab" animated class="bg-transparent">
              <q-tab-panel name="home" class="q-pa-none">
                <InicioSection
                  :is-english="isEnglish"
                  v-model:search-query="searchQuery"
                  :filtered-places="filteredPlaces"
                  @select-place="selectPlace"
                />
              </q-tab-panel>

              <q-tab-panel name="explore" class="q-pa-none">
                <ExplorarSection
                  :is-english="isEnglish"
                  :places="places"
                  v-model:selected-map-place="selectedMapPlace"
                  :default-map-url="defaultMapUrl"
                />
              </q-tab-panel>

              <q-tab-panel name="budget" class="q-pa-none">
                <PresupuestoSection
                  :is-english="isEnglish"
                  :budget-costs="budgetCosts"
                  :total-budget="totalBudget"
                />
              </q-tab-panel>

              <q-tab-panel name="profile" class="q-pa-none">
                <PerfilSection
                  :is-english="isEnglish"
                  :user-profile="userProfile"
                  @save-profile="saveProfile"
                />
              </q-tab-panel>
            </q-tab-panels>
          </div>

          <!-- NAVEGACIÓN INFERIOR -->
          <q-tabs
            v-model="currentTab"
            dense
            class="bg-white text-grey-7 shadow-2 fixed-bottom-nav"
            align="justify"
            indicator-color="transparent"
            active-color="primary"
          >
            <q-tab name="home" icon="home" :label="isEnglish ? 'Home' : 'Inicio'" />
            <q-tab name="explore" icon="map" :label="isEnglish ? 'Explore' : 'Explorar'" />
            <q-tab
              name="budget"
              icon="attach_money"
              :label="isEnglish ? 'Budget' : 'Presupuesto'"
            />
            <q-tab name="profile" icon="person" :label="isEnglish ? 'Profile' : 'Perfil'" />
          </q-tabs>
        </div>
      </q-page>
    </q-page-container>

    <!-- MODAL DETALLES DEL LUGAR -->
    <q-dialog v-model="openPlaceDetails">
      <q-card class="q-pa-md" style="width: 350px; border-radius: 16px" v-if="selectedPlaceDetails">
        <q-img :src="selectedPlaceDetails.img" height="140px" style="border-radius: 12px" />
        <div class="text-h6 text-weight-bold q-mt-md">{{ selectedPlaceDetails.name }}</div>
        <div class="text-subtitle2 text-grey q-mb-sm">
          <q-icon name="place" color="primary" /> {{ selectedPlaceDetails.loc }}
        </div>
        <q-separator class="q-my-sm" />
        <div class="row justify-between items-center q-my-sm">
          <span class="text-weight-bold text-grey-8">{{
            isEnglish ? 'Estimated Travel:' : 'Costo del viaje:'
          }}</span>
          <span class="text-h6 text-primary text-weight-bold"
            >${{ selectedPlaceDetails.travelCost }}</span
          >
        </div>
        <q-card-actions align="right" class="q-mt-md">
          <q-btn flat :label="isEnglish ? 'Close' : 'Cerrar'" color="grey" v-close-popup />
          <q-btn
            color="primary"
            :label="isEnglish ? 'Add to Budget' : 'Sumar a Presupuesto'"
            v-close-popup
            @click="addPlaceToBudget(selectedPlaceDetails)"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- MODAL DE CONFIGURACIÓN -->
    <q-dialog v-model="openSettings">
      <q-card class="q-pa-md" style="width: 300px">
        <div class="text-h6 text-weight-bold q-mb-md">
          {{ isEnglish ? 'App Customization' : 'Personalización de la App' }}
        </div>
        <div class="q-mb-md">
          <label class="text-caption text-weight-bold">{{
            isEnglish ? 'Select Theme' : 'Seleccionar Tema'
          }}</label>
          <q-select
            v-model="currentTheme"
            :options="themeOptions"
            emit-value
            map-options
            outlined
            dense
            class="q-mt-xs"
          />
        </div>
        <div class="q-mb-md">
          <label class="text-caption text-weight-bold">{{
            isEnglish ? 'Select Font' : 'Tipo de Letra'
          }}</label>
          <q-select
            v-model="selectedFont"
            :options="fontOptions"
            emit-value
            map-options
            outlined
            dense
            class="q-mt-xs"
          />
        </div>
        <q-card-actions align="right">
          <q-btn flat :label="isEnglish ? 'Close' : 'Cerrar'" color="primary" v-close-popup />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-layout>
</template>

<script>
import { ref, computed } from 'vue'
import { useQuasar } from 'quasar'

// Importaciones con ruta relativa hacia la carpeta components
import InicioSection from '../components/InicioSection.vue'
import ExplorarSection from '../components/ExplorarSection.vue'
import PresupuestoSection from '../components/PresupuestoSection.vue'
import PerfilSection from '../components/PerfilSection.vue'

export default {
  name: 'IndexPage',
  components: {
    InicioSection,
    ExplorarSection,
    PresupuestoSection,
    PerfilSection,
  },
  setup() {
    const $q = useQuasar()

    const showTutorial = ref(true)
    const currentTutorialStep = ref(0)
    const isEnglish = ref(false)
    const currentTab = ref('home')
    const searchQuery = ref('')
    const openSettings = ref(false)

    const currentTheme = ref('theme-default')
    const selectedFont = ref('Inter, sans-serif')
    const themeOptions = [
      { label: 'Predeterminado (El Salvador)', value: 'theme-default' },
      { label: 'Oscuro / Dark', value: 'theme-dark' },
      { label: 'Cálido / Sunset', value: 'theme-sunset' },
    ]
    const fontOptions = [
      { label: 'Inter (Moderna)', value: 'Inter, sans-serif' },
      { label: 'Georgia (Elegante)', value: 'Georgia, serif' },
      { label: 'Roboto', value: 'Roboto, sans-serif' },
    ]

    const userProfile = ref({
      name: 'Mago Kike',
      avatar: 'https://cdn.quasar.dev/img/avatar.png',
    })

    const saveProfile = () => {
      $q.notify({
        message: isEnglish.value ? 'Profile updated!' : '¡Perfil actualizado!',
        color: 'positive',
        icon: 'check',
      })
    }

    const tutorialSteps = [
      {
        title: '¡Bienvenido a TURISGO!',
        desc: 'Esta guía rápida te enseñará cómo usar la app paso a paso. No podrás avanzar hasta completarla.',
      },
      {
        title: 'Presupuestos y Costos',
        desc: 'En cada lugar recomendado verás cuánto cuesta viajar exactamente hasta ese destino.',
      },
      {
        title: 'Personalización y Mapa',
        desc: 'Puedes cambiar los colores, el tipo de letra y usar el mapa integrado en tiempo real.',
      },
    ]

    const nextTutorialStep = () => {
      if (currentTutorialStep.value < tutorialSteps.length - 1) {
        currentTutorialStep.value++
      } else {
        showTutorial.value = false
      }
    }

    const getTutorialButtonLabel = computed(() => {
      const isLast = currentTutorialStep.value === tutorialSteps.length - 1
      if (isEnglish.value) {
        return isLast ? 'Start Exploring!' : 'Next'
      } else {
        return isLast ? '¡Comenzar a Explorar!' : 'Siguiente'
      }
    })

    const toggleLanguage = () => {
      isEnglish.value = !isEnglish.value
    }

    const defaultMapUrl =
      'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3875.456!2d-89.2182!3d13.6929!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMTPCsDQxJzM0LjQiTiA4OcKwMTMnMDUuNSJX!5e0!3m2!1ses!2ssv!4v1650000000000!5m2!1ses!2ssv'

    const places = ref([
      {
        id: 1,
        name: 'Hotel Tazumal',
        loc: 'Chalchuapa',
        travelCost: 15,
        img: 'https://cdn.quasar.dev/img/parallax1.jpg',
        fav: false,
        mapUrl:
          'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3870.089!2d-89.6811!3d13.9872!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x8f62e67df1ed9e3b%3A0x7d2e0719114b7e9a!2sTazumal!5e0!3m2!1ses!2ssv!4v1650000000000!5m2!1ses!2ssv',
      },
      {
        id: 2,
        name: 'Volcán de San Salvador',
        loc: 'Boquerón',
        travelCost: 25,
        img: 'https://cdn.quasar.dev/img/parallax2.jpg',
        fav: true,
        mapUrl:
          'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3875.210!2d-89.2888!3d13.7348!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x8f632fd1a2cf9311%3A0x28bc3a502c38865c!2sEl%20Boquer%C3%B3n!5e0!3m2!1ses!2ssv!4v1650000000000!5m2!1ses!2ssv',
      },
    ])

    const selectedMapPlace = ref(places.value[0])

    const filteredPlaces = computed(() => {
      if (!searchQuery.value) return places.value
      return places.value.filter(
        (p) =>
          p.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
          p.loc.toLowerCase().includes(searchQuery.value.toLowerCase()),
      )
    })

    const openPlaceDetails = ref(false)
    const selectedPlaceDetails = ref(null)

    const selectPlace = (place) => {
      selectedPlaceDetails.value = place
      openPlaceDetails.value = true
    }

    const budgetCosts = ref({
      transport: 15,
      food: 20,
      lodging: 35,
      extras: 10,
    })

    const totalBudget = computed(() => {
      return (
        (budgetCosts.value.transport || 0) +
        (budgetCosts.value.food || 0) +
        (budgetCosts.value.lodging || 0) +
        (budgetCosts.value.extras || 0)
      )
    })

    const addPlaceToBudget = (place) => {
      budgetCosts.value.transport = place.travelCost
      currentTab.value = 'budget'
      $q.notify({
        message: isEnglish.value
          ? `Added ${place.name} cost to budget!`
          : `¡Costo de ${place.name} cargado al presupuesto!`,
        color: 'positive',
        icon: 'attach_money',
      })
    }

    const appStyle = computed(() => ({
      fontFamily: selectedFont.value,
    }))

    return {
      showTutorial,
      currentTutorialStep,
      tutorialSteps,
      nextTutorialStep,
      getTutorialButtonLabel,
      isEnglish,
      toggleLanguage,
      currentTab,
      searchQuery,
      openSettings,
      currentTheme,
      themeOptions,
      selectedFont,
      fontOptions,
      userProfile,
      saveProfile,
      places,
      filteredPlaces,
      defaultMapUrl,
      selectedMapPlace,
      openPlaceDetails,
      selectedPlaceDetails,
      selectPlace,
      budgetCosts,
      totalBudget,
      addPlaceToBudget,
      appStyle,
    }
  },
}
</script>

<style scoped>
#app-container {
  max-width: 480px;
  width: 100%;
  height: 88vh;
  border-radius: 24px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  position: relative;
  background: var(--q-page-bg, #f7f5f0);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
}

.hero {
  height: 140px;
  background: linear-gradient(135deg, #102a43, #174b5b);
  color: white;
  flex-shrink: 0;
}

.logo {
  font-size: 28px;
  letter-spacing: 2px;
}

.scroll-area {
  flex-grow: 1;
  overflow-y: auto;
  padding-bottom: 60px;
}

.fixed-bottom-nav {
  position: absolute;
  bottom: 0;
  width: 100%;
  z-index: 10;
}

/* Temas personalizados */
.theme-default {
  --q-primary: #174b5b;
}
.theme-dark {
  background: #101b18 !important;
  color: #edf2ed;
}
.theme-sunset {
  --q-primary: #b88a48;
}
</style>
