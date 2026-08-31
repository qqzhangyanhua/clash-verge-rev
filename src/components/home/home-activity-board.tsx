import { Box } from '@mui/material'
import { type ReactNode, useMemo } from 'react'
import { useTranslation } from 'react-i18next'

import type { CurrentProxyCardModel } from '@/components/home/current-proxy-card-view'
import { TrafficSparkline } from '@/components/shared/traffic-sparkline'
import { useConnectionData } from '@/hooks/use-connection-data'
import { useFeaturedTraffic } from '@/hooks/use-featured-traffic'
import { useVisibility } from '@/hooks/use-visibility'
import parseTraffic from '@/utils/parse-traffic'

const isDirectChain = (chains: string[]) => {
  const hop = chains[0] ?? ''
  return hop === 'DIRECT' || hop === '直连'
}

const ActivityMetric = ({
  label,
  value,
  unit,
  hint,
  children,
}: {
  label: string
  value: string
  unit?: string
  hint?: string
  children?: ReactNode
}) => (
  <article className="activity-metric">
    <div className="activity-metric__label">{label}</div>
    <div className="activity-metric__value">
      {value}
      {unit ? <span className="activity-metric__unit">{unit}</span> : null}
    </div>
    {hint ? <div className="activity-metric__hint">{hint}</div> : null}
    {children}
  </article>
)

const TrafficHistory = ({ values }: { values: number[] }) => {
  const max = Math.max(...values, 1)
  const width = Math.max(values.length * 6, 120)
  const path = values.reduce((d, value, offset) => {
    const height = Math.max(4, (value / max) * 68)
    const x = offset * 6
    const y = 72 - height
    return `${d}M${x} ${y}h4v${height}h-4z`
  }, '')
  return (
    <svg
      className="activity-history__bars"
      viewBox={`0 0 ${width} 72`}
      aria-hidden
    >
      <path d={path} fill="var(--traffic-down)" opacity="0.55" />
    </svg>
  )
}

export const HomeActivityBoard = ({
  model,
}: {
  model: CurrentProxyCardModel
}) => {
  const { t } = useTranslation()
  const pageVisible = useVisibility()
  const traffic = useFeaturedTraffic(36)
  const {
    response: { data: connections },
  } = useConnectionData({ enabled: pageVisible })

  const delay = model.view.delay
  const latencyValue =
    delay.kind === 'measured' ? delay.text.replace('ms', '').trim() : delay.text
  const latencyUnit = delay.kind === 'measured' ? 'ms' : undefined

  const activeCount = connections.activeConnections.length
  const split = useMemo(() => {
    const rows = connections.activeConnections
    let direct = 0
    let proxy = 0
    for (const row of rows) {
      const bytes = row.download + row.upload
      if (isDirectChain(row.chains)) {
        direct += bytes
      } else {
        proxy += bytes
      }
    }
    const total = direct + proxy
    return {
      direct,
      proxy,
      directPct: total > 0 ? Math.round((direct / total) * 100) : 0,
      proxyPct: total > 0 ? Math.round((proxy / total) * 100) : 0,
      directText: parseTraffic(direct).join(' '),
      proxyText: parseTraffic(proxy).join(' '),
    }
  }, [connections.activeConnections])

  const history = traffic.downValues.length > 0 ? traffic.downValues : [0, 0]

  return (
    <div className="activity-board">
      <div className="activity-board__metrics">
        <ActivityMetric
          label={t('proxies.page.labels.latency')}
          value={latencyValue}
          unit={latencyUnit}
          hint={model.view.nodeName}
        />
        <ActivityMetric
          label={t('connections.components.actions.active')}
          value={String(activeCount)}
          hint={t('connections.page.title')}
        />
        <ActivityMetric
          label={t('home.components.hero.upload')}
          value={String(traffic.up)}
          unit={`${traffic.upUnit}/s`}
        >
          <TrafficSparkline
            upValues={traffic.upValues}
            downValues={[]}
            height={28}
            variant="line"
          />
        </ActivityMetric>
        <ActivityMetric
          label={t('home.components.hero.download')}
          value={String(traffic.down)}
          unit={`${traffic.downUnit}/s`}
        >
          <TrafficSparkline
            upValues={[]}
            downValues={traffic.downValues}
            height={28}
            variant="line"
          />
        </ActivityMetric>
      </div>

      <div className="activity-board__lower">
        <article className="activity-split">
          <div className="activity-metric__label">
            {t('home.components.traffic.title')}
          </div>
          <div className="activity-split__row">
            <span>{t('home.components.clashMode.labels.direct')}</span>
            <span>{split.directText}</span>
          </div>
          <div className="activity-split__track">
            <span
              className="activity-split__fill activity-split__fill--direct"
              style={{ width: `${split.directPct}%` }}
            />
          </div>
          <div className="activity-split__row">
            <span>{t('home.components.currentProxy.labels.proxy')}</span>
            <span>{split.proxyText}</span>
          </div>
          <div className="activity-split__track">
            <span
              className="activity-split__fill activity-split__fill--proxy"
              style={{ width: `${Math.max(split.proxyPct, 4)}%` }}
            />
          </div>
        </article>

        <article className="activity-history">
          <div className="activity-metric__label">
            {t('home.components.traffic.metrics.downloadSpeed')}
          </div>
          <Box sx={{ mt: 1.5 }}>
            <TrafficHistory values={history} />
          </Box>
        </article>
      </div>
    </div>
  )
}
