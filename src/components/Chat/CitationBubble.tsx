import React from 'react'
import { ExternalLink, Sparkles } from 'lucide-react'

interface CitationBubbleProps {
  number: number
  url?: string
  domain?: string
  isInline?: boolean
  onClick?: () => void
}

export function CitationBubble({ number, url, domain, isInline = false, onClick }: CitationBubbleProps) {
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault()
    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer')
    }
    onClick?.()
  }

  if (isInline) {
    return (
      <button
        onClick={handleClick}
        className="citation-inline group relative inline-flex items-center justify-center"
        title={url ? `Source ${number}: ${domain || new URL(url).hostname}` : `Citation ${number}`}
      >
        <span className="citation-number">{number}</span>
        <div className="citation-sparkle">
          <Sparkles className="h-2.5 w-2.5" />
        </div>
      </button>
    )
  }

  return (
    <button
      onClick={handleClick}
      className="citation-source group"
      title={`Open ${domain || url || `Source ${number}`}`}
    >
      <div className="citation-source-number">
        {number}
      </div>
      <span className="citation-source-text">
        {domain || (url ? new URL(url).hostname.replace(/^www\./, '') : `Source ${number}`)}
      </span>
      <div className="citation-source-icon">
        <ExternalLink className="h-3 w-3" />
      </div>
    </button>
  )
}

interface CitationListProps {
  citations: Array<{
    number: number
    url: string
    domain?: string
  }>
}

export function CitationList({ citations }: CitationListProps) {
  if (!citations.length) return null

  return (
    <div className="citation-list">
      <div className="citation-list-grid">
        {citations.map(citation => (
          <CitationBubble
            key={citation.number}
            number={citation.number}
            url={citation.url}
            domain={citation.domain}
          />
        ))}
      </div>
    </div>
  )
}
