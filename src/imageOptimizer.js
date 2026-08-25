const MAX_IMAGE_WIDTH = 1600
const MAX_IMAGE_HEIGHT = 1280
const WEBP_QUALITY = 0.82

export async function optimizeEventImage(file) {
  if (!file?.size || !file.type.startsWith('image/')) return file
  try {
    const bitmap = await createImageBitmap(file)
    const scale = Math.min(1, MAX_IMAGE_WIDTH / bitmap.width, MAX_IMAGE_HEIGHT / bitmap.height)
    const canvas = document.createElement('canvas')
    canvas.width = Math.max(1, Math.round(bitmap.width * scale))
    canvas.height = Math.max(1, Math.round(bitmap.height * scale))
    canvas.getContext('2d', { alpha: false }).drawImage(bitmap, 0, 0, canvas.width, canvas.height)
    bitmap.close()
    const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/webp', WEBP_QUALITY))
    if (!blob) return file
    const name = file.name.replace(/\.[^.]+$/, '') || 'event-image'
    return new File([blob], `${name}.webp`, { type: 'image/webp', lastModified: Date.now() })
  } catch (error) {
    console.warn('Image optimization unavailable; uploading the validated original.', error)
    return file
  }
}

export async function optimizeMenuImage(file) {
  if (!file?.size || !file.type.startsWith('image/')) throw new Error('Please choose a valid image file.')
  if (file.size > 15 * 1024 * 1024) throw new Error('Menu photos must be 15 MB or smaller before optimization.')
  const bitmap = await createImageBitmap(file)
  try {
    if (bitmap.width * bitmap.height > 60_000_000) throw new Error('This photo is too large to process safely. Please choose a smaller image.')
    let scale = Math.min(1, 1200 / bitmap.width, 900 / bitmap.height)
    let bestBlob = null
    for (let sizeAttempt = 0; sizeAttempt < 3; sizeAttempt++) {
      const canvas = document.createElement('canvas')
      canvas.width = Math.max(1, Math.round(bitmap.width * scale))
      canvas.height = Math.max(1, Math.round(bitmap.height * scale))
      canvas.getContext('2d', { alpha: false }).drawImage(bitmap, 0, 0, canvas.width, canvas.height)
      for (const quality of [0.8, 0.7, 0.6]) {
        const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/webp', quality))
        if (!blob) continue
        bestBlob = blob
        if (blob.size <= 350 * 1024) break
      }
      if (bestBlob?.size <= 350 * 1024) break
      scale *= 0.82
    }
    if (!bestBlob || bestBlob.size > 500 * 1024) throw new Error('This image could not be reduced enough. Please choose a different image.')
    const name = file.name.replace(/\.[^.]+$/, '') || 'menu-item'
    return new File([bestBlob], `${name}.webp`, { type: 'image/webp', lastModified: Date.now() })
  } finally {
    bitmap.close()
  }
}
