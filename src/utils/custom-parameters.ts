import {
  CustomParameter,
  CustomParameterType,
} from '../types/custom-parameter.types'

export const DEFAULT_CUSTOM_PARAMETER_TYPE: CustomParameterType = 'text'

export function normalizeCustomParameterType(
  value: string | undefined,
): CustomParameterType {
  if (
    value === 'text' ||
    value === 'number' ||
    value === 'boolean' ||
    value === 'json'
  ) {
    return value
  }
  return DEFAULT_CUSTOM_PARAMETER_TYPE
}

export function sanitizeCustomParameters(
  entries: Array<Pick<CustomParameter, 'key' | 'value'> & { type?: string }>,
): CustomParameter[] {
  return entries
    .map((entry) => ({
      key: entry.key.trim(),
      value: entry.value,
      type: normalizeCustomParameterType(entry.type),
    }))
    .filter((entry) => entry.key.length > 0)
}

export function parseCustomParameterValue(raw: string, type?: string): unknown {
  const normalizedType = normalizeCustomParameterType(
    typeof type === 'string' ? type.trim() : type,
  )
  const trimmed = raw.trim()

  if (normalizedType === 'text') {
    return trimmed
  }

  if (trimmed.length === 0) {
    return raw
  }

  if (normalizedType === 'number') {
    const normalizedNumeric =
      trimmed.includes(',') && !trimmed.includes('.')
        ? trimmed.split(',').join('.')
        : trimmed
    const parsed = Number(normalizedNumeric)
    return Number.isFinite(parsed) ? parsed : raw
  }

  if (normalizedType === 'boolean') {
    const lower = trimmed.toLowerCase()
    if (lower === 'true') return true
    if (lower === 'false') return false
    return raw
  }

  try {
    return JSON.parse(trimmed)
  } catch {
    return raw
  }
}
