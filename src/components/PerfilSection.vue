<template>
  <section class="page-section profile-page">
    <header class="page-heading">
      <span class="eyebrow">{{ isEnglish ? 'YOUR TURISGO ACCOUNT' : 'TU CUENTA TURISGO' }}</span>
      <h1>{{ isEnglish ? 'Profile' : 'Perfil' }}</h1>
      <p>
        {{
          isEnglish
            ? 'Personalize your account and how you explore.'
            : 'Personaliza tu cuenta y tu forma de explorar.'
        }}
      </p>
    </header>

    <div class="profile-card">
      <div class="profile-card__identity">
        <button
          type="button"
          class="avatar-upload"
          :aria-label="isEnglish ? 'Change profile photo' : 'Cambiar foto de perfil'"
          :disabled="uploading"
          @click="pickPhoto"
        >
          <q-avatar size="68px" class="profile-avatar"
            ><img
              v-if="draft.avatarUrl"
              :src="draft.avatarUrl"
              alt=""
              @error="avatarError = true"
            /><span v-if="!draft.avatarUrl || avatarError">{{ initials }}</span></q-avatar
          >
          <span class="avatar-upload__badge"
            ><q-spinner v-if="uploading" size="14px" /><q-icon v-else name="photo_camera"
          /></span>
        </button>
        <input ref="fileInput" type="file" accept="image/*" hidden @change="onPhotoSelected" />
        <div>
          <strong>{{ draft.name || (isEnglish ? 'Your name' : 'Tu nombre') }}</strong
          ><small>@{{ draft.username || 'viajero' }}</small
          ><span class="profile-level"
            ><q-icon name="workspace_premium" /> {{ isEnglish ? 'Explorer' : 'Explorador' }}</span
          >
        </div>
      </div>
      <div class="profile-form">
        <q-input
          v-model="draft.name"
          outlined
          rounded
          :label="isEnglish ? 'Full name' : 'Nombre completo'"
        />
        <q-input
          v-model="draft.username"
          outlined
          rounded
          prefix="@"
          :label="isEnglish ? 'Username' : 'Nombre de usuario'"
        />
        <div class="photo-actions">
          <q-btn
            outline
            rounded
            no-caps
            color="primary"
            icon="photo_camera"
            :loading="uploading"
            :label="
              draft.avatarUrl
                ? isEnglish
                  ? 'Change photo'
                  : 'Cambiar foto'
                : isEnglish
                  ? 'Upload profile photo'
                  : 'Subir foto de perfil'
            "
            @click="pickPhoto"
          />
          <q-btn
            v-if="draft.avatarUrl"
            flat
            rounded
            no-caps
            color="negative"
            icon="delete_outline"
            :label="isEnglish ? 'Remove' : 'Quitar'"
            :disable="uploading"
            @click="removePhoto"
          />
        </div>
        <q-btn
          unelevated
          rounded
          color="primary"
          icon="save"
          :label="isEnglish ? 'Save profile' : 'Guardar perfil'"
          @click="save"
        />
      </div>
    </div>

    <div class="profile-card">
      <div class="section-heading section-heading--compact">
        <div>
          <span class="eyebrow">{{ isEnglish ? 'ACCOUNT TYPE' : 'TIPO DE CUENTA' }}</span>
          <h2>{{ isEnglish ? 'Choose your experience' : 'Elige tu experiencia' }}</h2>
        </div>
      </div>
      <q-btn-toggle
        v-model="draft.mode"
        spread
        no-caps
        rounded
        unelevated
        toggle-color="primary"
        color="grey-2"
        text-color="dark"
        :options="modeOptions"
        @update:model-value="save"
      />
      <p class="subtle-note">
        {{
          draft.mode === 'business'
            ? isEnglish
              ? 'Business tools let you publish a place after activating Premium.'
              : 'Las herramientas empresariales te permiten publicar un lugar al activar Premium.'
            : isEnglish
              ? 'Explore destinations, save favorites, and plan your trips.'
              : 'Explora destinos, guarda favoritos y planea tus viajes.'
        }}
      </p>
    </div>

    <div class="profile-actions">
      <button
        v-for="action in actions"
        :key="action.key"
        class="profile-action"
        @click="$emit('navigate', action.key)"
      >
        <span class="profile-action__icon"><q-icon :name="action.icon" /></span>
        <span
          ><strong>{{ isEnglish ? action.en : action.es }}</strong
          ><small>{{ isEnglish ? action.enHint : action.esHint }}</small></span
        >
        <q-icon name="chevron_right" />
      </button>
      <button class="profile-action" @click="$emit('open-settings')">
        <span class="profile-action__icon"><q-icon name="palette" /></span
        ><span
          ><strong>{{ isEnglish ? 'Appearance' : 'Apariencia' }}</strong
          ><small>{{
            isEnglish ? 'Theme, colors, and typeface' : 'Tema, colores y tipografía'
          }}</small></span
        ><q-icon name="chevron_right" />
      </button>
      <button
        v-if="draft.mode === 'business'"
        class="profile-action"
        @click="$emit('navigate', 'business')"
      >
        <span class="profile-action__icon"><q-icon name="storefront" /></span
        ><span
          ><strong>{{ isEnglish ? 'Business profile' : 'Perfil empresarial' }}</strong
          ><small>{{
            isEnglish ? 'Plan, listings, and updates' : 'Plan, fichas y actualizaciones'
          }}</small></span
        ><q-icon name="chevron_right" />
      </button>
    </div>

    <div class="profile-local-note">
      <q-icon name="security" />
      {{
        isEnglish
          ? 'This prototype stores personal settings on this device, and your photo is saved with your profile. Account sign-in is not connected yet.'
          : 'Este prototipo guarda tus preferencias en este dispositivo y tu foto se guarda con tu perfil. El inicio de sesión aún no está conectado.'
      }}
    </div>
  </section>
