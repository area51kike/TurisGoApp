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
  collectionGroup,
  doc,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  where,
} from 'firebase/firestore'
import { auth, db } from '../boot/firebase'
import { normalizeElSalvadorPhone } from './phoneUtils'

function normalizeUsername(value) {
  return value.trim().replace(/^@+/, '').toLowerCase().replace(/[^a-z0-9._-]/g, '')
}

export async function registerAccount(form) {
  const username = normalizeUsername(form.username)
  const phone = normalizeElSalvadorPhone(form.phone)
  if (!['personal', 'business'].includes(form.mode) || !form.name?.trim() || !phone || (form.mode === 'business' && !form.businessName?.trim())) {
    if (!phone) {
      const error = new Error('phone-invalid')
      error.code = 'phone-invalid'
      throw error
    }
    const error = new Error('account-details-required')
    error.code = 'account-details-required'
    throw error
  }
  if (username.length < 3 || username.length > 24) {
    const error = new Error('username-invalid')
    error.code = 'username-invalid'
    throw error
  }
  const credential = await createUserWithEmailAndPassword(auth, form.email.trim(), form.password)
  const uid = credential.user.uid

  try {
    await runTransaction(db, async (transaction) => {
      // userProfiles is keyed by the public username in the existing project.
      const profileRef = doc(db, 'userProfiles', username)
      const profileSnapshot = await transaction.get(profileRef)
      if (profileSnapshot.exists()) {
        const error = new Error('username-already-used')
        error.code = 'username-already-used'
        throw error
      }
      transaction.set(profileRef, {
        uid,
        username,
        name: form.name.trim(),
        mode: form.mode,
        avatarUrl: '',
        updatedAt: serverTimestamp(),
      })
      transaction.set(doc(db, 'accounts', uid), {
        email: form.email.trim().toLowerCase(),
        phone,
        createdAt: serverTimestamp(),
      })
    })
  } catch (error) {
    await deleteUser(credential.user).catch(() => {})
    throw error
  }

  return { uid, username, name: form.name.trim(), mode: form.mode, businessName: form.businessName?.trim() || '', phone, email: form.email.trim().toLowerCase(), avatarUrl: '' }
}

export async function loginAccount(email, password) {
  const credential = await signInWithEmailAndPassword(auth, email.trim(), password)
  const profileSnapshot = await getDocs(query(
    collection(db, 'userProfiles'),
    where('uid', '==', credential.user.uid),
    limit(1),
  ))
  const accountSnapshot = await getDoc(doc(db, 'accounts', credential.user.uid))
  if (profileSnapshot.empty) throw new Error('profile-not-found')
  return { ...profileSnapshot.docs[0].data(), ...(accountSnapshot.exists() ? accountSnapshot.data() : {}), uid: credential.user.uid }
}

export function logoutAccount() {
  return signOut(auth)
}

export function watchAuthentication(onChange) {
  return onAuthStateChanged(auth, onChange)
}

export async function loadAccountProfile(uid) {
  const [profileSnapshot, accountSnapshot] = await Promise.all([
    getDocs(query(collection(db, 'userProfiles'), where('uid', '==', uid), limit(1))),
    getDoc(doc(db, 'accounts', uid)),
  ])
  if (profileSnapshot.empty) return null
  return { ...profileSnapshot.docs[0].data(), ...(accountSnapshot.exists() ? accountSnapshot.data() : {}), uid }
}

export async function updateAccountProfile(profile) {
  const username = normalizeUsername(profile.username)
  const phone = normalizeElSalvadorPhone(profile.phone)
  if (!profile.uid || username.length < 3 || username.length > 24) {
    const error = new Error('username-invalid')
    error.code = 'username-invalid'
    throw error
  }
  if (!phone) {
    const error = new Error('phone-invalid')
    error.code = 'phone-invalid'
    throw error
  }
  // Profile photos are already compressed by the picker (max 60 KB). Store
  // the data URL in the existing avatarUrl field, matching current documents
  // and avoiding a dependency on Firebase Storage setup/rules for user photos.
  const avatarUrl = profile.avatarUrl || ''
  const currentProfiles = await getDocs(query(
    collection(db, 'userProfiles'),
    where('uid', '==', profile.uid),
    limit(1),
  ))
  const oldUsername = currentProfiles.docs[0]?.id || ''
  await runTransaction(db, async (transaction) => {
    const oldProfileRef = oldUsername ? doc(db, 'userProfiles', oldUsername) : null
    const newProfileRef = doc(db, 'userProfiles', username)
    const [oldProfileSnapshot, newProfileSnapshot] = await Promise.all([
      oldProfileRef ? transaction.get(oldProfileRef) : Promise.resolve(null),
      transaction.get(newProfileRef),
    ])
    if (newProfileSnapshot.exists() && newProfileSnapshot.data().uid !== profile.uid) {
      const error = new Error('username-already-used')
      error.code = 'username-already-used'
      throw error
    }
    if (oldUsername && oldUsername !== username && oldProfileSnapshot?.exists()) transaction.delete(oldProfileRef)
    transaction.set(newProfileRef, {
      uid: profile.uid,
      username,
      name: profile.name.trim(),
      mode: profile.mode,
      avatarUrl,
      updatedAt: serverTimestamp(),
    }, { merge: true })
    transaction.set(doc(db, 'accounts', profile.uid), {
      phone,
      updatedAt: serverTimestamp(),
    }, { merge: true })
  })
  return { ...profile, username, phone, avatarUrl }
}

