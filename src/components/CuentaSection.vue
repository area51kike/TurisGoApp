<template>
  <section class="page-section account-page">
    <header class="page-heading">
      <span class="eyebrow">{{ isEnglish ? 'YOUR TURISGO ACCOUNT' : 'TU CUENTA TURISGO' }}</span>
      <h1>{{ heading }}</h1>
      <p>{{ description }}</p>
    </header>

    <input v-if="isAuthenticated" ref="photoInput" type="file" accept="image/*" hidden @change="onPhotoSelected" />

    <div v-if="isAuthenticated && showPhotoStep" class="account-card account-photo-setup">
      <q-avatar size="104px" color="primary" text-color="white" class="account-photo-setup__avatar">
        <img v-if="photoDraft || userProfile.avatarUrl" :src="photoDraft || userProfile.avatarUrl" alt="" />
        <span v-else>{{ initials }}</span>
      </q-avatar>
      <h2>{{ isEnglish ? 'Choose your profile photo' : 'Elige tu foto de perfil' }}</h2>
      <p>{{ isEnglish ? 'Add a photo so friends can recognize you. You can do this later.' : 'Agrega una foto para que tus amigos te reconozcan. Este paso es opcional.' }}</p>
      <q-btn outline rounded no-caps icon="photo_camera" :loading="photoLoading" :label="isEnglish ? 'Choose a photo' : 'Elegir foto'" @click="photoInput?.click()" />
      <p v-if="photoError" class="account-error" role="alert">{{ photoError }}</p>
      <p v-if="errorMessage" class="account-error" role="alert">{{ errorMessage }}</p>
      <div class="account-photo-setup__actions">
        <q-btn flat rounded no-caps :label="isEnglish ? 'Skip for now' : 'Omitir por ahora'" @click="$emit('skip-photo')" />
        <q-btn unelevated rounded color="primary" icon="check" :loading="photoLoading" :disable="!photoDraft" :label="isEnglish ? 'Save photo' : 'Guardar foto'" @click="$emit('complete-photo', photoDraft)" />
      </div>
    </div>

    <template v-else-if="isAuthenticated">
      <div v-if="!showPhotoStep" class="account-quick-actions">
        <q-btn outline rounded no-caps icon="palette" :label="isEnglish ? 'Appearance' : 'Apariencia'" @click="$emit('open-settings')" />
      </div>
      <div class="account-card account-card--signed">
        <q-avatar size="58px" color="primary" text-color="white">
          <img v-if="userProfile.avatarUrl" :src="userProfile.avatarUrl" alt="" />
          <span v-else>{{ initials }}</span>
        </q-avatar>
        <div class="account-card__identity"><strong>{{ userProfile.name }}</strong><span>@{{ userProfile.username }}</span><small>{{ userProfile.email }}</small></div>
        <q-btn v-if="!editingProfile" outline rounded no-caps icon="edit" :label="isEnglish ? 'Edit profile' : 'Editar perfil'" @click="editingProfile = true" />
        <q-btn flat rounded no-caps icon="swap_horiz" :label="isEnglish ? 'Switch account' : 'Cambiar cuenta'" @click="$emit('switch-account')" />
        <q-btn flat rounded color="negative" icon="logout" :label="isEnglish ? 'Sign out' : 'Cerrar sesión'" @click="$emit('logout')" />
      </div>
      <section v-if="userProfile.mode === 'business'" class="account-businesses">
        <div class="account-businesses__heading">
          <div>
            <span class="eyebrow">{{ isEnglish ? 'YOUR BUSINESSES' : 'TUS NEGOCIOS' }}</span>
            <h2>{{ isEnglish ? 'Business profiles' : 'Perfiles empresariales' }}</h2>
          </div>
          <q-btn unelevated rounded color="primary" icon="add" :label="isEnglish ? 'Add' : 'Añadir'" @click="$emit('add-business')" />
        </div>
        <article v-for="business in businesses" :key="business.id" class="account-business-item">
          <q-avatar rounded size="54px" color="primary" text-color="white">
            <img v-if="business.photoUrls?.[0]" :src="business.photoUrls[0]" alt="" />
            <q-icon v-else name="storefront" />
          </q-avatar>
          <div class="account-business-item__details">
            <strong>{{ business.name }}</strong>
            <span>{{ business.region || (isEnglish ? 'Location not set' : 'Ubicación pendiente') }}</span>
            <small>{{ business.branches?.length || 0 }} {{ isEnglish ? 'branches' : 'sucursales' }}</small>
          </div>
          <q-btn outline rounded dense no-caps icon="edit" :label="isEnglish ? 'Edit' : 'Editar'" @click="$emit('edit-business', business)" />
        </article>
        <div v-if="!businesses.length" class="account-businesses__empty">
          {{ isEnglish ? 'You have not added a business profile yet.' : 'Todavía no has añadido un perfil de negocio.' }}
        </div>
      </section>
      <div v-if="editingProfile" class="account-card account-edit-card">
        <h2>{{ isEnglish ? 'Edit your account details' : 'Editar datos de la cuenta' }}</h2>
        <div class="account-photo-edit">
          <q-avatar size="64px" color="primary" text-color="white" class="account-photo-setup__avatar">
            <img v-if="photoDraft || userProfile.avatarUrl" :src="photoDraft || userProfile.avatarUrl" alt="" />
            <span v-else>{{ initials }}</span>
          </q-avatar>
          <div class="account-photo-edit__actions">
            <q-btn outline rounded no-caps icon="photo_camera" :loading="photoLoading" :label="isEnglish ? 'Choose / change photo' : (userProfile.avatarUrl ? 'Cambiar foto' : 'Agregar foto')" @click="photoInput?.click()" />
            <q-btn v-if="photoDraft" unelevated rounded color="primary" icon="check" :loading="loading" :label="isEnglish ? 'Save photo' : 'Guardar foto'" @click="$emit('complete-photo', photoDraft)" />
          </div>
          <p v-if="photoError" class="account-error" role="alert">{{ photoError }}</p>
        </div>
        <form class="account-form" @submit.prevent="saveAccountDetails">
          <q-input v-model="accountForm.name" outlined rounded autocomplete="name" :label="isEnglish ? 'Full name *' : 'Nombre completo *'" required minlength="2" />
          <q-input v-model="accountForm.username" outlined rounded prefix="@" autocomplete="username" :label="isEnglish ? 'Unique username *' : 'Nombre de usuario único *'" required minlength="3" maxlength="24" pattern="[A-Za-z0-9._-]+" />
          <q-input v-model="accountForm.phone" outlined rounded type="tel" autocomplete="tel" placeholder="+503 7000 0000" :label="isEnglish ? 'Phone number *' : 'Número de teléfono *'" :hint="phoneHint" :error="Boolean(phoneError)" :error-message="phoneError" required @update:model-value="phoneError = ''" />
          <q-input v-if="userProfile.mode === 'business'" v-model="accountForm.businessName" outlined rounded autocomplete="organization" :label="isEnglish ? 'Business name *' : 'Nombre de la empresa *'" required />
          <p v-if="errorMessage" class="account-error" role="alert">{{ errorMessage }}</p>
          <div class="account-edit-actions">
            <q-btn flat rounded :label="isEnglish ? 'Cancel' : 'Cancelar'" @click="cancelEditProfile" />
            <q-btn unelevated rounded color="primary" icon="save" type="submit" :loading="loading" :label="isEnglish ? 'Save changes' : 'Guardar cambios'" />
          </div>
        </form>
      </div>
    </template>

    <div v-else class="account-card">
      <q-btn outline rounded no-caps icon="palette" :label="isEnglish ? 'Appearance' : 'Apariencia'" @click="$emit('open-settings')" />
      <div class="account-tabs">
        <button :class="{ active: isLogin }" @click="isLogin = true">{{ isEnglish ? 'Sign in' : 'Iniciar sesión' }}</button>
        <button :class="{ active: !isLogin }" @click="isLogin = false">{{ isEnglish ? 'Create account' : 'Crear cuenta' }}</button>
      </div>
      <form class="account-form" @submit.prevent="submit">
        <template v-if="!isLogin">
          <q-input v-model="form.name" outlined rounded autocomplete="name" :label="isEnglish ? 'Full name *' : 'Nombre completo *'" required minlength="2" />
          <q-input v-model="form.username" outlined rounded prefix="@" autocomplete="username" :label="isEnglish ? 'Unique username *' : 'Nombre de usuario único *'" :hint="isEnglish ? 'Letters, numbers, dots, underscores, or hyphens' : 'Letras, números, puntos, guiones y guiones bajos'" required minlength="3" maxlength="24" pattern="[A-Za-z0-9._-]+" />
          <q-select v-model="form.mode" outlined rounded emit-value map-options :options="modeOptions" :label="isEnglish ? 'Account type *' : 'Tipo de cuenta *'" :rules="[value => Boolean(value) || (isEnglish ? 'Choose an account type' : 'Elige el tipo de cuenta')]" required />
          <q-input v-if="form.mode === 'business'" v-model="form.businessName" outlined rounded autocomplete="organization" :label="isEnglish ? 'Business name *' : 'Nombre de la empresa *'" required />
          <q-input v-model="form.phone" outlined rounded type="tel" autocomplete="tel" placeholder="+503 7000 0000" :label="isEnglish ? 'Phone number *' : 'Número de teléfono *'" :hint="phoneHint" :error="Boolean(phoneError)" :error-message="phoneError" required @update:model-value="phoneError = ''" />
        </template>
        <q-input v-model="form.email" outlined rounded type="email" autocomplete="email" :label="isEnglish ? 'Email *' : 'Correo electrónico *'" required />
        <q-input v-model="form.password" outlined rounded :type="showPassword ? 'text' : 'password'" :autocomplete="isLogin ? 'current-password' : 'new-password'" :label="isEnglish ? 'Password *' : 'Contraseña *'" required minlength="6">
          <template #append><q-btn flat round dense :icon="showPassword ? 'visibility_off' : 'visibility'" :aria-label="isEnglish ? 'Show password' : 'Mostrar contraseña'" @click="showPassword = !showPassword" /></template>
        </q-input>
        <q-input v-if="!isLogin" v-model="form.confirmPassword" outlined rounded type="password" autocomplete="new-password" :label="isEnglish ? 'Confirm password *' : 'Confirmar contraseña *'" required minlength="6" />
        <p v-if="passwordMismatch" class="account-error" role="alert">{{ isEnglish ? 'Passwords do not match.' : 'Las contraseñas no coinciden.' }}</p>
        <p v-if="errorMessage" class="account-error" role="alert">{{ errorMessage }}</p>
        <q-btn unelevated rounded color="primary" icon="lock_open" type="submit" :loading="loading" :disable="Boolean(passwordMismatch)" :label="isEnglish ? (isLogin ? 'Sign in' : 'Create my account') : (isLogin ? 'Iniciar sesión' : 'Crear mi cuenta')" />
      </form>
      <p class="account-privacy"><q-icon name="verified_user" /> {{ isEnglish ? 'Your password is handled by Firebase Authentication. It is never stored in TURISGO.' : 'Firebase Authentication protege tu contraseña. TURISGO no la almacena.' }}</p>
    </div>
  </section>
