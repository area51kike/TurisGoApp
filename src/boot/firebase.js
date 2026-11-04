// src/boot/firebase.js
import { boot } from 'quasar/wrappers'
import { initializeApp } from 'firebase/app'
import { getAnalytics } from 'firebase/analytics'
import { getFirestore } from 'firebase/firestore'

// Configuración de tu proyecto
const firebaseConfig = {
  apiKey: 'AIzaSyAPqj27J3cE1WEu5C-xyb20T7yETiCKu6A',
  authDomain: 'turisgo-1a5c4.firebaseapp.com',
  projectId: 'turisgo-1a5c4',
  storageBucket: 'turisgo-1a5c4.firebasestorage.app',
  messagingSenderId: '724051247915',
  appId: '1:724051247915:web:fd9238feb22d45667a7b6e',
  measurementId: 'G-FMMYGCGJVZ',
}

// Inicialización de Firebase
const app = initializeApp(firebaseConfig)
const db = getFirestore(app)

// Opcional: inicializar Analytics solo en el cliente
if (typeof window !== 'undefined') {
  getAnalytics(app)
}

// Exportamos 'db' para consumirlo en cualquier página o componente
export { db }

// Exportación por defecto para el sistema de boot de Quasar
export default boot(({ app }) => {
  // Opcional: Proveer db globalmente si usas Options API
  app.config.globalProperties.$db = db
})
