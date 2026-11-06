import {
  createUserWithEmailAndPassword,
  deleteUser,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth'
import {
  addDoc,
  collection,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore'
import { auth, db } from '../boot/firebase'

function normalizeUsername(value) {
  return value.trim().replace(/^@+/, '').toLowerCase().replace(/[^a-z0-9._-]/g, '')
}

export async function registerAccount(form) {
  const username = normalizeUsername(form.username)
  if (username.length < 3 || username.length > 24) {
    const error = new Error('username-invalid')
    error.code = 'username-invalid'
    throw error
  }
  const credential = await createUserWithEmailAndPassword(auth, form.email.trim(), form.password)
  const uid = credential.user.uid

  try {
    await runTransaction(db, async (transaction) => {
      const usernameRef = doc(db, 'usernameIndex', username)
      const usernameSnapshot = await transaction.get(usernameRef)
      if (usernameSnapshot.exists()) {
        const error = new Error('username-already-used')
        error.code = 'username-already-used'
        throw error
      }
      transaction.set(usernameRef, { uid, createdAt: serverTimestamp() })
      transaction.set(doc(db, 'users', uid), {
        uid,
        username,
        name: form.name.trim(),
        mode: form.mode,
        businessName: form.mode === 'business' ? form.businessName.trim() : '',
        avatarUrl: '',
        createdAt: serverTimestamp(),
      })
      transaction.set(doc(db, 'accounts', uid), {
        email: form.email.trim().toLowerCase(),
        phone: form.phone.trim(),
        createdAt: serverTimestamp(),
      })
    })
  } catch (error) {
    await deleteUser(credential.user).catch(() => {})
    throw error
  }

  return { uid, username, name: form.name.trim(), mode: form.mode, businessName: form.businessName.trim(), phone: form.phone.trim(), email: form.email.trim().toLowerCase(), avatarUrl: '' }
}

export async function loginAccount(email, password) {
  const credential = await signInWithEmailAndPassword(auth, email.trim(), password)
  const profileSnapshot = await getDoc(doc(db, 'users', credential.user.uid))
  const accountSnapshot = await getDoc(doc(db, 'accounts', credential.user.uid))
  if (!profileSnapshot.exists()) throw new Error('profile-not-found')
  return { ...profileSnapshot.data(), ...(accountSnapshot.exists() ? accountSnapshot.data() : {}), uid: credential.user.uid }
}

export function logoutAccount() {
  return signOut(auth)
}

export function watchAuthentication(onChange) {
  return onAuthStateChanged(auth, onChange)
}

export async function loadAccountProfile(uid) {
  const [profileSnapshot, accountSnapshot] = await Promise.all([
    getDoc(doc(db, 'users', uid)),
    getDoc(doc(db, 'accounts', uid)),
  ])
  if (!profileSnapshot.exists()) return null
  return { ...profileSnapshot.data(), ...(accountSnapshot.exists() ? accountSnapshot.data() : {}), uid }
}

export async function updateAccountProfile(profile) {
  const username = normalizeUsername(profile.username)
  if (!profile.uid || username.length < 3 || username.length > 24) {
    const error = new Error('username-invalid')
    error.code = 'username-invalid'
    throw error
  }
  await runTransaction(db, async (transaction) => {
    const userRef = doc(db, 'users', profile.uid)
    const userSnapshot = await transaction.get(userRef)
    const oldUsername = userSnapshot.data()?.username || ''
    const usernameRef = doc(db, 'usernameIndex', username)
    const usernameSnapshot = await transaction.get(usernameRef)
    if (usernameSnapshot.exists() && usernameSnapshot.data().uid !== profile.uid) {
      const error = new Error('username-already-used')
      error.code = 'username-already-used'
      throw error
    }
    if (oldUsername && oldUsername !== username) transaction.delete(doc(db, 'usernameIndex', oldUsername))
    if (!usernameSnapshot.exists()) transaction.set(usernameRef, { uid: profile.uid, createdAt: serverTimestamp() })
    transaction.set(userRef, {
      uid: profile.uid,
      username,
      name: profile.name.trim(),
      mode: profile.mode,
      businessName: profile.businessName || '',
      avatarUrl: profile.avatarUrl || '',
      updatedAt: serverTimestamp(),
    }, { merge: true })
  })
}

export function watchTravelers(currentUid, onChange, onError) {
  const unsubscribe = onSnapshot(collection(db, 'users'), (snapshot) => {
    onChange(snapshot.docs.map((entry) => entry.data()).filter((user) => user.uid !== currentUid))
  }, onError)
  return unsubscribe
}

export function getConversationId(firstUid, secondUid) {
  return [firstUid, secondUid].sort().join('_')
}

export async function ensureConversation(firstUid, secondUid) {
  const conversationId = getConversationId(firstUid, secondUid)
  await setDoc(doc(db, 'chats', conversationId), { participants: [firstUid, secondUid].sort(), updatedAt: serverTimestamp() }, { merge: true })
}

export function watchMessages(firstUid, secondUid, onChange, onError) {
  const conversationId = getConversationId(firstUid, secondUid)
  const messages = query(collection(db, 'chats', conversationId, 'messages'), orderBy('createdAt', 'asc'))
  return onSnapshot(messages, (snapshot) => {
    onChange(snapshot.docs.map((entry) => ({ id: entry.id, ...entry.data(), timestamp: entry.data().createdAt?.toDate?.().toISOString() || new Date().toISOString() })))
  }, onError)
}

export async function sendChatMessage(senderUid, recipientUid, text) {
  const conversationId = getConversationId(senderUid, recipientUid)
  await ensureConversation(senderUid, recipientUid)
  await addDoc(collection(db, 'chats', conversationId, 'messages'), { senderUid, text: text.trim(), createdAt: serverTimestamp() })
}
