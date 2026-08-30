import { Typography } from '@mui/material'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'

import {
  SettingItem,
  SettingList,
} from '@/components/setting/mods/setting-comp'
import { useClash } from '@/hooks/use-clash'
import { useDisplayedMixedPort } from '@/hooks/use-displayed-mixed-port'
import {
  useRulesData,
  useSystemData,
  useUptimeData,
} from '@/providers/app-data-context'

const formatUptime = (uptimeMs: number) => {
  const hours = Math.floor(uptimeMs / 3600000)
  const minutes = Math.floor((uptimeMs % 3600000) / 60000)
  const seconds = Math.floor((uptimeMs % 60000) / 1000)
  return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
}

const valueSx = { py: '7px', pr: 1 } as const

export const ClashInfoCard = () => {
  const { t } = useTranslation()
  const { version: clashVersion } = useClash()
  const displayedMixedPort = useDisplayedMixedPort()
  const { rules } = useRulesData()
  const { uptime } = useUptimeData()
  const { systemProxyAddress } = useSystemData()
  const formattedUptime = useMemo(() => formatUptime(uptime), [uptime])

  return (
    <SettingList title={t('home.components.clashInfo.title')}>
      <SettingItem label={t('home.components.clashInfo.fields.coreVersion')}>
        <Typography sx={valueSx}>{clashVersion || '-'}</Typography>
      </SettingItem>
      <SettingItem
        label={t('home.components.clashInfo.fields.systemProxyAddress')}
      >
        <Typography sx={valueSx}>{systemProxyAddress}</Typography>
      </SettingItem>
      <SettingItem label={t('home.components.clashInfo.fields.mixedPort')}>
        <Typography sx={valueSx}>{displayedMixedPort}</Typography>
      </SettingItem>
      <SettingItem label={t('home.components.clashInfo.fields.uptime')}>
        <Typography sx={valueSx}>{formattedUptime}</Typography>
      </SettingItem>
      <SettingItem label={t('home.components.clashInfo.fields.rulesCount')}>
        <Typography sx={valueSx}>{rules.length}</Typography>
      </SettingItem>
    </SettingList>
  )
}
