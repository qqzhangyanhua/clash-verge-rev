import { CloseRounded } from '@mui/icons-material'
import { IconButton } from '@mui/material'
import { useLockFn } from 'ahooks'
import { memo, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { closeConnection } from 'tauri-plugin-mihomo-api'

import { RelativeTime } from './connection-relative-time'
import type { ConnectionRowView } from './connection-row-view'

interface Props {
  row: ConnectionRowView
  closed: boolean
  selected?: boolean
  onShowDetail: (id: string) => void
}

export const ConnectionRowItem = memo(
  function ConnectionRowItem({
    row,
    closed,
    selected = false,
    onShowDetail,
  }: Props) {
    const { t } = useTranslation()
    const onDelete = useLockFn(async () => closeConnection(row.id))
    const handleShowDetail = useCallback(
      () => onShowDetail(row.id),
      [onShowDetail, row.id],
    )
    const showTraffic = row.uploadSpeed >= 100 || row.downloadSpeed >= 100

    return (
      <div
        aria-selected={selected}
        className={selected ? 'connection-row is-selected' : 'connection-row'}
      >
        <div className="connection-row__content" onClick={handleShowDetail}>
          <div className="connection-row__host">{row.host}</div>
          <div className="connection-row__tags">
            <span className="proto-chip">{row.network}</span>
            <span className="proto-chip">{row.type}</span>
            {row.process && <span className="proto-chip">{row.process}</span>}
            {row.chains && <span className="proto-chip">{row.chains}</span>}
            <span className="proto-chip">
              <RelativeTime start={row.time} />
            </span>
            {showTraffic && (
              <span className="proto-chip">
                {row.uploadSpeedText} / {row.downloadSpeedText}
              </span>
            )}
          </div>
        </div>
        {!closed && (
          <IconButton
            size="small"
            color="inherit"
            onClick={onDelete}
            title={t('connections.components.actions.closeConnection')}
            aria-label={t('connections.components.actions.closeConnection')}
            className="connection-row__action"
          >
            <CloseRounded fontSize="small" />
          </IconButton>
        )}
      </div>
    )
  },
  (prev, next) =>
    prev.row === next.row &&
    prev.closed === next.closed &&
    prev.selected === next.selected &&
    prev.onShowDetail === next.onShowDetail,
)
