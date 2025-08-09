import { getApiKey } from '../../utils/secureStorage'

export interface SearchResult {
  title: string
  url: string
  snippet: string
}

export interface SearchProvider {
  id: string
  displayName: string
  needsKey: boolean
  search: (query: string, opts?: { count?: number }) => Promise<SearchResult[]>
}

export function sanitizeSnippet(text: string): string {
  if (!text) return ''
  // Strip rudimentary HTML and collapse whitespace
  const withoutTags = text.replace(/<[^>]*>/g, ' ')
  return withoutTags.replace(/\s+/g, ' ').trim().slice(0, 400)
}

export function formatResultsForPrompt(results: SearchResult[], now: Date = new Date()): string {
  const header = `Web results (as of ${now.toISOString().slice(0, 10)}):`
  const body = results.slice(0, 5).map((r, i) => {
    const safeSnippet = sanitizeSnippet(r.snippet)
    return `(${i + 1}) ${r.title}\n${r.url}\n${safeSnippet}`
  }).join('\n\n')
  return `${header}\n${body}\n\nUse these sources to answer and cite with [n].`
}

// Lazy import providers to avoid circular deps
async function getTavilyProvider(): Promise<SearchProvider> {
  const mod = await import('./providers/tavily')
  return mod.tavilyProvider()
}

async function getDuckIaProvider(): Promise<SearchProvider> {
  const mod = await import('./providers/duckIa')
  return mod.duckIaProvider()
}

/**
 * Default provider selection for Option 1:
 * - Use Tavily if an API key exists in secure storage under 'search-tavily'
 * - Otherwise fall back to DuckDuckGo Instant Answer (no key required)
 */
export async function getDefaultSearchProvider(): Promise<SearchProvider> {
  const tavilyKey = await getApiKey('search-tavily')
  if (tavilyKey && tavilyKey.trim() !== '') {
    return getTavilyProvider()
  }
  return getDuckIaProvider()
}


