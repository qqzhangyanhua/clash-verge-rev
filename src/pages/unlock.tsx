import {
  AccessTimeOutlined,
  CancelOutlined,
  CheckCircleOutlined,
  HelpOutlined,
  PendingOutlined,
  RefreshRounded,
} from '@mui/icons-material'
import { Box, Button, CircularProgress } from '@mui/material'
import { Channel, invoke } from '@tauri-apps/api/core'
import { useLockFn } from 'ahooks'
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { BaseEmpty, BasePage } from '@/components/base'
import {
  UnlockResultRow,
  type UnlockStatusColor,
} from '@/components/test/unlock-result-row'
import { showNotice } from '@/services/notice-service'
import type { TranslationKey } from '@/types/generated/i18n-keys'

interface UnlockItem {
  name: string
  status: string
  region?: string | null
  check_time?: string | null
}

const UNLOCK_RESULTS_STORAGE_KEY = 'clash_verge_unlock_results'

const STATUS_LABEL_KEYS: Record<string, TranslationKey> = {
  Pending: 'tests.statuses.test.pending',
  Yes: 'tests.statuses.test.yes',
  No: 'tests.statuses.test.no',
  Failed: 'tests.statuses.test.failed',
  Completed: 'tests.statuses.test.completed',
  'Disallowed ISP': 'tests.statuses.test.disallowedIsp',
  'Originals Only': 'tests.statuses.test.originalsOnly',
  'No (IP Banned By Disney+)': 'tests.statuses.test.noDisney',
  'Unsupported Country/Region': 'tests.statuses.test.unsupportedRegion',
  'Failed (Network Connection)': 'tests.statuses.test.failedNetwork',
}

const normalizeUnlockName = (name: string | undefined) =>
  (name ?? '').trim().toLowerCase()

const getStatusLabel = (
  status: string,
  translate: (key: TranslationKey) => string,
) => {
  const key = STATUS_LABEL_KEYS[status]
  return key ? translate(key) : status
}

const getStatusPriority = (status: string) => (status === 'Pending' ? 0 : 1)
const mergeOptionalFields = (preferred: UnlockItem, fallback: UnlockItem) => ({
  ...preferred,
  region: preferred.region ?? fallback.region,
  check_time: preferred.check_time ?? fallback.check_time,
})

const dedupeUnlockItems = (items: UnlockItem[]) => {
  const map = new Map<string, UnlockItem>()

  items.forEach((item) => {
    const key = normalizeUnlockName(item.name)
    const existing = map.get(key)

    if (!existing) {
      map.set(key, item)
      return
    }

    const existingPriority = getStatusPriority(existing.status)
    const itemPriority = getStatusPriority(item.status)

    if (itemPriority > existingPriority) {
      map.set(key, mergeOptionalFields(item, existing))
      return
    }

    if (itemPriority < existingPriority) {
      map.set(key, mergeOptionalFields(existing, item))
      return
    }

    map.set(key, mergeOptionalFields(item, existing))
  })

  return Array.from(map.values())
}

