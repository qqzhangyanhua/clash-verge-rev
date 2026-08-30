import { useEffect, useMemo, useRef } from 'react'

import { useRuntimeConfig } from '@/hooks/use-clash'
import { useGroupsDelays } from '@/hooks/use-group-delays'
import { useVerge } from '@/hooks/use-verge'
import { useAppRefreshers, useProxiesData } from '@/providers/app-data-context'
import delayManager from '@/services/delay'
import { isInteractableMember } from '@/types/proxy-view'
import { debugLog } from '@/utils/debug'

import {
  buildRenderList,
  chainOccurrencesOf,
  CHAIN_DELAY_GROUP,
  type IRenderItem,
} from './render-list'
import { useHeadStateNew } from './use-head-state'
import { useWindowWidth } from './use-window-width'

export {
  hasRenderableItems,
  type IRenderItem,
  type ResolvedMemberOccurrence,
} from './render-list'

type RuntimeConfigWithProxySequence = IConfigData & { proxies?: unknown }

const calculateColumns = (width: number, configCol: number): number => {
  if (configCol > 0 && configCol < 6) return configCol
  if (width > 1920) return 5
  if (width > 1450) return 4
  if (width > 1024) return 3
  if (width >= 600) return 2
  return 1
}

export const useRenderList = (
  mode: string,
  isChainMode?: boolean,
  selectedGroup?: string | null,
) => {
  const { proxyView } = useProxiesData()
  const { refreshProxy } = useAppRefreshers()
  const { verge } = useVerge()
  const { width } = useWindowWidth()
  const [headStates, setHeadState] = useHeadStateNew()
  const latencyTimeout = verge?.default_latency_timeout
  const { data: runtimeConfig } = useRuntimeConfig(!!isChainMode)
  const runtimeProxies = (
    runtimeConfig as RuntimeConfigWithProxySequence | null | undefined
  )?.proxies

  const col = useMemo(
    () => calculateColumns(width, verge?.proxy_layout_column || 6),
    [width, verge?.proxy_layout_column],
  )

  const chainOccurrences = useMemo(() => {
    if (!proxyView || !isChainMode) return []
    return chainOccurrencesOf(
      proxyView,
      mode,
      selectedGroup ?? null,
      runtimeConfig != null,
      runtimeProxies,
    )
  }, [
    isChainMode,
    mode,
    proxyView,
    runtimeConfig,
    runtimeProxies,
    selectedGroup,
  ])

  const chainOccurrencesRef = useRef(chainOccurrences)
  chainOccurrencesRef.current = chainOccurrences
  const chainDelayGroup =
    mode === 'rule' && selectedGroup ? selectedGroup : CHAIN_DELAY_GROUP
  const chainDelayKey = chainOccurrences
    .map(({ member }) => {
      if (member.kind !== 'node') return `${member.kind}:${member.ref.name}`
      const source = member.node.source
      return source.kind === 'provider'
        ? `provider:${source.providerName}:${source.proxyName}`
        : `core:${source.proxyName}`
    })
    .join('\u0000')

  useEffect(() => {
    if (!isChainMode || !chainDelayKey) return
    const interactable = chainOccurrencesRef.current
      .map(({ member }) => member)
      .filter(isInteractableMember)
    if (interactable.length === 0) return

    const handle = setTimeout(() => {
      const timeout = verge?.default_latency_timeout || 10000
      debugLog(`[ChainMode] 开始计算 ${interactable.length} 个节点的延迟`)
      void delayManager.checkListDelay(interactable, chainDelayGroup, timeout)
    }, 100)

    return () => {
      clearTimeout(handle)
    }
  }, [
    chainDelayGroup,
    chainDelayKey,
    isChainMode,
    verge?.default_latency_timeout,
  ])

  const renderedGroupNames = useMemo(() => {
    if (!proxyView) return []
    if (isChainMode)
      return selectedGroup ? [selectedGroup] : [CHAIN_DELAY_GROUP]
    return mode === 'rule' || mode === 'script'
      ? proxyView.groups.map(({ name }) => name)
      : proxyView.global
        ? [proxyView.global.name]
        : []
  }, [isChainMode, mode, proxyView, selectedGroup])
  const groupDelays = useGroupsDelays(renderedGroupNames)

  const renderList = useMemo<IRenderItem[]>(() => {
    if (!proxyView) return []
    // filterSort reads delayManager; snapshot identity is the rebuild signal.
    for (const name of renderedGroupNames) {
      void groupDelays.get(name)
    }
    return buildRenderList({
      view: proxyView,
      mode,
      col,
      isChainMode,
      selectedGroup,
      headStates,
      latencyTimeout,
      runtimeConfigReady: runtimeConfig != null,
      runtimeProxies,
    })
  }, [
    col,
    groupDelays,
    headStates,
    isChainMode,
    latencyTimeout,
    mode,
    proxyView,
    renderedGroupNames,
    runtimeConfig,
    runtimeProxies,
    selectedGroup,
  ])

  return {
    renderList,
    onProxies: refreshProxy,
    onHeadState: setHeadState,
    currentColumns: col,
  }
}
