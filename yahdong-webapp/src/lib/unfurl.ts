import api from './axios'

export interface UnfurlData {
  url: string
  title?: string
  description?: string
  image?: string
  favicon?: string
  siteName?: string
}

/** Fetch link metadata via the backend `/unfurl` endpoint. */
export async function fetchUnfurl(url: string): Promise<UnfurlData> {
  const r = await api.get<UnfurlData>('/unfurl', { params: { url } })
  return r.data
}

/**
 * Extract the first http(s) URL from a string.
 * Handles raw URLs in plain text and `<a href="...">` in TipTap HTML.
 */
export function extractFirstUrl(html: string): string | null {
  if (!html) return null

  // Prefer <a href="..."> if present (TipTap-authored links).
  const anchorMatch = html.match(/<a\b[^>]*\bhref=["'](https?:\/\/[^"']+)["']/i)
  if (anchorMatch) return anchorMatch[1]

  // Fall back to a raw URL scan (cap at the first whitespace/tag).
  const rawMatch = html.match(/https?:\/\/[^\s<>"']+/i)
  return rawMatch ? rawMatch[0] : null
}
