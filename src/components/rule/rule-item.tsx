import { useState } from 'react'
import { Rule } from 'tauri-plugin-mihomo-api'

interface Props {
  value: Rule & { lineNo: number }
}

const ruleType = (value: Rule) =>
  typeof value.type === 'string' ? value.type : value.type.Unknown

const RuleItem = ({ value }: Props) => {
  const type = ruleType(value)
  const target = value.payload || '—'
  const [selected, setSelected] = useState(false)

  return (
    <div className="rule-row">
      <div
        className={`rule-row__card${selected ? ' is-selected' : ''}`}
        onClick={() => setSelected((current) => !current)}
      >
        <span className="rule-row__index">{value.lineNo}</span>
        <div className="rule-row__body">
          <span className="rule-row__target" title={target}>
            {target}
          </span>
          <span className="proto-chip">{type}</span>
        </div>
        <span className="rule-row__action" data-action={value.proxy}>
          {value.proxy}
        </span>
      </div>
    </div>
  )
}

export default RuleItem
