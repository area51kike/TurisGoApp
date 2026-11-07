import { collection, doc, getDocs, serverTimestamp, setDoc } from 'firebase/firestore'
import { getDownloadURL, ref as storageRef, uploadBytesResumable } from 'firebase/storage'
import { auth, db, storage } from '../boot/firebase'

const PHOTO_UPLOAD_TIMEOUT_MS = 45000
const FIRESTORE_SAVE_TIMEOUT_MS = 20000

function dataUrlToBlob(dataUrl) {
  const [header, content] = dataUrl.split(',')
  if (!header || !content) throw new Error('invalid-photo-data')
  const mimeType = header.match(/^data:(.*?);base64$/)?.[1] || 'image/jpeg'
  const binary = atob(content)
  const bytes = new Uint8Array(binary.length)
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index)
  return new Blob([bytes], { type: mimeType })
}

function uploadPhoto(target, photo) {
  const task = uploadBytesResumable(target, dataUrlToBlob(photo), { contentType: 'image/jpeg' })
  return new Promise((resolve, reject) => {
    let timeoutId
    let timedOut = false
    let unsubscribe = () => {}
    const finish = (callback, value) => {
      clearTimeout(timeoutId)
      unsubscribe()
      callback(value)
    }
    unsubscribe = task.on(
      'state_changed',
      undefined,
      (error) => finish(reject, timedOut ? new Error('business-photo-upload-timeout') : error),
      () => finish(resolve, task.snapshot),
    )
    timeoutId = setTimeout(() => {
      timedOut = true
      task.cancel()
      finish(reject, new Error('business-photo-upload-timeout'))
    }, PHOTO_UPLOAD_TIMEOUT_MS)
  })
}

function withTimeout(promise, timeoutMs, errorCode) {
  let timeoutId
  const timeout = new Promise((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error(errorCode)), timeoutMs)
  })
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timeoutId))
}

/** Store public business listing fields and image URLs in Firestore. */
export async function saveBusinessListing(profile) {
  const { id, ...fields } = profile
  const uid = auth.currentUser?.uid
  if (!uid) throw new Error('auth-required')
  const photoUrls = await Promise.all((fields.photoUrls || []).map(async (photo, index) => {
    if (!photo.startsWith('data:')) return photo
    const path = `businessListings/${uid}/${id}-${index}-${Date.now()}.jpg`
    const target = storageRef(storage, path)
    await uploadPhoto(target, photo)
    return withTimeout(getDownloadURL(target), 15000, 'business-photo-url-timeout')
  }))
  const saved = { ...fields, photoUrls, ownerUid: uid }
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
