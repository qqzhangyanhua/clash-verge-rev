import { Box } from '@mui/material'

import { TrafficSparkline } from '@/components/shared/traffic-sparkline'

export interface FeaturedNodePanelProps {
  variant?: 'compact' | 'hero'
  nodeName: string
  protocols: string[]
  location: string
  ip?: string
  countryFlag?: string
  statusLabel?: string
  statusTone?: 'success' | 'neutral'
  latencyText: string
  latencyColor?: string
  latencyLabel: string
  uploadText: string
  downloadText: string
  uploadLabel?: string
  downloadLabel?: string
  upValues: number[]
  downValues: number[]
  empty?: boolean
  emptyText?: string
}

const ProtocolChips = ({ chips }: { chips: string[] }) => {
  if (chips.length === 0) return null
  return (
    <div className="proxy-group-item__chips featured-node__chips">
      {chips.map((chip) => (
        <span key={chip} className="proto-chip">
          {chip}
        </span>
      ))}
    </div>
  )
}

export const FeaturedNodePanel = ({
  variant = 'compact',
  nodeName,
  protocols,
  location,
  ip,
  countryFlag,
  statusLabel,
  statusTone = 'neutral',
  latencyText,
  latencyColor,
  latencyLabel,
  uploadText,
  downloadText,
  uploadLabel,
  downloadLabel,
  upValues,
  downValues,
  empty = false,
  emptyText,
}: FeaturedNodePanelProps) => {
  const hero = variant === 'hero'
  const className = hero
    ? 'proxy-featured featured-node featured-node--hero'
    : 'proxy-featured featured-node'

  return (
    <section className={className}>
      <div className="proxy-featured__body">
        <div className="proxy-featured__identity">
          <div className="featured-node__title-row">
            <span className="featured-node__live-dot" data-tone={statusTone} />
            <h2 className="proxy-featured__name">{nodeName}</h2>
          </div>
          <ProtocolChips chips={protocols} />
          <div className="proxy-featured__meta featured-node__meta">
            {countryFlag && (
              <span className="featured-node__flag">{countryFlag}</span>
            )}
            <span>{location}</span>
            {ip ? <span className="featured-node__ip">{ip}</span> : null}
          </div>
        </div>
        {empty ? (
          <div className="proxy-featured__meta">{emptyText}</div>
        ) : (
          <div className="proxy-featured__metrics">
            {statusLabel && (
              <span className="featured-node__badge" data-tone={statusTone}>
                {statusLabel}
              </span>
            )}
            <div className="proxy-featured__latency">
              <Box
                className="proxy-featured__latency-value"
                sx={{ color: latencyColor || 'success.main' }}
              >
                {latencyText}
              </Box>
              <div className="proxy-featured__latency-label">
                {latencyLabel}
              </div>
            </div>
            <div className="proxy-featured__speeds">
              <div className="featured-node__rate">
                <span className="featured-node__rate-value">
                  ↑ {uploadText}
                </span>
                {uploadLabel && (
                  <span className="featured-node__rate-label">
                    {uploadLabel}
                  </span>
                )}
              </div>
              <div className="featured-node__rate">
                <span className="featured-node__rate-value">
                  ↓ {downloadText}
                </span>
                {downloadLabel && (
                  <span className="featured-node__rate-label">
                    {downloadLabel}
                  </span>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
      <div className="proxy-featured__spark">
        <TrafficSparkline
          upValues={upValues}
          downValues={downValues}
          width={hero ? 640 : 320}
          height={hero ? 132 : 52}
          variant={hero ? 'chart' : 'line'}
        />
      </div>
    </section>
  )
}
