import { Box } from '@mui/material'
import { throttle } from 'lodash-es'
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { useTranslation } from 'react-i18next'

import {
  StickyVirtualList,
  type StickyVirtualListHandle,
} from '@/components/base'
import { useProxiesData } from '@/providers/app-data-context'
import type { ProxyGroupView } from '@/types/proxy-view'

import { ProxyFeaturedCard } from './proxy-featured-card'
import { collectGroupProtocols } from './proxy-group-meta'
import { ProxyRender } from './proxy-render'
import {
  useEmptyRenderList,
  useProxyRenderState,
  useStableCallback,
} from './use-proxy-render-state'
import type { IRenderItem } from './use-render-list'

const SELECTED_GROUP_KEY = 'proxy-split-selected-group'

const readSelectedGroup = (): string | null => {
  try {
    return localStorage.getItem(SELECTED_GROUP_KEY)
  } catch (error) {
    console.error('Error reading selected proxy group:', error)
    return null
  }
}

const writeSelectedGroup = (name: string) => {
  try {
    localStorage.setItem(SELECTED_GROUP_KEY, name)
  } catch (error) {
    console.error('Error saving selected proxy group:', error)
  }
}

const visibleGroupsOf = (
  groups: ProxyGroupView[] | undefined,
  global: ProxyGroupView | null | undefined,
  mode: string,
): ProxyGroupView[] => {
  if (mode === 'global') return global ? [global] : []
  if (mode !== 'rule' && mode !== 'script') return []
  return (groups ?? []).filter((group) => !group.hidden)
}

interface Props {
  mode: string
}

