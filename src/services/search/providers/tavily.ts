import { type SearchProvider, type SearchResult } from '../index'
import { getApiKey } from '../../../utils/secureStorage'

const TAVILY_ENDPOINT = 'https://api.tavily.com/search'

export const tavilyProvider = (): SearchProvider => ({
  id: 'tavily',
  displayName: 'Tavily',
  needsKey: true,
  async search(query: string, opts: { count?: number } = {}): Promise<SearchResult[]> {
    const count = typeof opts.count === 'number' ? opts.count : 5
    const key = await getApiKey('search-tavily')
    if (!key) throw new Error('Missing Tavily API key')

    const res = await fetch(TAVILY_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ api_key: key, query, max_results: count })
    })

    if (!res.ok) {
      throw new Error(`Tavily error: ${res.status} ${res.statusText}`)
    }

    const json = await res.json()
    const items: Array<any> = Array.isArray(json?.results) ? json.results : []
    return items.map((i) => ({
      title: i.title || i.url || 'Result',
      url: i.url || '',
      snippet: i.content || i.snippet || ''
    }))
  }
})


