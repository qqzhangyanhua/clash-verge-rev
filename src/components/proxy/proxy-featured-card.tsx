import { Box } from '@mui/material'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'

import { TrafficSparkline } from '@/components/shared/traffic-sparkline'
import { useProxyDelayState } from '@/hooks/use-proxy-delay-state'
import { useTrafficData } from '@/hooks/use-traffic-data'
import { useTrafficMonitorEnhanced } from '@/hooks/use-traffic-monitor'
import { useVisibility } from '@/hooks/use-visibility'
import { getIpInfo } from '@/services/api'
import delayManager from '@/services/delay'
import { useQuery } from '@/services/query-client'
import {
  findCurrentGroupMember,
  type ProxyGroupView,
  type ProxyViewV1,
  type ResolvedProxyMember,
} from '@/types/proxy-view'
import parseTraffic from '@/utils/parse-traffic'

const SPARKLINE_POINT_COUNT = 48
const IP_INFO_CACHE_KEY = 'cv_ip_info_cache'

const ProtocolChips = ({ chips }: { chips: string[] }) => {
  if (chips.length === 0) return null
  return (
    <Box className="proxy-group-item__chips" sx={{ mt: 0.75 }}>
      {chips.map((chip) => (
        <span key={chip} className="proto-chip">
          {chip}
        </span>
      ))}
    </Box>
  )
}

const FeaturedMetrics = ({
  member,
  groupName,
}: {
  member: ResolvedProxyMember
  groupName: string
}) => {
  const { t } = useTranslation()
  const { delayValue, timeout } = useProxyDelayState(member, groupName)

  const delayText =
    delayValue > 0 ? delayManager.formatDelay(delayValue, timeout) : '—'
  const delayColor =
    delayValue > 0
      ? delayManager.formatDelayColor(delayValue, timeout)
      : 'text.secondary'

  return (
    <div className="proxy-featured__metrics">
      <div className="proxy-featured__latency">
        <Box
          className="proxy-featured__latency-value"
          sx={{ color: delayColor }}
        >
          {delayText}
        </Box>
        <div className="proxy-featured__latency-label">
          {t('proxies.page.labels.latency')}
        </div>
      </div>
      <FeaturedSpeeds />
    </div>
  )
}

const FeaturedSpeeds = () => {
  const pageVisible = useVisibility()
  const {
    response: { data: traffic },
  } = useTrafficData({ enabled: pageVisible })
  const [up, upUnit] = parseTraffic(traffic?.up || 0)
  const [down, downUnit] = parseTraffic(traffic?.down || 0)

  return (
    <div className="proxy-featured__speeds">
      <span>
        ↑ {up} {upUnit}/s
      </span>
      <span>
        ↓ {down} {downUnit}/s
      </span>
    </div>
  )
}

const FeaturedSparkline = () => {
  const pageVisible = useVisibility()
  const { graphData } = useTrafficMonitorEnhanced({
    subscribe: true,
    enabled: pageVisible,
  })
  const sparklinePoints = useMemo(() => {
    const points = graphData.dataPoints.slice(-SPARKLINE_POINT_COUNT)
    return {
      upValues: points.map((point) => point.up),
      downValues: points.map((point) => point.down),
    }
  }, [graphData.dataPoints])

  return (
    <div className="proxy-featured__spark">
      <TrafficSparkline
        upValues={sparklinePoints.upValues}
        downValues={sparklinePoints.downValues}
        width={320}
        height={52}
      />
    </div>
  )
}

interface ProxyFeaturedCardProps {
  group: ProxyGroupView
  proxyView: ProxyViewV1
  protocols: string[]
}

export const ProxyFeaturedCard = ({
  group,
  proxyView,
  protocols,
}: ProxyFeaturedCardProps) => {
  const { t } = useTranslation()
  const current = findCurrentGroupMember(proxyView, group)
  const { data: ipInfo } = useQuery({
    queryKey: [IP_INFO_CACHE_KEY],
    queryFn: getIpInfo,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    retry: 1,
  })

  const nodeName = current?.member.ref.name ?? group.now ?? group.name
  const location =
    [ipInfo?.country, ipInfo?.city].filter(Boolean).join(' · ') ||
    t('home.components.ipInfo.labels.unknown')
  const ip = ipInfo?.ip

  return (
    <section className="proxy-featured">
      <div className="proxy-featured__body">
        <div className="proxy-featured__identity">
          <h2 className="proxy-featured__name">{nodeName}</h2>
          <ProtocolChips chips={protocols} />
          <div className="proxy-featured__meta">
            {location}
            {ip ? `  ·  ${ip}` : ''}
          </div>
        </div>
        {current ? (
          <FeaturedMetrics member={current.member} groupName={group.name} />
        ) : (
          <div className="proxy-featured__meta">
            {t('home.components.currentProxy.labels.noActiveNode')}
          </div>
        )}
      </div>
      <FeaturedSparkline />
    </section>
  )
}
