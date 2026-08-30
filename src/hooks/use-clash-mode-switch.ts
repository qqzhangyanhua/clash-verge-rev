import { useLockFn } from 'ahooks'
import { useState } from 'react'
import { type BaseConfig, closeAllConnections } from 'tauri-plugin-mihomo-api'

import { useClashMode, useRuntimeConfig } from '@/hooks/use-clash'
import { useVerge } from '@/hooks/use-verge'
import {
  useAppRefreshers,
  useClashConfigData,
  useCoreDataStatus,
} from '@/providers/app-data-context'
import { patchClashMode } from '@/services/cmds'
import { showNotice } from '@/services/notice-service'
import { setCacheData } from '@/services/query-client'

export const CLASH_MODES = ['rule', 'global', 'direct'] as const
export type ClashMode = (typeof CLASH_MODES)[number]

export const isClashMode = (mode: string): mode is ClashMode =>
  (CLASH_MODES as readonly string[]).includes(mode)

const toClashMode = (mode?: string | null) => {
  const normalized = mode?.toLowerCase()
  return normalized && isClashMode(normalized) ? normalized : undefined
}

export const useClashModeSwitch = () => {
  const { verge } = useVerge()
  const { clashConfig } = useClashConfigData()
  const { isCoreDataPending } = useCoreDataStatus()
  const { refreshClashConfig } = useAppRefreshers()
  const [optimisticMode, setOptimisticMode] = useState<ClashMode | null>(null)

  const controllerMode = toClashMode(clashConfig?.mode)
  const needFallback = !controllerMode
  const { data: runtimeConfig, isPending: isRuntimeConfigPending } =
    useRuntimeConfig(needFallback)
  const runtimeMode = toClashMode(runtimeConfig?.mode)
  const {
    data: backendMode,
    isPending: isBackendModePending,
    refetch: refetchBackendMode,
  } = useClashMode(needFallback)

  const fallbackMode = toClashMode(backendMode) ?? runtimeMode
  const resolvedMode = controllerMode ?? fallbackMode
  const currentMode = optimisticMode ?? resolvedMode
  const isPending =
    isCoreDataPending || isRuntimeConfigPending || isBackendModePending

  const onChangeMode = useLockFn(async (mode: ClashMode) => {
    if (mode === currentMode) return
    if (verge?.auto_close_connection) {
      closeAllConnections()
    }

    const previous = resolvedMode
    setOptimisticMode(mode)
    setCacheData<BaseConfig>(['getClashConfig'], (old) =>
      old ? { ...old, mode } : old,
    )
    try {
      await patchClashMode(mode)
    } catch (error) {
      setOptimisticMode(null)
      if (previous) {
        setCacheData<BaseConfig>(['getClashConfig'], (old) =>
          old ? { ...old, mode: previous } : old,
        )
      }
      showNotice.error(error)
      return
    }

    await Promise.allSettled([refreshClashConfig(), refetchBackendMode()])
    setOptimisticMode(null)
  })

  return { currentMode, isPending, onChangeMode }
}
