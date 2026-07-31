export function sanitizeRedirectTarget(rawRedirect: string | null, fallback = '/'): string {
  if (!rawRedirect) {
    return fallback
  }

  try {
    const nextUrl = new URL(rawRedirect, window.location.origin)

    if (nextUrl.origin !== window.location.origin) {
      return fallback
    }

    const normalized = `${nextUrl.pathname}${nextUrl.search}${nextUrl.hash}`
    if (!normalized.startsWith('/') || normalized.startsWith('//')) {
      return fallback
    }

    return normalized
  } catch {
    return fallback
  }
}
