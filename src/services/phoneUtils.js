/** Return a normalized El Salvador phone number or an empty string if invalid. */
export function normalizeElSalvadorPhone(value) {
  const digits = String(value || '').replace(/\D/g, '')
  const nationalNumber = digits.length === 11 && digits.startsWith('503') ? digits.slice(3) : digits
  if (!/^[267]\d{7}$/.test(nationalNumber)) return ''
  return `+503${nationalNumber}`
}

export function isValidElSalvadorPhone(value) {
  return Boolean(normalizeElSalvadorPhone(value))
}
