import { useMemo } from 'react'

import { useTrafficData } from '@/hooks/use-traffic-data'
import { useTrafficMonitorEnhanced } from '@/hooks/use-traffic-monitor'
import { useVisibility } from '@/hooks/use-visibility'
import parseTraffic from '@/utils/parse-traffic'

const DEFAULT_POINT_COUNT = 48

export const useFeaturedTraffic = (pointCount = DEFAULT_POINT_COUNT) => {
  const pageVisible = useVisibility()
  const {
    response: { data: traffic },
  } = useTrafficData({ enabled: pageVisible })
  const { graphData } = useTrafficMonitorEnhanced({
    subscribe: true,
    enabled: pageVisible,
  })

  const rates = useMemo(() => {
    const [up, upUnit] = parseTraffic(traffic?.up || 0)
    const [down, downUnit] = parseTraffic(traffic?.down || 0)
    const [uploadTotal, uploadTotalUnit] = parseTraffic(traffic?.upTotal || 0)
    const [downloadTotal, downloadTotalUnit] = parseTraffic(
      traffic?.downTotal || 0,
    )
    return {
      uploadText: `${up} ${upUnit}/s`,
      downloadText: `${down} ${downUnit}/s`,
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

  const sparkline = useMemo(() => {
    const points = graphData.dataPoints.slice(-pointCount)
    return {
      upValues: points.map((point) => point.up),
      downValues: points.map((point) => point.down),
    }
  }, [graphData.dataPoints, pointCount])

  return { ...rates, ...sparkline }
}