</template>

<script setup>
import { computed, reactive, ref, watch } from 'vue'
import { imageToDataUrl, photoErrorMessage } from '../services/imageUtils'
import { isValidElSalvadorPhone } from '../services/phoneUtils'

const props = defineProps({
  isEnglish: Boolean,
  loading: Boolean,
  errorMessage: { type: String, default: '' },
  isAuthenticated: Boolean,
  userProfile: { type: Object, default: () => ({}) },
  showPhotoStep: Boolean,
  hasBusinessProfile: Boolean,
  businesses: { type: Array, default: () => [] },
})
const emit = defineEmits(['login', 'register', 'logout', 'switch-account', 'open-settings', 'open-business', 'add-business', 'edit-business', 'update-profile', 'complete-photo', 'skip-photo'])
const isLogin = ref(true)
const showPassword = ref(false)
const photoDraft = ref('')
const photoLoading = ref(false)
const photoError = ref('')
const phoneError = ref('')
const photoInput = ref(null)
const editingProfile = ref(false)
const form = reactive({ name: '', username: '', mode: '', businessName: '', phone: '', email: '', password: '', confirmPassword: '' })
const accountForm = reactive({ name: '', username: '', phone: '', businessName: '' })
const modeOptions = computed(() => [
  { label: props.isEnglish ? 'Personal' : 'Personal', value: 'personal' },
  { label: props.isEnglish ? 'Business' : 'Empresarial', value: 'business' },
])
const passwordMismatch = computed(() => Boolean(!isLogin.value && form.confirmPassword && form.password !== form.confirmPassword))
const phoneHint = computed(() => props.isEnglish
  ? 'El Salvador: 8 digits, e.g. 7033 5800 or +503 7033 5800'
  : 'El Salvador: 8 dígitos, por ejemplo 7033 5800 o +503 7033 5800')
