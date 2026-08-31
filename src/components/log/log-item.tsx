import type { ReactNode } from 'react'

import type { SearchState } from '@/components/base'

interface Props {
  value: ILogItem
  searchState?: SearchState
}

const highlightText = (text: string, searchState?: SearchState): ReactNode => {
  if (!searchState?.text.trim()) return text

  try {
    const searchText = searchState.text
    let pattern: string

    if (searchState.useRegularExpression) {
      try {
        new RegExp(searchText)
        pattern = searchText
      } catch {
        pattern = searchText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      }
    } else {
      const escaped = searchText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      pattern = searchState.matchWholeWord ? `\\b${escaped}\\b` : escaped
    }

    const flags = searchState.matchCase ? 'g' : 'gi'
    const regex = new RegExp(pattern, flags)
    const elements: ReactNode[] = []
    let lastIndex = 0
    let match: RegExpExecArray | null

    while ((match = regex.exec(text)) !== null) {
      const start = match.index
      const matchText = match[0]

      if (matchText === '') {
        regex.lastIndex += 1
        continue
      }

      if (start > lastIndex) {
        elements.push(text.slice(lastIndex, start))
      }

      elements.push(
        <span key={`highlight-${start}`} className="highlight">
          {matchText}
        </span>,
      )

      lastIndex = start + matchText.length
    }

    if (lastIndex < text.length) {
      elements.push(text.slice(lastIndex))
    }

    return elements.length ? elements : text
  } catch {
    return text
  }
}

const LogItem = ({ value, searchState }: Props) => (
  <div className="log-row">
    <span className="log-row__time">
      {highlightText(value.time || '', searchState)}
    </span>
    <span className="log-level" data-type={value.type.toLowerCase()}>
      {highlightText(value.type, searchState)}
    </span>
    <span className="log-row__data">
      {highlightText(value.payload, searchState)}
    </span>
  </div>
)

export default LogItem
