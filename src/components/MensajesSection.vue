<template>
  <section class="page-section messages-page">
    <header class="page-heading">
      <span class="eyebrow">{{ isEnglish ? 'TRAVEL TOGETHER' : 'VIAJA EN COMPAÑÍA' }}</span>
      <h1>{{ isEnglish ? 'Messages' : 'Chat' }}</h1>
      <p>{{ isEnglish ? 'Your chats stay here. Search for someone to start a conversation.' : 'Tus conversaciones quedan aquí. Busca a alguien para iniciar un chat.' }}</p>
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
      <button v-for="person in displayedPeople" :key="person.uid" class="person-result" @click="activePerson = person">
        <q-avatar color="secondary" text-color="white" size="48px">{{ initials(person.name) }}</q-avatar>
        <span class="person-result__identity">
          <strong>{{ person.name }}</strong>
          <small>@{{ person.username }} · {{ person.mode === 'business' ? (isEnglish ? 'Business' : 'Empresa') : (isEnglish ? 'Traveler' : 'Viajero') }}</small>
          <small :class="['presence-state', { 'presence-state--online': isPersonOnline(person) }]">
            <i class="presence-state__dot" />{{ presenceLabel(person) }}
          </small>
        </span>
        <q-icon name="chevron_right" />
      </button>
      <div v-if="displayedPeople.length === 0" class="empty-state">
        <q-icon :name="query.trim() ? 'person_search' : 'forum'" />
        <strong>{{ emptyHeading }}</strong>
        <span>{{ emptyDescription }}</span>
      </div>
    </div>

    <div v-else class="chat-room">
      <div class="chat-room__header">
        <q-btn flat round icon="arrow_back" @click="activePerson = null" />
        <q-avatar color="secondary" text-color="white" size="40px">{{ initials(activePerson.name) }}</q-avatar>
        <div class="chat-room__identity">
          <strong>{{ activePerson.name }}</strong>
          <small>@{{ activePerson.username }}</small>
          <small :class="['presence-state', { 'presence-state--online': isPersonOnline(activePerson) }]">
            <i class="presence-state__dot" />{{ presenceLabel(activePerson) }}
          </small>
        </div>
      </div>
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
      <div :class="['chat-note', { 'chat-note--error': messageError }]">
        <q-icon :name="messageError ? 'cloud_off' : 'cloud_done'" />
        <span>{{ messageError || (isEnglish ? 'Messages sync live through Firebase Firestore.' : 'Los mensajes se sincronizan en tiempo real con Firebase Firestore.') }}</span>
        <q-btn v-if="messageError" flat dense no-caps :label="isEnglish ? 'Retry' : 'Reintentar conexión'" @click="retryMessages" />
      </div>
    </div>
    </template>
  </section>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { ensureConversation, watchMessages } from '../services/accountRepository'

const props = defineProps({
  isEnglish: Boolean,
  people: { type: Array, default: () => [] },
  contactUids: { type: Array, default: () => [] },
  currentUser: { type: Object, default: () => ({}) },
  isAuthenticated: Boolean,
})
const emit = defineEmits(['send-message', 'open-account'])
const query = ref('')
const activePerson = ref(null)
const draftMessage = ref('')
const messagesElement = ref(null)
const chatMessages = ref([])
const messageError = ref('')
const retryCount = ref(0)
const presenceClock = ref(Date.now())
let stopMessages
let subscriptionId = 0
let presenceTimer

const displayedPeople = computed(() => {
  const term = query.value.trim().replace(/^@/, '').toLocaleLowerCase()
  if (!term) {
    const contacts = new Set(props.contactUids)
    return props.people.filter((person) => contacts.has(person.uid))
  }
  return props.people.filter((person) => `${person.name} ${person.username} ${person.city}`.toLocaleLowerCase().includes(term))
})
const emptyHeading = computed(() => {
  if (query.value.trim()) return props.isEnglish ? 'No travelers found' : 'No encontramos usuarios'
  return props.isEnglish ? 'No conversations yet' : 'Aún no tienes conversaciones'
})
const emptyDescription = computed(() => {
  if (query.value.trim()) return props.isEnglish ? 'Try another name or username.' : 'Prueba con otro nombre o usuario.'
  return props.isEnglish ? 'Search by username to say hello. Your chat will appear here after you send a message.' : 'Busca a alguien por su usuario y salúdalo. El chat aparecerá aquí cuando envíes un mensaje.'
})
onMounted(() => {
  presenceTimer = window.setInterval(() => { presenceClock.value = Date.now() }, 15000)
})
watch(() => [activePerson.value?.uid, props.currentUser.uid, retryCount.value], ([otherUid, currentUid]) => {
  const currentSubscriptionId = ++subscriptionId
  stopMessages?.()
  stopMessages = undefined
  chatMessages.value = []
  messageError.value = ''
  if (otherUid && currentUid) {
    ensureConversation(currentUid, otherUid)
      .then(() => {
        if (currentSubscriptionId === subscriptionId && activePerson.value?.uid === otherUid && props.currentUser.uid === currentUid) {
          stopMessages = watchMessages(currentUid, otherUid, (messages) => {
            chatMessages.value = messages
            messageError.value = ''
          }, (error) => {
            console.error('Could not sync chat messages in real time:', error)
            messageError.value = props.isEnglish
              ? 'Could not sync this conversation. Check your connection and retry.'
              : 'No se pudo sincronizar esta conversación. Revisa tu conexión e inténtalo de nuevo.'
          })
        }
      })
      .catch((error) => {
        console.error('Could not open conversation:', error)
        if (currentSubscriptionId === subscriptionId) {
          messageError.value = props.isEnglish
            ? 'Could not connect to this conversation. Check your connection and retry.'
            : 'No se pudo conectar con esta conversación. Revisa tu conexión e inténtalo de nuevo.'
        }
      })
  }
}, { immediate: true })

onBeforeUnmount(() => {
  subscriptionId += 1
  window.clearInterval(presenceTimer)
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

function retryMessages() {
  retryCount.value += 1
}

function lastSeenMillis(person) {
  const lastSeen = person?.lastSeen
  if (typeof lastSeen?.toMillis === 'function') return lastSeen.toMillis()
  if (typeof lastSeen?.seconds === 'number') return lastSeen.seconds * 1000
  const parsed = Date.parse(lastSeen || '')
  return Number.isFinite(parsed) ? parsed : 0
}

function isPersonOnline(person) {
  const lastSeen = lastSeenMillis(person)
  return Boolean(person?.isOnline && lastSeen && presenceClock.value - lastSeen < 120000)
}

function presenceLabel(person) {
  if (isPersonOnline(person)) return props.isEnglish ? 'Online' : 'En línea'
  const lastSeen = lastSeenMillis(person)
  if (!lastSeen) return props.isEnglish ? 'Offline' : 'Desconectado'
  const time = new Intl.DateTimeFormat(props.isEnglish ? 'en-US' : 'es-SV', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(lastSeen)
  return props.isEnglish ? `Last seen ${time}` : `Últ. vez ${time}`
}

function initials(name = '') {
  return name.trim().split(/\s+/).map((part) => part[0]).slice(0, 2).join('').toUpperCase() || 'T'
}

function formatTime(value) {
  return new Intl.DateTimeFormat(props.isEnglish ? 'en-US' : 'es-SV', { hour: '2-digit', minute: '2-digit' }).format(new Date(value))
}
</script>
