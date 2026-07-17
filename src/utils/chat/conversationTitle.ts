export const isUntitledConversationTitle = (
  title: string | null | undefined,
): boolean => {
  const normalized = title?.trim() ?? ''
  return normalized.length === 0
}

export const getConversationDisplayTitle = (
  title: string | null | undefined,
  fallback: string,
): string => (isUntitledConversationTitle(title) ? fallback : title!.trim())
