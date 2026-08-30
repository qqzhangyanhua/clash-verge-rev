import {
  AdminPanelSettingsOutlined,
  DnsOutlined,
  ExtensionOutlined,
} from '@mui/icons-material'
import { Typography } from '@mui/material'
import { useLockFn } from 'ahooks'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

import {
  SettingItem,
  SettingList,
} from '@/components/setting/mods/setting-comp'
import { useServiceInstaller } from '@/hooks/use-service-installer'
import { useSystemState } from '@/hooks/use-system-state'
import { useUpdate } from '@/hooks/use-update'
import { useVerge } from '@/hooks/use-verge'
import { getSystemInfo } from '@/services/cmds'
import { showNotice } from '@/services/notice-service'
import { version as appVersion } from '@root/package.json'

const valueSx = { py: '7px', pr: 1 } as const

const clickableValueSx = {
  ...valueSx,
  cursor: 'pointer',
  textDecoration: 'underline',
  '&:hover': { opacity: 0.7 },
} as const

export const SystemInfoCard = () => {
  const { t } = useTranslation()
  const { verge, patchVerge } = useVerge()
  const { isAdminMode, isSidecarMode, mutateSystemState } = useSystemState()
  const { installServiceAndRestartCore } = useServiceInstaller()

  const { checkUpdate: triggerCheckUpdate, lastCheckUpdate } = useUpdate(true)

  const [osInfo, setOsInfo] = useState('')

  const lastCheckUpdateText = useMemo(
    () => (lastCheckUpdate ? new Date(lastCheckUpdate).toLocaleString() : '-'),
    [lastCheckUpdate],
  )

  useEffect(() => {
    getSystemInfo()
      .then((info) => {
        const sysName = info.system_name
        let sysVersion = info.system_version

        if (
          sysName &&
          sysVersion.toLowerCase().startsWith(sysName.toLowerCase())
        ) {
          sysVersion = sysVersion.substring(sysName.length).trim()
        }

        setOsInfo(`${sysName} ${sysVersion}`)
      })
      .catch(console.error)
  }, [])

  const toggleAutoLaunch = useCallback(async () => {
    if (!verge) return
    try {
      await patchVerge({ enable_auto_launch: !verge.enable_auto_launch })
    } catch (err) {
      console.error('切换开机自启动状态失败:', err)
    }
  }, [verge, patchVerge])

  const handleRunningModeClick = useCallback(async () => {
    if (isSidecarMode || (isAdminMode && isSidecarMode)) {
      await installServiceAndRestartCore()
      await mutateSystemState()
    }
  }, [
    isSidecarMode,
    isAdminMode,
    installServiceAndRestartCore,
    mutateSystemState,
  ])

  const onCheckUpdate = useLockFn(async () => {
    try {
      const result = await triggerCheckUpdate()
      const info = result.data
      if (!info?.available) {
        showNotice.success(
          'settings.components.verge.advanced.notifications.latestVersion',
        )
      } else {
        showNotice.info('shared.feedback.notifications.updateAvailable', 2000)
      }
    } catch (err) {
      showNotice.error(err)
    }
  })

  const autoLaunchEnabled = useMemo(
    () => verge?.enable_auto_launch || false,
    [verge],
  )

  const runningModeClickable = isSidecarMode || (isAdminMode && isSidecarMode)

  const runningModeStyle = useMemo(
    () => ({
      ...valueSx,
      cursor: runningModeClickable ? 'pointer' : 'default',
      textDecoration: runningModeClickable ? 'underline' : 'none',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'flex-end',
      gap: 0.5,
      '&:hover': {
        opacity: runningModeClickable ? 0.7 : 1,
      },
    }),
    [runningModeClickable],
  )

  const getModeIcon = () => {
    if (isAdminMode) {
      if (!isSidecarMode) {
        return (
          <>
            <AdminPanelSettingsOutlined
              sx={{ color: 'primary.main', fontSize: 16 }}
              titleAccess={t('home.components.systemInfo.badges.adminMode')}
            />
            <DnsOutlined
              sx={{ color: 'success.main', fontSize: 16, ml: 0.5 }}
              titleAccess={t('home.components.systemInfo.badges.serviceMode')}
            />
          </>
        )
      }
      return (
        <AdminPanelSettingsOutlined
          sx={{ color: 'primary.main', fontSize: 16 }}
          titleAccess={t('home.components.systemInfo.badges.adminMode')}
        />
      )
    } else if (isSidecarMode) {
      return (
        <ExtensionOutlined
          sx={{ color: 'info.main', fontSize: 16 }}
          titleAccess={t('home.components.systemInfo.badges.sidecarMode')}
        />
      )
    } else {
      return (
        <DnsOutlined
          sx={{ color: 'success.main', fontSize: 16 }}
          titleAccess={t('home.components.systemInfo.badges.serviceMode')}
        />
      )
    }
  }

  const getModeText = () => {
    if (isAdminMode) {
      if (!isSidecarMode) {
        return t('home.components.systemInfo.badges.adminServiceMode')
      }
      return t('home.components.systemInfo.badges.adminMode')
    } else if (isSidecarMode) {
      return t('home.components.systemInfo.badges.sidecarMode')
    } else {
      return t('home.components.systemInfo.badges.serviceMode')
    }
  }

  if (!verge) return null

  return (
    <SettingList title={t('home.components.systemInfo.title')}>
      <SettingItem label={t('home.components.systemInfo.fields.osInfo')}>
        <Typography sx={valueSx}>{osInfo}</Typography>
      </SettingItem>
      <SettingItem label={t('home.components.systemInfo.fields.autoLaunch')}>
        <Typography onClick={toggleAutoLaunch} sx={clickableValueSx}>
          {autoLaunchEnabled
            ? t('shared.statuses.enabled')
            : t('shared.statuses.disabled')}
        </Typography>
      </SettingItem>
      <SettingItem label={t('home.components.systemInfo.fields.runningMode')}>
        <Typography onClick={handleRunningModeClick} sx={runningModeStyle}>
          {getModeIcon()}
          {getModeText()}
        </Typography>
      </SettingItem>
      <SettingItem
        label={t('home.components.systemInfo.fields.lastCheckUpdate')}
      >
        <Typography onClick={onCheckUpdate} sx={clickableValueSx}>
          {lastCheckUpdateText}
        </Typography>
      </SettingItem>
      <SettingItem label={t('home.components.systemInfo.fields.vergeVersion')}>
        <Typography sx={valueSx}>v{appVersion}</Typography>
      </SettingItem>
    </SettingList>
  )
}
