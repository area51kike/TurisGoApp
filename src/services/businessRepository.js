import { collection, doc, getDocs, serverTimestamp, setDoc } from 'firebase/firestore'
import { auth, db } from '../boot/firebase'

const FIRESTORE_SAVE_TIMEOUT_MS = 20000

function withTimeout(promise, timeoutMs, errorCode) {
  let timeoutId
  const timeout = new Promise((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error(errorCode)), timeoutMs)
  })
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timeoutId))
}

/** Store the public listing and its compressed photo data URLs in Firestore. */
export async function saveBusinessListing(profile) {
  const { id, ...fields } = profile
  const uid = auth.currentUser?.uid
  if (!uid) throw new Error('auth-required')
  const saved = { ...fields, photoUrls: fields.photoUrls || [], ownerUid: uid }
  if (new Blob([JSON.stringify(saved)]).size > 900000) {
    throw new Error('business-profile-too-large')
  }
  await withTimeout(setDoc(
    doc(db, 'businessProfiles', id),
    { ...saved, updatedAt: serverTimestamp() },
    { merge: true },
  ), FIRESTORE_SAVE_TIMEOUT_MS, 'business-firestore-save-timeout')
  return saved
}

export async function loadBusinessListings() {
  const snapshot = await getDocs(collection(db, 'businessProfiles'))
  return snapshot.docs.map((entry) => {
    const data = entry.data()
    return {
      ...data,
      id: entry.id,
      updatedAt: data.updatedAt?.toDate?.().toISOString() || data.updatedAt || '',
    }
  })
}

export async function saveUserProfile(profile) {
  const { username, name, avatarUrl, mode } = profile
  const id = username.toLowerCase().replace(/[^a-z0-9_-]/g, '').slice(0, 40)
  if (!id) throw new Error('A username is required to save the profile.')
  await setDoc(doc(db, 'userProfiles', id), {
    username: id,
    name,
    avatarUrl,
    mode,
    updatedAt: serverTimestamp(),
  }, { merge: true })
}