export const ProxySplitGroups = ({ mode }: Props) => {
  const { t } = useTranslation()
  const { proxyView } = useProxiesData()
  const emptyList = useEmptyRenderList()
  const groups = useMemo(
    () => visibleGroupsOf(proxyView?.groups, proxyView?.global, mode),
    [mode, proxyView],
  )
  const [selectedGroup, setSelectedGroup] = useState<string | null>(
    readSelectedGroup,
  )
  const activeGroup =
    selectedGroup && groups.some((group) => group.name === selectedGroup)
      ? selectedGroup
      : (groups[0]?.name ?? null)

  const handleSelectGroup = useCallback((name: string) => {
    setSelectedGroup(name)
    writeSelectedGroup(name)
  }, [])

  const {
    renderList,
    onHeadState,
    handleCheckAll,
    handleChangeProxy,
    getScrollPosition,
    saveScrollPosition,
  } = useProxyRenderState(mode, false, activeGroup)

  const stickyListRef = useRef<StickyVirtualListHandle>(null)
  const renderFirstRef = useRef(true)
  const isRestoringRef = useRef(false)

  useLayoutEffect(() => {
    renderFirstRef.current = true
  }, [activeGroup])

  useLayoutEffect(() => {
    if (renderList.length === 0) return
    if (!renderFirstRef.current) return
    const node = stickyListRef.current?.getScrollElement()
    if (!node) return

    const savedPosition = getScrollPosition()
    if (!savedPosition) {
      node.scrollTop = 0
      renderFirstRef.current = false
      return
    }

    isRestoringRef.current = true
    let rafId = 0
    let attempts = 0
    const maxAttempts = 30

    const step = () => {
      const el = stickyListRef.current?.getScrollElement()
      if (!el) {
        isRestoringRef.current = false
        return
      }

      el.scrollTop = savedPosition
      attempts += 1

      const reached = Math.abs(el.scrollTop - savedPosition) <= 1
      if (reached || attempts >= maxAttempts) {
        renderFirstRef.current = false
        isRestoringRef.current = false
        return
      }

      rafId = requestAnimationFrame(step)
    }

    rafId = requestAnimationFrame(step)
    return () => {
      cancelAnimationFrame(rafId)
      isRestoringRef.current = false
    }
  }, [activeGroup, getScrollPosition, renderList.length])

  const saveScrollPositionThrottled = useMemo(
    () => throttle(saveScrollPosition, 500),
    [saveScrollPosition],
  )

  const handleScroll = useCallback(
    (event: Event) => {
      if (isRestoringRef.current) return
      const target = event.target as HTMLElement | null
      saveScrollPositionThrottled(target?.scrollTop ?? 0)
    },
    [saveScrollPositionThrottled],
  )

  useEffect(() => {
    const node = stickyListRef.current?.getScrollElement()
    if (!node) return

    const listener = handleScroll as EventListener
    const options: AddEventListenerOptions = { passive: true }
    node.addEventListener('scroll', listener, options)
    return () => {
      node.removeEventListener('scroll', listener, options)
    }
  }, [handleScroll])

  const handleLocation = useStableCallback((group: ProxyGroupView) => {
    const { name, now } = group
    const index = renderList.findIndex(
      (item) =>
        item.group?.name === name &&
        item.type === 2 &&
        item.member?.member.ref.name === now,
    )
    if (index >= 0) {
      stickyListRef.current?.scrollToIndex(index, {
        align: 'center',
        behavior: 'smooth',
      })
    }
  })

  const renderHead = useCallback(
    (item: IRenderItem) => (
      <Box>
        <ProxyRender
          item={item}
          stickyed
          itemLayout="table"
          onLocation={handleLocation}
          onCheckAll={handleCheckAll}
          onHeadState={onHeadState}
          onChangeProxy={handleChangeProxy}
        />
        <div className="proxy-table__head">
          <span>{t('proxies.page.table.name')}</span>
          <span>{t('proxies.page.table.protocol')}</span>
          <span>{t('proxies.page.table.type')}</span>
          <span>{t('proxies.page.table.latency')}</span>
          <span>{t('proxies.page.table.status')}</span>
        </div>
      </Box>
    ),
    [handleChangeProxy, handleCheckAll, handleLocation, onHeadState, t],
  )

  const renderNode = useCallback(
    (item: IRenderItem) => (
      <ProxyRender
        key={item.key}
        item={item}
        itemLayout="table"
        onLocation={handleLocation}
        onCheckAll={handleCheckAll}
        onHeadState={onHeadState}
        onChangeProxy={handleChangeProxy}
      />
    ),
    [handleChangeProxy, handleCheckAll, handleLocation, onHeadState],
  )

  const activeGroupView = groups.find((group) => group.name === activeGroup)
  const records = proxyView?.records ?? {}

  if (groups.length === 0) return emptyList

  return (
    <div className="proxy-split">
      <div className="proxy-split__groups">
        {groups.map((group) => {
          const selected = group.name === activeGroup
          const protocols = collectGroupProtocols(group, records)
          return (
            <button
              key={group.name}
              type="button"
              className="proxy-group-item"
              data-selected={selected}
              onClick={() => handleSelectGroup(group.name)}
            >
              <div className="proxy-group-item__row">
                <span
                  className="proxy-group-item__dot"
                  data-active={selected}
                />
                <span className="proxy-group-item__name">{group.name}</span>
                <span className="proxy-group-item__count">
                  {group.members.length}
                </span>
              </div>
              {protocols.length > 0 && (
                <div className="proxy-group-item__chips">
                  {protocols.map((protocol) => (
                    <span key={protocol} className="proto-chip">
                      {protocol}
                    </span>
                  ))}
                </div>
              )}
            </button>
          )
        })}
      </div>
      <div className="proxy-split__main">
        {activeGroupView && proxyView && (
          <ProxyFeaturedCard
            group={activeGroupView}
            proxyView={proxyView}
            protocols={collectGroupProtocols(activeGroupView, records)}
          />
        )}
        <Box className="proxy-split__nodes">
          <StickyVirtualList
            ref={stickyListRef}
            items={renderList}
            isGroupItem={(item) => item.type === 1}
            getItemKey={(item) => item.key}
            estimateGroupItemHeight={72}
            estimateItemHeight={42}
            renderGroupItem={renderHead}
            renderItem={renderNode}
          />
        </Box>
      </div>
    </div>
  )
}
