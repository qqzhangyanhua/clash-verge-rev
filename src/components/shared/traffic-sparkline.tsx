import { Box } from '@mui/material'
import { useId } from 'react'

const DEFAULT_WIDTH = 120
const DEFAULT_HEIGHT = 36

const toSparklinePath = (
  values: number[],
  max: number,
  width: number,
  height: number,
): string => {
  if (values.length < 2) return ''

  const pad = 1
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

export interface TrafficSparklineProps {
  upValues: number[]
  downValues: number[]
  width?: number
  height?: number
  className?: string
}

export const TrafficSparkline = ({
  upValues,
  downValues,
  width = DEFAULT_WIDTH,
  height = DEFAULT_HEIGHT,
  className,
}: TrafficSparklineProps) => {
  const reactId = useId().replaceAll(':', '')
  const upGradientId = `traffic-up-${reactId}`
  const downGradientId = `traffic-down-${reactId}`
  const max = Math.max(...upValues, ...downValues, 1)
  const upPath = toSparklinePath(upValues, max, width, height)
  const downPath = toSparklinePath(downValues, max, width, height)

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
          <stop offset="100%" stopColor="var(--traffic-down)" />
        </linearGradient>
        <linearGradient id={downGradientId} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="var(--traffic-down)" />
          <stop offset="100%" stopColor="var(--traffic-up)" />
        </linearGradient>
      </defs>
      {upPath && (
        <path
          d={upPath}
          fill="none"
          stroke={`url(#${upGradientId})`}
          strokeWidth="1.8"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      )}
      {downPath && (
        <path
          d={downPath}
          fill="none"
          stroke={`url(#${downGradientId})`}
          strokeWidth="1.8"
          strokeLinejoin="round"
          strokeLinecap="round"
          opacity={0.85}
        />
      )}
    </Box>
  )
}
