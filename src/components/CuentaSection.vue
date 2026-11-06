<template>
  <section class="page-section account-page">
    <header class="page-heading">
      <span class="eyebrow">{{ isEnglish ? 'YOUR TURISGO ACCOUNT' : 'TU CUENTA TURISGO' }}</span>
      <h1>{{ isEnglish ? (isLogin ? 'Sign in' : 'Create account') : (isLogin ? 'Iniciar sesión' : 'Crear cuenta') }}</h1>
      <p>{{ isEnglish ? 'Your account keeps your profile and conversations available across devices.' : 'Tu cuenta guarda tu perfil y conversaciones para usarlos en tus dispositivos.' }}</p>
    </header>

    <div v-if="isAuthenticated" class="account-card account-card--signed">
      <q-avatar size="58px" color="primary" text-color="white">{{ (userProfile.name || 'T')[0] }}</q-avatar>
      <div class="account-card__identity"><strong>{{ userProfile.name }}</strong><span>@{{ userProfile.username }}</span><small>{{ userProfile.email }}</small></div>
      <q-btn flat rounded color="negative" icon="logout" :label="isEnglish ? 'Sign out' : 'Cerrar sesión'" @click="$emit('logout')" />
    </div>

    <div v-else class="account-card">
      <div class="account-tabs">
        <button :class="{ active: isLogin }" @click="isLogin = true">{{ isEnglish ? 'Sign in' : 'Iniciar sesión' }}</button>
        <button :class="{ active: !isLogin }" @click="isLogin = false">{{ isEnglish ? 'Create account' : 'Crear cuenta' }}</button>
      </div>
      <form class="account-form" @submit.prevent="submit">
        <template v-if="!isLogin">
          <q-input v-model="form.name" outlined rounded autocomplete="name" :label="isEnglish ? 'Full name *' : 'Nombre completo *'" required minlength="2" />
          <q-input v-model="form.username" outlined rounded prefix="@" autocomplete="username" :label="isEnglish ? 'Unique username *' : 'Nombre de usuario único *'" :hint="isEnglish ? 'Letters, numbers, dots, underscores, or hyphens' : 'Letras, números, puntos, guiones y guiones bajos'" required minlength="3" maxlength="24" pattern="[A-Za-z0-9._-]+" />
          <q-select v-model="form.mode" outlined rounded emit-value map-options :options="modeOptions" :label="isEnglish ? 'Account type *' : 'Tipo de cuenta *'" required />
          <q-input v-if="form.mode === 'business'" v-model="form.businessName" outlined rounded autocomplete="organization" :label="isEnglish ? 'Business name *' : 'Nombre de la empresa *'" required />
          <q-input v-model="form.phone" outlined rounded type="tel" autocomplete="tel" :label="isEnglish ? 'Phone number *' : 'Número de teléfono *'" required minlength="7" />
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
import { computed, reactive, ref } from 'vue'

const props = defineProps({
  isEnglish: Boolean,
  loading: Boolean,
  errorMessage: { type: String, default: '' },
  isAuthenticated: Boolean,
  userProfile: { type: Object, default: () => ({}) },
})
const emit = defineEmits(['login', 'register', 'logout'])
const isLogin = ref(true)
const showPassword = ref(false)
const form = reactive({ name: '', username: '', mode: 'personal', businessName: '', phone: '', email: '', password: '', confirmPassword: '' })
const modeOptions = computed(() => [
  { label: props.isEnglish ? 'Personal' : 'Personal', value: 'personal' },
  { label: props.isEnglish ? 'Business' : 'Empresarial', value: 'business' },
])
const passwordMismatch = computed(() => Boolean(!isLogin.value && form.confirmPassword && form.password !== form.confirmPassword))

function submit() {
  if (isLogin.value) {
    emit('login', { email: form.email, password: form.password })
    return
  }
  if (form.password !== form.confirmPassword) return
  emit('register', { ...form, username: form.username.replace(/^@+/, '').trim() })
}
</script>
