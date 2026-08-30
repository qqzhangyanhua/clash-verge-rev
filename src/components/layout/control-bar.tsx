import { SettingsRounded } from '@mui/icons-material'
import {
  Box,
  IconButton,
  Switch,
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material'
import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { DialogRef } from '@/components/base'
import { SysproxyViewer } from '@/components/setting/mods/sysproxy-viewer'
import { TunViewer } from '@/components/setting/mods/tun-viewer'
import {
  CLASH_MODES,
  isClashMode,
  useClashModeSwitch,
} from '@/hooks/use-clash-mode-switch'
import { useSystemProxyState } from '@/hooks/use-system-proxy-state'
import { useSystemState } from '@/hooks/use-system-state'
import { useVerge } from '@/hooks/use-verge'
import { showNotice } from '@/services/notice-service'
import { requestService } from '@/services/service-request'
import type { TranslationKey } from '@/types/generated/i18n-keys'

const MODE_LABELS: Record<(typeof CLASH_MODES)[number], TranslationKey> = {
  rule: 'home.components.clashMode.labels.rule',
  global: 'home.components.clashMode.labels.global',
  direct: 'home.components.clashMode.labels.direct',
}

export const ControlBar = () => {
  const { t } = useTranslation()
  const { currentMode, onChangeMode } = useClashModeSwitch()
  const { verge, mutateVerge, patchVerge } = useVerge()
  const { indicator: systemProxyOn, toggleSystemProxy } = useSystemProxyState()
  const { runState, isTunModeAvailable, isLoading } = useSystemState()
  const sysproxyRef = useRef<DialogRef>(null)
  const tunRef = useRef<DialogRef>(null)
  const sysPendingRef = useRef(false)
  const [sysChecked, setSysChecked] = useState(systemProxyOn)

  const tunOn = verge?.enable_tun_mode === true

  if (sysPendingRef.current) {
    if (systemProxyOn === sysChecked) sysPendingRef.current = false
  } else if (sysChecked !== systemProxyOn) {
    setSysChecked(systemProxyOn)
  }

  const handleSystemProxy = async (
    _event: unknown,
    checked: boolean,
  ): Promise<void> => {
    if (checked && !isLoading && runState.mode === 'NotRunning') {
      showNotice.error('settings.feedback.errors.sysproxy.coreNotReady')
      return
    }
    sysPendingRef.current = true
    setSysChecked(checked)
    try {
      await toggleSystemProxy(checked)
    } catch (error) {
      sysPendingRef.current = false
      setSysChecked(systemProxyOn)
      showNotice.error(error)
    }
  }

  const handleTun = async (
    _event: unknown,
    checked: boolean,
  ): Promise<void> => {
    if (checked && !isTunModeAvailable) {
      requestService({
        reason: 'tunNeedsService',
        restore: { enable_tun_mode: checked },
      })
      return
    }
    mutateVerge(
      (prev) => (prev ? { ...prev, enable_tun_mode: checked } : prev),
      false,
    )
    try {
      await patchVerge({ enable_tun_mode: checked })
    } catch (error) {
      mutateVerge(
        (prev) => (prev ? { ...prev, enable_tun_mode: tunOn } : prev),
        false,
      )
      showNotice.error(error)
    }
  }

  return (
    <Box className="the-control-bar">
      <ToggleButtonGroup
        exclusive
        size="small"
        value={currentMode ?? ''}
        onChange={(_event, value: string | null) => {
          if (value && isClashMode(value)) {
            void onChangeMode(value)
          }
        }}
        sx={{
          flexShrink: 0,
          '& .MuiToggleButtonGroup-grouped': {
            borderColor: 'divider',
          },
          '& .MuiToggleButton-root': {
            px: 1.25,
            py: 0.25,
            fontSize: 12,
            lineHeight: 1.4,
            textTransform: 'none',
            fontWeight: 500,
          },
        }}
      >
        {CLASH_MODES.map((mode) => (
          <ToggleButton key={mode} value={mode} disableRipple>
            {t(MODE_LABELS[mode])}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>

      <Box className="the-control-bar__switches">
        <Box className="the-control-bar__switch">
          <IconButton
            size="small"
            aria-label={t(
              'settings.sections.proxyControl.tooltips.systemProxy',
            )}
            onClick={() => sysproxyRef.current?.open()}
          >
            <SettingsRounded sx={{ fontSize: 16 }} />
          </IconButton>
          <Box component="span" className="the-control-bar__label">
            {t('settings.sections.system.toggles.systemProxy')}
          </Box>
          <Switch
            size="small"
            checked={sysChecked}
            onChange={handleSystemProxy}
          />
        </Box>

        <Box className="the-control-bar__switch">
          <IconButton
            size="small"
            aria-label={t('settings.sections.proxyControl.tooltips.tunMode')}
            onClick={() => tunRef.current?.open()}
          >
            <SettingsRounded sx={{ fontSize: 16 }} />
          </IconButton>
          <Box component="span" className="the-control-bar__label">
            {t('settings.sections.system.toggles.tunMode')}
          </Box>
          <Switch size="small" checked={tunOn} onChange={handleTun} />
        </Box>
      </Box>

      <SysproxyViewer ref={sysproxyRef} />
      <TunViewer ref={tunRef} />
    </Box>
  )
}