</template>

<script setup>
import { computed, reactive, ref, watch } from 'vue'
import { useQuasar } from 'quasar'
import { imageToDataUrl, photoErrorMessage } from '../services/imageUtils'

const props = defineProps({
  isEnglish: Boolean,
  userProfile: { type: Object, required: true },
})
const emit = defineEmits(['save-profile', 'navigate', 'open-settings'])

const $q = useQuasar()
const draft = reactive({ ...props.userProfile })
const avatarError = ref(false)
const uploading = ref(false)
const fileInput = ref(null)
watch(
  () => props.userProfile,
  (value) => Object.assign(draft, value),
  { deep: true },
)
watch(
  () => draft.avatarUrl,
  () => {
    avatarError.value = false
  },
)

const initials = computed(() =>
  (draft.name || 'T')
    .split(' ')
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase(),
)
const modeOptions = computed(() => [
  { label: props.isEnglish ? 'Personal' : 'Personal', value: 'personal', icon: 'person' },
  { label: props.isEnglish ? 'Business' : 'Empresa', value: 'business', icon: 'storefront' },
])
const actions = [
  {
    key: 'map',
    icon: 'map',
    es: 'Mapa de destinos',
    en: 'Destination map',
    esHint: 'Mapas dentro de la app',
    enHint: 'Maps inside the app',
  },
  {
    key: 'budget',
    icon: 'account_balance_wallet',
    es: 'Presupuesto',
    en: 'Trip budget',
    esHint: 'Calcula tus gastos',
    enHint: 'Estimate your costs',
  },
  {
    key: 'messages',
    icon: 'chat_bubble_outline',
    es: 'Mensajes',
    en: 'Messages',
    esHint: 'Busca viajeros por usuario',
    enHint: 'Find travelers by username',
  },
]

function pickPhoto() {
  fileInput.value?.click()
}

async function onPhotoSelected(event) {
  const file = event.target.files?.[0]
  event.target.value = ''
  if (!file) return
  uploading.value = true
  try {
    draft.avatarUrl = await imageToDataUrl(file, { maxSide: 320, maxChars: 60000, square: true })
    save()
  } catch (error) {
    $q.notify({ type: 'negative', message: photoErrorMessage(error, props.isEnglish) })
  } finally {
    uploading.value = false
  }
}

function removePhoto() {
  draft.avatarUrl = ''
  save()
}

function save() {
  const profile = { ...draft, username: draft.username.replace(/^@+/, '').trim() }
  emit('save-profile', profile)
}
</script>
