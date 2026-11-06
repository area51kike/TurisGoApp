<template>
  <section class="page-section messages-page">
    <header class="page-heading">
      <span class="eyebrow">{{ isEnglish ? 'TRAVEL TOGETHER' : 'VIAJA EN COMPAÑÍA' }}</span>
      <h1>{{ isEnglish ? 'Messages' : 'Chat' }}</h1>
      <p>{{ isEnglish ? 'Find another traveler by their username.' : 'Encuentra a otros viajeros por su nombre de usuario.' }}</p>
    </header>

    <div v-if="!isAuthenticated" class="account-card">
      <strong>{{ isEnglish ? 'Chat needs an account' : 'El chat requiere una cuenta' }}</strong>
      <p>{{ isEnglish ? 'Sign in to find travelers and exchange messages.' : 'Inicia sesión para buscar viajeros e intercambiar mensajes.' }}</p>
      <q-btn unelevated rounded color="primary" icon="login" :label="isEnglish ? 'Sign in or register' : 'Iniciar sesión o registrarme'" @click="$emit('open-account')" />
    </div>

    <template v-else>
    <q-input v-model="query" outlined rounded :placeholder="isEnglish ? 'Search by username…' : 'Buscar por nombre de usuario…'">
      <template #prepend><q-icon name="alternate_email" /></template>
      <template v-if="query" #append><q-btn flat round dense icon="close" @click="query = ''" /></template>
    </q-input>

    <div v-if="!activePerson" class="people-list">
      <button v-for="person in matches" :key="person.username" class="person-result" @click="activePerson = person">
        <q-avatar color="secondary" text-color="white" size="48px">{{ initials(person.name) }}</q-avatar>
        <span><strong>{{ person.name }}</strong><small>@{{ person.username }} · {{ person.mode === 'business' ? (isEnglish ? 'Business' : 'Empresa') : (isEnglish ? 'Traveler' : 'Viajero') }}</small></span>
        <q-icon name="chevron_right" />
      </button>
      <div v-if="matches.length === 0" class="empty-state"><q-icon name="person_search" /><strong>{{ isEnglish ? 'No travelers found' : 'No encontramos viajeros' }}</strong><span>{{ isEnglish ? 'Try searching for another username.' : 'Prueba con otro nombre de usuario.' }}</span></div>
      <div v-if="!query && matches.length" class="chat-note"><q-icon name="info" /> {{ isEnglish ? 'Sample accounts are shown until user registration is connected.' : 'Se muestran cuentas de ejemplo mientras se conecta el registro de usuarios.' }}</div>
    </div>

    <div v-else class="chat-room">
      <div class="chat-room__header"><q-btn flat round icon="arrow_back" @click="activePerson = null" /><q-avatar color="secondary" text-color="white" size="40px">{{ initials(activePerson.name) }}</q-avatar><div><strong>{{ activePerson.name }}</strong><small>@{{ activePerson.username }}</small></div></div>
      <div class="chat-messages" ref="messagesElement">
        <div v-if="chatMessages.length === 0" class="chat-empty"><q-icon name="waving_hand" /><p>{{ isEnglish ? `Say hello to ${activePerson.name}.` : `Saluda a ${activePerson.name}.` }}</p></div>
        <div v-for="message in chatMessages" :key="message.id" :class="['chat-bubble', { 'chat-bubble--mine': message.senderUid === currentUser.uid }]">
          <p>{{ message.text }}</p><small>{{ formatTime(message.timestamp) }}</small>
        </div>
      </div>
      <form class="chat-compose" @submit.prevent="send">
        <q-input v-model="draftMessage" outlined rounded dense :placeholder="isEnglish ? 'Write a message…' : 'Escribe un mensaje…'" />
        <q-btn round unelevated color="primary" icon="send" type="submit" :disable="!draftMessage.trim()" :aria-label="isEnglish ? 'Send message' : 'Enviar mensaje'" />
      </form>
      <div class="chat-note"><q-icon name="cloud_done" /> {{ isEnglish ? 'Messages sync through Firebase Firestore.' : 'Los mensajes se sincronizan con Firebase Firestore.' }}</div>
    </div>
    </template>
  </section>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import { ensureConversation, watchMessages } from '../services/accountRepository'

const props = defineProps({
  isEnglish: Boolean,
  people: { type: Array, default: () => [] },
  currentUser: { type: Object, default: () => ({}) },
  isAuthenticated: Boolean,
})
const emit = defineEmits(['send-message', 'open-account'])
const query = ref('')
const activePerson = ref(null)
const draftMessage = ref('')
const messagesElement = ref(null)
const chatMessages = ref([])
let stopMessages

const matches = computed(() => {
  const term = query.value.trim().replace(/^@/, '').toLocaleLowerCase()
  return props.people.filter((person) => !term || `${person.name} ${person.username} ${person.city}`.toLocaleLowerCase().includes(term))
})
watch(() => [activePerson.value?.uid, props.currentUser.uid], ([otherUid, currentUid]) => {
  stopMessages?.()
  chatMessages.value = []
  if (otherUid && currentUid) {
    ensureConversation(currentUid, otherUid)
      .then(() => {
        if (activePerson.value?.uid === otherUid && props.currentUser.uid === currentUid) {
          stopMessages = watchMessages(currentUid, otherUid, (messages) => { chatMessages.value = messages })
        }
      })
      .catch((error) => console.warn('Could not open conversation:', error))
  }
}, { immediate: true })

onBeforeUnmount(() => {
  activePerson.value = null
  stopMessages?.()
})

watch(chatMessages, async () => {
  await nextTick()
  if (messagesElement.value) messagesElement.value.scrollTop = messagesElement.value.scrollHeight
})

function send() {
  const text = draftMessage.value.trim()
  if (!text || !activePerson.value) return
  emit('send-message', { uid: activePerson.value.uid, text })
  draftMessage.value = ''
}

function initials(name = '') {
  return name.trim().split(/\s+/).map((part) => part[0]).slice(0, 2).join('').toUpperCase() || 'T'
}

function formatTime(value) {
  return new Intl.DateTimeFormat(props.isEnglish ? 'en-US' : 'es-SV', { hour: '2-digit', minute: '2-digit' }).format(new Date(value))
}
</script>
