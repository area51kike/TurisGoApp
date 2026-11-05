const MAX_INPUT_BYTES = 15 * 1024 * 1024

function loadImage(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const image = new Image()
    image.onload = () => {
      URL.revokeObjectURL(url)
      resolve(image)
    }
    image.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('unreadable-image'))
    }
    image.src = url
  })
}

function drawToJpeg(image, side, quality, square) {
  const sourceWidth = image.naturalWidth
  const sourceHeight = image.naturalHeight
  const canvas = document.createElement('canvas')
  const context = canvas.getContext('2d')
  context.fillStyle = '#ffffff'

  if (square) {
    const crop = Math.min(sourceWidth, sourceHeight)
    const sx = (sourceWidth - crop) / 2
    const sy = (sourceHeight - crop) / 2
    canvas.width = side
    canvas.height = side
    context.fillRect(0, 0, side, side)
    context.drawImage(image, sx, sy, crop, crop, 0, 0, side, side)
  } else {
    const scale = Math.min(1, side / Math.max(sourceWidth, sourceHeight))
    canvas.width = Math.max(1, Math.round(sourceWidth * scale))
    canvas.height = Math.max(1, Math.round(sourceHeight * scale))
    context.fillRect(0, 0, canvas.width, canvas.height)
    context.drawImage(image, 0, 0, canvas.width, canvas.height)
  }
  return canvas.toDataURL('image/jpeg', quality)
}

/**
 * Resize and compress an image file in the browser and return a JPEG data URL.
 * Tries smaller sizes and lower quality until the result fits in `maxChars`,
 * so it can be stored inside a Firestore document (1 MiB limit per document).
 */
export async function imageToDataUrl(
  file,
  { maxSide = 1024, maxChars = 150000, square = false } = {},
) {
  if (!file?.type?.startsWith('image/')) throw new Error('not-image')
  if (file.size > MAX_INPUT_BYTES) throw new Error('too-large')
  const image = await loadImage(file)

  for (const factor of [1, 0.8, 0.65, 0.5]) {
    for (const quality of [0.82, 0.68, 0.54]) {
      const dataUrl = drawToJpeg(image, Math.round(maxSide * factor), quality, square)
      if (dataUrl.length <= maxChars) return dataUrl
    }
  }
  throw new Error('cannot-shrink')
}

/** A photo can be a public HTTPS link or an image uploaded from this app. */
export function isPhotoSource(value) {
  if (typeof value !== 'string') return false
  if (value.startsWith('data:image/jpeg;base64,')) return true
  try {
    return new URL(value).protocol === 'https:'
  } catch {
    return false
  }
}

export function photoErrorMessage(error, isEnglish) {
  const code = error?.message
  if (code === 'not-image')
    return isEnglish ? 'Choose an image file.' : 'Elige un archivo de imagen.'
  if (code === 'too-large')
    return isEnglish
      ? 'That image is too large (max 15 MB).'
      : 'La imagen es demasiado grande (máximo 15 MB).'
  if (code === 'unreadable-image')
    return isEnglish
      ? 'This browser could not read that image. Try a JPG or PNG.'
      : 'Este navegador no pudo leer esa imagen. Prueba con JPG o PNG.'
  return isEnglish
    ? 'Could not process the photo. Try another one.'
    : 'No se pudo procesar la foto. Prueba con otra.'
}
