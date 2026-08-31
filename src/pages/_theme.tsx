import getSystem from '@/utils/get-system'
const OS = getSystem()

/** Window chrome + inset cards. Light stays grouped/native; dark follows the navy glass system. */
export const lightSurface = {
  background: '#F5F5F7',
  sidebar: '#E8E8ED',
  content: '#FFFFFF',
  paper: '#FFFFFF',
  selectedRow: 'rgba(0, 122, 255, 0.1)',
  selectedSidebar: 'rgba(0, 122, 255, 0.14)',
  selectedSidebarFg: '#007AFF',
  divider: 'rgba(60, 60, 67, 0.1)',
  segmentTrack: 'rgba(0, 0, 0, 0.06)',
  segmentSelectedShadow:
    '0 0.5px 1px rgba(0, 0, 0, 0.12), 0 0 0 0.5px rgba(0, 0, 0, 0.04)',
  cardShadow: '0 0.5px 0 rgba(0, 0, 0, 0.04), 0 1px 2px rgba(0, 0, 0, 0.04)',
  windowBorder: 'rgba(60, 60, 67, 0.16)',
  scrollbarBg: '#F5F5F7',
  scrollbarThumb: '#C7C7CC',
  scrollbarThumbHover: '#AEAEB2',
  switchTrack: '#E9E9EA',
  glassBg: 'rgba(255, 255, 255, 0.88)',
  glassBorder: 'rgba(60, 60, 67, 0.08)',
  selectionGlow:
    '0 0 0 1px rgba(0, 122, 255, 0.2), 0 0 12px rgba(0, 122, 255, 0.12)',
  trafficUp: '#A855F7',
  trafficDown: '#EC4899',
} as const

export const darkSurface = {
  background: '#12141D',
  sidebar: '#0C0E16',
  content: '#181C28',
  paper: '#1A1E2C',
  selectedRow: 'rgba(59, 130, 246, 0.16)',
  selectedSidebar: '#3B82F6',
  selectedSidebarFg: '#FFFFFF',
  divider: 'rgba(148, 163, 184, 0.12)',
  segmentTrack: 'rgba(255, 255, 255, 0.06)',
  segmentSelectedShadow:
    '0 0 0 1px rgba(59, 130, 246, 0.45), 0 0 18px rgba(59, 130, 246, 0.28)',
  cardShadow:
    '0 0 0 1px rgba(148, 163, 184, 0.08), 0 12px 40px rgba(0, 0, 0, 0.35)',
  windowBorder: 'rgba(148, 163, 184, 0.14)',
  scrollbarBg: '#12141D',
  scrollbarThumb: '#3A4158',
  scrollbarThumbHover: '#5B6480',
  switchTrack: '#2A3044',
  glassBg: 'rgba(24, 28, 40, 0.72)',
  glassBorder: 'rgba(148, 163, 184, 0.12)',
  selectionGlow:
    '0 0 0 1px rgba(59, 130, 246, 0.35), 0 0 16px rgba(59, 130, 246, 0.22)',
  trafficUp: '#C084FC',
  trafficDown: '#F472B6',
} as const

// default theme setting
export const defaultTheme = {
  primary_color: '#007AFF',
  secondary_color: '#A855F7',
  primary_text: '#1D1D1F',
  secondary_text: '#3C3C4399',
  info_color: '#007AFF',
  error_color: '#FF3B30',
  warning_color: '#FF9500',
  success_color: '#34C759',
  background_color: lightSurface.background,
  font_family: `-apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei UI", "Microsoft YaHei", "Helvetica Neue", Arial, sans-serif, "Apple Color Emoji"${
    OS === 'windows' ? ', twemoji mozilla' : ''
  }`,
}

// dark mode
export const defaultDarkTheme = {
  ...defaultTheme,
  primary_color: '#3B82F6',
  secondary_color: '#A855F7',
  primary_text: '#F8FAFC',
  background_color: darkSurface.background,
  secondary_text: '#94A3B8CC',
  info_color: '#3B82F6',
  error_color: '#F43F5E',
  warning_color: '#F59E0B',
  success_color: '#22C55E',
}
