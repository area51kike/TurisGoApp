import { collection, doc, getDocs, serverTimestamp, setDoc } from 'firebase/firestore'
import { getDownloadURL, ref as storageRef, uploadString } from 'firebase/storage'
import { auth, db, storage } from '../boot/firebase'

/** Store public business listing fields and image URLs in Firestore. */
export async function saveBusinessListing(profile) {
  const { id, ...fields } = profile
  const uid = auth.currentUser?.uid
  if (!uid) throw new Error('auth-required')
  const photoUrls = await Promise.all((fields.photoUrls || []).map(async (photo, index) => {
    if (!photo.startsWith('data:')) return photo
    const path = `businessListings/${uid}/${id}-${index}-${Date.now()}.jpg`
    const target = storageRef(storage, path)
    await uploadString(target, photo, 'data_url', { contentType: 'image/jpeg' })
    return getDownloadURL(target)
  }))
  const saved = { ...fields, photoUrls, ownerUid: uid }
  await setDoc(
    doc(db, 'businessProfiles', id),
    { ...saved, updatedAt: serverTimestamp() },
    { merge: true },
  )
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
