import { ChevronRightRounded } from '@mui/icons-material'
import {
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
} from '@mui/material'
import CircularProgress from '@mui/material/CircularProgress'
import { type ReactNode, useState } from 'react'

interface ItemProps {
  label: ReactNode
  extra?: ReactNode
  children?: ReactNode
  secondary?: ReactNode
  onClick?: () => Promise<unknown> | void
}

export const SettingItem = ({
  label,
  extra,
  children,
  secondary,
  onClick,
}: ItemProps) => {
  const clickable = !!onClick

  const primary = (
    <Box sx={{ display: 'flex', alignItems: 'center', fontSize: 13 }}>
      <span>{label}</span>
      {extra ? extra : null}
    </Box>
  )

  const [isLoading, setIsLoading] = useState(false)
  const handleClick = () => {
    if (!onClick) return
    const result = onClick()
    if (result) {
      setIsLoading(true)
      void result.finally(() => setIsLoading(false))
    }
  }

  return clickable ? (
    <ListItem disablePadding>
      <ListItemButton
        onClick={handleClick}
        disabled={isLoading}
        sx={{ py: 0.75 }}
      >
        <ListItemText primary={primary} secondary={secondary} />
        {isLoading ? (
          <CircularProgress color="inherit" size={16} />
        ) : (
          <ChevronRightRounded fontSize="small" />
        )}
      </ListItemButton>
    </ListItem>
  ) : (
    <ListItem sx={{ py: 0.75 }}>
      <ListItemText primary={primary} secondary={secondary} />
      {children}
    </ListItem>
  )
}

export const SettingList = ({
  title,
  children,
}: {
  title: string
  children: ReactNode
}) => (
  <Box className="inset-group-block">
    <Box className="inset-group-block__title">{title}</Box>
    <List className="inset-group-block__list" disablePadding dense>
      {children}
    </List>
  </Box>
)
