// Helper function to extract citations from text
export function extractCitations(text: string): { text: string; citations: any[] } {
  const citationRegex = /\[(\d+)\]\(([^)]+)\)/g
  const citationsMap = new Map<number, { url: string; domain: string }>()
  let match

  while ((match = citationRegex.exec(text)) !== null) {
    const number = parseInt(match[1], 10)
    const url = match[2]

    if (!citationsMap.has(number)) {
      try {
        const domain = new URL(url).hostname.replace(/^www\./, '')
        citationsMap.set(number, { url, domain })
      } catch (error) {
        console.warn(`Invalid URL found in citation: ${url}`, error)
      }
    }
  }

  const finalCitations = Array.from(citationsMap.entries())
    .map(([number, { url, domain }]) => ({
      number,
      url,
      domain,
    }))
    .sort((a, b) => a.number - b.number)

  return {
    text: text,
    citations: finalCitations,
  }
}