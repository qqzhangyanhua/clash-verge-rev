import {
  AccessTimeRounded,
  NetworkCheckRounded,
  PushPin,
  PushPinOutlined,
  SortByAlphaRounded,
  SortRounded,
} from '@mui/icons-material'
import {
  Box,
  IconButton,
  MenuItem,
  MenuList,
  Paper,
  Tooltip,
  Typography,
} from '@mui/material'
import type { ReactElement } from 'react'
import { useTranslation } from 'react-i18next'

import type { ProxySortType } from '@/components/proxy/use-filter-sort'
import delayManager from '@/services/delay'

import type {
  GroupPickerOption,
  ProxyPickerOption,
} from './current-proxy-card-view'

const PROXY_MENU_MAX_HEIGHT = 500

export const GroupPickerList = ({
  id,
  labelledBy,
  options,
  onSelect,
}: {
  id: string
  labelledBy: string
  options: GroupPickerOption[]
  onSelect: (name: string) => void
}) => (
  <Paper className="current-proxy-card__picker" elevation={0}>
    <MenuList
      id={id}
      role="listbox"
      aria-labelledby={labelledBy}
      autoFocusItem
      variant="selectedMenu"
    >
      {options.map((option) => (
        <MenuItem
          key={option.name}
          role="option"
          aria-selected={option.selected}
          selected={option.selected}
          onClick={() => onSelect(option.name)}
        >
          <Typography noWrap>{option.name}</Typography>
        </MenuItem>
      ))}
    </MenuList>
  </Paper>
)

const sortIcon = (sortType: ProxySortType): ReactElement => {
  switch (sortType) {
    case 1:
      return <AccessTimeRounded fontSize="small" />
    case 2:
      return <SortByAlphaRounded fontSize="small" />
    default:
      return <SortRounded fontSize="small" />
  }
}

const sortTooltipKey = (sortType: ProxySortType): string => {
  switch (sortType) {
    case 1:
      return 'proxies.page.tooltips.sortDelay'
    case 2:
      return 'proxies.page.tooltips.sortName'
    default:
      return 'proxies.page.tooltips.sortDefault'
  }
}

export const ProxyPickerList = ({
  id,
  labelledBy,
  options,
  sortType,
  checkDisabled,
  onSelect,
  onCheckDelay,
  onSortTypeChange,
}: {
  id: string
  labelledBy: string
  options: ProxyPickerOption[]
  sortType: ProxySortType
  checkDisabled: boolean
  onSelect: (value: string) => void
  onCheckDelay: () => void
  onSortTypeChange: () => void
}) => {
  const { t } = useTranslation()

  return (
    <Paper className="current-proxy-card__picker" elevation={0}>
      <Box className="current-proxy-card__picker-toolbar">
        <Tooltip title={t('home.components.currentProxy.actions.refreshDelay')}>
          <span>
            <IconButton
              size="small"
              color="inherit"
              disabled={checkDisabled}
              aria-label={t(
                'home.components.currentProxy.actions.refreshDelay',
              )}
              onClick={onCheckDelay}
            >
              <NetworkCheckRounded fontSize="small" />
            </IconButton>
          </span>
        </Tooltip>
        <Tooltip title={t(sortTooltipKey(sortType))}>
          <IconButton
            size="small"
            color="inherit"
            aria-label={t(sortTooltipKey(sortType))}
            onClick={onSortTypeChange}
          >
            {sortIcon(sortType)}
          </IconButton>
        </Tooltip>
      </Box>
      <MenuList
        id={id}
        role="listbox"
        aria-labelledby={labelledBy}
        autoFocusItem
        variant="selectedMenu"
        sx={{ maxHeight: PROXY_MENU_MAX_HEIGHT - 44, overflow: 'auto' }}
      >
        {options.map((option) => (
          <MenuItem
            key={option.value}
            role="option"
            aria-selected={option.selected}
            selected={option.selected}
            disabled={option.disabled}
            onClick={() => {
              if (!option.disabled) onSelect(option.value)
            }}
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 1,
              pr: 1,
            }}
          >
            {option.pin != null && (
              <Box
                className="current-proxy-card__pin"
                data-pin={option.pin}
                aria-hidden
              >
                {option.pin === 'solid' ? (
                  <PushPin fontSize="small" />
                ) : (
                  <PushPinOutlined fontSize="small" />
                )}
              </Box>
            )}
            <Typography noWrap sx={{ flex: 1, minWidth: 0 }}>
              {option.name}
            </Typography>
            {!option.disabled && (
              <Typography
                className="current-proxy-card__option-delay"
                sx={{
                  color:
                    delayManager.formatDelayColor(option.delay) || undefined,
                }}
              >
                {delayManager.formatDelay(option.delay)}
              </Typography>
            )}
          </MenuItem>
        ))}
      </MenuList>
    </Paper>
  )
}
