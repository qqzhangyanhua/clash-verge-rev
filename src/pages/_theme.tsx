import getSystem from '@/utils/get-system'
const OS = getSystem()

/** Window chrome + inset cards, tuned for native macOS Settings / Mail. */
export const lightSurface = {
  background: '#F5F5F7',
  sidebar: '#E8E8ED',
  content: '#FFFFFF',
  paper: '#FFFFFF',
  selectedRow: '#E5E5EA',
  selectedSidebar: '#D8D8DC',
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
} as const

export const darkSurface = {
  background: '#1C1C1E',
  sidebar: '#161618',
  content: '#2C2C2E',
  paper: '#2C2C2E',
  selectedRow: '#3A3A3C',
  selectedSidebar: '#2C2C2E',
  divider: 'rgba(84, 84, 88, 0.32)',
  segmentTrack: 'rgba(255, 255, 255, 0.1)',
  segmentSelectedShadow:
    '0 0.5px 1px rgba(0, 0, 0, 0.45), 0 0 0 0.5px rgba(255, 255, 255, 0.06)',
  cardShadow: 'none',
  windowBorder: 'rgba(84, 84, 88, 0.48)',
  scrollbarBg: '#1C1C1E',
  scrollbarThumb: '#636366',
  scrollbarThumbHover: '#8E8E93',
  switchTrack: '#39393D',
} as const

// default theme setting
export const defaultTheme = {
  primary_color: '#007AFF',
  secondary_color: '#FC9B76',
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
  primary_color: '#0A84FF',
  secondary_color: '#FF9F0A',
  primary_text: '#F5F5F7',
  background_color: darkSurface.background,
  secondary_text: '#EBEBF599',
  info_color: '#0A84FF',
  error_color: '#FF453A',
  warning_color: '#FF9F0A',
  success_color: '#30D158',
}
