import { DragDropProvider, KeyboardSensor, PointerSensor } from '@dnd-kit/react'
import type { DragEndEvent } from '@dnd-kit/react'
import { Box, List, Menu, MenuItem } from '@mui/material'
import { useTranslation } from 'react-i18next'

import logoDark from '@/assets/image/icon_dark.svg?url'
import logoLight from '@/assets/image/icon_light.svg?url'
import { SortableItem } from '@/components/base'
import { LayoutItem } from '@/components/layout/layout-item'
import { UpdateButton } from '@/components/layout/update-button'
import { useSystemProxyState } from '@/hooks/use-system-proxy-state'
import { navItems } from '@/pages/_navigation'
import { useProxiesData } from '@/providers/app-data-context'
import { useThemeMode } from '@/services/states'

import { groupNavPaths, NAV_GROUP_LABEL, NAV_GROUP_ORDER } from './nav-groups'

type NavItem = (typeof navItems)[number]

interface SortableNavMenuItemProps {
  item: NavItem
  label: string
  index: number
}

const SortableNavMenuItem = ({
  item,
  label,
  index,
}: SortableNavMenuItemProps) => {
  return (
    <SortableItem id={item.path} index={index}>
      {(sortable) => (
        <LayoutItem to={item.path} icon={item.icon} sortable={sortable}>
          {label}
        </LayoutItem>
      )}
    </SortableItem>
  )
}

type MenuContextPosition = { top: number; left: number }

interface LayoutSidebarProps {
  navCollapsed: boolean
  menuUnlocked: boolean
  menuOrder: string[]
  navItemMap: Map<string, NavItem>
  isDefaultOrder: boolean
  menuContextPosition: MenuContextPosition | null
  onMenuContextMenu: (event: React.MouseEvent<HTMLElement>) => void
  onMenuDragEnd: (event: DragEndEvent) => void
  onMenuContextClose: () => void
  onToggleNavCollapsed: () => void
  onUnlockMenu: () => void
  onLockMenu: () => void
  onResetMenuOrder: () => void
}

const SidebarStatus = () => {
  const { t } = useTranslation()
  const { indicator: systemProxyOn } = useSystemProxyState()
  const { proxyView } = useProxiesData()
  const currentNode =
    proxyView?.groups.find((group) => !group.hidden && group.now)?.now ??
    proxyView?.global?.now ??
    '—'

  return (
    <div className="sidebar-status">
      <div className="sidebar-status__row">
        <span className="sidebar-status__dot" data-on={systemProxyOn} />
        <span className="sidebar-status__label">
          {systemProxyOn
            ? t('layout.components.navigation.status.systemProxyOn')
            : t('layout.components.navigation.status.systemProxyOff')}
        </span>
      </div>
      <div className="sidebar-status__node">{currentNode}</div>
    </div>
  )
}

export const LayoutSidebar = ({
  navCollapsed,
  menuUnlocked,
  menuOrder,
  navItemMap,
  isDefaultOrder,
  menuContextPosition,
  onMenuContextMenu,
  onMenuDragEnd,
  onMenuContextClose,
  onToggleNavCollapsed,
  onUnlockMenu,
  onLockMenu,
  onResetMenuOrder,
}: LayoutSidebarProps) => {
  const { t } = useTranslation()
  const mode = useThemeMode()
  const { grouped, system } = groupNavPaths(menuOrder)
  const showGroups = !menuUnlocked && !navCollapsed

  const renderItem = (path: string) => {
    const item = navItemMap.get(path)
    if (!item) return null
    if (menuUnlocked) {
      return (
        <SortableNavMenuItem
          key={item.path}
          item={item}
          label={t(item.label)}
          index={menuOrder.indexOf(path)}
        />
      )
    }
    return (
      <LayoutItem key={item.path} to={item.path} icon={item.icon}>
        {t(item.label)}
      </LayoutItem>
    )
  }

  const menuItems = showGroups ? (
    <>
      {NAV_GROUP_ORDER.map((groupId) => {
        const paths = grouped[groupId]
        if (paths.length === 0) return null
        return (
          <div key={groupId} className="nav-group">
            <div className="nav-group__label">
              {t(NAV_GROUP_LABEL[groupId])}
            </div>
            {paths.map(renderItem)}
          </div>
        )
      })}
      {system.length > 0 && (
        <div className="nav-group">{system.map(renderItem)}</div>
      )}
    </>
  ) : (
    menuOrder.map(renderItem)
  )

  return (
    <div className="layout-content__left">
      <div className="the-logo">
        <div className="the-brand">
          <img
            className="the-brand__mark"
            src={mode === 'light' ? logoLight : logoDark}
            alt=""
          />
          <div className="the-brand__text">
            <div className="the-brand__name">Clash ZYH</div>
            <div className="the-brand__subtitle">
              {t('layout.components.navigation.brand.subtitle')}
            </div>
          </div>
          <UpdateButton className="the-newbtn" />
        </div>
      </div>

      {menuUnlocked && (
        <Box
          className="the-reorder-hint"
          sx={(theme) => ({
            px: 1.5,
            py: 0.75,
            mx: 1,
            mb: 1,
            borderRadius: 1,
            fontSize: 12,
            fontWeight: 600,
            textAlign: 'center',
            color: theme.palette.warning.contrastText,
            bgcolor:
              theme.palette.mode === 'light'
                ? theme.palette.warning.main
                : theme.palette.warning.dark,
          })}
        >
          {t('layout.components.navigation.menu.reorderMode')}
        </Box>
      )}

      {menuUnlocked ? (
        <List
          className="the-menu"
          dense
          disablePadding
          onContextMenu={onMenuContextMenu}
        >
          <DragDropProvider
            sensors={[PointerSensor, KeyboardSensor]}
            onDragEnd={onMenuDragEnd}
          >
            {menuItems}
          </DragDropProvider>
        </List>
      ) : (
        <List
          className="the-menu"
          dense
          disablePadding
          onContextMenu={onMenuContextMenu}
        >
          {menuItems}
        </List>
      )}

      {!navCollapsed && <SidebarStatus />}

      <Menu
        open={Boolean(menuContextPosition)}
        onClose={onMenuContextClose}
        anchorReference="anchorPosition"
        anchorPosition={
          menuContextPosition
            ? {
                top: menuContextPosition.top,
                left: menuContextPosition.left,
              }
            : undefined
        }
        transitionDuration={200}
        slotProps={{
          list: {
            sx: { py: 0.5 },
          },
        }}
      >
        <MenuItem onClick={onToggleNavCollapsed} dense>
          {navCollapsed
            ? t('layout.components.navigation.menu.expandNavBar')
            : t('layout.components.navigation.menu.collapseNavBar')}
        </MenuItem>
        <MenuItem onClick={menuUnlocked ? onLockMenu : onUnlockMenu} dense>
          {menuUnlocked
            ? t('layout.components.navigation.menu.lock')
            : t('layout.components.navigation.menu.unlock')}
        </MenuItem>
        <MenuItem onClick={onResetMenuOrder} dense disabled={isDefaultOrder}>
          {t('layout.components.navigation.menu.restoreDefaultOrder')}
        </MenuItem>
      </Menu>
    </div>
  )
}
