import { useTranslation } from 'react-i18next'

import {
  delayToneColor,
  type CurrentProxyCardModel,
} from '@/components/home/current-proxy-card-view'
import { collectMemberProtocols } from '@/components/proxy/proxy-group-meta'
import { FeaturedNodePanel } from '@/components/shared/featured-node-panel'
import { useFeaturedTraffic } from '@/hooks/use-featured-traffic'
import { getIpInfo } from '@/services/api'
import { useQuery } from '@/services/query-client'
import { memberDetails } from '@/types/proxy-view'
import { getCountryFlag } from '@/utils/country-flag'

const IP_INFO_CACHE_KEY = 'cv_ip_info_cache'

const formatHeroLatency = (text: string): string =>
  text.endsWith('ms') ? `${text.slice(0, -2)} ms` : text

export const HomeHeroCard = ({ model }: { model: CurrentProxyCardModel }) => {
  const { t } = useTranslation()
  const traffic = useFeaturedTraffic(48)
  const { data: ipInfo } = useQuery({
    queryKey: [IP_INFO_CACHE_KEY],
    queryFn: getIpInfo,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    retry: 1,
  })

  const member = model.currentMember
  const details = member ? memberDetails(member) : undefined
  const protocols = member ? collectMemberProtocols(member) : []
  const location =
    [ipInfo?.country, ipInfo?.city].filter(Boolean).join(' · ') ||
    t('home.components.ipInfo.labels.unknown')
  const delay = model.view.delay
  const alive = details?.alive === true
  const healthy = delay.kind === 'measured' && alive
  const statusLabel = healthy
    ? t('home.components.hero.healthy')
    : delay.kind === 'failure'
      ? t('proxies.page.labels.offline')
      : member
        ? t('proxies.page.labels.online')
        : undefined

  return (
    <FeaturedNodePanel
      variant="hero"
      nodeName={model.view.nodeName}
      protocols={protocols}
      location={location}
      ip={ipInfo?.ip}
      countryFlag={getCountryFlag(ipInfo?.country_code)}
      statusLabel={statusLabel}
      statusTone={healthy ? 'success' : 'neutral'}
      latencyText={formatHeroLatency(delay.text)}
      latencyColor={delayToneColor(delay.tone)}
      latencyLabel={t('proxies.page.labels.latency')}
      uploadText={traffic.uploadText}
      downloadText={traffic.downloadText}
      uploadLabel={t('home.components.hero.upload')}
      downloadLabel={t('home.components.hero.download')}
      upValues={traffic.upValues}
      downValues={traffic.downValues}
      empty={!member}
      emptyText={t('home.components.currentProxy.labels.noActiveNode')}
    />
  )
}
