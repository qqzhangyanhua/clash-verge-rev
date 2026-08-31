import {
  ArrowDownwardRounded,
  ArrowUpwardRounded,
  CloudDownloadRounded,
  CloudUploadRounded,
} from '@mui/icons-material'
import { Box, Typography } from '@mui/material'
import { type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'

import { TrafficErrorBoundary } from '@/components/shared/traffic-error-boundary'
import { useFeaturedTraffic } from '@/hooks/use-featured-traffic'

const TrafficMetric = ({
  icon,
  label,
  value,
  unit,
}: {
  icon: ReactNode
  label: string
  value: string | number
  unit: string
}) => (
  <Box
    className="home-traffic__metric"
    aria-label={`${label} ${value} ${unit}`.trim()}
  >
    <Box className="home-traffic__metric-icon">{icon}</Box>
    <Box className="home-traffic__metric-copy">
      <Typography className="home-traffic__metric-value">
        {value}
        <Typography component="span" className="home-traffic__metric-unit">
          {unit}
        </Typography>
      </Typography>
      <Typography className="home-traffic__metric-label">{label}</Typography>
    </Box>
  </Box>
)

export const HomeTrafficRow = () => {
  const { t } = useTranslation()
  const parsed = useFeaturedTraffic(48)

  return (
    <TrafficErrorBoundary
      onError={(error, errorInfo) => {
        console.error('[HomeTrafficRow] 组件错误:', error, errorInfo)
      }}
    >
      <Box className="home-module home-traffic">
        <Typography className="home-module__title">
          {t('home.components.traffic.title')}
        </Typography>
        <Box className="home-traffic__grid">
          <TrafficMetric
            icon={<ArrowUpwardRounded />}
            label={t('home.components.traffic.metrics.uploadSpeed')}
            value={parsed.up}
            unit={`${parsed.upUnit}/s`}
          />
          <TrafficMetric
            icon={<ArrowDownwardRounded />}
            label={t('home.components.traffic.metrics.downloadSpeed')}
            value={parsed.down}
            unit={`${parsed.downUnit}/s`}
          />
          <TrafficMetric
            icon={<CloudUploadRounded />}
            label={t('shared.labels.uploaded')}
            value={parsed.uploadTotal}
            unit={parsed.uploadTotalUnit}
          />
          <TrafficMetric
            icon={<CloudDownloadRounded />}
            label={t('shared.labels.downloaded')}
            value={parsed.downloadTotal}
            unit={parsed.downloadTotalUnit}
          />
        </Box>
      </Box>
    </TrafficErrorBoundary>
  )
}
