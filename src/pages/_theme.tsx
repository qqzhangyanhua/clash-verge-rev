import getSystem from '@/utils/get-system'
const OS = getSystem()

/** Window chrome + inset cards, aligned to Apple grouped surfaces. */
export const lightSurface = {
  background: '#F2F2F7',
  sidebar: '#F2F2F7',
  content: '#FFFFFF',
  paper: '#FFFFFF',
  selectedRow: '#E5E5EA',
  divider: 'rgba(60, 60, 67, 0.12)',
  segmentTrack: 'rgba(0, 0, 0, 0.05)',
  windowBorder: 'rgba(60, 60, 67, 0.18)',
  scrollbarBg: '#F2F2F7',
  scrollbarThumb: '#C7C7CC',
  scrollbarThumbHover: '#AEAEB2',
  switchTrack: '#E9E9EA',
} as const

export const darkSurface = {
  background: '#1C1C1E',
  sidebar: '#1C1C1E',
  content: '#2C2C2E',
  paper: '#2C2C2E',
  selectedRow: '#3A3A3C',
  divider: 'rgba(84, 84, 88, 0.36)',
  segmentTrack: 'rgba(255, 255, 255, 0.08)',
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
  font_family: `-apple-system, BlinkMacSystemFont,"Microsoft YaHei UI", "Microsoft YaHei", Roboto, "Helvetica Neue", Arial, sans-serif, "Apple Color Emoji"${
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
