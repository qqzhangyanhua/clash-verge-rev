import { Box } from '@mui/material'
import { useTranslation } from 'react-i18next'

import parseTraffic from '@/utils/parse-traffic'

type ConnectionsType = 'active' | 'closed'

interface ConnectionMetricsProps {
  connectionsType: ConnectionsType
  activeCount: number
  closedCount: number
  downloadTotal: number
  uploadTotal: number
  onSelectType: (type: ConnectionsType) => void
}

const formatTotal = (value: number) => {
  const [amount, unit] = parseTraffic(value)
  return `${amount} ${unit}`
}

export const ConnectionMetrics = ({
  connectionsType,
  activeCount,
  closedCount,
  downloadTotal,
  uploadTotal,
  onSelectType,
}: ConnectionMetricsProps) => {
  const { t } = useTranslation()

  return (
    <Box className="page-metrics">
      <Box
        component="button"
        type="button"
        className="page-metric"
        data-clickable="true"
        data-active={connectionsType === 'active' ? 'true' : 'false'}
        onClick={() => onSelectType('active')}
      >
        <span className="page-metric__value">{activeCount}</span>
        <span className="page-metric__label">
          {t('connections.components.actions.active')}
        </span>
      </Box>
      <Box
        component="button"
        type="button"
        className="page-metric"
        data-clickable="true"
        data-active={connectionsType === 'closed' ? 'true' : 'false'}
        onClick={() => onSelectType('closed')}
      >
        <span className="page-metric__value">{closedCount}</span>
        <span className="page-metric__label">
          {t('connections.components.actions.closed')}
        </span>
      </Box>
      <Box className="page-metric">
        <span className="page-metric__value">{formatTotal(downloadTotal)}</span>
        <span className="page-metric__label">
          {t('shared.labels.downloaded')}
        </span>
      </Box>
      <Box className="page-metric">
        <span className="page-metric__value">{formatTotal(uploadTotal)}</span>
        <span className="page-metric__label">
          {t('shared.labels.uploaded')}
        </span>
      </Box>
    </Box>
  )
}
