import { Box } from '@mui/material'
import { useId, useMemo } from 'react'

import parseTraffic from '@/utils/parse-traffic'
import { formatTrafficName } from '@/utils/traffic-sampler'

const DEFAULT_WIDTH = 120
const DEFAULT_HEIGHT = 36

const toSparklinePath = (
  values: number[],
  max: number,
  width: number,
  height: number,
  pad: number,
): string => {
  if (values.length < 2) return ''

  const plotWidth = width - pad * 2
  const plotHeight = height - pad * 2

  return values
    .map((value, index) => {
      const x = pad + (index / (values.length - 1)) * plotWidth
      const y = pad + plotHeight - (value / max) * plotHeight
      return `${index === 0 ? 'M' : 'L'}${x.toFixed(1)} ${y.toFixed(1)}`
    })
    .join(' ')
}

const toAreaPath = (
  linePath: string,
  values: number[],
  width: number,
  height: number,
  pad: number,
): string => {
  if (!linePath || values.length < 2) return ''
  const lastX = pad + (width - pad * 2)
  return `${linePath} L${lastX.toFixed(1)} ${(height - pad).toFixed(1)} L${pad.toFixed(1)} ${(height - pad).toFixed(1)} Z`
}

export interface TrafficSparklineProps {
  upValues: number[]
  downValues: number[]
  width?: number
  height?: number
  className?: string
  variant?: 'line' | 'chart'
}

export const TrafficSparkline = ({
  upValues,
  downValues,
  width = DEFAULT_WIDTH,
  height = DEFAULT_HEIGHT,
  className,
  variant = 'line',
}: TrafficSparklineProps) => {
  const reactId = useId().replaceAll(':', '')
  const upGradientId = `traffic-up-${reactId}`
  const downGradientId = `traffic-down-${reactId}`
  const upFillId = `traffic-up-fill-${reactId}`
  const downFillId = `traffic-down-fill-${reactId}`
  const chart = variant === 'chart'
  const pad = chart ? 22 : 1
  const max = Math.max(...upValues, ...downValues, 1)
  const upPath = toSparklinePath(upValues, max, width, height, pad)
  const downPath = toSparklinePath(downValues, max, width, height, pad)
  const upArea = chart ? toAreaPath(upPath, upValues, width, height, pad) : ''
  const downArea = chart
    ? toAreaPath(downPath, downValues, width, height, pad)
    : ''

  const yTicks = useMemo(() => {
    if (!chart) return []
    const [mid, midUnit] = parseTraffic(max / 2)
    const [top, topUnit] = parseTraffic(max)
    return [
      { y: pad, label: `${top} ${topUnit}/s` },
      { y: pad + (height - pad * 2) / 2, label: `${mid} ${midUnit}/s` },
      { y: height - pad, label: '0' },
    ]
  }, [chart, height, max, pad])

  const xTicks = useMemo(() => {
    if (!chart || upValues.length < 2) return []
    const now = Date.now()
    const start = now - (upValues.length - 1) * 1000
    return [0, 0.5, 1].map((ratio) => {
      const x = pad + ratio * (width - pad * 2)
      const timestamp = start + ratio * (now - start)
      return { x, label: formatTrafficName(timestamp).slice(0, 5) }
    })
  }, [chart, pad, upValues.length, width])

  return (
    <Box
      component="svg"
      className={className}
      viewBox={`0 0 ${width} ${height}`}
      aria-hidden
      sx={{
        width: '100%',
        height,
        display: 'block',
      }}
    >
      <defs>
        <linearGradient id={upGradientId} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="var(--traffic-up)" />
          <stop offset="100%" stopColor="var(--primary-main)" />
        </linearGradient>
        <linearGradient id={downGradientId} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="var(--traffic-down)" />
          <stop offset="100%" stopColor="var(--traffic-up)" />
        </linearGradient>
        <linearGradient id={upFillId} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="var(--traffic-up)" stopOpacity="0.28" />
          <stop offset="100%" stopColor="var(--traffic-up)" stopOpacity="0" />
        </linearGradient>
        <linearGradient id={downFillId} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop
            offset="0%"
            stopColor="var(--traffic-down)"
            stopOpacity="0.22"
          />
          <stop offset="100%" stopColor="var(--traffic-down)" stopOpacity="0" />
        </linearGradient>
      </defs>
      {chart &&
        yTicks.map((tick) => (
          <g key={`y-${tick.label}`}>
            <line
              x1={pad}
              x2={width - 4}
              y1={tick.y}
              y2={tick.y}
              stroke="var(--divider-color)"
              strokeDasharray="3 5"
            />
            <text
              x={4}
              y={tick.y + 3}
              fill="var(--text-secondary)"
              fontSize="8"
            >
              {tick.label}
            </text>
          </g>
        ))}
      {chart &&
        xTicks.map((tick) => (
          <text
            key={`x-${tick.label}-${tick.x}`}
            x={tick.x}
            y={height - 4}
            fill="var(--text-secondary)"
            fontSize="8"
            textAnchor="middle"
          >
            {tick.label}
          </text>
        ))}
      {downArea && <path d={downArea} fill={`url(#${downFillId})`} />}
      {upArea && <path d={upArea} fill={`url(#${upFillId})`} />}
      {upPath && (
        <path
          d={upPath}
          fill="none"
          stroke={`url(#${upGradientId})`}
          strokeWidth={chart ? 2.2 : 1.8}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      )}
      {downPath && (
        <path
          d={downPath}
          fill="none"
          stroke={`url(#${downGradientId})`}
          strokeWidth={chart ? 2.2 : 1.8}
          strokeLinejoin="round"
          strokeLinecap="round"
          opacity={0.9}
        />
      )}
    </Box>
  )
}
