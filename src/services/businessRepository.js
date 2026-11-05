import { collection, doc, getDocs, serverTimestamp, setDoc } from 'firebase/firestore'
import { db } from '../boot/firebase'

/** Store public business listing fields and image URLs in Firestore. */
export async function saveBusinessListing(profile) {
  const { id, ...fields } = profile
  await setDoc(
    doc(db, 'businessProfiles', id),
    { ...fields, updatedAt: serverTimestamp() },
    { merge: true },
  )
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