const initials = computed(() => (props.userProfile.name || 'T').split(' ').map((part) => part[0]).slice(0, 2).join('').toUpperCase())
const heading = computed(() => {
  if (props.showPhotoStep) return props.isEnglish ? 'Add a profile photo' : 'Agrega tu foto de perfil'
  if (props.isAuthenticated) return editingProfile.value
    ? (props.isEnglish ? 'Edit profile' : 'Editar perfil')
    : (props.isEnglish ? 'Account' : 'Cuenta')
  return props.isEnglish ? (isLogin.value ? 'Sign in' : 'Create account') : (isLogin.value ? 'Iniciar sesión' : 'Crear cuenta')
})
const description = computed(() => {
  if (props.showPhotoStep) return props.isEnglish ? 'This is optional. You can skip it and add a photo later.' : 'Este paso es opcional. Puedes omitirlo y agregar una foto después.'
  if (props.isAuthenticated && editingProfile.value) return props.isEnglish ? 'Update the details you used to create your account.' : 'Actualiza los datos que usaste para crear tu cuenta.'
  if (props.isAuthenticated) return props.isEnglish ? 'Manage your profile, chats, language, and appearance.' : 'Administra tu perfil, chats, idioma y apariencia.'
  return props.isEnglish ? 'Sign in or create an account to keep your profile and conversations available.' : 'Inicia sesión o crea una cuenta para conservar tu perfil y tus conversaciones.'
})

