import {
  ArrowDownwardRounded,
  ArrowUpwardRounded,
  CloudDownloadRounded,
  CloudUploadRounded,
} from '@mui/icons-material'
import { Box, Typography, useTheme } from '@mui/material'
import { type ReactNode, useMemo } from 'react'
import { useTranslation } from 'react-i18next'

import { TrafficErrorBoundary } from '@/components/shared/traffic-error-boundary'
import { useTrafficData } from '@/hooks/use-traffic-data'
import { useTrafficMonitorEnhanced } from '@/hooks/use-traffic-monitor'
import { useVerge } from '@/hooks/use-verge'
import { useVisibility } from '@/hooks/use-visibility'
import parseTraffic from '@/utils/parse-traffic'

const SPARKLINE_WIDTH = 120
const SPARKLINE_HEIGHT = 36
const SPARKLINE_POINT_COUNT = 60

const toSparklinePath = (values: number[], max: number): string => {
  if (values.length < 2) return ''

  const pad = 1
  const plotWidth = SPARKLINE_WIDTH - pad * 2
  const plotHeight = SPARKLINE_HEIGHT - pad * 2

  return values
    .map((value, index) => {
      const x = pad + (index / (values.length - 1)) * plotWidth
      const y = pad + plotHeight - (value / max) * plotHeight
      return `${index === 0 ? 'M' : 'L'}${x.toFixed(1)} ${y.toFixed(1)}`
    })
    .join(' ')
}

const TrafficSparkline = ({
  upValues,
  downValues,
}: {
  upValues: number[]
  downValues: number[]
}) => {
  const theme = useTheme()
  const max = Math.max(...upValues, ...downValues, 1)
  const upPath = toSparklinePath(upValues, max)
  const downPath = toSparklinePath(downValues, max)

  return (
    <Box
      component="svg"
      viewBox={`0 0 ${SPARKLINE_WIDTH} ${SPARKLINE_HEIGHT}`}
      aria-hidden
      sx={{
        width: SPARKLINE_WIDTH,
        height: SPARKLINE_HEIGHT,
        flexShrink: 0,
      }}
    >
      {upPath && (
        <path
          d={upPath}
          fill="none"
          stroke={theme.palette.secondary.main}
          strokeWidth="1.5"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      )}
      {downPath && (
        <path
          d={downPath}
          fill="none"
          stroke={theme.palette.primary.main}
          strokeWidth="1.5"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      )}
    </Box>
  )
}

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
    aria-label={`${label} ${value} ${unit}`.trim()}
    sx={{
      display: 'flex',
      alignItems: 'center',
      gap: 0.75,
      minWidth: 0,
    }}
  >
    <Box
      sx={{
        display: 'flex',
        color: 'text.secondary',
        '& .MuiSvgIcon-root': { fontSize: 16 },
      }}
    >
      {icon}
    </Box>
    <Typography
      variant="body2"
      sx={{ fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}
    >
      {value}
    </Typography>
    <Typography variant="caption" color="text.secondary" noWrap>
      {unit}
    </Typography>
  </Box>
)

export const HomeTrafficRow = () => {
  const { t } = useTranslation()
  const { verge } = useVerge()
  const pageVisible = useVisibility()
  const trafficGraph = verge?.traffic_graph ?? true

  const {
    response: { data: traffic },
  } = useTrafficData({ enabled: pageVisible })

  const { graphData } = useTrafficMonitorEnhanced({
    subscribe: trafficGraph,
    enabled: pageVisible && trafficGraph,
  })

  const parsed = useMemo(() => {
    const [up, upUnit] = parseTraffic(traffic?.up || 0)
    const [down, downUnit] = parseTraffic(traffic?.down || 0)
    const [uploadTotal, uploadTotalUnit] = parseTraffic(traffic?.upTotal || 0)
    const [downloadTotal, downloadTotalUnit] = parseTraffic(
      traffic?.downTotal || 0,
    )

    return {
      up,
      upUnit,
      down,
      downUnit,
      uploadTotal,
      uploadTotalUnit,
      downloadTotal,
      downloadTotalUnit,
    }
  }, [traffic])

  const sparklinePoints = useMemo(() => {
    const points = graphData.dataPoints.slice(-SPARKLINE_POINT_COUNT)
    return {
      upValues: points.map((point) => point.up),
      downValues: points.map((point) => point.down),
    }
  }, [graphData.dataPoints])

  return (
    <TrafficErrorBoundary
      onError={(error, errorInfo) => {
        console.error('[HomeTrafficRow] 组件错误:', error, errorInfo)
      }}
    >
      <Box className="home-console__row">
        {trafficGraph && (
          <TrafficSparkline
            upValues={sparklinePoints.upValues}
            downValues={sparklinePoints.downValues}
          />
        )}

        <Box
          sx={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            gap: { xs: 1.5, sm: 2.5 },
            minWidth: 0,
            flex: 1,
          }}
        >
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
