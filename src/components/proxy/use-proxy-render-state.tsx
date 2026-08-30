import { useLockFn } from 'ahooks'
import { useCallback, useRef } from 'react'

import { useProxySelection } from '@/hooks/use-proxy-selection'
import { useVerge } from '@/hooks/use-verge'
import { useProxiesData, useSystemData } from '@/providers/app-data-context'
import delayManager from '@/services/delay'
import {
  isInteractableMember,
  resolveMember,
  type ProxyGroupView,
  type ResolvedProxyMember,
} from '@/types/proxy-view'
import { debugLog } from '@/utils/debug'

import { ProxyEmptyState } from './proxy-empty-state'
import { resolveEmptyListReason } from './proxy-empty-state-model'
import { useRenderList } from './use-render-list'

function useStableCallback<T extends (...args: never[]) => unknown>(fn: T): T {
  const ref = useRef(fn)
  ref.current = fn
  return useCallback((...args: Parameters<T>) => ref.current(...args), []) as T
}

export function useEmptyRenderList() {
  const { isProxyViewError } = useProxiesData()
  const { runningMode } = useSystemData()

  return (
    <ProxyEmptyState
      reason={resolveEmptyListReason({ runningMode, isProxyViewError })}
    />
  )
}

export function useProxyRenderState(
  mode: string,
  isChainMode: boolean,
  activeSelectedGroup: string | null,
) {
  const { verge } = useVerge()
  const { proxyView } = useProxiesData()
  const { renderList, onProxies, onHeadState } = useRenderList(
    mode,
    isChainMode,
    activeSelectedGroup,
  )
  const scrollPositionKey = `${mode}:${isChainMode ? 'chain' : 'split'}:${activeSelectedGroup ?? (isChainMode ? 'all' : 'none')}`
  const timeout = verge?.default_latency_timeout || 10000

  const handleCheckAll = useStableCallback(
    useLockFn(async (groupName: string) => {
      debugLog(`[ProxyGroups] 开始测试所有延迟，组: ${groupName}`)

      const group =
        proxyView?.groups.find(({ name }) => name === groupName) ??
        (proxyView?.global?.name === groupName ? proxyView.global : undefined)
      const occurrences =
        proxyView && group
          ? group.members.map((member, memberIndex) => ({
              memberIndex,
              member: resolveMember(proxyView, member),
            }))
          : []
      const interactable = occurrences
        .map(({ member }) => member)
        .filter(isInteractableMember)

      debugLog(`[ProxyGroups] 找到代理数量: ${interactable.length}`)

      const url = delayManager.getUrl(groupName)
      debugLog(`[ProxyGroups] 测试URL: ${url}, 超时: ${timeout}ms`)

      try {
        await delayManager.checkListDelay(interactable, groupName, timeout)
        debugLog(`[ProxyGroups] 延迟测试完成，组: ${groupName}`)
      } catch (error) {
        console.error(`[ProxyGroups] 延迟测试出错，组: ${groupName}`, error)
      } finally {
        onProxies()
      }
    }),
  )

  const saveScrollPosition = useCallback(
    (scrollTop: number) => {
      const scrollPositions = localStorage.getItem('proxy-scroll-positions')
        ? JSON.parse(localStorage.getItem('proxy-scroll-positions') ?? '{}')
        : {}
      scrollPositions[scrollPositionKey] = scrollTop
      try {
        localStorage.setItem(
          'proxy-scroll-positions',
          JSON.stringify(scrollPositions),
        )
      } catch (e) {
        console.error('Error saving scroll position:', e)
      }
    },
    [scrollPositionKey],
  )

  const getScrollPosition = useCallback(() => {
    try {
      const savedPositions = localStorage.getItem('proxy-scroll-positions')
      if (savedPositions) {
        const positions = JSON.parse(savedPositions)
        const savedPosition = positions[scrollPositionKey]
        return savedPosition ?? 0
      }
    } catch (e) {
      console.error('Error restoring scroll position:', e)
    }
  }, [scrollPositionKey])

  const { handleProxyGroupChange } = useProxySelection({
    onSuccess: () => {
      onProxies()
    },
    onError: (error) => {
      console.error('代理切换失败', error)
      onProxies()
    },
  })

  const handleChangeProxy = useCallback(
    (group: ProxyGroupView, member: ResolvedProxyMember) => {
      if (!['Selector', 'URLTest', 'Fallback'].includes(group.type)) return
      if (!isInteractableMember(member)) return

      handleProxyGroupChange(group, { name: member.ref.name })
    },
    [handleProxyGroupChange],
  )

  return {
    renderList,
    onProxies,
    onHeadState,
    handleCheckAll,
    handleChangeProxy,
    saveScrollPosition,
    getScrollPosition,
  }
}

export { useStableCallback }