export function watchTravelers(currentUid, onChange, onError) {
  const unsubscribe = onSnapshot(collection(db, 'userProfiles'), (snapshot) => {
    onChange(snapshot.docs
      .map((entry) => ({ id: entry.id, ...entry.data() }))
      // Legacy/test profiles without an Auth uid cannot be used as chat accounts.
      .filter((user) => user.uid && user.uid !== currentUid))
  }, onError)
  return unsubscribe
}

export function startUserPresence(uid, username) {
  if (!uid || !username || auth.currentUser?.uid !== uid) return () => Promise.resolve()

  const profileRef = doc(db, 'userProfiles', username)
  let stopped = false
  const writePresence = (isOnline) => setDoc(profileRef, {
    uid,
    username,
    isOnline,
    lastSeen: serverTimestamp(),
  }, { merge: true })

  const heartbeat = () => {
    if (stopped || auth.currentUser?.uid !== uid) return
    writePresence(true).catch((error) => console.warn('Could not update online presence:', error))
  }

  heartbeat()
  const intervalId = window.setInterval(heartbeat, 30000)
  return async () => {
    if (stopped) return
    stopped = true
    window.clearInterval(intervalId)
    if (auth.currentUser?.uid === uid) {
      await writePresence(false).catch((error) => console.warn('Could not clear online presence:', error))
    }
  }
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

export async function sendChatMessage(senderUid, recipientUid, text, senderProfile = {}) {
  const conversationId = getConversationId(senderUid, recipientUid)
  await ensureConversation(senderUid, recipientUid)
  await addDoc(collection(db, 'chats', conversationId, 'messages'), {
    senderUid,
    recipientUid,
    senderName: senderProfile.name || '',
    senderUsername: senderProfile.username || '',
    text: text.trim(),
    createdAt: serverTimestamp(),
  })
}

export function watchIncomingMessages(uid, onMessage, onError) {
  const inbox = query(collectionGroup(db, 'messages'), where('recipientUid', '==', uid))
  let initialized = false
  return onSnapshot(inbox, (snapshot) => {
    // Do not notify about old messages when the app starts or the user signs in.
    if (!initialized) {
      initialized = true
      return
    }
    snapshot.docChanges()
      .filter((change) => change.type === 'added')
      .forEach((change) => onMessage({ id: change.doc.id, ...change.doc.data() }))
  }, onError)
}

export function watchPlaceReviews(placeId, onChange, onError) {
  const reviews = query(collection(db, 'placeReviews'), where('placeId', '==', placeId))
  return onSnapshot(reviews, (snapshot) => {
    onChange(snapshot.docs.map((entry) => ({ id: entry.id, ...entry.data() })).sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0)))
  }, onError)
}

export async function savePlaceReview(placeId, review) {
  if (!auth.currentUser) throw new Error('auth-required')
  await addDoc(collection(db, 'placeReviews'), {
    placeId,
    userUid: auth.currentUser.uid,
    author: review.author,
    avatarUrl: review.avatarUrl || '',
    rating: review.rating,
    text: review.text.trim(),
    date: review.date,
    verifiedAt: review.verifiedAt,
    createdAt: serverTimestamp(),
  })
}

export function watchBusinessReplies(businessId, onChange, onError) {
  return onSnapshot(collection(db, 'businessProfiles', businessId, 'reviewReplies'), (snapshot) => {
    onChange(Object.fromEntries(snapshot.docs.map((entry) => [entry.id, entry.data().message])))
  }, onError)
}

export async function saveBusinessReply(businessId, reviewId, message) {
  await setDoc(doc(db, 'businessProfiles', businessId, 'reviewReplies', reviewId), {
    message: message.trim(),
    updatedAt: serverTimestamp(),
  })
}
