import { RefreshRounded } from '@mui/icons-material'
import { IconButton, Tooltip } from '@mui/material'
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
    <article className="unlock-card">
      <div className="unlock-card__header">
        <h3 className="unlock-card__name">{item.name}</h3>
        <Tooltip title={t('tests.components.item.actions.test')}>
          <span>
            <IconButton
              size="small"
              color="inherit"
              disabled={disabled}
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
            </IconButton>
          </span>
        </Tooltip>
      </div>
      <div className="unlock-card__badge" data-tone={statusColor}>
        {statusIcon}
        {statusLabel}
      </div>
      <div className="unlock-card__meta">
        {item.region && <span className="proto-chip">{item.region}</span>}
        <span className="unlock-card__time">{item.check_time || '-- --'}</span>
      </div>
    </article>
  )
}
