// Where the adhkar come from: the remote list, a daily cache in $.store,
// and a small fallback list. Nothing here throws: every path ends in a list.
import type { Hook } from 'claude-code'

type Engine = Parameters<Hook<'session.start'>>[0]

/** Tried in order. The first is where the file lives now (the repo was renamed). */
export const SOURCE_URLS = [
  'https://raw.githubusercontent.com/nawafalqari/ayah/main/src/data/adkar.json',
  'https://raw.githubusercontent.com/nawafalqari/azkar-api/main/azkar.json',
]

/** Refresh the cache once it is this old. */
export const MAX_AGE_MS = 24 * 60 * 60 * 1000

/** Shown when there is no network and no cache yet. The user's own list, verbatim. */
export const FALLBACK = [
  'سبحان الله وبحمده',
  'أستغفر الله',
  'لا حول ولا قوة إلا بالله',
  'اللهم صلِّ على محمد',
]

const CACHE_KEY = 'cache'

type Cache = { fetchedAt: number; url: string; items: string[] }

/** Every `content` string in the source file, each once, outer spaces trimmed. */
export function parseAzkar(text: string): string[] {
  const data: unknown = JSON.parse(text)
  if (data === null || typeof data !== 'object') return []
  const seen = new Set<string>()
  for (const group of Object.values(data as Record<string, unknown>)) {
    if (!Array.isArray(group)) continue
    for (const item of group) {
      const content = (item as { content?: unknown } | null)?.content
      if (typeof content === 'string' && content.trim() !== '') seen.add(content.trim())
    }
  }
  return [...seen]
}

function isCache(v: unknown): v is Cache {
  const c = v as Cache | null
  return (
    !!c && typeof c.fetchedAt === 'number' && Array.isArray(c.items) &&
    c.items.length > 0 && c.items.every(s => typeof s === 'string')
  )
}

async function fetchRemote($: Engine): Promise<Cache | null> {
  for (const url of SOURCE_URLS) {
    try {
      const res = await $.http.fetch(url)
      if (!res.ok) continue
      const items = parseAzkar(res.text)
      if (items.length > 0) return { fetchedAt: await $.clock.now(), url, items }
    } catch {
      // offline or refused: try the next URL, then fall back
    }
  }
  return null
}

/**
 * The full list to choose from: the cache when it is fresh; else a new fetch,
 * saved; else the stale cache; else FALLBACK.
 */
export async function loadAzkar($: Engine, opts: { force?: boolean } = {}): Promise<string[]> {
  let cached: Cache | null = null
  try {
    const v = await $.store.get(CACHE_KEY)
    if (isCache(v)) cached = v
  } catch {}

  const now = await $.clock.now()
  if (cached && !opts.force && now - cached.fetchedAt < MAX_AGE_MS) return cached.items

  const fresh = await fetchRemote($)
  if (fresh) {
    try { await $.store.set(CACHE_KEY, fresh) } catch {}
    return fresh.items
  }
  return cached ? cached.items : FALLBACK
}
