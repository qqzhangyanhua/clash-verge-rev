import { RefreshRounded } from '@mui/icons-material'
import { Box, Button, Chip, Tooltip } from '@mui/material'
import type { ReactElement } from 'react'
import { useTranslation } from 'react-i18next'

interface UnlockResultItem {
  name: string
  status: string
  region?: string | null
  check_time?: string | null
}

export type UnlockStatusColor =
  | 'default'
  | 'success'
  | 'error'
  | 'warning'
  | 'info'
  | 'primary'
  | 'secondary'

interface UnlockResultRowProps {
  item: UnlockResultItem
  loading: boolean
  disabled: boolean
  statusLabel: string
  statusColor: UnlockStatusColor
  statusIcon: ReactElement
  onTest: (name: string) => void
}

export const UnlockResultRow = ({
  item,
  loading,
  disabled,
  statusLabel,
  statusColor,
  statusIcon,
  onTest,
}: UnlockResultRowProps) => {
  const { t } = useTranslation()

  return (
    <Box className="unlock-result-row">
      <Box className="unlock-result-row__name">{item.name}</Box>
      <Box className="unlock-result-row__meta">
        <Chip
          label={statusLabel}
          color={statusColor}
          size="small"
          icon={statusIcon}
          sx={{ fontWeight: item.status === 'Pending' ? 'normal' : 600 }}
        />
        {item.region && (
          <Chip label={item.region} size="small" variant="outlined" />
        )}
        <Box className="unlock-result-row__time">
          {item.check_time || '-- --'}
        </Box>
        <Tooltip title={t('tests.components.item.actions.test')}>
          <span>
            <Button
              size="small"
              variant="text"
              color="primary"
              disabled={disabled}
              sx={{ minWidth: 32, width: 32, height: 32 }}
              onClick={() => onTest(item.name)}
              aria-label={t('tests.components.item.actions.test')}
            >
              <RefreshRounded
                sx={{
                  animation: loading ? 'spin 1s linear infinite' : 'none',
                  '@keyframes spin': {
                    '0%': { transform: 'rotate(0deg)' },
                    '100%': { transform: 'rotate(360deg)' },
                  },
                }}
              />
            </Button>
          </span>
        </Tooltip>
      </Box>
    </Box>
  )
}
