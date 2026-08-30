import { LanOutlined, LanRounded, WarningRounded } from '@mui/icons-material'
import { Box, Button } from '@mui/material'
import { useLockFn } from 'ahooks'
import { useCallback, useEffect, useReducer, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { BasePage, TooltipIcon } from '@/components/base'
import { ProviderButton } from '@/components/proxy/provider-button'
import { ProxyGroups } from '@/components/proxy/proxy-groups'
import { isClashMode, useClashModeSwitch } from '@/hooks/use-clash-mode-switch'
import { useClashConfigData } from '@/providers/app-data-context'
import {
  getRuntimeProxyChainConfig,
  updateProxyChainConfigInRuntime,
} from '@/services/cmds'
import { debugLog } from '@/utils/debug'

const ProxyPage = () => {
  const { t } = useTranslation()

  // 从 localStorage 恢复链式代理按钮状态
  const [isChainMode, setIsChainMode] = useState(() => {
    try {
      const saved = localStorage.getItem('proxy-chain-mode-enabled')
      return saved === 'true'
    } catch {
      return false
    }
  })

  const [chainConfigData, dispatchChainConfigData] = useReducer(
    (_: string | null, action: string | null) => action,
    null as string | null,
  )

  const { clashConfig } = useClashConfigData()
  const { currentMode, onChangeMode } = useClashModeSwitch()

  const updateChainConfigData = useCallback((value: string | null) => {
    dispatchChainConfigData(value)
  }, [])

  const normalizedMode = clashConfig?.mode?.toLowerCase()
  const chainWarning = t('proxies.page.chain.warning')

  const onToggleChainMode = useLockFn(async () => {
    const newChainMode = !isChainMode

    setIsChainMode(newChainMode)
    // 保存链式代理按钮状态到 localStorage
    localStorage.setItem('proxy-chain-mode-enabled', newChainMode.toString())

    if (!newChainMode) {
      // 退出链式代理模式时，清除链式代理配置
      try {
        debugLog('Exiting chain mode, clearing chain configuration')
        await updateProxyChainConfigInRuntime(null)
        debugLog('Chain configuration cleared successfully')
      } catch (error) {
        console.error('Failed to clear chain configuration:', error)
      }
    }
  })

  // 当开启链式代理模式时，获取配置数据
  useEffect(() => {
    if (!isChainMode) {
      updateChainConfigData(null)
      return
    }

    let cancelled = false

    const fetchChainConfig = async () => {
      try {
        const exitNode = localStorage.getItem('proxy-chain-exit-node')

        if (!exitNode) {
          console.error('No proxy chain exit node found in localStorage')
          if (!cancelled) {
            updateChainConfigData('')
          }
          return
        }

        const configData = await getRuntimeProxyChainConfig(exitNode)
        if (!cancelled) {
          updateChainConfigData(configData || '')
        }
      } catch (error) {
        console.error('Failed to get runtime proxy chain config:', error)
        if (!cancelled) {
          updateChainConfigData('')
        }
      }
    }

    fetchChainConfig()

    return () => {
      cancelled = true
    }
  }, [isChainMode, updateChainConfigData])

  useEffect(() => {
    if (normalizedMode && !isClashMode(normalizedMode)) {
      void onChangeMode('rule')
    }
  }, [normalizedMode, onChangeMode])

  return (
    <BasePage
      full
      contentStyle={{ height: '100%' }}
      title={
        isChainMode ? (
          <Box
            component="span"
            data-tauri-drag-region="true"
            sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.75 }}
          >
            {t('proxies.page.title.chainMode')}
            <TooltipIcon
              title={chainWarning}
              icon={WarningRounded}
              color="warning"
              sx={{ p: 0.25 }}
            />
          </Box>
        ) : (
          t('proxies.page.title.default')
        )
      }
      header={
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <ProviderButton />

          <Button
            size="small"
            variant={isChainMode ? 'contained' : 'text'}
            onClick={onToggleChainMode}
            sx={{ ml: 1 }}
            startIcon={
              isChainMode ? (
                <LanRounded fontSize="small" />
              ) : (
                <LanOutlined fontSize="small" />
              )
            }
          >
            {t('proxies.page.actions.toggleChain')}
          </Button>
        </Box>
      }
    >
      <ProxyGroups
        mode={currentMode ?? 'rule'}
        isChainMode={isChainMode}
        chainConfigData={chainConfigData}
      />
    </BasePage>
  )
}

export default ProxyPage
