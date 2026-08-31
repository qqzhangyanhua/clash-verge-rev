import type { TranslationKey } from '@/types/generated/i18n-keys'

export const NAV_GROUP_ORDER = ['overview', 'network', 'monitor'] as const

export type NavGroupId = (typeof NAV_GROUP_ORDER)[number]

const NAV_GROUP_BY_PATH: Record<string, NavGroupId | 'system'> = {
  '/': 'overview',
  '/proxies': 'network',
  '/profile': 'network',
  '/connections': 'network',
  '/rules': 'network',
  '/logs': 'monitor',
  '/unlock': 'monitor',
  '/settings': 'system',
}

export const NAV_GROUP_LABEL: Record<NavGroupId, TranslationKey> = {
  overview: 'layout.components.navigation.groups.overview',
  network: 'layout.components.navigation.groups.network',
  monitor: 'layout.components.navigation.groups.monitor',
}

export const groupNavPaths = (menuOrder: readonly string[]) => {
  const grouped: Record<NavGroupId, string[]> = {
    overview: [],
    network: [],
    monitor: [],
  }
  const system: string[] = []

  for (const path of menuOrder) {
    const group = NAV_GROUP_BY_PATH[path] ?? 'system'
    if (group === 'system') {
      system.push(path)
    } else {
      grouped[group].push(path)
    }
  }

  return { grouped, system }
}
