import { type SearchProvider, type SearchResult } from '../index'

export const duckIaProvider = (): SearchProvider => ({
  id: 'duck-ia',
  displayName: 'DuckDuckGo Instant Answer',
  needsKey: false,
  async search(query: string, opts: { count?: number } = {}): Promise<SearchResult[]> {
    const count = typeof opts.count === 'number' ? opts.count : 5
    const url = `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`
    const res = await fetch(url)
    if (!res.ok) throw new Error(`DuckDuckGo error: ${res.status} ${res.statusText}`)
    const json = await res.json()

    const results: SearchResult[] = []
    if (json.AbstractText || json.AbstractURL) {
      results.push({
        title: json.Heading || 'Result',
        url: json.AbstractURL || '',
        snippet: json.AbstractText || ''
      })
    }

    const related = Array.isArray(json.RelatedTopics) ? json.RelatedTopics : []
    for (const r of related) {
      if (r.Text && r.FirstURL) {
        results.push({ title: r.Text, url: r.FirstURL, snippet: r.Text })
      }
      if (Array.isArray(r.Topics)) {
        for (const t of r.Topics) {
          if (t.Text && t.FirstURL) {
            results.push({ title: t.Text, url: t.FirstURL, snippet: t.Text })
          }
          if (results.length >= count) break
        }
      }
      if (results.length >= count) break
    }

    return results.slice(0, count)
  }
})