const UnlockPage = () => {
  const { t } = useTranslation()
  const [unlockItems, setUnlockItems] = useState<UnlockItem[]>([])
  const unlockItemsRef = useRef<UnlockItem[]>([])
  const [isCheckingAll, setIsCheckingAll] = useState(false)
  const [loadingItems, setLoadingItems] = useState<string[]>([])

  const saveResultsToStorage = (items: UnlockItem[]) => {
    try {
      localStorage.setItem(UNLOCK_RESULTS_STORAGE_KEY, JSON.stringify(items))
    } catch (err) {
      console.error('Failed to save results to storage:', err)
    }
  }

  useEffect(() => {
    let storedItems: UnlockItem[] = []
    try {
      const itemsJson = localStorage.getItem(UNLOCK_RESULTS_STORAGE_KEY)
      if (itemsJson) {
        storedItems = dedupeUnlockItems(JSON.parse(itemsJson) as UnlockItem[])
      }
    } catch (err) {
      console.error('Failed to load results from storage:', err)
    }

    void (async () => {
      try {
        const defaultItems = await invoke<UnlockItem[]>('get_unlock_items')
        const existingMap = new Map(
          storedItems.map((item) => [normalizeUnlockName(item.name), item]),
        )
        const mergedItems = defaultItems.map((item) => {
          const matchedItem = existingMap.get(normalizeUnlockName(item.name))
          return matchedItem ? { ...matchedItem, name: item.name } : item
        })

        const sortedItems = mergedItems.sort((a, b) =>
          a.name.localeCompare(b.name),
        )
        unlockItemsRef.current = sortedItems
        setUnlockItems(sortedItems)
      } catch (err: any) {
        console.error('Failed to get unlock items:', err)
      }
    })()
  }, [])

  // 执行全部项目检测
  const checkAllMedia = useLockFn(async () => {
    const onComplete = new Channel<UnlockItem>((result) => {
      const updatedItems = unlockItemsRef.current.map((item) =>
        item.name === result.name ? result : item,
      )
      unlockItemsRef.current = updatedItems
      setUnlockItems(updatedItems)
      setLoadingItems((items) => items.filter((name) => name !== result.name))
    })

    try {
      setIsCheckingAll(true)
      setLoadingItems(unlockItems.map((item) => item.name))
      const result = await invoke<UnlockItem[]>('check_media_unlock', {
        onComplete,
      })
      const sortedItems = result.sort((a, b) => a.name.localeCompare(b.name))

      unlockItemsRef.current = sortedItems
      setUnlockItems(sortedItems)
      saveResultsToStorage(sortedItems)
    } catch (err: any) {
      showNotice.error('tests.unlock.page.messages.detectionTimeout', err)
      console.error('Failed to check media unlock:', err)
    } finally {
      setLoadingItems([])
      setIsCheckingAll(false)
    }
  })

  // 检测单个流媒体服务
  const checkSingleMedia = async (name: string) => {
    setLoadingItems((items) => [...items, name])
    try {
      const result = await invoke<UnlockItem>('check_media_unlock_item', {
        name,
      })
      const updatedItems = unlockItemsRef.current.map((item) =>
        item.name === name ? result : item,
      )

      unlockItemsRef.current = updatedItems
      setUnlockItems(updatedItems)
      saveResultsToStorage(updatedItems)
    } catch (err: any) {
      showNotice.error(
        'tests.unlock.page.messages.detectionFailedWithName',
        { name },
        err,
      )
      console.error(`Failed to check ${name}:`, err)
    } finally {
      setLoadingItems((items) => items.filter((item) => item !== name))
    }
  }

  // 状态颜色
  const getStatusColor = (status: string): UnlockStatusColor => {
    if (status === 'Pending') return 'default'
    if (status === 'Yes') return 'success'
    if (status === 'No') return 'error'
    if (status === 'Soon') return 'warning'
    if (status.includes('Failed')) return 'error'
    if (status === 'Completed') return 'info'
    if (
      status === 'Disallowed ISP' ||
      status === 'Blocked' ||
      status === 'Unsupported Country/Region'
    ) {
      return 'error'
    }
    return 'default'
  }

  // 状态图标
  const getStatusIcon = (status: string) => {
    if (status === 'Pending') return <PendingOutlined />
    if (status === 'Yes') return <CheckCircleOutlined />
    if (status === 'No') return <CancelOutlined />
    if (status === 'Soon') return <AccessTimeOutlined />
    return <HelpOutlined />
  }

  return (
    <BasePage
      title={t('tests.unlock.page.title')}
      header={
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Button
            variant="text"
            size="small"
            disabled={
              unlockItems.length === 0 ||
              isCheckingAll ||
              loadingItems.length > 0
            }
            onClick={checkAllMedia}
            startIcon={
              isCheckingAll ? (
                <CircularProgress size={16} color="inherit" />
              ) : (
                <RefreshRounded />
              )
            }
          >
            {isCheckingAll
              ? t('tests.unlock.page.actions.testing')
              : t('tests.page.actions.testAll')}
          </Button>
        </Box>
      }
    >
      {unlockItems.length === 0 ? (
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '50%',
          }}
        >
          <BaseEmpty textKey="tests.unlock.page.empty" />
        </Box>
      ) : (
        <Box className="unlock-grid">
          {unlockItems.map((item) => (
            <UnlockResultRow
              key={item.name}
              item={item}
              loading={loadingItems.includes(item.name)}
              disabled={loadingItems.includes(item.name) || isCheckingAll}
              statusLabel={getStatusLabel(item.status, t)}
              statusColor={getStatusColor(item.status)}
              statusIcon={getStatusIcon(item.status)}
              onTest={checkSingleMedia}
            />
          ))}
        </Box>
      )}
    </BasePage>
  )
}

export default UnlockPage
