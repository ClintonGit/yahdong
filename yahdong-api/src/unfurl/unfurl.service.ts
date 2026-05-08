import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common'
import { unfurl } from 'unfurl.js'

export interface UnfurlResult {
  url: string
  title?: string
  description?: string
  image?: string
  favicon?: string
  siteName?: string
}

interface CacheEntry {
  data: UnfurlResult | null
  expiresAt: number
}

const CACHE_TTL_MS = 60 * 60 * 1000 // 1 hour
const FETCH_TIMEOUT_MS = 5_000
const MAX_HTML_BYTES = 1 * 1024 * 1024 // 1 MB

/**
 * SSRF guard: block private/loopback ranges so callers can't pivot the
 * server into the internal network via the unfurl endpoint.
 */
function isPrivateHost(hostname: string): boolean {
  const h = hostname.toLowerCase().trim()
  if (!h) return true
  if (h === 'localhost') return true
  if (h.endsWith('.localhost')) return true
  if (h === '0.0.0.0') return true

  // IPv6 loopback / link-local / unique-local
  if (h === '::1' || h === '[::1]') return true
  if (h.startsWith('fe80:') || h.startsWith('fc') || h.startsWith('fd')) return true

  // IPv4 numeric checks
  const m = h.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/)
  if (m) {
    const [a, b] = [parseInt(m[1], 10), parseInt(m[2], 10)]
    if (a === 10) return true                    // 10.0.0.0/8
    if (a === 127) return true                   // loopback
    if (a === 169 && b === 254) return true      // link-local
    if (a === 172 && b >= 16 && b <= 31) return true // 172.16/12
    if (a === 192 && b === 168) return true      // 192.168/16
    if (a === 0) return true                     // 0.0.0.0/8
  }
  return false
}

@Injectable()
export class UnfurlService {
  private readonly logger = new Logger(UnfurlService.name)
  private readonly cache = new Map<string, CacheEntry>()

  /**
   * Fetch metadata for a URL.
   * - Caches in-memory for 1h.
   * - Rejects non-http(s), private hosts, > 1MB bodies, > 5s.
   */
  async fetch(rawUrl: string): Promise<UnfurlResult> {
    const url = this.validateUrl(rawUrl)

    // Cache hit?
    const hit = this.cache.get(url)
    if (hit && hit.expiresAt > Date.now()) {
      if (hit.data) return hit.data
      // Negative cache → still throw so callers don't re-poll a known-bad URL.
      throw new NotFoundException('No metadata for URL')
    }

    try {
      const result = await unfurl(url, {
        timeout: FETCH_TIMEOUT_MS,
        follow: 3,
        size: MAX_HTML_BYTES,
        headers: {
          'user-agent': 'Mozilla/5.0 (compatible; YahdongUnfurlBot/1.0)',
          accept: 'text/html,application/xhtml+xml',
        },
      })

      const og = result.open_graph
      const twitter = result.twitter_card

      const ogImage = og?.images?.[0]?.url
      const twImage = twitter?.images?.[0]?.url
      const image = ogImage ?? twImage

      const title = og?.title ?? result.title
      const description = og?.description ?? twitter?.description ?? result.description
      const siteName = og?.site_name
      const favicon = result.favicon

      const data: UnfurlResult = {
        url,
        title: title?.trim() || undefined,
        description: description?.trim() || undefined,
        image: this.resolveAbsolute(image, url),
        favicon: this.resolveAbsolute(favicon, url),
        siteName: siteName?.trim() || undefined,
      }

      this.cache.set(url, { data, expiresAt: Date.now() + CACHE_TTL_MS })
      return data
    } catch (err) {
      this.logger.warn(`unfurl failed for ${url}: ${(err as Error).message}`)
      // Negative cache — short TTL (5 min) so we don't hammer broken hosts.
      this.cache.set(url, { data: null, expiresAt: Date.now() + 5 * 60 * 1000 })
      throw new NotFoundException('Could not fetch metadata for URL')
    }
  }

  private validateUrl(raw: string): string {
    if (!raw || typeof raw !== 'string') {
      throw new BadRequestException('url is required')
    }
    let parsed: URL
    try {
      parsed = new URL(raw)
    } catch {
      throw new BadRequestException('Invalid URL')
    }
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      throw new BadRequestException('Only http/https URLs are allowed')
    }
    if (isPrivateHost(parsed.hostname)) {
      throw new BadRequestException('Private/loopback URLs are not allowed')
    }
    // Strip fragment so cache keys don't fragment unnecessarily.
    parsed.hash = ''
    return parsed.toString()
  }

  private resolveAbsolute(maybeRelative: string | undefined, base: string): string | undefined {
    if (!maybeRelative) return undefined
    try {
      return new URL(maybeRelative, base).toString()
    } catch {
      return undefined
    }
  }
}
