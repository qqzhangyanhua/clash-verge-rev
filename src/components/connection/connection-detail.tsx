import { CloseRounded } from '@mui/icons-material'
import { Button, IconButton } from '@mui/material'
import { useLockFn } from 'ahooks'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { closeConnection } from 'tauri-plugin-mihomo-api'

import parseTraffic from '@/utils/parse-traffic'

import { RelativeTime } from './connection-relative-time'
import {
  formatConnectionChains,
  getConnectionHost,
  getConnectionRule,
  getConnectionSource,
  getConnectionTypeLabel,
} from './connection-row-view'

interface Props {
  data: IConnectionsItem
  closed: boolean
  onClose: () => void
}

const formatProcess = (metadata: IConnectionsItem['metadata']) => {
  if (metadata.process && metadata.processPath) {
    return `${metadata.process}(${metadata.processPath})`
  }
  return metadata.process || metadata.processPath || ''
}

export function ConnectionDetail({ data, closed, onClose }: Props) {
  const { t } = useTranslation()
  const { metadata } = data
  const host = getConnectionHost(data)
  const destination = metadata.destinationIP || metadata.remoteDestination || ''
  const information: { label: string; value: ReactNode }[] = [
    { label: t('connections.components.fields.host'), value: host },
    {
      label: t('shared.labels.downloaded'),
      value: parseTraffic(data.download).join(' '),
    },
    {
      label: t('shared.labels.uploaded'),
      value: parseTraffic(data.upload).join(' '),
    },
    {
      label: t('connections.components.fields.dlSpeed'),
      value: `${parseTraffic(data.curDownload ?? -1).join(' ')}/s`,
    },
    {
      label: t('connections.components.fields.ulSpeed'),
      value: `${parseTraffic(data.curUpload ?? -1).join(' ')}/s`,
    },
    {
      label: t('connections.components.fields.chains'),
      value: formatConnectionChains(data.chains),
    },
    {
      label: t('connections.components.fields.rule'),
      value: getConnectionRule(data),
    },
    {
      label: t('connections.components.fields.process'),
      value: formatProcess(metadata),
    },
    {
      label: t('connections.components.fields.time'),
      value: <RelativeTime start={data.start} />,
    },
    {
      label: t('connections.components.fields.source'),
      value: getConnectionSource(data),
    },
    {
      label: t('connections.components.fields.destination'),
      value: destination,
    },
    {
      label: t('connections.components.fields.destinationPort'),
      value: metadata.destinationPort,
    },
    {
      label: t('connections.components.fields.type'),
      value: getConnectionTypeLabel(data),
    },
  ]

  const onDelete = useLockFn(async () => {
    await closeConnection(data.id)
    onClose()
  })

  return (
    <div className="connection-inspector">
      <header className="connection-inspector__header">
        <div className="connection-inspector__title">{host}</div>
        <IconButton
          size="small"
          onClick={onClose}
          aria-label={t('shared.actions.hideDetails')}
          title={t('shared.actions.hideDetails')}
        >
          <CloseRounded fontSize="small" />
        </IconButton>
      </header>
      <div className="connection-inspector__fields">
        {information.map((each) => (
          <div key={each.label} className="connection-inspector__row">
            <div className="connection-inspector__label">{each.label}</div>
            <div className="connection-inspector__value">{each.value}</div>
          </div>
        ))}
      </div>
      {!closed && (
        <div className="connection-inspector__action">
          <Button
            size="small"
            variant="contained"
            onClick={() => {
              void onDelete()
            }}
          >
            {t('connections.components.actions.closeConnection')}
          </Button>
        </div>
      )}
    </div>
  )
}