watch(() => props.userProfile, (profile) => {
  Object.assign(accountForm, {
    name: profile.name || '',
    username: profile.username || '',
    phone: profile.phone || '',
    businessName: profile.businessName || '',
  })
}, { deep: true, immediate: true })
watch(() => props.showPhotoStep, (value) => {
  if (value) { photoDraft.value = ''; photoError.value = '' }
})
watch(() => props.userProfile.avatarUrl, (value) => {
  if (value && value === photoDraft.value) photoDraft.value = ''
})
watch(() => props.loading, (value, previousValue) => {
  if (previousValue && !value && !props.errorMessage) editingProfile.value = false
})

function submit() {
  if (isLogin.value) {
    emit('login', { email: form.email, password: form.password })
    return
  }
  if (!validatePhone(form.phone)) return
  if (form.password !== form.confirmPassword) return
  emit('register', { ...form, username: form.username.replace(/^@+/, '').trim() })
}

function saveAccountDetails() {
  if (!validatePhone(accountForm.phone)) return
  emit('update-profile', {
    ...props.userProfile,
    ...accountForm,
    username: accountForm.username.replace(/^@+/, '').trim(),
  })
}

function cancelEditProfile() {
  Object.assign(accountForm, {
    name: props.userProfile.name || '',
    username: props.userProfile.username || '',
    phone: props.userProfile.phone || '',
    businessName: props.userProfile.businessName || '',
  })
  phoneError.value = ''
  editingProfile.value = false
}

function validatePhone(value) {
  if (isValidElSalvadorPhone(value)) {
    phoneError.value = ''
    return true
  }
  phoneError.value = props.isEnglish
    ? 'Enter a valid El Salvador number: 8 digits, optionally with +503.'
    : 'Escribe un número salvadoreño válido: 8 dígitos, opcionalmente con +503.'
  return false
}

async function onPhotoSelected(event) {
  const file = event.target.files?.[0]
  event.target.value = ''
  if (!file) return
  photoLoading.value = true
  photoError.value = ''
  try {
    photoDraft.value = await imageToDataUrl(file, { maxSide: 320, maxChars: 60000, square: true })
  } catch (error) {
    photoError.value = photoErrorMessage(error, props.isEnglish)
  } finally {
    photoLoading.value = false
  }
}
</script>
