import {
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
} from '@mui/material'
import type { ReactNode } from 'react'
import { useMatch, useNavigate, useResolvedPath } from 'react-router'

import type { SortableItemRenderProps } from '@/components/base/sortable-item'
import { useVerge } from '@/hooks/use-verge'

interface Props {
  to: string
  children: string
  icon: ReactNode[]
  sortable?: SortableItemRenderProps
}

export const LayoutItem = (props: Props) => {
  const { to, children, icon, sortable } = props
  const { verge } = useVerge()
  const { menu_icon } = verge ?? {}
  const navCollapsed = verge?.collapse_navbar ?? false
  const resolved = useResolvedPath(to)
  const match = useMatch({ path: resolved.pathname, end: true })
  const navigate = useNavigate()

  const effectiveMenuIcon =
    navCollapsed && menu_icon === 'disable' ? 'monochrome' : menu_icon

  return (
    <ListItem
      ref={sortable?.ref}
      style={sortable?.style}
      disablePadding
      sx={{ px: navCollapsed ? 0 : 0 }}
    >
      <ListItemButton
        ref={sortable?.handleRef}
        selected={!!match}
        sx={{
          minHeight: 32,
          borderRadius: '10px',
          py: 0.55,
          px: 1.1,
          cursor: 'pointer',
          '& .MuiListItemText-primary': {
            color: 'text.primary',
            fontSize: 13,
            fontWeight: 500,
            letterSpacing: '-0.01em',
          },
          '&:hover': {
            bgcolor: 'color-mix(in srgb, var(--selected-row) 80%, transparent)',
          },
          '&.Mui-selected .MuiListItemText-primary': {
            fontWeight: 650,
            color: 'var(--selected-sidebar-fg)',
          },
          '&.Mui-selected .MuiListItemIcon-root': {
            color: 'var(--selected-sidebar-fg)',
          },
          '&.Mui-selected, &.Mui-selected:hover, &.Mui-selected.Mui-focusVisible':
            {
              bgcolor: 'var(--selected-sidebar)',
              color: 'var(--selected-sidebar-fg)',
              boxShadow: 'none',
            },
        }}
        title={navCollapsed ? children : undefined}
        aria-label={navCollapsed ? children : undefined}
        onClick={() => navigate(to)}
      >
        {(effectiveMenuIcon === 'monochrome' || !effectiveMenuIcon) && (
          <ListItemIcon
            sx={{
              color: 'text.secondary',
              minWidth: 28,
              cursor: 'inherit',
            }}
          >
            {icon[0]}
          </ListItemIcon>
        )}
        {effectiveMenuIcon === 'colorful' && (
          <ListItemIcon sx={{ minWidth: 28, cursor: 'inherit' }}>
            {icon[1]}
          </ListItemIcon>
        )}
        {!navCollapsed && (
          <ListItemText
            primary={children}
            slotProps={{ primary: { noWrap: true } }}
          />
        )}
      </ListItemButton>
    </ListItem>
  )
}
