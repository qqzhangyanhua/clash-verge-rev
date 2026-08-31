import getSystem from '@/utils/get-system'
const OS = getSystem()

/** Surge-like Activity surfaces. Light is the default; dark stays graphite and quiet. */
export const lightSurface = {
  background: '#F2F2F7',
  sidebar: '#EBEBF0',
  content: '#FFFFFF',
  paper: '#FFFFFF',
  selectedRow: 'rgba(0, 0, 0, 0.05)',
  selectedSidebar: 'rgba(0, 0, 0, 0.07)',
  selectedSidebarFg: '#1D1D1F',
  divider: 'rgba(60, 60, 67, 0.1)',
  segmentTrack: 'rgba(0, 0, 0, 0.06)',
  segmentSelectedShadow:
    '0 0.5px 1px rgba(0, 0, 0, 0.08), 0 0 0 0.5px rgba(0, 0, 0, 0.04)',
  cardShadow: '0 1px 2px rgba(0, 0, 0, 0.04), 0 8px 24px rgba(0, 0, 0, 0.04)',
  windowBorder: 'rgba(60, 60, 67, 0.12)',
  scrollbarBg: '#F2F2F7',
  scrollbarThumb: '#C7C7CC',
  scrollbarThumbHover: '#AEAEB2',
  switchTrack: '#E9E9EA',
  glassBg: 'rgba(255, 255, 255, 0.94)',
  glassBorder: 'rgba(60, 60, 67, 0.08)',
  selectionGlow: 'none',
  trafficUp: '#5856D6',
  trafficDown: '#007AFF',
} as const

export const darkSurface = {
  background: '#1C1C1E',
  sidebar: '#2C2C2E',
  content: '#2C2C2E',
  paper: '#2C2C2E',
  selectedRow: 'rgba(255, 255, 255, 0.08)',
  selectedSidebar: 'rgba(255, 255, 255, 0.1)',
  selectedSidebarFg: '#F5F5F7',
  divider: 'rgba(235, 235, 245, 0.1)',
  segmentTrack: 'rgba(255, 255, 255, 0.08)',
  segmentSelectedShadow: '0 0.5px 1px rgba(0, 0, 0, 0.35)',
  cardShadow:
    '0 1px 0 rgba(255, 255, 255, 0.04), 0 8px 24px rgba(0, 0, 0, 0.28)',
  windowBorder: 'rgba(235, 235, 245, 0.12)',
  scrollbarBg: '#1C1C1E',
  scrollbarThumb: '#636366',
  scrollbarThumbHover: '#8E8E93',
  switchTrack: '#3A3A3C',
  glassBg: 'rgba(44, 44, 46, 0.94)',
  glassBorder: 'rgba(235, 235, 245, 0.08)',
  selectionGlow: 'none',
  trafficUp: '#7D7AFF',
  trafficDown: '#0A84FF',
} as const

export const defaultTheme = {
  primary_color: '#007AFF',
  secondary_color: '#5856D6',
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

export const defaultDarkTheme = {
  ...defaultTheme,
  primary_color: '#0A84FF',
  secondary_color: '#7D7AFF',
  primary_text: '#F5F5F7',
  background_color: darkSurface.background,
  secondary_text: '#EBEBF599',
  info_color: '#0A84FF',
  error_color: '#FF453A',
  warning_color: '#FF9F0A',
  success_color: '#30D158',
}
