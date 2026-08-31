/* eslint-disable @eslint-react/set-state-in-effect */
import { useLockFn } from 'ahooks'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

import type { ProxySortType } from '@/components/proxy/use-filter-sort'
import { useGroupDelays } from '@/hooks/use-group-delays'
import { useProfiles } from '@/hooks/use-profiles'
import { useProxySelection } from '@/hooks/use-proxy-selection'
import { useVerge } from '@/hooks/use-verge'
import {
  useAppRefreshers,
  useClashConfigData,
  useCoreDataStatus,
  useProxiesData,
} from '@/providers/app-data-context'
import delayManager from '@/services/delay'
import {
  isInteractableMember,
  resolveMember,
  type ResolvedProxyMember,
} from '@/types/proxy-view'
import { debugLog } from '@/utils/debug'

import {
  buildCurrentProxyCardModel,
  listSelectableGroups,
  nextProxySortType,
  rememberMeasuredDelay,
  resolveCardSelection,
  type ClashProxyMode,
  type CurrentProxyCardModel,
} from './current-proxy-card-view'
import { useProfileScopedStorage } from './use-profile-scoped-storage'

const STORAGE_KEY_GROUP = 'clash-verge-selected-proxy-group'
const STORAGE_KEY_SORT_TYPE = 'clash-verge-proxy-sort-type'

const AUTO_CHECK_DEFAULT_INTERVAL_MINUTES = 5
const AUTO_CHECK_INITIAL_DELAY_MS = 100

const toClashMode = (value: string | undefined): ClashProxyMode => {
  const mode = value?.toLowerCase()
  if (mode === 'global' || mode === 'direct') return mode
  return 'rule'
}

