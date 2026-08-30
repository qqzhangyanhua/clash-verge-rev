import { defaultRangeExtractor, useVirtualizer } from '@tanstack/react-virtual'
import { throttle } from 'lodash-es'
import {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react'

import { BaseEmpty, BaseLoading } from '@/components/base'
import { useProfiles } from '@/hooks/use-profiles'
import { useProxiesData, useSystemData } from '@/providers/app-data-context'
import type { ProxyGroupView } from '@/types/proxy-view'

import { ProxyEmptyState } from './proxy-empty-state'
import { resolveProxyListState } from './proxy-empty-state-model'
import { ProxySplitGroups } from './proxy-split-groups'
import {
  useEmptyRenderList,
  useProxyRenderState,
  useStableCallback,
} from './use-proxy-render-state'
import { hasRenderableItems } from './use-render-list'

const ProxyGroupsChain = lazy(() =>
  import('./proxy-groups-chain').then((m) => ({
    default: m.ProxyGroupsChain,
  })),
)

interface Props {
  mode: string
  isChainMode?: boolean
  chainConfigData?: string | null
}

function ChainProxyGroups(props: {
  mode: string
  chainConfigData?: string | null
}) {
  const { mode, chainConfigData } = props
  const { proxyView } = useProxiesData()
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null)

  const availableGroups = useMemo(() => {
    const groups = proxyView?.groups
    if (!groups) return []
    return groups.filter(
      (group) => group.type === 'Selector' || group.type === 'URLTest',
    )
  }, [proxyView?.groups])

  const defaultRuleGroup = useMemo(() => {
    if (mode === 'rule' && availableGroups.length > 0) {
      return availableGroups[0].name
    }
    return null
  }, [availableGroups, mode])

  const activeSelectedGroup = selectedGroup ?? defaultRuleGroup
  const {
    renderList,
    onHeadState,
    handleCheckAll,
    getScrollPosition,
    saveScrollPosition,
  } = useProxyRenderState(mode, true, activeSelectedGroup)
  const emptyList = useEmptyRenderList()

  const parentRef = useRef<HTMLDivElement>(null)
  const scrollTopRef = useRef(0)
  const showScrollTopRef = useRef(false)
  const activeStickyIndexRef = useRef<number | null>(null)
  const [showScrollTop, setShowScrollTop] = useState(false)
  const stickyGroupIndexes = useMemo(
    () =>
      renderList.flatMap((item, index) =>
        item.type === 0 && !item.group.hidden ? [index] : [],
      ),
    [renderList],
  )

  const rangeExtractor = useCallback(
    (range: Parameters<typeof defaultRangeExtractor>[0]) => {
      const activeStickyIndex = [...stickyGroupIndexes]
        .reverse()
        .find((index) => index <= range.startIndex)
      activeStickyIndexRef.current = activeStickyIndex ?? null

      const indexes = defaultRangeExtractor(range)
      return activeStickyIndex == null || indexes.includes(activeStickyIndex)
        ? indexes
        : [activeStickyIndex, ...indexes]
    },
    [stickyGroupIndexes],
  )

  const virtualizer = useVirtualizer({
    count: renderList.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 56,
    overscan: 15,
    getItemKey: (index) => renderList[index]?.key ?? index,
    rangeExtractor,
  })
  const virtualItems = virtualizer.getVirtualItems()
  const activeStickyIndex = activeStickyIndexRef.current

  useLayoutEffect(() => {
    if (renderList.length === 0) return
    const node = parentRef.current
    if (!node) return

    const savedPosition = getScrollPosition()
    if (savedPosition !== undefined) {
      node.scrollTop = savedPosition
      scrollTopRef.current = savedPosition
      const nextShowScrollTop = savedPosition > 100
      showScrollTopRef.current = nextShowScrollTop
      queueMicrotask(() => setShowScrollTop(nextShowScrollTop))
    }
  }, [renderList.length, getScrollPosition])

  const saveScrollPositionThrottled = useMemo(
    () => throttle(saveScrollPosition, 500),
    [saveScrollPosition],
  )

  const handleScroll = useCallback(
    (event: Event) => {
      const target = event.target as HTMLElement | null
      const nextScrollTop = target?.scrollTop ?? 0
      const nextShowScrollTop = nextScrollTop > 100
      scrollTopRef.current = nextScrollTop

      if (showScrollTopRef.current !== nextShowScrollTop) {
        showScrollTopRef.current = nextShowScrollTop
        setShowScrollTop(nextShowScrollTop)
      }

      saveScrollPositionThrottled(nextScrollTop)
    },
    [saveScrollPositionThrottled],
  )

  useEffect(() => {
    const node = parentRef.current
    if (!node) return

    const listener = handleScroll as EventListener
    const options: AddEventListenerOptions = { passive: true }

    node.addEventListener('scroll', listener, options)

    return () => {
      saveScrollPosition(scrollTopRef.current)
      node.removeEventListener('scroll', listener, options)
    }
  }, [handleScroll, saveScrollPosition])

  const scrollToTop = useCallback(() => {
    parentRef.current?.scrollTo?.({
      top: 0,
      behavior: 'smooth',
    })
    scrollTopRef.current = 0
  }, [])

  const handleLocation = useStableCallback((group: ProxyGroupView) => {
    if (!group) return
    const { name, now } = group

    const index = renderList.findIndex(
      (item) =>
        item.group?.name === name &&
        ((item.type === 2 && item.member?.member.ref.name === now) ||
          (item.type === 4 &&
            item.memberCol?.some(({ member }) => member.ref.name === now))),
    )

    if (index >= 0) {
      virtualizer.scrollToIndex(index, {
        align: 'center',
        behavior: 'smooth',
      })
    }
  })

  if (!hasRenderableItems(renderList)) return emptyList

  return (
    <Suspense fallback={<BaseLoading />}>
      <ProxyGroupsChain
        mode={mode}
        chainConfigData={chainConfigData}
        availableGroups={availableGroups}
        activeSelectedGroup={activeSelectedGroup}
        showScrollTop={showScrollTop}
        parentRef={parentRef}
        totalSize={virtualizer.getTotalSize()}
        virtualItems={virtualItems}
        renderList={renderList}
        activeStickyIndex={activeStickyIndex}
        measureElement={virtualizer.measureElement}
        onCheckAll={handleCheckAll}
        onHeadState={onHeadState}
        onLocation={handleLocation}
        onGroupSelect={setSelectedGroup}
        onScrollToTop={scrollToTop}
      />
    </Suspense>
  )
}

export const ProxyGroups = (props: Props) => {
  const { mode, isChainMode = false, chainConfigData } = props
  const { profiles, isLoading: isProfilesLoading } = useProfiles()
  const { isProxyViewPending } = useProxiesData()
  const { isRunningModePending } = useSystemData()

  const listState = resolveProxyListState({
    mode,
    profiles,
    isProfilesPending: !profiles && isProfilesLoading,
    isProxyViewPending,
    isRunningModePending,
  })

  switch (listState.kind) {
    case 'direct':
      return <BaseEmpty textKey="proxies.page.messages.directMode" />
    case 'loading':
      return <BaseLoading />
    case 'empty':
      return <ProxyEmptyState reason={listState.reason} />
    case 'render':
      return isChainMode ? (
        <ChainProxyGroups mode={mode} chainConfigData={chainConfigData} />
      ) : (
        <ProxySplitGroups mode={mode} />
      )
  }
}
