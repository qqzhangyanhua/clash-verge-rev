import { useTranslation } from 'react-i18next'

import { FeaturedNodePanel } from '@/components/shared/featured-node-panel'
import { useFeaturedTraffic } from '@/hooks/use-featured-traffic'
import { useProxyDelayState } from '@/hooks/use-proxy-delay-state'
import { getIpInfo } from '@/services/api'
import delayManager from '@/services/delay'
import { useQuery } from '@/services/query-client'
import {
  findCurrentGroupMember,
  type ProxyGroupView,
  type ProxyViewV1,
  type ResolvedProxyMember,
} from '@/types/proxy-view'
import { getCountryFlag } from '@/utils/country-flag'

const IP_INFO_CACHE_KEY = 'cv_ip_info_cache'

const FeaturedDelayPanel = ({
  member,
  groupName,
  nodeName,
  protocols,
  location,
  ip,
  countryFlag,
  uploadText,
  downloadText,
  upValues,
  downValues,
}: {
  member: ResolvedProxyMember
  groupName: string
  nodeName: string
  protocols: string[]
  location: string
  ip?: string
  countryFlag?: string
  uploadText: string
  downloadText: string
  upValues: number[]
  downValues: number[]
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
    <FeaturedNodePanel
      nodeName={nodeName}
      protocols={protocols}
      location={location}
      ip={ip}
      countryFlag={countryFlag}
      latencyText={delayText}
      latencyColor={delayColor}
      latencyLabel={t('proxies.page.labels.latency')}
      uploadText={uploadText}
      downloadText={downloadText}
      upValues={upValues}
      downValues={downValues}
    />
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
  const traffic = useFeaturedTraffic(48)
  const nodeName = current?.member.ref.name ?? group.now ?? group.name
  const location =
    [ipInfo?.country, ipInfo?.city].filter(Boolean).join(' · ') ||
    t('home.components.ipInfo.labels.unknown')
  const countryFlag = getCountryFlag(ipInfo?.country_code)

  if (!current) {
    return (
      <FeaturedNodePanel
        nodeName={nodeName}
        protocols={protocols}
        location={location}
        ip={ipInfo?.ip}
        countryFlag={countryFlag}
        latencyText="—"
        latencyLabel={t('proxies.page.labels.latency')}
        uploadText={traffic.uploadText}
        downloadText={traffic.downloadText}
        upValues={traffic.upValues}
        downValues={traffic.downValues}
        empty
        emptyText={t('home.components.currentProxy.labels.noActiveNode')}
      />
    )
  }

  return (
    <FeaturedDelayPanel
      member={current.member}
      groupName={group.name}
      nodeName={nodeName}
      protocols={protocols}
      location={location}
      ip={ipInfo?.ip}
      countryFlag={countryFlag}
      uploadText={traffic.uploadText}
      downloadText={traffic.downloadText}
      upValues={traffic.upValues}
      downValues={traffic.downValues}
    />
  )
}