export const useCurrentProxyCard = () => {
  const { t } = useTranslation()
  const { proxyView } = useProxiesData()
  const { clashConfig } = useClashConfigData()
  const { refreshProxy } = useAppRefreshers()
  const { isCoreDataPending } = useCoreDataStatus()
  const { verge } = useVerge()
  const { current: currentProfile } = useProfiles()
  const autoDelayEnabled = verge?.enable_auto_delay_detection ?? false
  const defaultLatencyTimeout = verge?.default_latency_timeout
  const autoDelayIntervalMs = useMemo(() => {
    const rawInterval = verge?.auto_delay_detection_interval_minutes
    const intervalMinutes =
      typeof rawInterval === 'number' && rawInterval > 0
        ? rawInterval
        : AUTO_CHECK_DEFAULT_INTERVAL_MINUTES
    return Math.max(1, Math.round(intervalMinutes)) * 60 * 1000
  }, [verge?.auto_delay_detection_interval_minutes])
  const currentProfileId = currentProfile?.uid || null
  const { readProfileScopedItem, writeProfileScopedItem } =
    useProfileScopedStorage(currentProfileId)

  const { handleSelectChange } = useProxySelection({
    onSuccess: () => {
      refreshProxy()
    },
    onError: (error) => {
      console.error('代理切换失败', error)
      refreshProxy()
    },
  })

  const mode = toClashMode(clashConfig?.mode)
  const isGlobalMode = mode === 'global'
  const isDirectMode = mode === 'direct'

  const [sortType, setSortType] = useState<ProxySortType>(() => {
    const savedSortType = localStorage.getItem(STORAGE_KEY_SORT_TYPE)
    return savedSortType ? (Number(savedSortType) as ProxySortType) : 0
  })

  const [selectedGroupName, setSelectedGroupName] = useState('')
  const [openSelect, setOpenSelect] = useState<'group' | 'proxy' | null>(null)
  const delays = useGroupDelays(selectedGroupName || null)

  const autoCheckInProgressRef = useRef(false)
  const latestTimeoutRef = useRef<number>(
    verge?.default_latency_timeout || 10000,
  )
  const latestProxyMemberRef = useRef<ResolvedProxyMember | null>(null)
  const lastMeasuredRef = useRef<{ key: string; delay: number | null }>({
    key: '',
    delay: null,
  })
  const groupRowRef = useRef<HTMLButtonElement>(null)
  const proxyRowRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    latestTimeoutRef.current = verge?.default_latency_timeout || 10000
  }, [verge?.default_latency_timeout])

  const resolvedProxyView = proxyView ?? null
  const selectableGroups = useMemo(
    () => listSelectableGroups(resolvedProxyView),
    [resolvedProxyView],
  )

  useEffect(() => {
    if (!resolvedProxyView) return
    if (isDirectMode) {
      setSelectedGroupName('DIRECT')
      return
    }
    if (isGlobalMode) {
      setSelectedGroupName(resolvedProxyView.global?.name ?? 'GLOBAL')
      return
    }

    const savedGroup = readProfileScopedItem(STORAGE_KEY_GROUP)
    const primaryKeywords = ['auto', 'select', 'proxy', '节点选择', '自动选择']
    const primaryGroup =
      selectableGroups.find((group) =>
        primaryKeywords.some((keyword) =>
          group.name.toLowerCase().includes(keyword.toLowerCase()),
        ),
      ) ?? selectableGroups[0]
    const nextGroup = selectableGroups.some(
      ({ name }) => name === selectedGroupName,
    )
      ? selectedGroupName
      : selectableGroups.some(({ name }) => name === savedGroup)
        ? savedGroup
        : (primaryGroup?.name ?? '')
    if (nextGroup && nextGroup !== selectedGroupName) {
      setSelectedGroupName(nextGroup)
      writeProfileScopedItem(STORAGE_KEY_GROUP, nextGroup)
    }
  }, [
    isDirectMode,
    isGlobalMode,
    resolvedProxyView,
    readProfileScopedItem,
    selectableGroups,
    selectedGroupName,
    writeProfileScopedItem,
  ])

  const { currentMember } = resolveCardSelection(
    mode,
    resolvedProxyView,
    selectedGroupName,
  )
  const selectedProxyName = currentMember?.ref.name ?? ''
  latestProxyMemberRef.current = currentMember

  const rawDelay =
    currentMember && selectedGroupName ? delays.of(currentMember) : -1
  const delayKey = `${selectedGroupName}:${selectedProxyName}`
  const lastMeasuredDelay = rememberMeasuredDelay(
    delayKey,
    lastMeasuredRef.current.key,
    lastMeasuredRef.current.delay,
    rawDelay,
    defaultLatencyTimeout,
  )
  lastMeasuredRef.current = { key: delayKey, delay: lastMeasuredDelay }

  const model: CurrentProxyCardModel = buildCurrentProxyCardModel({
    mode,
    proxyView: resolvedProxyView,
    isLoading: isCoreDataPending,
    selectedGroupName,
    sortType,
    openPicker: openSelect,
    delayOf: delays.of,
    lastMeasuredDelay,
    latencyTimeout: defaultLatencyTimeout,
    labels: {
      headerTitle: t('home.components.currentProxy.title'),
      groupLabel: t('home.components.currentProxy.labels.group'),
      proxyLabel: t('home.components.currentProxy.labels.proxy'),
    },
  })

  const handleGroupChange = useCallback(
    (name: string) => {
      if (isGlobalMode || isDirectMode) return
      setSelectedGroupName(name)
      writeProfileScopedItem(STORAGE_KEY_GROUP, name)
      setOpenSelect(null)
    },
    [isDirectMode, isGlobalMode, writeProfileScopedItem],
  )

  const handleProxyChange = useCallback(
    (value: string) => {
      if (isDirectMode) return
      const option = model.proxyOptions.find(
        (candidate) => candidate.value === value,
      )
      if (!model.selectedGroup || !option || option.disabled) {
        return
      }
      handleSelectChange(
        model.selectedGroup.name,
        model.selectedGroup.now,
        model.selectedGroup.fixed,
      )({
        target: { value: option.name },
      })
      setOpenSelect(null)
    },
    [handleSelectChange, isDirectMode, model.proxyOptions, model.selectedGroup],
  )

  const checkCurrentProxyDelay = useCallback(async () => {
    if (autoCheckInProgressRef.current) return
    if (isDirectMode) return

    const groupName = selectedGroupName
    const proxyName = selectedProxyName
    if (!groupName || !proxyName) return

    const proxyMember = latestProxyMemberRef.current
    if (!proxyMember || !isInteractableMember(proxyMember)) {
      debugLog(
        `[CurrentProxyCard] 自动延迟检测跳过，组: ${groupName}, 节点: ${proxyName} 未找到`,
      )
      return
    }

    autoCheckInProgressRef.current = true
    const timeout = latestTimeoutRef.current || 10000

    try {
      debugLog(
        `[CurrentProxyCard] 自动检测当前节点延迟，组: ${groupName}, 节点: ${proxyName}`,
      )
      await delayManager.checkDelay(proxyMember, groupName, timeout)
    } catch (error) {
      console.error(
        `[CurrentProxyCard] 自动检测当前节点延迟失败，组: ${groupName}, 节点: ${proxyName}`,
        error,
      )
    } finally {
      autoCheckInProgressRef.current = false
      refreshProxy()
    }
  }, [isDirectMode, refreshProxy, selectedGroupName, selectedProxyName])

  useEffect(() => {
    if (isDirectMode) return
    if (!autoDelayEnabled) return
    if (!selectedGroupName || !selectedProxyName) return

    let disposed = false
    let intervalTimer: ReturnType<typeof setTimeout> | null = null
    let initialTimer: ReturnType<typeof setTimeout> | null = null

    const runAndSchedule = async () => {
      if (disposed) return
      await checkCurrentProxyDelay()
      if (disposed) return
      intervalTimer = setTimeout(runAndSchedule, autoDelayIntervalMs)
    }

    initialTimer = setTimeout(async () => {
      await checkCurrentProxyDelay()
      if (disposed) return
      intervalTimer = setTimeout(runAndSchedule, autoDelayIntervalMs)
    }, AUTO_CHECK_INITIAL_DELAY_MS)

    return () => {
      disposed = true
      if (initialTimer) clearTimeout(initialTimer)
      if (intervalTimer) clearTimeout(intervalTimer)
    }
  }, [
    checkCurrentProxyDelay,
    autoDelayIntervalMs,
    isDirectMode,
    selectedGroupName,
    selectedProxyName,
    autoDelayEnabled,
  ])

  const handleSortTypeChange = useCallback(() => {
    const newSortType = nextProxySortType(sortType)
    setSortType(newSortType)
    localStorage.setItem(STORAGE_KEY_SORT_TYPE, newSortType.toString())
  }, [sortType])

  const handleCheckDelay = useLockFn(async () => {
    const groupName = selectedGroupName
    if (!groupName || isDirectMode || !proxyView || !model.selectedGroup) return

    debugLog(`[CurrentProxyCard] 开始测试所有延迟，组: ${groupName}`)
    const timeout = verge?.default_latency_timeout || 10000
    const interactable = model.selectedGroup.members
      .map((memberRef) => resolveMember(proxyView, memberRef))
      .filter(isInteractableMember)
      .filter(({ ref }) => ref.name !== 'DIRECT' && ref.name !== 'REJECT')

    if (interactable.length > 0) {
      const url = delayManager.getUrl(groupName)
      debugLog(`[CurrentProxyCard] 测试URL: ${url}, 超时: ${timeout}ms`)

      try {
        await delayManager.checkListDelay(interactable, groupName, timeout)
        debugLog(`[CurrentProxyCard] 延迟测试完成，组: ${groupName}`)
      } catch (error) {
        console.error(
          `[CurrentProxyCard] 延迟测试出错，组: ${groupName}`,
          error,
        )
      }
    }

    refreshProxy()
  })

  const togglePicker = useCallback(
    (picker: 'group' | 'proxy') => {
      const tappable =
        picker === 'group'
          ? model.view.groupRow.tappable
          : model.view.proxyRow.tappable
      if (!tappable) return
      setOpenSelect((current) => (current === picker ? null : picker))
    },
    [model.view.groupRow.tappable, model.view.proxyRow.tappable],
  )

  const closePicker = useCallback(
    (restoreFocus = false) => {
      const current = openSelect
      setOpenSelect(null)
      if (!restoreFocus) return
      if (current === 'group') {
        groupRowRef.current?.focus()
      } else if (current === 'proxy') {
        proxyRowRef.current?.focus()
      }
    },
    [openSelect],
  )

  useEffect(() => {
    if (openSelect == null) return

    const closeFromKeyboard = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      event.preventDefault()
      closePicker(true)
    }
    document.addEventListener('keydown', closeFromKeyboard)
    return () => document.removeEventListener('keydown', closeFromKeyboard)
  }, [closePicker, openSelect])

  return {
    model,
    sortType,
    groupRowRef,
    proxyRowRef,
    checkDelayDisabled:
      isDirectMode ||
      model.proxyOptions.filter((option) => !option.disabled).length === 0,
    togglePicker,
    closePicker,
    handleGroupChange,
    handleProxyChange,
    handleCheckDelay,
    handleSortTypeChange,
  }
}

export type CurrentProxyCardController = ReturnType<typeof useCurrentProxyCard>
