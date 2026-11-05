<template>
  <section class="page-section messages-page">
    <header class="page-heading">
      <span class="eyebrow">{{ isEnglish ? 'TRAVEL TOGETHER' : 'VIAJA EN COMPAÑÍA' }}</span>
      <h1>{{ isEnglish ? 'Messages' : 'Chat' }}</h1>
      <p>{{ isEnglish ? 'Find another traveler by their username.' : 'Encuentra a otros viajeros por su nombre de usuario.' }}</p>
    </header>

    <q-input v-model="query" outlined rounded :placeholder="isEnglish ? 'Search by username…' : 'Buscar por nombre de usuario…'">
      <template #prepend><q-icon name="alternate_email" /></template>
      <template v-if="query" #append><q-btn flat round dense icon="close" @click="query = ''" /></template>
    </q-input>

    <div v-if="!activePerson" class="people-list">
      <button v-for="person in matches" :key="person.username" class="person-result" @click="activePerson = person">
        <q-avatar color="secondary" text-color="white" size="48px">{{ person.avatar }}</q-avatar>
        <span><strong>{{ person.name }}</strong><small>@{{ person.username }} · {{ person.city }}</small></span>
        <q-icon name="chevron_right" />
      </button>
      <div v-if="matches.length === 0" class="empty-state"><q-icon name="person_search" /><strong>{{ isEnglish ? 'No travelers found' : 'No encontramos viajeros' }}</strong><span>{{ isEnglish ? 'Try searching for another username.' : 'Prueba con otro nombre de usuario.' }}</span></div>
      <div v-if="!query && matches.length" class="chat-note"><q-icon name="info" /> {{ isEnglish ? 'Sample accounts are shown until user registration is connected.' : 'Se muestran cuentas de ejemplo mientras se conecta el registro de usuarios.' }}</div>
    </div>

    <div v-else class="chat-room">
      <div class="chat-room__header"><q-btn flat round icon="arrow_back" @click="activePerson = null" /><q-avatar color="secondary" text-color="white" size="40px">{{ activePerson.avatar }}</q-avatar><div><strong>{{ activePerson.name }}</strong><small>@{{ activePerson.username }}</small></div></div>
      <div class="chat-messages" ref="messagesElement">
        <div v-if="chatMessages.length === 0" class="chat-empty"><q-icon name="waving_hand" /><p>{{ isEnglish ? `Say hello to ${activePerson.name}.` : `Saluda a ${activePerson.name}.` }}</p></div>
        <div v-for="(message, index) in chatMessages" :key="`${message.timestamp}-${index}`" :class="['chat-bubble', { 'chat-bubble--mine': message.fromMe }]">
          <p>{{ message.text }}</p><small>{{ formatTime(message.timestamp) }}</small>
        </div>
      </div>
      <form class="chat-compose" @submit.prevent="send">
        <q-input v-model="draftMessage" outlined rounded dense :placeholder="isEnglish ? 'Write a message…' : 'Escribe un mensaje…'" />
        <q-btn round unelevated color="primary" icon="send" type="submit" :disable="!draftMessage.trim()" :aria-label="isEnglish ? 'Send message' : 'Enviar mensaje'" />
      </form>
      <div class="chat-note"><q-icon name="info" /> {{ isEnglish ? 'Messages are stored locally in this prototype.' : 'Los mensajes se guardan localmente en este prototipo.' }}</div>
    </div>
  </section>
</template>

<script setup>
import { computed, nextTick, ref, watch } from 'vue'

const props = defineProps({
  isEnglish: Boolean,
  people: { type: Array, default: () => [] },
  messages: { type: Object, default: () => ({}) },
})
const emit = defineEmits(['send-message'])
const query = ref('')
const activePerson = ref(null)
const draftMessage = ref('')
const messagesElement = ref(null)

const matches = computed(() => {
  const term = query.value.trim().replace(/^@/, '').toLocaleLowerCase()
  return props.people.filter((person) => !term || `${person.name} ${person.username} ${person.city}`.toLocaleLowerCase().includes(term))
})
const chatMessages = computed(() => activePerson.value ? (props.messages[activePerson.value.username] || []) : [])

watch(chatMessages, async () => {
  await nextTick()
  if (messagesElement.value) messagesElement.value.scrollTop = messagesElement.value.scrollHeight
})

function send() {
  const text = draftMessage.value.trim()
  if (!text || !activePerson.value) return
  emit('send-message', { username: activePerson.value.username, text, timestamp: new Date().toISOString() })
  draftMessage.value = ''
}

function formatTime(value) {
  return new Intl.DateTimeFormat(props.isEnglish ? 'en-US' : 'es-SV', { hour: '2-digit', minute: '2-digit' }).format(new Date(value))
}
</script>
